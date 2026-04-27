# Preview effective context for one repo

**Type:** AFK

## Parent PRD

[org-agent-skills-prd.md](../org-agent-skills-prd.md)

## What to build

Implement the first selector-engine tracer bullet for a single repo and agent context. This slice should read org metadata, infer relevant repo or stack signals, compute applicable skills and base guidance, resolve precedence deterministically, and render a human-readable preview or explanation without mutating the machine. This covers the PRD's Solution, Implementation Decisions, and Testing Decisions around explainability and predictable routing.

## Acceptance criteria

- [ ] A `preview` or equivalent command computes the effective context for a repo plus agent input without writing managed files.
- [ ] Output identifies which base guidance and skills apply, which selectors matched, and how precedence resolved conflicts.
- [ ] The precedence model used by the command is deterministic and matches the documented ordering in the parent PRD.

## Blocked by

- `01-bootstrap-org-source-with-starter-artifacts.md`
- `02-validate-org-repo-metadata-and-artifact-safety.md`

## User stories addressed

- User story 8
- User story 9
- User story 10
- User story 11
- User story 12
- User story 15
- User story 16
- User story 20
- User story 21
- User story 30
- User story 31
- User story 40
