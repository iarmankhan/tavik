# Connect a machine to a private org source

**Type:** AFK

## Parent PRD

[org-agent-skills-prd.md](../org-agent-skills-prd.md)

## What to build

Implement the first developer onboarding flow so a machine can connect to a private org source repository using existing Git credentials. This slice should establish the local source cache or checkout, detect prerequisites, initialize managed local state, and perform the first trustworthy machine-level setup while favoring user-global integration points over repo mutation. This aligns with the PRD's Solution and Implementation Decisions for one-command onboarding and safe local behavior.

## Acceptance criteria

- [ ] A `connect` command can configure a private org source using the developer's existing Git authentication flow.
- [ ] The command initializes local managed state and records enough information to support later sync, status, and cleanup behavior.
- [ ] Setup defaults to user-global integration points and clearly indicates what machine-level state is now managed by the tool.

## Blocked by

- `01-bootstrap-org-source-with-starter-artifacts.md`
- `02-validate-org-repo-metadata-and-artifact-safety.md`

## User stories addressed

- User story 6
- User story 22
- User story 23
- User story 26
- User story 27
- User story 31
- User story 39
