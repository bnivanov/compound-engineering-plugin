# Selecting reviewers and binding the adversarial route

Read this at Stage 3, together with `references/persona-catalog.md`. It owns the roster layers, the standards path search, the small-diff lite gate, and the routing boundary between the independent reviewer agent and the in-process adversarial reviewer.

## Reviewers

Reviewer personas are selected in layers. The persona catalog in `references/persona-catalog.md` (read it at Stage 3) has the full selection criteria and spawn gates. Each selected reviewer is a generic subagent seeded with a local prompt file from `references/personas/`; do not dispatch standalone agents by type/name.

**Core (always-on):** `correctness-reviewer`.

**Standards conditional:** `project-standards-reviewer` runs only when Stage 3b finds at least one applicable standards file. An empty successful search is a disclosed skip, because this persona is not allowed to invent standards beyond those files.

**Generic conditional:**

- `testing-reviewer` — test files, test infrastructure, mocks, fixtures, or harness behavior changed; or the diff changes meaningful runtime behavior without corresponding test work. Behavioral triggers include new or changed branches, state mutation, API/control-flow behavior, and error handling. Production-file presence alone and non-behavioral edits do not select it.
- `maintainability-reviewer` — a large or structural diff: substantial refactor, new abstractions, file moves, coupling/type-boundary changes, or at least 200 executable changed lines.
- `agent-native-reviewer` — an agent-facing feature or surface changed (skills, agents, prompts, tools, MCP, commands, or a product capability expected to be accessible to agents).
- `learnings-researcher` — `<root>/solutions/` exists and a cheap path/title search finds a plausible match for the changed modules or patterns. The existence of a corpus alone is not enough.

**Cross-cutting conditional (per diff):**

- `security-reviewer` — auth, public endpoints, user input, permissions
- `performance-reviewer` — DB queries, data transforms, caching, async
- `api-contract-reviewer` — routes, serializers, type signatures, versioning
- `data-migration-reviewer` — migration files / schema dumps / backfills (see spawn gate in Stage 3)
- `reliability-reviewer` — error handling, retries, timeouts, background jobs
- `adversarial-reviewer` lens — >=50 changed code lines, or auth / payments / persistence writes / event publication / retry or concurrency semantics / external APIs, or a **silent-pass verification mechanism** regardless of size. Satisfy this lens with the independent `reviewer` agent when its host `task` dispatch starts. Use the in-process `adversarial-reviewer` only when that agent cannot start or fold-in requires the did-not-run fallback; never run both same-brief reviews.
- `previous-comments-reviewer` — PR with existing review comments (PR-only, comment-gated)

**Stack-specific conditional (per diff):** `julik-frontend-races-reviewer` (Stimulus/Turbo, DOM events, async UI) and `swift-ios-reviewer` (Swift/SwiftUI/UIKit, entitlements, Core Data, `.pbxproj`).

**CE conditional (migration-specific):** local prompt asset `deployment-verification-agent` — deployment checklist + rollback when the migration gate applies and the change is risky.

## Review Scope

A full review always spawns correctness, adds project-standards when applicable files exist, then adds only the generic, cross-cutting, stack-specific, and CE conditionals justified by the diff. `depth:full` disables the small-diff lite path; it does not invent irrelevant domains. A Rails auth feature might add security, reliability, and adversarial while still skipping agent-native and learnings when those surfaces are absent.

## Language-Aware Conditionals

Stack-specific reviewers fire only when the diff touches runtime behavior they specialize in (async UI races, iOS/Swift lifecycle) — never mechanically from file extensions alone; the trigger is meaningful changed behavior in that stack's runtime domain. Structural quality (complexity deletion, 1k-line regressions, type-boundary leaks) lives in the conditional `maintainability-reviewer`; do not spawn extra reviewers for language conventions, philosophy, or "strict bar" passes.

### Stage 3: Select reviewers

Read the diff and file list from Stage 1 and the helper JSON from Stage 1b. Correctness is automatic; project-standards is governed by the Stage 3b path result. Read `references/persona-catalog.md` from this skill's directory now; it owns every other spawn gate. Select generic reviewers before domain reviewers: testing for changed test/harness surfaces, or when meaningful runtime behavior changed without corresponding test work; maintainability only for large or structural work; agent-native only for agent-facing work; and learnings only after a cheap search finds plausible matches in an existing `<root>/solutions/` corpus. For the behavioral testing trigger, require concrete diff evidence such as new or changed branches, state mutation, API/control-flow behavior, or error handling. Do not select testing from production-file presence alone or for non-behavioral edits. For each remaining conditional, decide whether the diff warrants it. Helper signals are prompts to consider a persona, never automatic selection.

**File-type awareness for conditional selection:** Instruction-prose files (Markdown skill definitions, JSON schemas, config files) are product code but do not benefit from runtime-focused reviewers. The adversarial reviewer's techniques (race conditions, cascade failures, abuse cases) target executable code behavior. For diffs that only change instruction-prose files, skip adversarial unless the prose describes auth, payment, or data-mutation behavior, or the change is itself a silent-pass verification mechanism (next paragraph — a CI/CD workflow is a config file but still gets the adversarial lens). Count only executable code lines toward line-count thresholds.

Treat changed persistence writes, event publication, retry/partial-failure behavior, and concurrency or ordering semantics as concrete data-mutation/external-boundary triggers for `adversarial`; do not require a framework-specific database or HTTP keyword.

**Silent-pass verification mechanisms — adversarial fires on the guard itself.** When the change *is* a verification mechanism — CI/CD gating logic, merge-blocking checks, build/deploy steps, coverage/lint gates, or test infrastructure/mocks that could mask production — its risk isn't blast radius, it's fidelity: it can go green while the real thing is red, so the exact "can this false-pass?" lens must run. Select `adversarial` (and therefore the Stage-4 cross-model pass) for such a change regardless of changed-line count and independent of the auth/data heuristics. The selection question: "If this mechanism is wrong, does it fail loudly or silently pass? A silent-pass guard gets the adversarial + cross-model lens regardless of size." Scope guard: this fires on the *mechanism* (gating/CI/build/deploy/harness changes), not on ordinary per-feature test assertions — a unit test asserting business logic is the `testing` reviewer's job, not adversarial's.

**`previous-comments` is PR-only AND comment-gated.** Only select this persona when both conditions hold:

1. Stage 1 gathered PR metadata (PR number or URL was provided as an argument, or `gh pr view` returned metadata for the current branch).
2. `hasPriorComments` from Stage 1 is true (the PR has at least one review submission or issue comment).

Skip it for standalone branch reviews with no associated PR, and skip it for PRs with no prior feedback yet -- there is nothing for the persona to verify, and a spawned subagent that returns empty findings still costs the full subagent startup overhead (persona spec, diff, schema, plus its own gh calls).

Stack-specific personas are additive when runtime behavior warrants them. A Hotwire UI change may warrant `julik-frontend-races`; a TypeScript boundary change may warrant `api-contract` only when the diff changes an externally consumed contract, not merely because it exports a symbol.

**`data-migration` spawn gate.** Select `data-migration-reviewer` only when the diff includes at least one migration or schema artifact: `db/migrate/*`, `db/schema.rb`, `db/structure.sql`, Alembic/Flyway/Liquibase migration paths, or explicit backfill/data-transform scripts (rake tasks, one-off data migration classes). **Do not spawn** for model-only changes, query-only refactors, serializers/controllers that reference columns without a migration or schema dump in the diff, or migration tests alone.

For `deployment-verification-agent`, use the same migration-artifact gate when the change is risky (destructive DDL, backfills, NOT NULL without default, column renames/drops).

### Stage 3b: Discover project standards paths

**Goal:** the mapping that pairs each criteria file governing this change with the changed files it governs, for the `project-standards` persona. Paths, not contents.

Enumerate the candidates from **the tree under review**, never from whichever tree happens to be checked out: the workspace only in `local-aligned` scope, and the reviewed head ref in `pr-remote` and `branch-remote` (Stage 1 resolved which). A criteria file that exists only in the reviewed tree must appear, and one deleted there must not, or the persona enforces criteria the change never had.

Candidates are `CODING_STANDARDS.md` and `AGENTS.md` at any depth. Keep those whose directory is an ancestor of a changed file -- a root-level file governs the whole checkout, `skills/AGENTS.md` only what is under `skills/`.

`CODING_STANDARDS.md` is the designated criteria source, so an instruction file supplies criteria only for changed files that no `CODING_STANDARDS.md` governs, and no file is graded against both kinds. Every governing `CODING_STANDARDS.md` still applies together. When the instruction-file fallback supplied the criteria for any changed file, name it as the fallback in Coverage.

**Done** when no changed file could be graded against two kinds of criteria. A changed file that no criteria file governs is a complete result, not a gap. **On uncertainty, fail closed** — an error is never an empty result:

- One or more applicable paths: select `project-standards` and pass the mapping inside a `<standards-paths>` block in its Stage 4 context. The persona applies the precedence you resolved rather than re-deriving it, and reads the files itself, targeting only relevant sections.
- Empty successful search: do not dispatch `project-standards`; record `project standards: not run (no applicable standards files)` in Coverage.
- Search failure or uncertain scope: dispatch `project-standards` with the uncertainty stated.

### Stage 3c: Small-diff fast path (reduce the roster for trivial, low-risk diffs)

**`depth:full` hard-disables this gate** — when that token was passed, skip Stage 3c entirely and run the full roster (the caller explicitly asked for a deep review; size no longer matters).

**This gate fails closed: it only ever fires for a positive count of low-risk application code, and every uncertainty resolves to the full roster.** Collapse to a lite roster only when **all** of these hold:

- Stage 1b returned `lite_eligible: true` (1-39 executable changed lines, zero uncounted files, and no path signals), AND
- No content-based risk read from the diff in Stage 3 (auth, payments, data mutation, external API, secrets/permissions, deserialization, crypto, concurrency/background jobs, filesystem/process execution), AND
- Stage 3b standards discovery completed successfully (with applicable paths or a confirmed empty result), AND
- No conditional persona other than `project-standards` was selected in Stage 3.

`exec_lines: null`, `uncounted_files > 0`, a non-empty `signals` array, or helper failure are hard disqualifiers. A pure code diff that also touches one `.md` runs the full roster; that conservatism is the point.

**Lite roster:** the inline fast pass (Stage 4) plus `correctness-reviewer`, and `project-standards-reviewer` only when Stage 3b found applicable paths. Announce the actual roster plainly and note it in Coverage.

**Do not collapse** when any gate condition fails — the gate keys on risk, not size alone (a 12-line auth change still needs the full roster). When in doubt, run the full roster.

### Stage 3d: Bind the adversarial route and final roster

Complete this stage **before reading persona prompt assets, `references/dispatch-reviewers.md`, or entering Stage 4**. It binds the exclusive choice between the host `task` reviewer agent and the in-process `adversarial-reviewer`; later stages consume that choice, except for the fold-in did-not-run fallback.

Generate the review run ID now so both routes share one artifact directory:

```bash
SCRATCH_ROOT="/tmp/compound-engineering-$(id -u)";
[ ! -L "$SCRATCH_ROOT" ] && (umask 077; mkdir -p "$SCRATCH_ROOT") 2>/dev/null && [ ! -L "$SCRATCH_ROOT" ] && [ -O "$SCRATCH_ROOT" ] && [ -w "$SCRATCH_ROOT" ] || SCRATCH_ROOT="${TMPDIR:-/tmp}/compound-engineering-$(id -u)";
if [ -L "$SCRATCH_ROOT" ]; then echo "unsafe scratch root symlink: $SCRATCH_ROOT" >&2; exit 1; fi;
(umask 077; mkdir -p "$SCRATCH_ROOT") || exit 1;
if [ -L "$SCRATCH_ROOT" ] || [ ! -O "$SCRATCH_ROOT" ]; then echo "scratch root is not owned by the current user: $SCRATCH_ROOT" >&2; exit 1; fi;
chmod 700 "$SCRATCH_ROOT" || exit 1;
RUN_ID=$(date +%Y%m%d-%H%M%S)-$(head -c4 /dev/urandom | od -An -tx1 | tr -d ' ');
RUN_DIR="$SCRATCH_ROOT/ce-code-review/$RUN_ID";
(umask 077; mkdir -p "$RUN_DIR") || exit 1; chmod 700 "$RUN_DIR" || exit 1;
echo "$RUN_DIR";
```

When adversarial was selected and scope is `local-aligned` or standalone, read `references/cross-model-review.md` in full, assert OMP, and apply its checkout gate. Before dispatch, write its two orchestrator-owned inputs under `RUN_DIR`: the dedicated host-vetted constraints file and the separate untrusted semantic brief containing intent plus material risk divisions inferred from the current file inventory and diff. Each is at most 32 KiB. Do not embed the diff, mechanically copy every path, or combine the files. Missing or oversized constraints stop before dispatch. Then dispatch one host `task` item with `agent: reviewer` using that reference's read-only prompt and allowed tools. No shell worker, `omp -p` subprocess, or foreign CLI is permitted.

- When the `task` dispatch starts, the reviewer agent owns the adversarial lens. Remove `adversarial-reviewer` from the local roster. Do not dispatch a duplicate local persona unless fold-in requires the did-not-run fallback.
- If the agent cannot start, or the pass is ineligible or prohibited by the user or checkout gate, keep the selected in-process `adversarial-reviewer`. Name dispatch failure in Coverage. Missing model attestation does not prevent dispatch: record independence as unverified, not as proof of independence.
- In `pr-remote` / `branch-remote`, skip the separate agent and keep the selected in-process adversarial reviewer because it can inspect the reviewed refs.

When task tracking is active, add the separate reviewer pass only after dispatch starts, and record its terminal outcome when its return is collected through the host's blocking collection. Name requested `reviewer` and the attested serving model or `unverified`; never describe an unverified pass as independent.

Do not proceed until the final local roster is materialized. A started reviewer agent and the in-process adversarial reviewer must never both receive the same review brief.

Announce that final team before spawning, as a user-facing summary: name the always-on reviewers plainly, and for each conditional reviewer give the one-line reason it was added (the real concern, not the keyword that matched). Do **not** put local reviewer model-tier labels (`[session model]`/`[mid-tier]`) or scope-mode codenames in this announce — those are internal. Still decide each local reviewer's tier here and keep it in working state for Stage 4. The cross-model line is separate and follows the receipt-aware model/reasoning and route wording in its reference. This is progress reporting, not a blocking confirmation.
