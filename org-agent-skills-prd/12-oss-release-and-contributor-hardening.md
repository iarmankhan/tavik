# OSS release and contributor hardening

**Type:** AFK

## Parent PRD

[org-agent-skills-prd.md](../org-agent-skills-prd.md)

## What to build

Implement the OSS hardening slice that turns the product into a credible adoptable open-source project for other organizations. This should include the required documentation for precedence, configuration, security, and architecture, plus release automation and verification workflows that support Git-native contribution and npm distribution trust signals. This follows the PRD's open-source positioning, documentation requirements, and trust goals.

## Acceptance criteria

- [ ] The repository includes contributor and user-facing documentation for project purpose, precedence behavior, configuration, architecture, and security expectations.
- [ ] CI validates the supported Node matrix and the project's build, lint, and test contracts in a reproducible way.
- [ ] Release automation supports intentional versioning and trusted publish behavior suitable for an OSS CLI distributed through npm.

## Blocked by

- `01-bootstrap-org-source-with-starter-artifacts.md`
- `02-validate-org-repo-metadata-and-artifact-safety.md`
- `03-preview-effective-context-for-one-repo.md`
- `05-sync-managed-state-with-reversible-file-actions.md`

## User stories addressed

- User story 5
- User story 12
- User story 37
- User story 38
- User story 39
