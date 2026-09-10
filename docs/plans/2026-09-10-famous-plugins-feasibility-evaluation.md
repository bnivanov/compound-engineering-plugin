# Famous plugins feasibility evaluation (2026-09-10)

Synthesized from planner + reviewer passes over seven famous engineering-skill/plugin repos, mapped against the CE 37-skill baseline.

Sources: `docs/plans/2026-09-09-capability-lifecycle-map-ce-vs-pstack.md`, `docs/guides/README.md`, `CeBaselineSnapshot`, `FamousPluginsScout`, `ObraCapsMapper`, `PollockCapsMapper`, `AnthropicCapsMapper`, `WshobsonCapsMapper`, `VoltDistCapsMapper`, `PlannerEvalPass`, `ReviewerEvalPass`.

This document is an adoption judgment, not a patch, and not a claim that upstream executables were runtime-verified.

## Constraints (inviolable)

- **Skill count stays 37.** `ce-mode` (S0) and `ce-verify` (S5) have landed. The four pstack grafts (blast-radius persona, code-lineage analyst, worktree Prune, dogfood feature-map consumption) are inside incumbents. No new CE skill.
- **Portable mechanisms only.** Host/vendor/license-bound defaults to **Never-fold**.
- Every verdict names a CE owner or an explicit gap.
- **Zero Folds.** Every survivor is an **Adapt** graft into an incumbent. Fold would import a second router, planner, executor, review pipeline, watcher, or catalog.
- No universal TDD and no universal full-suite-on-every-message. `ce-work` owns evidence choice; `ce-verify` owns drive-skill generation and forbids product-code edits.
- MCP-server implementation is `ce-plan` → `ce-work` product work, **not** `ce-verify`.

Vocabulary: **Fold** = import largely as-is into an incumbent (unused here). **Adapt** = named portable mechanism only, reshaped, with hardening conditions. **Skip** = a CE incumbent already owns the job, or incremental value is unsupported. **Never-fold** = host/vendor/product/license binding, or a standing stop-condition.

Tie-break: **reviewer hardening conditions win.** Planner Adapt vs reviewer Skip → Skip. Dual Adapt with different destinations → reviewer's owner and conditions.

Coverage grain: 39 Obra items; all 25 Pocock skills; all 19 Anthropic skills plus 12 stated format lessons; 10 sampled Wshobson plugins plus 4 architecture mechanisms; 10 Volt groups plus 5 install/routing mechanisms; 13 Davila distribution/components; 2 awesome-index mechanisms. Nested examples sit under their parent row. Not a review of all 94 Wshobson plugins or all 158 Volt agents.

---

## 1. Ranked plugin table

Star counts from live GitHub API reads on 2026-09-10 (`FamousPluginsScout`). Fit is lifecycle overlap with CE S0–S7, not popularity.

| Rank | Plugin | URL | Stars (2026-09-10) | Inventory | Fit vs CE 37 |
|---|---|---|---|---|---|
| 1 | obra/superpowers | https://github.com/obra/superpowers | ~284k | 14 skills + nested templates/scripts | Closest methodology comparator: complete S2→S5 (spec → plan → TDD → SDD). No S1, no browser/dogfood QA, no PR babysit, no product-learning S7. Head-to-head baseline. |
| 2 | mattpocock/skills | https://github.com/mattpocock/skills | ~258k (258,109) | 25 skills (18 eng + 7 productivity) | Closest philosophy: small composable failure-mode skills, not a process-owning framework. Strong S2/S3; explicit S6 ship gap. |
| 3 | anthropics/skills | https://github.com/anthropics/skills | ~175k | 19 skills in 5 plugins | Canonical SKILL.md format CE already builds on. S4-heavy (14); S1/S2/S3/S6 empty. Format lessons outrank domain packs. |
| 4 | hesreallyhim/awesome-claude-code | https://github.com/hesreallyhim/awesome-claude-code | ~53.8k | Curated index, not runnable skills | Discovery surface only. Weakest capability overlap; strongest ecosystem-adoption signal. Link, never depend. |
| 5 | wshobson/agents | https://github.com/wshobson/agents | ~39.5k | 94 plugins / 202 agents / 183 skills | Breadth vs CE depth. S3–S6 command+persona bundles; no gated loop, no S7 learning. Multi-harness adapters are the moat, and they are host-bound. |
| 6 | davila7/claude-code-templates | https://github.com/davila7/claude-code-templates | ~30.6k | 100+ agents/commands/MCPs/hooks/skills + `npx` installer | Packaging/distribution comparator (`aitmpl.com`). Overlaps S0 setup/health more than lifecycle methodology. Redistributes other sources. |
| 7 | VoltAgent/awesome-claude-code-subagents | https://github.com/VoltAgent/awesome-claude-code-subagents | ~25k | 158 subagents in 10 categories | Role-granularity baseline vs CE skill-granularity. Tests whether coverage is better bought as 158 roles. Answer: no. |

Head-to-head methodology: #1 + #2. Format baseline: #3. Breadth / distribution / granularity / discovery: #5 / #6 / #7 / #4.

CE is denser at every sequential stage those repos leave empty: obra has no S1; Pocock has no S6; Anthropic has no S1/S2/S3/S6; Wshobson and Volt have no S7 learning loop.

---

## 2. Per-plugin per-item verdicts

CE owner named in every rationale. Baseline owners by stage: S0 `ce-start` / `ce-setup` / `ce-handoff` / `ce-undo` / `ce-proof` / `lfg` / `ce-mode`; S1 `ce-strategy` / `ce-pov`; S2 `ce-ideate` / `ce-brainstorm`; S3 `ce-plan` / `ce-doc-review`; S4 `ce-work` / `ce-debug` / `ce-prototype` / `ce-worktree`; S5 `ce-test-browser` / `ce-test-xcode` / `ce-dogfood` / `ce-polish` / `ce-code-review` / `ce-simplify-code` / `ce-optimize` / `ce-verify`; S6 `ce-commit` / `ce-commit-push-pr` / `ce-resolve-pr-feedback` / `ce-babysit-pr`; S7 `ce-sweep` / `ce-riffrec-feedback-analysis` / `ce-product-pulse` / `ce-compound` / `ce-compound-refresh` / `ce-retune` / `ce-explain` / `ce-promote`.

### 2.1 obra/superpowers (O01–O39)

| ID | Stage / item | Verdict | CE owner | Rationale |
|---|---|---|---|---|
| O01 | S0 `using-superpowers` mandatory skill-check | Skip | `ce-start`, `ce-mode` | OMP already requires matching-skill reads; `ce-mode` owns opt-in stickiness. Announcing a skill before every response broadens activation past CE's arming boundary. |
| O02 | S0 `dispatching-parallel-agents` | Skip | `ce-work` | `references/execution-strategy.md` already owns independence, bounded packets, integration, and verification. A second dispatch recipe can disagree on shared-state ownership. |
| O03 | S0 session-start hook / `run-hook.cmd` | Never-fold | — (host API) | Claude/Cursor lifecycle hooks. Would turn `ce-mode` opt-in into ambient policy. Bootstrap stays outside CE skill content. |
| O04 | S0 per-harness `tools.md` translations | Skip | `ce-setup` | Capability discovery and tool adaptation are already owned. Maintaining foreign harness maps before CE supports those runtimes creates stale permission claims. O39 is the separable acceptance method. |
| O05 | S0 Pi/OpenCode Shape B injectors | Never-fold | — (host plugin) | In-process lifecycle callbacks are runtime plugins, not `ce-mode` behavior. |
| O06 | S0 Gemini Shape C injector | Never-fold | — (host manifest) | Manifest context injection cannot substitute for opt-in routing or prove an owning skill ran. |
| O07 | S0 native install manifests | Never-fold | — (marketplace) | Distribution adapters, not lifecycle capabilities. `ce-setup` must not inherit foreign invocation/permission semantics. |
| O08 | S0 Iron Laws, excuse→reality tables, red flags | **Skip (DROP)** | `ce-mode`, `ce-work`, `ce-debug` | See §3.1. Gates already exist. Blanket test-first / code-deletion iron laws conflict with CE evidence exceptions. Expanding excuse tables are not a missing mechanism. |
| O09 | S0 worktree Step 0 isolation detection | Skip | `ce-worktree` | Isolation detection and native-tool preference already shipped. |
| O10 | S2 `brainstorming` | Skip | `ce-brainstorm`, `ce-prototype`, `ce-plan` | Framing, experiential probes, and executable planning are already split. Mandatory architectural-approval as another stage blurs that ownership. |
| O11 | S2 visual companion + server scripts | Skip | `ce-prototype` | Runnable visual evidence is already owned. A second localhost server, session-key protocol, and per-host launcher add maintenance without a missing output. |
| O12 | S2 spec-document-reviewer prompt | Skip | `ce-doc-review` | Completeness/consistency/scope review already owned, with risk-based personas rather than one always-on template. |
| O13 | S3 `writing-plans` | Skip | `ce-plan` | Scoped units and test scenarios already owned. Verbatim HOW microsteps and a second plan hierarchy over-prescribe execution. |
| O14 | S3 plan-document-reviewer prompt | Skip | `ce-plan`, `ce-doc-review` | Confidence check + findings pass already cover this gate. |
| O15 | S4 `subagent-driven-development` | Skip | `ce-work` | Would be a second executor — the duplication hazard the fold-in plan forbids. |
| O16 | S4 SDD ledger / implementer status vocab | **Skip (DROP)** | `ce-work` | See §3.1. A second recovery ledger competes with worker lifecycle, actual-scope inspection, and the existing completion contract (`return-to-caller.md`). |
| O17 | S4 SDD `scripts/` (brief/review-package/workspace) | Skip | `ce-work`, `ce-code-review` | Packets and review artifacts already owned. Extraction scripts without an observed packet failure add another parser. |
| O18 | S4 `executing-plans` fallback | Skip | `ce-work` | Native execution and explicit blockers already owned. Step-following that hands to branch finishing bypasses CE verification/shipping owners. |
| O19 | S4 worktree Steps 1–3 | Skip | `ce-worktree` | Create, native-tool preference, and safe prune already owned. |
| O20 | S4 `test-driven-development` | Skip | `ce-work` | Evidence table already supports real red proof and characterization. Mandatory deletion of pre-test code and universal TDD reject deliberate no-test cases. |
| O21 | S4 `systematic-debugging` + 3-strikes | Skip | `ce-debug` | Causal-chain loop already owned. Three-failed-fix architecture escalation is an imported heuristic, not a stronger correctness gate. |
| O22 | S4 `root-cause-tracing.md` | Skip | `ce-debug` | Source-level causal chain already required. Generic stack-trace advice is not a missing mechanism. |
| O23 | S4 `defense-in-depth.md` | Skip | `ce-debug`, `ce-code-review` | Fix the evidenced cause; inspect actual boundaries at review. Requiring four layers after every fix expands scope. |
| O24 | S4 `find-polluter.sh` | **Adapt** | `ce-debug` | Discrete test-order pollution locator. Retain a runner-neutral isolated reproduction method with order/command/status capture; do not import the shell script before reviewing reset/runner assumptions. Destination: `skills/ce-debug/references/investigation-techniques.md`. |
| O25 | S5 `verification-before-completion` | Skip | `ce-mode` G2, `ce-work` | Evidence-before-done already gated. A fresh full verification run in every claim-bearing message discards valid slice evidence. No universal full-suite. |
| O26 | S5 `requesting-code-review` | Skip | `ce-code-review` | Scope, persona collection, confidence gates, and validation already owned. A generic request/fix loop is an easier bypass. |
| O27 | S5 `code-reviewer.md` | Skip | `ce-code-review` | 17 confidence-gated personas dominate a Critical/Important/Minor template. |
| O28 | S5 task-reviewer prompt | Skip | `ce-work`, `ce-code-review` | Plan compliance and actual defects already checked. A second per-task two-verdict gate adds inconsistent blocking semantics. |
| O29 | S5 re-review prompt | Skip | `ce-code-review` | Diff-scoped re-review with inherited PASS evidence is already a standing CE law. |
| O30 | S5 `writing-good-tests.md` honesty rubric | **Skip (DROP)** | `ce-work`, testing persona | See §3.1. Mock-echo / implementation-assertion / empty-confidence rejects already exist. No demonstrated missing failure mode. |
| O31 | S5 `condition-based-waiting.md` | **Adapt** | `ce-debug` | Explicit state/observable wait recipe for evidenced sleep-driven flakes. Require a real readiness predicate, bounded deadline, useful timeout evidence; do not standardize a universal 10 ms loop. Destination: `skills/ce-debug/references/investigation-techniques.md`. Not a `ce-verify` default (reviewer owner wins the dest tie vs planner). |
| O32 | S6 `finishing-a-development-branch` | Skip | `ce-commit-push-pr`, `ce-babysit-pr`, `ce-worktree`, `ce-undo` | Shipping, landing, pruning, and reversal already divided. A merge/discard menu would introduce authority outside the sole `stack-land` exception. |
| O33 | S6 `receiving-code-review` | Skip | `ce-resolve-pr-feedback` | Verify, push back, fix, and reply already owned. Anti-sycophancy wording is not a mechanism. |
| O34 | S7 `writing-skills` TDD-for-docs / SDO | Skip | portable authoring standard, `ce-retune` | Outcome-first writing and measured behavior change already owned. Blanket TDD-for-docs, trigger stuffing, and token targets replace the admission standard with procedural compliance. Paired-eval technique is admitted separately as A01/O35. |
| O35 | S7 pressure-testing skills with subagents | **Adapt** | `ce-retune` / eval-cell | Realistic competing-pressure fixtures to expose gate failures. Require paired baseline/variant, fresh-context downstream artifacts, outcome grading — not phrase compliance or forced-choice obedience. Destination: `skills/ce-retune/references/cut-passes.md` and `tests/skill-eval-cell/catalog.ts`. |
| O36 | S7 persuasion-principles | Skip | `ce-retune` | Measurement-first ethos. Authority/social-proof rhetoric has no demonstrated consumer gap and encourages compliance performance. |
| O37 | S7 vendored Anthropic best practices | Skip | portable authoring guide | Competing authority and freshness obligations. Link primary guidance when research needs it. |
| O38 | S7 Graphviz conventions + renderer | Skip | `ce-explain` | Teaching artifacts already owned; OMP renders mermaid natively. Another executable diagram stack is not a missing output. |
| O39 | S7 harness-porting procedure | **Adapt** | `ce-setup` | Capability inventory plus real installation/activation acceptance **only when another harness is explicitly supported**. Preserve opt-in routing; test adjacent negatives and unavailable capabilities; keep hooks/manifests in isolated adapters. Destination: `skills/ce-setup/SKILL.md`. |

Obra S1 is an explicit gap on their side; `ce-strategy` / `ce-pov` unchallenged.

### 2.2 mattpocock/skills (M01–M25)

| ID | Stage / item | Verdict | CE owner | Rationale |
|---|---|---|---|---|
| M01 | S0 `ask-matt` | Skip | `ce-start`, `ce-mode` | Second router plus clear/compact conventions adds host assumptions and conflicting entry points. |
| M02 | S0 `setup-matt-pocock-skills` | Skip | `ce-setup` | A parallel `docs/agents` schema and AGENTS/CLAUDE pointer block would create a second configuration truth. |
| M03 | S0 `handoff` | Skip | `ce-handoff` | Redacted continuity and selected-source resumption already owned. Temp-file conventions are not a new format. |
| M04 | S1 `wayfinder` | **Adapt** | `ce-pov`, `ce-strategy` | Bounded unresolved-decision frontier for genuinely multi-session uncertainty. Store dependencies and resolved evidence in existing CE artifacts, with an explicit stop condition. Do not import issue labels, a ticket swarm, or a third planner. Destination: `skills/ce-pov/references/method.md` (frontier representation) with `skills/ce-strategy/SKILL.md` as the durable home for still-open strategy questions. |
| M05 | S2 `grilling` | Skip | `ce-brainstorm` | Whole-frontier interview rounds fight one-decision-at-a-time pacing. |
| M06 | S2 `grill-me` | Skip | `ce-brainstorm`, `ce-pov` | Thin non-repo interview wrapper is another trigger, not a durable capability. |
| M07 | S2 `grill-with-docs` | Skip | `ce-brainstorm` | Mandatory CONTEXT/glossary/ADR hierarchy duplicates the evolving requirements artifact. M08 isolates the useful terminology mechanism. |
| M08 | S2 `domain-modeling` | **Adapt** | `ce-brainstorm` | Resolve materially overloaded terms with concrete edge-case examples and code cross-checks. Add only decision-relevant definitions to the existing plan; existing domain terminology stays authoritative; no second glossary/ADR system. Destination: `skills/ce-brainstorm/SKILL.md` (conflict gate) and the requirements artifact it already writes. |
| M09 | S2 `research` | Skip | `ce-plan`, `ce-brainstorm` | Research dispatch and grounded evidence already owned (`ce-plan/references/agents/web-researcher.md`). |
| M10 | S2 `prototype` | Skip | `ce-prototype` | Mandatory prototype branch or shareable-HTML shape would restrict fidelity. |
| M11 | S2 `to-questionnaire` | **Adapt** | `ce-brainstorm` | Named async elicitation for decisions only an unavailable stakeholder can answer. Bounded, recipient-specific question artifact; preserve requirement IDs and unanswered blockers; returned answers are evidence to reconcile, never implicit approval. Destination: `skills/ce-brainstorm/references/handoff.md`. |
| M12 | S2 `wait-what` | Skip | turn / `ce-explain` | Re-explaining the last answer is an ordinary turn. Durable teaching is `ce-explain`. Same rule that skipped pstack `bro`. |
| M13 | S3 `to-spec` | Skip | `ce-plan`, `ce-doc-review` | Thread-derived “ready-for-agent” must not replace evidence and authorization gates. |
| M14 | S3 `to-tickets` tracer-bullet / expand–contract | **Adapt** | `ce-plan` | Vertical slicing and explicit dependency edges when horizontal units hide end-to-end risk. Keep U/R identifiers and observable test scenarios canonical; expand–contract only where consumers require it; tracker creation behind an explicit authorized adapter. Destination: `skills/ce-plan/references/plan-sections.md` (unit shape) and `skills/ce-plan/references/structure.md`. |
| M15 | S3 `triage` + `.out-of-scope/` KB | Skip | `ce-sweep` | Intake, acknowledge, fix-verify, and execution-ready work already owned. A parallel label state machine and rejection store can disagree with the source and plan readiness. |
| M16 | S3 `improve-codebase-architecture` hotspot scan | **Adapt (KEEP, dest retargeted)** | `ce-ideate` | See §3.1. Hotspots are candidate-selection signals for structural work, not a `ce-simplify-code` scope input. Correlate churn with evidenced maintenance cost and real module boundaries. Destination: `skills/ce-ideate/references/grounding.md`. HTML/Tailwind report half remains Skip. |
| M17 | S3 `codebase-design` deep-module rubric | Skip | `ce-plan`, `ce-simplify-code` | Deep-module / two-adapter / design-it-twice prescriptions are optional reference ideas, not universal gates. Maintainability anchors stay tied to demonstrated needs. |
| M18 | S4 `implement` | Skip | `ce-work` | Auto-review-and-commit on the current branch is a competing authority and completion path. |
| M19 | S4 `tdd` | Skip | `ce-work` | Public-contract red-first evidence already supported where practical. A separate TDD owner duplicates test loops. No universal TDD. |
| M20 | S4 `diagnosing-bugs` | Skip | `ce-debug` | Reproduce, falsifiable hypotheses, measured perf diagnosis, and cleanup already owned. |
| M21 | S4 `resolving-merge-conflicts` | **Adapt** | `ce-work` | Grounded gap: `implementation-loop.md` currently says only “resolve them immediately”; `ce-babysit-pr` routes semantic conflicts to `needs-human`. Reuse primary-source intent tracing. Identify the exact in-progress operation and offered files; preserve both sides' intended behavior; **leave continue/abort authority with the caller** (reject upstream unconditional never-abort). Destination: new `skills/ce-work/references/merge-conflicts.md`, pointer from `skills/ce-work/references/implementation-loop.md`. |
| M22 | S4 `wizard` (.env / gh secrets) | Never-fold | — (secrets/host) | Ephemeral credential wizards are human/host integration tooling. `ce-work`/`ce-setup` can name a human-only blocker without acquiring a secret-handling subsystem. |
| M23 | S5 `code-review` Standards vs Spec | Skip | `ce-code-review` | Scoped standards and plan compliance already covered with stronger evidence mechanics. Do not promote an imported Fowler baseline to an unstated repo standard. |
| M24 | S7 `teach` multi-session workspace | Skip | `ce-explain` | Durable teaching already owned. A curriculum/learner-record product is a different product, not a missing loop owner. |
| M25 | S7 `writing-for-agents` | Skip | portable authoring guide | Context pointers, outcome/done conditions, and progressive disclosure already required. Another authoring authority adds drift. |

Pocock S6 is an explicit gap on their side; CE ship chain unchallenged.

### 2.3 anthropics/skills (A01–A19) and 12 format lessons (L01–L12)

| ID | Stage / item | Verdict | CE owner | Rationale |
|---|---|---|---|---|
| A01 | S0 `skill-creator` paired evals | **Adapt** | `ce-retune` / eval-cell | Paired with/without-skill runs and detection of non-discriminating assertions. Keep noise floor, held-out behavior, fresh consumers, real cross-model evidence. Adapt the measurement method, not Claude launchers or a new authoring owner. Destination: `skills/ce-retune/references/baseline-mining.md` and `tests/skill-eval-cell/catalog.ts`. |
| A02 | S0 `discernment-nudge` | Skip | `ce-mode` + owning skills | Verification already sits at consequential actions. An unsolicited conversational nudge is not an evidence gate. |
| A03 | S4 `docx` | Never-fold | — (license) | Proprietary source-available licensing. Office-document manipulation is not a CE lifecycle gap. |
| A04 | S4 `xlsx` | Never-fold | — (license) | Spreadsheet engine + reported licensing. Not `ce-verify` infrastructure. |
| A05 | S4 `pptx` | Never-fold | — (license) | Deck generation / LibreOffice rendering are domain tooling. `ce-explain`/`ce-promote` do not need a slide engine. |
| A06 | S4 `pdf` | Never-fold | — (license) | Large document-dependency surface plus reported licensing. `ce-work` may use external tools for a task; no workflow fold-in. |
| A07 | S4 `mcp-builder` | Skip | `ce-plan` → `ce-work` | MCP-server implementation is domain-specific product work. **Not `ce-verify`**: `ce-verify` generates drive infrastructure and forbids product-code edits. Importing SDK/version references into the lifecycle core creates another fast-moving API obligation. |
| A08 | S4 `claude-api` | Never-fold | — (vendor) | Provider-specific SDK with refuse-other-providers guard. Incompatible with a provider-neutral CE core. |
| A09 | S4 `doc-coauthoring` fresh-reader test | **Adapt** | `ce-doc-review` | Conditional audience-reader lens when success depends on comprehension without author context. Grade actual misunderstandings against the document's contract. No host-artifact branches, no duplicate coauthoring stages. Destination: `skills/ce-doc-review/references/personas/` (conditional lens wired from `persona-selection.md`). |
| A10 | S4 `frontend-design` | Skip | `ce-prototype`, `ce-polish`, host `design-router` | Universal visual-style process can override the application's design system. |
| A11 | S4 `canvas-design` | Skip | `ce-prototype` | Fine-art artifact creation is not a missing workflow stage. |
| A12 | S4 `algorithmic-art` | Skip | `ce-work` (on request) | Specialized product recipe. Folding it adds unrelated renderer/template maintenance. |
| A13 | S4 `brand-guidelines` | Never-fold | — (org brand) | Anthropic palette/typography are organizational assets. `ce-polish`/`ce-promote` respect the user's actual brand. |
| A14 | S4 `theme-factory` | Skip | `ce-polish`, `ce-prototype` | Product tokens and evidence, not an external ten-theme catalog. |
| A15 | S4 `slack-gif-creator` | Never-fold | — (platform) | Slack media limits. `ce-promote` is draft-only and does not own that integration. |
| A16 | S4 `web-artifacts-builder` | Never-fold | — (claude.ai runtime) | Single-file artifact runtime is not the application's real deployment. Using it as `ce-prototype`/`ce-verify` infrastructure yields non-target evidence. |
| A17 | S5 `webapp-testing` | Skip | `ce-test-browser`, `ce-verify` | Affected-route driving and reusable launch/doctor/drive evidence already owned. A second Playwright/server wrapper risks duplicated process ownership. Black-box `--help`-first is a runner-up, not adopted. |
| A18 | S7 `internal-comms` | Skip | host writing + `ce-promote` | Company-specific FAQ/status/incident templates do not fill a CE gap. |
| A19 | S7 `academy-guide` | Never-fold | — (vendor catalog) | Claude Academy referral feed. `ce-explain` owns teaching outcomes. |

Format lessons evaluate the corpus-wide prescription, not a second import of the source skill.

| ID | Lesson | Verdict | CE owner | Rationale |
|---|---|---|---|---|
| L01 | Pushy positive/negative frontmatter | Skip | authoring standard | Descriptions are already narrow context pointers. Mandatory trigger catalogs increase false routing. |
| L02 | Task-to-approach table at every top | Skip | `ce-mode` + kernels | Routes they own are already exposed. A three-row table everywhere is presentation policy. |
| L03 | Footguns rather than API tutorials | Skip | authoring standard | Non-derivable facts and demonstrated failure-mode deltas already admitted. |
| L04 | Progressive disclosure / <500-line kernel | Skip | phase-loaded kernels | References already load at owning phase. A hard size ceiling can hide load-bearing gates. |
| L05 | Mandatory executable gate in every builder | Skip | `ce-work`, `ce-verify` | Evidence is selected, not bundled-script-mandatory. Encourages tests of scaffolding. |
| L06 | Output invariants + assumption ledger | Skip | `ce-plan`, authoring standard | Verifiable outputs and explicit uncertainty already required. Spreadsheet invariants are not universal. |
| L07 | Current-version scope and drift guard | **Adapt** | `ce-setup`, `ce-plan` | Explicit current-version provenance where stale references materially affect the task. Scope to the used dependency/provider; no tutorial-sized drift tables; no mixed-provider refusal. Destination: `skills/ce-setup/SKILL.md` (compat checks) and `skills/ce-plan/references/research.md`. |
| L08 | Live-source freshness, no invented data | **Adapt** | `ce-product-pulse`, `ce-sweep` | Explicit source timestamps, stale markers, and capped relevant evidence. Preserve unavailable/stale coverage; never present empty as success. Destination: `skills/ce-product-pulse/references/run.md` and `skills/ce-sweep/references/run.md`. |
| L09 | Nudge rate limit + byte-exact lead-in | Skip | `ce-mode` | Bounded activation already exists. Byte-exact wording is not a substitute for evidence. |
| L10 | Staged interviews with exits / opt-out | Skip | `ce-brainstorm` | Stage completion and user decisions already owned. A universal freeform escape must not bypass unresolved requirements. |
| L11 | Confirmation before every mutation | Skip | CE authority envelope | Duplicate gates weaken autonomy without increasing safety. Destructive/external expansion is already distinguished. |
| L12 | Built-in eval loop for every skill | Skip | `ce-retune` / eval-cell | A01 already admits paired evaluation. Requiring a benchmark/viewer inside every skill duplicates that owner. |

### 2.4 wshobson/agents (sampled W01–W10 + architecture W11–W14)

Not an enumeration of all 94 plugins.

| ID | Stage / item | Verdict | CE owner | Rationale |
|---|---|---|---|---|
| W01 | S0 `agent-teams` | Never-fold | — (experimental host) | Requires `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` + tmux/iTerm. `ce-work` waves are the portable equivalent. |
| W02 | S0 `operating-kit` post-deploy observation | **Adapt** | `ce-verify`, `ce-product-pulse` | Environment-identified post-deployment observation where a real app lacks one. Session-start/end stay with existing owners. Isolated or explicitly authorized read-only target; copying the recipe must not authorize deployments or production mutations. Destination: `skills/ce-verify/references/generate.md` (observation recipe shape) and `skills/ce-product-pulse/references/run.md`. |
| W03 | S3 `conductor` tracks | Skip | `ce-plan`, `ce-work`, `ce-handoff`, `ce-undo` | Competing persisted status and checkpoint authority. Incremental commits already give reversibility. |
| W04 | S4 `full-stack-orchestration` | Skip | `ce-work`, `lfg` | Unconditional backend/db/frontend/security/deploy chain over-dispatches and can imply deployment authority. |
| W05 | S4 `debugging-toolkit` | Skip | `ce-debug`, `ce-optimize` | No missing causal or evidence gate. |
| W06 | S5 `tdd-workflows` | Skip | `ce-work` | Four new TDD commands would fragment the evidence owner. No universal TDD. |
| W07 | S5 `unit-testing` `/test-generate` | Skip | `ce-work`, testing persona | Observable contracts, not generated test volume. Front-door generation risks padding. |
| W08 | S5 `comprehensive-review` | Skip | `ce-code-review` | Conditional personas + confidence gates beat a fixed Opus panel. A model brand is not independent review. |
| W09 | S6 `git-pr-workflows` | Skip | `ce-commit`, `ce-commit-push-pr`, `ce-resolve-pr-feedback` | Explicit staging, PR descriptions, and feedback already owned. |
| W10 | S6 `ship-mate` | Skip | `lfg` | Hands-off PR pipeline already owned. A story-file orchestrator adds a second definition of shipped. |
| W11 | S0 agent/skill/command three-layer catalog | Skip | CE kernels + personas + refs | Recasting every workflow into a namespaced command-plus-agent bundle adds routing weight without new behavior. |
| W12 | S0 single-source generated harness adapters | **Adapt** | `ce-setup` | Source-of-truth generation **only after a concrete second supported harness is approved**. Require semantic parity for permissions, invocation, references, failure handling, and review independence. An 8 KB overflow transform or tool downgrade must never silently weaken a gate. Destination: `skills/ce-setup/SKILL.md` (distribution/generation, fail-closed). |
| W13 | S0 model-tier aliases and tool degradation | Never-fold | — (host dispatch) | OMP's available dispatch contract is authoritative. External opus/sonnet/haiku mappings do not prove capability. |
| W14 | S0 install two-to-four plugins per task | Skip | `ce-mode`, persona selection | Dynamic install/uninstall introduces filesystem state instead of loading the right reference. |

### 2.5 VoltAgent (V01–V15)

A group verdict is about importing that group into CE, not a claim CE contains every domain fact in its role prompts. Stack knowledge may remain an on-demand external reference for a concrete `ce-work`/`ce-plan` task.

| ID | Stage / item | Verdict | CE owner | Rationale |
|---|---|---|---|---|
| V01 | S4 Core Development (11) | Skip | `ce-work`, `ce-prototype` | Eleven builders add overlapping activation without strengthening the shared evidence contract. |
| V02 | S4 Language Specialists (30) | Skip | `ce-work`, `ce-code-review` personas | A 30-way language split is corpus weight CE already rejected for 23 `principle-*` skills. |
| V03 | S4 Infrastructure (16) | Skip | `ce-work`, `ce-debug` | No cloud-fleet posture (standing Never-fold). Privileged administration stays outside implicit CE authority. |
| V04 | S5 Quality & Security (17) | **Adapt** | `ce-code-review`, `ce-dogfood` | One proved uncovered failure-mode lens at a time (e.g. a concrete a11y or security surface not already covered). Evidenced selection trigger, scoped standard, actual behavior/line evidence, common confidence gate. Never import blanket compliance claims or every reviewer. Destination: `skills/ce-code-review/references/persona-catalog.md` (conditional persona) and/or `skills/ce-dogfood/references/test-matrix-taxonomy.md`. |
| V05 | S4 Data & AI (13) | Skip | `ce-plan`, `ce-work`, `ce-optimize` | Domain references may help a task; importing model/pipeline roles adds fast-changing doctrine. |
| V06 | S0 Developer Experience (16) | Skip | `ce-simplify-code`, `ce-commit`, `ce-work` | Useful halves already owned. **MCP development must not be assigned to `ce-verify`.** `ce-verify` creates drive infrastructure and explicitly forbids product-code edits. MCP-dev is `ce-work`. |
| V07 | S4 Specialized Domains (16) | Never-fold | — (vendor/vertical) | Vendor APIs, regulated verticals, SaaS-specific roles. Standing rule. |
| V08 | S1 Business & Product (16) | Skip | `ce-strategy`, `ce-pov`, `ce-ideate`, `ce-brainstorm` | PM/legal/sales/scrum catalog adds overlapping authority CE cannot establish generically. |
| V09 | S0 Meta & Orchestration (~15) | Skip | `ce-mode`, `lfg`, `ce-work` | Multiple coordinators create competing state and completion decisions. Installer mechanics excluded in V14–V15. |
| V10 | S2 Research & Analysis (11) | Skip | `ce-plan`, `ce-brainstorm`, `ce-pov` | Grounded evidence and found/inferred/unknown already in the lineage graft. |
| V11 | S0 least-privilege tools per role | Skip | CE dispatch contract | Read-only reviewers and capability-scoped workers already exist. Foreign tool-name allowlists would not enforce permissions in OMP. |
| V12 | S0 smart model routing | Skip | — (host; closer to Never-fold) | Static brand/tier-to-role table is not measured cost-quality evidence. `ce-code-review` needs attested independence. |
| V13 | S0 bundle-dependency warning | Skip | `ce-setup` | No accepted category-pack dependency graph to maintain. Do not invent bundles to apply a warning from a different packaging model. |
| V14 | S0 marketplace/curl/agent-installer | Never-fold | — (Claude agent dirs) | Installation into global/project agent directories is host management, not CE routing. |
| V15 | S0 subagent-catalog search/fetch/list/invalidate | Never-fold | — (remote registry) | Fetching executable agent instructions introduces a trust/update lifecycle. CE can link references without dynamically admitting unreviewed roles. |

### 2.6 davila7/claude-code-templates (D01–D13)

| ID | Stage / item | Verdict | CE owner | Rationale |
|---|---|---|---|---|
| D01 | S0 opt-in per-component installer | **Adapt** | `ce-setup` | Selected-component installation rather than cloning a whole catalog, **if distribution friction is actually demonstrated**. Pinned provenance, license checks, exact proposed file/change inventory, ownership-safe uninstall. Do not copy the Claude installer or include settings/hooks by implication. Destination: `skills/ce-setup/SKILL.md`. |
| D02 | S0 browsable web component catalog | Skip | `docs/guides/README.md` | Source-backed 37-skill catalog already exists. A hosted browsing service is another stale inventory. |
| D03 | S4/S5 specialist agent templates | Skip | `ce-work`, `ce-code-review`, `ce-optimize`, `ce-debug` | Mirroring upstream persona content adds attribution/freshness/routing maintenance without a new gate. |
| D04 | S0 SDK-backed global agents | Never-fold | — (external runtime) | Directory-independent authority must not replace `ce-mode`/`lfg` bounded task and repository scope. |
| D05 | S5 generate-tests / optimize-bundle / check-security commands | Skip | `ce-work`, `ce-optimize`, `ce-code-review` | A second command bus can turn checklist or generated-test output into an unsupported success claim. |
| D06 | S0/S4 MCP integration catalog | Never-fold | — (external integrations) | GitHub/Postgres/Stripe/AWS connectors carry credentials and side effects. `ce-setup` reports capability availability only. |
| D07 | S0 settings templates | Never-fold | — (host settings) | Timeout/memory/output-style belong to the host. `ce-setup`'s repo-local config is not authority to rewrite user runtime settings. |
| D08 | S0/S6 hooks and pre-commit validation | Never-fold | — (host hooks) | Can duplicate or reorder CE verification. `ce-commit`'s explicit scope and evidence receipt remain the workflow owner. |
| D09 | S4/S5 redistributed skills | Skip | (verdicted at origin) | Same document/MCP/browser content already evaluated under Anthropic/obra/wshobson. Attribution is not redistribution permission. |
| D10 | S0 analytics/session monitor | Never-fold | — (host telemetry) | Transcript monitoring creates privacy/retention obligations. Not a second surveillance subsystem. |
| D11 | S0 chats and tunnel/mobile exposure | Never-fold | — (trust boundary) | Remotely exposing host chats is outside CE workflow authority. `ce-handoff` shares an explicitly selected, redacted artifact. |
| D12 | S0 health-check diagnostics | Skip | `ce-setup` | Health checks and missing-capability explanations already owned. |
| D13 | S0 plugins/permissions dashboard | Skip | host + `ce-setup` | Plugin-management UI is a host concern. A dashboard does not prove permissions are enforced or workflows ran. |

### 2.7 hesreallyhim/awesome-claude-code (H01–H02)

| ID | Stage / item | Verdict | CE owner | Rationale |
|---|---|---|---|---|
| H01 | S0 curated index and category discovery | Skip | `ce-pov` / `ce-plan` research (link only) | An index is not a runnable lifecycle capability. Do not fold or depend on its catalog, ticker, or legacy snapshots. |
| H02 | S0 per-entry source/recency/license metadata | **Adapt** | `ce-pov` | Explicit revision/date, maintenance, and license provenance for external-adoption candidates. Read the primary source. Stars and a recent commit do not establish correctness, compatibility, or safe redistribution. Destination: `skills/ce-pov/references/grounding.md`. |

---

## 3. Reconciled Adopt shortlist

Planner offered a top-8 Adapt list. Reviewer offered 19 conditional Adapt candidates and skipped the rest. Skill count stays 37 in both. Reconciled shortlist = **reviewer's 19 Adapt grafts**, after resolving the four named planner-vs-reviewer divergences. Reviewer hardening wins ties. No Fold. No new skill.

### 3.1 Four named divergences — explicit keep/drop

| # | Item | Planner | Reviewer | **Final** | Why |
|---|---|---|---|---|---|
| 1 | **O08 iron-law excuse tables** | Adapt, rank 3 → `ce-mode` G1–G5 + `ce-work` evidence gate | Skip | **DROP (Skip)** | Reviewer Skip wins. `ce-mode` / `ce-work` / `ce-debug` already own evidence and causal gates. The table is bundled with universal test-first and code-deletion iron laws CE rejected (O20). Pre-closing every imagined loophole with expanding prose fights outcome-first authoring and `ce-mode`'s ≤6k kernel budget. If a specific loophole is observed against U3, close that loophole in the owning playbook — do not import the table. |
| 2 | **O30 test-honesty rubric** (name-the-break, hand-derived literals, no change detectors) | Adapt, rank 4 → `testing-reviewer.md` | Skip | **DROP (Skip)** | Reviewer Skip wins. `ce-work`'s evidence strategy and the testing persona already reject mock echoes, implementation assertions, and empty confidence. Keep obra's page as an external teaching example until a concrete missing failure mode survives that bar. Do not add a second honesty owner. |
| 3 | **O16/SDD compaction ledger** | Adapt, rank 6 → `ce-work/references/implementation-loop.md` | Skip (O15/O16/O17) | **DROP (Skip)** | Reviewer Skip wins. A durable per-plan progress ledger is a second execution-state format beside plan U-IDs and `ce-work`'s worker lifecycle. `ce-ideate`'s Checkpoint A does not license a sibling ledger in the executor without an observed compaction-loss failure. Fresh-worker-per-task + per-task review loops that travel with SDD compete with canonical integration. |
| 4 | **M16 hotspot scan** | Adapt, rank 5 → `ce-simplify-code` Step 1 as a second scope source | Adapt → `ce-ideate`, candidate signal only | **KEEP (Adapt) at reviewer's destination** | Both Adapt, so the mechanism stays; reviewer owner and hardening win the dest tie. Hotspots feed `ce-ideate` as candidate-selection signals for structural work. Churn alone is neither a defect nor permission to refactor; require evidenced maintenance cost and real module boundaries. **Do not** retarget `ce-simplify-code`: that skill's preflight is behavior-preserving cleanup of recently changed code; using hotspots as a scope input is exactly the campaign-refactor drift the planner flagged as a risk. Destination: `skills/ce-ideate/references/grounding.md`. |

Related planner-only Adapts, dropped because they were not in the named four but fail the same tie-break (listed so they are not silently revived):

- **M17 deep-module vocabulary** (planner rank 7) → Skip. Optional design ideas, not falsifiable maintainability gates.
- **O34 / M25 authoring-standard mega-graft** (planner rank 2) → Skip as a fourth voice inside skill authoring. The portable measurement pieces survive as **A01** and **O35** under `ce-retune`/eval-cell, not as TDD-for-docs or SDO keyword stuffing.
- **M15 `.out-of-scope/` rejection KB** → Skip. `ce-sweep` owns intake; a parallel store disagrees with source-of-truth.
- **O21 3-strikes** and **O29 re-review packaging** (planner runners-up) → Skip.
- **A17 black-box helper contract** (planner runner-up) → Skip. `ce-verify` already owns drive-skill generation.

Planner Skip vs reviewer Adapt items that **enter** the shortlist under the same tie-break: O24, O39, M04, M08, M11, A09, L07, L08, W02, W12, V04, D01, H02.

### 3.2 Reviewer boundaries preserved

- **`ce-mode` and `ce-verify` have landed.** September 9 map “planned” labels are superseded. Do not re-propose them as new skills or treat blast-radius, lineage, safe prune, or dogfood feature-map consumption as gaps.
- **MCP-dev owns `ce-work`, not `ce-verify`.** `ce-verify` writes `.agents/skills/verify-<app>/` drive infrastructure and forbids product-code edits. A07 and V06 stay Skip on that boundary.
- **No universal TDD.** O20, M19, W06 Skip. `ce-work` chooses real red / characterization / replacement proof.
- **No universal full-suite.** O25 Skip. Slice evidence remains valid; `ce-mode` G2 is evidence-before-done, not a fresh full run in every claim-bearing message.
- **No second planner, router, executor, review pipeline, watcher, or catalog.**

### 3.3 Final Adopt list (19 Adapt grafts)

Common conditions before any edit: identify the unmet consumer contract; inspect a pinned upstream source and applicable license; keep one incumbent owner and existing artifact format; preserve authorization and all review/evidence gates; run a proportional baseline/variant or real-consumer check showing benefit without adjacent-route regressions. None of these is permission to add a skill or to copy a host-specific implementation wholesale.

| # | ID | Mechanism | Destination file | Hardening (reviewer) |
|---|---|---|---|---|
| 1 | O24 | Isolated, runner-aware test-pollution diagnosis | `skills/ce-debug/references/investigation-techniques.md` | Reproducible order-dependent failure; retain command/status evidence; do not vendor `find-polluter.sh` until reset/runner assumptions are reviewed. |
| 2 | O31 | Condition-based waiting for sleep-driven flakes | `skills/ce-debug/references/investigation-techniques.md` | Real readiness predicate, bounded deadline, useful timeout evidence; no universal polling interval; not a `ce-verify` default. |
| 3 | O35 | Competing-pressure fixtures for skill eval | `skills/ce-retune/references/cut-passes.md`; `tests/skill-eval-cell/catalog.ts` | Paired baseline/variant, fresh consumer artifacts, outcome grading — not phrase compliance. |
| 4 | O39 | Harness-port acceptance method | `skills/ce-setup/SKILL.md` | Only when a real additional harness is supported. Positive/negative activation, unavailable-tool, and authority behavior must be tested. Hooks/manifests stay in isolated adapters. |
| 5 | M04 | Bounded unresolved-decision frontier | `skills/ce-pov/references/method.md`; `skills/ce-strategy/SKILL.md` | Existing CE artifacts only; dependencies + stop condition; no ticket swarm, no third planner. |
| 6 | M08 | Overloaded-term resolution | `skills/ce-brainstorm/SKILL.md` (existing requirements artifact) | Decision-relevant definitions only; repository facts and edge-case examples; no parallel glossary/ADR system. |
| 7 | M11 | Async stakeholder questionnaire | `skills/ce-brainstorm/references/handoff.md` | Recipient-specific; preserve IDs and unanswered blockers; answers are evidence, never implicit approval. |
| 8 | M14 | Tracer-bullet vertical slices + dependency edges | `skills/ce-plan/references/plan-sections.md`; `skills/ce-plan/references/structure.md` | U/R identifiers and test scenarios stay canonical; tracker writes behind an authorized adapter. |
| 9 | M16 | Git-hotspot candidate signal | `skills/ce-ideate/references/grounding.md` | Candidate signal only; evidenced maintenance cost + real module boundaries; not a `ce-simplify-code` scope input. |
| 10 | M21 | Merge-conflict intent tracing | `skills/ce-work/references/merge-conflicts.md` (new reference); pointer from `skills/ce-work/references/implementation-loop.md` | Identify exact operation and offered files; preserve both sides' intended behavior; **caller owns continue/abort** (reject never-abort). |
| 11 | A01 | Paired skill/baseline measurement | `skills/ce-retune/references/baseline-mining.md`; `tests/skill-eval-cell/catalog.ts` | Noise floor and discrimination checks; no Claude-only runner; no new authoring owner. |
| 12 | A09 | Fresh-reader comprehension lens | `skills/ce-doc-review/references/personas/` + `persona-selection.md` | Conditional; actual misunderstandings as evidence; no duplicate coauthoring workflow. |
| 13 | L07 | Current-version provenance | `skills/ce-setup/SKILL.md`; `skills/ce-plan/references/research.md` | Used dependency/provider only; no tutorial-sized drift corpus; no mixed-provider refusal. |
| 14 | L08 | Live-source freshness / stale markers | `skills/ce-product-pulse/references/run.md`; `skills/ce-sweep/references/run.md` | Observed freshness; explicit stale/unavailable coverage; no fabricated or silently empty evidence. |
| 15 | W02 | Post-deploy observation recipe | `skills/ce-verify/references/generate.md`; `skills/ce-product-pulse/references/run.md` | Isolated or explicitly authorized read-only target; no new deployment or production-write authority. |
| 16 | W12 | Generated harness adapters | `skills/ce-setup/SKILL.md` | Only after a supported-host decision. Semantic parity checks; fail closed on weakened gates. |
| 17 | V04 | One missing failure-mode review/QA lens | `skills/ce-code-review/references/persona-catalog.md`; `skills/ce-dogfood/references/test-matrix-taxonomy.md` | One proved uncovered lens at a time; incumbent evidence/confidence mechanics; never blanket compliance. |
| 18 | D01 | Opt-in selected-component packaging | `skills/ce-setup/SKILL.md` | Only after actual distribution friction is shown. Pinned provenance, license review, exact owned-file lifecycle. |
| 19 | H02 | Revision/maintenance/license provenance | `skills/ce-pov/references/grounding.md` | Primary source; popularity is discovery evidence, never an adoption gate. |

---

## 4. Ranked effort table

Effort is integration and ongoing-maintenance cost, not upstream quality. S = prose graft into an existing reference. M = new reference file or eval-catalog rows plus a pointer. L = gated distribution/harness work that must not start without an explicit supported-host or friction demonstration.

| Effort rank | ID | Destination | Size | Note |
|---|---|---|---|---|
| 1 | M21 | `ce-work/references/merge-conflicts.md` | **M** | Only shortlist item filling a grounded hole (`implementation-loop.md` “resolve them immediately”). Highest consumer value per edit among Keep items. |
| 2 | O31 | `ce-debug/references/investigation-techniques.md` | **S** | One wait recipe; flake-specific. |
| 3 | M08 | `ce-brainstorm/SKILL.md` | **S** | Terminology collision clause; no new artifact type. |
| 4 | L08 | `ce-product-pulse` + `ce-sweep` `references/run.md` | **S** | Freshness/stale markers on existing report paths. |
| 5 | H02 | `ce-pov/references/grounding.md` | **S** | Provenance fields for external-adoption research. |
| 6 | A09 | `ce-doc-review` personas | **S** | Conditional lens, not a new stage. |
| 7 | M11 | `ce-brainstorm/references/handoff.md` | **S** | Async question artifact for user-only facts. |
| 8 | L07 | `ce-setup` + `ce-plan/references/research.md` | **S–M** | Provider-scoped current-version check. |
| 9 | M14 | `ce-plan` plan-sections/structure | **S–M** | Vocabulary for vertical units; do not fork U-IDs. |
| 10 | M16 | `ce-ideate/references/grounding.md` | **S–M** | Signal, not a scanner product. Confirm cost before proposing structure. |
| 11 | V04 | `ce-code-review` catalog / `ce-dogfood` taxonomy | **S–M** | One lens, proved missing, then stop. |
| 12 | O24 | `ce-debug/references/investigation-techniques.md` | **M** | Method only; runner assumptions are the cost. |
| 13 | O35 | `ce-retune` + eval-cell catalog | **M** | New pressure-scenario rows; needs paired runs. |
| 14 | A01 | `ce-retune/references/baseline-mining.md` + eval-cell | **M** | Same measurement owner as O35; do as one graft, not two voices. |
| 15 | M04 | `ce-pov/references/method.md` | **M** | Frontier in existing artifacts; easy to accidentally become a planner. |
| 16 | W02 | `ce-verify/generate.md` + `ce-product-pulse` | **M** | Observation only; authorization boundary is the risk. |
| 17 | O39 | `ce-setup/SKILL.md` | **L** | Do not start until a second harness is an accepted product. |
| 18 | W12 | `ce-setup/SKILL.md` | **L** | Same gate as O39; fail-closed parity is mandatory. |
| 19 | D01 | `ce-setup/SKILL.md` | **L** | Same distribution family; requires demonstrated friction plus license/provenance. |

O39, W12, and D01 are one distribution family under `ce-setup`. If they ever land, land as one gated program, not three independent edits.

Suggested implementation order if any of this is scheduled: M21 → {O31, M08, L08, H02, A09, M11} → {L07, M14, M16, V04, O24} → {O35+A01 as one measurement graft, M04, W02} → freeze O39/W12/D01 until a supported-host or friction decision exists.

---

## 5. Risks

| Risk | Boring / safe choice |
|---|---|
| Dual Adapt owners (A01 + O35) become two measurement voices | One graft under `ce-retune`/eval-cell. Shared conditions: paired baseline/variant, noise floor, discrimination, outcome grading. No new authoring owner, no TDD-for-docs. |
| M21 never-abort leaks in from upstream | Caller owns continue/abort. Document that `ce-babysit-pr` may still escalate semantic conflicts to `needs-human`. |
| M16 hotspot scan revives as a `ce-simplify-code` scope input | Destination is `ce-ideate` only. Churn without evidenced cost is not a refactor license. |
| M04 frontier becomes a third planner | Stop condition required. No issue labels, no ticket swarm. `ce-plan`/`ce-brainstorm` remain the only planners. |
| W02 observation recipe is copied as deploy authority | Read-only, isolated or explicitly authorized target. No production writes. |
| O39/W12 adapter generation silently weakens gates (8 KB overflow, tool downgrade) | Fail closed. Semantic parity for permissions, invocation, references, failure handling, review independence. Do not start without a supported-host decision. |
| D01 installer pulls settings/hooks by implication | Exact owned-file inventory, license check, uninstall. Claude installer and hook APIs stay Never-fold. |
| V04 “one lens” grows into a 17-reviewer pack | One proved uncovered failure mode, then stop. Incumbent confidence gate. No blanket compliance claims. |
| Excuse tables / honesty rubric / SDD ledger get revived because they ranked in the planner top-8 | They are **dropped** in §3.1. Do not re-open without a new observed consumer failure that the incumbent gate does not already name. |
| MCP-dev or webapp-testing assigned to `ce-verify` | `ce-verify` generates drive skills and forbids product-code edits. MCP-dev and Playwright wrappers stay `ce-work` / `ce-test-browser`. |
| Universal TDD or full-suite sneaks in via O20/O25/W06 wording | Explicit Skip. `ce-work` chooses evidence; slice evidence remains valid. |
| Host leakage via Markdown packaging (hooks, injectors, manifests, model aliases, Claude agent dirs, secret wizards) | Never-fold stays Never-fold. A portable prompt around a host primitive is not a portable mechanism. |
| License-bound document packs (A03–A06) or org/vendor brand (A13, A08, A19) enter as “useful scripts” | Never-fold. Rights review is a separate product decision. |
| Shortlist looks small relative to ~139 scanned items | That is the finding. CE S1–S7 coverage is denser than every repo examined. Portable deltas are mechanisms, not skills. Count stays 37. |

**Bottom line:** keep the 37-skill spine. Admit at most the 19 conditional Adapt grafts above, each into a named incumbent file, each under reviewer hardening. Drop iron-law excuse tables, the test-honesty rubric, and the SDD compaction ledger. Keep the hotspot scan only as a `ce-ideate` candidate signal. Do not add a skill.
