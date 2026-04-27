import { execa } from 'execa';

export async function runCommand(
  command: readonly string[],
  options?: {
    cwd?: string;
    env?: Readonly<Record<string, string | undefined>>;
  },
): Promise<{ stderr: string; stdout: string }> {
  const file = command[0];
  if (file === undefined) {
    throw new Error('runCommand requires at least one command segment.');
  }
  const argumentsList = command.slice(1);
  const commandOptions = {
    reject: true,
    ...(options?.cwd === undefined ? {} : { cwd: options.cwd }),
    ...(options?.env === undefined ? {} : { env: options.env }),
  };
  const result = await execa(file, argumentsList, {
    ...commandOptions,
  });

  return {
    stderr: result.stderr,
    stdout: result.stdout,
  };
}
