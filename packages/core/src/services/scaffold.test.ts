import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { removePath } from '../utils/fs.js';
import { scaffoldArtifact, scaffoldOrgRepository } from './scaffold.js';

describe('scaffold services', () => {
  const temporaryPaths: string[] = [];

  afterEach(async () => {
    await Promise.all(temporaryPaths.map(async (path) => removePath(path)));
  });

  it('writes the initial org scaffold files', async () => {
    const root = await mkdtemp(join(tmpdir(), 'tavik-scaffold-'));
    temporaryPaths.push(root);

    const files = await scaffoldOrgRepository(root, 'acme');

    expect(files.length).toBeGreaterThan(0);
    await expect(
      readFile(join(root, 'tavik.config.yml'), 'utf8'),
    ).resolves.toContain('slug: acme');
    await expect(
      readFile(join(root, 'base-rules', 'org-default', 'base.md'), 'utf8'),
    ).resolves.toContain('Org Default Guidance');
  });

  it('writes new skill and base-rule artifacts', async () => {
    const root = await mkdtemp(join(tmpdir(), 'tavik-scaffold-'));
    temporaryPaths.push(root);

    const skillFiles = await scaffoldArtifact(root, 'skill', 'Billing Helpers');
    const ruleFiles = await scaffoldArtifact(
      root,
      'base-rule',
      'Billing Defaults',
    );

    const skillFile = skillFiles[0];
    const ruleFile = ruleFiles[0];
    if (skillFile === undefined || ruleFile === undefined) {
      throw new Error(
        'Expected scaffoldArtifact to return written file paths.',
      );
    }

    await expect(readFile(skillFile, 'utf8')).resolves.toContain(
      'Billing Helpers',
    );
    await expect(readFile(ruleFile, 'utf8')).resolves.toContain(
      'Billing Defaults',
    );
  });
});
