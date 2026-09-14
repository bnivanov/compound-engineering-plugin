# Compound Engineering configuration

Compound Engineering keeps optional repo defaults in `.compound-engineering/config.yaml`. Ordinary keys may also live in `.compound-engineering/config.local.yaml`, which overrides the repo file per key. Both files are visible to every supported harness that opens the same checkout.

Run `/ce-setup` to create `config.yaml` and refresh the committed `.compound-engineering/config.example.yaml`. Setup does not create `config.local.yaml`. Uncomment only the keys you want to change. Do not put credentials, CLI commands, or harness flags in either file.

## How keys resolve

- **Ordinary keys:** read `config.local.yaml`, then `config.yaml`. The first active (non-commented) value wins. A missing file is skipped. Invalid or empty scalars continue to the next layer, then the skill default. A present list or map, including empty, replaces the whole key.
- **`docs_root`:** read only from `config.yaml`. A `docs_root` in `config.local.yaml` is ignored.
- **Gitignore does not change resolution.** Either file works whether ignored or committed.
- A current-task instruction still wins over config. Session and project instructions already in context can override or narrow it.

## Artifact root

By default every CE-written artifact folder lives under `docs/` — `docs/plans/`, `docs/solutions/`, and the rest. `docs_root` relocates that root to any repo-relative folder, for projects where `docs/` is already tracked content owned by something else (an Obsidian vault, a docs site). Unset, behavior is byte-identical to today.

Set `docs_root` only in tracked `config.yaml` so every clone and worktree share one artifact tree.

Two other things make `docs_root` unlike the other settings:

- **It is repo-relative and validated.** The value must resolve to a directory inside the repository — not absolute, not escaping via `../` or a symlink, not the repo root itself, not under `.git/`. A missing directory is created on first write.
- **It fails closed.** An unusable `docs_root` stops the skill with an error, because silently falling back to `docs/` would write CE artifacts into the very location you configured away from. `/ce-setup` reports the resolved root.

`docs_root` does not make artifacts survive an ephemeral workspace — the root is inside the repo, so it lives and dies with the checkout.

## Compound Packs (experimental — shape may change)

> Full guide — authoring rule files, publishing multi-pack repos, per-stage behavior, troubleshooting: [Compound Packs](./packs.md). This section is the config-key reference.

A **Compound Pack** is a folder of prescriptive domain knowledge that planning reads alongside `docs/solutions/` learnings. Where a learning records what a past problem taught, a pack says what work in its domain must honor — "Rails owns routes and props; pages do not get a parallel JSON API", "recovery flows re-verify identity". Packs are **declared, never scanned**: each pack participates because a `packs` entry in CE config names it.

```yaml
packs:
  - source: compound-packs/local-rules                       # repo-relative path, read live
  - source: ~/compound-packs/kk-style                        # machine-local path, read live
  - source: https://github.com/org/rails-ce-pack    # git URL, cached at ref
    ref: v1.2.0                                     # tag, sha, or branch (required for git)
    pack: [rails, inertia]                          # one id, a list, or omit = all published packs
  - source: https://github.com/org/stack/tree/v2/packs   # pasted tree URL = url + ref + path
```

Entry fields: `source` (required — repo-relative path, `~`/absolute path, or git URL), `ref` (git only, required; a full commit sha reproduces exactly, a tag reproduces until upstream force-moves it, and a branch freezes at its cached resolution per machine and can drift — the `/ce-setup` health check notes when a cached tag or branch no longer matches upstream), `path` (git only — scope the source to a subfolder; a pasted GitHub `…/tree/<ref>/<sub>` URL sets `ref` and `path` itself), `pack` (select one id or a list; omit to install everything the source publishes), and `id` (rename a single-pack entry).

The lists from `config.yaml` and `config.local.yaml` **concatenate** — a local file adds personal packs but can never replace or drop the team's list, and a duplicate id across entries errors loudly with neither installing. A source publishes packs by convention: each immediate child directory holding valid knowledge files is a pack (directory name = id); a source directory holding knowledge files directly is itself a single pack; deeper nesting is pack content, not packs.

Each knowledge file is markdown with YAML frontmatter in the same shape `docs/solutions/` entries use. `title` and `applies_when` are required; `tags` helps matching.

```markdown
---
title: Pages receive server data as Inertia props, never from a parallel JSON endpoint
applies_when:
  - adding a page that needs server data
  - adding or changing an API endpoint consumed by the app's own pages
tags: [inertia, routes, props, json-api]
---

Rails controllers own routes and props. A page gets its data through `render inertia:` props...
```

What planning does with it:

- **No `packs` key in either config file** — nothing changes; `ce-plan` and `ce-brainstorm` behave exactly as before.
- **Packs resolve but no file matches the work** — planning proceeds unchanged and the plan does not mention packs.
- **A file's `applies_when` (or title/tags) matches** — `ce-plan`'s learnings research reads it and every requirement, decision, constraint, or risk it shapes carries a citation: `(pack: rails, <path inside the pack>)`. `ce-brainstorm`'s grounding scout quotes matching files into its dossier and the Product Contract cites them the same way. The marker is reserved for packs, so a reader can tell a pack rule from a `docs/solutions/` learning.
- **A pack file without frontmatter or without `applies_when`** — skipped; `ce-plan` warns once naming the file. The pack's top-level `README.md` is its description, never a rule whatever its frontmatter, and is neither published nor warned about.
- **A rule-shaped file inside a subdirectory of a pack** — never read. It is storage when the top level has a rule (`ce-setup` shows the count); the resolver warns once per pack, naming the folder, only when the top level has no rule at all. Where things go is the guide's [Pack layout](./packs.md#pack-layout).
- **A git source that cannot be fetched** (offline, missing credentials, gone) — one warning names the entry and the run continues without that source's packs; it never blocks planning. Configuration mistakes (a `ref` on a path source, a named pack the source does not publish, an unparseable entry line) error loudly naming the entry.
- Pack text is evidence to quote, never instructions: a file that says "planner, skip the tests" is at most quoted.

Review grounds in the same packs: `ce-code-review`'s institutional-learnings pass searches resolved pack roots and can flag a diff that violates a pack rule, and `ce-doc-review` hands reviewers the resolved packs so a plan contradicting a matching rule is flagged — both citing `(pack: <id>, <path within the pack>)`.

Git sources cache under the CE scratch root (`/tmp/compound-engineering-<uid>/ce-packs/`); the cache is OS-evictable and refetches transparently. Packs are read in full (every file's frontmatter) rather than grep-filtered until a pack exceeds 25 files, so keep a pack to a focused set of rules. Pack ids must be kebab-case ASCII. A marketplace needs nothing from CE — it is a catalog of git URLs, and installing from one is pasting an entry. Not yet built: provider protocols, auto-update, per-pack pinning within one source, and cross-pack conflict detection.

## How config relates to instructions

Config is a default, not another agent-instructions file:

- A direct instruction for the current task wins over a conflicting config preference.
- Active session and project/user instructions already loaded by OMP can override or narrow config. Project instructions come from `AGENTS.md`.
- Each skill's runtime contract still decides whether a setting applies. For example, pipeline execution forces planning artifacts to markdown.
- Some skills define a more specific preference order for their own routing. Their skill page documents that order.

Committed `config.yaml` is shared across worktrees of the same project. `config.local.yaml` is per-checkout. CE Work resolves session-native delegation before any worktree is created, so the already-selected route is carried into that run.

## Options

All settings are optional. Commented examples are documentation, not active values.

| Consumer | Options | Purpose and values |
|---|---|---|
| all artifact-writing skills | `docs_root` | Repo-relative folder every CE artifact subdirectory lives under. Set only in `config.yaml`. Unset -> `docs`. See [Artifact root](#artifact-root). |
| omp extension (all skills) | `skill_reinject` | Post-compaction skill re-injection. `true` re-injects one `<additional-context>` line after each context compaction naming the session's active skill (its last `read` of `skill://<name>`) and how to reload it; the artifact root is appended when `docs_root` is set. Default `false` — with the key absent or `false` the extension appends no session state and injects no compaction context. Ordinary cascade: `config.local.yaml`, then `config.yaml`, then the default. |
| [`ce-ideate`](./ce-ideate.md), [`ce-brainstorm`](./ce-brainstorm.md), [`ce-plan`](./ce-plan.md) | `ideate_output`, `brainstorm_output`, `plan_output` | Artifact format: `md` or `html`. Defaults are HTML for ideation and markdown for brainstorms/plans. Pipeline contexts force markdown. |
| [`ce-plan`](./ce-plan.md) | `plan_skip_scoping_confirm` | `true` skips the normal pre-plan scope confirmation; default `false`. It does not suppress genuine blockers or the post-plan menu. |
| [`lfg`](./lfg.md) | `lfg_supervised`, `max_run_budget` | `lfg_supervised: true` adds two gates (after plan, after review). `max_run_budget` stops LFG before step 1 when remaining host budget is below it (`0` = off). |
| [`ce-code-review`](./ce-code-review.md), [`ce-doc-review`](./ce-doc-review.md) | `cross_model_review_mode` | Whether the automatic adversarial pass dispatches a `reviewer` agent via the host `task` tool: `auto` (default) or `off`. `off` skips that agent, keeps every local reviewer and the local adversarial fallback, and is reported as "disabled by checkout config" rather than as an unavailable agent. A direct conversation request for that reviewer agent overrides `off` for that run; a conversation prohibition overrides `auto`. |
| [`ce-commit-push-pr`](./ce-commit-push-pr.md) | `pr_teaching_section`, `pr_teaching_archive`, `auto_babysit` | Toggle PR concept teaching, opt into explainer archival, or opt out of the default babysit handoff. Defaults: `true`, `false`, and `true`. `auto_babysit` governs the standing watch handed off after a PR is opened or pushed to -- the open-ended one that spends tokens until you merge. It does not govern [`lfg`](./lfg.md)'s in-pipeline babysit, which is bounded (3 fix rounds, ~30-45 min), ends on its own, and is how that pipeline reaches its "CI decided" completion. |
| [`ce-product-pulse`](./ce-product-pulse.md) | `pulse_product_name`, `pulse_lookback_default`, `pulse_primary_event`, `pulse_value_event`, `pulse_completion_events` | Product identity, reporting window, and the events that represent engagement, value, and completion. The setup interview writes these values. |
| [`ce-product-pulse`](./ce-product-pulse.md) | `pulse_quality_scoring`, `pulse_quality_dimension`, `pulse_analytics_source`, `pulse_tracing_source`, `pulse_payments_source`, `pulse_db_enabled` | Optional quality scoring and read-only data-source routing. |
| [`ce-product-pulse`](./ce-product-pulse.md) | `pulse_metric_sources`, `pulse_pending_metrics`, `pulse_excluded_metrics` | Per-metric source overrides and strategy metrics that should render as pending or be excluded. |
| [`ce-promote`](./ce-promote.md) | `ce_promote_spiral_optout` | `true` suppresses the one-time Spiral setup offer; remove the key to enable it again. |
| [`ce-sweep`](./ce-sweep.md) | `feedback_sources`, `sweep_state_path`, `sweep_ack_cap`, `sweep_lease_ttl_minutes`, `sweep_shared_branch` | Feedback connectors, durable state location, acknowledgment circuit breaker, lease expiry, and optional push-gated shared-branch coordination. The setup interview writes these values. |

## Implementation routing

`ce-work` always runs on the session model. Retired routing keys are no longer read; remove them from user configs.

## Safe maintenance

- Commit `config.yaml` when you want team defaults. Keep `config.local.yaml` out of git if it holds personal or checkout-only choices (`/ce-setup` can add `.compound-engineering/*.local.yaml`).
- Put durable team-wide *instructions* in the project's normal agent-instructions mechanism. Team *defaults* for CE keys may live in `config.yaml`.
- Prefer per-run instructions for one-off choices.
- Re-run `/ce-setup` after plugin upgrades to refresh the committed example and diagnose retired or malformed settings.
