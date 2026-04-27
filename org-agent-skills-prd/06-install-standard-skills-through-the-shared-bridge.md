# Install standard skills through the shared bridge

**Type:** AFK

## Parent PRD

[org-agent-skills-prd.md](../org-agent-skills-prd.md)

## What to build

Implement the shared standard-skills bridge so portable `SKILL.md` artifacts can be installed and managed through the product without relying on a first-class agent adapter. This slice should preserve the standard Agent Skills format, route artifacts according to org metadata, and support compatibility for agents that can participate through the broader skills ecosystem even when they do not support managed always-on guidance. This follows the PRD's Solution and Implementation Decisions around portability and compatibility tiers.

## Acceptance criteria

- [ ] Standard `SKILL.md` artifacts can be selected and installed through the product's workflow without changing their core format.
- [ ] The shared bridge supports a skills-only compatibility path for agents that do not have a full adapter.
- [ ] Installed skill behavior is explainable through the same routing and support-level model used elsewhere in the product.

## Blocked by

- `03-preview-effective-context-for-one-repo.md`
- `04-connect-a-machine-to-a-private-org-source.md`
- `05-sync-managed-state-with-reversible-file-actions.md`

## User stories addressed

- User story 2
- User story 17
- User story 20
- User story 21
- User story 35
