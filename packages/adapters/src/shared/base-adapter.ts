import * as path from 'node:path';

import {
  NodeAdapterFileSystem,
  defaultEnvironmentVariables,
  findExecutable,
  resolveHomeDirectory,
} from './filesystem.js';
import {
  MANAGED_MARKER,
  buildManagedStateContent,
  isManagedContent,
  parseManagedState,
  workspaceKeyFor,
} from './managed-state.js';
import type {
  AdapterApplyResult,
  AdapterEnvironment,
  AdapterFileSystem,
  AdapterManagedFile,
  AdapterManagedState,
  AdapterPlan,
  AdapterPlanInput,
  AgentAdapter,
  AgentAdapterId,
  AppliedFile,
  DetectionEvidence,
  DetectionResult,
  ExistingOwnership,
  ExternalAction,
  PathKind,
  PlannedFileOperation,
  SupportLevel,
} from './types.js';

interface DesiredArtifact {
  readonly path: string;
  readonly content: string;
  readonly role: AdapterManagedFile['role'];
  readonly reason: string;
}

interface DetectionConfiguration {
  readonly executables: readonly string[];
  readonly homeDirectories?: readonly string[];
  readonly homeFiles?: readonly string[];
  readonly workspaceFiles?: readonly string[];
  readonly environmentVariables?: readonly string[];
}

export abstract class BaseAgentAdapter implements AgentAdapter {
  abstract readonly id: AgentAdapterId;

  protected abstract readonly adapterSupportLevel: SupportLevel;
  protected abstract readonly detectionConfiguration: DetectionConfiguration;

  protected readonly fileSystem: AdapterFileSystem;
  protected readonly homeDirectory: string;
  protected readonly environmentVariables: Readonly<
    Record<string, string | undefined>
  >;
  protected readonly workspaceRoot: string;
  protected readonly stateRoot: string;
  protected readonly now: () => Date;

  constructor(environment: AdapterEnvironment) {
    this.fileSystem = environment.fs ?? new NodeAdapterFileSystem();
    this.homeDirectory = resolveHomeDirectory(environment.homeDir);
    this.environmentVariables = defaultEnvironmentVariables(environment.env);
    this.workspaceRoot = environment.workspaceRoot;
    this.stateRoot = environment.stateRoot;
    this.now = environment.now ?? (() => new Date());
  }

  supportLevel(): SupportLevel {
    return this.adapterSupportLevel;
  }

  async detect(): Promise<DetectionResult> {
    const evidence: DetectionEvidence[] = [];
    let detected = false;

    const executablePath = await findExecutable(
      this.detectionConfiguration.executables,
      this.environmentVariables,
      this.fileSystem,
    );
    evidence.push({
      kind: 'executable',
      label: this.detectionConfiguration.executables.join(', '),
      found: executablePath !== undefined,
      ...(executablePath !== undefined ? { path: executablePath } : {}),
    });
    if (executablePath !== undefined) {
      detected = true;
    }

    for (const variableName of this.detectionConfiguration
      .environmentVariables ?? []) {
      const variableValue = this.environmentVariables[variableName];
      const found =
        typeof variableValue === 'string' && variableValue.length > 0;
      evidence.push({
        kind: 'environment-variable',
        label: variableName,
        found,
        ...(variableValue !== undefined ? { value: variableValue } : {}),
      });
      detected ||= found;
    }

    for (const relativePath of this.detectionConfiguration.homeDirectories ??
      []) {
      const absolutePath = path.join(this.homeDirectory, relativePath);
      const kind = await this.fileSystem.statPath(absolutePath);
      evidence.push({
        kind: 'directory',
        label: relativePath,
        found: kind === 'directory',
        path: absolutePath,
      });
      detected ||= kind === 'directory';
    }

    for (const relativePath of this.detectionConfiguration.homeFiles ?? []) {
      const absolutePath = path.join(this.homeDirectory, relativePath);
      const kind = await this.fileSystem.statPath(absolutePath);
      evidence.push({
        kind: 'file',
        label: relativePath,
        found: kind === 'file',
        path: absolutePath,
      });
      detected ||= kind === 'file';
    }

    for (const relativePath of this.detectionConfiguration.workspaceFiles ??
      []) {
      const absolutePath = path.join(this.workspaceRoot, relativePath);
      const kind = await this.fileSystem.statPath(absolutePath);
      evidence.push({
        kind: 'file',
        label: relativePath,
        found: kind === 'file',
        path: absolutePath,
      });
      detected ||= kind === 'file';
    }

    const effectiveSupportLevel = detected
      ? this.supportLevel()
      : 'unsupported';
    return {
      adapterId: this.id,
      available: detected,
      supportLevel: effectiveSupportLevel,
      summary: detected
        ? `${this.id} is available on this machine.`
        : `${this.id} is not currently detectable on this machine.`,
      evidence,
    };
  }

  async computePlan(input: AdapterPlanInput): Promise<AdapterPlan> {
    const detection = await this.detect();
    const warnings: string[] = [];
    const externalActions = await this.buildExternalActions(input, detection);
    if (detection.supportLevel === 'unsupported') {
      return {
        adapterId: this.id,
        detection,
        supportLevel: detection.supportLevel,
        summary: `${this.id} cannot be managed until the agent is available locally.`,
        warnings,
        fileOperations: [],
        externalActions,
      };
    }

    const desiredArtifacts = await this.buildPrimaryArtifacts(input);
    const primaryOperations = await Promise.all(
      desiredArtifacts.map(async (artifact) =>
        this.planArtifactWrite(artifact),
      ),
    );

    for (const operation of primaryOperations) {
      if (operation.status === 'blocked') {
        warnings.push(
          `Refusing to overwrite non-managed file at ${operation.path}.`,
        );
      }
    }

    const manageableArtifacts = desiredArtifacts.filter((artifact) =>
      primaryOperations.some(
        (operation) =>
          operation.path === artifact.path && operation.status !== 'blocked',
      ),
    );

    let fileOperations: PlannedFileOperation[] = [...primaryOperations];
    const shouldPersistState =
      manageableArtifacts.length > 0 || externalActions.length > 0;
    let nextState: AdapterManagedState | undefined;

    if (shouldPersistState) {
      const state = this.buildManagedState(
        manageableArtifacts,
        input.skills.map((skill) => skill.id),
        detection.supportLevel,
      );
      const stateArtifact: DesiredArtifact = {
        path: this.managedStatePath(),
        content: buildManagedStateContent(state),
        role: 'state',
        reason: 'Persist adapter-managed state for later sync and cleanup.',
      };
      const stateOperation = await this.planArtifactWrite(stateArtifact);

      if (stateOperation.status === 'blocked') {
        warnings.push(
          `Managed state path is blocked at ${stateOperation.path}.`,
        );
        fileOperations = [
          ...blockWritableOperations(primaryOperations),
          stateOperation,
        ];
      } else {
        nextState = state;
        fileOperations.push(stateOperation);
      }
    }

    const summary = summarizePlan(
      this.id,
      fileOperations,
      externalActions,
      warnings.length,
    );
    return {
      adapterId: this.id,
      detection,
      supportLevel: detection.supportLevel,
      summary,
      warnings,
      fileOperations,
      externalActions,
      ...(nextState !== undefined ? { nextState } : {}),
    };
  }

  async applyPlan(plan: AdapterPlan): Promise<AdapterApplyResult> {
    if (plan.adapterId !== this.id) {
      throw new Error(
        `Cannot apply a ${plan.adapterId} plan with the ${this.id} adapter.`,
      );
    }

    const applied: AppliedFile[] = [];
    const skipped: PlannedFileOperation[] = [];

    for (const operation of plan.fileOperations) {
      if (operation.status !== 'apply') {
        skipped.push(operation);
        continue;
      }

      const ownership = await this.readExistingOwnership(operation.path);
      if (ownership === 'foreign') {
        throw new Error(
          `Refusing to overwrite non-managed file at ${operation.path}.`,
        );
      }

      await this.fileSystem.writeTextFileAtomic(
        operation.path,
        operation.content,
      );
      applied.push({
        kind: 'write-file',
        path: operation.path,
        changed: true,
      });
    }

    return {
      adapterId: this.id,
      applied,
      skipped,
      externalActions: plan.externalActions,
      ...(plan.nextState !== undefined
        ? { statePath: this.managedStatePath() }
        : {}),
    };
  }

  async removeManagedState(): Promise<void> {
    const statePath = this.managedStatePath();
    if ((await this.fileSystem.statPath(statePath)) !== 'file') {
      return;
    }

    const stateContent = await this.fileSystem.readTextFile(statePath);
    const managedState = parseManagedState(stateContent);
    if (
      managedState === undefined ||
      managedState.managedHeader !== MANAGED_MARKER ||
      managedState.adapterId !== this.id
    ) {
      return;
    }

    const managedFiles = managedState.managedFiles.filter(
      (file) => file.path !== statePath,
    );
    for (const file of managedFiles) {
      await this.removeManagedFile(file.path);
    }

    await this.removeManagedFile(statePath);
  }

  protected abstract buildPrimaryArtifacts(
    input: AdapterPlanInput,
  ): Promise<readonly DesiredArtifact[]>;

  protected async buildExternalActions(
    _input: AdapterPlanInput,
    _detection: DetectionResult,
  ): Promise<readonly ExternalAction[]> {
    return [];
  }

  protected workspaceKey(): string {
    return workspaceKeyFor(this.workspaceRoot);
  }

  protected managedStatePath(): string {
    return path.join(
      this.stateRoot,
      'adapters',
      this.id,
      this.workspaceKey(),
      'managed-state.json',
    );
  }

  private buildManagedState(
    primaryArtifacts: readonly DesiredArtifact[],
    skillIds: readonly string[],
    supportLevel: SupportLevel,
  ): AdapterManagedState {
    const managedFiles: AdapterManagedFile[] = primaryArtifacts.map(
      (artifact) => ({
        path: artifact.path,
        role: artifact.role,
      }),
    );
    managedFiles.push({
      path: this.managedStatePath(),
      role: 'state',
    });

    return {
      managedHeader: MANAGED_MARKER,
      adapterId: this.id,
      workspaceRoot: this.workspaceRoot,
      stateRoot: this.stateRoot,
      workspaceKey: this.workspaceKey(),
      generatedAt: this.now().toISOString(),
      supportLevel,
      managedFiles,
      skillIds,
    };
  }

  private async planArtifactWrite(
    artifact: DesiredArtifact,
  ): Promise<PlannedFileOperation> {
    const ownership = await this.readExistingOwnership(artifact.path);
    if (ownership === 'foreign') {
      return {
        kind: 'write-file',
        path: artifact.path,
        content: artifact.content,
        reason: artifact.reason,
        status: 'blocked',
        existingOwnership: ownership,
      };
    }

    if (ownership === 'missing') {
      return {
        kind: 'write-file',
        path: artifact.path,
        content: artifact.content,
        reason: artifact.reason,
        status: 'apply',
        existingOwnership: ownership,
      };
    }

    const existingContent = await this.fileSystem.readTextFile(artifact.path);
    return {
      kind: 'write-file',
      path: artifact.path,
      content: artifact.content,
      reason: artifact.reason,
      status: existingContent === artifact.content ? 'noop' : 'apply',
      existingOwnership: ownership,
    };
  }

  private async readExistingOwnership(
    targetPath: string,
  ): Promise<ExistingOwnership> {
    const pathKind = await this.fileSystem.statPath(targetPath);
    return classifyOwnership(pathKind, targetPath, this.fileSystem);
  }

  private async removeManagedFile(targetPath: string): Promise<void> {
    const pathKind = await this.fileSystem.statPath(targetPath);
    if (pathKind !== 'file') {
      return;
    }

    const content = await this.fileSystem.readTextFile(targetPath);
    if (!isManagedContent(content)) {
      return;
    }

    await this.fileSystem.removeFile(targetPath);
  }
}

async function classifyOwnership(
  pathKind: PathKind,
  targetPath: string,
  fileSystem: AdapterFileSystem,
): Promise<ExistingOwnership> {
  if (pathKind === 'missing') {
    return 'missing';
  }

  if (pathKind !== 'file') {
    return 'foreign';
  }

  const content = await fileSystem.readTextFile(targetPath);
  return isManagedContent(content) ? 'managed' : 'foreign';
}

function blockWritableOperations(
  operations: readonly PlannedFileOperation[],
): readonly PlannedFileOperation[] {
  return operations.map((operation) =>
    operation.status === 'apply'
      ? { ...operation, status: 'blocked' }
      : operation,
  );
}

function summarizePlan(
  adapterId: AgentAdapterId,
  operations: readonly PlannedFileOperation[],
  externalActions: readonly ExternalAction[],
  warningCount: number,
): string {
  const applyCount = operations.filter(
    (operation) => operation.status === 'apply',
  ).length;
  const noopCount = operations.filter(
    (operation) => operation.status === 'noop',
  ).length;
  const blockedCount = operations.filter(
    (operation) => operation.status === 'blocked',
  ).length;
  return `${adapterId}: ${applyCount} file change(s), ${noopCount} no-op(s), ${blockedCount} blocked change(s), ${externalActions.length} external action(s), ${warningCount} warning(s).`;
}
