# Configuration

Org Agent Skills separates portable skill content from org-specific routing policy. `SKILL.md` remains standard and reusable; targeting, priority, enablement, and support constraints live in root config and sidecar metadata.

## Recommended repository shape

```text
base-rules/
  org-defaults/
  repos/
skills/
  shared/
  stacks/
templates/
tavik.config.yml
```

Directory names can evolve during implementation, but the boundary should not: base guidance, skills, and org policy metadata stay explicit and reviewable in Git.

## Root org config

This document uses `tavik.config.yml` as the canonical example filename for the root config.

```yaml
version: 1
org:
  slug: acme
sources:
  local_overrides: true
defaults:
  auto_sync: true
  sync_interval_minutes: 60
  preferred_agents:
    - claude-code
    - cursor
    - codex
```

### Field intent

- `version`: schema version for future migrations.
- `org.slug`: stable org identifier used in output, state, and templates.
- `sources.local_overrides`: whether machine-local overrides are acknowledged by the planner.
- `defaults.auto_sync`: default sync posture after `connect`.
- `defaults.sync_interval_minutes`: periodic refresh hint for supported automation hooks.
- `defaults.preferred_agents`: ordered list of first-class adapters to target first.

## Sidecar metadata

Routing policy belongs beside the artifact, not inside `SKILL.md`.

Example sidecar metadata:

```yaml
enabled: true
mode: auto
priority: 50
source: org
agents:
  - claude-code
  - cursor
  - codex
applies_to:
  repos:
    - billing-api
  repo_patterns:
    - "platform-*"
  languages:
    - typescript
  frameworks:
    - nextjs
```

### Supported metadata concepts

- `enabled`: whether the artifact participates in planning.
- `mode`: automatic behavior contract.
- `priority`: conflict resolution within a precedence tier.
- `source`: intended source layer such as org or upstream.
- `agents`: compatibility filter for adapters.
- `applies_to`: selector bundle for repo and stack routing.

## Mode semantics

| Mode | Meaning |
| --- | --- |
| `always` | Include whenever the artifact is compatible with the current context. |
| `auto` | Include when selectors match. |
| `manual` | Keep available for discovery, but do not auto-apply. |

`manual` is especially useful for high-context or invasive skills that should remain discoverable without becoming ambient defaults.

## Selector classes

The selector engine should support both explicit and inferred targeting.

Explicit:

- exact repo names
- repo patterns
- agent identifiers
- optional path or domain tags

Inferred:

- language detection
- framework detection
- common project-file detection such as `package.json`, `tsconfig.json`, `pyproject.toml`, or `go.mod`

## Precedence rules in config

Precedence is not another field to tweak arbitrarily; it is a product-level rule:

1. Repo-specific matches
2. Team or domain matches
3. Org-global defaults
4. Upstream or community defaults

Within one tier:

- higher `priority` wins for conflicting base guidance
- non-conflicting skills may all apply
- ties resolve lexically

Config should make that resolution explainable rather than trying to bypass it.

## Validation expectations

`validate` should eventually check:

- root config schema correctness
- malformed or missing sidecar metadata
- ambiguous or overlapping selectors
- unknown agent identifiers
- unsafe or surprising executable content signals
- artifact-mode mismatches such as an `always` artifact with incompatible selectors

## Example artifact split

```text
skills/
  shared/
    repo-hygiene/
      SKILL.md
      references/
      repo-hygiene.meta.yaml

base-rules/
  repos/
    billing-api.base-rule.md
    billing-api.meta.yaml
```

The important constraint is the split itself: portable skill content stays portable, while org policy metadata stays editable without forking the underlying skill format.
