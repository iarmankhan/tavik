import { chmod, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { build } from 'esbuild';

await build({
  bundle: true,
  entryPoints: ['src/index.ts', 'src/cli.ts'],
  format: 'cjs',
  outbase: 'src',
  outdir: 'dist',
  outExtension: {
    '.js': '.cjs',
  },
  platform: 'node',
  target: 'node22',
  tsconfig: 'tsconfig.json',
});

const wrapperPath = join('dist', 'index.js');
await writeFile(
  wrapperPath,
  '#!/usr/bin/env node\nimport "./index.cjs";\n',
  'utf8',
);
await chmod(wrapperPath, 0o755);
