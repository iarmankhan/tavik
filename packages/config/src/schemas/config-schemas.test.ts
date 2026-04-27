import { describe, expect, it } from 'vitest';

import { artifactMetadataSchema } from './artifact.js';
import { orgConfigSchema } from './org-config.js';
import { selectorsSchema } from './selectors.js';

describe('config schemas', () => {
  it('defaults selector arrays and trims selector values', () => {
    const selectors = selectorsSchema.parse({
      languages: [' typescript '],
      repo_patterns: [' web.* '],
    });

    expect(selectors).toEqual({
      agents: [],
      frameworks: [],
      languages: ['typescript'],
      path_patterns: [],
      repo_patterns: ['web.*'],
      repos: [],
    });
  });

  it('rejects blank selector values after trimming', () => {
    expect(() =>
      selectorsSchema.parse({
        repos: ['   '],
      }),
    ).toThrow();
  });

  it('applies metadata defaults while preserving strict validation', () => {
    const metadata = artifactMetadataSchema.parse({
      applies_to: {
        languages: [' typescript '],
      },
      description: ' Shared TypeScript rules ',
      name: ' example-skill ',
      type: 'skill',
    });

    expect(metadata).toEqual({
      agents: [],
      applies_to: {
        agents: [],
        frameworks: [],
        languages: ['typescript'],
        path_patterns: [],
        repo_patterns: [],
        repos: [],
      },
      description: 'Shared TypeScript rules',
      enabled: true,
      executable: false,
      mode: 'auto',
      name: 'example-skill',
      priority: 50,
      source: 'org',
      type: 'skill',
    });
  });

  it('rejects metadata outside the allowed priority range', () => {
    expect(() =>
      artifactMetadataSchema.parse({
        description: 'Always on guidance',
        name: 'org-default',
        priority: 101,
        type: 'base-rule',
      }),
    ).toThrow();
  });

  it('defaults nested org config settings and enforces positive intervals', () => {
    const config = orgConfigSchema.parse({
      defaults: {},
      org: {
        slug: ' acme ',
      },
      sources: {},
      version: 1,
    });

    expect(config).toEqual({
      defaults: {
        auto_sync: true,
        preferred_agents: ['claude-code', 'cursor', 'codex'],
        sync_interval_minutes: 60,
      },
      org: {
        slug: 'acme',
      },
      sources: {
        local_overrides: true,
      },
      version: 1,
    });

    expect(() =>
      orgConfigSchema.parse({
        defaults: {
          sync_interval_minutes: 0,
        },
        org: {
          slug: 'acme',
        },
        sources: {},
        version: 1,
      }),
    ).toThrow();
  });
});
