import type { EffectivePlan } from '../domain/types.js';

export function renderPlanSummary(plan: EffectivePlan): string {
  const lines: string[] = [];

  lines.push(`Agent: ${plan.agentId}`);
  lines.push(`Support: ${plan.support.supportLevel}`);
  lines.push(`Detection: ${plan.support.summary}`);
  lines.push(`Repo: ${plan.repoFacts.repoName}`);
  lines.push(
    `Languages: ${plan.repoFacts.languages.join(', ') || 'none detected'}`,
  );
  lines.push(
    `Frameworks: ${plan.repoFacts.frameworks.join(', ') || 'none detected'}`,
  );
  lines.push('');
  lines.push('Applicable base rules:');
  lines.push(
    ...(plan.applicableBaseRules.length > 0
      ? plan.applicableBaseRules.map(
          (item) =>
            `- ${item.artifact.metadata.name}: ${item.match.reasons.join('; ')}`,
        )
      : ['- none']),
  );
  lines.push('');
  lines.push('Applicable skills:');
  lines.push(
    ...(plan.applicableSkills.length > 0
      ? plan.applicableSkills.map(
          (item) =>
            `- ${item.artifact.metadata.name}: ${item.match.reasons.join('; ')}`,
        )
      : ['- none']),
  );
  lines.push('');
  lines.push('Precedence:');
  lines.push(...plan.precedence.reasons.map((reason) => `- ${reason}`));
  lines.push('');
  lines.push('Adapter plan:');
  lines.push(`- ${plan.adapterPlan.summary}`);

  return lines.join('\n');
}
