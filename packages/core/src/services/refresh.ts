import { chmod } from 'node:fs/promises';
import { join } from 'node:path';
import type { AgentId } from '@org-agent-skills/config';

import type { RefreshArtifactRecord } from '../domain/types.js';
import { resolveManagedRoot } from '../state/store.js';
import { writeTextFile } from '../utils/fs.js';

type RefreshContext = {
  machineRootPath: string;
};

function wrapperBinaryName(agentId: AgentId): string {
  switch (agentId) {
    case 'claude-code':
      return 'claude';
    case 'cursor':
      return 'cursor';
    case 'codex':
      return 'codex';
    case 'generic-skills':
      return 'skills';
  }
}

function buildAgentWrapperScript(
  agentId: AgentId,
  machineRootPath: string,
): string {
  const binaryName = wrapperBinaryName(agentId);
  return `#!/usr/bin/env sh
SELF_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
PATH_WITHOUT_SELF="$(printf '%s' "$PATH" | awk -v dir="$SELF_DIR" 'BEGIN { RS=":"; ORS=":" } $0 != dir { print }' | sed 's/:$//')"
REAL_BIN="$(PATH="$PATH_WITHOUT_SELF" command -v ${binaryName} || true)"
if [ -z "$REAL_BIN" ]; then
  echo "No underlying ${binaryName} executable found for Tavik wrapper." >&2
  exit 1
fi
tavik sync --agent ${agentId} --machine-root "${machineRootPath}" --repo-path "$PWD" >/dev/null 2>&1 || true
exec "$REAL_BIN" "$@"
`;
}

function buildZshHookScript(machineRootPath: string): string {
  return `org_agent_skills_auto_refresh() {
  if command -v tavik >/dev/null 2>&1; then
    tavik sync --agent generic-skills --machine-root "${machineRootPath}" --repo-path "$PWD" >/dev/null 2>&1 || true
  fi
}
autoload -U add-zsh-hook
add-zsh-hook chpwd org_agent_skills_auto_refresh
org_agent_skills_auto_refresh
`;
}

export async function installRefreshArtifacts(
  context: RefreshContext,
): Promise<RefreshArtifactRecord[]> {
  const managedRoot = resolveManagedRoot(context.machineRootPath);
  const wrappersDirectory = join(managedRoot, 'wrappers');
  const hooksDirectory = join(managedRoot, 'hooks');

  const wrapperArtifacts: RefreshArtifactRecord[] = [];
  const agentIds: AgentId[] = ['claude-code', 'cursor', 'codex'];
  for (const agentId of agentIds) {
    const wrapperPath = join(wrappersDirectory, wrapperBinaryName(agentId));
    await writeTextFile(
      wrapperPath,
      buildAgentWrapperScript(agentId, context.machineRootPath),
    );
    await chmod(wrapperPath, 0o755);
    wrapperArtifacts.push({ agentId, path: wrapperPath });
  }

  const zshHookPath = join(hooksDirectory, 'zsh-auto-refresh.zsh');
  await writeTextFile(zshHookPath, buildZshHookScript(context.machineRootPath));
  wrapperArtifacts.push({
    agentId: 'generic-skills',
    path: zshHookPath,
  });

  return wrapperArtifacts;
}
