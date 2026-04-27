# Contributing

This repository is being built as a TypeScript monorepo for the Org Agent Skills CLI. The current source of truth is the PRD, tech spec, and the documentation contracts in this repo. Keep implementation work aligned to those contracts unless a follow-up decision explicitly changes them.

## Baseline toolchain

- Node `24` for local development.
- Node `22` and `24` in CI.
- `pnpm` workspaces.
- TypeScript, Vitest, Biome, and Changesets once the packages are scaffolded.

## Expected workspace shape

```text
apps/
  cli/
packages/
  core/
  adapters/
  config/
  testkit/
docs/
.github/
.changeset/
```

## Development flow

1. Read the relevant PRD slice and supporting docs before changing behavior.
2. Keep command handlers thin; business logic belongs in `packages/core`.
3. Keep org routing metadata outside `SKILL.md`.
4. Preserve the documented support levels and precedence model.
5. Prefer additive changes over rewrites when parallel work is happening.

## Standards to preserve

- ESM-first TypeScript.
- Strict compiler settings.
- No hidden global mutable state.
- Filesystem and subprocess effects isolated behind narrow service boundaries.
- Generated files clearly marked as managed.
- `disconnect` removes only tool-managed artifacts.

## Testing expectations

When the packages exist, contributions should keep these contracts green:

- `pnpm install --frozen-lockfile`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`
- `pnpm build`

Tests should focus on externally meaningful behavior:

- selector matching
- precedence outcomes
- explainability output
- sync idempotency
- adapter contract behavior
- reversible cleanup

## Documentation expectations

Update docs in the same change when you modify:

- command semantics
- precedence behavior
- config shape
- support levels
- trust or security boundaries
- release assumptions

The README must continue to include concrete precedence examples.

## Release workflow

This repo is set up for Changesets-driven versioning.

1. Add a changeset for any user-visible package change.
2. Merge through pull request review.
3. Let the release workflow open or update a version PR on `main`.
4. Publish from GitHub Actions with npm provenance once the version PR lands.

More detail: [docs/release.md](docs/release.md).

## Security review expectations

- Treat script-bearing skills as executable code.
- Call out new local mutation paths explicitly in PR descriptions.
- Avoid adding speculative agent integration files for unsupported agents.
- Prefer argument-array subprocess execution over shell strings.

## Pull request checklist

- The change matches the PRD and tech spec, or the delta is documented.
- Docs were updated alongside behavior changes.
- Precedence remains deterministic.
- Support level reporting remains explicit.
- Any new managed files have a clear ownership and cleanup story.
