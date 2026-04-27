import { afterEach, describe, expect, it } from 'vitest';

import { seedTemporaryWorkspace } from '../test/workspace.js';
import { removePath } from '../utils/fs.js';
import { loadOrgRepository } from './load-org-repository.js';

describe('loadOrgRepository', () => {
  const temporaryPaths: string[] = [];

  afterEach(async () => {
    await Promise.all(temporaryPaths.map(async (path) => removePath(path)));
  });

  it('loads config defaults and both artifact types from disk', async () => {
    const rootPath = await seedTemporaryWorkspace('load-org-repository', [
      {
        path: 'tavik.config.yml',
        content: `version: 1
org:
  slug: acme
defaults: {}
sources: {}
`,
      },
      {
        path: 'skills/typescript/SKILL.md',
        content: '# TypeScript\n',
      },
      {
        path: 'skills/typescript/skill.metadata.yml',
        content: `name: typescript
description: Shared TS guidance
type: skill
applies_to:
  languages:
    - typescript
`,
      },
      {
        path: 'base-rules/default/base.md',
        content: '# Default\n',
      },
      {
        path: 'base-rules/default/rule.metadata.yml',
        content: `name: default
description: Always-on guidance
type: base-rule
mode: always
`,
      },
    ]);
    temporaryPaths.push(rootPath);

    const repository = await loadOrgRepository(rootPath);

    expect(repository.config.defaults).toEqual({
      auto_sync: true,
      preferred_agents: ['claude-code', 'cursor', 'codex'],
      sync_interval_minutes: 60,
    });
    expect(repository.artifacts).toHaveLength(2);
    expect(
      repository.artifacts.map((artifact) => artifact.metadata.name).sort(),
    ).toEqual(['default', 'typescript']);
    expect(
      repository.artifacts.find(
        (artifact) => artifact.metadata.name === 'default',
      )?.contentPath,
    ).toContain('base-rules/default/base.md');
  });

  it('throws when artifact metadata exists without the required content file', async () => {
    const rootPath = await seedTemporaryWorkspace('load-org-missing-content', [
      {
        path: 'tavik.config.yml',
        content: `version: 1
org:
  slug: acme
defaults: {}
sources: {}
`,
      },
      {
        path: 'skills/broken/skill.metadata.yml',
        content: `name: broken
description: Broken skill
type: skill
`,
      },
    ]);
    temporaryPaths.push(rootPath);

    await expect(loadOrgRepository(rootPath)).rejects.toThrow(
      'Missing artifact content file',
    );
  });
});
