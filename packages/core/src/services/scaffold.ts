import { join } from 'node:path';
import {
  type ArtifactType,
  buildInitialOrgScaffold,
  buildNewArtifactScaffold,
} from '@org-agent-skills/config';

import { writeTextFile } from '../utils/fs.js';

export async function scaffoldOrgRepository(
  targetPath: string,
  orgSlug: string,
): Promise<string[]> {
  const scaffoldFiles = buildInitialOrgScaffold(orgSlug);
  const writtenFiles: string[] = [];

  for (const scaffoldFile of scaffoldFiles) {
    const absolutePath = join(targetPath, scaffoldFile.path);
    await writeTextFile(absolutePath, scaffoldFile.content);
    writtenFiles.push(absolutePath);
  }

  return writtenFiles;
}

export async function scaffoldArtifact(
  targetPath: string,
  artifactType: ArtifactType,
  name: string,
): Promise<string[]> {
  const scaffold = buildNewArtifactScaffold(artifactType, name);
  const files = [
    { path: join(targetPath, scaffold.contentPath), content: scaffold.content },
    {
      path: join(targetPath, scaffold.metadataPath),
      content: scaffold.metadata,
    },
  ];

  for (const file of files) {
    await writeTextFile(file.path, file.content);
  }

  return files.map((file) => file.path);
}
