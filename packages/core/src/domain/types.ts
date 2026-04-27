import type {
  AdapterApplyResult,
  AdapterPlan,
  DetectionResult,
  ExternalAction,
} from '@org-agent-skills/adapters';
import type {
  AgentId,
  ArtifactMetadata,
  OrgConfig,
  Selectors,
  SupportLevel,
} from '@org-agent-skills/config';

export type ArtifactRecord = {
  contentPath: string;
  content: string;
  directoryPath: string;
  metadata: ArtifactMetadata;
  metadataPath: string;
};

export type OrgRepository = {
  artifacts: ArtifactRecord[];
  config: OrgConfig;
  rootPath: string;
};

export type RepoFacts = {
  frameworks: string[];
  languages: string[];
  path: string;
  repoName: string;
};

export type PreviewInput = {
  agentId: AgentId;
  repoPath: string;
  repoName?: string;
};

export type SelectorMatch = {
  matched: boolean;
  reasons: string[];
  selectors: Selectors;
};

export type ApplicableArtifact = {
  artifact: ArtifactRecord;
  match: SelectorMatch;
};

export type PrecedenceDecision = {
  chosenArtifactNames: string[];
  discardedArtifactNames: string[];
  reasons: string[];
};

export type EffectivePlan = {
  agentId: AgentId;
  adapterPlan: AdapterPlan;
  applicableBaseRules: ApplicableArtifact[];
  applicableSkills: ApplicableArtifact[];
  precedence: PrecedenceDecision;
  repoFacts: RepoFacts;
  support: DetectionResult;
};

export type ValidationMessage = {
  level: 'error' | 'warning';
  message: string;
  path: string;
};

export type ValidationResult = {
  valid: boolean;
  messages: ValidationMessage[];
};

export type ManagedFileRecord = {
  path: string;
  kind: 'adapter-artifact' | 'refresh-artifact';
};

export type ManagedExternalActionRecord = {
  command: string[];
  description: string;
  executedAt: string;
  skillId: string;
};

export type OrgSourceDescriptor =
  | {
      kind: 'local';
      value: string;
    }
  | {
      cachePath: string;
      kind: 'git';
      value: string;
    };

export type RefreshArtifactRecord = {
  agentId: AgentId;
  path: string;
};

export type ManagedState = {
  connectedAt: string;
  externalActions: ManagedExternalActionRecord[];
  generatedFiles: ManagedFileRecord[];
  lastSyncAt?: string;
  orgConfigPath: string;
  orgRootPath: string;
  orgSource: OrgSourceDescriptor;
  refreshArtifacts: RefreshArtifactRecord[];
  supportByAgent: Record<AgentId, SupportLevel>;
};

export type ConnectResult = {
  state: ManagedState;
  statePath: string;
};

export type SyncResult = {
  adapterApplyResult: AdapterApplyResult;
  executedExternalActions: ManagedExternalActionRecord[];
  refreshArtifacts: RefreshArtifactRecord[];
  state: ManagedState;
  statePath: string;
  updatedFiles: string[];
};

export type DisconnectResult = {
  removedFiles: string[];
  removedState: boolean;
  statePath: string;
};
