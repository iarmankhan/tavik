# Security

Org Agent Skills is a distribution and activation layer for trusted organization-managed guidance. It is not a sandbox and it should not pretend script-bearing skills are harmless content. The security model is based on explicit trust boundaries, transparent local mutation, and reviewable Git workflows.

## Trust assumptions

- The org source repository is trusted code reviewed through normal engineering workflows.
- Skills with `scripts/` content are executable code.
- The CLI runs with the local user's privileges and must not silently expand them.
- Unsupported agents should not receive speculative managed files.

## Script-bearing skills

Skills may include `scripts/`. That is allowed, but it changes the review posture.

Required documentation and validation behavior:

- surface that executable content exists
- surface notable external tool assumptions when possible
- keep the artifact path obvious in explainability output
- require normal pull request review for any script changes

If a skill can execute code or expects privileged tools, maintainers should document that in the artifact and in the pull request.

## Local mutation boundaries

The product should prefer user-global integration points over repo-local mutation.

Required behavior:

- managed files carry a clear header marker
- writes are atomic where practical
- user-owned files are preserved unless explicit overwrite semantics exist
- `disconnect` removes only tool-managed artifacts

The fastest way to lose trust in this product is opaque local mutation. Reversibility is a product requirement, not a cleanup bonus.

## Git-native governance

Recommended governance posture:

- use pull requests for all org guidance changes
- require review for base guidance and routing metadata
- protect the default branch
- add `CODEOWNERS` for sensitive paths such as base rules, root config, and script-bearing skills

This project is intentionally open source, but the same governance model should work for organizations that keep their source repo private.

## Explainability as a security feature

`status`, `why`, and `preview` are part of the trust model because they make managed behavior inspectable.

They should tell users:

- what matched
- where it came from
- what support level applies
- which files or adapter actions are planned
- when executable artifacts were included

## Release and supply-chain hardening

- CI should validate the supported Node matrix on every pull request.
- Versioning should be intentional through Changesets.
- npm publication should run from GitHub Actions with provenance enabled.
- Trusted publishing is preferred over long-lived publish tokens once package settings are in place.
- If a token is still used during bootstrap, scope it to publishing only and treat it as transitional.

Provenance does not replace code review, but it gives downstream adopters a stronger integrity signal for npm installs.

## What this tool does not guarantee

- It does not prevent developers from keeping local overrides.
- It does not enforce runtime policy inside third-party agents.
- It does not make unreviewed scripts safe.
- It does not replace host-level workstation security controls.
