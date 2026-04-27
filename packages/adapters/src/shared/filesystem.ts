import {
  access,
  mkdir,
  readFile,
  rename,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';

import type { AdapterFileSystem, PathKind } from './types.js';

export class NodeAdapterFileSystem implements AdapterFileSystem {
  async ensureDirectory(targetPath: string): Promise<void> {
    await mkdir(targetPath, { recursive: true });
  }

  async readTextFile(targetPath: string): Promise<string> {
    return readFile(targetPath, 'utf8');
  }

  async removeFile(targetPath: string): Promise<void> {
    await rm(targetPath, { force: true });
  }

  async statPath(targetPath: string): Promise<PathKind> {
    try {
      const stats = await stat(targetPath);
      if (stats.isFile()) {
        return 'file';
      }

      if (stats.isDirectory()) {
        return 'directory';
      }

      return 'other';
    } catch {
      return 'missing';
    }
  }

  async writeTextFileAtomic(
    targetPath: string,
    content: string,
  ): Promise<void> {
    const directoryPath = path.dirname(targetPath);
    const temporaryPath = path.join(
      directoryPath,
      `.tmp-${path.basename(targetPath)}-${process.pid}-${Date.now()}`,
    );

    await mkdir(directoryPath, { recursive: true });
    await writeFile(temporaryPath, content, 'utf8');
    await rename(temporaryPath, targetPath);
  }
}

export function defaultEnvironmentVariables(
  environmentVariables?: Readonly<Record<string, string | undefined>>,
): Readonly<Record<string, string | undefined>> {
  return environmentVariables ?? process.env;
}

export function resolveHomeDirectory(homeDir?: string): string {
  return homeDir ?? os.homedir();
}

export async function fileExists(
  fileSystem: AdapterFileSystem,
  targetPath: string,
): Promise<boolean> {
  return (await fileSystem.statPath(targetPath)) === 'file';
}

export async function findExecutable(
  executableNames: readonly string[],
  environmentVariables: Readonly<Record<string, string | undefined>>,
  fileSystem: AdapterFileSystem,
): Promise<string | undefined> {
  const pathValue = environmentVariables.PATH;
  if (pathValue === undefined || pathValue.length === 0) {
    return undefined;
  }

  const pathEntries = pathValue
    .split(path.delimiter)
    .filter((entry) => entry.length > 0);
  if (pathEntries.length === 0) {
    return undefined;
  }

  for (const directoryPath of pathEntries) {
    for (const executableName of executableNames) {
      for (const candidateName of executableCandidates(
        executableName,
        environmentVariables,
      )) {
        const candidatePath = path.join(directoryPath, candidateName);
        if ((await fileSystem.statPath(candidatePath)) === 'file') {
          return candidatePath;
        }
      }
    }
  }

  return undefined;
}

function executableCandidates(
  executableName: string,
  environmentVariables: Readonly<Record<string, string | undefined>>,
): readonly string[] {
  const candidates = new Set<string>([executableName]);
  if (path.extname(executableName).length > 0) {
    return [executableName];
  }

  const pathExtValue = environmentVariables.PATHEXT;
  if (pathExtValue === undefined || pathExtValue.length === 0) {
    return [executableName];
  }

  for (const extension of pathExtValue.split(';')) {
    if (extension.length === 0) {
      continue;
    }

    candidates.add(`${executableName}${extension.toLowerCase()}`);
    candidates.add(`${executableName}${extension}`);
  }

  return [...candidates];
}

export async function isReadablePath(targetPath: string): Promise<boolean> {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}
