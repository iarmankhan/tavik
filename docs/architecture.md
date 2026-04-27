# Architecture

Org Agent Skills is structured as a small monorepo with a thin CLI and a deep core engine. The product's hard part is policy evaluation, not command plumbing, so the boundaries are designed to keep routing, precedence, validation, and explainability testable in isolation.

## Layer model

### CLI layer

Responsibilities:

- command parsing
- prompt flows
- human-readable and JSON output
- exit-code mapping

The CLI should delegate immediately into application services and avoid embedding policy decisions.

### Core engine

Responsibilities:

- reading org config and sidecar metadata
- selector evaluation
- precedence resolution
- effective context planning
- sync planning
- validation
- explainability
- machine-local state management

This is the main deep module in the system and should carry the heaviest test coverage.

### Agent adapters

Responsibilities:

- detecting installed agents
- reporting support level
- locating integration points
- computing adapter-specific plans
- applying and removing managed state

MVP first-class adapters:

- Claude Code
- Cursor
- Codex

Generic compatibility should exist for skills-only agents that can consume the standard skills ecosystem without first-class always-on rule generation.

### External tool bridges

Responsibilities:

- `git` invocation
- `skills` CLI invocation
- future agent-native helper invocations when needed

These bridges should keep shelling and filesystem effects away from the core domain logic.

## Planned package layout

```text
apps/
  cli/
    src/
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

## Key domain objects

### Org source

A Git-backed source repository that stores:

- base guidance artifacts
- standard `SKILL.md` directories
- sidecar routing metadata
- root org config
- templates and starter artifacts

### Skill artifact

A portable Agent Skills directory containing `SKILL.md` and optional `references/`, `scripts/`, or `assets/`.

### Base rule artifact

Always-on guidance that adapters render into agent-native integration points where first-class support exists.

### Selector

A rule that determines whether an artifact applies to a repo, stack, agent, or machine context.

### Effective context plan

The computed plan for one machine, repo, and agent context:

- matching skills
- matching base rules
- precedence outcomes
- planned file actions
- planned install or removal actions

### Local managed state

A machine-local manifest that records connected source details, installed artifacts, generated files, and adapter state so `sync` and `disconnect` remain deterministic.

## Request flow

The planned lifecycle for `preview`, `sync`, and `why` is:

1. Read org config and sidecar metadata.
2. Detect repo and stack signals.
3. Evaluate selectors.
4. Resolve precedence.
5. Produce an effective context plan.
6. Either explain it, render a dry run, or apply adapter/file changes.
7. Persist managed state for the next reconciliation.

## Support-level model

| Level | Adapter behavior |
| --- | --- |
| `full` | Adapter manages always-on guidance and reports concrete install state. |
| `skills-only` | Standard skills may install through the shared bridge, but no speculative always-on files are generated. |
| `unsupported` | The system reports the limitation and avoids managed mutation. |

Support level is a user-facing contract, not an internal detail. `status` and `why` should surface it directly.

## Design constraints

- Keep `SKILL.md` portable and standard.
- Keep org routing policy in explicit config and metadata.
- Favor user-global integration points over repo-local mutation.
- Make all managed changes reversible.
- Keep explainability and precedence deterministic.
