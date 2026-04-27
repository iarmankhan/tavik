import { afterEach, describe, expect, it } from 'vitest';

import {
  createTemporaryWorkspace,
  writeWorkspaceFiles,
} from '../test/workspace.js';
import { removePath } from '../utils/fs.js';
import { inferRepoFacts } from './infer-repo-facts.js';

describe('inferRepoFacts', () => {
  const temporaryPaths: string[] = [];

  afterEach(async () => {
    await Promise.all(temporaryPaths.map(async (path) => removePath(path)));
  });

  it('infers sorted languages and frameworks from common repo markers', async () => {
    const rootPath = await createTemporaryWorkspace('repo-facts');
    temporaryPaths.push(rootPath);

    await writeWorkspaceFiles(rootPath, [
      {
        path: 'package.json',
        content: JSON.stringify({
          dependencies: {
            next: '15.0.0',
            react: '19.0.0',
          },
          devDependencies: {
            vue: '3.0.0',
          },
        }),
      },
      {
        path: 'tsconfig.json',
        content: '{}',
      },
      {
        path: 'pyproject.toml',
        content: '[project]\nname = "repo-facts"\n',
      },
      {
        path: 'go.mod',
        content: 'module example.com/repo-facts\n',
      },
      {
        path: 'pnpm-workspace.yaml',
        content: 'packages:\n  - packages/*\n',
      },
    ]);

    const facts = await inferRepoFacts(rootPath);

    expect(facts.repoName).toBe(rootPath.split('/').at(-1));
    expect(facts.languages).toEqual([
      'go',
      'javascript',
      'python',
      'typescript',
    ]);
    expect(facts.frameworks).toEqual([
      'nextjs',
      'pnpm-workspace',
      'react',
      'vue',
    ]);
  });

  it('uses an explicit repo name override when provided', async () => {
    const rootPath = await createTemporaryWorkspace('repo-facts-override');
    temporaryPaths.push(rootPath);

    const facts = await inferRepoFacts(rootPath, 'billing-api');

    expect(facts.repoName).toBe('billing-api');
    expect(facts.languages).toEqual([]);
    expect(facts.frameworks).toEqual([]);
  });
});
