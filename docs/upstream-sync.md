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

## Sync 2026-09-14 (U8: milestone audits in ce-work final validation)

- **Program item (ecosystem graft — no upstream SHA applies):** R10. ce-work's final-validation seam gains a cross-phase milestone audit.

| Item | Disposition | Evidence |
|---|---|---|
| R10 gsd-omp-style milestone audits (`/gsd-audit-uat` + `/gsd-audit-milestone` pattern, tchivs/gsd-omp) | ported | U8; the checklist is defined in-slice at `skills/ce-work/references/milestone-audit.md` (upstream audit rigor is unverified, so nothing is trusted from the source) and grafted as a required Final Validation step in `skills/ce-work/references/shipping-workflow.md`: it audits outstanding verification items across the plan's implementation units, milestone completion against the plan's stated intent, and residual accounting. Authority boundary: it consumes the plan artifact and this sync record, judges and reports, and never edits product code, the plan, this record, or the capability-audit matrix — a checklist over artifacts, never a product-code driver. It runs only for a run executed from a plan artifact (exact skip phrase `Milestone audit: skipped (no plan artifact)`) and never inside Return-to-Caller Mode, whose done-judgment belongs to the invoking workflow. Pin: `final validation runs a milestone audit that judges artifacts, never product code` in `tests/pipeline-review-contract.test.ts` |

### Port notes (U8)

- **Source-rigor caution recorded:** the checklist is locally defined, not ported. The unit's own brief flagged upstream audit rigor as unverified; the checklist forbids inventing verification states or dispositions beyond what the plan artifact and sync record actually carry, which is what keeps an unverified source from leaking invented rigor into fork contract prose.

## Sync 2026-09-14 (U9: hook-enforcement mechanisms)

- **Program items (ecosystem grafts — no upstream SHA applies):** R11. Four enforcement mechanisms ported to a single enforcement point at orchestrator-envelope emission.

| Item | Disposition | Evidence |
|---|---|---|
| R11 UNVERIFIED-never-PASS (proofpunk) + plan re-injection, SHA-256 tamper attestation, deterministic stop gate (planning-with-files) | ported | U9; enforcement lives in `skills/ce-work/scripts/envelope-gate.py` (new), invoked at envelope emission and bound by `skills/ce-work/references/return-to-caller.md`'s new `## Envelope emission gate` section, which also tightens `verification_evidence` from prose to structured gate-parseable entries (one per attempted unit; discharges via `tests_added_or_changed`, `tests_used_unchanged`, or `exception_reason`); worker-side guardrail in `references/implementation-loop.md`; orchestrator integration step in `references/execution-strategy.md`. **Enforcement is evaluated at orchestrator-envelope emission, never worker return (KTD4).** Exit code owns emission: `0 pass`, `2 block` (continuation warranted), `3 blocked_with_recovery`. Plan re-injection = the gate re-reads the plan from disk and renders its verdict against that read, so a compacted context cannot emit from memory. Tamper attestation = SHA-256 of the on-disk plan vs the recorded `source_digest` (existing envelope field; no parallel hash file), mismatch emits blocked-with-recovery with state preserved and explicit never-re-baseline wording. Stop gate = environmental failures emit blocked-with-recovery immediately; work-failure blocks carry a continuation count capped at 8 (matching the host `session_stop` cap), after which it converts to blocked-with-recovery instead of holding. Pin: `tests/ce-work-envelope-gate.test.ts` (10 scenarios, failing-then-passing per mechanism, gate exercised as a real binary via `spawnSync` — no mocks) |

### Port notes (U9)

- **No live host hook was registered; `.pi/extensions/compound-engineering.ts` is unchanged** (still the inert `resources_discover` subscription), so sessions run in this checkout are behaviorally unaffected. Rationale: the audit confirmed `session_stop` exists on omp v18.1.21 but never fires for task/subagent sessions, and in pipeline mode the ce-work orchestrator session is itself a subagent — a `session_stop` registration structurally cannot fire at the KTD4 enforcement point. Registering `context`/`session.compacting` would change every checkout session's compaction behavior with no active-plan state convention to feed it. Both decisions and their flip conditions are recorded in the U9 port record of `docs/omp-capability-audit.md`; the gate's block output is `{decision, reason}`-shaped so a future checkout-opt-in `session_stop` registration could consume its verdict verbatim.
- **Seam consequence for the step-2 gate (integration note, orchestrator):** because the return contract now names its evidence facts as gate-parsed field tokens, `tests/pipeline-review-contract.test.ts`'s `EVIDENCE_FACTS` ce-work surface forms were updated to the new tokens (`commands/results`, `exception_reason`). The fact list is unchanged and the lfg-side prose forms still match `skills/lfg/references/work-return.md`, so the seam's drift guard is intact.
