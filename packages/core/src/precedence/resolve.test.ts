import { describe, expect, it } from 'vitest';

import { artifactMetadataSchema } from '@org-agent-skills/config';

import type { ApplicableArtifact } from '../domain/types.js';
import { resolveBaseRulePrecedence } from './resolve.js';

function createApplicableArtifact(
  name: string,
  priority: number,
  reasons: string[],
): ApplicableArtifact {
  return {
    artifact: {
      content: `# ${name}\n`,
      contentPath: `/virtual/${name}/base.md`,
      directoryPath: `/virtual/${name}`,
      metadata: artifactMetadataSchema.parse({
        description: `${name} description`,
        mode: 'always',
        name,
        priority,
        type: 'base-rule',
      }),
      metadataPath: `/virtual/${name}/rule.metadata.yml`,
    },
    match: {
      matched: true,
      reasons,
      selectors: {
        agents: [],
        frameworks: [],
        languages: [],
        path_patterns: [],
        repo_patterns: [],
        repos: [],
      },
    },
  };
}

describe('resolveBaseRulePrecedence', () => {
  it('prefers exact matches over higher-priority pattern and generic matches', () => {
    const exact = createApplicableArtifact('repo-exact', 5, [
      'repo matched exact selector "billing-api"',
    ]);
    const pattern = createApplicableArtifact('repo-pattern', 100, [
      'repo matched pattern selector',
    ]);
    const generic = createApplicableArtifact('repo-generic', 100, [
      'artifact has no restrictive selectors',
    ]);

    const result = resolveBaseRulePrecedence([generic, pattern, exact]);

    expect(result.chosen.map((item) => item.artifact.metadata.name)).toEqual([
      'repo-exact',
    ]);
    expect(result.decision.discardedArtifactNames).toEqual([
      'repo-pattern',
      'repo-generic',
    ]);
  });

  it('falls back to priority and lexical order within the same precedence tier', () => {
    const highPriority = createApplicableArtifact('zebra-rule', 90, [
      'repo matched pattern selector',
    ]);
    const lowPriority = createApplicableArtifact('aardvark-rule', 10, [
      'repo matched pattern selector',
    ]);
    const lexicalWinner = createApplicableArtifact('aardvark-rule', 90, [
      'repo matched pattern selector',
    ]);

    const result = resolveBaseRulePrecedence([
      highPriority,
      lowPriority,
      lexicalWinner,
    ]);

    expect(result.chosen.map((item) => item.artifact.metadata.name)).toEqual([
      'aardvark-rule',
    ]);
    expect(result.decision.reasons).toEqual([
      'selected "aardvark-rule" by precedence tier, priority, then lexical order',
    ]);
  });

  it('returns an empty decision when no base rules apply', () => {
    const result = resolveBaseRulePrecedence([]);

    expect(result.chosen).toEqual([]);
    expect(result.decision).toEqual({
      chosenArtifactNames: [],
      discardedArtifactNames: [],
      reasons: ['no applicable base rules found'],
    });
  });
});
