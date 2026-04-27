# Org Agent Skills PRD

## Problem Statement

Organizations using multiple coding agents such as Cursor, Claude Code, and Codex end up with fragmented guidance spread across repo-local `AGENTS.md` files, `CLAUDE.md`, Cursor rules, ad hoc prompt snippets, and tribal knowledge. Repo-specific context is hard to maintain consistently, org-wide guidance has no central distribution point, and senior engineers cannot easily share reusable lessons, workflows, or policies with the rest of the team.

Existing agent ecosystems already support reusable skills, especially the open Agent Skills format centered on `SKILL.md`, but teams still lack an organization-level system to:

- manage private shared skills and always-on guidance in one place
- selectively apply repo-specific or stack-specific guidance automatically
- distribute updates to developer machines with minimal setup
- support multiple agents without forcing each repo to hand-roll its own context strategy
- let maintainers safely contribute, review, validate, and evolve guidance over time

The product should solve this as an open-source, Git-native tool that other organizations can adopt for their own private skill repositories.

## Solution

Build a Git-native CLI product that manages private, org-scoped agent guidance and reusable skills using the standard Agent Skills format.

The product has two primary responsibilities:

1. Distribute and sync org-managed guidance
   - Provide a central private repository containing:
     - always-on org guidance for supported agents
     - reusable `SKILL.md`-based skills
     - metadata that determines when guidance applies
   - Keep developer machines locally synced with the org repository.

2. Apply the right guidance automatically
   - Install and manage standard skills via the existing `skills` ecosystem.
   - Generate or wire in always-on guidance for supported agents.
   - Evaluate repo selectors and stack selectors to auto-apply repo-specific and technology-specific guidance.
   - Expose explainability so developers and maintainers can see what is active and why.

The tool is not a new skill format. It is an org management layer around:

- standard Agent Skills folders with `SKILL.md`
- agent-native always-on rule files
- Git-based contribution and review workflows
- local automation for sync and activation

The product should be easy to bootstrap:

- an org admin can scaffold a new org repo with one command
- a developer can connect their machine with one command
- after setup, syncing and application should be mostly automatic

The product should be assistive, not authoritarian:

- developer-local overrides may exist
- org guidance is distributed clearly and consistently
- enforcement of coding quality remains outside the tool

## User Stories

1. As a principal engineer, I want one central place to store org-wide agent guidance, so that every team does not reinvent scattered prompt files.
2. As a principal engineer, I want to publish reusable coding skills in a standard format, so that teams can share workflows without custom per-agent rewrites.
3. As an org admin, I want to bootstrap a new org skills repo with one command, so that setup for a new company or team is low friction.
4. As an org admin, I want the tool to scaffold starter base guidance and sample skills, so that adopters do not need to learn the full schema before trying it.
5. As an org admin, I want the system to remain Git-native, so that changes can go through pull requests, code review, and CODEOWNERS.
6. As an org admin, I want to keep the source repo private, so that internal workflows and guidance are not exposed publicly.
7. As an org admin, I want to distribute always-on guidance for Claude Code, Cursor, and Codex, so that all developers start from a shared baseline.
8. As an org admin, I want to attach metadata to a skill or rule saying it applies to certain repos, so that repo-specific shared guidance is automatic instead of manual.
9. As an org admin, I want to target rules by repo name or repo pattern, so that platform or domain-specific guidance can be rolled out safely.
10. As an org admin, I want to target skills by language or framework, so that only relevant context is applied to a repo.
11. As an org admin, I want deterministic precedence across global, repo-specific, and upstream guidance, so that the resulting behavior is predictable.
12. As an org admin, I want the precedence model documented clearly in generated docs, so that maintainers understand how conflicts are resolved.
13. As an org admin, I want guided CLI authoring commands, so that contributors can add skills or rules without hand-authoring every file correctly.
14. As an org admin, I want a validation command, so that malformed `SKILL.md`, bad metadata, and conflict-prone selectors are caught before merge.
15. As an org admin, I want a preview command, so that I can see what generated agent files will look like before rollout.
16. As an org admin, I want an explain command, so that I can understand why a given repo receives certain guidance.
17. As an org admin, I want the system to support standard `SKILL.md` directories with optional `references/`, `scripts/`, and `assets/`, so that the skills stay portable.
18. As a maintainer, I want to edit source files directly if I choose, so that the system stays transparent and not trapped behind a custom UI.
19. As a maintainer, I want the CLI to create new skills and base rules for me, so that common authoring tasks are fast and less error-prone.
20. As a maintainer, I want to mark content as always-on base guidance versus on-demand or auto-applied skill content, so that the system respects the different semantics.
21. As a maintainer, I want to reuse the same skill content across multiple repos with different selectors, so that skills remain portable and routing stays org-specific.
22. As a developer, I want to run one connect command on a new machine, so that I do not need repeated manual setup for every agent.
23. As a developer, I want the tool to use my existing Git authentication, so that I do not need a second account or custom login flow.
24. As a developer, I want the tool to sync automatically after setup, so that I do not need to remember to run commands constantly.
25. As a developer, I want the tool to update when I enter or use a repo through supported agents, so that repo-specific guidance appears without manual intervention.
26. As a developer, I want the tool to stay mostly in user-global locations by default, so that it does not unexpectedly modify my repos.
27. As a developer, I want any managed files to be clearly marked and reversible, so that I trust what the tool changed on my machine.
28. As a developer, I want a disconnect or cleanup command, so that I can remove the tool’s managed integration cleanly.
29. As a developer, I want my own personal local rules to continue working, so that org guidance does not block personal productivity.
30. As a developer, I want to inspect which skills and rules are active for my current repo, so that I can understand the AI context I am operating under.
31. As a developer, I want to know whether support for my agent is full, partial, or unsupported, so that I know what behavior to expect.
32. As a developer using Claude Code, I want org-managed always-on guidance to integrate with Claude’s native memory model, so that usage feels native.
33. As a developer using Cursor, I want generated rules to align with Cursor’s expected rule mechanisms, so that the tool does not fight the editor.
34. As a developer using Codex, I want the tool to generate compatible always-on guidance and skill availability, so that I can benefit from the same org knowledge.
35. As a developer using another compatible agent, I want standard skills to still install when possible, so that the tool is still useful even without a custom adapter.
36. As a security-conscious maintainer, I want skills containing scripts to be allowed but visible, so that executable content is reviewed as code instead of hidden as docs.
37. As a reviewer, I want normal Git pull requests to remain the approval path for org skills, so that governance fits existing engineering workflows.
38. As an open-source adopter from another company, I want to run the same bootstrap flow in my own environment, so that the product is reusable outside the original org.
39. As an open-source adopter, I want to point the CLI at my own private Git repo, so that I control my data and policies.
40. As a future platform maintainer, I want agent integration behavior isolated behind adapters, so that support for new agents can be added without rewriting the core engine.

## Implementation Decisions

- The canonical reusable skill format is the open Agent Skills structure:
  - a folder with a required `SKILL.md`
  - optional `references/`, `scripts/`, and `assets/`
  - no custom replacement format for core skill content
- The product adds an org-specific metadata layer outside `SKILL.md` for routing and rollout decisions.
- The source of truth is a private Git repository per organization.
- The org repository contains two distinct content classes:
  - always-on base guidance for agents
  - standard reusable skills
- The repository should also contain org-specific configuration or catalog metadata that controls:
  - selectors
  - source ownership
  - enablement
  - priority
  - mode
  - compatibility targeting
- The product is CLI-first for both admins and developers.
- The CLI is the single user-facing entry point and should orchestrate underlying `skills` CLI behavior rather than requiring users to manually operate both tools.
- The bootstrap experience should be one-command scaffolding for org admins, including starter content and contributor documentation.
- The developer onboarding experience should be one-command machine connection using existing Git credentials.
- The product should use existing Git authentication from the user’s environment rather than building a hosted identity system in MVP.
- Local automation is required after setup. The product should not rely on developers manually running sync commands repeatedly.
- MVP automation should prefer lightweight shell hooks and/or agent wrapper/shim integrations rather than an always-running daemon.
- Manual sync must still exist for transparency and recovery.
- The product should maintain a local cache or checkout of the org repository plus a local manifest or state file describing installed and managed content.
- Managed files created by the tool must be clearly labeled and removable.
- Default installation behavior should favor user-global integration points over repo-local file modification.
- Repo-local modification may be supported later or via explicit opt-in, but it is not the default safety model.
- The tool is assistive rather than enforce-and-block:
  - personal local overrides may continue to exist
  - org guidance is distributed and made visible
  - enforcement is outside the product’s core responsibility
- The product must support both explicit and inferred targeting.
- Explicit targeting includes selectors such as:
  - exact repo names
  - repo patterns
  - agent compatibility
  - optional path/domain tags
- Inferred targeting includes heuristics such as:
  - language detection
  - framework detection
  - common project file detection
- The precedence model must be deterministic and documented.
- Default precedence order:
  1. repo-specific matches
  2. team or domain matches
  3. org-global defaults
  4. upstream or community defaults
- Within the same precedence level:
  - higher priority wins for conflicting generated base guidance
  - non-conflicting skills may all apply
  - remaining ties are resolved deterministically by stable lexical order
- The README and contributor docs must explain the precedence model with concrete examples.
- The product must expose explainability commands such as status/why/explain to show:
  - what applies
  - what source it came from
  - what support level exists for the current agent
  - why a selector matched
- The product should support layered sources conceptually, but MVP can focus on org source plus local override while keeping room for future upstream layering.
- The architecture should separate:
  - core engine for sync, selector evaluation, precedence, validation, and explainability
  - agent adapters for rendering/install behavior per agent
- MVP should provide first-class adapters for:
  - Claude Code
  - Cursor
  - Codex
- MVP should also support a broader compatibility tier for other agents reachable through the standard skills ecosystem.
- Support should be explicit in three levels:
  - full managed adapter
  - skills-only compatibility
  - unsupported
- For agents without a first-class adapter, the system may install compatible skills through the standard skills workflow but should not generate speculative always-on integration files.
- Skills containing scripts are allowed.
- Skills with scripts should be treated as trusted code from the private org repository and reviewed through normal Git workflows.
- Validation and documentation should surface when a skill includes executable content or notable external tool assumptions.
- Contributor ergonomics are a product requirement, not a documentation afterthought.
- The CLI should provide guided authoring commands for:
  - org initialization
  - skill creation
  - base guidance creation
  - validation
  - preview
  - explainability
  - sync
- The authoring model should be artifact-centric rather than repo-centric, so maintainers create reusable skills and rules with attached selectors instead of manually editing one repo at a time.
- The product is open source and must be designed so another organization can adopt it without relying on the original author’s infrastructure.

## Testing Decisions

- Good tests should validate external behavior and stable contracts rather than implementation details.
- Good tests for this product should answer:
  - given a repo and machine context, what guidance is selected
  - what precedence outcome is produced
  - what files are generated or installed
  - what explainability output is shown
  - whether the setup and sync flows are reversible and deterministic
- The core selector and precedence engine should be deeply tested because it is the center of trust in the system.
- The validation layer should be tested against both valid and invalid skill repositories, including malformed metadata and ambiguous targeting.
- The agent adapter layer should be tested through contract-style tests that assert generated outputs and install decisions for each supported agent.
- The CLI authoring flows should be tested for scaffold correctness, especially creation of spec-compliant `SKILL.md` structures and sidecar metadata.
- The sync engine should be tested for idempotency and update behavior across repeated runs.
- The explainability commands should be tested for stable, human-readable output describing matched selectors and precedence.
- Reversibility should be tested explicitly:
  - connect followed by disconnect
  - managed file cleanup
  - restoration of non-managed content boundaries
- Script-bearing skills should be covered by validation and warning tests to ensure executable content is surfaced to maintainers.
- End-to-end tests should cover a representative matrix:
  - one org-global skill
  - one repo-targeted rule
  - one stack-targeted skill
  - one conflicting precedence case
  - one unsupported or partial-support agent case
- Tests should avoid asserting internal storage layout unless it is part of a public contract.

## Out of Scope

- Building a hosted SaaS control plane in MVP
- Building a custom identity or access-management system
- Replacing the standard Agent Skills format with a proprietary format
- Enforcing developer compliance with org guidance at runtime
- Preventing developers from creating personal overrides
- Deep governance workflows beyond normal Git review and ownership
- Guaranteed first-class support parity for every agent supported by the wider skills ecosystem
- A mandatory always-running local daemon in MVP
- Solving code review or CI policy enforcement directly in this product
- Designing a full web UI in MVP

## Further Notes

- The product should align closely with the existing `skills` ecosystem and avoid unnecessary divergence from standard packaging and installation flows.
- Always-on base guidance and reusable skills are distinct concepts and should remain separate in both repository layout and mental model.
- The biggest adoption risks are setup friction, confusing precedence, and opaque local mutations. The product should optimize explicitly against those failure modes.
- The open-source positioning is strongest if the tool feels like a thin but opinionated org layer over existing standards rather than a replacement platform.
- Future expansions may include:
  - richer layered source composition
  - background daemons or platform services
  - additional first-class agent adapters
  - publishing flows for internal and external skill catalogs
