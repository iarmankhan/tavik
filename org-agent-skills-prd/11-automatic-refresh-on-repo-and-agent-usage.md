# Automatic refresh on repo and agent usage

**Type:** AFK

## Parent PRD

[org-agent-skills-prd.md](../org-agent-skills-prd.md)

## What to build

Implement lightweight automatic refresh behavior so managed guidance updates happen without requiring developers to remember manual sync commands during normal repo and agent usage. This slice should stay within the MVP safety model by using lightweight hooks, wrappers, or equivalent trigger points rather than a mandatory background daemon, and it should degrade cleanly to explicit manual sync where a given agent cannot support automatic refresh safely. This aligns with the PRD's automation requirements and the MVP constraints in the parent PRD.

## Acceptance criteria

- [ ] The product supports at least one lightweight automatic refresh path during normal repo or supported-agent usage without requiring a permanent daemon.
- [ ] Automatic refresh behavior is scoped to safe, explainable managed integration points and does not silently take over unrelated repo state.
- [ ] When a specific agent cannot support automatic refresh cleanly, the product reports that limitation clearly and retains a manual sync fallback.

## Blocked by

- `05-sync-managed-state-with-reversible-file-actions.md`
- `08-codex-full-adapter-integration.md`
- `09-claude-code-full-adapter-integration.md`
- `10-cursor-full-adapter-integration.md`

## User stories addressed

- User story 24
- User story 25
- User story 31
