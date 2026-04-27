# Sync managed state with reversible file actions

**Type:** AFK

## Parent PRD

[org-agent-skills-prd.md](../org-agent-skills-prd.md)

## What to build

Implement plan-based sync and cleanup so the machine can reconcile org-managed guidance with local managed state safely and reversibly. This slice should fetch or read the latest source state, diff the effective plan, apply the minimal set of changes, mark managed files clearly, and support clean disconnect behavior that preserves user-owned content boundaries. This maps directly to the PRD's requirements for transparency, reversibility, and low-friction ongoing sync.

## Acceptance criteria

- [ ] A `sync` command recomputes effective context and applies only the required changes to managed state and generated artifacts.
- [ ] Any files generated or modified by the tool are clearly marked as managed and can be distinguished from user-owned files.
- [ ] A `disconnect` or cleanup flow removes only tool-managed artifacts and leaves personal local rules intact.

## Blocked by

- `03-preview-effective-context-for-one-repo.md`
- `04-connect-a-machine-to-a-private-org-source.md`

## User stories addressed

- User story 24
- User story 26
- User story 27
- User story 28
- User story 29
- User story 30
