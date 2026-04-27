# Tavik

Tavik is a CLI for managing organization-owned AI agent guidance and reusable skills.

It does three things:

- scaffolds and validates an org guidance repository
- connects a developer machine to that org source
- applies the right base guidance and skills for a repo and agent, with explainable precedence and reversible local state

## Requirements

- Node `22` or `24`
- `pnpm`
- Git available on the machine

## Install

From this repository:

```bash
pnpm install
pnpm build
```

Run the CLI with:

```bash
pnpm dev -- --help
```

Or after build:

```bash
node apps/cli/dist/index.js --help
```

## CLI overview

Admin commands:

- `init-org`
- `new skill`
- `new base-rule`
- `validate`
- `preview`

Developer commands:

- `connect`
- `sync`
- `status`
- `why`
- `disconnect`

## Bootstrap an org source

Create a new org guidance repository:

```bash
pnpm dev -- init-org --org-slug acme --path ./acme-agent-skills
```

This creates:

- `tavik.config.yml`
- `skills/`
- `base-rules/`
- starter sample artifacts

## Org repo layout

Typical structure:

```text
acme-agent-skills/
  tavik.config.yml
  skills/
    example-typescript-skill/
      SKILL.md
      skill.metadata.yml
  base-rules/
    org-default/
      base.md
      rule.metadata.yml
```

`SKILL.md` stays portable. Routing and rollout live in sidecar metadata and root config.

## Create artifacts

Create a new skill:

```bash
pnpm dev -- new skill --org-root ./acme-agent-skills --name "TypeScript Strictness"
```

Create a new base rule:

```bash
pnpm dev -- new base-rule --org-root ./acme-agent-skills --name "Billing API Defaults"
```

## Validate the org source

Validate config, metadata, selectors, and executable-content flags:

```bash
pnpm dev -- validate --org-root ./acme-agent-skills
```

JSON output is available on most commands:

```bash
pnpm dev -- validate --org-root ./acme-agent-skills --json
```

## Preview what applies

Preview the effective context for a repo and agent without mutating anything:

```bash
pnpm dev -- preview \
  --org-root ./acme-agent-skills \
  --agent codex \
  --repo-path ~/src/billing-api
```

Explain why guidance applies:

```bash
pnpm dev -- why \
  --org-root ./acme-agent-skills \
  --agent cursor \
  --repo-path ~/src/billing-api
```

## Connect a machine

Connect using a local org source:

```bash
pnpm dev -- connect \
  --org-source ./acme-agent-skills \
  --machine-root ~/.tavik-machine
```

Connect using a Git source:

```bash
pnpm dev -- connect \
  --org-source git@github.com:acme/acme-agent-skills.git \
  --machine-root ~/.tavik-machine
```

`connect` will:

- resolve the org source from a local path or clone it into managed cache
- write managed state under `.tavik/`
- detect support levels for known agents
- install lightweight refresh artifacts such as wrappers and shell-hook files

## Sync guidance

Apply guidance for a repo and agent:

```bash
pnpm dev -- sync \
  --agent codex \
  --machine-root ~/.tavik-machine \
  --repo-path ~/src/billing-api
```

If the machine is already connected, `sync` can use the connected source automatically. You can still override the source explicitly with `--org-root`.

`sync` will:

- refresh the connected Git source when applicable
- compute matching base rules and skills
- run the agent adapter plan
- execute shared-skills bridge installs when needed
- persist updated managed state

## Check machine state

Show connected source, managed files, refresh artifacts, and support levels:

```bash
pnpm dev -- status --machine-root ~/.tavik-machine
```

## Disconnect and clean up

Remove only tool-managed artifacts:

```bash
pnpm dev -- disconnect --machine-root ~/.tavik-machine
```

## Support levels

- `full`: first-class managed adapter with local always-on guidance handling
- `skills-only`: standard skills bridge only
- `unsupported`: no managed behavior

Current adapters:

- `codex`
- `claude-code`
- `cursor`
- `generic-skills`

## Precedence

Default precedence order:

1. repo-specific matches
2. repo-pattern or domain-style matches
3. org-global defaults
4. upstream or community defaults

Within the same tier:

- higher `priority` wins for conflicting base guidance
- non-conflicting skills accumulate
- remaining ties resolve lexically

Use `why` to inspect the actual resolution for a repo.

## Managed state

The CLI writes machine-managed state under:

```text
<machine-root>/.tavik/
```

That state can include:

- cached Git source checkout
- adapter-managed files
- refresh wrapper and hook artifacts
- executed shared-skills actions
- support-level detection results

## Development

Main workspace commands:

```bash
pnpm typecheck
pnpm test
pnpm lint
pnpm build
```

Additional documentation:

- [CONTRIBUTING.md](CONTRIBUTING.md)
- [docs/architecture.md](docs/architecture.md)
- [docs/config.md](docs/config.md)
- [docs/security.md](docs/security.md)
- [docs/release.md](docs/release.md)
