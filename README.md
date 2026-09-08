<div align="center">

<img src="assets/logo.png" alt="Compound Engineering" width="120">

# Compound Engineering

**AI skills that make each unit of engineering work easier than the last.**

[![Build Status](https://github.com/EveryInc/compound-engineering-plugin/actions/workflows/ci.yml/badge.svg)](https://github.com/EveryInc/compound-engineering-plugin/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-black.svg)](LICENSE)
[![Skills](https://img.shields.io/badge/skills-33-black.svg)](docs/guides/README.md)

</div>

Compound Engineering is a plugin of 33 skills for AI coding agents. It structures the work around a loop — brainstorm, plan, build, review, then **capture what you learned** — so the knowledge from each change is written down where the next change can read it.

This fork targets one host: [oh-my-pi (omp)](https://github.com/can1357/oh-my-pi). The multi-host matrix lives upstream at [EveryInc/compound-engineering-plugin](https://github.com/EveryInc/compound-engineering-plugin).

Maintained by [Kieran Klaassen](https://github.com/kieranklaassen) and [Trevin Chow](https://github.com/tmchow), with contributions from the open-source community.

## Install

Compound Engineering installs into oh-my-pi (omp) through its marketplace flow. The repo ships a native `.omp-plugin/marketplace.json` catalog whose plugin entry carries a `version`, so omp's update checker can see each new release:

```text
omp plugin marketplace add bnivanov/compound-engineering-plugin
omp plugin install compound-engineering@compound-engineering-omp
```

To stay current automatically, enable auto-update:

```bash
omp config set marketplace.autoUpdate auto
```

The default `notify` mode only writes update availability to the debug log — it does not prompt — so without `auto` you will not hear about new releases. To upgrade by hand, see [Upgrading](docs/install/upgrading.md).

<details>
<summary>Other install paths (pin-style and contributor development)</summary>

`omp install https://github.com/bnivanov/compound-engineering-plugin` installs the repository as an npm-style plugin. That path has **no update mechanism** — treat it as pinning a snapshot, not as the recommended install.

For local development from a checkout, use a live symlink instead:

```bash
omp plugin link "$PWD"
```

</details>

Run `/reload-plugins` or start a new omp session after installing so the skills load. omp's native deterministic command is `/skill:<name>` (for example, `/skill:ce-plan`); ordinary `/skill-name` prompts can also model-route to visible skills, but manual-only or hidden skills require the native form. See [`docs/specs/omp.md`](docs/specs/omp.md) for details.

---

## Philosophy

**Each unit of engineering work should make subsequent units easier -- not harder.**

Invocation syntax: this README uses `/skill-name` examples for slash-skill hosts. In Codex, invoke installed skills with `$skill-name` (for example, `$ce-plan` and `$lfg`). In oh-my-pi (omp), these prompts can model-route to visible skills; use the native deterministic `/skill:<name>` form for manual-only or hidden skills (for example, `/skill:ce-polish`). `/goal` remains a Codex built-in command.

Traditional development accumulates technical debt. Every feature adds complexity. Every bug fix leaves behind a little more local knowledge that someone has to rediscover later. The codebase gets larger, the context gets harder to hold, and the next change becomes slower.

Compound engineering inverts this. 80% is in planning and review, 20% is in execution:

- Plan thoroughly before writing code with `/ce-brainstorm` and `/ce-plan` using one readiness-based plan artifact
- Review to catch issues and calibrate judgment with `/ce-code-review` and `/ce-doc-review`
- Codify knowledge so it is reusable with `/ce-compound`
- Keep quality high so future changes are easy

The point is not ceremony. The point is leverage. A good brainstorm makes the plan sharper. A good plan makes execution smaller. A good review catches the pattern, not just the bug. A good compound note means the next agent does not have to learn the same lesson from scratch.

## The loop

The core loop is six steps: **brainstorm** the requirements, **plan** the implementation, **work** through the plan, **simplify** what you wrote, **review** the result, then **compound** the learning -- and repeat with better context.

| Skill | Purpose |
|-------|---------|
| [`/ce-brainstorm`](docs/guides/ce-brainstorm.md) | Interactive Q&A to think through a feature or problem and write a requirements-only unified plan before planning |
| [`/ce-plan`](docs/guides/ce-plan.md) | Enrich feature ideas or requirements-only plans into implementation-ready plans |
| [`/ce-work`](docs/guides/ce-work.md) | Execute implementation-ready plans natively or through a qualified cross-model author while retaining host verification, commits, and shipping |
| [`/ce-simplify-code`](docs/guides/ce-simplify-code.md) | Refine the freshly written code for clarity and reuse before review |
| [`/ce-code-review`](docs/guides/ce-code-review.md) | Report-only multi-agent review against the plan before merging; local apply is explicit |
| [`/ce-compound`](docs/guides/ce-compound.md) | Capture the learning into `docs/solutions/` so the next loop starts smarter |

Each cycle compounds: `/ce-compound` writes learnings that the next `/ce-brainstorm` and `/ce-plan` read as grounding -- brainstorms sharpen plans, plans inform future plans, reviews catch more issues, patterns get documented. That return arrow is the whole point.

<img src="assets/demo/compound-loop.gif" alt="A ce-compound run writes a learning about an env-var trap; 18 days later, on unrelated work, a ce-plan run finds that learning and carries its constraints into the new plan" width="100%">

**Run one teaches it. Run two remembers.**

<sub>Replayed from a real pair of sessions 18 days apart, with names and paths anonymized and the six-minute run compressed to about 30 seconds. Nothing shown is behavior the skills don't have — see <a href="assets/demo/README.md">assets/demo</a> for the source and the substitutions.</sub>

> Artifact folders like `docs/solutions/` and `docs/plans/` are the **defaults**. A project whose `docs/` is tracked content can relocate every CE artifact folder under one repo-relative root via the `docs_root` setting -- see [configuration](docs/guides/configuration.md#artifact-root).

## Try it

After installing, run `/ce-setup` in any project. It reports optional tool capabilities, creates repo `.compound-engineering/config.yaml` when missing, refreshes the committed example, and gitignores an existing local override.

**The standard loop** -- turn a rough idea into shipped, reviewed code:

```text
/ce-brainstorm make background job retries safer
/ce-plan
/ce-work
/ce-simplify-code
/ce-code-review
/ce-compound
```

**Autonomous** -- hand off a feature and let the agent run the whole pipeline:

```text
/ce-brainstorm describe the feature
/lfg
```

`/lfg` runs the loop hands-off: it plans, works through the plan, simplifies, runs code review and applies the fixes, runs browser tests, then commits. When a git remote exists it pushes, opens a PR, and watches CI with a bounded repair loop (it does not merge, and it can finish with leftovers if the repair budget is hit). With no remote it stops at local commits. Start it after `/ce-brainstorm` so it plans against real requirements rather than a one-line prompt.

Starting from a bug instead of a feature? Use [`/ce-debug`](docs/guides/ce-debug.md). Not sure what to build yet? Start with [`/ce-ideate`](docs/guides/ce-ideate.md).

## Skills at a glance

33 skills, grouped by what they are for. The full catalog, with a page per skill and how each one chains into the others, is in **[docs/guides](docs/guides/README.md)**.

| Group | Skills | What it covers |
|-------|--------|----------------|
| [Core loop](docs/guides/README.md#the-core-loop) | `ce-brainstorm` `ce-plan` `ce-work` `ce-simplify-code` `ce-code-review` `ce-compound` | The six steps of every iteration |
| [Around the loop](docs/guides/README.md#around-the-loop) | `ce-strategy` `ce-product-pulse` `ce-sweep` `ce-compound-refresh` | Anchors and feeds that keep the loop grounded |
| [On demand](docs/guides/README.md#on-demand) | `ce-ideate` `ce-pov` `ce-debug` `ce-explain` `ce-doc-review` `ce-optimize` `ce-prototype` | Reached for when a specific need arises |
| [Git workflow](docs/guides/README.md#git-workflow) | `ce-commit` `ce-commit-push-pr` `ce-babysit-pr` `ce-resolve-pr-feedback` `ce-worktree` | Committing, shipping, and shepherding PRs |
| [Autonomous](docs/guides/README.md#autonomous-pipeline) | `lfg` | The whole pipeline, hands-off |
| [Testing & design](docs/guides/README.md#frontend-design) | `ce-test-browser` `ce-test-xcode` `ce-polish` `ce-dogfood` | Verifying and polishing what you built |
| [Collaboration](docs/guides/README.md#collaboration) | `ce-proof` `ce-handoff` `ce-promote` | Sharing work and handing it off |
| [Utilities](docs/guides/README.md#workflow-utilities) | `ce-setup` `ce-retune` `ce-riffrec-feedback-analysis` | Setup and maintenance |

**Learn more**

- [Skill documentation catalog](docs/guides/README.md)
- [Compound engineering: how Every codes with agents](https://every.to/chain-of-thought/compound-engineering-how-every-codes-with-agents)
- [The story behind compounding engineering](https://every.to/source-code/my-ai-had-already-fixed-the-code-before-i-saw-it)

---

## Upgrading an existing install

Refresh the cached marketplace catalog first, then upgrade the plugin — `omp plugin upgrade` compares against the cached catalog, so upgrading alone can leave you on the previous version:

```text
omp plugin marketplace update compound-engineering-omp
omp plugin upgrade compound-engineering@compound-engineering-omp
```

See [docs/install/upgrading.md](docs/install/upgrading.md), including how to move off an upstream `compound-engineering-plugin` marketplace install.

## Limitations

Only oh-my-pi (omp) is supported by this fork. The Bun CLI in `src/` is repository tooling (`list`, `plugin-path`), not an install path.

Fork releases are cut by hand: `package.json`, `plugin.json`, and `.omp-plugin/marketplace.json` are bumped together and tagged. Routine PRs must not hand-bump them.

## FAQ

### Do I need Bun to install Compound Engineering?

No. Bun is only needed to run this repository's test suite and CLI when developing the plugin.

### Where do I see all available skills?

The grouped overview is [above](#skills-at-a-glance); the full catalog with a page per skill is [`docs/guides/README.md`](docs/guides/README.md). Each skill's authoritative runtime spec lives in `skills/<skill>/SKILL.md`.

### Where is release history?

GitHub Releases are the canonical release-notes surface. The root [`CHANGELOG.md`](CHANGELOG.md) points to that history.

### How do I work on the plugin itself?

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for setup, and [`docs/development.md`](docs/development.md) for loading a local checkout into oh-my-pi (omp).

## Documentation

| | |
|---|---|
| [Skill catalog](docs/guides/README.md) | A page per skill, and how they chain together |
| [Configuration](docs/guides/configuration.md) | `.compound-engineering/config.yaml` options |
| [Installing](#install) · [Upgrading](docs/install/upgrading.md) | omp install and refresh |
| [Contributing](CONTRIBUTING.md) · [Development](docs/development.md) | Working on the plugin itself |
| [Security](SECURITY.md) · [Privacy](PRIVACY.md) | Reporting and data handling |

## Contributing

Contributions are welcome. Issues, bug reports, and pull requests all help make this better, and we genuinely appreciate them — bug reports especially. Start with [`CONTRIBUTING.md`](CONTRIBUTING.md), which covers setup and what to do before opening a PR.

A note on what to expect: Compound Engineering is opinionated by design. It's maintained by [@kieranklaassen](https://github.com/kieranklaassen) and [@tmchow](https://github.com/tmchow), and its direction reflects a specific point of view about how AI-assisted engineering should work. So while we welcome help, we can't promise to accept every change — some proposals won't fit that vision even when they're good ideas on their own.

Open an issue or send a PR, and we'll fold in what moves the plugin in the right direction. We just want to be upfront that not everything will land.

## License

[MIT](LICENSE)
