---
title: Opt-in mode and pstack fold-ins
type: feat
date: 2026-09-09
artifact_contract: ce-unified-plan/v1
artifact_readiness: implementation-ready
product_contract_source: ce-pov
execution: code
---

# Opt-in mode and pstack fold-ins

## Goal Capsule

- **Objective:** Give this plugin Lauren's useful pstack mechanisms without importing the Cursor plugin. Two tracks: an opt-in `/skill:ce-mode` that charts existing CE skills, and five portable fold-ins headed by a surface-agnostic verification generator.
- **Means:** New hidden `ce-mode` skill (playbooks as references, five gates, invoke-by-choice). New model-invocable `ce-verify` that writes a repo-local `.agents/skills/verify-<app>/` plus a durable feature map. Three grafts onto incumbents (blast-radius reviewer, plan lineage analyst, worktree prune) and one consumer (`ce-dogfood` reads the map when present).
- **Authority:** User asked whether pstack / the two guide posts are worth rolling in, then overturned a too-tight "don't merge" and asked what *can* fold. Next chat implements this plan.
- **Stop conditions:** Do not merge pstack, do not ship 23 principle skills, do not replace `ce-plan` / `ce-brainstorm` / `lfg` / `ce-start`. Kill `ce-mode` if an armed session never re-asserts on a second bare request (Observation C, 0/3). Cut `ce-verify` live-refresh to one feature if the create/refresh boundary blurs.
- **Tail ownership:** This artifact is the implementation brief. It does not implement, push, or open a PR.

---

## Product Contract

### Summary

pstack's load trick is one command the user arms, whose playbooks live as references inside that skill and are read only when matched. That is worth copying. The rest of pstack is either already owned by a stronger CE incumbent, or blocked on a host binding. The highest-value *fold* besides the mode is verification-as-infra: generate and maintain a repo-local drive skill with a feature map, for CLI/TUI/service/desktop/web, not just the browser.

### Problem Frame

CE today is a 35-skill catalog. `ce-start` routes one hop then stops. `lfg` is the hands-off ship pipeline. Neither is a sticky-within-session rigor mode the user turns on. Several skills already use `disable-model-invocation`; there is no playbook router.

Idle token cost was a 2026-02 incident (#63 ~36k, #139 ~12k) and is closed (~3k, maintainer "that's ok", 2026-02-13). Do not justify this work as a token rescue. Justify it as routing control and opt-in load.

CE verification is browser-only (`ce-dogfood`, `ce-test-browser`, `ce-polish`) plus iOS (`ce-test-xcode`). A CLI/TUI/service repo has no scripted way to drive the real app, and every dogfood run re-derives flows because nothing durable survives.

### Key Decisions

- **Trial wholesale pstack; fold named portable pieces.** (session-settled: user-directed after the first "don't merge" was too tight.)
- **`ce-mode` is user-invoked only** (`disable-model-invocation: true`). Model-routing it would let a routine request hijack session routing.
- **Sticky-within-session is a convention, not a harness mode.** OMP has no session-mode primitive. Arming injects the skill body as a custom message; compaction can cut it. Re-anchor is `read skill://ce-mode`. Invoke-per-task is the guaranteed floor. Pre-registered kill/degrade rule in U3.
- **Playbooks name a capability, an owning CE skill, and an artifact.** They never re-derive a callee's procedure. A step that cannot be written as a condition belongs to the callee — delete it.
- **`ce-verify` produces an artifact; `ce-dogfood` remains the QA runner.** The generated skill never judges experience or writes a dogfood report.
- **README skill-count is owned by the first new-skill unit that lands.** Later units rebase the number. `skills/ce-mode/**` and `skills/ce-verify/**` do not touch each other.

### Requirements

- R1. One new hidden skill `ce-mode` the user arms with `/skill:ce-mode`. Bare invocation arms; `off` disarms; a task as arguments arms and matches immediately.
- R2. Two playbooks in-skill: `references/build.md` (new capability → brainstorm? → plan → work → simplify → review) and `references/fix.md` (symptom → debug, with a re-enter-build escape when the fix spans competing designs).
- R3. Five gates, verbatim IDs G1–G5: plan-before-multi-file-build; evidence-before-done; review-before-PR; no push/open/merge/comment without the user (name `lfg` instead); each step names its artifact or stops.
- R4. Match table is exhaustive: new capability → build; broken/failing/slow → fix; else route via `ce-start` and stay armed.
- R5. `ce-mode` never plans, reviews, implements, or ships itself. When a callee already gates a step, do not add a second gate.
- R6. Stickiness decision is pre-registered (U3). Do not renegotiate after seeing results.
- R7. One new model-invocable skill `ce-verify` with `create` and `refresh` routes that writes `.agents/skills/verify-<app>/` (OMP stand-in for pstack's `.cursor/skills/`) plus a feature map. Never `disable-model-invocation`.
- R8. Feature-map contract C1 (shared by `ce-verify` and `ce-dogfood`): see Implementation Units. Absence of a map is a normal state.
- R9. `ce-code-review` gains a `blast-radius` persona for undeclared readers beyond the diff. No schema change.
- R10. `ce-plan` research gains a conditional `code-lineage-analyst` that returns Preserve / Change / Avoid / Risk with citations. Not a Lightweight-plan agent. Not for greenfield.
- R11. `ce-worktree` gains a prune route. Classify, ask, never `--force`, never delete a branch, never touch the current tree.
- R12. No Cursor bindings: Custom Mode `mode: true`, `/loop`, `subagent_type: poteto-agent`, `~/.cursor/rules/*.mdc`, per-Task `model:` roles, cloud agents, path-scoped auto-attach, `cursor-team-kit` control skills.
- R13. No 23-principle catalog. No second teaching entry (`ce-explain` already owns how/why/teach). No replacement of `ce-plan` with "plan through code".

### Sources

- pstack tree: https://github.com/cursor/plugins/tree/main/pstack (read 2026-09-09; README claims v0.15.0, MIT).
- Guide pt.1 (verification, feature maps, Opt+Enter Custom Mode pin): https://x.com/poteto/status/2094457600259842065
- Guide pt.2 (playbooks-as-refs, how/why/teach/recall/architect, plan-through-code): https://x.com/poteto/status/2097732320606507506
- Incumbent pain closed: GitHub issues #63, #139. Prior plugin-split reject in #63. Phase-loaded kernels are the adopted always-loaded-cost answer (`docs/solutions/skill-design/size-driven-skill-restructure.md`).

---

## Why not merge pstack

The plugin as a whole is a Cursor product. Wholesale merge fails R12 and collides with CE's planning loop (pstack's author says they do not believe in planning docs; this plugin's core loop *is* brainstorm → plan → work).

That is not "nothing to fold." The table below is the fold list.

### Fold / Adapt / Skip

| pstack item | Verdict | Destination |
|---|---|---|
| `poteto-mode` as opt-in router + playbooks-as-refs | **Adapt** | Track A `ce-mode` (U1–U4). Drop Custom Mode, `/loop`, poteto-agent, 23 playbooks. Keep invoke-by-choice, conditional playbook reads, verbatim-step todos, five CE-shaped gates. |
| `create-verification-skill` + `maintain-verification-skill` + feature map | **Fold** | Track B `ce-verify` (U5). Target `.agents/skills/verify-<app>/`. |
| `blast-radius` | **Fold** | `ce-code-review` persona (U6). |
| `why` (git/PR lineage, found-vs-inferred, Preserve/Change/Avoid/Risk) | **Adapt** | `ce-plan` research agent (U7). Drop the seven-MCP roster. |
| `worktree-cleanup` playbook | **Adapt** | `ce-worktree` prune (U9). Drop iOS simulators. |
| `how`, `teach` | **Skip** | `ce-explain` already owns teaching + durable artifact. |
| `recall` | **Skip** | `ce-handoff` + host recall. Mining path is Cursor transcripts. |
| `interrogate` | **Skip** | `ce-code-review` Stage 3d/4/5 is the stronger independent panel. |
| `architect`, `arena`, prototype playbook | **Skip** | `ce-plan` / `ce-brainstorm` approaches / `ce-prototype` / `ce-optimize`. |
| `swarm` | **Skip** | Distinguishing parameter is cloud fan-out. Local shape is `ce-work` waves. |
| `figure-it-out` | **Skip** | Would be a third planner (`ce-plan` + `ce-mode`). |
| `show-me-your-work`, `tdd`, `unslop`, `technical-writing`, `no-comments` | **Skip** | Stronger or equal incumbents (`lfg`/review report, `ce-work` evidence table, host `writing`, `ce-simplify-code` rule 8). |
| babysit / shipping / autopilot / orchestrate playbooks | **Skip** | `ce-babysit-pr` postures + `lfg`. |
| investigation / bug-fix / perf / forensics / hillclimb / eval / visual-parity | **Skip** | `ce-debug`, `ce-optimize`, `ce-polish`, `ce-dogfood`, `tests/skill-eval-cell`. |
| 23 `principle-*` skills | **Skip** | Corpus weight. Steering vocabulary, if any, stays inside `ce-mode`, not 23 skills. |
| `bro` | **Skip** | A turn, not a skill. |

### Never-fold (host or product block)

| Item | Blocking reason |
|---|---|
| `poteto-mode` frontmatter `mode: true` / icon / reminder, `subagent_type: poteto-agent`, `/loop`, per-Task `model:` | Cursor session-mode and subagent APIs. Track A replaces the *job* with OMP conventions. |
| `setup-pstack` | Writes `~/.cursor/rules/pstack-models.mdc` `alwaysApply: true`. |
| `swarm` cloud half | `environment: "cloud"`, cloud concurrency. |
| `reflect`, `recall` mining, `show-me-your-work` audit | Cursor `agent-transcripts/` layouts and built-in `create-skill`. |
| `typescript-best-practices` `paths:` | Path-scoped auto-attach. OMP has none, so the file would never fire or always load. |
| `make-bot-ui` | Grok Bot webhooks + Tailscale. Product integration, not a workflow mechanism. |
| `poteto-mode` watch-pr / orch / bootstrap.ts | Second forge watcher beside `ce-babysit-pr/scripts/pr-snapshot`. |
| shipping / autopilot playbooks' Origin / `gh stack merge` / cloud fleet | `ce-babysit-pr` `stack-land` already carries land authorization. |
| `deslop` / `control-cli` / `control-ui` | `cursor-team-kit`, not installable here. `ce-verify` replaces the control-skill dependency. |

---

## Implementation Units

File ownership: no two units write the same file. `skills/ce-mode/**` is Track A only. `docs/guides/README.md` and root `README.md` counts: first new-skill unit that lands owns the bump; later units rebase.

### Shared contracts

**C1. Feature map** (U5 producer, U8 consumer)

```
.agents/skills/verify-<app>/SKILL.md
.agents/skills/verify-<app>/features/README.md
.agents/skills/verify-<app>/features/<feature>.md
```

Feature files: `## Sub-features`, `## How to get to it (user POV)`, `## Driving it with <harness>`, `## Gotchas`. Generated SKILL.md: `## Launch`, `## Doctor`, `## Drive`, `## Evidence`, `## Cleanup`, `## Helpers`. Detect by globbing `.agents/skills/verify-*/features/README.md`. Absence is normal.

**C2. Blast-radius persona** (U6): compact return `{reviewer, findings[], residual_risks[], testing_gaps[]}`, `reviewer` = `blast-radius`, anchored rubric, full detail at `{run_dir}/blast-radius.json`. Proof ladder 1 asserted … 5 reproduced; below 3 is unproven. Persona does not mutate; 4/5 is recommended to the caller.

**C3. Lineage** (U7): Preserve / Change / Avoid / Risk, each cited, plus `Sources consulted` (empty searches are findings). Labels `found` / `inferred` / `unknown`. Planner never rewrites those labels. `Avoid` lands in Alternatives or Risks.

**C4. ce-mode gates G1–G5** — see R3. Playbook match table — see R4. Re-arm: while armed, name the matched playbook in one line before any tool call; if the five gates are not in context, re-read `skill://ce-mode`.

**C5. New-skill mechanics.** Self-contained dirs. `ce-mode` must be added to `EXPECTED_USER_INVOKED_SKILLS`. `ce-verify` must not. SKILL.md ≤ 8,000 bytes (target ≤ 6,000 for `ce-mode`). `ce-` prefix. Editing `skills/**` goes through repo-local `ce-skill-work`. Skills cache at session start — behavior tests via `bun run test:skill-eval-cell` or a fresh linked session, never the authoring session.

---

### Track A — opt-in mode

#### U1 — `ce-mode` kernel + two playbooks

**Files.** Create `skills/ce-mode/SKILL.md`, `skills/ce-mode/references/build.md`, `skills/ce-mode/references/fix.md`. Edit `tests/skill-conventions.test.ts` (`EXPECTED_USER_INVOKED_SKILLS`). No docs, no README, no `ce-start` edit (those are U4).

**Frontmatter.** `name: ce-mode`. `disable-model-invocation: true`. `argument-hint: "[blank to arm | off | status | a task to run under the mode]"`. Description leads with the mechanism (armed in-the-loop session mode that matches each request to a playbook and holds gates), then the `/skill:ce-mode` alias.

**Body order (load-bearing; truncations keep the start):** Outcome + done → Arm/disarm/status (user-copy rule immediately above: `/skill:ce-mode off`, one form) → five gates → match table (read the playbook when matched, not at arm time) → shared tail (G4 ship, then `ce-compound` only when the code and plan do not already carry the reasoning) → re-arm rule → Boundaries.

**`build.md`.** Entry: capability the repo does not have. Steps: scope unclear → `ce-brainstorm` (skip when the user can already state done) → `ce-plan` (**G1**) → `ce-work` with the plan path (**G2**) → `ce-simplify-code` (skip docs-only or ~under 10 lines) → `ce-code-review` (**G3**) → shared tail. Escape: if the request no longer matches, return to the match table.

**`fix.md`.** Entry: broken/failing/slow with a statable symptom → `ce-debug` (**G2**) → if the fix spans multiple files with competing designs, re-enter `build.md` at its plan step (**G1**) → `ce-code-review` unless ~under 10 lines and the reproduction covers it (**G3**) → shared tail.

**Acceptance.** `bun test tests/skill-conventions.test.ts tests/codex-skill-prompt-budget.test.ts tests/skill-agent-ce-prefix.test.ts tests/omp-fork-vocabulary.test.ts`. `wc -c skills/ce-mode/SKILL.md` under 8,000. Both playbook filenames in backticks and on disk. No path outside `skills/ce-mode/`. Neither playbook contains a git, `gh`, or test command, or restates the shared tail.

#### U2 — single-invocation eval cells

**Files.** Append three `Scenario` rows to `tests/skill-eval-cell/catalog.ts`. Do not add to `WAVE1`. Do not touch `run.ts` / `hosts.ts` / `grade.ts` / `pack.ts`.

1. `ce-mode/plan-gate-before-multi-file-build` — armed; new three-file capability; no plan. Must read `references/build.md`, include `ce-plan`, no implement, no `ce-work`.
2. `ce-mode/fix-routes-debug-not-plan` — armed; named failing test. Must read `references/fix.md`, include `ce-debug`. Fails if it demands a plan first.
3. `ce-mode/no-ship-without-user-goahead` — armed; committed + reviewed; "what's next?". Must include `lfg`. Fails if it pushes or opens a PR.

**Acceptance.** `bun tests/skill-eval-cell/pack.ts --skill ce-mode --arm post` — all three pass. Record stdout paths in U3.

#### U3 — stickiness probe + trial record (kill gate)

**Files.** Create `docs/solutions/skill-design/opt-in-mode-skill-trial.md` after the probe. No skill edits.

Interactive, three runs, fresh `omp` session after `omp plugin link "$PWD"` (authoring session is stale):

- A: before invoke, does the session list `ce-mode`? Either absent or present-but-not-invocable is opt-in; record which.
- B: `/skill:ce-mode` then a bare build request. Names `references/build.md`, a gate, and the owning skill before tools?
- C: second bare request matching fix, no re-invoke. Names `references/fix.md` and routes to `ce-debug`?
- D: `/compact` then task 3. Re-reads `skill://ce-mode` and still routes, or drops?

**Pre-registered rule.** Keep sticky if C holds 3/3 and D at least 2/3. Degrade to invoke-per-task if C holds 1–2/3. **Kill** if C holds 0/3 (then a per-task router with gates duplicates `ce-start` and does not earn a skill — delete `skills/ce-mode/` and the test list entry).

**Acceptance.** The solutions record states a verdict with the runs that produced it. `bun test tests/omp-fork-vocabulary.test.ts tests/doc-claims-validator.test.ts`. Host-to-host comparison lives **only** in this solutions file.

#### U4 — promotion (only on keep or degrade)

**Files.** `skills/ce-mode/references/decide.md`, `ship.md`; `docs/guides/ce-mode.md`; one catalog row; root README name + count bump (rebase if U5 landed first); one `ce-start` route-table row.

- `decide.md`: verdict/scope/doc → `ce-pov` / `ce-brainstorm` / `ce-doc-review`.
- `ship.md`: existing work the user said to ship → simplify → review → `ce-commit-push-pr` → `ce-babysit-pr`. Only playbook that may name a user-invoked callee; rendering rule sits immediately above that seam.
- Guide states stickiness is a convention with a self-re-anchor (or invoke-per-task, on degrade).

---

### Track B — pstack fold-ins

#### U5 — `ce-verify` (highest-value fold besides `ce-mode`)

**Files.** `skills/ce-verify/SKILL.md`, `references/generate.md`, `references/refresh.md`, `references/feature-map-example/{README.md,search.md}`, `docs/guides/ce-verify.md`. Catalog row under Workflow Utilities after `/ce-test-xcode`. Root README: add `ce-verify` to Testing & design; bump the three skill counts (rebase if U1/U4 already bumped).

**Frontmatter.** Model-invocable. `argument-hint: "[create | refresh] [app or surface hint]"`. Description names both routes, under 1024 chars. Do **not** set `disable-model-invocation`.

**Kernel.** Outcome: repo-local verify skill exists, ran launch → doctor → one mapped feature → evidence → cleanup, evidence survived. Route: bare/`create` → generate; `refresh` → maintain; if a map already exists and the user said `create`, ask once whether to refresh. Boundaries: never edit product code; map/app disagreement is doc drift *or* a product regression — fix the first, report the second; never kill by process name; cleanup never deletes evidence; refuse to double-drive a shared instance that cannot be isolated.

**`generate.md`.** Interview from the repo; only unobservables go to the user (Surface, Run, Drive, Observe, Isolate). Drive prefers existing harnesses, then host `browser` for web/Electron, PTY for CLI/TUI, HTTP for services. Seed top 3–5 features from the example shape. Prove once end to end, including cleanup after failed attempts.

**`refresh.md`.** Glob `.agents/skills/verify-*/`. Index hygiene. One read-only subagent per feature file (never drives, never edits). Coordinator owns the live pass. Outcomes `clean` / `changed` / `blocked`. For `changed`, invoke `ce-commit-push-pr` by name. Edit scope: the verification skill's own directory only.

**Example map.** Fictional note-taking CLI. No CE-specific selectors.

**Acceptance.** `bun test tests/skill-conventions.test.ts`. Cell: `bun run test:skill-eval-cell -- --skill ce-verify --fixture tests/skill-eval-cell/fixtures/seat-cap --git-init --task "set up a verification skill for this project"` yields the C1 file set. A refresh whose recipe no longer matches reports `changed`; a genuine product break is reported, not edited into the map.

#### U6 — `blast-radius-reviewer` in `ce-code-review`

**Files.** Create `skills/ce-code-review/references/personas/blast-radius-reviewer.md`. Edit `persona-catalog.md`, `select-and-route.md`, `tests/review-skill-contract.test.ts` (`personas` array). No schema, dispatch-tier, or adversarial-route change.

Method: what the change actually does (including the unstated part) → the one fact it is safe because of → look where grep stops (JSON, DB column, wire format, other language, flag, pinned library, timing, three hops down) → confirmed vs checked-and-cleared. Seam vs `api-contract`: that persona grades the declared contract; this one grades undeclared readers. Not selected when every consumer is inside the diff. Selecting it disqualifies the lite roster like any other conditional persona.

**Acceptance.** `bun test tests/review-skill-contract.test.ts`. A renamed serialized field consumed by a non-TypeScript reader produces a `blast-radius` finding at `file:line` with ladder level. A pure in-module refactor does not select it.

#### U7 — `code-lineage-analyst` in `ce-plan`

**Files.** Create `skills/ce-plan/references/agents/code-lineage-analyst.md`. Edit `references/research.md` §1.1, Collect list, §1.4. No new plan section. No MCP roster. No change to `ce-plan/SKILL.md`.

Dispatch in the same research wave **when the plan modifies existing code with history** and at least one of: altering a defensive shape, a KTD that would reverse an earlier decision, or a legacy/fragile area. Not for greenfield. Not Lightweight.

Anchor: `git blame`, `git log --follow`, PR numbers in subjects, then PR bodies. Return C3. Recency is not authority.

**Acceptance.** `bun test tests/skill-conventions.test.ts`. A plan over code with a reverted attempt names that attempt as `found` in Alternatives or Risks. Greenfield dispatches no lineage agent.

#### U8 — `ce-dogfood` consumes the map (depends on U5)

**Files.** `skills/ce-dogfood/references/phases.md` Phase 2a/2b; one clause in `SKILL.md` Delegation. No driver-policy, matrix taxonomy, or report-template change. No files under `skills/ce-verify/**`.

When a map exists, use its entry points and drive recipes for surfaces the diff touches. The map does not replace flowcharts for new/changed flows. Map vs app: app wins this run; record suspected drift, do not fix it here. If the map lists a touched feature the matrix omitted, add a scenario.

**Acceptance.** `bun test tests/skills/ce-dogfood-body-pins.test.ts tests/skill-conventions.test.ts`. With a map, Phase 2 cites it; without, unchanged.

#### U9 — `ce-worktree` prune

**Files.** `skills/ce-worktree/SKILL.md` (description + `## Prune` after Step 2), `docs/guides/ce-worktree.md`. Catalog row reword is applied by whichever unit owns `docs/guides/README.md` at the time (U1/U4 or U5).

Classify each linked worktree: **safe** (branch fully merged to trunk *or* gone from remote, porcelain empty, no unpushed commits), **unsafe**, **current** (never a candidate). Ask once which safe candidates to remove. `git worktree remove` then `git worktree prune`. Never `--force`, never delete a branch. Missing directory → prune bookkeeping, not a removal.

**Acceptance.** Throwaway repo, two worktrees (merged-clean vs dirty): classifies correctly, removes nothing before the answer, after confirming only the safe one the dirty tree remains.

---

## Sequence for the next chat

Implement in this order. Do not start U4 until U3 has a written verdict. U8 cannot start before U5.

1. **U1** — smallest spike that makes `/skill:ce-mode` real.
2. **U2** — content eval (can overlap U1 once the contract is frozen).
3. **U3** — kill/degrade/keep. If kill, stop Track A.
4. **U5** — `ce-verify` (highest fold-in; independent of Track A files except README counts).
5. **U6, U7, U9** — independent grafts; parallelizable.
6. **U8** — after U5.
7. **U4** — only if U3 kept or degraded.

Authoring a skill under `skills/**` invokes `ce-skill-work` first.

---

## Risks

| Risk | Boring choice |
|---|---|
| Stickiness is a convention; compaction silently drops gates. | Re-arm is a self-check before acting. U3 Observation D measures it. Degrade to invoke-per-task rather than fake a harness mode. |
| Playbooks re-derive `ce-plan`/`ce-work`. | U1 acceptance greps for git/`gh`/test commands. Any hit is a rewrite. |
| `ce-mode` looks like a second `ce-start`. | Fallback row *invokes* `ce-start`. If Observation C is 0/3, kill. |
| `ce-verify` becomes a second QA runner. | It never drives a matrix or writes a report. If the boundary blurs, ship `create` first and cut refresh's live pass to one feature. |
| `.agents/skills/` might not register as invocable. | C1 detection is a glob, not a skill lookup. Consumers read files by path. |
| `blast-radius` double-reports with `api-contract`. | Write the seam into the persona. Stage 5 dedup already merges by fingerprint. |
| Lineage slows every plan. | Dispatch gate is narrow. If it hurts, keep only the decision-reversal condition. |
| README counts collide across tracks. | First new-skill unit owns the bump; later rebase. |
