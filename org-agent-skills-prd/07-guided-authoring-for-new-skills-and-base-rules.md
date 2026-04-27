# Guided authoring for new skills and base rules

**Type:** AFK

## Parent PRD

[org-agent-skills-prd.md](../org-agent-skills-prd.md)

## What to build

Implement guided authoring commands that create compliant new skill artifacts and new base guidance artifacts without forcing maintainers to hand-author every file. This slice should reuse the project's config and validation expectations so the generated outputs fit the artifact-centric authoring model and remain transparent to direct file editing. This covers the PRD's contributor ergonomics requirements and authoring decisions.

## Acceptance criteria

- [ ] A `new skill` command scaffolds a standard `SKILL.md` directory plus any required sidecar metadata in a valid starting shape.
- [ ] A `new base-rule` command scaffolds always-on guidance artifacts and associated metadata in a valid starting shape.
- [ ] Generated authoring outputs remain normal editable files and pass the validation rules defined for the org repo.

## Blocked by

- `01-bootstrap-org-source-with-starter-artifacts.md`
- `02-validate-org-repo-metadata-and-artifact-safety.md`

## User stories addressed

- User story 13
- User story 18
- User story 19
- User story 20
