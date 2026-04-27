import { z } from 'zod';

import { agentIdSchema } from './agent.js';
import { selectorsSchema } from './selectors.js';

const artifactTypeSchema = z.enum(['skill', 'base-rule']);
const modeSchema = z.enum(['always', 'auto', 'manual']);

export const artifactMetadataSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().min(1),
  type: artifactTypeSchema,
  enabled: z.boolean().default(true),
  mode: modeSchema.default('auto'),
  priority: z.number().int().min(0).max(100).default(50),
  source: z.string().trim().min(1).default('org'),
  agents: z.array(agentIdSchema).default([]),
  applies_to: selectorsSchema.default({}),
  executable: z.boolean().default(false),
});

export type ArtifactMetadata = z.infer<typeof artifactMetadataSchema>;
export type ArtifactType = z.infer<typeof artifactTypeSchema>;
export type ArtifactMode = z.infer<typeof modeSchema>;
