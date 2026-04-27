import * as path from 'node:path';

import { BaseAgentAdapter } from '../shared/base-adapter.js';
import { renderCursorRuleDocument } from '../shared/rendering.js';
import type {
  AdapterEnvironment,
  AdapterPlanInput,
  AgentAdapterId,
  SupportLevel,
} from '../shared/types.js';

export class CursorAdapter extends BaseAgentAdapter {
  override readonly id: AgentAdapterId = 'cursor';

  protected override readonly adapterSupportLevel: SupportLevel = 'full';

  protected override readonly detectionConfiguration = {
    executables: ['cursor'],
    environmentVariables: ['CURSOR_INSTALL_DIR'],
  };

  protected override async buildPrimaryArtifacts(
    input: AdapterPlanInput,
  ): Promise<
    readonly {
      path: string;
      content: string;
      role: 'rule';
      reason: string;
    }[]
  > {
    return [
      {
        path: path.join(this.workspaceRoot, '.cursor', 'rules', 'tavik.mdc'),
        content: renderCursorRuleDocument({
          baseGuidance: input.baseGuidance,
          skills: input.skills,
        }),
        role: 'rule',
        reason:
          'Render always-on guidance as an always-applied Cursor MDC rule.',
      },
    ];
  }
}
