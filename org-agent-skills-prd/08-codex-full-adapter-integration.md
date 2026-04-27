# Codex full adapter integration

**Type:** AFK

## Parent PRD

[org-agent-skills-prd.md](../org-agent-skills-prd.md)

## What to build

Implement the first full managed agent adapter for Codex. This slice should detect Codex support on the machine, compute the Codex-specific install or generation plan for always-on org guidance, integrate with sync and explainability flows, and report support level clearly. This covers the PRD's multi-agent support and adapter-isolation requirements for Codex specifically.

## Acceptance criteria

- [ ] The product can detect Codex and report whether support is full, partial, or unavailable in a stable way.
- [ ] Org-managed always-on guidance can be rendered or wired into Codex using managed and reversible local integration points.
- [ ] Codex-specific managed behavior appears in sync, status, or explain output so developers can understand what is active and why.

## Blocked by

- `05-sync-managed-state-with-reversible-file-actions.md`
- `06-install-standard-skills-through-the-shared-bridge.md`

## User stories addressed

- User story 7
- User story 25
- User story 27
- User story 30
- User story 31
- User story 34
- User story 40
