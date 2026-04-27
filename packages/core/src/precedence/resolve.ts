import type {
  ApplicableArtifact,
  PrecedenceDecision,
} from '../domain/types.js';

function precedenceTier(matchReasons: string[]): number {
  if (matchReasons.some((reason) => reason.includes('exact selector'))) {
    return 0;
  }

  if (matchReasons.some((reason) => reason.includes('pattern selector'))) {
    return 1;
  }

  return 2;
}

export function resolveBaseRulePrecedence(
  applicableBaseRules: ApplicableArtifact[],
): { decision: PrecedenceDecision; chosen: ApplicableArtifact[] } {
  const sorted = [...applicableBaseRules].sort((left, right) => {
    const tierDelta =
      precedenceTier(left.match.reasons) - precedenceTier(right.match.reasons);
    if (tierDelta !== 0) {
      return tierDelta;
    }

    const priorityDelta =
      right.artifact.metadata.priority - left.artifact.metadata.priority;
    if (priorityDelta !== 0) {
      return priorityDelta;
    }

    return left.artifact.metadata.name.localeCompare(
      right.artifact.metadata.name,
    );
  });

  const topChoice = sorted.at(0);
  const chosen = topChoice === undefined ? [] : [topChoice];
  const discarded = sorted.slice(1);

  return {
    chosen,
    decision: {
      chosenArtifactNames: chosen.map((item) => item.artifact.metadata.name),
      discardedArtifactNames: discarded.map(
        (item) => item.artifact.metadata.name,
      ),
      reasons:
        topChoice !== undefined
          ? [
              `selected "${topChoice.artifact.metadata.name}" by precedence tier, priority, then lexical order`,
            ]
          : ['no applicable base rules found'],
    },
  };
}
