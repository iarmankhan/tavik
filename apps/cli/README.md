# Tavik CLI

`tavik` manages organization-owned AI agent guidance and reusable skills.

## Requirements

- Node `22` or newer
- Git available on the machine

## Install

Run without installing globally:

```bash
npx tavik --help
```

Or install it:

```bash
npm install --global tavik
tavik --help
```

## Common Commands

Create a new org guidance repository:

```bash
tavik init-org --org-slug acme --path ./acme-agent-skills
```

Validate an org guidance repository:

```bash
tavik validate --org-root ./acme-agent-skills
```

Preview guidance for a repository and agent:

```bash
tavik preview \
  --org-root ./acme-agent-skills \
  --agent codex \
  --repo-path ~/src/billing-api
```

Connect a machine to an org source:

```bash
tavik connect \
  --org-source ./acme-agent-skills \
  --machine-root ~/.tavik-machine
```

Sync guidance for a repository:

```bash
tavik sync \
  --agent codex \
  --machine-root ~/.tavik-machine \
  --repo-path ~/src/billing-api
```
