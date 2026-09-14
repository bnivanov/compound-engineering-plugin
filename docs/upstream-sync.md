# Upstream Sync Record

Running log of syncs between this fork (`bnivanov/compound-engineering-plugin`, OMP-only) and upstream `EveryInc/compound-engineering-plugin`.

## Procedure

1. Fetch upstream by URL — there is deliberately **no persistent `upstream` remote** (a prior `gh` invocation targeted EveryInc because remote order made it the default; the remote was removed after the incident):

   ```bash
   git fetch https://github.com/EveryInc/compound-engineering-plugin main
   ```

   The fetched head lands on `FETCH_HEAD`; objects persist in `.git` and stay addressable by SHA.

2. Compute the range: `git log --oneline <recorded-base>..FETCH_HEAD` (or the recorded upstream HEAD if still reachable).

3. Classify each new commit into the disposition vocabulary below and record it in the table.

4. Any `gh` call against this repo needs `-R bnivanov/compound-engineering-plugin` — without the upstream remote, `gh` resolves the fork correctly, but the flag makes the target explicit.

## Disposition vocabulary

| Disposition | Meaning |
|---|---|
| `ported` | Change applied to the fork (clean or hand-merged); cite the fork commit |
| `partial` | Some hunks applied; record which and why the rest were skipped |
| `skipped` | Evaluated and deliberately not ported; record the reason |
| `pending-decision` | Feature-level adoption question the user has not decided |
| `n/a-fork` | Targets a surface the fork does not carry (docs site, deleted scripts, multi-host machinery) |

## Program baseline (Slice 0, 2026-09-14)

- **Program baseline SHA (upstream HEAD at program start):** `fd8abda7f64ead2f410da2cfd86c0c8e7cbf8187` (2026-09-13, `feat(lfg): route each request to the skill that owns it before shipping (#1702)`) — fetched per the documented no-persistent-remote procedure, verified resolving via `git cat-file -t` (commit). 17 commits ahead of the 2026-09-11 sync's `c4a643b1` check point; per-commit dispositions land with their Tier-1 slices, not here.
- **Evidence base persisted (R18):** research report at `docs/brainstorms/2026-09-14-plugin-ecosystem-research.md` (session artifact `$TMPDIR/deep-research-20260914a-kq223ilo/report.md`, 66 verified claims / 44 sources); claim ledger at `docs/brainstorms/claims-20260914a.jsonl` (same source dir; lives under `docs/brainstorms/` because that tree is excluded from the shipped-surface vocabulary scan — the ledger legitimately carries model-name literals). Every program disposition cites these.
- **Capability audit:** `docs/omp-capability-audit.md` (Slice-0 findings record; mechanism × hook × fallback table for R9/R11/R12/R13/R15). No blocked-with-reason entries; one negative finding — no wire-level per-spawn model field on task dispatch (omp v18.1.21).

## Sync 2026-09-11

- **Base (merge-base):** `8df67793b9733d2220fa9a7fc37139931471af62` (upstream 3.24.0, 2026-09-08)
- **Upstream HEAD at check:** `c4a643b1e4b87507782293367e7f3110daceea16` (2026-09-11)
- **Range:** 17 commits, 438 files
- **Plan:** `docs/plans/2026-09-11-2257-fix-upstream-sync-ports-plan.md`
- **Branch:** `fix/upstream-sync-ports`

| Commit | Subject | Disposition | Evidence |
|---|---|---|---|
| `b8866a1d` | feat: add experimental Bake-off approach comparison (#1652) | resolved-by-adoption | Adopted and ported as unit U5 on 2026-09-14 (at the de-experimentalized state below); see Sync 2026-09-14 (U5) |
| `fe74844c` | fix(ce-bakeoff): drop experimental labeling (#1655) | resolved-by-adoption | Adopted with ce-bakeoff as unit U5 on 2026-09-14 — the port lands the post-labeling files; see Sync 2026-09-14 (U5) |
| `153e605e` | feat(ce-noslop): add the plain-prose skill (#1653) | resolved-by-adoption | Adopted and ported as unit U5 on 2026-09-14 (at the post-#1700 state, `aae9f91c`); see Sync 2026-09-14 (U5) |
| `bec6b419` | fix: let explain and pov support calling workflows (#1658) | ported | `55269e89`; 30 files; `cross-model-panel.md` hunk skipped (fork's OMP-only rewrite removed the target paragraph; semantics land via ported intake.md/SKILL.md) |
| `b36047e1` | fix(ce-babysit-pr): sustain monitoring after PR handoff (#1659) | ported | `d1172a46`; watch-loop.md condition ported into OMP background-and-wake mechanism; catalog cells translated to OMP scenario shape |
| `b3efbd6c` | fix(review): release collected agents before follow-on work (#1649) | ported | `1998a529` (with ae6226f5); conditions ported into OMP task-dispatch mechanism |
| `235252fa` | feat(site): publish docs site (#1664) | n/a-fork | Fork has no `site/` surface |
| `5130557e` | feat(packs): Compound Packs (#1549) | resolved-by-adoption | Adopted and ported as unit U3 on 2026-09-14; see Sync 2026-09-14 (U3) below |
| `ae6226f5` | fix(ce-code-review): collect reviewers by attributable terminal outcome (#1667) | ported | `1998a529` (ordered pair with b3efbd6c) |
| `2783b8e3` | fix(site): built HTML at any base path (#1669) | n/a-fork | Fork has no `site/` surface |
| `390b0138` | fix(ce-optimize): focus progress updates on useful findings (#1668) | ported | `92a00fe0`; 8 files; catalog cells translated to OMP shape |
| `16c2b972` | fix: reduce review noise and clarify agent communication (#1657) | partial | `c6ac2dbc`; 50 files ported; 51 upstream files skipped (ce-noslop skill files, upstream-only eval reports, calibration-scenarios.ts module + 44 eval fixtures); `cross-model-panel.md` hunk skipped (fork-adapted). The ce-noslop skip closed with unit U5's whole-skill port below |
| `f831db7c` | fix(ce-optimize): reject incomplete paired baselines (#1651) | ported | `f5819db0`; clean apply, both files identical to base |
| `6a00e35c` | fix(ce-commit-push-pr): preserve ignored files during branch switches (#1647) | ported | `41add928`; contract-test hunks hand-merged onto drifted file |
| `9ac32720` | fix(ce-work): honor CROSS_MODEL_EFFORT_OVERRIDE (#1634) | n/a-fork | Fork deleted `skills/ce-work/scripts/cross-model-work.sh` |
| `1a9f16c4` | refactor(skills): restate skill bodies in plain language (#1671) | skipped | Conflicts wholesale with OMP-adapted prose; revisit only if upstream style becomes canonical. Ported files land at pre-restatement state — re-check them against upstream HEAD if this is ever adopted |
| `c4a643b1` | refactor(skills): restate remaining dense skill references (#1681) | skipped | Same as 1a9f16c4 |

All dispositions verified 2026-09-11 against upstream HEAD `c4a643b1`.

### Port notes

- Ports are file-granular, not cherry-picks: every commit except `f831db7c` fails `git apply --check` on at least one file because the fork drifted. Commit messages cite the upstream SHA.
- `tests/skill-eval-cell/catalog.ts` is contended by four ported commits; it was serialized through units in the order b36047e1 → bec6b419 → 390b0138 → 16c2b972, each translating upstream's `exec_command`-shaped scenario cells to the fork's OMP scenario shape.
- The `16c2b972` catalog hunk imports `calibration-scenarios.ts`, a module the fork lacks — the import and its scenario entries were skipped.
- Fork version `3.24.1-omp.13` is fork-local; upstream remains at 3.24.0.

## Sync 2026-09-14 (U2: ce-code-review hardening cluster + quorum dedup)

- **Slice baseline (fork, pre-cluster):** `f050478d` — working tree of `feat/plugin-ecosystem-port-program`; per KTD1 no cherry-picks, hand-merge per file.
- **Upstream pin:** `fd8abda7f64ead2f410da2cfd86c0c8e7cbf8187` (program baseline). Fetched via the documented no-persistent-remote procedure; each commit read at the pinned SHA before merging. This slice's fork commits are added by the orchestrator.
- **Range:** the seven-commit ce-code-review hardening cluster. Three further upstream commits touching ce-code-review paths in this range — `5c32ef92` (#1683 descriptions/ask-first), `73df4650` (#1685 plan readiness), `d4846858` (#1686 declared grading) — dispositions land with U4/U6, not here.

| Commit | Subject | Disposition | Evidence |
|---|---|---|---|
| `98ca50b7` | fix(ce-code-review): count .mjs and .cjs files as executable changed lines (#1696) | ported | U2 slice; `scripts/review-scope.py` `CODE_EXTENSIONS` gains `.mjs`/`.cjs` (fork keeps its packs/`.omp-plugin` adaptations); regression pin in `tests/ce-code-review-mechanics.test.ts` |
| `53af1a2e` | fix(ce-code-review): promote agreement only with a verified cross-model peer (#1697) | ported | U2 slice; promotion gate on `independent_reviewer()`/`merge_group()` in `findings-mechanics.py` (diff-identical to upstream at pin, with the fork's `adversarial-omp` identity naming), Stage-5b skip rule in `references/finish-review.md`, dispatch-report sentence, catalog + mechanics/contract pins |
| `28cdaf76` | fix(ce-code-review): preserve findings with artifact quotes (#1684) | ported | U2 slice; `first_evidence` hydration seam — helper diff-identical to upstream, helper-contract + evidence-attach + backfill-count paragraphs in `references/finish-review.md`, first_evidence recovery in `references/dispatch-reviewers.md`, two mechanics tests |
| `ea9d090b` | feat(ce-code-review): require cited evidence to reject a protected-subject finding (#1694) | ported | U2 slice; protected-subject veto + unresolved-gate semantics in `references/finish-review.md` step 5, `references/findings-schema.json` gains `protected_subject`/`validation_status`/`validation_reason` (schema now byte-identical to upstream), `references/validator-batch-template.md` policy hunk, `review-output-template.md` Coverage-row counts skipped (fork renders coverage from its own template shape — recorded below), validator-veto eval cell + fixture |
| `7511114e` | fix(ce-code-review): finish the round from run-dir artifacts in a fresh context (#1692) | partial | U2 slice; single-context adaptations ported: run-artifacts list gains the verdicts/artifact lines, step-4/5 consume the on-disk outcome. Skipped: the three-leaf split itself — `references/finish-input.md` (new upstream reference), the three-context header paragraph, and the leaf-authority clause resolving `apply:local` through `finish-input.json`; the fork finishes rounds in one context, so leaf handoff machinery has no host |
| `8bc0d03f` | fix(ce-code-review): bound the Stage 4 reviewer wait on each reviewer's artifact (#1691) | ported | U2 slice; Agent-lifecycle rule + bounded in-turn dispatch in `references/dispatch-reviewers.md` and SKILL.md Stage-4 bound clause. Adaptation: the 20-minute bound is inlined into the fork's dispatch prose (fork's `subagent-template.md` has no budget field — the subagent-template hunk is skipped); orphaned `references/validator-template.md` deleted per this commit's deletion (nothing referenced it) |
| `25b9c90e` | fix(ce-code-review): bound the validator wait on an on-disk verdicts file (#1688) | ported | U2 slice; `references/validator-batch-template.md` rewritten — byte-identical to upstream at pin; Stage-5b step 4/5 consume `$RUN_DIR/validator-verdicts.json`; `SKILL.md` filenames repointed; contract-test filename pin fixed from `validator-template.md` |
| `ae6226f5` | fix(ce-code-review): collect reviewers by attributable terminal outcome (#1667) | re-verified, no new disposition | U2 slice; SKILL.md Stage-4 terminal-outcome collection and `references/dispatch-reviewers.md` collection prose still present at this slice's state (recorded `ported` at `1998a529`, 2026-09-11 sync) |

### Port notes (U2)

- **Quorum consensus-dedup graft (R21, bundled per R2/KTD8).** Landed inside this slice as Stage-5 model reconciliation in `references/finish-review.md`, before the restore-mechanics rerun: differently-worded consensus on the same file:line merges into one entry carrying both reviewers' attributions; quorum requires two independent reviewer identities; a consensus merge triggers one explicit bounded refutation pass. `findings-mechanics.py` keeps exact-fingerprint dedup, promotion, and restoration — the graft is judgment prose, not helper code. Pin: mechanics test (consensus merge retains both attributions and confidence 75). No upstream SHA row — this is a bundled graft, recorded here as the R2 bundle's ledger entry.
- **Fork adaptations preserved:** no shell-worker reintroduction (`cross-model-adversarial-review.sh` stays gone; the adversarial peer is the fork's `adversarial-omp` identity); bounded foreground concurrency stays ("one foreground concurrent batch" in SKILL.md, never re-serialized per #1159); the `cross-model-panel.md` hunk stays skipped (fork-adapted); no packs wiring in dispatch prose until U3.
- **Skipped hunks, other units' territory:** none of the skipped material above is re-dispositioned later; `references/finish-input.md` adoption would be required first if a future unit splits finish across contexts.
- **`tests/skill-eval-cell/catalog.ts`** serialized per KTD1: this unit's delta is the two ce-code-review cells (`ce-code-review/artifact-quote-before-filter` #1684, `ce-code-review/validator-veto-routes-protected-rejections` #1694) plus their fixture trees, catalog.test list rows, and the `must_include_any` field the fork's `Grade` type and `grade.ts` lacked relative to upstream pre-cluster (minimal enabling port; the `declared` grading machinery remains U4's).
- All dispositions verified 2026-09-14 against upstream `fd8abda7`: focused suites green (`tests/ce-code-review-mechanics.test.ts`, `tests/review-skill-contract.test.ts`, `tests/skill-eval-cell/{catalog,grade}.test.ts` — 127 pass / 0 fail).

## Sync 2026-09-14 (U3: Compound Packs)

- **Upstream pin:** `fd8abda7f64ead2f410da2cfd86c0c8e7cbf8187` (program baseline). Hand-merge per file; no cherry-picks.

| Commit | Subject | Disposition | Evidence |
|---|---|---|---|
| `5130557e` | feat(packs): Compound Packs (#1549) | ported | U3; resolver + consumer wiring across seven skills, config template/example packs blocks, `docs/guides/packs.md`, `docs/guides/configuration.md` packs section, ce-setup scaffold (`pack-scaffold.md`, `assets/pack-rule-template.md`, SKILL.md description/argument-hint/Pack Scaffold) + check-health packs block, `docs/guides/README.md` cross-ref. Seven resolver copies all sha256-pinned to `0e7de94883fcaa19576a93ed206513de6609720898e2a20ed4be5b599691a939` in `tests/skills/ce-packs.test.ts` |

### Port notes (U3)

- **Settled departures (recorded as settled; do not re-litigate):** 7 resolver copies not 2 (upstream puts one per consumer skill); repo-fixes.md rollout step + guides/README packs.md row are fork-side additions; single parity test file (`tests/skills/ce-packs.test.ts`) instead of upstream per-file tests; exclusions: CONCEPTS.md, root README, legacy-cleanup.ts, docs/guides/ce-*.md rows, upstream dogfood/plan learnings files, upstream test files, babysit-pr test hunks.
- All dispositions verified 2026-09-14 against upstream `fd8abda7`: focused suites green (`tests/skills/ce-packs.test.ts`, `tests/skills/ce-setup-check-health.test.ts` — 56 pass / 0 fail).

## Sync 2026-09-14 (U4: hygiene sweep)

- **Upstream pin:** `fd8abda7f64ead2f410da2cfd86c0c8e7cbf8187` (program baseline). Each commit read at the pinned SHA before porting.

| Commit | Subject | Disposition | Evidence |
|---|---|---|---|
| `5c32ef92` | fix(skills): tighten Astra-era description and ask-first load (#1683) | ported | U4; Astra-shaped descriptions (first-verb trigger shape, "Use when" gates, sibling catalogs pushed to body) across `ce-explain`/`ce-code-review`/`ce-brainstorm`/`ce-pov`/`ce-strategy` SKILL.md + ce-pov body ce-bakeoff sentence; ce-debug ask-first load gate; ce-plan/ce-prototype already-authorized authority-envelope lines; ce-plan reference + ce-work harness prose (plan-handoff.md, build.md, scoping.md, loop.md 2.1/2.2); ce-optimize-decide cost-prose replacement; routing/contract pins updated. AGENTS.md pattern port: root file compressed to invariant+pointer form and the task-loaded essays moved to `docs/solutions/developer-experience/always-on-agents-md.md` (fork-adapted: ce-explain preamble as the shipped example; no `scripts/run-tests.ts`/provider/substituted-skill-dir material — not fork-true). Harness: `tests/skills/astra-description-triggers.test.ts` (upstream test ported with fork-adapted AGENTS.md block; ce-noslop row deferred to U5, skill absent pre-port) |
| `d4846858` | feat(skill-eval): grade declared decisions in eval scenarios (#1686) | ported | U4; `grade.ts` declared-decision lines parsed via `declaredLines` + graded on the decision alongside artifact fields; `Grade.declared` in catalog types; 6 decision rows across ce-plan/ce-work/ce-brainstorm/ce-ideate/ce-doc-review/ce-compact scenarios + `scenarioHasDecisionGrade` consistency check; pins in `catalog.test.ts`/`grade.test.ts` |
| `9c1bdeda` | ci: cap the test job at 30 minutes (#1687) | ported | U4; `.github/workflows/ci.yml` test job gains `timeout-minutes: 30` with the wedged-`--parallel`-worker comment (oven-sh/bun#34069); `fetch-depth: 0` and the `bun run test` pin untouched; `yaml.safe_load` parses |
| `f050478d` | refactor(skills): say conditions in ordinary English (#1682) | skipped | Third sweep of the #1671/#1681 restatement campaign, both inherited `skipped` ("Conflicts wholesale with OMP-adapted prose; revisit only if upstream style becomes canonical"). The fork has not adopted upstream's restated style — fork skill prose remains OMP-adapted — so the recorded flip condition does not hold; same campaign disposition carries forward. Ported files (e.g. ce-code-review references) stay at pre-restatement state |
| `b9422df1` | fix(ci): re-run failed test files in a fresh process after a wedged bun worker (#1680) | n/a-fork | Retry mechanism lives in `scripts/run-tests.ts`, a wrapper hosting the test runner; the fork's test entry is the package script `bun test --parallel` directly — no wrapper exists to host the fresh-process TimeoutError re-run, the fork does not ship `bun-parallel-worker-loses-subprocess-exit.md`, and no fork CI run has exhibited the timeout-then-pass shape the retry masks. Flip condition: adopt a `run-tests.ts`-style wrapper first |

### Port notes (U4)

- **`AGENTS.md` pattern port (R7), not text port:** upstream's compressed always-on file pins `scripts/run-tests.ts` + `TimeoutError`; the fork's AGENTS.md keeps its own pinned sections (PR disclosure, compounding-learnings, release versioning, cache bullets, CI intro, What belongs where, Repository Docs Convention) and compresses only Testing/Scratch/CI-detail/tier essays into pointers. `bun-parallel-worker-loses-subprocess-exit.md` and the provider-checklist section are not ported (no fork counterpart). Upstream's "for example `skills/ce-code-review/SKILL.md`" pointer is fork-false (no scratch preamble there); the doc and compressed bullet point at `skills/ce-explain/SKILL.md`, which ships the preamble in the fork.
- **`tests/skills/ce-handoff-contract.test.ts`** `instructions` corpus now spans `AGENTS.md` + `docs/solutions/developer-experience/always-on-agents-md.md` (upstream hunk verbatim).
- **`catalog.ts` delta serialized before U5:** the `Grade.declared` type field + six declared-decision rows; ce-noslop catalog material waits for U5's whole-skill port.
- **`skills/ce-work/scripts/__pycache__/`** orphaned build output (no `.py` sources): deleted from the working tree; untracked, so no diff.
- All dispositions verified 2026-09-14 against upstream `fd8abda7`: focused suites green — `tests/skills/astra-description-triggers.test.ts` (9 pass), `tests/skill-eval-cell/catalog.test.ts` + `grade.test.ts` (50 pass; 59 across the three named files); failing-shape proof: breaking ce-strategy's description with a sibling-catalog trigger fails the test (8 pass / 1 fail), reverting restores green.

## Sync 2026-09-14 (U5: ce-bakeoff + ce-noslop whole-skill ports)

- **Upstream pin:** `fd8abda7f64ead2f410da2cfd86c0c8e7cbf8187` (program baseline). Files ported at the pinned SHA; hand-merge per file; no cherry-picks.

| Commit | Subject | Disposition | Evidence |
|---|---|---|---|
| `b8866a1d` | feat: add experimental Bake-off approach comparison (#1652) | ported | U5; whole skill `skills/ce-bakeoff/` (`SKILL.md`, `references/{candidates,judging,output,verification}.md`) at the pin — which postdates the de-experimentalization (#1655) and the restatement campaign (#1671), so the landed state is the pin's; 9 post-only catalog cells; `docs/guides/ce-bakeoff.md` + guide catalog row; README rows and counts (37→39) |
| `fe74844c` | fix(ce-bakeoff): drop experimental labeling (#1655) | ported | U5; folded into the whole-skill port (files land at the pin, past this commit) |
| `153e605e` | feat(ce-noslop): add the plain-prose skill (#1653) | ported | U5; whole skill `skills/ce-noslop/` (`SKILL.md`, `references/{patterns,terminology}.md`) at the pin; 6 byte-identical eval fixtures; 7 post-only catalog cells; `result_must_not_include` grading; `docs/guides/ce-noslop.md` + guide catalog row; README rows and counts |
| `aae9f91c` | fix(ce-noslop): make the edit-mode change summary opt-in (#1700) | ported | U5; unreleased upstream at the pin; the ported SKILL.md edit bullet carries the opt-in wording ("Say what changed in one line only when the caller asks for it"); opt-in-not-default pinned in `tests/skills/astra-description-triggers.test.ts` (body must NOT contain "plus one line saying what changed") |
| `1a9f16c4` | refactor(skills): restate skill bodies in plain language (#1671) | skipped (scope note) | The 2026-09-11 fork-wide `skipped` stands. ce-bakeoff is new on this fork, so the row's caveat ("re-check ported files if this is ever adopted") has no pre-restatement fork state to re-check: the port lands ce-bakeoff directly at the pin's restated text |
| — | learning doc `docs/solutions/skill-design/inline-callee-side-channel-must-name-where-it-may-not-land.md` | ported | U5; ported from the pin with omp adaptations (inline-load wording for the side-channel mechanism, "observed upstream in Claude Code" provenance markers, sibling-count reality rewritten for a fork where ce-noslop lands unwired); anchors verified against the ported files (`skills/ce-noslop/SKILL.md:20`, `:23`, `references/patterns.md:59`) |

### Port notes (U5)

- **Grade machinery companion edits (U2 serialization precedent):** `Grade.result_must_not_include` + the `resultBlock()` marker-block reader in `grade.ts`/`catalog.ts` types, 4 RESULT-block tests in `grade.test.ts`, and 16 post-only cells (7 ce-noslop + 9 ce-bakeoff, upstream verbatim in shape translated to the fork's OMP scenario shape); 6 noslop-drafts fixtures + 3 bakeoff-upload fixtures byte-identical to the pin. The fork's single-line `lastField` simplification is kept — upstream's multi-line `lastFieldBlock` reader is out of this slice's scope; the ported bakeoff cells mandate the inline `OUTCOME: value` form their task scripts emit.
- **OMP adaptation pass (2 lines across both skills):** `skills/ce-bakeoff/references/judging.md` routes the judge role through "a fresh subagent dispatched with the `ce-pov` skill" (upstream says "warm/guest mode" — upstream-host vocabulary); `skills/ce-bakeoff/references/candidates.md` drops the "peer-job Python framework" clause and keeps the invariant verbatim ("Keep dispatch calls direct and scoped; do not build a new dispatch system for this task"). Every other skill file is byte-identical to the pin. The ce-bakeoff scratch-root preamble executes clean (`tests/scratch-root-preamble-executes.test.ts`); no executed shell block references bundled files, so no `SKILL_DIR` anchor applies. No upstream file references `xd://` devices or fork-hostile tool names beyond the two adapted lines.
- **Guide pages are fork-true:** `docs/guides/ce-noslop.md` marks the chain position as upstream wiring not landed on this fork (the port lands the skill unwired — invoke it directly); its "Make it automatic" note records that fork `ce-setup` offers only the learnings-store mention and the `ce-compound` directive, so a standing noslop instruction is added by hand. `docs/guides/ce-bakeoff.md` follows the fork's ce-pov models paragraph shape and drops upstream's Codex dollar-cost aside (fork has no Codex surface).
- All dispositions verified 2026-09-14 against upstream `fd8abda7`: focused suites green — `tests/skills/astra-description-triggers.test.ts` + `tests/frontmatter.test.ts` + `tests/skill-agent-ce-prefix.test.ts` (783 pass), `tests/skill-conventions.test.ts` + `tests/skill-eval-cell/{catalog,grade}.test.ts` (351 pass), `tests/skill-shell-safety.test.ts` + `tests/scratch-root-preamble-executes.test.ts` + `tests/omp-native-install.test.ts` + `tests/codex-skill-prompt-budget.test.ts` (31 pass); `omp install --dry-run --json .` lists the `./skills` manifest root.

## Sync 2026-09-14 (U6: `artifact_readiness` removal / contract migration)

- **Upstream pin:** `fd8abda7f64ead2f410da2cfd86c0c8e7cbf8187` (program baseline). Hand-merge per file; no cherry-picks.
- **Fork-side scope note:** the migration is derived-readiness replacement across all three gate call sites (lfg plan-brief, ce-work intake, ce-plan pipeline); legacy `artifact_readiness` keys (including this program plan's own frontmatter) are tolerated and ignored, never rejected. Readiness stays two-valued document completeness.

| Commit | Subject | Disposition | Evidence |
|---|---|---|---|
| `73df4650` | fix(plan): derive review and execution readiness from content (#1685) | ported | U6; readiness field removed repo-wide: `plan-sections.md` canonical predicate (content-derived two-valued classification, single migration instruction as the only `artifact_readiness` mention, `status`-field prohibition), the three gates (`lfg/references/plan-brief.md`, `ce-work/references/input-triage.md`, `ce-plan/references/{intake,final-review,plan-handoff,resume,output-contracts}.md`), `ce-doc-review` (SKILL.md, dispatch.md, document-intake.md, subagent-template.md), `ce-code-review/references/intent-and-plan.md`, `ce-brainstorm` (SKILL.md, brainstorm-sections.md, phase-0.md, universal-brainstorming.md), `ce-prototype` (SKILL.md, references/write-back.md), `ce-sweep` (plan-template.md, run.md), `ce-ideate/references/html-rendering.md`, `AGENTS.md`, `docs/guides/{ce-brainstorm,ce-plan,ce-work}.md`; contract tests migrated in lockstep (`tests/skills/unified-plan-artifact-contract.test.ts`, `tests/pipeline-review-contract.test.ts`, `tests/skills/ce-plan-handoff-routing.test.ts`, `tests/skills/ce-prototype-write-back.test.ts`, `tests/skills/html-output-invariants.test.ts`) with 9 derived-readiness fixtures under `tests/skills/fixtures/derived-readiness/`; eval fixtures (`tests/skill-eval-cell/fixtures/{implementation-ready-plan,requirements-only-plan,doc-review-*}`) and the `ce-work/requirements-only-stops` pre_contract reworded content-based |

### Port notes (U6)

- **Fork adaptations preserved:** ce-work return routing keeps the fork's "enter **Return-to-Caller Mode**" wording (upstream's `mode:return-to-caller <plan-path>` body shape differs); the ce-plan handoff menu rendering and ce-work routing sentences follow the fork's post-U2/U5 file states; upstream's `PLAN_CONTENT_BASE_REF=5c32ef92`-era fixture tree and new eval scenarios are not required — the fork's existing catalog scenarios were reworded, not duplicated.
- **Supersession semantics carried over unchanged:** #972's stale-sibling protection now lives in visible supersession notices + same-basename ambiguity resolution ("ask which"), pinned per plan-final-review, ce-plan intake, and ce-work input-triage.
- All dispositions verified 2026-09-14 against upstream `fd8abda7`: focused suites green — `tests/skills/unified-plan-artifact-contract.test.ts` (76 pass), `tests/pipeline-review-contract.test.ts` + `tests/skills/{ce-plan-handoff-routing,ce-prototype-write-back,html-output-invariants}.test.ts` (125 pass), `tests/skill-eval-cell/catalog.test.ts` (16 pass), `tests/skill-eval-cell/{extract,grade,reproducibility,review-integrity}.test.ts` (88 pass). Live grep: zero `artifact_readiness` references remain outside historical docs (`docs/plans`, `docs/brainstorms/*`) plus the canonical single migration instruction in `plan-sections.md` and its absence-pinning test assertions.

## Sync 2026-09-14 (U7: fresh-verifier acceptance gate)

- **Program item (ecosystem graft — no upstream SHA applies):** R9. lfg gains a fresh-verifier acceptance gate placed after step 5's review fixes land and before shipping.

| Item | Disposition | Evidence |
|---|---|---|
| R9 fresh-verifier acceptance gate (pilotfish/pi-oven pattern) | ported | U7; the PASS/BLOCK verifier receipt is defined in `skills/lfg/references/review-followup.md` as an extension of `work-return.md`'s field inventory (`verdict`, `u_ids_scoped`, `evidence_pointers`, `serving_mode`, `independence`; BLOCK adds `blockers` + `recovery_path`) and consumed by `skills/lfg/references/shipping-tail.md` before anything ships; `work-return.md` stays byte-unchanged (consumed at step 2, too early to certify the post-fix tree). The gate appears in `skills/lfg/SKILL.md`'s documented stage order between the fixes and the shipping tail. The verifier dispatches with fresh context and no implementation history, serves the session model (audit R3b: no wire-level per-spawn model field on omp v18.1.21; no new config keys), and carries `independence: structural-only` through to the PR body — never presented as cross-model or independent-model assurance. BLOCK triggers exactly one bounded rework (one `ce-work` recovery invocation, same plan path, then one re-gate); a second BLOCK or an environmental failure stops blocked-with-recovery, never an infinite hold. Pin: 4 tests in the `lfg fresh-verifier acceptance gate (R9)` describe of `tests/pipeline-review-contract.test.ts` |

### Port notes (U7)

- **Integration note (orchestrator):** `skills/lfg/SKILL.md` sits at 99% of the Codex 8000-byte prompt bound (observed 7924/8000 in LF bytes before this slice). The gate's always-loaded presence was therefore paid for by compressing that file's "only it carries …" reference catalogues down to their conditions — every condition and every test-pinned phrase survives; the detail lives in the reference files the body names. Bound re-verified by `tests/codex-skill-prompt-budget.test.ts` (down-only ratchet: `lfg` must never join `OVER_BUDGET`).
- **Stage-order pins unaffected:** the gate attaches inside step 5's block and inside `shipping-tail.md`'s step-8 region, so no numbered heading moved — the pins at `tests/skills/unified-plan-artifact-contract.test.ts` (step-6/7 slice) and `tests/review-skill-contract.test.ts` (`Stack handoff from step 8`) pass unchanged.
- **Unmet verification, recorded rather than claimed:** the unit's verification line reads "the gate demonstrably fires in an lfg run (a seeded defect produces BLOCK)". No lfg run was made and no seeded defect produced a real BLOCK; what exists is the receipt contract, its consumption before shipping, and the stage-order placement, all pinned by contract tests — artifact existence plus wiring, which is not a firing. The mechanism is real and consumed; the demonstration is unattempted and is recorded here as unmet rather than claimed.

## Sync 2026-09-14 (U8: milestone audits in ce-work final validation)

- **Program item (ecosystem graft — no upstream SHA applies):** R10. ce-work's final-validation seam gains a cross-phase milestone audit.

| Item | Disposition | Evidence |
|---|---|---|
| R10 gsd-omp-style milestone audits (`/gsd-audit-uat` + `/gsd-audit-milestone` pattern, tchivs/gsd-omp) | ported | U8; the checklist is defined in-slice at `skills/ce-work/references/milestone-audit.md` (upstream audit rigor is unverified, so nothing is trusted from the source) and grafted as a required Final Validation step in `skills/ce-work/references/shipping-workflow.md`: it audits outstanding verification items across the plan's implementation units, milestone completion against the plan's stated intent, and residual accounting. Authority boundary: it consumes the plan artifact and this sync record, judges and reports, and never edits product code, the plan, this record, or the capability-audit matrix — a checklist over artifacts, never a product-code driver. It runs only for a run executed from a plan artifact (exact skip phrase `Milestone audit: skipped (no plan artifact)`) and never inside Return-to-Caller Mode, whose done-judgment belongs to the invoking workflow. Pin: `final validation runs a milestone audit that judges artifacts, never product code` in `tests/pipeline-review-contract.test.ts` |

### Port notes (U8)

- **Source-rigor caution recorded:** the checklist is locally defined, not ported. The unit's own brief flagged upstream audit rigor as unverified; the checklist forbids inventing verification states or dispositions beyond what the plan artifact and sync record actually carry, which is what keeps an unverified source from leaking invented rigor into fork contract prose.
- **Unmet verification, recorded rather than claimed:** the unit's verification line reads "the audit fires on a real slice completion and produces a pass/gap report". No such report exists, and none was produced even though this program ran several ce-work slices after the graft landed. What is proven is that the required step exists at the final-validation seam and that its authority boundary is stated; that is existence plus placement, not a firing. Recorded as unmet.

## Sync 2026-09-14 (U9: hook-enforcement mechanisms)

- **Program items (ecosystem grafts — no upstream SHA applies):** R11. Four enforcement mechanisms ported to a single enforcement point at orchestrator-envelope emission.

| Item | Disposition | Evidence |
|---|---|---|
| R11 UNVERIFIED-never-PASS (proofpunk) + plan re-injection, SHA-256 tamper attestation, deterministic stop gate (planning-with-files) | ported | U9; enforcement lives in `skills/ce-work/scripts/envelope-gate.py` (new), invoked at envelope emission and bound by `skills/ce-work/references/return-to-caller.md`'s new `## Envelope emission gate` section, which also tightens `verification_evidence` from prose to structured gate-parseable entries (one per attempted unit; discharges via `tests_added_or_changed`, `tests_used_unchanged`, or `exception_reason`); worker-side guardrail in `references/implementation-loop.md`; orchestrator integration step in `references/execution-strategy.md`. **Enforcement is evaluated at orchestrator-envelope emission, never worker return (KTD4).** Exit code owns emission: `0 pass`, `2 block` (continuation warranted), `3 blocked_with_recovery`. Plan re-injection = the gate re-reads the plan from disk and renders its verdict against that read, so a compacted context cannot emit from memory. Tamper attestation = SHA-256 of the on-disk plan vs the recorded `source_digest` (existing envelope field; no parallel hash file), mismatch emits blocked-with-recovery with state preserved and explicit never-re-baseline wording. Stop gate = environmental failures emit blocked-with-recovery immediately; work-failure blocks carry a continuation count capped at 8 (matching the host `session_stop` cap), after which it converts to blocked-with-recovery instead of holding. Pin: `tests/ce-work-envelope-gate.test.ts` — the gate exercised as a real binary via `spawnSync`, no mocks, every mechanism with a negative case. **Scope of that pin** (corrected after independent review): it proves the gate's verdicts and exit codes, not that anything invokes the gate. No host hook calls it, so enforcement is the workflow step bound in the return contract; a run that skips the script is caught by review, not mechanically. The same review found the gate failing *open* — a `complete` envelope with `u_ids_attempted` absent passed, a fabricated unit id passed, the envelope's `plan_path` was never compared to `--plan`, `--continuations` was unvalidated, and an argparse usage error exited 2 (identical to a deliberate block). Six fail-closed fixes landed with negative tests: completion claims must name attempted units and carry evidence; attempted units must exist in the re-read plan; `plan_path` is compared to `--plan` by resolved path; `--continuations` is range-checked against the cap; usage errors exit 64; an unexpected exception emits blocked-with-recovery at 3 instead of a bare traceback. |

### Port notes (U9)

- **No live host hook was registered for the gate, and the extension needed no change for U9** (it subscribed only to `resources_discover` at the time), so sessions run in this checkout are behaviorally unaffected. U13 later added an opt-in, default-off capability to that same file; with its key unset the extension stays inert, which preserves this consequence. Rationale: the audit confirmed `session_stop` exists on omp v18.1.21 but never fires for task/subagent sessions, and in pipeline mode the ce-work orchestrator session is itself a subagent — a `session_stop` registration structurally cannot fire at the KTD4 enforcement point. Registering `context`/`session.compacting` would change every checkout session's compaction behavior with no active-plan state convention to feed it. Both decisions and their flip conditions are recorded in the U9 port record of `docs/omp-capability-audit.md`; the gate's block output is `{decision, reason}`-shaped so a future checkout-opt-in `session_stop` registration could consume its verdict verbatim.
- **Seam consequence for the step-2 gate (integration note, orchestrator):** because the return contract now names its evidence facts as gate-parsed field tokens, `tests/pipeline-review-contract.test.ts`'s `EVIDENCE_FACTS` ce-work surface forms were updated to the new tokens (`commands/results`, `exception_reason`). The fact list is unchanged and the lfg-side prose forms still match `skills/lfg/references/work-return.md`, so the seam's drift guard is intact.

## Sync 2026-09-14 (U11: name-shadowing authoring rule)

- **Program item (ecosystem graft — no upstream SHA applies):** R13. The audit-verified first-match-wins dedup rule is codified as an authoring rule.

| Item | Disposition | Evidence |
|---|---|---|
| R13 name-shadowing rule (codified in the skill-authoring standard) | ported | U11; new subsection `### Keep the name unique across sources` under `## Make activation portable` in `docs/solutions/skill-design/portable-agent-skill-authoring.md`, plus one pointer line in `AGENTS.md` (no rule-text duplication). The rule cites the audit's R3(d) probe evidence on **both** resolution paths and refuses a single global ordering claim: skills dedupe first-wins by **provider priority** (the executed shadow-`skills/ce-work/SKILL.md` probe's winner was the original `omp-plugins` fork copy, on both system-prompt metadata and `skill://` resolution), while task agents dedupe first-wins by **discovery order** on the exact case-sensitive `agent.name` — slash commands likewise first-wins. Consequence stated for authors: a same-named skill or agent silently loses on both the user-invocation and the agent-dispatch path, which is what the `ce-` prefix exists to prevent. Frontmatter `last_updated` bumped; consistency edits to the portability checklist and the compact review prompt. Verification: `tests/skill-conventions.test.ts` + `tests/repo-local-ce-skill-work.test.ts` + `tests/astra-description-triggers.test.ts` (301 pass); `validate-doc-claims.py` clean on both the canonical and the ce-compound-refresh copy |

### Port notes (U11)

- **Documentation-only graft, no new test (deliberate exception):** the acceptance criterion is rule presence plus evidence citation, which is verified by reading the file; a string test would pin incidental wording, which `tests/skill-conventions.test.ts` already covers for this tree. No plausible regression distinguishes a second test here from the existing conventions scan.
- **Checkout-local edit only:** the pointer line in `AGENTS.md` is the fork's own always-loaded file (pattern-ported in U4), not upstream text; the rule body itself lives in `docs/solutions/`, so it loads when a skill author needs it rather than on every session.

## Sync 2026-09-14 (U10: plan-verify nudge)

- **Program item (ecosystem graft — no upstream SHA applies):** R12. pstack's plan-verify nudge ported to the standalone shipping tail's completion surface.

| Item | Disposition | Evidence |
|---|---|---|
| R12 plan-verify nudge (`plan-verify`-style post-implementation reminder, pstack) | ported (workflow-step enforcement) | U10; exactly one report-only nudge added to `skills/ce-work/references/shipping-workflow.md`'s Phase 4 step 3 (Notify User), mirrored with the same suppression sentence into `skills/ce-work/references/non-code-execution.md` step 4 so the non-code standalone completion — which never loads the shipping tail — carries it too. Report-only by contract: it never gates, blocks, or alters completion state, and the tests pin that the completion gate, ship-handoff gate, and Quality Checklist stay nudge-free. Pins: `ce-work plan-verify nudge (R12)` in `tests/pipeline-review-contract.test.ts` (4 tests, 31 assertions; 70 pass for the file) |

### Port notes (U10)

- **Enforcement is the mode gate, not a hook — recorded as such.** The audit found no interactive-completion event surface: `session_stop` is main-session-only and never fires for task/subagent sessions, and in pipeline mode the ce-work orchestrator is itself a subagent, so no hook can distinguish or reach an interactive standalone completion. Per the plan's rule ("a thing that cannot be enforced is not built"), the nudge is not presented as hook-enforced. It lands as a required conditional step in the standalone shipping tail — the same enforcement class as that file's existing completion gate and U8's Milestone Audit step, i.e. a control-flow-gated workflow step pinned by the contract suite — and its structural unreachability is what keeps it standalone-only: only standalone mode reads `shipping-workflow.md` before quality checks or delivery; Return-to-Caller Mode must not enter Phase 3-4; Phase 0 recovery never enters either tail, so re-entry cannot re-fire. The audit entry records the missing host surface and its flip condition (a host event firing synchronously on interactive standalone completion would move the nudge from a workflow step to a hook).
- **Scope note:** "disable-model-invocation and userless contexts emit nothing" is carried by the step's own emit-nothing clause rather than by a host filter, because the host exposes no per-context suppression surface for a workflow step.
- **Non-code standalone completion was a reachability hole, now closed** (independent review, 2026-09-14): the trigger's first landing reached only the code tail, while a knowledge-work plan finishes in `references/non-code-execution.md` — which excludes `shipping-workflow.md` by design — so the promise "one nudge when an approved plan's implementation finishes" was false for that mode. The same report-only nudge, with the same suppression sentence, now sits at the non-code tail's step 4 and is pinned there.
- **Flip condition:** if the host ever exposes a per-context interactive-completion event, or a suppression surface a workflow step can consult, the nudge becomes host-enforceable and this record should move from workflow-step enforcement to hook enforcement. Until then the plan's "no suitable event surface → blocked-with-reason" rule is satisfied at the hook half — no hook is claimed for this unit.
- **Unmet verification, recorded rather than claimed:** the unit's verification line reads "nudge fires once on a standalone run; absent in pipeline mode". No run was made in either mode; both halves are pinned by string assertions over the two completion tails, which show the sentences exist in the right files and nowhere else, not that a run emits and suppresses them. Recorded as unmet, alongside the departure argument above.

## Sync 2026-09-14 (U13: post-compaction skill re-injection)

- **Program item (ecosystem graft — no upstream SHA applies):** R15. Ported as an opt-in, default-off extension capability; this revises this unit's earlier same-day blocked-with-reason record, whose absence claim was wrong (see the U13 port record in `docs/omp-capability-audit.md` for the correction).

| Item | Disposition | Evidence |
|---|---|---|
| R15 post-compaction skill re-injection (superpowers) | ported (opt-in, default off) | `.pi/extensions/compound-engineering.ts`: `tool_call` observes `read skill://<name>` and records the active skill durably (`pi.appendEntry`, extension-owned customType, deduped); `session.compacting` returns `{ context }` naming ONLY the active skill plus the artifact root when `docs_root` is declared. Opt-in `skill_reinject: true` via the ordinary config cascade, memoized once per session; handlers never block, rewrite, or throw. **Proven live: the recording half** — a real headless session with the extension loaded and opted in produced exactly one `dev.compound-engineering.active-skill` entry in the real session journal, 9 ms before `tool_execution_start` (pre-execution, as documented). **Proven by unit test:** handler logic (`tests/omp-compaction-reinject.test.ts`, 18 tests — key absent/explicit-false/malformed → no entry and no context; skill read → exactly one entry; compaction names only the recorded skill; hostile shapes incl. throwing `getBranch` never throw) and the off-path short-circuit. **NOT proven: no live compaction was driven, so end-to-end delivery of the re-injected `<additional-context>` line is unobserved — do not upgrade this line without driving one.** The mandatory-activation half stays unported per the 2026-09-10 eval's O01 Skip |

### Port notes (U13)

- **The earlier blocked record's absence claim was wrong, and why.** It enumerated only state-file/setting/event as the places an active-skill convention could exist and omitted extension-authored session entries — the mechanism the port uses. No probe was cited for the claim. The correction, with the four host facts that disprove it, lives in the U13 port record.
- **The opt-in path note below is now superseded by the port itself** — the extension registers `session.compacting` behind exactly that gate, and with the key absent/false it is a no-op (no appended entries, no injected context, `resources_discover` untouched). Kept for provenance: it is the difference between "we could not be bothered" and a recorded capability gap.
- **Pruning protection is not summary protection.** OMP's pre-compaction pruning never prunes `read` results of `skill://` paths, which looks like it covers this mechanism; it does not, because the summarization pass still rewrites the body out of context. Recorded so a future reader does not close this item by misreading the pruning rule.
- **Audit rows corrected (orchestrator):** the U1 audit's R12 and R15 rows asserted the ports would be hook-enforced. R12's `session_stop` cannot reach the target event and stays blocked-with-reason; R15's "hook existence is not a usable consumer" half is superseded by this port — the consumer exists and is opt-in, with firing end-to-end still unproven.

## Sync 2026-09-14 (U14: plugin-eval certification delta)

- **Program item (ecosystem graft — no upstream SHA applies):** R16. wshobson's plugin-eval certification ported as the delta over U4's harness, after enumerating what U4 already enforces.

| Item | Disposition | Evidence |
|---|---|---|
| plugin-eval certification (wshobson/agents) | grafted-as-delta | `tests/skill-eval-grade-vocabulary.test.ts` (new; the only file the unit touched). Static structural layer only: grade-vocabulary drift detection between the catalog's `Grade` contract and `gradeHost`'s consumed keys, in both directions — a typo'd scenario grade key (which bun's type stripping silently ignores, so the eval dimension passes vacuously) and a declared-but-never-consumed contract key (which a future scenario author would set believing it grades). Both run as an ordinary `bun run test` target — not a `make garden` port, no package.json script — because drifting entry points are what make a gate untrustworthy. 8 tests pass; 73 pass across the file plus the three enumerated suites it is defined against. LLM-judge scoring and reliability simulation are eval evidence (R16), not merge gates: no model output gates a merge in what was added |

### Port notes (U14)

- **The enumeration is the unit's substance.** Coverage already enforced elsewhere — description-shape pins and always-on pins (`tests/skills/astra-description-triggers.test.ts`), scenario integrity and baseline-ref validity (`tests/skill-eval-cell/catalog.test.ts`), grader behavior on well-formed grades (`tests/skill-eval-cell/grade.test.ts`), frontmatter/prefix/reference-integrity/platform-fallback (`tests/skill-conventions.test.ts`, `tests/skill-agent-ce-prefix.test.ts`), byte budgets (`tests/codex-skill-prompt-budget.test.ts`) — so the delta is one check pair, not a new suite surface. Recorded because the unit's acceptance is "add only what is uncovered".
- **The uncovered hole is a real one, and it is the type-stripping hole:** CI runs `bun run test` and nothing typechecks (no `tsc` step, no `typecheck` script), so a declared-decision key misspelled in a scenario silently disappears from grading while the catalog appears to require it. That is a silent-pass, the one failure shape this program treats as worse than a red test.
- **Deliberate scope choice:** the fail paths are proven by the repo's established synthetic-mutation pattern rather than by editing `catalog.ts`/`grade.ts`, which sit outside the unit's declared file set.

## Sync 2026-09-14 (U12: converge gate in ce-work)

- **Program item (ecosystem graft — no upstream SHA applies):** R14. spec-kit's converge gate ported into ce-work's implementation loop.

| Item | Disposition | Evidence |
|---|---|---|
| R14 spec-kit converge gate (`github/spec-kit`, `/speckit-implement` + `/speckit-converge`) | ported | U12; the gate is section 9 **Convergence Gate** in `skills/ce-work/references/implementation-loop.md` (pure insertion — no existing line touched). After the last task completes, convergence against the plan (Product Contract / Implementation Units / Verification Contract / Definition of Done), the task list, and — when the project carries one — a per-project `constitution.md` is judged by a fresh-context worker with no implementation-unit transcript: never the implementing context, never `ce-verify` (read-only drive-infrastructure owner, never QA judgment). Named gaps append as new tasks only inside the plan's Scope Boundaries; an out-of-scope gap stops `blocked` for re-planning rather than being silently appended or folded into an in-scope task, so no scope-creep commit can land. The cycle is bounded by default at 3 cycles, matching the shipping tail's bounded-repair precedent, and a budget stop emits `blocked` with a recovery path naming remaining gaps — never an infinite hold, never silently dropped gaps. Standalone it runs before the Phase 3-4 transition; in Return-to-Caller Mode it lives inside per-unit fix-before-next with outer re-dispatch owned by the caller. Pins: `ce-work convergence gate (R14)` in `tests/skills/ce-work-outcome-spine.test.ts` (8 tests — the original prose pins plus three added by the 2026-09-14 review round, each mutation-proven: deleting the condition it pins fails that test and nothing else) |

### Port notes (U12)

- **No audit entry owed, and that is a finding rather than an omission:** R14 is not hook-gated — the fresh-context check dispatches through the native dispatch path ce-work already owns (`execution-strategy.md`), so no missing host surface foreclosed it and no blocked-with-reason record is due. The mechanism table covers the hook-dependent items (R9/R11/R12/R13/R15).
- **Constitution artifact: consumed, so it ships.** Named consumer is the converge check; convention is `constitution.md` at the project root with absence treated as normal. Recorded because the plan's rule is that an unconsumed artifact must be deferred, not shipped.
- **Unmet verification, recorded rather than claimed** (independent review, 2026-09-14): this unit's plan verification was "the gate demonstrably terminates on both converging and non-converging inputs", and **no executable demonstration of that exists**. The gate is agent judgment, not code the repo runs: there is no loop implementation, no machine-readable verdict, and no boundary between converging and non-converging input to drive mechanically, so a test would have to assert a model of the loop rather than the gate. The falsifiable surface at this layer is exact-phrase pins, which is what the 8 pins are. Raising this to an executable property means moving the gate into a script (the layer that owns deterministic enforcement, as `envelope-gate.py` does), which is a layer reassignment rather than a test. Recorded as an honest gap in the unit's verification, not as a satisfied criterion.
- **`return-to-caller.md` deliberately not edited.** Its conditional Files entry was not triggered: the envelope contract already carries `status: blocked` / `blockers` / `recovery_path`, and U9's committed `## Envelope emission gate` stays the sole emission authority. Section 9 references it rather than restating it, so the two commits cannot contradict each other.

## Sync 2026-09-14 (U15: taskstoissues bridge)

- **Program item (ecosystem graft — no upstream SHA applies):** R17. spec-kit's taskstoissues bridge ported as a ce-plan-adjacent handoff.

| Item | Disposition | Evidence |
|---|---|---|
| spec-kit taskstoissues (plan units → tracker issues) | ported | U15; the bridge is `skills/ce-plan/references/issue-fanout.md` with one load-requiring clause in `SKILL.md`'s Phase-5 STOP paragraph. Fan-out is additive and opt-in only — the one-plan-issue default is preserved; per-unit fan-out loads the reference only on explicit selection or explicit standing authority, and a generic "create issues" is not authority. The gate requires a reachable tracker interface **and** a write-approval posture (a documented agent-created-issue convention or explicit in-session authorization); API existence alone never unlocks writes, and an absent posture declines with a reason and a flip condition. Idempotence: dedup identity is plan path + U-ID, carried as a `Source plan: <path> · Unit: <U-ID>` metadata line with a `<U-ID>: <title>` title; search-before-create means no match creates, an open match updates in place, a closed match is skipped — a rerun produces zero new issues. The reference is a handoff step: no scripts, no config, no credentials. Pins: `ce-plan issue fan-out bridge (U15)` in `tests/skills/ce-plan-handoff-routing.test.ts` (7 new) |

### Port notes (U15)

- **Budget-funded insertion, and the funding is disclosed.** `SKILL.md` sat at the Codex 8000-byte bound (CRLF-adjusted), so the load-requiring clause was paid for by trimming two unpinned sentences. One was a duplicate: "and grammar sketches" survives in `references/structure.md`, `references/deepening-workflow.md`, and `references/intake.md`. The other has no remaining home and is a real, if small, content loss: "Resolve technical choices from evidence; leave adequate instructions unchanged" was removed; its evidence-first half is covered by `references/intake.md`'s "Research before structuring", and nothing now covers "leave adequate instructions unchanged". Recorded so the loss is a decision on the books rather than an invisible side effect. Post-trim size is 7988/8000 and ce-plan stays off `OVER_BUDGET`.
- **Scope honesty:** the bridge extends the existing Create Issue handoff instead of adding a tracker client — detection follows the `plan-handoff.md`/`tracker-defer.md` precedent, and the write path stays gated on approval posture rather than on API reachability.
- **Flagged as the program's thinnest slice** (with U14): the mechanism can only matter on a tracker-equipped repo with a documented write posture, so on this repo it ships as a gated handoff whose decline path is the expected landing in most projects.
- **Unmet verification, recorded rather than claimed:** the unit's verification line reads "bridge produces issues on a tracker-equipped repo, or deferred-with-reason is recorded". Neither disjunct was met here: this repo is tracker-equipped but no issue was produced (no write posture was asserted, and none should be invented), and the unit was not deferred because the bridge is implemented. What is proven is that the fan-out reference and its load-requiring clause exist and that the write gate is conditional on a posture the session must supply. Recorded as unmet rather than satisfied by either branch of the alternative.

## Program process gaps (2026-09-14)

The pipeline steps that did not fully run on this program, recorded so the holes are visible rather than inferred from silence.

- **`ce-test-browser` — skipped; no surface.** This branch changes skill prose, bundled scripts, tests, and docs. It ships no web UI, so the pipeline's browser stage has nothing to drive. The changed artifacts are covered by `bun run test` (2887 pass, 1 skip, 0 fail at `8388d558`); no browser evidence was withheld by the skip.
- **`ce-simplify-code` — ran; one findings class left unverified.** The pass ran over the branch diff with its three read-only personas, and its findings were applied by a follow-up dispatch. Its P1 (a regex alternation that admitted the polarity inversion of the R9 honesty pin) is fixed at `tests/pipeline-review-contract.test.ts:1424`, which now asserts the unambiguous negative form instead. Its two P2 findings are moot at HEAD — neither the dead `hasLegacyReadiness` variable nor the fixture-driven `classifyPlan` tests exist anywhere under `tests/` after the `artifact_readiness` refactor. The seven advisory P3 findings were not individually re-verified; recorded rather than claimed as applied.
