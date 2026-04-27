import {
  mkdir,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import { dirname, join } from 'node:path';

export async function ensureDirectory(path: string): Promise<void> {
  await mkdir(path, { recursive: true });
}

export async function readTextFile(path: string): Promise<string> {
  return readFile(path, 'utf8');
}

export async function writeTextFile(
  path: string,
  content: string,
): Promise<void> {
  await ensureDirectory(dirname(path));
  await writeFile(path, content, 'utf8');
}

export async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

export async function removePath(path: string): Promise<void> {
  await rm(path, { recursive: true, force: true });
}

export async function walkDirectories(path: string): Promise<string[]> {
  if (!(await pathExists(path))) {
    return [];
  }

  const entries = await readdir(path, { withFileTypes: true });
  const nestedResults = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map(async (entry) => {
        const nestedPath = join(path, entry.name);
        const nestedDirectories = await walkDirectories(nestedPath);
        return [nestedPath, ...nestedDirectories];
      }),
  );

  return nestedResults.flat();
}
