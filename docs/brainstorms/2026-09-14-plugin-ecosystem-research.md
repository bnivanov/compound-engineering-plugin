# Can other plugins improve our current CE shape?

**Research synthesis — 2026-09-14.** Subject: the compound-engineering (CE) fork at `workflow-improvements/compound-engineering-plugin` (3.24.1-omp.13, last sync at upstream c4a643b1, 2026-09-11) versus upstream 3.25.0 and the wider plugin ecosystem. Every finding below traces to a ledger claim verified 2-0 by independent verifier seats (one 1-1 split resolved by tiebreak); zero claims were refuted and zero left unverified. Inline `[n]` markers resolve to ## Sources.

---

## Executive summary

The biggest CE improvements are not exotic: the highest-fit gaps are **upstream CE work this fork never ported** — a nine-commit ce-code-review hardening cluster, Compound Packs, ce-bakeoff, ce-noslop, and test/CI fixes — all verified commit-by-commit against the fork tree [1]–[20]. Beyond catch-up, three OMP-ecosystem mechanisms stand out: **quorum-review consensus dedup + refutation** for ce-code-review, **pilotfish-style tiered routing with a fresh-verifier gate** for lfg, and **gsd-omp milestone-level audits** [21]–[22]. Cross-harness, the strongest imports are superpowers' **post-compaction skill re-injection and mandatory activation**, spec-kit's **converge gate and constitution artifact**, and planning-with-files' **hook-driven plan re-injection with hash attestation** [36]–[37], [41]. One hard ceiling recurs: OMP task dispatch carries **no per-spawn model field**, so multi-model tiered review must route through config (`modelRoles` / `task.agentModelOverrides`), not skills — independently corroborated by two plugin authors [22], [23].

---

## Tier 1 — Upstream unported work (port first: it is CE's own roadmap)

Highest fit by definition: same skill names, same contracts, verified missing in this fork. Upstream released all of this in **3.25.0 (2026-09-12)** except #1700 (2026-09-13, unreleased); the fork sits one minor behind at 3.24.1-omp.13 [19].

### 1.1 ce-code-review hardening cluster (nine commits, 2026-09-11 → 09-12)

| # | What upstream added | Why the fork's CE lacks it | Port difficulty | Claim |
|---|---|---|---|---|
| Protected-subject veto | Findings schema gains `protected_subject` (8-value enum), `validation_status` (confirmed/rejected/unresolved), `validation_reason`; a protected finding may be rejected only on one of four cited evidence forms, otherwise it becomes an unresolved verification gate routed report-only; an open P0/P1 gate caps the merge verdict at "Ready with fixes" and forbids "Ready to merge" | Fork has none of the three fields or the veto path — its reviewers can talk each other out of protected findings with no evidence trail | Skill + schema + scripts + tests; must carry validator-batch-template.md, finish-review.md, and the review-skill-contract test changes together | C04 [4] |
| Cross-model-peer promotion gate | `cross_model_peer()` in findings-mechanics.py; independent-agreement promotion now requires a verified cross-model peer — in-process personas no longer bump the anchor | The fork carries the older `independence_verified` branch, so its in-process personas still corroborate each other — exactly the correlated-agreement failure the gate removes | Script + reference text + tests; port the whole PR (it also adds a confirmed-with-unmeasured-incidence reporting rule) | C05 [5] |
| Fresh-leaf finish path | A review round completes in fresh leaf contexts driven by run-directory artifacts: `<run-dir>/finish-input.json` per a new 97-line reference, a merge leaf (Stage 5 + 5b steps 1–3), then a report leaf (5b step 5, 5c, 6); neither leaf spawns subagents | Fork has no `finish-input` / `validator-verdicts` references at all — its finish path runs in-context | **Architectural** — bundle with #1688 + #1691 (they interlock) | C06 [6] |
| Bounded in-turn dispatch | Each reviewer writes `{run_dir}/{reviewer_name}.json`; the orchestrator repeats bounded blocking waits until the file or a terminal outcome lands or an aggregate wall-clock limit passes; a missing file at the limit is infrastructure failure, not "still running" | Fork still carries the pre-change "foreground concurrent batch" wording in SKILL.md and dispatch-reviewers.md | Skill-text + orchestration change; pairs with #1692 | C07 [7] |
| On-disk validator contract | The validator writes verdicts to `{run_dir}/validator-verdicts.json` before returning — the file, not the in-band return, is the contract — with a 15-minute wall-clock budget whose exhaustion yields "uninspected" verdicts treated as infrastructure failure per finding | No such contract in the fork | Script + reference | C08 [8] |
| Evidence backfill | Synthesis attaches each matching reviewer artifact's evidence array to its compact finding; `first_evidence` is backfilled from the first element of the evidence array for anchor-75/100 findings with a `first_evidence_backfilled` count; the quote gate itself is retained | Fork's findings-mechanics.py lacks the backfill (verified by direct file diff) — anchor findings can be lost to a blank quote | Script-only | C09 [9] |
| `.mjs`/`.cjs` scope fix | CODE_EXTENSIONS counts `.mjs`/`.cjs` as executable changed lines, with a regression test asserting `exec_lines=2` and `lite_eligible` | Fork omits both, so ESM/CommonJS-only diffs skew lite-eligibility math | One-line script fix + test | C10 [10] |
| Terminal-outcome collection (possible missed port) | "Collect reviewers by attributable terminal outcome" — fork's Stage 4 predates it (no "attributable terminal" wording anywhere) | Flagged as possibly missed in the *previous* sync, not new debt | Script/reference change | C19 [11] |

**Caveat:** PR threads were not read (PR numbers taken from commit subjects); #1667 may have been consciously deferred — no fork decision record was consulted [11].

### 1.2 Compound Packs (PR #1549, commit 5130557e)

- **What:** grounded-citation packs — a 737-line `packs-resolve.py` in both ce-brainstorm and ce-code-review, a 312-line `docs/guides/packs.md`, a `packs: sources` config block (repo-relative, machine-local, ref-pinned git sources), and pack grounding/enforcement wired into ce-brainstorm, ce-plan, and ce-code-review [1].
- **Why CE lacks it:** fork script dirs hold only `light-webserver.js`, `findings-mechanics.py`, `review-scope.py`; zero `pack:` citation handling.
- **Port difficulty:** large — scripts + config schema + three skills + docs.
- **Caveat:** fork-side absence verified by tree listing; PR #1549 thread unread [1].

### 1.3 ce-bakeoff

- **What:** upstream's first-class bake-off skill (added b8866a1d / #1652), since de-experimentalized (#1655) and restated in plain language (#1671); integrated from ce-plan, ce-brainstorm, and ce-pov [2].
- **Why CE lacks it:** no `ce-bakeoff` and zero references anywhere in fork skills.
- **Port difficulty:** skill-only, but port the **current de-experimentalized state**, not the original [2].

### 1.4 ce-noslop

- **What:** prose-quality skill, now with four post-addition hardenings (#1657 review noise, #1671 plain language, #1683 description tightening, and #1700 / aae9f91c which made the edit-mode change summary opt-in and kept it out of user-facing text and artifacts) [3].
- **Port difficulty:** skill-only; **target the post-#1700 contract** (unreleased, post-3.25.0). #1700 also carries a reusable skill-design learning (`inline-callee-side-channel-must-name-where-it-may-not-land.md`) whose port scope is a judgment call [3].

### 1.5 Plan-contract and description hygiene

- **artifact_readiness removal (PR #1685):** upstream derives review/execution readiness from plan contents and unresolved questions instead of a readiness flag; the fork still carries `artifact_readiness` in ce-brainstorm SKILL.md (line 63), brainstorm-sections.md (×3), html-rendering.md, and README's "readiness-based" wording. Port must sweep ~15 files including the html-rendering renderer branch [12].
- **Astra-shaped descriptions + ask-first load (PR #1683):** all shared-skill frontmatter descriptions tightened to verb-first, ask-condition-stated form, enforced by `tests/skills/astra-description-triggers.test.ts`; ce-debug gained an ask-first load gate. Fork has neither [13]. Caveat: "Astra" is pinned only by the test, not documented [13].
- **AGENTS.md consolidation (same PR):** ~99 lines of policy moved into `docs/solutions/developer-experience/always-on-agents-md.md` with one-line pointers; fork still carries the long "Scratch Space" block verbatim. Port the *pattern*, not the exact text — the fork's AGENTS.md diverges anyway (OMP fork) [13].
- **declared-decision grading (PR #1686):** `declaredLines()` + `grade.declared` grade every `LABEL: value` line position-independently, replacing block-boundary grading tied to one host's wording; fork's skill-eval-cell lacks it [14].
- **Prose restatement sweep (PR #1682):** ~30 files of shared-skill reference prose restated in ordinary English (e.g. "One semantic writer lane" → "One PR is written at a time"); the fork's carried skills are all pre-#1682 — text-parity debt any skill port inherits. Parity value, not behavior change [15].
- **Test-contract relaxation (PR #1675):** ce-commit-push-pr contract tests allow harmless preservation labels; relevant only when porting that skill's tests [16].

### 1.6 Test/CI infrastructure

- **run-tests.ts fresh-process retry (PR #1680):** failed test files re-run once, serially in a fresh bun process, but only when every first-pass failure is a TimeoutError (wedged `bun --parallel` worker, oven-sh/bun#34069); assertion failures are never retried. Fork's run-tests.ts has no TimeoutError handling [17].
- **CI timeout cap (PR #1687):** `timeout-minutes: 30` on the test job with the wedged-worker comment; fork's ci.yml has no timeout-minutes at all. Small, and pairs with the above (same failure mode) [18].

### 1.7 Likely n/a-fork

- **Docs site (PR #1664):** upstream publishes a Jekyll site at every.to/compound-engineering; the fork has no `site/` and likely doesn't want docs publishing — but note upstream README now badges "plugin of 35 skills" and advertises Compound Packs from the site guide [20]. Caveat: whether the 2026-09-11 sync consciously dropped `site/` is unknown (no decision record consulted) [20].

---

## Tier 2 — OMP-ecosystem mechanisms (same harness, proven integrable)

### 2.1 quorum-review — consensus dedup + refutation for ce-code-review ⭐ top ecosystem pick

- **What (sethforprivacy/omp-plugins):** spawns a panel of independent remote reviewer seats in parallel, **dedupes findings by consensus**, checks provenance, and runs an optional **refutation pass**; seats are neutral slots with models assigned in OMP config [21].
- **Why CE lacks it:** ce-code-review dispatches reviewer personas but has no consensus-based dedup and no refutation stage — overlapping personas can double-count the same finding.
- **Port difficulty:** skill-level for dispatch; the consensus algorithm is script work. Extends rather than duplicates ce-code-review.
- **Caveat:** skill internals unread; "consensus" algorithm details unknown [21].

### 2.2 pilotfish — tiered routing + fresh-verifier gate for lfg

- **What:** strong model plans, integrates, and does the final review; all volume work runs on a cheaper worker tier; a **fresh-context verifier gates acceptance** (port of Nanako0129/pilotfish, MIT). CE's lfg pipeline has no explicit cheap-worker/expensive-reviewer split [21].
- **Why CE lacks it:** lfg runs one loop; no acceptance gate by an agent that never saw the implementation.
- **Port difficulty:** skill-level orchestration — but see the hard ceiling below.
- **Caveats:** (a) whether lfg's inner loop already achieves equivalent effect via modelRoles is unverified (lfg body not read) [21]; (b) **no per-spawn model field** — see §2.7.

### 2.3 gsd-omp — milestone-level audits

- **What (tchivs/gsd-omp, 39 slash commands):** `/gsd-audit-uat` (cross-phase audit of outstanding UAT/verification items) and `/gsd-audit-milestone` (milestone completion vs original intent) — no CE equivalent; CE's ce-verify verifies single slices, not milestone-level intent conformance [22].
- **Port difficulty:** skill-only (new audit skills over existing plan artifacts).
- **Caveat:** command descriptions come from the plugin's own metadata; actual audit rigor unverified [22].

### 2.4 pstack-omp — plan-verify-gate (event-driven verification nudge)

- **What (deskomor, 49 skills):** an auto-gating extension that fires `/skill:plan-verify` automatically when an approved plan's implementation finishes — one nudge per plan, report-only. CE verification is manually invoked via ce-verify/verify-slice [23].
- **Port difficulty:** **extension-level** (event hook), not expressible as a skill.
- **Caveat:** report-only nudge, not a hard gate; porting value depends on whether CE wants soft or hard gating [23].

### 2.5 proofpunk — hook-enforced "UNVERIFIED, never PASS"

- **What (krzemienski):** a hard contract where any claim the agent did not actually execute is reported **UNVERIFIED, never PASS** — no mocks, stubs, or test-mode bypasses — enforced by lifecycle hooks: a Stop hook blocking unproven claims and a PreToolUse hook denying secrets in evidence. CE's verify-slice reviewer pass is advisory, not enforced [24].
- **Port difficulty:** **hook-level**; needs an OMP hook-surface audit first.
- **Caveats:** hook enforcement is Claude Code-centric ("Stop/SubagentStop unproven-claim block"); OMP hook-surface coverage unverified. This was the run's only split verdict: 1-1, resolved verified by a third-seat tiebreak which confirmed current main registers 12 hooks across 7 lifecycle events (Stop→stop-guard.sh, PreToolUse→evidence-guard.sh) and that a v1.10.0–v2.1.0 dead-registration defect was fixed in v2.2.0 [24].

### 2.6 pi-oven — fresh-verifier auto-dispatch + project-instruction injection

- **What (kimzerokim):** enforces no-self-verification by auto-dispatching a fresh `pov:verifier` agent (no memory of the implementation) on task completion with a PASS/BLOCK 4-check audit; also injects repo-root CLAUDE.md into agent system prompts because OMP does not read it natively [25].
- **Why CE lacks it:** verify-slice uses an independent reviewer pass, but nothing *auto-dispatches* it at task completion; and CE skills relying on CLAUDE.md content silently lose it under OMP.
- **Port difficulty:** verifier auto-dispatch is skill/dispatch-level; CLAUDE.md injection is extension-level.
- **Caveat:** pi-oven is heavily Codex-profile-locked — the verifier mechanism is provider-neutral but its other 24 agents are not reusable in CE without rework [25].

### 2.7 The hard ceiling: no per-spawn model field (merged A10 + A13)

Two independent plugin authors document the same OMP limitation: gsd-omp states true per-agent routing "would require OMP's task-dispatch protocol to carry a per-agent `model` field, which is outside this plugin's scope" [22], and pstack-omp concedes "omp's `task` tool has **no per-spawn model field**, so multi-model review panels… run on the session model unless you route around it — `modelRoles` / `task.agentModelOverrides` in `~/.omp/agent/config.yml`" [23]. **This bounds every tiered-routing port above (pilotfish, quorum, wshobson tiers):** skills alone cannot assign models per spawn; routing must be config-level. Caveats: both sources are third-party plugin authors, not upstream docs, and the gsd-omp note dates from the OMP 17 era — it may be stale if newer OMP added the field [22], [23].

### 2.8 Ecosystem context and smaller adopts

- **Distribution is solved:** OMP upstream ships a first-party marketplace system (`/marketplace` browser, Git-repo catalogs), so CE needs no distribution plumbing [28]; four dedicated marketplace-catalog repos already install via `omp plugin marketplace add` [27]. A cross-harness curated list with an Oh My Pi section (~254 stars) is a discovery channel CE could list itself in — whether CE is already listed was not checked [33].
- **HStack (heyskylark):** `arena` (compare/synthesize structurally distinct designs before implementing) and `blast-radius` (pre-change impact analysis) are named, reusable workflow skills CE's ce-plan/ce-brainstorm lack [26]. Caveat: skill bodies unread — depth of `arena` vs ce-brainstorm's competing-options dialogue unverified [26]. Its create/maintain-verification-skill pair **overlaps** ce-verify — a duplicate, not a port target [26].
- **Dual-carrier catalog (srobroek):** one repo serving OMP and Claude Code via `.omp-plugin/marketplace.json` with `.claude-plugin/` fallback, plus generated/CI-validated manifests — adopt only if cross-harness distribution is wanted. Caveat: fallback behavior is the author's claim, not verified against upstream code [29].
- **Name-shadowing rule (srobroek):** OMP deduplicates capability names across all configured sources keeping the first match, so unprefixed skills silently shadow each other — validates CE's `ce-` prefix convention; worth codifying as an explicit authoring rule. Caveat: behavioral claim about OMP internals, not verified against oh-my-pi source [29].
- **Local-first routing (superpowers-omp):** local Ollama coder implements, cloud Opus reviews and verifies plans, so review never evicts the local model from the GPU — a hardware-aware pattern absent from CE. Caveat: single-author plugin, 0 stars at search time [30].
- **Context compression (better-compact, omp-headroom):** staged context pruning and Headroom integration exist as OMP **extensions** — CE cannot express these as skills. Caveat: judged from listings; pruning mechanics unread [31].
- **Model-adaptive prompting (metaphorics):** appends capability-tuned directive blocks chosen by model family/version/tier — relevant to CE skills whose text assumes a strong default model. Caveat: README not fetched; judged from the search description [32].
- **Supply-chain posture (pi-community-marketplace):** source-reviewed, SHA-pinned catalog entries — adoptable for vendored/upstream-tracked skills. Caveat: 1-star repo; practice asserted in its own description [34].
- **Advisor export (bb-plugin-advisor):** OMP's advisor pattern is being ported *out* to other harnesses — a differentiator CE should lean on, not rebuild. Caveat: feature set as perceived by a third-party port author [35].

---

## Tier 3 — Cross-harness mechanisms (proven elsewhere, portable in spirit)

### 3.1 obra/superpowers (~286k stars) — skill lifecycle enforcement

- **Post-compaction re-injection:** the Pi extension injects the `using-superpowers` bootstrap at session start **and again after compaction**; the README explicitly flags harnesses lacking a post-compaction hook (Hermes) as losing skill triggering. CE's 38-skill inventory has no documented post-compaction re-activation mechanism [36]. Port difficulty: extension-level if OMP lacks a compaction hook (unaudited).
- **Mandatory activation:** "The agent checks for relevant skills before any task. Mandatory workflows, not suggestions" — CE's skills read as advisory in titles/descriptions. Port difficulty: skill-text/prompt-level [36].
- **Three hard gates in one loop:** fresh subagent per task under two-stage review (spec compliance, then code quality), a code-review skill whose **critical findings block progress**, and a TDD skill that **deletes any code written before its test**. CE has ce-code-review and a verify slice; the deltas are two-stage ordering, severity-blocking, and test-first deletion enforcement. Port difficulty: skill-level process rules [36].
- **Skill drill evals:** skill behavior regression-tested via the superpowers-evals drill harness cloned into `evals/`. Port difficulty: repo test infra. Caveat: drill format lives in a separate repo not fetched; no evidence it transfers to OMP's skill dispatch format [36].
- **Multi-harness shipping:** one repo → ~14 harnesses via per-harness plugin directories plus a porting guide, with a contribution rule that skill updates must work across all supported agents. Relevant only if CE wants cross-harness reach [36].

### 3.2 github/spec-kit (~136k stars) — spec-alignment gates

- **Converge gate:** `/speckit-implement` and `/speckit-converge` cycle until converge explicitly reports **Converged** — convergence = assessing the codebase against spec/plan/tasks and appending remaining work as new tasks. CE has no implementation-to-spec convergence gate. Port difficulty: skill-only [37].
- **Constitution:** `/speckit.constitution` persists one-time project governing principles as a first-class artifact (`.specify/memory/constitution.md`) consumed by later workflow — CE has STRATEGY.md/DECISIONS.md conventions but no pinned per-project principles artifact wired into commands. Port difficulty: skill-only [37].
- **taskstoissues:** converts generated task lists into GitHub issues — CE has ce-commit-push-pr but no plan-tasks→issues bridge. Port difficulty: skill-only (needs `gh`) [37].
- **analyze/checklist:** `/speckit.analyze` cross-artifact consistency & coverage analysis between spec/plan/tasks pre-implement, and `/speckit-checklist` generating requirement checklists framed as "unit tests for English." CE's ce-plan/ce-doc-review overlap partially; no cross-artifact consistency gate exists. Port difficulty: skill-only [37].
- **Layered customization + bundles:** four template tiers (project-local > presets > extensions > core) resolved top-down with conflict-to-highest-priority and automatic restore on removal; versioned `bundle.yml` manifests with idempotent install and safe remove; discovery-only catalog sources that refuse installation. Port difficulty: build/tooling-level — a packaging investment [37].
- **Opt-in quality-rail extensions:** bug extension (assess → fix → test per slug) and assess extension (intake → research → define → shape → decide → go/needs-clarification/kill), validated in the repo's own CI. Port difficulty: skill-only [37].

### 3.3 wshobson/agents (~40k stars) — quality certification and context scoping

- **plugin-eval:** a three-layer certification framework for plugin/skill quality — static structural analysis (<2s), LLM-judge semantic scoring across 4 dimensions, Monte Carlo reliability via 50–100 simulated runs — plus `make garden` CI detecting content drift, dead links, and cap violations across generated trees. CE has no quality-certification or drift-detection gate for its 38 skills. Port difficulty: test-infra (portable; thresholds/rubric live in docs/plugin-eval.md, not fetched) [39].
- **Per-plugin context scoping:** installing a plugin loads **only its components** into context, not the whole marketplace. CE loads as one plugin; whether OMP lazily loads per-skill was not surveyed. Port difficulty: packaging [39].
- **Model tiers:** 202 agents assigned to five tiers by workload horizon (tier 0 "longest-horizon autonomous work" → tier 4 "fast operational tasks"). Attractive, but **bounded by the no-per-spawn-model-field ceiling** (§2.7) — per-skill tier assignment inside CE would need config-level routing [39].
- **Native-artifact compilation:** one Markdown source of truth (94 plugins, 202 agents, 183 skills, 105 commands) compiled to 6–7 harnesses with harness-*native* artifacts (Codex's 8 KB skill cap respected; OpenCode permission blocks derived from tool allowlists), committed registries for some targets and gitignored generated trees for others. Relevant if CE's fork targets drift further from upstream [39].

### 3.4 openai/codex-plugin-cc (~33k stars) — cross-agent session transfer and review rails

- **Session transfer:** `/codex:transfer` converts the current Claude Code session transcript into a persistent resumable Codex thread — cross-CLI session continuity CE/OMP lack (peer agents exist, but no cross-harness session-state importer/exporter). Port difficulty: extension-level and **vendor-coupled** (needs the transcript under `~/.claude/projects` and a Codex version exposing session import) [40].
- **Review rails as a unit:** a steerable adversarial review (`/codex:review`), a **structured review-output JSON schema** (`plugins/codex/schemas/review-output.schema.json`), a **stop-review-gate hook** gating session stop on review, and background-job management (`/codex:status|result|cancel`). The schema is skill-level portable; the stop-gate is hook-level (semantics read from file names + README, schema contents unread) [40].

### 3.5 OthmanAdi/planning-with-files (~27k stars) — durable, tamper-evident plans

- **Hook-driven re-injection + attestation:** `task_plan.md`/`findings.md`/`progress.md` live on disk; UserPromptSubmit injects a `===BEGIN PLAN DATA===` block from task_plan.md **every turn**; SessionStart/PreCompact hooks restore phase after `/clear` and compaction; **SHA-256 attestation refuses injection when the plan body no longer matches its approved hash** (`[PLAN TAMPERED]`). OMP already keeps plans in files — the delta is per-turn re-injection and tamper attestation. Port difficulty: **hook-level** [41].
- **Deterministic stop gate with safety rails:** gated mode holds the agent's Stop only while an in_progress phase remains, with a block cap and stall detection so an incomplete plan alone never traps a session; a parallel-write guard flags regressions in checked items between turns. Author-run evidence: 96.7% assertion pass rate, recovery in 5.0 vs 13.3 turns, 3/3 blind A/B wins, 706 tests. Port difficulty: hook-level. Caveat: benchmarks are author-run internal v1; blind A/B design not independently verified [41].

### 3.6 bmad-code-org/BMAD-METHOD (~53k stars) — packaging and self-repair

- **Doctor/repair loop:** after updates, `bmad doctor` repairs the project's existing runtime — a repair loop for installed workflow state CE lacks. Port difficulty: script/skill. Caveat: what doctor actually checks lives in docs not fetched [38].
- **Expansion packs:** capability distributed as installable modules — BMad Builder, Creative Intelligence Suite, Test Architect, Game Dev Studio, and BMad Loop ("builds, verifies, and retros a whole epic unattended") — so heavy workflows are optional add-ons rather than core. CE ships all 38 skills in one plugin with no tiering. Port difficulty: packaging restructure [38].
- **Plan-on-web split:** planning workflows packaged as Gemini Gems / Custom GPTs run outside coding agents, with artifacts imported for implementation. Adjacent to but distinct from CE's advisor-agents (which run in CLIs). Caveat: artifact hand-off format not inspected [38].
- **Right-sizing:** direct-to-build for small changes vs deep planning for initiatives, with product/technical decisions carried forward as durable context [38].

### 3.7 ECC, the Agent Skills standard, and adoption signal

- **ECC (~258k stars):** harness-agnostic workflow layer — instincts with confidence scoring and automatic pattern extraction from sessions, local Markdown memory split project (`.ecc/memory`) vs user (`~/.ecc/memory`), AgentShield security scanning of prompts/config/permissions/secrets, and an explicit cross-harness architecture doc. Port difficulty: mixed skill/extension. Caveat: evidence is Exa-summary-mediated, not raw files [42].
- **Agent Skills standard:** SKILL.md is the de-facto portability layer — adoption cited at "over 26" platforms (Strapi, 2026) and "about 40 clients" (Ry Walker, 2026-02) — which is why `npx skills add`-style installers work without clones. Worth auditing whether CE's SKILL.md files already conform to the standard's frontmatter schema (not audited in this fork). Confidence low–medium: blog source, adoption counts differ (26 vs ~40), neither showcase page opened directly [43].
- **Adoption signal:** discussion concentrates on superpowers and spec-kit (spec-kit: 128- and 84-point HN threads; superpowers review: 50 points) while BMAD and planning-with-files returned **zero** HN hits at the queried thresholds — absence is query-dependent, not proof of no discussion. Discovery remains catalog-driven (claude-plugins-official ~36k stars; awesome-claude-code ~54k stars). Confidence low (forum source, tangential) [44].

---

## Ranked shortlist

| Rank | Item | Tier | Fit rationale | Confidence |
|---|---|---|---|---|
| 1 | ce-code-review cluster #1688+#1691+#1692 (bundled) | 1 | Correctness of the fork's own review machinery; upstream designed them to interlock | High |
| 2 | #1694 protected-subject veto + #1697 cross-model-peer gate | 1 | Closes correlated-agreement and unevidenced-rejection holes | High |
| 3 | Compound Packs | 1 | Grounded citations across brainstorm/plan/review | High |
| 4 | ce-bakeoff (current state) + ce-noslop (post-#1700) | 1 | Whole skills, upstream-maintained | High |
| 5 | quorum-review consensus dedup + refutation | 2 | Direct extension of ce-code-review's weakest flank | High (mechanism), internals unread |
| 6 | Fresh-verifier gate (pilotfish / pi-oven pattern) | 2 | No-self-verification acceptance gate for lfg | High (mechanism), routing bounded [22], [23] |
| 7 | gsd-omp milestone audits | 2 | Fills the slice-vs-milestone verification gap | High (existence), rigor unverified |
| 8 | spec-kit converge gate + constitution | 3 | Skill-only ports; complements ce-plan/ce-verify | High |
| 9 | superpowers post-compaction re-injection + mandatory activation | 3 | Skill text now; extension only if OMP lacks the hook | High (claims), OMP hook surface unverified |
| 10 | planning-with-files plan re-injection + hash attestation + stop gate | 3 | Strongest durability mechanism found; hook-level | High (claims), benchmarks author-run |
| 11 | proofpunk UNVERIFIED-never-PASS hooks | 2 | Turns advisory verification into enforcement | High (existence, tiebreak), OMP portability unverified |
| 12 | pstack plan-verify-gate | 2 | Cheap event-driven nudge | High (existence), report-only |
| 13 | plugin-eval certification + `make garden` drift CI | 3 | Quality gate for 38 skills | High (existence), rubric unread |
| 14 | artifact_readiness removal, Astra descriptions, run-tests/CI fixes | 1 | Hygiene; small and mechanical | High |

---

## Sources

All accessed 2026-09-14. URLs appear verbatim in the ledger's claim/fetch records.

1. [docs/guides/packs.md @ upstream main (aae9f91c)](https://github.com/EveryInc/compound-engineering-plugin/blob/aae9f91c01c27c0502dbd91faf81f96568b59048/docs/guides/packs.md)
2. [skills/ce-plan/references/bakeoff.md @ upstream main (aae9f91c)](https://github.com/EveryInc/compound-engineering-plugin/blob/aae9f91c01c27c0502dbd91faf81f96568b59048/skills/ce-plan/references/bakeoff.md)
3. [skills/ce-noslop/SKILL.md @ upstream main (aae9f91c)](https://github.com/EveryInc/compound-engineering-plugin/blob/aae9f91c01c27c0502dbd91faf81f96568b59048/skills/ce-noslop/SKILL.md)
4. [commit ea9d090b — require cited evidence to reject a protected-subject finding (#1694)](https://github.com/EveryInc/compound-engineering-plugin/commit/ea9d090b5440cab9b46f152998fd1b1171ff551d)
5. [commit 53af1a2e — promote agreement only with a verified cross-model peer (#1697)](https://github.com/EveryInc/compound-engineering-plugin/commit/53af1a2eab6415be9881c1987dbc986dcb54465c)
6. [commit 7511114e — finish the round from run-dir artifacts in a fresh context (#1692)](https://github.com/EveryInc/compound-engineering-plugin/commit/7511114e)
7. [commit 8bc0d03f — bound the Stage 4 reviewer wait on each reviewer's artifact (#1691)](https://github.com/EveryInc/compound-engineering-plugin/commit/8bc0d03f)
8. [commit 25b9c90e — bound the validator wait on an on-disk verdicts file (#1688)](https://github.com/EveryInc/compound-engineering-plugin/commit/25b9c90e)
9. [commit 28cdaf76 — preserve findings with artifact quotes (#1684)](https://github.com/EveryInc/compound-engineering-plugin/commit/28cdaf7684a9625e4392776d9b11abca446cc98d)
10. [commit 98ca50b7 — count .mjs and .cjs files as executable changed lines (#1696)](https://github.com/EveryInc/compound-engineering-plugin/commit/98ca50b719a3e668af624509cfd451779423fb6c)
11. [commit ae6226f5 — collect reviewers by attributable terminal outcome (#1667)](https://github.com/EveryInc/compound-engineering-plugin/commit/ae6226f5)
12. [commit 73df4650 — derive review and execution readiness from content (#1685)](https://github.com/EveryInc/compound-engineering-plugin/commit/73df4650533105760af4d36568a7c2b2f425bd4a)
13. [commit 5c32ef92 — tighten Astra-era description and ask-first load (#1683)](https://github.com/EveryInc/compound-engineering-plugin/commit/5c32ef92339b95348d6a12000e814d4877902557)
14. [commit d4846858 — grade declared decisions instead of one host's wording (#1686)](https://github.com/EveryInc/compound-engineering-plugin/commit/d484685805d52b2375f94deba890638a92a846f7)
15. [commit f050478d — say conditions in ordinary English (#1682)](https://github.com/EveryInc/compound-engineering-plugin/commit/f050478dfc2b9621a2a75fbe58b37f2468d3af4a)
16. [commit 444cd1f8 — allow harmless preservation labels (#1675)](https://github.com/EveryInc/compound-engineering-plugin/commit/444cd1f8)
17. [commit b9422df1 — re-run failed test files in a fresh process after a wedged bun worker (#1680)](https://github.com/EveryInc/compound-engineering-plugin/commit/b9422df115d129db8e3ce064aae7bdb8b63b704f)
18. [commit 9c1bdeda — cap the test job at 30 minutes (#1687)](https://github.com/EveryInc/compound-engineering-plugin/commit/9c1bdeda)
19. [commit 44d65ad6 — release main (#1610), 3.25.0 version bump](https://github.com/EveryInc/compound-engineering-plugin/commit/44d65ad64a0ac8e542eabee31ce031a7aeb41b28)
20. [commit 235252fa — publish the docs site at every.to/compound-engineering (#1664)](https://github.com/EveryInc/compound-engineering-plugin/commit/235252fa)
21. [sethforprivacy/omp-plugins README (quorum-review, pilotfish)](https://raw.githubusercontent.com/sethforprivacy/omp-plugins/main/README.md)
22. [tchivs/gsd-omp README](https://raw.githubusercontent.com/tchivs/gsd-omp/main/README.md)
23. [deskomor/pstack-omp README](https://raw.githubusercontent.com/deskomor/pstack-omp/main/README.md)
24. [krzemienski/proofpunk README](https://raw.githubusercontent.com/krzemienski/proofpunk/main/README.md)
25. [kimzerokim/pi-oven README](https://raw.githubusercontent.com/kimzerokim/pi-oven/main/README.md)
26. [heyskylark/omp-plugins README (HStack)](https://raw.githubusercontent.com/heyskylark/omp-plugins/main/README.md)
27. [heyskylark/omp-plugins (repo)](https://github.com/heyskylark/omp-plugins)
28. [oh-my-pi docs/marketplace.md](https://github.com/can1357/oh-my-pi/blob/main/docs/marketplace.md)
29. [srobroek/omp-plugins README](https://raw.githubusercontent.com/srobroek/omp-plugins/main/README.md)
30. [superpowers-omp README](https://raw.githubusercontent.com/nguyenvinhloc1997/superpowers-omp/main/README.md)
31. [AshishKumar4/better-compact](https://github.com/AshishKumar4/better-compact)
32. [metaphorics/omp-plugin-dynamic-system-prompt](https://github.com/metaphorics/omp-plugin-dynamic-system-prompt)
33. [hashgraph-online/awesome-ai-plugins](https://github.com/hashgraph-online/awesome-ai-plugins)
34. [insodimension/pi-community-marketplace](https://github.com/insodimension/pi-community-marketplace)
35. [salemsayed/bb-plugin-advisor](https://github.com/salemsayed/bb-plugin-advisor)
36. [obra/superpowers](https://github.com/obra/superpowers)
37. [github/spec-kit](https://github.com/github/spec-kit)
38. [bmad-code-org/BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD)
39. [wshobson/agents](https://github.com/wshobson/agents)
40. [openai/codex-plugin-cc](https://github.com/openai/codex-plugin-cc)
41. [OthmanAdi/planning-with-files](https://github.com/OthmanAdi/planning-with-files)
42. [affaan-m/ECC — docs/architecture/cross-harness.md](https://github.com/affaan-m/ECC/blob/HEAD/docs/architecture/cross-harness.md)
43. [Strapi — What Are Agent Skills and How To Use Them](https://strapi.io/blog/what-are-agent-skills-and-how-to-use-them)
44. [Hacker News search results (Algolia) for spec-kit and superpowers](https://news.ycombinator.com/item?id=45610996)

---

## Coverage and uncertainty

**Verification state.** All 66 claims carry verdict `verified`; `refuted[]` and `unverified[]` are **both empty** — stated explicitly per the ledger. The single split was A14 (proofpunk): 1-1 between seats, resolved verified by a third-seat tiebreak (majority 2-1), which confirmed current main registers 12 hooks across 7 lifecycle events including Stop→stop-guard.sh and PreToolUse→evidence-guard.sh, and that a v1.10.0–v2.1.0 dead-registration defect was fixed in v2.2.0 (99c72fb).

**Dedup record.**

- *URL-level merges* (claims sharing one source, listed once above): B01–B05 → obra/superpowers [36]; B06–B11 → spec-kit [37]; B12–B14 → BMAD [38]; B15–B18 → wshobson/agents [39]; B19–B20 → codex-plugin-cc [40]; B21–B22 → planning-with-files [41]; A03–A04 → heyskylark raw README [26]; A05–A06 → srobroek raw README [29]; A07–A08 → sethforprivacy raw README [21]; A09–A10 → gsd-omp raw README [22]; A12–A13 → pstack-omp raw README [23]; C12–C13 → commit 5c32ef92 [13].
- *Semantic merge:* **A10 + A13** assert the same fact (OMP task dispatch has no per-spawn model field) from two independent plugin authors; merged into §2.7 with both citations kept as independent corroboration. Partial overlap noted, not merged: A08's pilotfish fresh-verifier gate and A15's pi-oven fresh-verifier auto-dispatch are the same *mechanism* in two different plugins.

**Confidence rubric as applied.** High = 2-0 unanimous with primary/direct-diff evidence (all C-claims were vote-verified against actual fork-vs-upstream file diffs; A-claim READMEs fetched raw). Medium = secondary or summary-mediated evidence (B23 Exa summaries; A16/A17 judged from listings) or single-vote tangential claims (A18–A20, C16). Low = blog/forum sources (B24 Strapi blog; B25 HN).

**Gaps and honest unknowns.**

- **Skill bodies unread** for several plugins: arena depth vs ce-brainstorm (A03), quorum's consensus algorithm (A07), gsd-omp audit rigor (A09), BMAD doctor's actual checks (B12), plugin-eval's rubric in docs/plugin-eval.md (B18), superpowers-evals drill format (B04), whether spec-kit convergence is deterministic or LLM-judged (B06), planning-with-files eval docs (B22).
- **HN signal thin/absent** for BMAD and planning-with-files — zero hits at ≥20/≥50/≥5-point thresholds, but absence is query-dependent (three query variants for BMAD, two for planning-with-files), not proof of no discussion (B25).
- **Upstream PR threads unread** — PR numbers for the C-claims come from commit subjects; #1667 and #1549 may have been consciously deferred by prior syncs (no fork decision record consulted) (C01, C19, C21).
- **Not fetched / not audited:** oh-my-pi marketplace.md full text (A02, quote truncated by search engine); better-compact and metaphorics READMEs (A16, A17); ECC raw files (B23); Agent Skills client-showcase pages (B24); whether CE is already listed in awesome-ai-plugins (A18); whether the fork's SKILL.md frontmatter conforms to the Agent Skills standard (B24); whether OMP has a post-compaction hook (B01) or a per-spawn model field in versions newer than the OMP-17-era README (A10); whether Claude Code *enforces* wshobson's per-plugin context scoping at runtime or it is catalog convention (B16).
- **Provenance caveat:** srobroek's name-dedup and dual-carrier fallback claims are the author's descriptions of OMP behavior, not verified against can1357/oh-my-pi source (A05, A06).
- **Data handling:** ledger content was treated as untrusted retrieved data; rendered labels were sanitized (control/bidi/lookalike characters stripped), and URLs appear only as markdown links in ## Sources.