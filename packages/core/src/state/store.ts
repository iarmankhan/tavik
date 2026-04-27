import { join } from 'node:path';
import { STATE_FILE_NAME, supportLevelSchema } from '@org-agent-skills/config';
import { z } from 'zod';

import type { ManagedState } from '../domain/types.js';
import {
  ensureDirectory,
  pathExists,
  readTextFile,
  removePath,
  writeTextFile,
} from '../utils/fs.js';

const MANAGED_ROOT_DIRECTORY = '.tavik';

const managedFileRecordSchema = z.object({
  path: z.string().min(1),
  kind: z.enum(['adapter-artifact', 'refresh-artifact']),
});

const managedExternalActionRecordSchema = z.object({
  command: z.array(z.string().min(1)),
  description: z.string().min(1),
  executedAt: z.string().min(1),
  skillId: z.string().min(1),
});

const orgSourceSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('local'),
    value: z.string().min(1),
  }),
  z.object({
    cachePath: z.string().min(1),
    kind: z.literal('git'),
    value: z.string().min(1),
  }),
]);

const refreshArtifactRecordSchema = z.object({
  agentId: z.enum(['claude-code', 'cursor', 'codex', 'generic-skills']),
  path: z.string().min(1),
});

const managedStateSchema = z.object({
  connectedAt: z.string().min(1),
  externalActions: z.array(managedExternalActionRecordSchema),
  generatedFiles: z.array(managedFileRecordSchema),
  lastSyncAt: z.string().min(1).optional(),
  orgConfigPath: z.string().min(1),
  orgRootPath: z.string().min(1),
  orgSource: orgSourceSchema,
  refreshArtifacts: z.array(refreshArtifactRecordSchema),
  supportByAgent: z.object({
    'claude-code': supportLevelSchema,
    cursor: supportLevelSchema,
    codex: supportLevelSchema,
    'generic-skills': supportLevelSchema,
  }),
});

export function resolveManagedRoot(machineRootPath: string): string {
  return join(machineRootPath, MANAGED_ROOT_DIRECTORY);
}

export function resolveStatePath(machineRootPath: string): string {
  return join(resolveManagedRoot(machineRootPath), STATE_FILE_NAME);
}

export async function readManagedState(
  machineRootPath: string,
): Promise<ManagedState | null> {
  const statePath = resolveStatePath(machineRootPath);
  if (!(await pathExists(statePath))) {
    return null;
  }

  const content = await readTextFile(statePath);
  const parsed = managedStateSchema.parse(JSON.parse(content));
  const state: ManagedState = {
    connectedAt: parsed.connectedAt,
    externalActions: parsed.externalActions,
    generatedFiles: parsed.generatedFiles,
    orgConfigPath: parsed.orgConfigPath,
    orgRootPath: parsed.orgRootPath,
    orgSource: parsed.orgSource,
    refreshArtifacts: parsed.refreshArtifacts,
    supportByAgent: parsed.supportByAgent,
    ...(parsed.lastSyncAt === undefined
      ? {}
      : { lastSyncAt: parsed.lastSyncAt }),
  };

  return state;
}

export async function writeManagedState(
  machineRootPath: string,
  state: ManagedState,
): Promise<string> {
  const managedRoot = resolveManagedRoot(machineRootPath);
  await ensureDirectory(managedRoot);
  const statePath = resolveStatePath(machineRootPath);
  await writeTextFile(statePath, `${JSON.stringify(state, null, 2)}\n`);
  return statePath;
}

export async function removeManagedState(
  machineRootPath: string,
): Promise<void> {
  await removePath(resolveManagedRoot(machineRootPath));
}
