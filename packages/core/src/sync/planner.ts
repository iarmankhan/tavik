import { join } from 'node:path';
import type {
  AdapterEnvironment,
  ExternalAction,
  GuidanceSection,
  SkillReference,
} from '@org-agent-skills/adapters';
import { DEFAULT_CONFIG_FILE_NAME } from '@org-agent-skills/config';

import { connectOrgSource, refreshOrgSource } from '../bridges/git-source.js';
import { runCommand } from '../bridges/process.js';
import { loadOrgRepository } from '../config/load-org-repository.js';
import type {
  ApplicableArtifact,
  ArtifactRecord,
  ConnectResult,
  DisconnectResult,
  EffectivePlan,
  ManagedExternalActionRecord,
  ManagedFileRecord,
  ManagedState,
  PreviewInput,
  RefreshArtifactRecord,
  RepoFacts,
  SyncResult,
} from '../domain/types.js';
import { renderPlanSummary } from '../explain/render.js';
import { resolveBaseRulePrecedence } from '../precedence/resolve.js';
import { inferRepoFacts } from '../selectors/infer-repo-facts.js';
import { matchSelectors } from '../selectors/match-selectors.js';
import { createAdapter, detectSupportLevels } from '../services/adapters.js';
import { installRefreshArtifacts } from '../services/refresh.js';
import {
  readManagedState,
  removeManagedState,
  resolveManagedRoot,
  resolveStatePath,
  writeManagedState,
} from '../state/store.js';
import { removePath } from '../utils/fs.js';

function isArtifactCompatible(
  agentId: PreviewInput['agentId'],
  agents: PreviewInput['agentId'][],
  artifactType: ArtifactRecord['metadata']['type'],
): boolean {
  if (agentId === 'generic-skills' && artifactType === 'skill') {
    return true;
  }

  return agents.length === 0 || agents.includes(agentId);
}

function selectArtifacts(plan: {
  agentId: PreviewInput['agentId'];
  artifacts: ArtifactRecord[];
  repoFacts: RepoFacts;
}): {
  applicableBaseRules: ApplicableArtifact[];
  applicableSkills: ApplicableArtifact[];
} {
  const applicableBaseRules: ApplicableArtifact[] = [];
  const applicableSkills: ApplicableArtifact[] = [];

  for (const artifact of plan.artifacts) {
    if (!artifact.metadata.enabled) {
      continue;
    }

    if (
      !isArtifactCompatible(
        plan.agentId,
        artifact.metadata.agents,
        artifact.metadata.type,
      )
    ) {
      continue;
    }

    const match = matchSelectors(
      artifact.metadata.applies_to,
      plan.repoFacts,
      plan.agentId,
    );
    if (!match.matched) {
      continue;
    }

    const applicableArtifact: ApplicableArtifact = { artifact, match };
    if (artifact.metadata.type === 'base-rule') {
      applicableBaseRules.push(applicableArtifact);
    } else if (artifact.metadata.mode !== 'manual') {
      applicableSkills.push(applicableArtifact);
    }
  }

  return { applicableBaseRules, applicableSkills };
}

function toAdapterEnvironment(
  machineRootPath: string,
  workspaceRoot: string,
): AdapterEnvironment {
  return {
    stateRoot: join(resolveManagedRoot(machineRootPath), 'adapter-state'),
    workspaceRoot,
  };
}

function toGuidanceSections(
  baseRules: ApplicableArtifact[],
): readonly GuidanceSection[] {
  return baseRules.map((baseRule) => ({
    content: baseRule.artifact.content,
    sourceId: baseRule.artifact.metadata.name,
    title: baseRule.artifact.metadata.description,
  }));
}

function toSkillReferences(
  skills: ApplicableArtifact[],
): readonly SkillReference[] {
  return skills.map((skill) => ({
    description: skill.artifact.metadata.description,
    displayName: skill.artifact.metadata.name,
    id: skill.artifact.metadata.name,
    sourcePath: skill.artifact.directoryPath,
  }));
}

function mergeManagedFiles(
  existingFiles: ManagedFileRecord[],
  newFiles: ManagedFileRecord[],
): ManagedFileRecord[] {
  const mergedByPath = new Map<string, ManagedFileRecord>();
  for (const file of [...existingFiles, ...newFiles]) {
    mergedByPath.set(file.path, file);
  }

  return [...mergedByPath.values()].sort((left, right) =>
    left.path.localeCompare(right.path),
  );
}

function mergeRefreshArtifacts(
  existingArtifacts: RefreshArtifactRecord[],
  newArtifacts: RefreshArtifactRecord[],
): RefreshArtifactRecord[] {
  const mergedByPath = new Map<string, RefreshArtifactRecord>();
  for (const artifact of [...existingArtifacts, ...newArtifacts]) {
    mergedByPath.set(artifact.path, artifact);
  }

  return [...mergedByPath.values()].sort((left, right) =>
    left.path.localeCompare(right.path),
  );
}

async function executeExternalActions(
  actions: readonly ExternalAction[],
): Promise<ManagedExternalActionRecord[]> {
  const executedAt = new Date().toISOString();
  const executedActions: ManagedExternalActionRecord[] = [];

  for (const action of actions) {
    await runCommand(action.command);
    executedActions.push({
      command: [...action.command],
      description: action.description,
      executedAt,
      skillId: action.skillId,
    });
  }

  return executedActions;
}

function updatedFileRecords(
  paths: readonly string[],
  kind: ManagedFileRecord['kind'],
): ManagedFileRecord[] {
  return paths.map((path) => ({
    kind,
    path,
  }));
}

export async function buildEffectivePlan(
  orgRootPath: string,
  input: PreviewInput,
  machineRootPath?: string,
): Promise<EffectivePlan> {
  const repository = await loadOrgRepository(orgRootPath);
  const repoFacts = await inferRepoFacts(input.repoPath, input.repoName);
  const { applicableBaseRules, applicableSkills } = selectArtifacts({
    agentId: input.agentId,
    artifacts: repository.artifacts,
    repoFacts,
  });
  const precedenceResolution = resolveBaseRulePrecedence(applicableBaseRules);
  const adapter = createAdapter(
    input.agentId,
    toAdapterEnvironment(machineRootPath ?? input.repoPath, input.repoPath),
  );
  const adapterPlan = await adapter.computePlan({
    baseGuidance: toGuidanceSections(precedenceResolution.chosen),
    skills: toSkillReferences(applicableSkills),
  });

  return {
    adapterPlan,
    agentId: input.agentId,
    applicableBaseRules: precedenceResolution.chosen,
    applicableSkills,
    precedence: precedenceResolution.decision,
    repoFacts,
    support: adapterPlan.detection,
  };
}

export async function connectMachine(
  orgSourceReference: string,
  machineRootPath: string,
): Promise<ConnectResult> {
  const connectedSource = await connectOrgSource(
    orgSourceReference,
    machineRootPath,
  );
  const supportByAgent = await detectSupportLevels(
    toAdapterEnvironment(machineRootPath, machineRootPath),
  );
  const refreshArtifacts = await installRefreshArtifacts({ machineRootPath });
  const state: ManagedState = {
    connectedAt: new Date().toISOString(),
    externalActions: [],
    generatedFiles: updatedFileRecords(
      refreshArtifacts.map((artifact) => artifact.path),
      'refresh-artifact',
    ),
    orgConfigPath: join(connectedSource.orgRootPath, DEFAULT_CONFIG_FILE_NAME),
    orgRootPath: connectedSource.orgRootPath,
    orgSource: connectedSource.descriptor,
    refreshArtifacts,
    supportByAgent,
  };

  const statePath = await writeManagedState(machineRootPath, state);
  return { state, statePath };
}

export async function syncMachine(
  orgRootPath: string | undefined,
  machineRootPath: string,
  input: PreviewInput,
): Promise<SyncResult> {
  const existingState = await readManagedState(machineRootPath);
  const resolvedOrgRootPath =
    orgRootPath ??
    (existingState === null
      ? undefined
      : await refreshOrgSource(existingState));

  if (resolvedOrgRootPath === undefined) {
    throw new Error(
      'No connected org source found. Run `tavik connect` first or pass --org-root.',
    );
  }

  const plan = await buildEffectivePlan(
    resolvedOrgRootPath,
    input,
    machineRootPath,
  );
  const adapter = createAdapter(
    input.agentId,
    toAdapterEnvironment(machineRootPath, input.repoPath),
  );
  const adapterApplyResult = await adapter.applyPlan(plan.adapterPlan);
  const executedExternalActions = await executeExternalActions(
    adapterApplyResult.externalActions,
  );
  const supportByAgent = await detectSupportLevels(
    toAdapterEnvironment(machineRootPath, input.repoPath),
  );
  const refreshArtifacts =
    existingState?.refreshArtifacts ??
    (await installRefreshArtifacts({ machineRootPath }));
  const adapterManagedFiles = updatedFileRecords(
    adapterApplyResult.applied.map((item) => item.path),
    'adapter-artifact',
  );
  const refreshManagedFiles = updatedFileRecords(
    refreshArtifacts.map((artifact) => artifact.path),
    'refresh-artifact',
  );
  const nextState: ManagedState = {
    connectedAt: existingState?.connectedAt ?? new Date().toISOString(),
    externalActions: [
      ...(existingState?.externalActions ?? []),
      ...executedExternalActions,
    ],
    generatedFiles: mergeManagedFiles(existingState?.generatedFiles ?? [], [
      ...adapterManagedFiles,
      ...refreshManagedFiles,
    ]),
    lastSyncAt: new Date().toISOString(),
    orgConfigPath: join(resolvedOrgRootPath, DEFAULT_CONFIG_FILE_NAME),
    orgRootPath: resolvedOrgRootPath,
    orgSource: existingState?.orgSource ?? {
      kind: 'local',
      value: resolvedOrgRootPath,
    },
    refreshArtifacts: mergeRefreshArtifacts(
      existingState?.refreshArtifacts ?? [],
      refreshArtifacts,
    ),
    supportByAgent,
  };

  const statePath = await writeManagedState(machineRootPath, nextState);
  return {
    adapterApplyResult,
    executedExternalActions,
    refreshArtifacts,
    state: nextState,
    statePath,
    updatedFiles: adapterApplyResult.applied.map((item) => item.path),
  };
}

export async function readStatus(machineRootPath: string): Promise<string> {
  const state = await readManagedState(machineRootPath);
  if (state === null) {
    return 'No managed state found.';
  }

  const lines = [
    `Connected org source: ${state.orgSource.value}`,
    `Resolved org root: ${state.orgRootPath}`,
    `Connected at: ${state.connectedAt}`,
    `Last sync: ${state.lastSyncAt ?? 'never'}`,
    'Managed files:',
  ];

  lines.push(
    ...(state.generatedFiles.length > 0
      ? state.generatedFiles.map((generatedFile) => `- ${generatedFile.path}`)
      : ['- none']),
  );
  lines.push('Refresh support artifacts:');
  lines.push(
    ...(state.refreshArtifacts.length > 0
      ? state.refreshArtifacts.map((artifact) => `- ${artifact.path}`)
      : ['- none']),
  );
  lines.push('Support levels:');
  lines.push(
    ...Object.entries(state.supportByAgent).map(
      ([agentId, level]) => `- ${agentId}: ${level}`,
    ),
  );

  return `${lines.join('\n')}\n`;
}

export async function explainPlan(
  orgRootPath: string | undefined,
  machineRootPath: string,
  input: PreviewInput,
): Promise<string> {
  const state = await readManagedState(machineRootPath);
  const resolvedOrgRootPath =
    orgRootPath ?? (state === null ? undefined : await refreshOrgSource(state));

  if (resolvedOrgRootPath === undefined) {
    throw new Error(
      'No connected org source found. Run `tavik connect` first or pass --org-root.',
    );
  }

  const plan = await buildEffectivePlan(
    resolvedOrgRootPath,
    input,
    machineRootPath,
  );
  return renderPlanSummary(plan);
}

export async function disconnectMachine(
  machineRootPath: string,
): Promise<DisconnectResult> {
  const state = await readManagedState(machineRootPath);
  const statePath = resolveStatePath(machineRootPath);

  if (state === null) {
    return {
      removedFiles: [],
      removedState: false,
      statePath,
    };
  }

  for (const generatedFile of state.generatedFiles) {
    await removePath(generatedFile.path);
  }

  await removeManagedState(machineRootPath);

  return {
    removedFiles: state.generatedFiles.map(
      (generatedFile) => generatedFile.path,
    ),
    removedState: true,
    statePath,
  };
}
