import { describe, expect, it } from 'vitest';

import type { RepoFacts } from '../domain/types.js';
import { matchSelectors } from './match-selectors.js';

const baseRepoFacts: RepoFacts = {
  frameworks: ['nextjs', 'react'],
  languages: ['javascript', 'typescript'],
  path: '/repos/web.app/packages/api',
  repoName: 'web.app',
};

describe('matchSelectors', () => {
  it('treats empty selectors as non-restrictive', () => {
    const match = matchSelectors(
      {
        agents: [],
        frameworks: [],
        languages: [],
        path_patterns: [],
        repo_patterns: [],
        repos: [],
      },
      baseRepoFacts,
      'codex',
    );

    expect(match).toEqual({
      matched: true,
      reasons: ['artifact has no restrictive selectors'],
      selectors: {
        agents: [],
        frameworks: [],
        languages: [],
        path_patterns: [],
        repo_patterns: [],
        repos: [],
      },
    });
  });

  it('requires every restrictive selector and records the match reasons', () => {
    const match = matchSelectors(
      {
        agents: ['codex'],
        frameworks: ['react'],
        languages: ['typescript'],
        path_patterns: ['/repos/*/packages/*'],
        repo_patterns: ['web.*'],
        repos: ['web.app'],
      },
      baseRepoFacts,
      'codex',
    );

    expect(match.matched).toBe(true);
    expect(match.reasons).toEqual([
      'repo matched exact selector "web.app"',
      'repo matched pattern selector',
      'language selector matched inferred repo language',
      'framework selector matched inferred repo framework',
      'path selector matched repo path',
      'agent selector matched "codex"',
    ]);
  });

  it('escapes regex characters in wildcard selectors instead of overmatching', () => {
    const match = matchSelectors(
      {
        agents: [],
        frameworks: [],
        languages: [],
        path_patterns: [],
        repo_patterns: ['web.app-*'],
        repos: [],
      },
      {
        ...baseRepoFacts,
        repoName: 'webxapp-prod',
      },
      'codex',
    );

    expect(match.matched).toBe(false);
    expect(match.reasons).toEqual([]);
  });

  it('preserves earlier reasons when a later selector fails', () => {
    const match = matchSelectors(
      {
        agents: ['cursor'],
        frameworks: ['nextjs'],
        languages: ['typescript'],
        path_patterns: [],
        repo_patterns: [],
        repos: [],
      },
      baseRepoFacts,
      'codex',
    );

    expect(match.matched).toBe(false);
    expect(match.reasons).toEqual([
      'language selector matched inferred repo language',
      'framework selector matched inferred repo framework',
    ]);
  });
});
