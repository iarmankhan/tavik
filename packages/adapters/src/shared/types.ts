export type AgentAdapterId =
  | 'codex'
  | 'claude-code'
  | 'cursor'
  | 'generic-skills';

export type SupportLevel = 'full' | 'skills-only' | 'unsupported';

export type DetectionEvidenceKind =
  | 'directory'
  | 'environment-variable'
  | 'executable'
  | 'file';

export interface DetectionEvidence {
  readonly kind: DetectionEvidenceKind;
  readonly label: string;
  readonly found: boolean;
  readonly path?: string;
  readonly value?: string;
}

export interface DetectionResult {
  readonly adapterId: AgentAdapterId;
  readonly available: boolean;
  readonly supportLevel: SupportLevel;
  readonly summary: string;
  readonly evidence: readonly DetectionEvidence[];
}

export interface GuidanceSection {
  readonly sourceId: string;
  readonly title: string;
  readonly content: string;
}

export interface SkillReference {
  readonly id: string;
  readonly sourcePath: string;
  readonly installSource?: string;
  readonly displayName?: string;
  readonly description?: string;
}

export interface AdapterPlanInput {
  readonly baseGuidance: readonly GuidanceSection[];
  readonly skills: readonly SkillReference[];
}

export type ExistingOwnership = 'foreign' | 'managed' | 'missing';
export type FileOperationStatus = 'apply' | 'blocked' | 'noop';

export interface PlannedFileOperation {
  readonly kind: 'write-file';
  readonly path: string;
  readonly content: string;
  readonly reason: string;
  readonly status: FileOperationStatus;
  readonly existingOwnership: ExistingOwnership;
}

export interface ExternalAction {
  readonly kind: 'skills-install';
  readonly skillId: string;
  readonly description: string;
  readonly command: readonly string[];
}

export type AdapterManagedFileRole =
  | 'bridge-manifest'
  | 'instructions'
  | 'rule'
  | 'state';

export interface AdapterManagedFile {
  readonly path: string;
  readonly role: AdapterManagedFileRole;
}

export interface AdapterManagedState {
  readonly managedHeader: string;
  readonly adapterId: AgentAdapterId;
  readonly workspaceRoot: string;
  readonly stateRoot: string;
  readonly workspaceKey: string;
  readonly generatedAt: string;
  readonly supportLevel: SupportLevel;
  readonly managedFiles: readonly AdapterManagedFile[];
  readonly skillIds: readonly string[];
}

export interface AdapterPlan {
  readonly adapterId: AgentAdapterId;
  readonly detection: DetectionResult;
  readonly supportLevel: SupportLevel;
  readonly summary: string;
  readonly warnings: readonly string[];
  readonly fileOperations: readonly PlannedFileOperation[];
  readonly externalActions: readonly ExternalAction[];
  readonly nextState?: AdapterManagedState;
}

export interface AppliedFile {
  readonly kind: 'write-file';
  readonly path: string;
  readonly changed: boolean;
}

export interface AdapterApplyResult {
  readonly adapterId: AgentAdapterId;
  readonly applied: readonly AppliedFile[];
  readonly skipped: readonly PlannedFileOperation[];
  readonly externalActions: readonly ExternalAction[];
  readonly statePath?: string;
}

export interface AdapterFileSystem {
  ensureDirectory(path: string): Promise<void>;
  readTextFile(path: string): Promise<string>;
  removeFile(path: string): Promise<void>;
  statPath(path: string): Promise<PathKind>;
  writeTextFileAtomic(path: string, content: string): Promise<void>;
}

export interface AdapterEnvironment {
  readonly workspaceRoot: string;
  readonly stateRoot: string;
  readonly homeDir?: string;
  readonly env?: Readonly<Record<string, string | undefined>>;
  readonly fs?: AdapterFileSystem;
  readonly now?: () => Date;
}

export interface AgentAdapter {
  readonly id: AgentAdapterId;
  detect(): Promise<DetectionResult>;
  supportLevel(): SupportLevel;
  computePlan(input: AdapterPlanInput): Promise<AdapterPlan>;
  applyPlan(plan: AdapterPlan): Promise<AdapterApplyResult>;
  removeManagedState(): Promise<void>;
}

export type PathKind = 'directory' | 'file' | 'missing' | 'other';
