import {
  type AdapterEnvironment,
  type AgentAdapter,
  type AgentAdapterId,
  ClaudeCodeAdapter,
  CodexAdapter,
  CursorAdapter,
  GenericSkillsAdapter,
} from '@org-agent-skills/adapters';
import type { AgentId, SupportLevel } from '@org-agent-skills/config';

export function createAdapter(
  agentId: AgentId,
  environment: AdapterEnvironment,
): AgentAdapter {
  switch (agentId) {
    case 'claude-code':
      return new ClaudeCodeAdapter(environment);
    case 'cursor':
      return new CursorAdapter(environment);
    case 'codex':
      return new CodexAdapter(environment);
    case 'generic-skills':
      return new GenericSkillsAdapter(environment);
  }
}

export async function detectSupportLevels(
  environment: AdapterEnvironment,
): Promise<Record<AgentId, SupportLevel>> {
  const agentIds: AgentAdapterId[] = [
    'claude-code',
    'cursor',
    'codex',
    'generic-skills',
  ];
  const supportEntries = await Promise.all(
    agentIds.map(async (agentId) => {
      const adapter = createAdapter(agentId, environment);
      const detection = await adapter.detect();
      return {
        agentId,
        supportLevel: detection.supportLevel,
      };
    }),
  );

  const supportByAgent: Record<AgentId, SupportLevel> = {
    'claude-code': 'unsupported',
    cursor: 'unsupported',
    codex: 'unsupported',
    'generic-skills': 'unsupported',
  };

  for (const entry of supportEntries) {
    supportByAgent[entry.agentId] = entry.supportLevel;
  }

  return supportByAgent;
}
