# Bootstrap org source with starter artifacts

**Type:** AFK

## Parent PRD

[org-agent-skills-prd.md](../org-agent-skills-prd.md)

## What to build

Implement the first end-to-end admin bootstrap flow for a new organization source repository. This slice should deliver `init-org`, create the initial Git-native repository structure, scaffold starter config plus sample base guidance and sample skill artifacts, and include enough contributor documentation for another organization to adopt the workflow without custom infrastructure. This covers the bootstrap and Git-native source-of-truth requirements described in the PRD's Solution, Implementation Decisions, and Further Notes sections.

## Acceptance criteria

- [ ] Running `init-org` creates a valid starter org repository layout with config, sample base guidance, and at least one sample standard `SKILL.md` skill directory.
- [ ] The generated scaffold is editable as normal files and is designed for private Git repository usage rather than a hosted control plane.
- [ ] Starter docs explain the purpose of the generated artifacts and how Git review and CODEOWNERS-style governance fit into the workflow.

## Blocked by

None - can start immediately

## User stories addressed

- User story 3
- User story 4
- User story 5
- User story 6
- User story 17
- User story 18
- User story 37
- User story 38
- User story 39
