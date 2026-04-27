import { join, resolve } from 'node:path';
import { DEFAULT_CONFIG_FILE_NAME } from '@org-agent-skills/config';

import type { ManagedState, OrgSourceDescriptor } from '../domain/types.js';
import { resolveManagedRoot } from '../state/store.js';
import { ensureDirectory, pathExists } from '../utils/fs.js';
import { runCommand } from './process.js';

function isGitSourceReference(sourceReference: string): boolean {
  return (
    sourceReference.includes('://') ||
    sourceReference.startsWith('git@') ||
    sourceReference.endsWith('.git')
  );
}

function sourceCachePath(machineRootPath: string): string {
  return join(resolveManagedRoot(machineRootPath), 'sources', 'org-source');
}

export async function connectOrgSource(
  sourceReference: string,
  machineRootPath: string,
): Promise<{ descriptor: OrgSourceDescriptor; orgRootPath: string }> {
  const resolvedPath = resolve(sourceReference);

  if (await pathExists(join(resolvedPath, DEFAULT_CONFIG_FILE_NAME))) {
    return {
      descriptor: {
        kind: 'local',
        value: resolvedPath,
      },
      orgRootPath: resolvedPath,
    };
  }

  if (!isGitSourceReference(sourceReference)) {
    throw new Error(
      `Could not resolve org source "${sourceReference}" as a local source directory or Git URL.`,
    );
  }

  const cachePath = sourceCachePath(machineRootPath);
  await ensureDirectory(join(resolveManagedRoot(machineRootPath), 'sources'));

  if (await pathExists(cachePath)) {
    await runCommand(['git', '-C', cachePath, 'pull', '--ff-only']);
  } else {
    await runCommand([
      'git',
      'clone',
      '--depth',
      '1',
      sourceReference,
      cachePath,
    ]);
  }

  return {
    descriptor: {
      cachePath,
      kind: 'git',
      value: sourceReference,
    },
    orgRootPath: cachePath,
  };
}

export async function refreshOrgSource(state: ManagedState): Promise<string> {
  if (state.orgSource.kind === 'local') {
    return state.orgRootPath;
  }

  await runCommand([
    'git',
    '-C',
    state.orgSource.cachePath,
    'pull',
    '--ff-only',
  ]);
  return state.orgSource.cachePath;
}
