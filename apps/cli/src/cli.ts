import { join, resolve } from 'node:path';
import { cwd } from 'node:process';
import {
  type AgentId,
  DEFAULT_CONFIG_FILE_NAME,
} from '@org-agent-skills/config';
import {
  buildEffectivePlan,
  connectMachine,
  disconnectMachine,
  explainPlan,
  loadOrgRepository,
  readStatus,
  scaffoldArtifact,
  scaffoldOrgRepository,
  syncMachine,
  validateOrgRepository,
} from '@org-agent-skills/core';
import { Command } from 'commander';

import { ensureValue } from './commands/helpers.js';
import { renderOutput } from './output/render.js';

const CLI_VERSION = '0.1.3';

type CommonOptions = {
  json?: boolean;
};

type InitOrgOptions = CommonOptions & {
  orgSlug?: string;
  path?: string;
};

type ValidateOptions = CommonOptions & {
  orgRoot?: string;
};

type ContextOptions = CommonOptions & {
  agent: AgentId;
  machineRoot?: string;
  orgRoot?: string;
  repoName?: string;
  repoPath?: string;
};

type ConnectOptions = CommonOptions & {
  machineRoot?: string;
  orgRoot?: string;
  orgSource?: string;
};

type NewArtifactOptions = CommonOptions & {
  name?: string;
  orgRoot?: string;
};

type StatusOptions = CommonOptions & {
  machineRoot?: string;
};

function buildPreviewInput(options: ContextOptions): {
  agentId: AgentId;
  repoName?: string;
  repoPath: string;
} {
  return {
    agentId: options.agent,
    repoPath: resolveRepoPath(options.repoPath),
    ...(options.repoName === undefined ? {} : { repoName: options.repoName }),
  };
}

function resolveOrgRoot(orgRoot: string | undefined): string {
  return resolve(orgRoot ?? cwd());
}

function resolveOptionalOrgRoot(
  orgRoot: string | undefined,
): string | undefined {
  return orgRoot === undefined ? undefined : resolve(orgRoot);
}

function resolveRepoPath(repoPath: string | undefined): string {
  return resolve(repoPath ?? cwd());
}

function resolveMachineRoot(machineRoot: string | undefined): string {
  return resolve(machineRoot ?? cwd());
}

async function printResult(
  value: unknown,
  asJson: boolean | undefined,
): Promise<void> {
  process.stdout.write(renderOutput(value, asJson ?? false));
}

export function createProgram(): Command {
  const program = new Command();
  const newCommand = new Command('new').description(
    'Scaffold a new skill or base rule',
  );

  program
    .name('tavik')
    .description(
      'Manage org-wide skills and always-on guidance for coding agents.',
    )
    .version(CLI_VERSION);

  program
    .command('init-org')
    .option('--org-slug <slug>', 'organization slug')
    .option('--path <path>', 'target directory')
    .option('--json', 'render JSON output')
    .action(async (options: InitOrgOptions) => {
      const orgSlug = await ensureValue(
        options.orgSlug,
        'Organization slug',
        'acme',
      );
      const targetPath = resolve(options.path ?? cwd());
      const files = await scaffoldOrgRepository(targetPath, orgSlug);
      await printResult(
        {
          configFile: join(targetPath, DEFAULT_CONFIG_FILE_NAME),
          files,
          orgSlug,
        },
        options.json,
      );
    });

  program
    .command('validate')
    .option('--org-root <path>', 'path to the org source repository')
    .option('--json', 'render JSON output')
    .action(async (options: ValidateOptions) => {
      const repository = await loadOrgRepository(
        resolveOrgRoot(options.orgRoot),
      );
      const result = await validateOrgRepository(repository);
      await printResult(result, options.json);
      process.exitCode = result.valid ? 0 : 1;
    });

  program
    .command('preview')
    .requiredOption(
      '--agent <agent>',
      'agent id: claude-code, cursor, codex, generic-skills',
    )
    .option('--org-root <path>', 'path to the org source repository')
    .option('--machine-root <path>', 'path to the managed machine root')
    .option('--repo-path <path>', 'path to the target repo')
    .option('--repo-name <name>', 'override the repo name')
    .option('--json', 'render JSON output')
    .action(async (options: ContextOptions) => {
      const plan = await buildEffectivePlan(
        resolveOrgRoot(options.orgRoot),
        buildPreviewInput(options),
        resolveMachineRoot(options.machineRoot),
      );
      await printResult(plan, options.json);
    });

  program
    .command('why')
    .requiredOption(
      '--agent <agent>',
      'agent id: claude-code, cursor, codex, generic-skills',
    )
    .option('--org-root <path>', 'path to the org source repository')
    .option('--machine-root <path>', 'path to the managed machine root')
    .option('--repo-path <path>', 'path to the target repo')
    .option('--repo-name <name>', 'override the repo name')
    .option('--json', 'render JSON output')
    .action(async (options: ContextOptions) => {
      const explanation = await explainPlan(
        resolveOptionalOrgRoot(options.orgRoot),
        resolveMachineRoot(options.machineRoot),
        buildPreviewInput(options),
      );
      await printResult(
        options.json
          ? {
              explanation,
            }
          : explanation,
        options.json,
      );
    });

  program
    .command('connect')
    .option('--org-source <ref>', 'local path or Git URL for the org source')
    .option('--org-root <path>', 'deprecated alias for --org-source')
    .option('--machine-root <path>', 'path to the managed machine root')
    .option('--json', 'render JSON output')
    .action(async (options: ConnectOptions) => {
      const sourceReference = options.orgSource ?? options.orgRoot;
      if (sourceReference === undefined) {
        throw new Error('connect requires --org-source or --org-root.');
      }
      const result = await connectMachine(
        sourceReference,
        resolveMachineRoot(options.machineRoot),
      );
      await printResult(result, options.json);
    });

  program
    .command('sync')
    .requiredOption(
      '--agent <agent>',
      'agent id: claude-code, cursor, codex, generic-skills',
    )
    .option('--org-root <path>', 'path to the org source repository')
    .option('--machine-root <path>', 'path to the managed machine root')
    .option('--repo-path <path>', 'path to the target repo')
    .option('--repo-name <name>', 'override the repo name')
    .option('--json', 'render JSON output')
    .action(async (options: ContextOptions & ConnectOptions) => {
      const result = await syncMachine(
        resolveOptionalOrgRoot(options.orgRoot),
        resolveMachineRoot(options.machineRoot),
        buildPreviewInput(options),
      );
      await printResult(result, options.json);
    });

  program
    .command('status')
    .option('--machine-root <path>', 'path to the managed machine root')
    .option('--json', 'render JSON output')
    .action(async (options: StatusOptions) => {
      const output = await readStatus(resolveMachineRoot(options.machineRoot));
      await printResult(
        options.json ? { status: output } : output,
        options.json,
      );
    });

  program
    .command('disconnect')
    .option('--machine-root <path>', 'path to the managed machine root')
    .option('--json', 'render JSON output')
    .action(async (options: StatusOptions) => {
      const result = await disconnectMachine(
        resolveMachineRoot(options.machineRoot),
      );
      await printResult(result, options.json);
    });

  newCommand
    .command('skill')
    .option('--name <name>', 'skill name')
    .option('--org-root <path>', 'path to the org source repository')
    .option('--json', 'render JSON output')
    .action(async (options: NewArtifactOptions) => {
      const name = await ensureValue(options.name, 'Skill name', 'new-skill');
      const files = await scaffoldArtifact(
        resolveOrgRoot(options.orgRoot),
        'skill',
        name,
      );
      await printResult({ files, name, type: 'skill' }, options.json);
    });

  newCommand
    .command('base-rule')
    .option('--name <name>', 'base rule name')
    .option('--org-root <path>', 'path to the org source repository')
    .option('--json', 'render JSON output')
    .action(async (options: NewArtifactOptions) => {
      const name = await ensureValue(
        options.name,
        'Base rule name',
        'new-base-rule',
      );
      const files = await scaffoldArtifact(
        resolveOrgRoot(options.orgRoot),
        'base-rule',
        name,
      );
      await printResult({ files, name, type: 'base-rule' }, options.json);
    });

  program.addCommand(newCommand);

  return program;
}

export async function run(argv: readonly string[]): Promise<void> {
  try {
    await createProgram().parseAsync([...argv]);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  }
}
