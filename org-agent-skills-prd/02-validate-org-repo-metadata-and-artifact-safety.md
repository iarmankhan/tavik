# Validate org repo metadata and artifact safety

**Type:** AFK

## Parent PRD

[org-agent-skills-prd.md](../org-agent-skills-prd.md)

## What to build

Implement validation for org configuration, sidecar metadata, and artifact safety signals so maintainers can catch malformed metadata, ambiguous targeting, and script-bearing skill risks before rollout. This slice should validate standard skill packaging remains intact while the org-specific routing layer is enforced outside `SKILL.md`, matching the PRD's Implementation Decisions and Testing Decisions.

## Acceptance criteria

- [ ] A `validate` command checks org config, sidecar metadata, and artifact structure for required fields and malformed values.
- [ ] Validation reports selector and routing problems clearly enough for maintainers to fix them before merge.
- [ ] Validation output explicitly surfaces when a skill contains executable scripts or notable external tool assumptions.

## Blocked by

- `01-bootstrap-org-source-with-starter-artifacts.md`

## User stories addressed

- User story 14
- User story 17
- User story 18
- User story 20
- User story 21
- User story 36
