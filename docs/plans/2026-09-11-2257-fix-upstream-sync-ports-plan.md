---
title: Upstream Sync Record and Fix Ports - Plan
type: fix
date: 2026-09-11
artifact_contract: ce-unified-plan/v1
artifact_readiness: implementation-ready
product_contract_source: ce-plan-bootstrap
execution: code
---

# Upstream Sync Record and Fix Ports - Plan

**What you're getting** — a tracked `docs/upstream-sync.md` that pins the fork's upstream base and records a per-commit disposition, plus ports of the eight upstream fix commits that apply to this fork's OMP-only surface.

**What I assumed** — new upstream features (Compound Packs, `ce-bakeoff`, `ce-noslop`) are recorded as pending decision, not ported; the two mass prose restatements and the docs-site work are skipped; the sync record lives at `docs/upstream-sync.md` as a running log rather than a `docs/solutions/` entry, with a pointer added to `AGENTS.md` so future sessions find it.

**What could go wrong** — manual-merge ports land on files the fork already rewrote for OMP; a hunk applied against drifted context could silently change adapted behavior. Mitigation: each port is verified against our tree, the contract tests that pin those files, and a per-file diff review confirming remaining differences are intentional OMP adaptations.

**Next** — `ce-work` executes the units below.

## Goal Capsule

- **Objective:** a future upstream sync starts from a recorded anchor and a disposition table instead of re-deriving the merge-base, and the fork carries the upstream fixes that apply to its surface.
- **Means:** file-granular ports of selected upstream commits plus a running sync log (KTD1, KTD2).
- **Authority:** this plan; repo `AGENTS.md`; `docs/solutions/skill-design/portable-agent-skill-authoring.md` for every ported prose change.
- **Stop conditions:** a port hunk that cannot be reconciled with fork-adapted content without changing fork behavior; any test failure not attributable to the port.
- **Execution profile:** U1–U3 independent; U4–U7 serialize through `tests/skill-eval-cell/catalog.ts` (contended by four upstream commits); U8 last.
- **Tail ownership:** sync record written last so its disposition table reflects actual outcomes — and it is still written if a port aborts (KTD5).

## Product Contract

### Summary

The fork tracks `EveryInc/compound-engineering-plugin` but has no recorded sync anchor; the last check required recomputing the merge-base and re-triaging every commit. This change creates a durable sync record and ports the upstream fixes that apply to the fork's OMP-only surface.

### Problem Frame

Upstream moved 17 commits (438 files) since the fork's base commit `8df67793` (2026-09-08). Without a recorded anchor and per-commit dispositions, each future sync repeats the same triage. Several upstream commits fix real defects in files the fork carries unchanged or lightly adapted; leaving them unported means re-fixing known bugs.

### Requirements

**Sync record**

- R1. A tracked document records the upstream repository URL, the pinned merge-base commit SHA, the upstream HEAD SHA at last check, the check date, and a per-commit disposition for every commit in the checked range.
- R2. The document states the sync procedure: fetch upstream by URL (no persistent `upstream` remote), compute the merge-base, and classify each new commit into the recorded disposition vocabulary.
- R3. Dispositions use a fixed vocabulary: `ported`, `partial`, `skipped`, `pending-decision`, `n/a-fork` — each with a one-line reason.
- R4. The document records why the `upstream` remote is absent (gh remote-order targeting incident) and the `gh -R` rule for any GitHub CLI use.

**Ports**

- R5. Port `f831db7c` (ce-optimize: reject incomplete paired baselines) — clean apply, both files identical to base.
- R6. Port `6a00e35c` (ce-commit-push-pr: preserve ignored files during branch switches) — skill files clean; the `tests/commit-push-pr-contract.test.ts` hunk needs manual rebase onto drifted test context; the new `tests/commit-push-pr-worktree-safety.test.ts` creates cleanly.
- R7. Port `b3efbd6c` then `ae6226f5` as an ordered pair (ce-code-review/ce-doc-review: release collected agents before follow-on work; collect reviewers by attributable terminal outcome) — the eight touched skill files drifted; manual merge preserving OMP adaptations.
- R8. Port `b36047e1` (ce-babysit-pr: sustain monitoring after PR handoff) — `tick.md` hunk applies cleanly; `SKILL.md`, `setup.md`, `watch-loop.md`, `catalog.ts`, and the ce-commit-push-pr handoff files need manual merge.
- R9. Port `bec6b419` (ce-explain/ce-pov: support calling workflows) — largest port; seven reference files identical, the rest drifted; three new eval fixtures create cleanly. Upstream typed it `fix:` but it adds a capability — treat as feature-shaped when judging how much to port.
- R10. Port `390b0138` (ce-optimize: progress updates focus on useful findings) — five files identical; `docs/guides/ce-optimize.md`, `loop.md`, and `catalog.ts` need manual merge.
- R11. Port the applicable subset of `16c2b972` (review-noise reduction and agent-communication clarity) — `.agents/skills/ce-skill-work/SKILL.md` hunk applies cleanly; port only hunks whose target files exist and are not fork-adapted away; skip ce-noslop-coupled content.
- R12. Every ported prose change conforms to `docs/solutions/skill-design/portable-agent-skill-authoring.md`: no `$ARGUMENTS` tokens, no multi-host tool names without capability fallback, bundled-script invocations keep the model-filled `SKILL_DIR` anchor convention.

### Scope Boundaries

**Deferred to Follow-Up Work**

- Compound Packs (#1549), `ce-bakeoff` (#1652), `ce-noslop` (#1653) — recorded as `pending-decision` in the sync record; adoption is a separate user decision.
- `fe74844c` (#1655, drop experimental labeling from ce-bakeoff) — `pending-decision` grouped with #1652; it presupposes adopting ce-bakeoff.
- Mass prose restatements `1a9f16c4` (#1671) and `c4a643b1` (#1681) — recorded as `skipped`; they conflict wholesale with OMP-adapted prose. Revisit only if upstream style becomes canonical. Note for the sync record: ported files land at their pre-restatement upstream state, so adopting the restatements later requires re-checking the ported files against upstream HEAD.
- Docs-site commits `235252fa`, `2783b8e3` — `n/a-fork`; the fork has no `site/` surface.
- `9ac32720` (#1634, CROSS_MODEL_EFFORT_OVERRIDE) — `n/a-fork`; the fork deleted `skills/ce-work/scripts/cross-model-work.sh`.

## Planning Contract

### Key Technical Decisions

- KTD1. **File-granular ports, not cherry-picks.** Every port except `f831db7c` fails `git apply --check` on at least one file because the fork drifted. Ports apply per-file (or per-hunk) against our tree, preserving OMP adaptations; commit messages cite the upstream SHA they port. Chosen over whole-commit cherry-pick, which would drag in multi-host content the fork deleted.
- KTD2. **Sync record at `docs/upstream-sync.md`.** A running log with a fixed disposition vocabulary and the fetch-by-URL procedure. Chosen over a `docs/solutions/` entry (those are per-problem learnings, not running state) and over `DECISIONS.md` (append-only, no table shape). Modeled on the `docs/specs/omp.md` Last-verified/Primary-sources pattern.
- KTD3. **Ordered pair for the review-agent lifecycle.** `b3efbd6c` lands before `ae6226f5` upstream and both rewrite `dispatch-reviewers.md`; port in that order or as one unit.
- KTD4. **`catalog.ts` serialized.** Four commits touch `tests/skill-eval-cell/catalog.ts` (`b36047e1`, `bec6b419`, `390b0138`, `16c2b972`); each port updates it in unit order rather than attempting upstream's final state. The `16c2b972` hunk imports `calibration-scenarios.ts`, a module the fork lacks — that import and its scenario entries are skipped, not ported.
- KTD5. **Sync record written last, but never dropped.** Its disposition table records actual port outcomes; if a port unit aborts, the record is still written with that unit's commits marked `skipped — port aborted` so the next sync does not re-triage.

### Assumptions

- Upstream fetch stays URL-based (`git fetch https://github.com/EveryInc/compound-engineering-plugin main`); no persistent remote is re-added.
- Contract tests that pin ported files are updated in the same unit when a port changes pinned content.

## Implementation Units

### U1. Port ce-optimize paired-baseline rejection

**Goal:** `decide.mjs` rejects incomplete paired baselines, matching upstream `f831db7c`.
**Requirements:** R5
**Dependencies:** none
**Files:** `skills/ce-optimize/scripts/decide.mjs`, `tests/skills/ce-optimize-decide.test.ts`
**Approach:** apply the upstream single-commit patch directly; both files are identical to upstream base.
**Test scenarios:**
- Paired-baseline input missing one side is rejected with the upstream error path.
- Complete paired baselines still pass.
**Verification:** `bun test tests/skills/ce-optimize-decide.test.ts` passes.

### U2. Port ce-commit-push-pr ignored-file preservation

**Goal:** branch switches preserve ignored files, matching upstream `6a00e35c`.
**Requirements:** R6
**Dependencies:** none
**Files:** `skills/ce-commit-push-pr/references/branch-creation.md`, `skills/ce-commit-push-pr/references/stack-submit.md`, `tests/commit-push-pr-contract.test.ts`, `tests/commit-push-pr-worktree-safety.test.ts` (new)
**Approach:** apply the two skill-file hunks and the new test file cleanly; rebase the `commit-push-pr-contract.test.ts` hunk onto our drifted test by hand — locate the corresponding assertion region and apply the same contract change.
**Test scenarios:**
- New worktree-safety test passes against the ported skill prose.
- Existing contract test still passes with the rebased hunk.
**Verification:** `bun test tests/commit-push-pr-contract.test.ts tests/commit-push-pr-worktree-safety.test.ts` passes.

### U3. Port review-agent lifecycle pair

**Goal:** collected review agents are released before follow-on work, and reviewers are collected by attributable terminal outcome — upstream `b3efbd6c` then `ae6226f5`.
**Requirements:** R7
**Dependencies:** none
**Files:** `skills/ce-code-review/SKILL.md`, `skills/ce-code-review/references/dispatch-reviewers.md`, `skills/ce-code-review/references/finish-review.md`, `skills/ce-doc-review/SKILL.md`, `skills/ce-doc-review/references/cross-model-review.md`, `skills/ce-doc-review/references/dispatch.md`, `skills/ce-plan/references/plan-handoff.md`, `skills/ce-simplify-code/SKILL.md`, `docs/guides/ce-code-review.md`, `docs/guides/ce-doc-review.md`, `docs/guides/ce-simplify-code.md`, `docs/solutions/skill-design/anti-poll-scope-and-async-subagent-dispatch.md`, `tests/review-skill-contract.test.ts`, `tests/pipeline-review-contract.test.ts`
**Approach:** merge `b3efbd6c` first, then `ae6226f5`, hunk by hunk. Our `cross-model-review.md` files are OMP-only (host task dispatch, no shell workers) — port the *condition* (release before follow-on; attributable terminal outcome) into the OMP mechanism, not upstream's CLI prose. Update `review-skill-contract.test.ts` and `pipeline-review-contract.test.ts` pins where ported content changes them.
**Test scenarios:**
- Contract tests pass with updated pins.
- Ported references state the release-before-follow-on and terminal-outcome conditions in OMP terms.
**Verification:** `bun test tests/review-skill-contract.test.ts tests/pipeline-review-contract.test.ts` passes.

### U4. Port ce-babysit-pr handoff monitoring

**Goal:** monitoring sustains after PR handoff, matching upstream `b36047e1`.
**Requirements:** R8
**Dependencies:** U2 (shares the ce-commit-push-pr files and `tests/commit-push-pr-contract.test.ts`); head of the `catalog.ts` serialization chain U4→U5→U6→U7
**Files:** `skills/ce-babysit-pr/SKILL.md`, `skills/ce-babysit-pr/references/setup.md`, `skills/ce-babysit-pr/references/tick.md`, `skills/ce-babysit-pr/references/watch-loop.md`, `skills/ce-commit-push-pr/SKILL.md`, `skills/ce-commit-push-pr/references/apply-and-handoff.md`, `docs/guides/ce-babysit-pr.md`, `docs/guides/ce-commit-push-pr.md`, `tests/ce-babysit-pr-contract.test.ts`, `tests/commit-push-pr-contract.test.ts`, `tests/skill-eval-cell/catalog.ts`, `tests/skills/user-facing-skill-invocation-rendering.test.ts`
**Approach:** `tick.md` applies cleanly; merge the rest by hand. `watch-loop.md` is OMP-adapted (background-and-wake table, `/skill:` resume) — port the sustain-monitoring condition into that mechanism. The `catalog.ts` hunks describe upstream's exec_command-shaped scenarios; translate them to the fork's OMP scenario shape rather than copying cells verbatim.
**Test scenarios:**
- babysit-pr and commit-push-pr contract tests pass.
- `catalog.ts` reflects the ported scenario changes only.
**Verification:** `bun test tests/ce-babysit-pr-contract.test.ts tests/commit-push-pr-contract.test.ts tests/skills/user-facing-skill-invocation-rendering.test.ts` passes.

### U5. Port ce-explain/ce-pov calling-workflow support

**Goal:** explain and pov can be called from inside other workflows, matching upstream `bec6b419`.
**Requirements:** R9
**Dependencies:** U4 (shares `catalog.ts`)
**Files:** `skills/ce-explain/SKILL.md`, `skills/ce-explain/references/{check-in,destinations,explainer-html,explainer-markdown,intake,orchestration}.md`, `skills/ce-pov/SKILL.md`, `skills/ce-pov/references/{boundaries,cross-model-panel,followup,intake,invocation,method,report}.md`, `skills/ce-brainstorm/references/dialogue.md`, `skills/ce-plan/references/research.md`, `README.md`, `docs/guides/{README,ce-brainstorm,ce-explain,ce-plan,ce-pov}.md`, `tests/skills/ce-explain-routing.test.ts`, `tests/skills/ce-explain-relocated-invariants.test.ts`, `tests/skills/user-facing-skill-invocation-rendering.test.ts`, `tests/pov-skill-contract.test.ts`, `tests/skill-eval-cell/catalog.ts`, `tests/skill-eval-cell/fixtures/understanding-queue/` (3 new files)
**Approach:** apply the seven identical reference files cleanly; hand-merge SKILL.md files and drifted references. Keep OMP invocation rendering (`/skill:` for hidden skills) where upstream prose assumes other hosts.
**Test scenarios:**
- explain routing and pov contract tests pass with updated pins.
- New understanding-queue fixtures are consumed by the ported catalog entries.
**Verification:** `bun test tests/skills/ce-explain-routing.test.ts tests/skills/ce-explain-relocated-invariants.test.ts tests/pov-skill-contract.test.ts` passes.

### U6. Port ce-optimize progress-update focus

**Goal:** progress updates report useful findings only, matching upstream `390b0138`.
**Requirements:** R10
**Dependencies:** U5 (shares `catalog.ts`)
**Files:** `skills/ce-optimize/SKILL.md`, `skills/ce-optimize/references/{loop,measurement,spec}.md`, `docs/guides/ce-optimize.md`, `docs/solutions/skill-design/portable-agent-skill-authoring.md`, `tests/skills/ce-optimize-decide.test.ts`, `tests/skill-eval-cell/catalog.ts`
**Approach:** five files identical — apply cleanly; hand-merge `ce-optimize.md` guide, `loop.md`, `catalog.ts`. Note: this unit edits `docs/solutions/skill-design/portable-agent-skill-authoring.md`, the same document R12 names as the porting authority — apply the upstream hunk verbatim (the file is identical to base) and do not reinterpret it.
**Test scenarios:**
- ce-optimize decide tests pass.
**Verification:** `bun test tests/skills/ce-optimize-decide.test.ts` passes.

### U7. Port review-noise reduction subset

**Goal:** the applicable parts of upstream `16c2b972` land — review-noise reduction and agent-communication clarity — without dragging in ce-noslop coupling.
**Requirements:** R11, R12
**Dependencies:** U3, U6 (shares `catalog.ts`; also re-checks files U3 hand-merged — its identical/drifted classification was computed pre-U3)
**Files:** `.agents/skills/ce-skill-work/SKILL.md` (clean hunk); the enumerated candidate list produced at execution start by intersecting `git show 16c2b972 --name-only` with the fork tree (~25 identical, ~24 drifted, ~53 missing upstream); every contract test a ported hunk touches, named in the commit.
**Approach:** apply the clean `.agents/` hunk; enumerate the candidate file list first, then port only hunks whose target exists and is not fork-adapted. Skip hunks referencing `ce-noslop`, absent fixtures, or the `calibration-scenarios.ts` module the catalog hunk imports. Record each skipped file's reason for the U8 disposition table.
**Test scenarios:**
- ce-skill-work contract and each touched review contract test pass.
- No ported hunk references `ce-noslop`, missing fixtures, or `calibration-scenarios.ts`.
**Verification:** `bun test` on touched contract tests passes; grep confirms no `ce-noslop` or `calibration-scenarios` references added.

### U8. Write the upstream sync record

**Goal:** `docs/upstream-sync.md` exists with the anchor, procedure, and full disposition table.
**Requirements:** R1, R2, R3, R4
**Dependencies:** U1–U7 (records actual outcomes)
**Files:** `docs/upstream-sync.md`, `AGENTS.md`
**Approach:** running log — header (upstream URL, base SHA `8df67793b9733d2220fa9a7fc37139931471af62`, upstream HEAD `c4a643b1e4b87507782293367e7f3110daceea16`, check date 2026-09-11), the fetch-by-URL procedure, the `gh -R` rule and why the remote is absent, the disposition vocabulary, and the per-commit table for all 17 commits in the range (including `fe74844c` as `pending-decision`). Each row carries file+line or commit evidence and the verification date, per `docs/solutions/conventions/verify-externally-attributed-constraints-at-the-source.md`. Add a one-line pointer in `AGENTS.md` (Repository Docs Convention section) so future sessions find the record. If earlier units aborted, still write this file with those commits marked `skipped — port aborted`.
**Test expectation:** none — documentation artifact; correctness is the table matching the recorded port outcomes.
**Verification:** every commit in `8df67793..c4a643b1` appears exactly once with a disposition from the fixed vocabulary.

## Verification Contract

- Per-unit: the test commands named in each unit's Verification field.
- Whole change: `bun run test` passes with no new failures versus the pre-port baseline.
- Port fidelity: `git diff` on each ported file shows the upstream change present and OMP adaptations intact (spot-check the drifted files: `cross-model-review.md`, `watch-loop.md`, `dispatch-reviewers.md`); for each manual-merge file, diff the ported result against the upstream version and confirm every remaining delta is an intentional OMP adaptation, not lost fix content.
- Sync record: all 17 commits in `8df67793..c4a643b1` carry a disposition; `pending-decision` items name their adoption question.

## Definition of Done

- All units landed; `bun run test` green.
- `docs/upstream-sync.md` committed with the full 17-row disposition table, and the `AGENTS.md` pointer present.
- No `$ARGUMENTS`, no multi-host-only tool references, and no `ce-noslop`/`ce-bakeoff`/Packs content introduced by ported hunks.
- No scratch or throwaway files left in the diff.
