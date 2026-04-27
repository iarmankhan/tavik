import { describe, expect, it } from 'vitest';

import { runCommand } from './process.js';

describe('runCommand', () => {
  it('runs a command and captures stdout', async () => {
    const result = await runCommand([
      'node',
      '-e',
      'process.stdout.write("ok")',
    ]);

    expect(result.stdout).toBe('ok');
    expect(result.stderr).toBe('');
  });

  it('rejects empty command arrays before invoking execa', async () => {
    await expect(runCommand([])).rejects.toThrow(
      'runCommand requires at least one command segment.',
    );
  });
});
