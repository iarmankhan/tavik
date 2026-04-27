import { join, relative } from 'node:path';

import type {
  OrgRepository,
  ValidationMessage,
  ValidationResult,
} from '../domain/types.js';
import { pathExists } from '../utils/fs.js';

export async function validateOrgRepository(
  repository: OrgRepository,
): Promise<ValidationResult> {
  const messages: ValidationMessage[] = [];

  if (repository.artifacts.length === 0) {
    messages.push({
      level: 'warning',
      message:
        'No skill or base-rule artifacts were found in the org repository.',
      path: repository.rootPath,
    });
  }

  const names = new Set<string>();

  for (const artifact of repository.artifacts) {
    const artifactName = artifact.metadata.name;
    const relativePath = relative(repository.rootPath, artifact.directoryPath);

    if (names.has(artifactName)) {
      messages.push({
        level: 'error',
        message: `Duplicate artifact name "${artifactName}".`,
        path: relativePath,
      });
    } else {
      names.add(artifactName);
    }

    if (artifact.metadata.executable) {
      const scriptsDirectoryPath = join(artifact.directoryPath, 'scripts');
      const hasScriptsDirectory = await pathExists(scriptsDirectoryPath);
      messages.push({
        level: hasScriptsDirectory ? 'warning' : 'error',
        message: hasScriptsDirectory
          ? 'Artifact contains executable content that should be reviewed as code.'
          : 'Artifact is marked executable but does not include a scripts directory.',
        path: relativePath,
      });
    }
  }

  return {
    messages,
    valid: messages.every((message) => message.level !== 'error'),
  };
}
