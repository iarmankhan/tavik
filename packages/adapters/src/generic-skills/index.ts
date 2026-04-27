import { BaseAgentAdapter } from '../shared/base-adapter.js';
import { findExecutable } from '../shared/filesystem.js';
import type {
  AdapterEnvironment,
  AdapterPlanInput,
  AgentAdapterId,
  DetectionResult,
  ExternalAction,
  SupportLevel,
} from '../shared/types.js';

const GENERIC_SKILLS_COMMANDS: readonly string[] = [
  'skills',
  'npx',
  'pnpm',
  'bunx',
];

export class GenericSkillsAdapter extends BaseAgentAdapter {
  override readonly id: AgentAdapterId = 'generic-skills';

  protected override readonly adapterSupportLevel: SupportLevel = 'skills-only';

  protected override readonly detectionConfiguration = {
    executables: GENERIC_SKILLS_COMMANDS,
  };

  protected override async buildPrimaryArtifacts(
    _input: AdapterPlanInput,
  ): Promise<readonly []> {
    return [];
  }

  protected override async buildExternalActions(
    input: AdapterPlanInput,
    detection: DetectionResult,
  ): Promise<readonly ExternalAction[]> {
    if (detection.supportLevel === 'unsupported') {
      return [];
    }

    const commandPrefix = await this.resolveCommandPrefix();
    return input.skills.map((skill) => ({
      kind: 'skills-install',
      skillId: skill.id,
      description: `Install ${skill.displayName ?? skill.id} through the shared skills bridge.`,
      command: [...commandPrefix, skill.installSource ?? skill.sourcePath],
    }));
  }

  private async resolveCommandPrefix(): Promise<readonly string[]> {
    const directSkillsExecutable = await findExecutable(
      ['skills'],
      this.environmentVariables,
      this.fileSystem,
    );
    if (directSkillsExecutable !== undefined) {
      return ['skills', 'add'];
    }

    const npxExecutable = await findExecutable(
      ['npx'],
      this.environmentVariables,
      this.fileSystem,
    );
    if (npxExecutable !== undefined) {
      return ['npx', 'skills', 'add'];
    }

    const pnpmExecutable = await findExecutable(
      ['pnpm'],
      this.environmentVariables,
      this.fileSystem,
    );
    if (pnpmExecutable !== undefined) {
      return ['pnpm', 'dlx', 'skills', 'add'];
    }

    return ['bunx', 'skills', 'add'];
  }
}
