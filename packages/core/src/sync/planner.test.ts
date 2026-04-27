import { chmod, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { runCommand } from '../bridges/process.js';
import { scaffoldOrgRepository } from '../services/scaffold.js';
import { ensureDirectory, removePath } from '../utils/fs.js';
import {
  connectMachine,
  disconnectMachine,
  explainPlan,
  readStatus,
  syncMachine,
} from './planner.js';

describe('planner', () => {
  const temporaryPaths: string[] = [];
  const originalPath = process.env.PATH;

  afterEach(async () => {
    await Promise.all(temporaryPaths.map(async (path) => removePath(path)));
    process.env.PATH = originalPath;
  });

  it('builds explainable output for a matching TypeScript repo', async () => {
    const root = await mkdtemp(join(tmpdir(), 'tavik-'));
    temporaryPaths.push(root);
    await scaffoldOrgRepository(root, 'acme');

    const repoPath = join(root, 'fixtures', 'billing-api');
    await ensureDirectory(repoPath);
    await writeFile(
      join(repoPath, 'package.json'),
      JSON.stringify({
        dependencies: {
          next: '15.0.0',
          react: '19.0.0',
        },
      }),
      'utf8',
    );
    await writeFile(join(repoPath, 'tsconfig.json'), '{}', 'utf8');

    const output = await explainPlan(root, root, {
      agentId: 'codex',
      repoPath,
    });

    expect(output).toContain('Agent: codex');
    expect(output).toContain('example-typescript-skill');
    expect(output).toContain('org-default');
  });

  it('connects and syncs managed state through the adapter layer', async () => {
    const root = await mkdtemp(join(tmpdir(), 'tavik-'));
    temporaryPaths.push(root);
    await scaffoldOrgRepository(root, 'acme');
    const binPath = join(root, 'bin');
    await ensureDirectory(binPath);
    await writeExecutable(
      join(binPath, 'cursor'),
      '#!/usr/bin/env sh\nexit 0\n',
    );
    process.env.PATH = [binPath, originalPath].filter(Boolean).join(delimiter);

    const repoPath = join(root, 'fixtures', 'example-repo');
    await ensureDirectory(repoPath);
    await writeFile(join(repoPath, 'package.json'), '{}', 'utf8');

    const connectResult = await connectMachine(root, root);
    const syncResult = await syncMachine(undefined, root, {
      agentId: 'cursor',
      repoPath,
    });

    expect(connectResult.state.orgRootPath).toBe(root);
    expect(syncResult.updatedFiles.some((path) => path.endsWith('.mdc'))).toBe(
      true,
    );
    expect(syncResult.state.generatedFiles.length).toBeGreaterThanOrEqual(4);
    expect(syncResult.state.refreshArtifacts.length).toBeGreaterThan(0);
  });

  it('clones a git source and executes shared skills actions', async () => {
    const sourceRoot = await mkdtemp(join(tmpdir(), 'tavik-source-'));
    const machineRoot = await mkdtemp(join(tmpdir(), 'tavik-machine-'));
    temporaryPaths.push(sourceRoot, machineRoot);
    await scaffoldOrgRepository(sourceRoot, 'acme');
    await runCommand(['git', '-C', sourceRoot, 'init']);
    await runCommand([
      'git',
      '-C',
      sourceRoot,
      'config',
      'user.email',
      'test@example.com',
    ]);
    await runCommand([
      'git',
      '-C',
      sourceRoot,
      'config',
      'user.name',
      'Test User',
    ]);
    await runCommand(['git', '-C', sourceRoot, 'add', '.']);
    await runCommand(['git', '-C', sourceRoot, 'commit', '-m', 'initial']);

    const binPath = join(machineRoot, 'bin');
    await ensureDirectory(binPath);
    const logPath = join(machineRoot, 'skills.log');
    await writeExecutable(
      join(binPath, 'skills'),
      `#!/usr/bin/env sh\necho "$@" >> "${logPath}"\nexit 0\n`,
    );
    process.env.PATH = [binPath, originalPath].filter(Boolean).join(delimiter);

    const repoPath = join(machineRoot, 'repo');
    await ensureDirectory(repoPath);
    await writeFile(join(repoPath, 'package.json'), '{}', 'utf8');

    const connectResult = await connectMachine(
      `file://${sourceRoot}`,
      machineRoot,
    );
    const syncResult = await syncMachine(undefined, machineRoot, {
      agentId: 'generic-skills',
      repoPath,
    });

    expect(connectResult.state.orgSource.kind).toBe('git');
    expect(syncResult.executedExternalActions).toHaveLength(1);
    const logContents = await readFile(logPath, 'utf8');
    expect(logContents).toContain('add');
    expect(logContents).toContain('example-typescript-skill');
  });

  it('returns helpful no-state responses before a machine is connected', async () => {
    const machineRoot = await mkdtemp(join(tmpdir(), 'tavik-empty-machine-'));
    temporaryPaths.push(machineRoot);

    await expect(
      explainPlan(undefined, machineRoot, {
        agentId: 'codex',
        repoPath: machineRoot,
      }),
    ).rejects.toThrow(
      'No connected org source found. Run `tavik connect` first or pass --org-root.',
    );

    await expect(
      syncMachine(undefined, machineRoot, {
        agentId: 'codex',
        repoPath: machineRoot,
      }),
    ).rejects.toThrow(
      'No connected org source found. Run `tavik connect` first or pass --org-root.',
    );

    expect(await readStatus(machineRoot)).toBe('No managed state found.');
    await expect(disconnectMachine(machineRoot)).resolves.toEqual({
      removedFiles: [],
      removedState: false,
      statePath: join(machineRoot, '.tavik', 'managed-state.json'),
    });
  });

  it('renders status with empty managed file sections', async () => {
    const machineRoot = await mkdtemp(join(tmpdir(), 'tavik-status-'));
    temporaryPaths.push(machineRoot);

    await scaffoldOrgRepository(machineRoot, 'acme');
    await connectMachine(machineRoot, machineRoot);
    const status = await readStatus(machineRoot);

    expect(status).toContain('Connected org source:');
    expect(status).toContain('Last sync: never');
    expect(status).toContain('Refresh support artifacts:');
    expect(status).toContain('Support levels:');
  });
});

async function writeExecutable(path: string, content: string): Promise<void> {
  await writeFile(path, content, 'utf8');
  await chmod(path, 0o755);
}
