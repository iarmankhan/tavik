# Release

The intended release model is a standard OSS monorepo workflow: contributors merge reviewed changes, Changesets records intentional version bumps, and GitHub Actions handles publication with npm provenance.

## Versioning model

- Use Changesets for any user-visible package change.
- Keep release intent in pull requests rather than inferring it from commit messages.
- Let the release PR aggregate version bumps and changelog updates.

Minimal scaffolded config lives in [../.changeset/config.json](../.changeset/config.json).

## Contributor flow

1. Make the code or documentation change.
2. Add a changeset when the change affects a published package.
3. Merge through the normal pull request path.
4. Let the release automation open or update a version PR.
5. Merge the version PR to publish to npm with provenance.

Pure documentation-only changes usually do not need a changeset unless they accompany a published behavioral change.

## Draft GitHub Actions workflows

- [../.github/workflows/ci.yml](../.github/workflows/ci.yml)
  Runs the Node `22` and `24` matrix for install, typecheck, lint, test, build, and a CLI smoke check.
- [../.github/workflows/publish.yml](../.github/workflows/publish.yml)
  Uses Changesets on `main`, requests OIDC permissions, and enables npm provenance for publish.

These are draft workflows because the source packages and final script names are still being scaffolded, but the workflow shape matches the spec and should remain the target contract.

## Required repository settings

- Preferred end state: npm trusted publishing configured for the published packages.
- Draft fallback: `NPM_TOKEN` secret configured for publish while the repo still uses token-based Changesets automation.
- `contents: write`, `pull-requests: write`, and `id-token: write` permissions available to the publish workflow.
- Branch protection on `main`.
- Review requirements for release-impacting paths.

When the package settings are ready, migrate from long-lived tokens to npm trusted publishing. npm's current guidance prefers trusted publishers and automatically generates provenance for public packages published from public repositories.

## Expected package scripts

The workflows assume the root workspace will expose:

- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`
- `pnpm build`
- `pnpm --filter tavik exec tavik --help`

If package names or script names change during implementation, update both the workflows and this document in the same pull request.
