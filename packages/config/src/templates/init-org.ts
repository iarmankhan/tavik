import type { OrgConfig } from '../schemas/org-config.js';

export const DEFAULT_ORG_CONFIG: OrgConfig = {
  version: 1,
  org: {
    slug: 'acme',
  },
  defaults: {
    auto_sync: true,
    sync_interval_minutes: 60,
    preferred_agents: ['claude-code', 'cursor', 'codex'],
  },
  sources: {
    local_overrides: true,
  },
};

export type ScaffoldFile = {
  path: string;
  content: string;
};

export function buildInitialOrgScaffold(orgSlug: string): ScaffoldFile[] {
  const config = {
    ...DEFAULT_ORG_CONFIG,
    org: {
      slug: orgSlug,
    },
  };

  return [
    {
      path: 'tavik.config.yml',
      content: `version: 1
org:
  slug: ${config.org.slug}
defaults:
  auto_sync: ${config.defaults.auto_sync}
  sync_interval_minutes: ${config.defaults.sync_interval_minutes}
  preferred_agents:
    - claude-code
    - cursor
    - codex
sources:
  local_overrides: ${config.sources.local_overrides}
`,
    },
    {
      path: 'skills/example-typescript-skill/SKILL.md',
      content: `# Example TypeScript Skill

## Purpose

Shared TypeScript workflow guidance for org projects.

## When to use

- Working on a TypeScript codebase
- Updating project conventions or tooling

## Instructions

- Prefer strict TypeScript.
- Keep package exports explicit.
- Preserve deterministic tooling behavior.
`,
    },
    {
      path: 'skills/example-typescript-skill/skill.metadata.yml',
      content: `name: example-typescript-skill
description: Shared TypeScript workflow guidance
type: skill
enabled: true
mode: auto
priority: 50
source: org
agents:
  - claude-code
  - cursor
  - codex
applies_to:
  languages:
    - typescript
  frameworks: []
  path_patterns: []
  repo_patterns: []
  repos: []
  agents: []
executable: false
`,
    },
    {
      path: 'base-rules/org-default/base.md',
      content: `# Org Default Guidance

- Follow normal code review and Git workflows.
- Keep generated machine-managed files clearly labeled.
- Avoid hidden local mutation and prefer explainable behavior.
`,
    },
    {
      path: 'base-rules/org-default/rule.metadata.yml',
      content: `name: org-default
description: Always-on organization default guidance
type: base-rule
enabled: true
mode: always
priority: 10
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
`,
    },
    {
      path: 'README.md',
      content: `# ${orgSlug} Org Agent Skills

This repository stores:

- always-on base guidance
- reusable standard skills
- org-specific routing metadata

Use normal Git review and ownership controls to evolve this content safely.
`,
    },
  ];
}
