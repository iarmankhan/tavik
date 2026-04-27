import { describe, expect, it } from 'vitest';

import { parseYaml, stringifyYaml } from './yaml.js';

describe('yaml helpers', () => {
  it('parses yaml into unknown values', () => {
    const parsed = parseYaml('name: acme\ncount: 2\n');

    expect(parsed).toEqual({
      count: 2,
      name: 'acme',
    });
  });

  it('stringifies plain objects to yaml', () => {
    const yaml = stringifyYaml({
      enabled: true,
      name: 'acme',
    });

    expect(yaml).toContain('enabled: true');
    expect(yaml).toContain('name: acme');
  });
});
