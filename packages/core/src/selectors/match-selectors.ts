import type { AgentId } from '@org-agent-skills/config';

import type { RepoFacts, SelectorMatch } from '../domain/types.js';

function wildcardToRegExp(pattern: string): RegExp {
  const escaped = pattern.replaceAll(/[.+^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^${escaped.replaceAll('*', '.*')}$`);
}

function intersects(left: string[], right: string[]): boolean {
  const rightSet = new Set(right);
  return left.some((value) => rightSet.has(value));
}

export function matchSelectors(
  selectors: {
    agents: string[];
    frameworks: string[];
    languages: string[];
    path_patterns: string[];
    repo_patterns: string[];
    repos: string[];
  },
  repoFacts: RepoFacts,
  agentId: AgentId,
): SelectorMatch {
  const reasons: string[] = [];

  if (selectors.repos.length > 0) {
    const matched = selectors.repos.includes(repoFacts.repoName);
    if (!matched) {
      return { matched: false, reasons, selectors };
    }

    reasons.push(`repo matched exact selector "${repoFacts.repoName}"`);
  }

  if (selectors.repo_patterns.length > 0) {
    const matched = selectors.repo_patterns.some((pattern) =>
      wildcardToRegExp(pattern).test(repoFacts.repoName),
    );
    if (!matched) {
      return { matched: false, reasons, selectors };
    }

    reasons.push('repo matched pattern selector');
  }

  if (selectors.languages.length > 0) {
    const matched = intersects(selectors.languages, repoFacts.languages);
    if (!matched) {
      return { matched: false, reasons, selectors };
    }

    reasons.push('language selector matched inferred repo language');
  }

  if (selectors.frameworks.length > 0) {
    const matched = intersects(selectors.frameworks, repoFacts.frameworks);
    if (!matched) {
      return { matched: false, reasons, selectors };
    }

    reasons.push('framework selector matched inferred repo framework');
  }

  if (selectors.path_patterns.length > 0) {
    const matched = selectors.path_patterns.some((pattern) =>
      wildcardToRegExp(pattern).test(repoFacts.path),
    );
    if (!matched) {
      return { matched: false, reasons, selectors };
    }

    reasons.push('path selector matched repo path');
  }

  if (selectors.agents.length > 0) {
    const matched = selectors.agents.includes(agentId);
    if (!matched) {
      return { matched: false, reasons, selectors };
    }

    reasons.push(`agent selector matched "${agentId}"`);
  }

  return {
    matched: true,
    reasons:
      reasons.length > 0 ? reasons : ['artifact has no restrictive selectors'],
    selectors,
  };
}
