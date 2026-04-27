import { describe, expect, it } from 'vitest';

import { buildInitialOrgScaffold } from './init-org.js';
import { buildNewArtifactScaffold } from './new-artifact.js';

describe('config templates', () => {
  it('builds an initial scaffold with schema-valid config and metadata', () => {
    const scaffoldFiles = buildInitialOrgScaffold('northwind');

    expect(scaffoldFiles.map((file) => file.path)).toEqual([
      'tavik.config.yml',
      'skills/example-typescript-skill/SKILL.md',
      'skills/example-typescript-skill/skill.metadata.yml',
      'base-rules/org-default/base.md',
      'base-rules/org-default/rule.metadata.yml',
      'README.md',
    ]);

    const configFile = scaffoldFiles.find(
      (file) => file.path === 'tavik.config.yml',
    );
    const skillMetadataFile = scaffoldFiles.find(
      (file) =>
        file.path === 'skills/example-typescript-skill/skill.metadata.yml',
    );
    const baseRuleMetadataFile = scaffoldFiles.find(
      (file) => file.path === 'base-rules/org-default/rule.metadata.yml',
    );

    expect(configFile).toBeDefined();
    expect(skillMetadataFile).toBeDefined();
    expect(baseRuleMetadataFile).toBeDefined();

    expect(configFile?.content).toContain('slug: northwind');
    expect(configFile?.content).toContain('sync_interval_minutes: 60');
    expect(configFile?.content).toContain('local_overrides: true');
    expect(skillMetadataFile?.content).toContain(
      'name: example-typescript-skill',
    );
    expect(skillMetadataFile?.content).toContain('type: skill');
    expect(skillMetadataFile?.content).toContain('    - typescript');
    expect(baseRuleMetadataFile?.content).toContain('name: org-default');
    expect(baseRuleMetadataFile?.content).toContain('type: base-rule');
    expect(baseRuleMetadataFile?.content).toContain('mode: always');
  });

  it('normalizes new artifact scaffolds for skills and base rules', () => {
    const skillScaffold = buildNewArtifactScaffold(
      'skill',
      '  API Review Checklist  ',
    );
    const baseRuleScaffold = buildNewArtifactScaffold(
      'base-rule',
      'Org Default',
    );

    expect(skillScaffold.contentPath).toBe(
      'skills/api-review-checklist/SKILL.md',
    );
    expect(skillScaffold.metadataPath).toBe(
      'skills/api-review-checklist/skill.metadata.yml',
    );
    expect(skillScaffold.content).toContain('#   API Review Checklist  ');

    expect(baseRuleScaffold.contentPath).toBe('base-rules/org-default/base.md');
    expect(skillScaffold.metadata).toContain('name: api-review-checklist');
    expect(skillScaffold.metadata).toContain('mode: auto');
    expect(baseRuleScaffold.metadata).toContain('name: org-default');
    expect(baseRuleScaffold.metadata).toContain('mode: always');
  });
});
