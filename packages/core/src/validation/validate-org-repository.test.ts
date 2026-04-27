import { afterEach, describe, expect, it } from 'vitest';

import { loadOrgRepository } from '../config/load-org-repository.js';
import { scaffoldOrgRepository } from '../services/scaffold.js';
import { seedTemporaryWorkspace } from '../test/workspace.js';
import { removePath } from '../utils/fs.js';
import { validateOrgRepository } from './validate-org-repository.js';

describe('validateOrgRepository', () => {
  const temporaryPaths: string[] = [];

  afterEach(async () => {
    await Promise.all(temporaryPaths.map(async (path) => removePath(path)));
  });

  it('accepts the default scaffold', async () => {
    const root = await seedTemporaryWorkspace('tavik', []);
    temporaryPaths.push(root);

    await scaffoldOrgRepository(root, 'acme');
    const repository = await loadOrgRepository(root);
    const result = await validateOrgRepository(repository);

    expect(result.valid).toBe(true);
    expect(result.messages).toHaveLength(0);
  });

  it('warns when no artifacts are present', async () => {
    const root = await seedTemporaryWorkspace('empty-org-repository', [
      {
        path: 'tavik.config.yml',
        content: `version: 1
org:
  slug: acme
defaults: {}
sources: {}
`,
      },
    ]);
    temporaryPaths.push(root);

    const repository = await loadOrgRepository(root);
    const result = await validateOrgRepository(repository);

    expect(result.valid).toBe(true);
    expect(result.messages).toEqual([
      {
        level: 'warning',
        message:
          'No skill or base-rule artifacts were found in the org repository.',
        path: root,
      },
    ]);
  });

  it('reports duplicate artifact names and missing executable scripts as errors', async () => {
    const root = await seedTemporaryWorkspace('invalid-org-repository', [
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
        path: 'skills/one/SKILL.md',
        content: '# One\n',
      },
      {
        path: 'skills/one/skill.metadata.yml',
        content: `name: duplicate
description: First copy
type: skill
`,
      },
      {
        path: 'skills/two/SKILL.md',
        content: '# Two\n',
      },
      {
        path: 'skills/two/skill.metadata.yml',
        content: `name: duplicate
description: Second copy
type: skill
executable: true
`,
      },
    ]);
    temporaryPaths.push(root);

    const repository = await loadOrgRepository(root);
    const result = await validateOrgRepository(repository);

    expect(result.valid).toBe(false);
    expect(result.messages).toEqual(
      expect.arrayContaining([
        {
          level: 'error',
          message: 'Duplicate artifact name "duplicate".',
          path: 'skills/two',
        },
        {
          level: 'error',
          message:
            'Artifact is marked executable but does not include a scripts directory.',
          path: 'skills/two',
        },
      ]),
    );
  });

  it('downgrades executable artifacts with scripts directories to warnings', async () => {
    const root = await seedTemporaryWorkspace('reviewable-executable', [
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
        path: 'skills/reviewable/SKILL.md',
        content: '# Reviewable\n',
      },
      {
        path: 'skills/reviewable/skill.metadata.yml',
        content: `name: reviewable
description: Reviewable executable content
type: skill
executable: true
`,
      },
      {
        path: 'skills/reviewable/scripts/run.sh',
        content: '#!/usr/bin/env sh\nexit 0\n',
      },
    ]);
    temporaryPaths.push(root);

    const repository = await loadOrgRepository(root);
    const result = await validateOrgRepository(repository);

    expect(result.valid).toBe(true);
    expect(result.messages).toEqual([
      {
        level: 'warning',
        message:
          'Artifact contains executable content that should be reviewed as code.',
        path: 'skills/reviewable',
      },
    ]);
  });
});
