import { z } from 'zod';

const nonEmptyStringSchema = z.string().trim().min(1);

export const selectorsSchema = z.object({
  repos: z.array(nonEmptyStringSchema).default([]),
  repo_patterns: z.array(nonEmptyStringSchema).default([]),
  languages: z.array(nonEmptyStringSchema).default([]),
  frameworks: z.array(nonEmptyStringSchema).default([]),
  path_patterns: z.array(nonEmptyStringSchema).default([]),
  agents: z.array(nonEmptyStringSchema).default([]),
});

export type Selectors = z.infer<typeof selectorsSchema>;
