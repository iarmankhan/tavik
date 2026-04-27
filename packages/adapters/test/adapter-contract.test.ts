import {
  chmod,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  type AdapterEnvironment,
  type AgentAdapter,
  ClaudeCodeAdapter,
  CodexAdapter,
  CursorAdapter,
  GenericSkillsAdapter,
  type GuidanceSection,
  type SkillReference,
  type SupportLevel,
} from '../src/index.js';

interface AdapterCase {
  readonly id: 'claude-code' | 'codex' | 'cursor' | 'generic-skills';
  readonly expectedSupportLevel: SupportLevel;
  readonly binaryName: string;
  readonly createAdapter: (environment: AdapterEnvironment) => AgentAdapter;
  readonly managedPath: (workspaceRoot: string) => string | undefined;
  readonly expectsExternalActions: boolean;
}

interface TestEnvironment {
  readonly rootPath: string;
  readonly workspaceRoot: string;
  readonly stateRoot: string;
  readonly homeDir: string;
  readonly binDir: string;
  readonly variables: Readonly<Record<string, string | undefined>>;
}

const baseGuidance: readonly GuidanceSection[] = [
  {
    sourceId: 'org/base/default',
    title: 'Repository Rules',
    content: '- Run tests before shipping.\n- Keep changes reversible.',
  },
];

const skills: readonly SkillReference[] = [
  {
    id: 'ts-strict',
    displayName: 'TypeScript Strictness',
    sourcePath: '/skills/typescript-strict',
    installSource: 'example-org/typescript-strict',
    description: 'Shared guidance for strict TypeScript changes.',
  },
];

const adapterCases = [
  {
    id: 'codex',
    expectedSupportLevel: 'full',
    binaryName: 'codex',
    createAdapter: (environment) => new CodexAdapter(environment),
    managedPath: (workspaceRoot) => path.join(workspaceRoot, 'AGENTS.md'),
    expectsExternalActions: false,
  },
  {
    id: 'claude-code',
    expectedSupportLevel: 'full',
    binaryName: 'claude',
    createAdapter: (environment) => new ClaudeCodeAdapter(environment),
    managedPath: (workspaceRoot) =>
      path.join(workspaceRoot, '.claude', 'rules', 'tavik.md'),
    expectsExternalActions: false,
  },
  {
    id: 'cursor',
    expectedSupportLevel: 'full',
    binaryName: 'cursor',
    createAdapter: (environment) => new CursorAdapter(environment),
    managedPath: (workspaceRoot) =>
      path.join(workspaceRoot, '.cursor', 'rules', 'tavik.mdc'),
    expectsExternalActions: false,
  },
  {
    id: 'generic-skills',
    expectedSupportLevel: 'skills-only',
    binaryName: 'skills',
    createAdapter: (environment) => new GenericSkillsAdapter(environment),
    managedPath: () => undefined,
    expectsExternalActions: true,
  },
] satisfies readonly AdapterCase[];

describe.each(adapterCases)('$id adapter contract', (adapterCase) => {
  it('reports the declared support level', async () => {
    const environment = await createTestEnvironment();
    try {
      const adapter = adapterCase.createAdapter(
        buildAdapterEnvironment(environment),
      );
      expect(adapter.supportLevel()).toBe(adapterCase.expectedSupportLevel);
    } finally {
      await cleanupTestEnvironment(environment);
    }
  });

  it('reports unsupported when no detection signal exists', async () => {
    const environment = await createTestEnvironment();
    try {
      const adapter = adapterCase.createAdapter(
        buildAdapterEnvironment(environment),
      );
      const detection = await adapter.detect();

      expect(detection.available).toBe(false);
      expect(detection.supportLevel).toBe('unsupported');
    } finally {
      await cleanupTestEnvironment(environment);
    }
  });

  it('detects availability, computes a plan, applies it, and reaches a no-op steady state', async () => {
    const environment = await createTestEnvironment();
    try {
      await createFakeBinary(environment.binDir, adapterCase.binaryName);
      const adapter = adapterCase.createAdapter(
        buildAdapterEnvironment(environment),
      );

      const detection = await adapter.detect();
      expect(detection.available).toBe(true);
      expect(detection.supportLevel).toBe(adapterCase.expectedSupportLevel);

      const plan = await adapter.computePlan({ baseGuidance, skills });
      expect(plan.supportLevel).toBe(adapterCase.expectedSupportLevel);

      const stateOperation = findStateOperation(plan.fileOperations);
      expect(stateOperation).toBeDefined();

      const expectedManagedPath = adapterCase.managedPath(
        environment.workspaceRoot,
      );
      if (expectedManagedPath !== undefined) {
        const managedOperation = findOperation(
          plan.fileOperations,
          expectedManagedPath,
        );
        if (managedOperation === undefined) {
          throw new Error(
            `Expected managed operation for ${expectedManagedPath}`,
          );
        }

        expect(managedOperation.status).toBe('apply');
        expect(managedOperation.content).toContain('tavik:managed');
      }

      if (adapterCase.expectsExternalActions) {
        expect(plan.externalActions).toHaveLength(skills.length);
        expect(plan.externalActions[0]?.command).toEqual([
          'skills',
          'add',
          'example-org/typescript-strict',
        ]);
      } else {
        expect(plan.externalActions).toHaveLength(0);
      }

      const applyResult = await adapter.applyPlan(plan);
      expect(applyResult.applied.length).toBeGreaterThan(0);

      if (expectedManagedPath !== undefined) {
        const managedContent = await readFile(expectedManagedPath, 'utf8');
        expect(managedContent).toContain('tavik:managed');
      }

      if (stateOperation === undefined) {
        throw new Error('Expected a managed state operation.');
      }
      const stateContent = await readFile(stateOperation.path, 'utf8');
      expect(stateContent).toContain('tavik:managed');

      const steadyStatePlan = await adapter.computePlan({
        baseGuidance,
        skills,
      });
      const steadyStateOperations = steadyStatePlan.fileOperations.filter(
        (operation) => operation.status === 'apply',
      );
      expect(steadyStateOperations).toHaveLength(0);
    } finally {
      await cleanupTestEnvironment(environment);
    }
  });

  it('removes only managed artifacts during cleanup', async () => {
    const environment = await createTestEnvironment();
    try {
      await createFakeBinary(environment.binDir, adapterCase.binaryName);
      const adapter = adapterCase.createAdapter(
        buildAdapterEnvironment(environment),
      );

      const plan = await adapter.computePlan({ baseGuidance, skills });
      const stateOperation = findStateOperation(plan.fileOperations);
      if (stateOperation === undefined) {
        throw new Error('Expected a managed state operation.');
      }

      await adapter.applyPlan(plan);
      await adapter.removeManagedState();

      await expect(readFile(stateOperation.path, 'utf8')).rejects.toThrow();

      const managedPath = adapterCase.managedPath(environment.workspaceRoot);
      if (managedPath !== undefined) {
        await expect(readFile(managedPath, 'utf8')).rejects.toThrow();
      }
    } finally {
      await cleanupTestEnvironment(environment);
    }
  });

  if (adapterCase.expectedSupportLevel === 'full') {
    it('refuses to overwrite foreign files at managed paths', async () => {
      const environment = await createTestEnvironment();
      try {
        await createFakeBinary(environment.binDir, adapterCase.binaryName);
        const adapter = adapterCase.createAdapter(
          buildAdapterEnvironment(environment),
        );
        const managedPath = adapterCase.managedPath(environment.workspaceRoot);
        if (managedPath === undefined) {
          throw new Error('Expected a managed path for full adapters.');
        }

        await mkdir(path.dirname(managedPath), { recursive: true });
        await writeFile(managedPath, '# user-owned file\n', 'utf8');

        const plan = await adapter.computePlan({ baseGuidance, skills });
        const managedOperation = findOperation(
          plan.fileOperations,
          managedPath,
        );
        if (managedOperation === undefined) {
          throw new Error(`Expected managed operation for ${managedPath}`);
        }

        expect(managedOperation.status).toBe('blocked');
        expect(plan.warnings.length).toBeGreaterThan(0);
      } finally {
        await cleanupTestEnvironment(environment);
      }
    });
  }
});

async function createTestEnvironment(): Promise<TestEnvironment> {
  const rootPath = await mkdtemp(path.join(os.tmpdir(), 'tavik-adapters-'));
  const workspaceRoot = path.join(rootPath, 'workspace');
  const stateRoot = path.join(rootPath, 'state');
  const homeDir = path.join(rootPath, 'home');
  const binDir = path.join(rootPath, 'bin');

  await Promise.all([
    mkdir(workspaceRoot, { recursive: true }),
    mkdir(stateRoot, { recursive: true }),
    mkdir(homeDir, { recursive: true }),
    mkdir(binDir, { recursive: true }),
  ]);

  return {
    rootPath,
    workspaceRoot,
    stateRoot,
    homeDir,
    binDir,
    variables: {
      PATH: binDir,
    },
  };
}

async function cleanupTestEnvironment(
  environment: TestEnvironment,
): Promise<void> {
  await rm(environment.rootPath, { force: true, recursive: true });
}

function buildAdapterEnvironment(
  environment: TestEnvironment,
): AdapterEnvironment {
  return {
    workspaceRoot: environment.workspaceRoot,
    stateRoot: environment.stateRoot,
    homeDir: environment.homeDir,
    env: environment.variables,
    now: () => new Date('2026-04-26T00:00:00.000Z'),
  };
}

async function createFakeBinary(
  binDirectory: string,
  name: string,
): Promise<void> {
  const binaryPath = path.join(binDirectory, name);
  await writeFile(binaryPath, '#!/bin/sh\nexit 0\n', 'utf8');
  await chmod(binaryPath, 0o755);
}

function findOperation(
  operations: readonly { path: string }[],
  targetPath: string,
): { path: string; status?: string; content?: string } | undefined {
  return operations.find((operation) => operation.path === targetPath);
}

function findStateOperation(
  operations: readonly { path: string }[],
): { path: string; status?: string; content?: string } | undefined {
  return operations.find((operation) =>
    operation.path.endsWith('managed-state.json'),
  );
}
