# Org Agent Skills — Tech Spec

**Project:** Org Agent Skills
**Author:** Arman Khan + Codex
**Date:** 2026-04-26
**Status:** Draft

---

## Overview

This spec turns the PRD into a concrete technical design for an open-source CLI that manages:

- org-wide always-on AI agent guidance
- reusable private skills in the standard `SKILL.md` format
- repo-targeted and stack-targeted auto-application rules
- developer-machine sync and agent integration

The product is intentionally Git-native and file-based. It should be easy for a new org to adopt with one bootstrap command, easy for developers to connect with one machine-level install command, and easy for maintainers to extend without needing a hosted control plane.

This spec also makes explicit stack choices for a TypeScript-first open-source codebase.

---

## References

- Agent Skills specification: https://agentskills.io/specification
- Skills CLI docs: https://skills.sh/docs/cli
- Vercel Agent Skills docs: https://vercel.com/docs/agent-resources/skills
- Vercel changelog on skills ecosystem: https://vercel.com/changelog/introducing-skills-the-open-agent-skills-ecosystem
- Commander.js package docs: https://www.npmjs.com/package/commander
- oclif docs: https://oclif.io/docs/introduction
- pnpm docs: https://pnpm.io/
- Changesets docs: https://changesets-docs.vercel.app/
- Vitest docs: https://vitest.dev/
- Biome docs: https://biomejs.dev/
- Zod docs: https://zod.dev/
- tsx docs: https://tsx.is/
- execa package docs: https://www.npmjs.com/package/execa
- Node.js releases: https://github.com/nodejs/Release and https://nodejs.org/en/about/releases/
- npm provenance docs: https://docs.npmjs.com/generating-provenance-statements

---

## Goals

- Use the open Agent Skills format directly instead of inventing a new core format.
- Provide one CLI that wraps sync, install, explainability, authoring, and agent-specific wiring.
- Keep the product OSS-friendly:
  - low runtime dependency count
  - clear architecture
  - easy local development
  - reproducible builds
  - straightforward release automation
- Support Claude Code, Cursor, and Codex as first-class adapters in MVP.
- Allow broader ecosystem compatibility via the standard `skills` CLI.
- Default to safe, reversible user-global integration rather than invasive repo mutation.

## Non-Goals

- Hosted control plane in MVP
- Web UI in MVP
- Policy enforcement against developer overrides
- Full parity across every agent supported by the broader skills ecosystem
- Mandatory always-running daemon in MVP

---

## Key Decisions

### 1. Runtime and Language

Use **TypeScript on Node.js**.

Recommended baseline:

- **Development and CI target:** Node `22` and Node `24`
- **Minimum supported engine:** Node `>=22`
- **Preferred local development version:** Node `24`

Reasoning:

- TypeScript is the preferred language and is a strong fit for cross-platform CLI tooling.
- Node has the best ecosystem for Git-centric CLI tools, file manipulation, cross-platform process execution, and npm distribution.
- As of **April 26, 2026**, Node `20` reaches end-of-life on **April 30, 2026**; Node `22` is still supported and Node `24` is Active LTS. Supporting `>=22` avoids shipping a fresh OSS tool on an effectively expiring baseline.

### 2. Package Manager

Use **pnpm workspaces**.

Reasoning:

- Built-in workspace support is useful for splitting CLI, core engine, and adapters cleanly.
- pnpm is a strong fit for monorepos and keeps installs fast and deterministic.
- It is widely adopted in OSS and has good ergonomics for local linking and multi-package publishing.

### 3. Repository Shape

Use a **small monorepo** from day one.

Recommended top-level shape:

```text
/
  apps/
    cli/
  packages/
    core/
    adapters/
    config/
    testkit/
  docs/
  .changeset/
```

Reasoning:

- The architecture naturally separates into a CLI entrypoint, core selector/sync logic, and agent adapters.
- A monorepo avoids premature package publishing complexity while keeping boundaries explicit.
- Changesets and pnpm workspaces work well together.

### 4. CLI Framework

Use **Commander.js** for v1.

Do **not** use oclif for MVP.

Reasoning:

- Commander is simpler, smaller, and easier for contributors to understand quickly.
- The command surface is straightforward:
  - `init-org`
  - `connect`
  - `sync`
  - `status`
  - `why`
  - `validate`
  - `preview`
  - `new skill`
  - `new base-rule`
  - `disconnect`
- Commander has first-class TypeScript support and strict option parsing.
- oclif is strong when the framework itself is the platform and you want a richer built-in plugin model, generators, and packaging conventions. That is useful, but it is not necessary for v1, and it would add framework-specific structure before we know we need it.

Decision note:

- If third-party runtime plugin installation becomes a core product requirement later, revisit oclif or a similar framework then.
- For v1, we should build our own adapter/plugin interfaces inside the codebase rather than commit to a heavy CLI framework.

### 5. Interactive Terminal UX

Use **`@clack/prompts`** for interactive flows.

Reasoning:

- Lightweight
- Good terminal UX
- Works well for scaffold/setup commands
- Easy to keep optional because every command should also support non-interactive flags

### 6. Validation Layer

Use **Zod** for runtime validation and config parsing.

Reasoning:

- TypeScript-first
- Good for parsing local config, sidecar metadata, CLI options, and generated manifest/state files
- Lets us infer types from runtime schemas instead of duplicating interfaces

### 7. Process Execution

Use **execa** for subprocess management.

Reasoning:

- The product needs to run `git`, `skills`, and possibly agent-specific local commands.
- execa gives safer and more ergonomic process execution than hand-rolled `child_process` wrappers.
- Better cross-platform behavior than raw shelling for a public CLI.

### 8. Dev Runner

Use **tsx** for local TypeScript execution in development.

Reasoning:

- Fast local iteration
- Minimal setup
- Good fit for a CLI-heavy repository where we want contributors to run scripts directly without extra build friction

### 9. Tests

Use **Vitest** as the main test runner.

Reasoning:

- Fast feedback loop
- Good TypeScript support
- Useful for unit, fixture, and integration-style tests
- Simpler contributor story than combining multiple test stacks in v1

### 10. Linting and Formatting

Use **Biome** for formatting and linting.

Reasoning:

- One tool instead of separate ESLint + Prettier stacks
- Faster CI and easier contributor setup
- Good fit for a TypeScript CLI project where simplicity matters

### 11. Releases

Use **Changesets** for versioning and release notes.

Reasoning:

- Strong monorepo story
- Explicit release intent in PRs
- Familiar OSS workflow
- Scales if the repo eventually publishes multiple packages

### 12. Publishing Security

Publish with **npm provenance** from GitHub Actions.

Reasoning:

- Useful trust signal for an OSS CLI that other orgs will install on developer machines
- Low incremental cost once CI is wired correctly

---

## Why This Stack

The stack should optimize for:

1. low contributor friction
2. small conceptual surface area
3. easy cross-platform packaging
4. good testability
5. maintainable release flow

The biggest trap here would be overbuilding the CLI shell before the core policy engine exists. The core value is selector evaluation, sync, explainability, and adapter management. The CLI framework should stay boring.

That is why the recommended stack is:

- TypeScript
- Node `>=22`
- pnpm workspace monorepo
- Commander.js
- Zod
- execa
- Vitest
- Biome
- Changesets

This is a conservative OSS stack, not an experimental one.

---

## Architecture

### High-Level Modules

The implementation should be split into four major layers.

#### 1. CLI Layer

Responsible for:

- command parsing
- prompt flows
- output formatting
- exit codes
- JSON vs human-readable output selection

This layer should stay thin. It should call application services in `core` and avoid embedding business rules.

#### 2. Core Engine

Responsible for:

- reading org repo configuration
- parsing skill metadata
- selector evaluation
- precedence resolution
- effective rule-set calculation
- sync planning
- explainability
- validation
- local state management

This is the main deep module in the system and should be the most heavily tested.

#### 3. Agent Adapters

Responsible for:

- detecting supported agents
- locating agent-specific install paths
- generating always-on base guidance files where supported
- wiring in installed skills where supported
- reporting support levels

Each adapter should implement a narrow shared interface.

#### 4. External Tool Bridges

Responsible for:

- invoking `git`
- invoking `skills`
- possibly invoking agent-native helper commands in the future

These bridges should be isolated so the rest of the codebase can be tested without shelling out.

---

## Proposed Package Layout

```text
apps/
  cli/
    src/
      index.ts
      commands/
      output/
      prompts/

packages/
  core/
    src/
      config/
      selectors/
      precedence/
      sync/
      explain/
      state/
      validation/
      domain/

  adapters/
    src/
      shared/
      claude-code/
      cursor/
      codex/
      generic-skills/

  config/
    src/
      schemas/
      defaults/
      templates/

  testkit/
    src/
      fixtures/
      temp-repos/
      fake-tooling/
```

### Package Responsibilities

- `apps/cli`
  User-facing command entrypoint only.
- `packages/core`
  Domain logic and application services.
- `packages/adapters`
  Agent-specific integration implementations.
- `packages/config`
  Shared schemas, defaults, and scaffolding templates.
- `packages/testkit`
  Reusable helpers for fixture and integration tests.

---

## Domain Model

### Core Concepts

#### Org Source

A Git-backed source repository containing:

- base guidance
- skills
- sidecar metadata
- templates
- org config

#### Skill Artifact

A standard Agent Skills directory containing `SKILL.md` and optional companion files.

#### Base Rule Artifact

Always-on guidance rendered into one or more agent-native target formats.

#### Sidecar Metadata

Tool-specific metadata used for routing and rollout, separate from the portable `SKILL.md`.

#### Selector

A rule that determines whether an artifact applies to a machine, agent, repo, or stack.

Selector classes:

- repo selectors
- repo-pattern selectors
- agent selectors
- language selectors
- framework selectors
- path selectors
- source/visibility selectors

#### Effective Context Plan

The computed result for a machine + agent + repo context:

- applicable base rules
- applicable skills
- precedence outcomes
- generated file actions
- install/update/remove actions

#### Local Managed State

A machine-local manifest describing:

- connected org source
- current cache revision
- installed artifacts
- generated files
- adapter state

---

## Config Design

### Keep the Standard Skill Format Intact

Do not embed org-specific targeting directly into `SKILL.md`.

Reasoning:

- `SKILL.md` should remain portable and spec-compliant.
- Routing is org policy, not intrinsic skill content.

### Add Sidecar Metadata

Recommended example:

```yaml
enabled: true
mode: auto
priority: 50
source: org
agents:
  - claude-code
  - cursor
  - codex
applies_to:
  repos:
    - billing-api
  repo_patterns:
    - "platform-*"
  languages:
    - typescript
  frameworks:
    - nextjs
```

`mode` should support:

- `always`
- `auto`
- `manual`

Interpretation:

- `always`
  Included whenever compatible.
- `auto`
  Included when selectors match.
- `manual`
  Available/discoverable but not automatically applied.

### Org Config

Recommended root config file:

```yaml
version: 1
org:
  slug: acme
sources:
  local_overrides: true
defaults:
  auto_sync: true
  sync_interval_minutes: 60
  preferred_agents:
    - claude-code
    - cursor
    - codex
```

This should stay intentionally small in v1.

---

## Selector Engine

The selector engine is the technical center of the product.

### Inputs

- org repository metadata
- current agent
- current machine environment
- current repo context
- inferred stack facts
- local override state

### Repo Signals

- Git remote URL
- repo name
- current path
- optional repo tags/manifests
- presence of specific files

### Stack Signals

- `package.json`
- `tsconfig.json`
- `pnpm-workspace.yaml`
- `pyproject.toml`
- `go.mod`
- other low-cost heuristics as needed

### Output

An ordered, explainable `EffectiveContextPlan`.

### Precedence Model

Default precedence:

1. repo-specific matches
2. team/domain matches
3. org-global defaults
4. upstream/community defaults

Within the same tier:

- higher `priority` wins for conflicting base guidance
- non-conflicting skills can accumulate
- ties resolve lexically for deterministic output

This exact model must be visible in docs and CLI explain output.

---

## Sync Model

### One-Time Machine Setup

`connect` should:

- configure the org source
- clone/cache the private repo
- validate machine prerequisites
- detect installed agents
- install lightweight hooks or wrappers where required
- write managed local state
- perform initial sync

### Ongoing Sync

The tool should support:

- manual `sync`
- automatic periodic sync
- lightweight trigger-based refresh when supported agents are used

### Automation Strategy

MVP should prefer:

- shell hooks where appropriate
- wrapper/shim entrypoints where appropriate
- no mandatory background daemon

### Sync Planning

A sync operation should be plan-based:

1. fetch latest source state
2. recompute effective plan
3. diff against local managed state
4. apply the minimal set of changes
5. write new manifest/state

This makes dry-run and explainability easier.

---

## Agent Adapter Interface

Each adapter should implement something close to:

```ts
interface AgentAdapter {
  id: string;
  detect(): Promise<DetectionResult>;
  supportLevel(): SupportLevel;
  computePlan(input: AdapterPlanInput): Promise<AdapterPlan>;
  applyPlan(plan: AdapterPlan): Promise<AdapterApplyResult>;
  removeManagedState(): Promise<void>;
}
```

### Support Levels

- `full`
  Full managed adapter, including always-on base guidance wiring.
- `skills-only`
  Compatible via standard `skills` install, but without full base guidance generation.
- `unsupported`
  No managed behavior.

### First-Class Adapters in MVP

- Claude Code
- Cursor
- Codex

### Generic Compatibility Adapter

A generic bridge should still allow standard skills installation for agents supported by the `skills` ecosystem even when there is no first-class adapter yet.

---

## CLI Commands

### Admin-Facing

- `init-org`
- `new skill`
- `new base-rule`
- `validate`
- `preview`

### Developer-Facing

- `connect`
- `sync`
- `status`
- `why`
- `disconnect`

### Command Design Rules

- every command should support `--json`
- all mutating commands should support `--dry-run` where practical
- interactive prompts must be optional, never mandatory
- command handlers should delegate immediately into application services

---

## OSS Coding Standards

### General Standards

- ESM-first TypeScript
- strict TypeScript config
- avoid default exports for internal modules
- keep command handlers thin
- prefer pure functions in the selector and precedence engine
- isolate filesystem and subprocess side effects behind narrow service boundaries
- no hidden global mutable singletons

### TypeScript Standards

Enable strict compiler settings including:

- `strict`
- `noUncheckedIndexedAccess`
- `exactOptionalPropertyTypes`
- `noImplicitOverride`

Use project references if package boundaries start growing meaningfully.

### Public API Standards

- keep package exports explicit
- treat `packages/core` public exports as contracts
- avoid leaking internal file structure as de facto public API

### Error Handling

- no silent failures
- no swallowed subprocess stderr
- return typed domain errors where possible
- CLI layer maps domain errors into readable output and stable exit codes

### File Mutation Standards

- every generated file must include a managed header marker
- all writes should be atomic where possible
- preserve user-owned files unless explicitly opted into merge/overwrite behavior
- `disconnect` must only remove tool-managed artifacts

### Security Standards

- treat org-distributed skills with scripts as code, not content
- surface executable content in validation output
- never expand privileges beyond what the target agent or local user already has
- prefer argument-array subprocess invocation over shell strings

---

## Testing Strategy

### Test Layers

#### Unit Tests

Cover:

- selector parsing
- stack inference
- precedence resolution
- config parsing
- diff planning

#### Fixture Tests

Create representative org repos and target repos on disk, then assert:

- selected skills
- generated base files
- explainability output
- conflict outcomes

#### Adapter Contract Tests

Each adapter should share a test suite that verifies:

- detection
- plan computation
- apply behavior
- cleanup behavior

#### CLI Integration Tests

Spawn the CLI in temp directories and verify:

- init scaffolding
- connect flow
- sync behavior
- dry-run output
- JSON mode output

#### End-to-End Scenario Tests

Representative scenarios:

- org-global base only
- repo-specific rule application
- stack-specific skill application
- multiple-match precedence conflict
- unsupported or skills-only agent behavior

### What Makes a Good Test Here

- asserts externally meaningful behavior
- uses realistic file trees and repo contexts
- does not overfit to internal implementation
- keeps precedence and explainability deterministic

---

## CI/CD

### CI Checks

Run on every PR:

- install with pnpm
- typecheck
- Biome check
- unit + integration tests
- package build
- smoke test CLI entrypoint

### Release Flow

Use:

- Changesets for versioning and changelogs
- GitHub Actions for publish
- npm provenance on publish

### Suggested CI Matrix

- Node `22`
- Node `24`

This keeps support claims honest.

---

## Documentation Requirements

The repo should ship with:

- `README.md`
  Project purpose, quick start, support levels, precedence model
- `CONTRIBUTING.md`
  Local dev flow, test expectations, release workflow
- `docs/architecture.md`
  Package boundaries and adapter model
- `docs/config.md`
  Org repo layout and metadata schema
- `docs/security.md`
  Trust model for scripts and local mutation

The precedence model must appear in the README with examples. This was an explicit product requirement.

---

## Alternatives Considered

### oclif

Pros:

- mature CLI framework
- scaffolding
- plugin-oriented architecture
- battle-tested in large CLIs

Why not now:

- heavier than needed for v1
- introduces framework-specific project structure too early
- the product’s hard part is policy evaluation, not command plumbing

### Single-Package Repo

Pros:

- simpler initial layout

Why not now:

- the natural architecture already has core vs adapters vs CLI boundaries
- a monorepo avoids a later disruptive reshape

### ESLint + Prettier

Pros:

- familiar to many contributors

Why not now:

- more setup and slower CI
- Biome is sufficient and simpler for this repo type

### Always-Running Daemon

Pros:

- smoother automation story

Why not now:

- operationally heavier
- harder to trust and debug in OSS
- not required to meet MVP UX goals

---

## Implementation Phases

### Phase 1: Foundation

- bootstrap repo structure
- pnpm workspace
- Commander CLI shell
- core config schemas
- local state manifest
- `init-org`, `validate`, `preview`

### Phase 2: Core Engine

- selector engine
- precedence engine
- stack inference
- explainability
- fixture tests

### Phase 3: Machine Integration

- `connect`, `sync`, `status`, `why`, `disconnect`
- Git source cache
- `skills` CLI bridge
- managed file markers

### Phase 4: First-Class Adapters

- Claude Code adapter
- Cursor adapter
- Codex adapter
- adapter contract tests

### Phase 5: OSS Hardening

- docs
- release workflow
- provenance publishing
- contributor experience cleanup

---

## Final Recommendation

Build v1 as a **TypeScript + Node `>=22` + pnpm workspace monorepo**, using:

- **Commander.js** for CLI parsing
- **@clack/prompts** for interactive setup flows
- **Zod** for runtime schemas
- **execa** for external command bridges
- **Vitest** for tests
- **Biome** for linting and formatting
- **Changesets** for releases

This is the right stack if the priorities are:

- easy OSS contribution
- low operational complexity
- good long-term maintainability
- minimal framework lock-in
- strong foundations for a selector-heavy, adapter-based CLI tool
