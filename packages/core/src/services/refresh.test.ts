import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { createTemporaryWorkspace } from '../test/workspace.js';
import { removePath } from '../utils/fs.js';
import { installRefreshArtifacts } from './refresh.js';

describe('installRefreshArtifacts', () => {
  const temporaryPaths: string[] = [];

  afterEach(async () => {
    await Promise.all(temporaryPaths.map(async (path) => removePath(path)));
  });

  it('writes wrappers and zsh hook artifacts for every supported agent', async () => {
    const machineRootPath = await createTemporaryWorkspace('refresh-artifacts');
    temporaryPaths.push(machineRootPath);

    const artifacts = await installRefreshArtifacts({ machineRootPath });

    expect(artifacts).toHaveLength(4);
    expect(artifacts.map((artifact) => artifact.agentId)).toEqual([
      'claude-code',
      'cursor',
      'codex',
      'generic-skills',
    ]);

    const claudeWrapperPath = join(
      machineRootPath,
      '.tavik',
      'wrappers',
      'claude',
    );
    const zshHookPath = join(
      machineRootPath,
      '.tavik',
      'hooks',
      'zsh-auto-refresh.zsh',
    );

    const [claudeWrapper, zshHook, wrapperStats] = await Promise.all([
      readFile(claudeWrapperPath, 'utf8'),
      readFile(zshHookPath, 'utf8'),
      stat(claudeWrapperPath),
    ]);

    expect(claudeWrapper).toContain(
      `sync --agent claude-code --machine-root "${machineRootPath}"`,
    );
    expect(claudeWrapper).toContain('command -v claude');
    expect(zshHook).toContain(
      `sync --agent generic-skills --machine-root "${machineRootPath}"`,
    );
    expect(zshHook).toContain(
      'add-zsh-hook chpwd org_agent_skills_auto_refresh',
    );
    expect(wrapperStats.mode & 0o111).not.toBe(0);
  });
});
