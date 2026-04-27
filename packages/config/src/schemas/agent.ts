import { z } from 'zod';

export const agentIdSchema = z.enum([
  'claude-code',
  'cursor',
  'codex',
  'generic-skills',
]);

export type AgentId = z.infer<typeof agentIdSchema>;

export const supportLevelSchema = z.enum([
  'full',
  'skills-only',
  'unsupported',
]);

export type SupportLevel = z.infer<typeof supportLevelSchema>;
