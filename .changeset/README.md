# Changesets

Use Changesets for intentional versioning once the published packages exist.

Typical flow:

1. Run `pnpm changeset`.
2. Commit the generated markdown file in `.changeset/`.
3. Merge through the normal pull request path.
4. Let the publish workflow open or update the version PR.
5. Merge the version PR to publish with npm provenance.

Documentation-only changes do not usually need a changeset unless they ship with a user-visible package change.
