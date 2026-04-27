import { basename, join } from 'node:path';
import { z } from 'zod';

import type { RepoFacts } from '../domain/types.js';
import { pathExists, readTextFile } from '../utils/fs.js';

async function detectLanguages(repoPath: string): Promise<string[]> {
  const languages = new Set<string>();

  if (await pathExists(join(repoPath, 'package.json'))) {
    languages.add('javascript');
    languages.add('typescript');
  }

  if (await pathExists(join(repoPath, 'tsconfig.json'))) {
    languages.add('typescript');
  }

  if (await pathExists(join(repoPath, 'pyproject.toml'))) {
    languages.add('python');
  }

  if (await pathExists(join(repoPath, 'go.mod'))) {
    languages.add('go');
  }

  return [...languages].sort();
}

async function detectFrameworks(repoPath: string): Promise<string[]> {
  const frameworks = new Set<string>();
  const packageJsonPath = join(repoPath, 'package.json');

  if (await pathExists(packageJsonPath)) {
    const rawPackageJson = await readTextFile(packageJsonPath);
    const packageJsonSchema = z.object({
      dependencies: z.record(z.string()).optional(),
      devDependencies: z.record(z.string()).optional(),
    });
    const parsed = packageJsonSchema.parse(JSON.parse(rawPackageJson));
    const dependencyNames = new Set<string>([
      ...Object.keys(parsed.dependencies ?? {}),
      ...Object.keys(parsed.devDependencies ?? {}),
    ]);

    if (dependencyNames.has('next')) {
      frameworks.add('nextjs');
    }

    if (dependencyNames.has('react')) {
      frameworks.add('react');
    }

    if (dependencyNames.has('vue')) {
      frameworks.add('vue');
    }
  }

  if (await pathExists(join(repoPath, 'pnpm-workspace.yaml'))) {
    frameworks.add('pnpm-workspace');
  }

  return [...frameworks].sort();
}

export async function inferRepoFacts(
  repoPath: string,
  repoName?: string,
): Promise<RepoFacts> {
  return {
    frameworks: await detectFrameworks(repoPath),
    languages: await detectLanguages(repoPath),
    path: repoPath,
    repoName: repoName ?? basename(repoPath),
  };
}
