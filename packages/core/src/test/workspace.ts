import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

export type WorkspaceFile = {
  content: string;
  path: string;
};

export async function createTemporaryWorkspace(
  prefix: string,
): Promise<string> {
  return mkdtemp(join(tmpdir(), `${prefix}-`));
}

export async function writeWorkspaceFiles(
  rootPath: string,
  files: readonly WorkspaceFile[],
): Promise<void> {
  await Promise.all(
    files.map(async (file) => {
      const filePath = join(rootPath, file.path);
      await mkdir(dirname(filePath), { recursive: true });
      await writeFile(filePath, file.content, 'utf8');
    }),
  );
}

export async function seedTemporaryWorkspace(
  prefix: string,
  files: readonly WorkspaceFile[],
): Promise<string> {
  const rootPath = await createTemporaryWorkspace(prefix);
  await writeWorkspaceFiles(rootPath, files);
  return rootPath;
}
