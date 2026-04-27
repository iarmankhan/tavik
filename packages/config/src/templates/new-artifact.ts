import type { ArtifactType } from '../schemas/artifact.js';

export function buildNewArtifactScaffold(
  artifactType: ArtifactType,
  name: string,
): {
  metadataPath: string;
  contentPath: string;
  content: string;
  metadata: string;
} {
  const safeName = name.trim().toLowerCase().replaceAll(/\s+/g, '-');
  const artifactDir =
    artifactType === 'skill' ? `skills/${safeName}` : `base-rules/${safeName}`;
  const contentPath =
    artifactType === 'skill'
      ? `${artifactDir}/SKILL.md`
      : `${artifactDir}/base.md`;
  const content =
    artifactType === 'skill'
      ? `# ${name}

## Purpose

Describe the workflow this skill should support.

## When to use

- Add conditions for use

## Instructions

- Add org guidance here
`
      : `# ${name}

- Add always-on guidance here.
`;

  const metadata = `name: ${safeName}
description: ${name}
type: ${artifactType}
enabled: true
mode: ${artifactType === 'skill' ? 'auto' : 'always'}
priority: 50
source: org
agents:
  - claude-code
  - cursor
  - codex
applies_to:
  repos: []
  repo_patterns: []
  languages: []
  frameworks: []
  path_patterns: []
  agents: []
executable: false
`;

  return {
    metadataPath: `${artifactDir}/${artifactType === 'skill' ? 'skill' : 'rule'}.metadata.yml`,
    contentPath,
    content,
    metadata,
  };
}
