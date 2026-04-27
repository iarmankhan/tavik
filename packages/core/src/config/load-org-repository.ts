import { join } from 'node:path';
import {
  type ArtifactType,
  DEFAULT_CONFIG_FILE_NAME,
  type OrgConfig,
  artifactMetadataSchema,
  orgConfigSchema,
} from '@org-agent-skills/config';

import type { ArtifactRecord, OrgRepository } from '../domain/types.js';
import { pathExists, readTextFile, walkDirectories } from '../utils/fs.js';
import { parseYaml } from '../utils/yaml.js';

async function readOrgConfig(rootPath: string): Promise<OrgConfig> {
  const configPath = join(rootPath, DEFAULT_CONFIG_FILE_NAME);
  const rawConfig = await readTextFile(configPath);
  return orgConfigSchema.parse(parseYaml(rawConfig));
}

function isMetadataFileName(path: string): boolean {
  return (
    path.endsWith('skill.metadata.yml') || path.endsWith('rule.metadata.yml')
  );
}

async function loadArtifactFromDirectory(
  directoryPath: string,
): Promise<ArtifactRecord | null> {
  const skillMetadataPath = join(directoryPath, 'skill.metadata.yml');
  const ruleMetadataPath = join(directoryPath, 'rule.metadata.yml');

  const metadataPath = (await pathExists(skillMetadataPath))
    ? skillMetadataPath
    : (await pathExists(ruleMetadataPath))
      ? ruleMetadataPath
      : null;

  if (metadataPath === null) {
    return null;
  }

  const rawMetadata = await readTextFile(metadataPath);
  const metadata = artifactMetadataSchema.parse(parseYaml(rawMetadata));

  const concreteContentPath = await resolveContentPath(
    directoryPath,
    metadata.type,
  );
  const content = await readTextFile(concreteContentPath);

  return {
    content,
    contentPath: concreteContentPath,
    directoryPath,
    metadata,
    metadataPath,
  };
}

async function resolveContentPath(
  directoryPath: string,
  artifactType: ArtifactType,
) {
  const fileName = artifactType === 'skill' ? 'SKILL.md' : 'base.md';
  const contentPath = join(directoryPath, fileName);

  if (!(await pathExists(contentPath))) {
    throw new Error(`Missing artifact content file: ${contentPath}`);
  }

  return contentPath;
}

async function readArtifacts(rootPath: string): Promise<ArtifactRecord[]> {
  const directories = await walkDirectories(rootPath);
  const artifactDirectories = directories.filter(
    (directoryPath) => !isMetadataFileName(directoryPath),
  );
  const artifactRecords = await Promise.all(
    artifactDirectories.map((directoryPath) =>
      loadArtifactFromDirectory(directoryPath),
    ),
  );
  return artifactRecords.filter(
    (artifact): artifact is ArtifactRecord => artifact !== null,
  );
}

export async function loadOrgRepository(
  rootPath: string,
): Promise<OrgRepository> {
  return {
    artifacts: await readArtifacts(rootPath),
    config: await readOrgConfig(rootPath),
    rootPath,
  };
}
