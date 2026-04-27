import { createHash } from 'node:crypto';
import * as path from 'node:path';

import type {
  AdapterManagedFile,
  AdapterManagedState,
  AgentAdapterId,
  SupportLevel,
} from './types.js';

export const MANAGED_MARKER = 'tavik:managed';

export function buildManagedComment(
  adapterId: AgentAdapterId,
  role: AdapterManagedFile['role'],
): string {
  return `<!-- ${MANAGED_MARKER} adapter=${adapterId} role=${role} -->`;
}

export function isManagedContent(content: string): boolean {
  return content.includes(MANAGED_MARKER);
}

export function workspaceKeyFor(workspaceRoot: string): string {
  const directoryName = path.basename(workspaceRoot) || 'workspace';
  const normalizedDirectoryName = directoryName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const hashedRoot = createHash('sha256')
    .update(workspaceRoot)
    .digest('hex')
    .slice(0, 12);
  const prefix =
    normalizedDirectoryName.length > 0 ? normalizedDirectoryName : 'workspace';
  return `${prefix}-${hashedRoot}`;
}

export function buildManagedStateContent(state: AdapterManagedState): string {
  return `${JSON.stringify(state, null, 2)}\n`;
}

export function parseManagedState(
  content: string,
): AdapterManagedState | undefined {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return undefined;
  }

  if (!isRecord(parsed)) {
    return undefined;
  }

  const managedHeader = readString(parsed, 'managedHeader');
  const adapterId = readAdapterId(parsed, 'adapterId');
  const workspaceRoot = readString(parsed, 'workspaceRoot');
  const stateRoot = readString(parsed, 'stateRoot');
  const workspaceKey = readString(parsed, 'workspaceKey');
  const generatedAt = readString(parsed, 'generatedAt');
  const supportLevel = readSupportLevel(parsed, 'supportLevel');
  const managedFiles = readManagedFiles(parsed, 'managedFiles');
  const skillIds = readStringArray(parsed, 'skillIds');

  if (
    managedHeader === undefined ||
    adapterId === undefined ||
    workspaceRoot === undefined ||
    stateRoot === undefined ||
    workspaceKey === undefined ||
    generatedAt === undefined ||
    supportLevel === undefined ||
    managedFiles === undefined ||
    skillIds === undefined
  ) {
    return undefined;
  }

  return {
    managedHeader,
    adapterId,
    workspaceRoot,
    stateRoot,
    workspaceKey,
    generatedAt,
    supportLevel,
    managedFiles,
    skillIds,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readString(
  record: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = record[key];
  return typeof value === 'string' ? value : undefined;
}

function readStringArray(
  record: Record<string, unknown>,
  key: string,
): readonly string[] | undefined {
  const value = record[key];
  if (!Array.isArray(value)) {
    return undefined;
  }

  const collectedValues: string[] = [];
  for (const entry of value) {
    if (typeof entry !== 'string') {
      return undefined;
    }

    collectedValues.push(entry);
  }

  return collectedValues;
}

function readAdapterId(
  record: Record<string, unknown>,
  key: string,
): AgentAdapterId | undefined {
  const value = readString(record, key);
  return value !== undefined && isAdapterId(value) ? value : undefined;
}

function readSupportLevel(
  record: Record<string, unknown>,
  key: string,
): SupportLevel | undefined {
  const value = readString(record, key);
  return value !== undefined && isSupportLevel(value) ? value : undefined;
}

function readManagedFiles(
  record: Record<string, unknown>,
  key: string,
): readonly AdapterManagedFile[] | undefined {
  const value = record[key];
  if (!Array.isArray(value)) {
    return undefined;
  }

  const files: AdapterManagedFile[] = [];
  for (const entry of value) {
    if (!isRecord(entry)) {
      return undefined;
    }

    const filePath = readString(entry, 'path');
    const role = readManagedFileRole(entry, 'role');
    if (filePath === undefined || role === undefined) {
      return undefined;
    }

    files.push({ path: filePath, role });
  }

  return files;
}

function readManagedFileRole(
  record: Record<string, unknown>,
  key: string,
): AdapterManagedFile['role'] | undefined {
  const value = readString(record, key);
  if (
    value === 'bridge-manifest' ||
    value === 'instructions' ||
    value === 'rule' ||
    value === 'state'
  ) {
    return value;
  }

  return undefined;
}

function isAdapterId(value: string): value is AgentAdapterId {
  return (
    value === 'codex' ||
    value === 'claude-code' ||
    value === 'cursor' ||
    value === 'generic-skills'
  );
}

function isSupportLevel(value: string): value is SupportLevel {
  return value === 'full' || value === 'skills-only' || value === 'unsupported';
}
