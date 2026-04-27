# Cursor full adapter integration

**Type:** AFK

## Parent PRD

[org-agent-skills-prd.md](../org-agent-skills-prd.md)

## What to build

Implement a full managed adapter for Cursor. This slice should detect Cursor support on the machine, compute the Cursor-specific install or generation plan for always-on org guidance, integrate with sync and explainability flows, and render guidance in a way that respects Cursor's expected rule mechanisms while staying reversible and transparent. This covers the PRD's first-class support requirements for Cursor.

## Acceptance criteria

- [ ] The product can detect Cursor and report whether support is full, partial, or unavailable in a stable way.
- [ ] Org-managed always-on guidance can be rendered or wired into Cursor using managed and reversible local integration points.
- [ ] Cursor-specific managed behavior appears in sync, status, or explain output so developers can understand what is active and why.

## Blocked by

- `05-sync-managed-state-with-reversible-file-actions.md`
- `06-install-standard-skills-through-the-shared-bridge.md`

## User stories addressed

- User story 7
- User story 25
- User story 27
- User story 30
- User story 31
- User story 33
- User story 40
