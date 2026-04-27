import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: [
      'packages/**/*.test.ts',
      'packages/**/test/**/*.test.ts',
      'apps/**/src/**/*.test.ts',
    ],
    environment: 'node',
    coverage: {
      excludeAfterRemap: true,
      exclude: [
        '**/*.d.ts',
        '**/dist/**',
        '**/node_modules/**',
        '**/*.test.ts',
        '**/test/**',
        'packages/core/src/test/**',
        'vitest.config.ts',
        'packages/adapters/vitest.config.ts',
        'packages/adapters/src/index.ts',
        'packages/adapters/src/shared/types.ts',
        'packages/config/src/index.ts',
        'packages/core/src/index.ts',
        'packages/core/src/domain/types.ts',
        'packages/testkit/src/index.ts',
        'apps/cli/src/cli.ts',
        'apps/cli/src/index.ts',
      ],
      provider: 'v8',
      reporter: ['text', 'lcov'],
      thresholds: {
        branches: 80,
        functions: 85,
        lines: 85,
        statements: 85,
      },
    },
  },
});
