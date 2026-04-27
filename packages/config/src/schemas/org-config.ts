import { z } from 'zod';

import { agentIdSchema } from './agent.js';

const nonEmptyStringSchema = z.string().trim().min(1);

export const orgConfigSchema = z.object({
  version: z.literal(1),
  org: z.object({
    slug: nonEmptyStringSchema,
  }),
  defaults: z.object({
    auto_sync: z.boolean().default(true),
    sync_interval_minutes: z.number().int().positive().default(60),
    preferred_agents: z
      .array(agentIdSchema)
      .default(['claude-code', 'cursor', 'codex']),
  }),
  sources: z.object({
    local_overrides: z.boolean().default(true),
  }),
});

export type OrgConfig = z.infer<typeof orgConfigSchema>;
