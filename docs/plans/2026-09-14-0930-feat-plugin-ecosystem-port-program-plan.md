---
title: Plugin-ecosystem port program - Plan
type: feat
date: 2026-09-14
artifact_contract: ce-unified-plan/v1
artifact_readiness: implementation-ready
product_contract_source: ce-brainstorm
execution: code
---

# Plugin-ecosystem port program - Plan

**What you're getting:** an execution-ready program — 15 units across 4 tiers that port upstream's unlanded work and graft the verified ecosystem mechanisms into this fork's skills.
**What I assumed:** upstream fetched by URL per slice; each slice executes as one `ce-work` run; a mechanism whose host capability is missing gets a ledger entry, not a prose approximation. Interactive default is one PR per slice; a directed `lfg` run (this session's execution mode) ships one PR of separable per-slice commits.
**What could go wrong:** the Slice-0 audit may find OMP lacks the hook surface half of Tiers 2-3 need — those items then land as blocked-with-reason records, not features; and the `artifact_readiness` migration touches ~37 files, the largest single-slice blast radius in the program.
**Next:** `lfg` for the directed autonomous pipeline (this session's mode), or `ce-work` on U1 (the capability audit) for interactive per-slice execution.

## Goal Capsule

**Objective:** The fork carries the verified improvements the 2026-09-14 ecosystem research found — upstream's unported work, the integrable OMP-ecosystem mechanisms, and the portable cross-harness mechanisms — each landed as an ordered, reviewable slice.

**Product authority:** The user, via this brainstorm's settled decisions; the research report (`docs/plans/` companion evidence, session artifact `local://report.md`) supplies the verified claim set; STRATEGY.md bounds what may be ported.

**Open blockers:** None for writing this plan. Slice-level unknowns (OMP hook surface, per-spawn model field, prior-sync deferral intent) are carried as requirements to verify, not assumed.
**Means:** Tier-sequential port program with same-file bundling (Product Contract Key Decisions; KTD1).

**Execution profile:** Interactive planning. Interactive execution runs each slice as one `ce-work` invocation over that slice's U-ID packet plus the shared contract excerpts it names — one PR per slice. A directed `lfg` run (this session's mode) executes the whole program in one pipeline and ships one PR of separable per-slice commits — reviewability is preserved at commit granularity plus the sync record, not at PR granularity.

**Stop conditions:** an audit finding that forecloses a mechanism resolves to blocked-with-reason, never approximation; evidence invalidating a session-settled decision stops the slice and surfaces.

**Tail ownership:** each slice's executor owns its sync-record update and its commit (interactive) or its commit inside the program PR (`lfg`); the program-level residual is the ledger itself.

## Product Contract

### Summary

A single porting program that turns the verified research report into ordered slices: an OMP capability audit first, then upstream catch-up (the ce-code-review hardening cluster, Compound Packs, ce-bakeoff, ce-noslop, and the hygiene sweep), then OMP-ecosystem grafts, then cross-harness mechanisms — with ecosystem or cross-harness grafts that touch the same files bundled into the upstream slice they modify.

### Problem Frame

The research found that the highest-fit improvements are not exotic plugins but upstream CE work this fork never ported — the fork sits at 3.24.1-omp.13 while upstream released 3.25.0 on 2026-09-12 with a multi-commit ce-code-review hardening cluster, Compound Packs, two new skills, and test/CI fixes. Beyond catch-up, the report identified ecosystem mechanisms (consensus dedup, fresh-verifier gates, milestone audits, hook-enforced verification) and cross-harness mechanisms (converge gates, plan re-injection, tamper attestation) that fill real gaps. Without a program, these land ad hoc or not at all, and same-file collisions between upstream ports and ecosystem grafts produce double edits.

### Key Decisions

- **Tier-sequential ordering with same-file bundling** (session-settled: user-directed — chosen over capability-grouped and two-lane structures: upstream's tested reference lands clean and lowest-risk first; grafts that touch the same files ride inside that slice rather than re-editing later). Governs R1, R2.
- **Upstream skills exempt from the no-new-skill rule** (session-settled: user-directed — the 2026-09-10 eval's "skill count stays 37" rule was written for external-plugin grafts; ce-bakeoff and ce-noslop are upstream-maintained CE skills, so adopting them is catch-up. Ecosystem and cross-harness items still graft into incumbents only). Governs R6.
- **Hook-level items gated on an audit spike** (session-settled: user-directed — enforcement ports land only where OMP's hook surface supports them; missing hooks get documented as blocked, not approximated as skill text). Governs R3, R9, R11, R12, R15.
- **Curated, not literal, coverage** (session-settled: user-directed — all three tiers are in scope (plus the Slice 0 capability audit), but items the report flagged as duplicates, vendor-bound, or ceiling-blocked are decided per-item inside the plan rather than ported unconditionally; per-item decisions weigh maintenance surface and demand evidence, not just fit). Governs R10.

### Requirements

**Program structure**

- **R1.** The program is one plan with ordered slices. Slices land in this order: capability audit → upstream catch-up → OMP-ecosystem grafts → cross-harness mechanisms. Each slice is independently shippable and verifiable.
- **R2.** When an ecosystem or cross-harness graft provably modifies files an upstream port also modifies, the graft bundles into that upstream slice; no file is edited twice across slices for overlapping content. Known bundle: quorum-review consensus dedup + refutation (R21) into the ce-code-review cluster slice (R4) — both touch `skills/ce-code-review/scripts/findings-mechanics.py` and `references/finish-review.md`. Bundled grafts land as separable commits inside the host slice; a graft whose host slice is blocked is itself blocked-with-same-reason unless re-homed. When a same-file overlap is discovered only after the upstream slice landed, the graft lands in its own later slice and the double-edit exception is recorded in that graft's sync-record disposition. Planned iterative re-edits of a shared file in disjoint sections (e.g., U4's description sweep then U7's gate section in `skills/lfg/SKILL.md`; U6's contract migration across test/doc files) are expected follow-ons, not double edits — the later unit's sync-record entry notes the follow-on.
- **R3.** Slice 0 is a capability audit producing a durable findings record at `docs/omp-capability-audit.md`: (a) the full lifecycle-hook surface OMP exposes — enumerate every hook and its registration mechanism rather than checking a preset list (Stop, PreToolUse, SessionStart, compaction/post-compaction, task-completion, prompt-submit, and subagent-lifecycle events are the known candidates); (b) whether OMP task dispatch carries a per-spawn model field in current versions (the no-per-spawn-model claim is third-party and OMP-17-era — verify, don't assume); (c) whether OMP lazily loads per-skill context — consumed by R15's re-injection decision; (d) whether OMP dedupes capability names across sources first-match-wins — the premise R13 would codify. The audit is host-sourced: this repo contains zero hook registrations (`.pi/extensions/compound-engineering.ts` subscribes only to `resources_discover`), so findings come from OMP's docs, CLI surface, and executed probes — never from repo grep alone and never from agent self-report. The record ends in a mechanism × required-hook × fallback table that R9, R11, R12, R13, and R15 read before their port decisions.
- **R18.** Slice 0 also persists the program's evidence base: the research report is committed under `docs/brainstorms/` and the claim ledger under `docs/` (or folded into `docs/upstream-sync.md`) before session scratch is lost — the disposition ledger has no verifiable source without them.
- **R19.** Each Tier-1 slice pins its upstream baseline: fetch once per the documented procedure, record the SHA in the slice's sync-record entry, and port against it. Slice 0 additionally records the program baseline SHA (upstream HEAD at program start). Graft slices (Tiers 2–3) carry program-item notes in the sync record, not upstream SHAs. Upstream commits that land during the program are recorded as new pending rows, not chased mid-slice. A slice's sync-record update is part of its done condition, including on abort — a mid-port abort records `partial` with the landed files and pinned SHA.

**Upstream catch-up (Tier 1)**

- **R4.** Port the ce-code-review hardening cluster as one slice: protected-subject veto (#1694), cross-model-peer promotion gate (#1697), fresh-leaf finish path (#1692), bounded in-turn dispatch (#1691), on-disk validator contract (#1688), evidence backfill (#1684), and `.mjs`/`.cjs` scope fix (#1696). The cluster interlocks by upstream's design; splitting it produces a half-hardened review path. #1667 (terminal-outcome collection) is already recorded `ported` at `1998a529` in `docs/upstream-sync.md` — the slice verifies that port still stands and records no new disposition for it.
- **R5.** Port Compound Packs (#1549) as one slice, matching the pinned upstream implementation's actual shape: `packs-resolve.py` resolver copies in the consuming skills' script dirs (upstream's copy layout, kept byte-identical with a parity test), the `packs:` config block into `config.example.yaml`, `config-template.yaml`, and `docs/guides/configuration.md` with upstream's layering semantics, pack wiring in the seven consuming skills (ce-brainstorm, ce-code-review, ce-compound, ce-doc-review, ce-dogfood, ce-plan, ce-setup), and the `docs/guides/packs.md` page. Resolver-copy count, config layering, source kinds, and failure semantics follow the pinned upstream implementation — any verified OMP-specific departure is recorded in the sync record as a deliberate adaptation, never attributed to upstream. Before porting, resolve its `pending-decision` row in `docs/upstream-sync.md` — a recorded deferral wins over the report's adoption flag.
- **R6.** Port ce-bakeoff and ce-noslop as whole skills. ce-bakeoff ports its current de-experimentalized state (#1652 + #1655 + #1671), not the original. ce-noslop ports the post-#1700 contract (aae9f91c, unreleased upstream) including the opt-in edit-mode change summary; the accompanying skill-design learning `inline-callee-side-channel-must-name-where-it-may-not-land.md` is evaluated for port as part of the same slice. R6 owns the README reconciliation R8 names (skill count 39 after this slice; the packs guide row lands only if R5 adopted packs); R7 does not re-edit README.
- **R7.** Port the hygiene sweep as one slice: Astra-shaped descriptions + ce-debug ask-first load gate + `astra-description-triggers.test.ts` (#1683), declared-decision grading in skill-eval-cell (#1686), and CI `timeout-minutes: 30` (#1687). The AGENTS.md consolidation from #1683 ports the *pattern* (policy → `docs/solutions/developer-experience/` with pointers), not upstream's exact text — the fork's AGENTS.md diverges. The #1682 prose restatement sweep inherits the sync record's `skipped` dispositions for the same campaign (#1671/#1681: wholesale conflict with OMP-adapted prose) unless the recorded flip condition — upstream style becoming canonical — now holds; the slice records the outcome either way. #1680's wedged-worker retry has no `run-tests.ts` to land in (the fork's test entry is `bun test --parallel`): the slice either adapts the fresh-process TimeoutError retry to that entry point or records `n/a-fork`.
- **R8.** The docs site (#1664) is excluded — the 2026-09-11 sync record disposes it `n/a-fork` ("Fork has no `site/` surface"). Upstream's README now badges "plugin of 35 skills" and advertises Compound Packs — the fork's README skill counts and guide rows must be reconciled as part of R6/R7 regardless.
- **R20.** `artifact_readiness` removal (#1685) is its own slice, not a hygiene-sweep line: the field is the fork's load-bearing plan-routing contract across ~37 live files (ce-work's intake refusal, ce-doc-review's type classification, ce-plan's resume, contract tests). The slice treats it as a contract migration — readiness derived from plan contents — with a fresh fork-side file inventory.

**OMP-ecosystem grafts (Tier 2)**

- **R9.** Port the fresh-verifier acceptance gate (pilotfish/pi-oven pattern): an agent that never saw the implementation gates lfg acceptance, placed after review fixes land and before shipping. If the audit confirms a per-spawn model field, tiered routing may use it; otherwise the verifier runs on the session model with structural separation (fresh context, no implementation history) and carries an `independence: structural-only` label through to the PR body — a same-family re-read is never presented as cross-model assurance. No new config keys: `modelRoles`/`task.agentModelOverrides` do not exist in this repo, and introducing routing schema is out of scope. The gate's PASS/BLOCK contract is the portable mechanism; provider-locked pi-oven machinery is not.
- **R10.** Port gsd-omp-style milestone audits — cross-phase audit of outstanding verification items and milestone completion vs original intent — grafted into ce-work's final-validation seam, which already owns done-judgment over the plan artifact. ce-verify is excluded (its boundary is generate/refresh of drive infrastructure, never QA judgment); ce-dogfood is excluded (browser QA over branch diffs, not plan artifacts). Audit rigor is unverified upstream — the port defines its own check list rather than trusting the source's.
- **R11.** Port proofpunk's UNVERIFIED-never-PASS contract and planning-with-files' plan re-injection + SHA-256 tamper attestation + deterministic stop gate, each only for the hooks the audit (R3) confirms exist. Enforcement is evaluated at orchestrator-envelope emission, never at worker return — a per-worker hook firing promotes unverified work. Tamper attestation reuses the existing `source_digest`/`plan_checkpoint` envelope fields rather than adding a parallel hash file. A stop gate that cannot pass for environmental reasons emits blocked-with-recovery, never an infinite hold. A mechanism whose hook is missing is documented in the findings record as blocked-with-reason, not silently dropped and not approximated as advisory skill text.
- **R12.** Port pstack's plan-verify nudge (one report-only nudge when an approved plan's implementation finishes) if the audit finds a suitable event surface; it fires only on interactive standalone completion — pipeline and disable-model-invocation contexts have no synchronous user to nudge. Otherwise same blocked-with-reason handling as R11.
- **R13.** Codify the name-shadowing rule (OMP dedupes capability names across sources, first match wins) as an explicit authoring rule in `docs/solutions/skill-design/portable-agent-skill-authoring.md` once the audit (R3d) verifies the claim on both the user-invocation and agent-dispatch resolution paths — it validates the existing `ce-` prefix convention. A negative audit result records blocked-with-reason; the claim is not codified unverified.
- **R21.** Port quorum-review's consensus dedup + refutation into ce-code-review: findings deduplicated by consensus across the dispatched reviewer panel, provenance checked, with an optional refutation pass. Per R2 this bundles into the R4 cluster slice — `findings-mechanics.py` is reviewed once in its final state. The consensus algorithm's shape is unverified (source unread); the slice defines it against the fork's findings mechanics rather than trusting the source's.

**Cross-harness mechanisms (Tier 3)**

- **R14.** Port spec-kit's converge gate — implementation cycles until a convergence check against spec/plan/tasks reports converged, appending remaining work as new tasks — grafted into ce-work's implementation loop (`skills/ce-work/references/implementation-loop.md`), with ce-verify staying read-only. The loop is bounded (default 3 cycles, matching the shipping-tail repair precedent), judged by a fresh-context check independent of the implementer, and appended tasks are checked against plan scope — out-of-scope convergence work returns blocked for re-planning rather than silently appending. The constitution artifact (pinned per-project governing principles) lands only as something the converge check consumes, as a per-project file convention; if no requirement consumes it, it is deferred-with-reason rather than parked as a parallel store.
- **R15.** Port superpowers' post-compaction skill re-injection only if the audit finds a compaction hook (else blocked-with-reason); if the audit finds OMP eagerly retains skill context, the mechanism is deferred-with-reason instead — re-injection has nothing to fix. Re-injection payload is bounded to the active skill plus artifact root, never all skill descriptions. The mandatory-activation half is not ported: the 2026-09-10 eval recorded a Skip on that mechanism (O01 — OMP already requires matching-skill reads; `ce-mode` owns opt-in stickiness).
- **R16.** Port wshobson's plugin-eval certification as the delta over what R7 lands: enumerate the structural checks `astra-description-triggers.test.ts` and declared-decision grading do not already perform before adding static analysis; LLM-judge semantic scoring and reliability simulation are eval evidence, not a merge gate. The drift-detection CI is expressed as a `bun run test` target, not a `make garden` port.
- **R17.** Port spec-kit's taskstoissues bridge (plan task list → tracker issues) as a ce-plan-adjacent bridge — a `skills/ce-plan/references/` addition plus a SKILL.md section, reusing the tracker-detection precedent in `skills/ce-work/references/tracker-defer.md` — only if the project's tracker interface supports it, including approval/audit posture for agent-path writes; otherwise deferred.

### Key Flows

1. **Audit → gate.** Slice 0 audits OMP's hook surface, per-spawn model field, per-skill context loading, and the name-dedup claim; writes a durable findings record. Every hook-level and routing-level requirement (R9, R11, R12, R13, R15) reads that record before its port decision.
2. **Upstream slice → bundled graft.** Each Tier-1 slice ports upstream's tested code first; a bundled ecosystem graft (per R2) lands in the same slice and the same review, so the file's final state is reviewed once.
3. **Sync record update.** Each upstream slice updates `docs/upstream-sync.md` dispositions (`ported`/`partial`/`skipped`/`pending-decision`/`n/a-fork`) as part of its done condition — the sync record stays the ledger of what crossed. Program-level dispositions map onto it: ported and bundled-and-ported record as `ported`; blocked-with-reason records as `skipped` with the reason; deferred-with-reason records as `pending-decision`; excluded-by-boundary records as `n/a-fork`; an item found already-ported needs no new entry. Evidence tags keep graft presence visible: a bundled graft's row notes the bundle (`+R21 quorum dedup`), a late-overlap port notes the double-edit exception (per R2), and a re-verified port notes `re-verified, no new disposition`.
4. **Blocked-with-reason.** When an audit finding forecloses a mechanism, the slice records the mechanism, the missing capability, and the flip condition in `docs/omp-capability-audit.md` and `docs/upstream-sync.md` — never a silent skip.

### Acceptance Examples

- When the audit finds OMP has no post-compaction hook, the plan's re-injection requirement resolves to a findings-record entry naming the missing hook and the condition that would revive the port — not a skill-text approximation.
- When the audit finds a per-spawn model field exists, R9's verifier may route to a cheaper tier; when it doesn't, the verifier still runs but on the session model with fresh-context separation.
- When `docs/upstream-sync.md` shows #1667 already `ported`, R4 verifies the port stands and records no new disposition; the cluster still ports.
- When quorum dedup lands inside the ce-code-review cluster slice, `findings-mechanics.py` is reviewed once in its final state — not once for the upstream port and again for the graft.

### Success Criteria

- Every report item ends the program with a recorded disposition: ported, bundled-and-ported, already-ported, blocked-with-reason, deferred-with-reason, or excluded-by-boundary. No item is unaccounted for.
- Each ported mechanism demonstrably fires in its host skill — a port that lands code paths nothing can reach fails this criterion even when its disposition is recorded.
- `docs/upstream-sync.md` reflects the new upstream state after the Tier-1 slices.
- Each slice passes the repo's gates: `bun run test` green, review before PR, and the sync record updated — Tier-1 slices with the slice's pinned upstream SHA, graft slices with program-item notes.

### Scope Boundaries

**Outside this program's identity** (STRATEGY.md boundary — never port):
- Multi-harness distribution machinery: dual-carrier catalogs, per-harness plugin directories, spec-kit bundle manifests, native-artifact compilation.
- Vendor-bound items: codex session transfer, Codex-profile-locked pi-oven machinery beyond the verifier pattern.
- Context-compression extensions (better-compact, omp-headroom) — extension-level concerns outside a skill plugin's scope.

**Deferred for later:**
- The 19 conditional Adapt grafts from the 2026-09-10 feasibility eval — a separate prior judgment; this program covers the new report's items only.
- HStack `arena`/`blast-radius` — named candidates pending a skill-body read; the verify-skill pair is a confirmed duplicate of ce-verify.
- Assumption to verify in-slice: the no-per-spawn-model-field claim may be stale (OMP-17-era source).


### Outstanding Questions

- **Resolve Before Planning:** none — the audit (R3) is itself the resolution mechanism for the hook/routing unknowns, and the deferral checks are in-slice steps.
- **Deferred to Planning:** whether ce-noslop's side-channel learning doc ports with it; whether plugin-eval's LLM-judge layer is worth its cost; exact per-slice commit boundaries inside each unit.

### Sources / Research

- Research report: session artifact `local://report.md` (39.6 KB, 66 verified claims, 44 sources); claim ledger at `$TMPDIR/deep-research-20260914a-kq223ilo/claims-20260914a.jsonl`.
- `docs/upstream-sync.md` — sync record, disposition vocabulary, pending-decision items.
- `docs/plans/2026-09-10-famous-plugins-feasibility-evaluation.md` — prior adoption judgment (Fold/Adapt/Skip vocabulary, no-new-skill rule, 19 conditional grafts).
- `docs/plans/2026-09-11-2257-fix-upstream-sync-ports-plan.md` — prior sync execution: file-granular hand-merge (KTD1), ledger-over-DECISIONS.md (KTD2), ordered-pair port (KTD3), catalog serialization (KTD4), ledger-written-last-even-on-abort (KTD5).
- `docs/plans/2026-06-18-001-refactor-unified-plan-doc-artifact-plan.md` — `artifact_readiness` contract origin: readiness-not-status, two-valued, no third value.
- `docs/solutions/skill-design/portable-agent-skill-authoring.md` + `skill-gates-state-conditions-not-prescribed-git-commands.md` + `state-the-condition-not-a-placement-absolute.md` + `subordinate-the-failing-shape-to-the-condition.md` — the four composable prose rules every graft must satisfy.
- `docs/solutions/skill-design/anti-poll-scope-and-async-subagent-dispatch.md` — #1159 reverted serialization; bounded foreground concurrency is the reconciled rule.
- `docs/solutions/workflow/reviewing-byte-duplicated-shared-assets.md` — canonical-copy + parity-test pattern for duplicated scripts (R5's two `packs-resolve.py` copies).
- `STRATEGY.md` — OMP-only boundary; no multi-harness abstraction.
- Grounding dossier: `/tmp/compound-engineering-502/ce-brainstorm/20260914-port-program/grounding.md` (fork-state extraction: skills inventory, ce-code-review landing zone, lfg/ce-verify gaps, config schema, tests layout, CI shape).
- Planning research (2026-09-14): repo-pattern survey (zero hook surface in-repo; no `modelRoles`/`agentModelOverrides` keys; 37-file `artifact_readiness` inventory; packs wholly absent; 5 of 7 packs script dirs empty or missing), agent-native assessment (gate placement, envelope ownership, bounded converge, dual-path parity), code lineage (1998a529 ordered pair, c6ac2dbc partial, catalog.ts contention, no fresh-verifier precedent), flow analysis (audit sourcing, R20 sequencing, abort transactionality, ledger evidence tags).

---

## Planning Contract

**Product Contract preservation:** restructured, no scope change — R10's graft host moved from ce-verify to ce-work's final-validation seam (ce-verify's generate/refresh boundary forbids QA-judgment content; ce-dogfood is browser QA over diffs, not plan artifacts). All other R-IDs unchanged in meaning; several gained qualifiers from planning research (noted inline).

### Key Technical Decisions

- KTD1. **File-granular hand-merge is the port mechanism.** Every Tier-1 unit fetches upstream by URL, pins the slice baseline SHA in its sync-record entry, and hand-merges per file — preserving OMP adaptations (skill names, `xd://` devices, harness prose) and citing the upstream SHA per commit. `git apply --check` fails on the drifted fork for nearly every upstream commit; cherry-picking is not an option. `tests/skill-eval-cell/catalog.ts` edits serialize in unit order with OMP-shape translation, per the 2026-09-11 KTD4 discipline. A mid-port abort records `partial` with landed files and the pinned SHA — the ledger is written even on abort.
- KTD2. **Slice-0 audit is host-sourced and probe-verified.** This repo contains zero lifecycle/enforcement hook registrations (`.pi/extensions/compound-engineering.ts` subscribes only to `resources_discover` — the repo's existing registration precedent), so the audit enumerates OMP's surface from host docs, CLI help, and executed probes (a dispatched task carrying a model field; a same-named capability from two sources observed for the winner) — never from repo grep or agent self-report. Output: `docs/omp-capability-audit.md` ending in a mechanism × required-hook × fallback table.
- KTD3. **Fresh-verifier sits post-review-fixes, pre-ship in lfg.** Placement after step-4/5 review fixes means the verifier sees the final tree; earlier placement never sees applied fixes. The gate emits a dedicated PASS/BLOCK verifier receipt defined in `skills/lfg/references/review-followup.md` — produced after step 5 applies review fixes and consumed by `skills/lfg/references/shipping-tail.md` before step 8 ships — carrying verdict, scoped U-IDs, evidence pointers, serving mode, and independence label per `work-return.md`'s field inventory. `work-return.md` itself is unchanged: it is consumed at lfg step 2, too early to certify the post-fix tree. BLOCK stops the pipeline or triggers one bounded rework, matching the one-recovery-invocation precedent.
- KTD4. **Enforcement grafts evaluate at the orchestrator envelope, never at worker return.** ce-work splits authority — workers self-check units; the orchestrator owns authoritative verification and commits. A per-worker hook promotes unverified work. Tamper attestation reuses the existing `source_digest`/`plan_checkpoint` envelope fields (detect-and-block, never silent re-baseline). Any stop gate that cannot pass environmentally emits blocked-with-recovery, never an infinite hold.
- KTD5. **`artifact_readiness` migration order: inventory → readers accept both → writers stop emitting → readers drop the field → docs.** Every commit stays green; the derived detector is content-based and requires the full plan contract — Product Contract, Planning Contract, Implementation Units, Verification Contract, and Definition of Done present with no launch-blocking open question ⇒ executable; otherwise requirements-only. Readiness stays a two-valued document-completeness signal — no third value, no mutable progress state. Each affected contract test and fixture update lands in the same commit as the writer or reader change it pins; only non-contractual doc cleanup waits for the final migration commit.
- KTD6. **Packs semantics follow the pinned upstream implementation, not local guesses.** `packs-resolve.py` copy layout, `packs:` config layering, supported source kinds, and failure semantics are read from upstream at the slice's pinned SHA and ported as-is; any verified OMP-specific departure is recorded in the sync record as a deliberate adaptation. Pack knowledge never outranks repo authority (STRATEGY.md/CONCEPTS.md/verified code win on conflict). Every resolver copy upstream places is kept byte-identical under a parity test — reviewers scope to the canonical path.
- KTD7. **Converge gate is bounded, independently judged, and scope-guarded.** Default 3 cycles (the shipping-tail repair precedent); the convergence check runs in fresh context independent of the implementer; appended tasks are checked against plan Scope Boundaries — out-of-scope work returns blocked for re-planning. In return-to-caller mode the loop lives inside per-unit fix-before-next; outer re-dispatch belongs to the caller.
- KTD8. **Bundled grafts land as separable commits inside the host slice.** A pre-slice overlap check (does the graft's file set intersect the port's?) decides bundling; a graft whose host slice is blocked is itself blocked-with-same-reason unless re-homed to another slice.
- KTD9. **Milestone audits graft into ce-work's final-validation seam.** The audit is done-judgment over plan artifacts — ce-work's shipping workflow already owns that judgment with the plan in hand. ce-verify (generator, never QA judgment) and ce-dogfood (browser QA) are excluded by their own boundaries.
- KTD10. **Re-injection payloads are bounded to active context.** Post-compaction re-injection (if a hook exists) re-adds only the active skill plus artifact root — never all skill descriptions — and does not fight a loader that already retains context.

### High-Level Technical Design

```mermaid
flowchart TB
  U1[U1 Slice-0 audit<br/>docs/omp-capability-audit.md<br/>+ evidence + baseline SHA] --> T1
  subgraph T1[Tier 1 — upstream catch-up]
    U2[U2 review cluster + quorum]
    U3[U3 compound packs]
    U4[U4 hygiene sweep]
    U5[U5 ce-bakeoff + ce-noslop]
    U6[U6 artifact_readiness removal<br/>last in tier]
    U2 --> U6
    U3 --> U6
    U2 --> U4
    U3 --> U4
    U4 --> U5
    U4 --> U6
    U5 --> U6
  end
  T1 --> T2
  subgraph T2[Tier 2 — OMP-ecosystem grafts]
    U7[U7 fresh-verifier gate → lfg]
    U8[U8 milestone audits → ce-work]
    U9[U9 hook enforcement<br/>audit-gated]
    U10[U10 plan-verify nudge<br/>audit-gated]
    U11[U11 name-shadowing rule<br/>audit-gated]
    U8 --> U10
  T2 --> T3
  subgraph T3[Tier 3 — cross-harness mechanisms]
    U12[U12 converge gate → ce-work]
    U13[U13 compaction re-injection<br/>audit-gated]
    U14[U14 plugin-eval delta]
    U15[U15 taskstoissues bridge]
  end
  U1 -.->|hook matrix| U9
  U1 -.->|hook matrix| U10
  U1 -.->|hook matrix| U13
  U1 -.->|model field + dedup| U7
  U1 -.->|model field + dedup| U11
  U4 -.->|delta baseline| U14
```

Tier order is sequential per R1 and is encoded in the dependency table: every Tier-2 unit depends on U6, and every Tier-3 unit depends on U7–U11. Units inside a tier may overlap in time only when their file sets are disjoint; intra-tier file overlaps are serialized by explicit edges (U2/U3 → U4, U8 → U10). `tests/skill-eval-cell/catalog.ts` is the known contention point — U2, U4, and U5 serialize edits to it in that order.

### Assumptions

- Interactive execution ships one PR per slice; a directed `lfg` run (this session's mode) ships one PR of separable per-slice commits.
- Upstream fetch uses the documented no-persistent-remote procedure (`git fetch https://github.com/EveryInc/compound-engineering-plugin main`); ports are file-granular hand-merges, not cherry-picks — nearly every upstream commit fails `git apply --check` on the drifted fork, and slice sizing accounts for this.
- Upstream content for post-`c4a643b1` commits (#1683, #1686, #1687, #1700, #1685) is unverified in-fork; each slice reads upstream at its pinned baseline before porting.
- The no-per-spawn-model-field claim is OMP-17-era and may be stale; U1 verifies rather than assumes.
- `docs/omp-capability-audit.md` is the findings-record home; `docs/upstream-sync.md` remains the disposition ledger — no DECISIONS.md is created (KTD2 of the 2026-09-11 sync plan).

---

## Implementation Units

| Unit | Title | Key files | Depends on |
|---|---|---|---|
| U1 | Slice-0 capability audit + evidence + baseline | `docs/omp-capability-audit.md`, `docs/upstream-sync.md`, `docs/brainstorms/` | — |
| U2 | ce-code-review hardening cluster + quorum dedup | `skills/ce-code-review/` | U1 |
| U3 | Compound Packs | `skills/*/scripts/packs-resolve.py`, config files, 7 skill wirings | U1 |
| U4 | Hygiene sweep | `skills/*/SKILL.md`, `tests/`, `.github/workflows/ci.yml` | U2, U3 |
| U5 | ce-bakeoff + ce-noslop ports | `skills/ce-bakeoff/`, `skills/ce-noslop/`, `README.md` | U4 |
| U6 | `artifact_readiness` removal | ~37 files repo-wide | U2, U3, U4, U5 |
| U7 | Fresh-verifier gate in lfg | `skills/lfg/` | U1, U6 |
| U8 | Milestone audits in ce-work | `skills/ce-work/references/shipping-workflow.md` | U6 |
| U9 | Hook-enforcement mechanisms | `skills/ce-work/references/`, findings record | U1, U6 |
| U10 | Plan-verify nudge | `skills/ce-work/references/` | U8 |
| U11 | Name-shadowing authoring rule | `docs/solutions/skill-design/portable-agent-skill-authoring.md` | U1, U6 |
| U12 | Converge gate in ce-work | `skills/ce-work/references/implementation-loop.md` | U7–U11 |
| U13 | Post-compaction re-injection | findings record or hook consumer | U1, U7–U11 |
| U14 | Plugin-eval certification delta | `tests/` | U4, U7–U11 |
| U15 | taskstoissues bridge | `skills/ce-plan/references/` | U1, U7–U11 |

### U1. Slice-0 capability audit, evidence persistence, program baseline

**Goal:** Produce the durable findings record every downstream slice reads, land the research evidence in `docs/`, and pin the program's upstream baseline.

**Requirements:** R3, R18, R19.

**Dependencies:** none.

**Files:** `docs/omp-capability-audit.md` (create); `docs/upstream-sync.md` (program baseline row); `docs/brainstorms/2026-09-14-plugin-ecosystem-research.md` (commit the research report); claim ledger under `docs/` or folded into the sync record.

**Approach:**
1. Fetch upstream per the documented procedure; record upstream HEAD as the program baseline SHA in `docs/upstream-sync.md`.
2. Commit the research report and claim ledger to `docs/` so every later disposition cites durable evidence.
3. Audit the OMP host — docs, CLI surface, and executed probes — for (a) the full lifecycle-hook surface with registration mechanisms, (b) a per-spawn model field on task dispatch, (c) lazy vs eager per-skill context loading, (d) capability-name dedup across sources on both user-invocation and agent-dispatch paths. Repo grep is evidence of absence in-repo only, never of host absence.
4. Write `docs/omp-capability-audit.md`: per-finding answer with evidence, then the mechanism × required-hook × fallback table covering R9, R11, R12, R13, R15.

**Patterns to follow:** `docs/specs/omp.md` last-verified/primary-sources pattern; `verify-externally-attributed-constraints-at-the-source.md` (stamp owner/scope/date on external claims).

**Test scenarios:**
- A hook claim in the findings record cites an executed probe or host doc — a claim sourced from repo grep alone fails review.
- The mechanism × hook table has a row for every mechanism R9, R11, R12, R13, and R15 name, each with a fallback column.
- The program baseline SHA appears in `docs/upstream-sync.md` and resolves via `git cat-file`.

**Verification:** findings record exists at the named path; every R3(a–d) question has an evidence-backed answer; baseline SHA recorded; report + ledger committed.

### U2. ce-code-review hardening cluster + quorum dedup bundle

**Goal:** Port the seven-commit upstream hardening cluster and land the quorum consensus-dedup graft in the same slice, so `findings-mechanics.py` is reviewed once in its final state.

**Requirements:** R4, R21.

**Dependencies:** U1.

**Files:** `skills/ce-code-review/SKILL.md`; `skills/ce-code-review/references/finish-review.md`, `dispatch-reviewers.md`, `select-and-route.md`, `validator-batch-template.md`, `cross-model-review.md`; `skills/ce-code-review/scripts/findings-mechanics.py`, `review-scope.py`; `tests/ce-code-review-mechanics.test.ts`; `tests/skill-eval-cell/catalog.ts` (serialized per KTD1); `docs/upstream-sync.md`.

**Approach:**
1. Pin the slice baseline; read each upstream commit at that SHA before merging.
2. Hand-merge per file: protected-subject veto extends the existing Protected Artifacts section in `finish-review.md`; the promotion gate lands on `independent_reviewer()`/`merge_group()` in `findings-mechanics.py` plus the Stage-5b skip rule; bounded in-turn dispatch tightens the existing bounded-foreground rule in `dispatch-reviewers.md`; the on-disk validator contract lands on the validator templates; evidence backfill fills the `first_evidence`/hydration seam; `.mjs`/`.cjs` joins `CODE_EXTENSIONS` in `review-scope.py`.
3. Verify #1667's port still stands (terminal-outcome collection in SKILL.md + dispatch-reviewers.md); record `re-verified, no new disposition`.
4. Land quorum consensus dedup + refutation as separable commits inside this slice: `findings-mechanics.py` keeps exact-fingerprint dedup, promotion, and restoration; differently-worded consensus is Stage-5 model reconciliation before the restore-mechanics rerun, with quorum requiring two independent reviewer identities and an explicit bounded refutation trigger and budget.
5. Preserve the fork adaptations: no shell-worker reintroduction (`cross-model-adversarial-review.sh` is gone by design), bounded foreground concurrency stays (never re-serialize per #1159), the `cross-model-panel.md` fork-adapted hunk stays skipped.

**Patterns to follow:** `docs/plans/2026-09-11-2257-fix-upstream-sync-ports-plan.md` KTD1/KTD3/KTD4; `tests/ce-code-review-mechanics.test.ts` spawnSync-fixture idiom.

**Test scenarios:**
- `review-scope.py` counts `.mjs`/`.cjs` files as code in a fixture repo (regression pin for #1696).
- `findings-mechanics.py` promotion gate: a finding corroborated only by same-context personas does not promote; one corroborated by an `independence_verified` cross-model peer does.
- Consensus dedup: two reviewers' differently-worded findings on the same line merge into one entry with both attributions.
- Validator batch: a single batch of ≤8 with P0/P1 expansion, never split.
- Dispatch: reviewer batch dispatches concurrently (not serially) and terminal outcomes are collected before cleanup.

**Verification:** `bun run test` green including new mechanics pins; sync record rows for each ported commit with the slice SHA; `findings-mechanics.py` final state reviewed once.

### U3. Compound Packs

**Goal:** Port #1549 — config-declared knowledge packs grounding the seven consuming skills.

**Requirements:** R5.

**Dependencies:** U1.

**Files:** `skills/ce-brainstorm/scripts/packs-resolve.py` (canonical), `skills/ce-code-review/scripts/packs-resolve.py` (parity copy), plus every further resolver copy the pinned upstream implementation places; `.compound-engineering/config.example.yaml`, `skills/ce-setup/references/config-template.yaml`, `docs/guides/configuration.md`; wiring in `skills/ce-brainstorm/`, `skills/ce-code-review/`, `skills/ce-compound/`, `skills/ce-doc-review/`, `skills/ce-dogfood/`, `skills/ce-plan/`, `skills/ce-setup/`; `docs/guides/packs.md` (create); `tests/skills/ce-setup-check-health.test.ts`; a new parity test; `docs/upstream-sync.md`.

**Approach:**
1. Resolve the `pending-decision` row first — a recorded deferral ends the slice as `pending-decision` retained, no-op otherwise.
2. Pin baseline; port `packs-resolve.py` at the pinned SHA's actual shape — resolver-copy layout, config layering, source kinds, and failure semantics as upstream implements them; add the byte-parity test covering every copy upstream places.
3. Add the `packs:` block to both config files and the `configuration.md` table row; ce-setup repo-fixes gains the rollout step; check-health validates the key.
4. Wire the seven consumers — five have empty or missing `scripts/` dirs, so wiring is a read-time reference or anchored call per the tier rules, not a third script copy.
5. Missing pack dir fails closed at the consuming skill; pack knowledge never outranks repo authority.

**Patterns to follow:** `docs_root` fail-closed precedent; `cross_model_review_mode` config pattern (local-wins, invalid falls through, docs row, check-health pin); `reviewing-byte-duplicated-shared-assets.md` canonical-copy rule.

**Test scenarios:**
- Parity test: every `packs-resolve.py` copy the pinned upstream implementation places is byte-identical.
- check-health: a `packs:` key in config passes validation; a retired key still warns.
- A consuming skill with a declared-but-missing pack dir stops with a named error, not a silent skip.
- Pack content contradicting `CONCEPTS.md` loses — repo authority wins.

**Verification:** `bun run test` green; packs resolve end-to-end in one consuming skill; sync record row updated from `pending-decision`.

### U4. Hygiene sweep

**Goal:** Port #1683 (Astra-shaped descriptions + ce-debug ask-first gate + `astra-description-triggers.test.ts`), #1686 (declared-decision grading), #1687 (CI timeout), and dispose #1682/#1680.

**Requirements:** R7.

**Dependencies:** U2, U3 (the `skills/*/SKILL.md` sweep runs after their SKILL.md edits land).

**Files:** `skills/*/SKILL.md` descriptions; `skills/ce-debug/SKILL.md`; `tests/skills/astra-description-triggers.test.ts` (create); `tests/skill-eval-cell/grade.ts`, `tests/skill-eval-cell/catalog.ts`; `.github/workflows/ci.yml`; `AGENTS.md` (pattern port: policy → `docs/solutions/developer-experience/`); `skills/ce-work/scripts/__pycache__/` (delete — orphaned build output); `docs/upstream-sync.md`.

**Approach:**
1. Pin baseline; read each upstream commit at that SHA.
2. Port description reshaping + the ce-debug load gate + the new trigger test.
3. Port declared-decision grading into `grade.ts` with catalog rows — serialize `catalog.ts` edits before U5's.
4. Add `timeout-minutes: 30` to the CI test job; leave `fetch-depth: 0` and the `bun run test` pin untouched.
5. #1682: record `skipped` unless the canonical-style flip condition affirmatively holds. #1680: adapt the wedged-worker retry to `bun test --parallel` or record `n/a-fork`.
6. Delete the stale `skills/ce-work/scripts/__pycache__/` artifacts (no `.py` sources exist — orphaned build output).

**Test scenarios:**
- `astra-description-triggers.test.ts` fails on a description missing the trigger shape and passes on the ported ones.
- Declared-decision grading: a scenario cell that declares a decision the skill must make is graded on the decision, not just artifacts.
- CI workflow parses and carries `timeout-minutes: 30` on the test job.

**Verification:** `bun run test` green; sync record rows for #1683/#1686/#1687 ported, #1682/#1680 disposed with reasons.

### U5. ce-bakeoff + ce-noslop whole-skill ports

**Goal:** Land the two upstream skills at their current upstream state, plus README reconciliation.

**Requirements:** R6, R8 (README half).

**Dependencies:** U4 (the astra-description harness and current description conventions land first so the new skills conform on arrival).

**Files:** `skills/ce-bakeoff/` (new), `skills/ce-noslop/` (new); `package.json` `pi.skills` if the manifest enumerates skills; `README.md` (skill count 37→39, guide rows); `docs/guides/README.md` catalog rows; `docs/guides/ce-bakeoff.md`, `docs/guides/ce-noslop.md` (create); `tests/skill-eval-cell/catalog.ts` (serialized per KTD1); `docs/solutions/skill-design/inline-callee-side-channel-must-name-where-it-may-not-land.md` (evaluate for port); `docs/upstream-sync.md`.

**Approach:**
1. Pin baseline; port ce-bakeoff at #1652+#1655+#1671 state and ce-noslop at post-#1700 (`aae9f91c`) state.
2. Apply the OMP adaptation pass: `xd://` devices, fork skill names, `SKILL_DIR` anchor for executed shell, portable-authoring conformance.
3. Evaluate the side-channel learning doc for port into `docs/solutions/skill-design/`.
4. README: skill count 39; packs guide row only if U3 adopted packs.
5. Add description-trigger coverage for both skills via the U4 harness so user-path and agent-path dispatch both resolve them.

**Test scenarios:**
- Both skills pass `astra-description-triggers.test.ts` and the skill-convention pins (`tests/skill-conventions.test.ts`, `tests/skill-agent-ce-prefix.test.ts`).
- `omp install --dry-run --json .` lists the `./skills` manifest root; both new skill dirs are verified through the on-disk SKILL.md/frontmatter inventory test plus the description-trigger checks.
- ce-noslop's opt-in edit-mode summary is opt-in, not default.

**Verification:** `bun run test` green; both skills discoverable; sync record rows updated.

### U6. `artifact_readiness` removal (contract migration)

**Goal:** Remove the readiness field repo-wide, replacing it with content-derived readiness — last slice in Tier 1 so no other slice's work is stranded mid-migration.

**Requirements:** R20.

**Dependencies:** U2, U3, U4, U5.

**Files:** all ~37 files in the verified inventory — ce-work `input-triage.md`, lfg `plan-brief.md`, ce-doc-review (3 files), ce-code-review `intent-and-plan.md`, ce-plan (7 references), ce-brainstorm (5 files), ce-prototype `write-back.md`, ce-sweep (2), ce-ideate `html-rendering.md`, 4 contract tests + `catalog.ts` + eval fixtures, 4 docs + `AGENTS.md`; `docs/upstream-sync.md`.

**Approach:**
1. Fresh fork-side inventory at slice time — do not trust the ~37 count.
2. Define the derived detector once: Product Contract, Planning Contract, Implementation Units, Verification Contract, and Definition of Done present with no launch-blocking open question ⇒ executable; otherwise requirements-only. One shared predicate, identical behavior at all three gate call sites (lfg plan-brief, ce-work intake, ce-plan pipeline).
3. Migrate in order: readers accept both forms → writers stop emitting the field → readers drop the field → docs. Green at every commit; each affected contract test and fixture update lands in the same commit as the writer or reader change it pins.
4. Readiness stays two-valued document completeness — no third value, no progress state. Legacy `origin:` resolution keeps working.

**Test scenarios:**
- Contract tests: a plan carrying the full contract (Product Contract, Planning Contract, Implementation Units, Verification Contract, Definition of Done, no launch-blocking question) but no `artifact_readiness` field classifies executable at all three gates; one missing a contract component classifies requirements-only. Fixtures omit each required component in turn.
- A `status:` field or progress-like value is still rejected.
- Eval fixtures migrated; `catalog.ts` readiness-graded scenario updated.

**Verification:** `bun run test` green; zero `artifact_readiness` references remain outside historical docs; the three gates behave identically on the same fixture.

### U7. Fresh-verifier acceptance gate in lfg

**Goal:** An agent that never saw the implementation gates lfg acceptance — placed after review fixes land, before shipping.

**Requirements:** R9.

**Dependencies:** U1 (model-field answer decides routing mode), U6 (Tier-2 barrier).

**Files:** `skills/lfg/SKILL.md`, `skills/lfg/references/review-followup.md` (verifier-receipt definition), `skills/lfg/references/shipping-tail.md` (receipt consumption); `docs/upstream-sync.md` (ecosystem graft — record as program item, not upstream row).

**Approach:**
1. Define the PASS/BLOCK verifier receipt in `review-followup.md`, extending `work-return.md`'s field inventory: verdict, scoped U-IDs, evidence pointers, serving mode, independence label. `work-return.md` itself is unchanged — it is consumed at lfg step 2, too early to certify the post-fix tree.
2. Dispatch the verifier with fresh context and no implementation history; per-spawn model field if U1 confirmed one, else session model with `independence: structural-only` carried to the PR body.
3. BLOCK stops the pipeline or triggers one bounded rework (one-recovery-invocation precedent); never an infinite hold.
4. No new config keys — `modelRoles`/`agentModelOverrides` do not exist and introducing routing schema is out of scope.

**Test scenarios:**
- A verifier dispatched with no implementation history returns PASS/BLOCK on the envelope schema.
- A BLOCK verdict stops the pipeline with a named recovery path.
- Session-model fallback output carries `independence: structural-only` — never presented as cross-model assurance.

**Verification:** the gate demonstrably fires in an lfg run (a seeded defect produces BLOCK); envelope fields present.

### U8. Milestone audits in ce-work final validation

**Goal:** Cross-phase audit of outstanding verification items and milestone completion vs original intent, run at ce-work's final-validation seam.

**Requirements:** R10.

**Dependencies:** U6 (Tier-2 barrier).

**Files:** `skills/ce-work/references/shipping-workflow.md` (final-validation section); possibly a new `skills/ce-work/references/milestone-audit.md`; `docs/upstream-sync.md` (program item).

**Approach:**
1. Define the audit checklist in-slice (source rigor unverified): outstanding verification items across the plan's units, milestone completion vs the plan's stated intent, residual accounting.
2. Graft as a final-validation step that consumes the plan artifact and the sync record — read-only over product code.
3. Keep it inside ce-work's existing authority: it judges and reports; it does not edit product code or drive matrices.

**Test scenarios:**
- A plan with an unverified unit fails the audit with the item named.
- A plan whose delivered state diverges from stated intent is flagged, not passed.
- The audit is a checklist over artifacts — it never edits product code.

**Verification:** the audit fires on a real slice completion and produces a pass/gap report.

### U9. Hook-enforcement mechanisms

**Goal:** Port UNVERIFIED-never-PASS, plan re-injection, tamper attestation, and the deterministic stop gate — each only where U1's matrix confirms the hook.

**Requirements:** R11.

**Dependencies:** U1 (the mechanism × hook × fallback table is the port decision), U6 (Tier-2 barrier).

**Files:** `skills/ce-work/references/return-to-caller.md`, `implementation-loop.md`, `execution-strategy.md` (envelope evaluation points); the hook registration or consumer path U1 identifies for each confirmed mechanism (conditional — in scope when the audit confirms a hook); `docs/omp-capability-audit.md` (blocked entries); `docs/upstream-sync.md`.

**Approach:**
1. For each mechanism, read the matrix row: confirmed hook → port against it, including the registration-to-orchestrator-envelope dispatch branch so the mechanism demonstrably fires; absent → blocked-with-reason entry naming the mechanism, missing capability, and flip condition.
2. Enforcement evaluates at orchestrator-envelope emission, never worker return.
3. Tamper attestation reuses `source_digest`/`plan_checkpoint`; a mismatch returns blocked with state preserved — never silent re-baseline.
4. Stop gates emit blocked-with-recovery when they cannot pass environmentally.

**Test scenarios:**
- Each ported mechanism has a failing-then-passing path (e.g., a unit with no verification evidence cannot emit a PASS envelope); for each confirmed mechanism an integration scenario invokes the host hook and observes the enforced outcome.
- A tampered plan file produces blocked-with-recovery, not a re-baselined digest.
- Each blocked mechanism has a findings-record entry with a flip condition.

**Verification:** every mechanism either demonstrably fires or has a blocked-with-reason record; none is approximated as advisory text.

### U10. Plan-verify nudge

**Goal:** One report-only nudge when an approved plan's implementation finishes — interactive standalone only.

**Requirements:** R12.

**Dependencies:** U8 (intra-tier — both edit `shipping-workflow.md`), U1 (event-surface answer).

**Files:** `skills/ce-work/references/shipping-workflow.md` or the completion surface the audit identifies; `docs/omp-capability-audit.md`; `docs/upstream-sync.md`.

**Approach:**
1. Fire only on interactive standalone completion (`status: complete` envelope outside pipeline mode); pipeline and disable-model-invocation contexts never see it.
2. Report-only: the nudge informs, never gates.
3. No suitable event surface → blocked-with-reason.

**Test scenarios:**
- Standalone completion emits exactly one nudge; a pipeline-internal return emits none.
- The nudge never blocks or alters the completion state.

**Verification:** nudge fires once on a standalone run; absent in pipeline mode.

### U11. Name-shadowing authoring rule

**Goal:** Codify the first-match-wins capability-dedup rule in the skill-authoring standard — only if U1 verifies it on both resolution paths.

**Requirements:** R13.

**Dependencies:** U1 (R3d answer), U6 (Tier-2 barrier).

**Files:** `docs/solutions/skill-design/portable-agent-skill-authoring.md`; possibly `AGENTS.md` pointer; `docs/omp-capability-audit.md`.

**Approach:**
1. Verified on user-invocation AND agent-dispatch paths → write the rule validating the `ce-` prefix convention.
2. A one-path confirmation is incomplete verification — the unit stays blocked until both probes confirm the same rule; no path-limited rule is published.
3. Negative result → blocked-with-reason; the claim is not codified.

**Test scenarios:**
- The rule text cites the audit evidence (probe description + observed winner).
- A negative audit produces a findings-record entry, not a rule.

**Verification:** rule present with evidence citation, or blocked-with-reason recorded.

### U12. Converge gate in ce-work

**Goal:** Implementation cycles until a fresh-context convergence check against spec/plan/tasks reports converged — bounded and scope-guarded.

**Requirements:** R14.

**Dependencies:** U7–U11 (Tier-3 barrier; U9 shares `implementation-loop.md`).

**Files:** `skills/ce-work/references/implementation-loop.md`; possibly `skills/ce-work/references/return-to-caller.md` (RTC-mode placement); `docs/upstream-sync.md` (program item).

**Approach:**
1. Loop bound: default 3 cycles, matching the shipping-tail repair precedent.
2. Convergence judged by a fresh-context check independent of the implementer — self-certified convergence is the trust failure this gate exists to prevent.
3. Appended tasks checked against plan Scope Boundaries; out-of-scope convergence work returns blocked for re-planning.
4. RTC mode: the loop lives inside per-unit fix-before-next; outer re-dispatch belongs to the caller.
5. The constitution artifact lands only as a per-project file the converge check consumes; unconsumed → deferred-with-reason.

**Test scenarios:**
- A seeded non-converging task stops at budget with blocked + recovery path, suite green, no scope-creep commit.
- An appended task outside plan Scope Boundaries returns blocked, not silently appended.
- Convergence judged by fresh context, not the implementing context.

**Verification:** the gate demonstrably terminates on both converging and non-converging inputs.

### U13. Post-compaction re-injection

**Goal:** Re-inject the active skill's context after compaction — only if a compaction hook exists and lazy loading is real.

**Requirements:** R15.

**Dependencies:** U1 (compaction-hook and lazy-context answers), U7–U11 (Tier-3 barrier).

**Files:** hook consumer TBD by audit; `docs/omp-capability-audit.md`; `docs/upstream-sync.md`.

**Approach:**
1. No compaction hook → blocked-with-reason. Eager context retention → deferred-with-reason (nothing to fix).
2. If both conditions hold: re-inject only the active skill plus artifact root — never all descriptions — without fighting the loader.
3. The mandatory-activation half stays unported per O01.

**Test scenarios:**
- Post-compaction, the active skill's required context is present again; unrelated skills are not re-injected.
- Both negative branches produce the correct ledger entries.

**Verification:** mechanism fires post-compaction, or the correct blocked/deferred disposition is recorded.

### U14. Plugin-eval certification delta

**Goal:** Port wshobson's plugin-eval certification as the delta over what U4 landed — enumerate coverage before adding checks.

**Requirements:** R16.

**Dependencies:** U4 (the delta is defined against `astra-description-triggers.test.ts` + declared-decision grading), U7–U11 (Tier-3 barrier).

**Files:** `tests/` (new structural checks as a `bun run test` target); `docs/upstream-sync.md` (program item).

**Approach:**
1. Enumerate what U4's harness already checks; add only uncovered structural checks.
2. LLM-judge semantic scoring and reliability simulation are eval evidence, not a merge gate.
3. Drift detection is a `bun run test` target runnable from ce-work's authoritative verification — not CI-only, not `make garden`.

**Test scenarios:**
- Each new check fails on a crafted violation and passes on the current tree.
- The drift target runs under `bun run test` locally and in CI identically.

**Verification:** new checks run in the standard suite; no LLM-judge result gates a merge.

### U15. taskstoissues bridge

**Goal:** Plan task list → tracker issues, as a ce-plan-adjacent bridge — only where the tracker interface supports it.

**Requirements:** R17.

**Dependencies:** U1 (tracker-interface answer), U7–U11 (Tier-3 barrier).

**Files:** `skills/ce-plan/references/` (new reference) + `skills/ce-plan/SKILL.md` section; reuse of `skills/ce-work/references/tracker-defer.md` precedent; `docs/upstream-sync.md` (program item).

**Approach:**
1. Detect the project's tracker interface per the tracker-defer precedent; check approval/audit posture for agent-path writes, not just API existence.
2. No suitable interface or no write-approval posture → deferred-with-reason.
3. The bridge extends ce-plan's existing Create Issue handoff: the one-plan-issue default is preserved; per-unit fan-out is exposed only after explicit user selection, and noninteractive invocation requires explicit standing authority. The bridge translates the plan's unit/task list into tracker issues through whatever interface the tracker exposes and returns the created issue links.
4. Issue creation is idempotent: plan path + U-ID is the stable dedup identity — a rerun updates or skips existing issues rather than duplicating them.

**Test scenarios:**
- A plan's units become tracker issues with stable titles and links back to the plan, created only after explicit opt-in selection.
- A rerun over the same plan creates no duplicate issues (plan path + U-ID dedup).

**Verification:** bridge produces issues on a tracker-equipped repo, or deferred-with-reason is recorded.

---

## Verification Contract

| Gate | Command / check | When |
|---|---|---|
| Test suite | `bun run test` (bun test --parallel) | every slice, green at every commit |
| Slice review | `ce-code-review` on the slice diff before PR | every slice |
| Sync record | `docs/upstream-sync.md` row(s) with the slice's pinned upstream SHA | every Tier-1 slice; program items noted for graft slices |
| Skill conventions | `tests/skill-conventions.test.ts`, `tests/skill-agent-ce-prefix.test.ts`, `astra-description-triggers.test.ts` (from U4) | any slice touching skill bodies or adding skills |
| Manifest conformance | `tests/omp-native-install.test.ts`, `tests/plugin-manifest-conformance.test.ts`; `omp install --dry-run --json .` | U5 and any manifest-touching slice |
| Behavioral eval | `bun run test:skill-eval-cell` / `test:skill-eval-pack` on affected skills | U2, U4, U5, U6 at minimum — prose-behavior changes get fresh-agent evidence, not just string pins |
| Mechanism fires | each graft's "demonstrably fires" scenario in its unit | every graft slice |

---

## Definition of Done

**Program-level:** every report item carries a recorded disposition (ported / bundled-and-ported / already-ported / blocked-with-reason / deferred-with-reason / excluded-by-boundary); each ported mechanism demonstrably fires in its host skill; `docs/upstream-sync.md` reflects the new upstream state; `docs/omp-capability-audit.md` holds the findings record and the mechanism × hook matrix.

**Per-slice:** the slice's units pass `bun run test` green; the diff passed `ce-code-review`; the sync record carries the slice's pinned SHA and dispositions including abort-partial records; no abandoned-attempt code or scratch files remain in the diff; the PR body carries the independence label when a session-model verifier served (U7).

**Per-unit:** the unit's Verification field satisfied; test scenarios enumerated in the unit exist as real tests or recorded exceptions; files outside the unit's declared set are not in its diff — a conditional Files entry (marked "possibly"/"conditional") is in declared scope only when the unit's Approach triggers it.
