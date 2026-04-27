import { access, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execa } from 'execa';
import { afterEach, describe, expect, it } from 'vitest';

type CliResult = {
  exitCode: number;
  stderr: string;
  stdout: string;
};

type InitOrgResult = {
  configFile: string;
  files: string[];
  orgSlug: string;
};

type ValidateResult = {
  messages: Array<{
    level: string;
    message: string;
    path: string;
  }>;
  valid: boolean;
};

type ConnectResult = {
  state: {
    generatedFiles: Array<{
      kind: string;
      path: string;
    }>;
    orgRootPath: string;
  };
};

type DisconnectResult = {
  removedFiles: string[];
  removedState: boolean;
  statePath: string;
};

const cliEntryPath = fileURLToPath(new URL('./index.ts', import.meta.url));
const repoRoot = fileURLToPath(new URL('../../..', import.meta.url));
const temporaryPaths: string[] = [];

describe('tavik CLI integration', () => {
  afterEach(async () => {
    await Promise.all(
      temporaryPaths.map(async (temporaryPath) =>
        rm(temporaryPath, { force: true, recursive: true }),
      ),
    );
  });

  it('scaffolds, extends, and validates an org repository end-to-end', async () => {
    const tempRoot = await createTempRoot();
    const orgRoot = join(tempRoot, 'acme-agent-skills');

    const initResult = await runCli([
      'init-org',
      '--org-slug',
      'acme',
      '--path',
      orgRoot,
      '--json',
    ]);

    expect(initResult.exitCode).toBe(0);
    expect(initResult.stderr).toBe('');
    const initPayload = parseInitOrgResult(initResult.stdout);
    expect(initPayload.orgSlug).toBe('acme');
    expect(initPayload.configFile).toBe(join(orgRoot, 'tavik.config.yml'));
    expect(initPayload.files.length).toBeGreaterThan(0);
    await Promise.all(
      initPayload.files.map(async (filePath) => access(filePath)),
    );

    const newSkillResult = await runCli([
      'new',
      'skill',
      '--org-root',
      orgRoot,
      '--name',
      'TypeScript Strictness',
      '--json',
    ]);

    expect(newSkillResult.exitCode).toBe(0);
    expect(newSkillResult.stdout).toContain('"type": "skill"');
    expect(newSkillResult.stdout).toContain('TypeScript Strictness');

    const validateResult = await runCli([
      'validate',
      '--org-root',
      orgRoot,
      '--json',
    ]);

    expect(validateResult.exitCode).toBe(0);
    const validatePayload = parseValidateResult(validateResult.stdout);
    expect(validatePayload.valid).toBe(true);
    expect(validatePayload.messages).toHaveLength(0);
  });

  it('previews and explains matching guidance for a repository', async () => {
    const tempRoot = await createTempRoot();
    const orgRoot = join(tempRoot, 'acme-agent-skills');
    const machineRoot = join(tempRoot, 'machine');
    const repoPath = join(tempRoot, 'billing-api');

    await runCli([
      'init-org',
      '--org-slug',
      'acme',
      '--path',
      orgRoot,
      '--json',
    ]);
    await mkdir(machineRoot, { recursive: true });
    await mkdir(repoPath, { recursive: true });
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

    const previewResult = await runCli([
      'preview',
      '--org-root',
      orgRoot,
      '--machine-root',
      machineRoot,
      '--agent',
      'codex',
      '--repo-path',
      repoPath,
      '--json',
    ]);

    expect(previewResult.exitCode).toBe(0);
    expect(previewResult.stdout).toContain('example-typescript-skill');
    expect(previewResult.stdout).toContain('org-default');
    expect(previewResult.stdout).toContain('"agentId": "codex"');

    const whyResult = await runCli([
      'why',
      '--org-root',
      orgRoot,
      '--machine-root',
      machineRoot,
      '--agent',
      'codex',
      '--repo-path',
      repoPath,
    ]);

    expect(whyResult.exitCode).toBe(0);
    expect(whyResult.stdout).toContain('Agent: codex');
    expect(whyResult.stdout).toContain('example-typescript-skill');
    expect(whyResult.stdout).toContain('org-default');
  });

  it('connects managed state, reports status, and disconnects cleanly', async () => {
    const tempRoot = await createTempRoot();
    const orgRoot = join(tempRoot, 'acme-agent-skills');
    const machineRoot = join(tempRoot, 'machine');

    await runCli([
      'init-org',
      '--org-slug',
      'acme',
      '--path',
      orgRoot,
      '--json',
    ]);
    await mkdir(machineRoot, { recursive: true });

    const connectResult = await runCli([
      'connect',
      '--org-source',
      orgRoot,
      '--machine-root',
      machineRoot,
      '--json',
    ]);

    expect(connectResult.exitCode).toBe(0);
    const connectPayload = parseConnectResult(connectResult.stdout);
    expect(connectPayload.state.orgRootPath).toBe(orgRoot);
    expect(connectPayload.state.generatedFiles.length).toBeGreaterThan(0);

    const statusResult = await runCli([
      'status',
      '--machine-root',
      machineRoot,
    ]);

    expect(statusResult.exitCode).toBe(0);
    expect(statusResult.stdout).toContain(`Connected org source: ${orgRoot}`);
    expect(statusResult.stdout).toContain('Support levels:');

    const disconnectResult = await runCli([
      'disconnect',
      '--machine-root',
      machineRoot,
      '--json',
    ]);

    expect(disconnectResult.exitCode).toBe(0);
    const disconnectPayload = parseDisconnectResult(disconnectResult.stdout);
    expect(disconnectPayload.removedState).toBe(true);
    expect(disconnectPayload.removedFiles.length).toBeGreaterThan(0);
    expect(disconnectPayload.statePath).toContain(machineRoot);

    const finalStatusResult = await runCli([
      'status',
      '--machine-root',
      machineRoot,
    ]);

    expect(finalStatusResult.exitCode).toBe(0);
    expect(finalStatusResult.stdout).toBe('No managed state found.');
  });
});

async function createTempRoot(): Promise<string> {
  const temporaryRoot = await mkdtemp(join(tmpdir(), 'tavik-cli-'));
  temporaryPaths.push(temporaryRoot);
  return temporaryRoot;
}

async function runCli(args: readonly string[]): Promise<CliResult> {
  const result = await execa(
    process.execPath,
    ['--import', 'tsx', cliEntryPath, ...args],
    {
      cwd: repoRoot,
      env: {
        ...process.env,
        FORCE_COLOR: '0',
      },
      reject: false,
    },
  );

  return {
    exitCode: result.exitCode ?? 0,
    stderr: result.stderr,
    stdout: result.stdout,
  };
}

function parseInitOrgResult(stdout: string): InitOrgResult {
  const parsed = parseJson(stdout);
  assertRecord(parsed);
  const configFile = parsed.configFile;
  const files = parsed.files;
  const orgSlug = parsed.orgSlug;

  if (typeof configFile !== 'string') {
    throw new Error('Expected init-org result to include a configFile string.');
  }
  assertStringArray(files, 'files');
  if (typeof orgSlug !== 'string') {
    throw new Error('Expected init-org result to include an orgSlug string.');
  }

  return {
    configFile,
    files,
    orgSlug,
  };
}

function parseValidateResult(stdout: string): ValidateResult {
  const parsed = parseJson(stdout);
  assertRecord(parsed);
  const valid = parsed.valid;
  const messages = parsed.messages;

  if (typeof valid !== 'boolean') {
    throw new Error('Expected validate result to include a valid boolean.');
  }
  assertValidationMessages(messages);

  return {
    messages,
    valid,
  };
}

function parseConnectResult(stdout: string): ConnectResult {
  const parsed = parseJson(stdout);
  assertRecord(parsed);
  const state = parsed.state;

  assertRecord(state);
  const orgRootPath = state.orgRootPath;
  const generatedFiles = state.generatedFiles;

  if (typeof orgRootPath !== 'string') {
    throw new Error('Expected connect result to include state.orgRootPath.');
  }
  assertManagedFiles(generatedFiles);

  return {
    state: {
      generatedFiles,
      orgRootPath,
    },
  };
}

function parseDisconnectResult(stdout: string): DisconnectResult {
  const parsed = parseJson(stdout);
  assertRecord(parsed);
  const removedFiles = parsed.removedFiles;
  const removedState = parsed.removedState;
  const statePath = parsed.statePath;

  assertStringArray(removedFiles, 'removedFiles');
  if (typeof removedState !== 'boolean') {
    throw new Error(
      'Expected disconnect result to include a removedState boolean.',
    );
  }
  if (typeof statePath !== 'string') {
    throw new Error(
      'Expected disconnect result to include a statePath string.',
    );
  }

  return {
    removedFiles,
    removedState,
    statePath,
  };
}

function parseJson(stdout: string): unknown {
  return JSON.parse(stdout);
}

function assertRecord(
  value: unknown,
): asserts value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('Expected a JSON object.');
  }
}

function assertStringArray(
  value: unknown,
  fieldName: string,
): asserts value is string[] {
  if (
    !Array.isArray(value) ||
    !value.every((item) => typeof item === 'string')
  ) {
    throw new Error(`Expected ${fieldName} to be a string array.`);
  }
}

function assertManagedFiles(
  value: unknown,
): asserts value is Array<{ kind: string; path: string }> {
  if (!Array.isArray(value)) {
    throw new Error('Expected generatedFiles to be an array.');
  }

  for (const item of value) {
    assertRecord(item);
    if (typeof item.kind !== 'string' || typeof item.path !== 'string') {
      throw new Error('Expected each generated file to include kind and path.');
    }
  }
}

function assertValidationMessages(
  value: unknown,
): asserts value is Array<{ level: string; message: string; path: string }> {
  if (!Array.isArray(value)) {
    throw new Error('Expected messages to be an array.');
  }

  for (const item of value) {
    assertRecord(item);
    if (
      typeof item.level !== 'string' ||
      typeof item.message !== 'string' ||
      typeof item.path !== 'string'
    ) {
      throw new Error(
        'Expected each validation message to include level, message, and path.',
      );
    }
  }
}
