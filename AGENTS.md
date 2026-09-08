# Agent Instructions

This repository is the root of the `compound-engineering` coding-agent plugin and the marketplace/catalog metadata used to distribute it.

It also contains:
- the Bun/TypeScript repo tooling CLI (`list`, `plugin-path`) and the shared frontmatter parser
- shared metadata infrastructure for the CLI, marketplace, and plugin

`AGENTS.md` is the canonical repo instruction file; omp loads it as project context.

## Quick Start

```bash
bun install
bun run test              # full test suite (also runs in CI; `--parallel` across worker processes)
```

### Local OMP Development

Link the checkout as a live plugin and iterate; skills reload on the next session or `/reload-plugins`:

```bash
omp plugin link "$PWD"
omp install --dry-run --json "$PWD"   # confirm package.json#pi + .pi/extensions resolve
```

Do not add the checkout as a marketplace for live development — that caches a snapshot. See `docs/development.md` for the sandboxed marketplace check.

## Working Agreement

- **Branching:** Create a feature branch for any non-trivial change. If already on the correct branch for the task, keep using it; do not create additional branches or worktrees unless explicitly requested.
- **Merge policy:** All changes to `main` go through pull requests. Direct pushes and direct merges are not allowed; branch protection on `main` enforces this by requiring the `test` status check to pass. The direct path bypasses the test suite and PR title validation.
- **Contribution gate (non-maintainers):** If you are not a repository maintainer or admin, do not open a PR without a linked issue — file the issue first and reference it from the PR. Adding a **new skill** has a stricter gate: non-maintainers and non-admins must raise a discussion in an issue and get explicit maintainer approval **before** starting the work; do not open a new-skill PR that has not been approved this way. Maintainers and admins are exempt from both gates but still follow the merge policy above.
- **PR disclosure:** `.github/pull_request_template.md` ends with `## Security Disclosure` and `## Agent Disclosure` sections. Fill both when opening a PR, including PRs authored via `gh pr create --body`/`--body-file`, which bypass the template so nothing pre-fills them. State any security-relevant changes (or "No security-relevant changes"), and the model that did the bulk of the work: OMP plus the most specific model identity your own context gives you, e.g. `OMP · <exact model ID from your context>`. Copy an exact model ID verbatim when OMP states one; when it exposes only a generic family, report the family and stop. Do not upgrade a family to a version, and do not read config files for one: the configured default is often not the model actually running. Never invent a version or variant. The body above those sections stays freeform: add whatever sections best explain the change.
- **Safety:** Do not delete or overwrite user data. Avoid destructive commands.
- **Testing:** Run `bun run test` after changes that affect parsing, output, skill conventions, or other mechanical guards. Local `bun run test` is the same suite CI runs — there is no separate local-only unit-test lane. Prefer it over bare `bun test`: the package script carries `--parallel`, which is where the suite's speed comes from. Bare `bun test <file>` is still the right tool for iterating on one file.
- **Compounding learnings:** After a solved, verified problem, automatically invoke the `ce-compound` skill with `mode:non-interactive` at the completion checkpoint only when the work produced durable project reasoning that is not readily recoverable from the final code, tests, types, comments, or existing documentation, and losing it would plausibly cause recurrence, material risk, or substantial rediscovery. Apply this counterfactual: if the learning document disappeared, would a future engineer reading the final implementation still be likely to repeat the mistake or redo substantial investigation? If not, do not invoke it. Completion, effort, and diff size alone are not enough. Capture at the checkpoint so a qualifying learning can ship in the PR that produced it, and only where the repository treats captured learnings as tracked, committed knowledge. This repository does: `docs/solutions/` is tracked (see *Repository Docs Convention*). If `ce-compound` is not callable in the current harness (a checkout without the plugin installed or linked), do not block and do not skip silently: say in the completion report that a qualifying learning was left uncaptured, so the author can run it from a plugin-enabled session.
- **Release versioning:** Fork releases are cut by hand: bump the version in `package.json`, `plugin.json`, and `.omp-plugin/marketplace.json` together, then tag. There is no release automation in this fork. `CHANGELOG.md` is upstream history; fork release notes live on the tag. Use conventional titles such as `feat:` and `fix:`; do not hand-author release notes in routine PRs.
- **Scratch Space:** Default to OS temp. Use `.context/` only when explicitly justified by the rules below.
  - **Default: OS temp** — covers most scratch, including per-run throwaway AND cross-invocation reusable, regardless of whether a repo is present or whether other skills may read the files. A stable OS-temp prefix handles cross-skill and cross-invocation coordination equally well as an in-repo path; repo-adjacency is rarely the relevant property.
    - **Per-run throwaway**: `mktemp -d "${TMPDIR:-/tmp}/<prefix>-XXXXXX"` (OS handles cleanup). Use for files consumed once and discarded — captured screenshots, stitched GIFs, intermediate build outputs, recordings, delegation prompts/results, single-run checkpoints. Always pass an explicit template under `${TMPDIR:-/tmp}`. Do not use bare `mktemp`, bare `mktemp -d`, `mktemp -t`, or `mktemp -d -t`: those forms ignore `$TMPDIR` on macOS and can resolve outside a sandbox's writable temp directory.
    - **Cross-invocation reusable**: use a stable, effective-user-owned prefix under `/tmp/compound-engineering-<effective-uid>/<skill-name>/` — **not** `mktemp -d` — so later invocations by the same OS user can find prior outputs without sharing a writable root with other users. Derive the effective UID with `id -u`, reject a symlink or path not owned by the current user, and create or repair the top-level root to mode `0700` before use. **Probe before committing to `/tmp`:** when that root cannot be created, is not yours, or is not writable, use `${TMPDIR:-/tmp}/compound-engineering-<effective-uid>` instead — the same rule, in the same order, in every shell preamble and Python default, so a later invocation resolves the same root. OMP's macOS sandbox allowlists writes under `$TMPDIR` (`/tmp/omp-<uid>`) but not `/tmp` itself, so without the fallback every skill's scratch setup aborts there with `Operation not permitted`; and an existing root from an unsandboxed session passes `mkdir -p` as a no-op yet refuses the first write, which is why the probe is a writability check (`[ -w ]`), not creation alone. Copy the block from any shipped skill (for example `skills/ce-code-review/SKILL.md`) rather than re-deriving it; `tests/scratch-root-preamble-executes.test.ts` runs every copy, including the fallback. The default layout is one `<scratch-root>/<skill-name>/<run-id>/` directory per run; use it for caches keyed by session, checkpoints meant to survive context compaction, intermediate state, and outputs whose lifecycle or mutation belongs to one run.
      - **Discoverable collection exception**: omit the per-run directory only when later invocations intentionally enumerate multiple sibling **final artifacts** as core product behavior and run isolation would materially worsen discovery or the user-facing path. Use a stable collection namespace (for example, repository identity plus a `general` fallback), descriptive immutable filenames, metadata that supports ranking, and no-overwrite collision handling that atomically reserves the final filename and retries with the next suffix on collision; never check availability and then write. Do not use this exception for caches, checkpoints, intermediate files, or merely to shorten a path.
      - Prefer `/tmp` over `$TMPDIR` so paths stay accessible: `$TMPDIR` on unsandboxed macOS resolves to `/var/folders/64/.../T/`, which is hostile for users who want to inspect checkpoints, grep them, or copy them out — which is why `$TMPDIR` is the fallback, taken only when `/tmp` cannot host the root, and never the first choice. The explicit effective-UID segment supplies the required cross-user boundary while preserving a readable path. Agents running as the same OS user intentionally remain in one discretionary-access-control principal.
  - **Exception: `.context/`** — use only when the artifact is genuinely bound to the CWD repo AND meets at least one of:
    - (a) **User-curated**: the user is expected to inspect, manipulate, or manually curate the artifact outside the skill (e.g., a per-repo TODO database, a per-spec optimization log that survives across sessions on the same checkout).
    - (b) **Repo+branch-inseparable**: the artifact's meaning is inseparable from this specific repo or branch (e.g., branch-specific resume state that a user expects to pick up again in the same checkout).
    - (c) **Path is core UX**: surfacing the artifact path back to the user is a core part of the skill's output and that path is easier to communicate as a repo-relative location than an OS-temp one.
    Namespace under `.context/compound-engineering/<workflow-or-skill-name>/`, add a per-run subdirectory when concurrent runs are plausible, and decide cleanup behavior per the artifact's lifecycle (per-run scratch clears on success; user-curated state persists). "Shared between skills" is not by itself sufficient — OS temp handles that equally well.
  - **Durable outputs** (plans, specs, learnings, docs, final deliverables) belong in `docs/` or another repo-tracked location, not in either scratch tier.
  - **Cross-platform note:** `/tmp` is writable on macOS (symlink to `/private/tmp`), Linux, and WSL. For per-run throwaway files, use an explicit `${TMPDIR:-/tmp}` template so macOS and sandboxed hosts honor the selected temp parent. Skills authored here assume Unix-like shells (bash on macOS/Linux, or Git Bash on Windows). Native Windows is a supported target for Python interpreter resolution and peer-job detach — never hardcode `python3`; probe execution per `docs/solutions/conventions/resolve-python-interpreter-not-python3.md`.
- **Character encoding:**
  - **Identifiers** (file names, agent names, command names): ASCII only -- regex patterns and tests depend on it.
  - **Markdown tables:** Use pipe-delimited (`| col | col |`), never box-drawing characters.
  - **Prose and skill content:** Unicode is fine (emoji, punctuation, etc.). Prefer ASCII arrows (`->`, `<-`) over Unicode arrows in code blocks and terminal examples.

## Directory Layout

```
src/              Repo tooling CLI (`list`, `plugin-path`) and the frontmatter parser tests share
skills/           Compound Engineering plugin skills (what omp loads)
docs/guides/      User-facing plugin guides (catalog and configuration)
.omp-plugin/      omp marketplace catalog (marketplace.json)
.pi/              Extension entrypoint declared in package.json#pi
plugin.json       Root Agent Plugins manifest (fork version carrier)
tests/            Skill-behavior, convention, and OMP manifest tests + fixtures
docs/             Requirements, plans, solutions, and the omp spec
CONCEPTS.md       Shared domain vocabulary (glossary of project-specific terms)
```

## Repo Surfaces

Changes in this repo may affect one or more of these surfaces:

- plugin content under `skills/`, `AGENTS.md`, `README.md`
- omp load surfaces: `package.json#pi`, `.pi/extensions/compound-engineering.ts`, `.omp-plugin/marketplace.json`, root `plugin.json`
- repo tooling in `src/` and `tests/`

Do not assume a repo change is "just CLI" or "just plugin" without checking which surface owns the affected files.

## Plugin Maintenance

When changing plugin content:

- Update substantive docs like `README.md` when the plugin behavior, inventory, or usage changes.
- When adding a user-facing skill, document it: create a `docs/guides/<skill-name>.md` page (purpose, novel mechanics, when to use, chain position — follow the shape of the existing pages), add a catalog row under the right category in `docs/guides/README.md`. `docs/guides/README.md` is the **only** place a skill's prose description is maintained. The root `README.md` carries a grouped overview that lists skill *names* under a category, so a new skill also needs its name added to the right group row and the three stated skill counts bumped (badge, intro, section lead).
- When adding, removing, renaming, or changing the meaning/default/consumer of a `.compound-engineering/config.yaml` option, update `skills/ce-setup/references/config-template.yaml`, its byte-identical `.compound-engineering/config.example.yaml` copy, the centralized `docs/guides/configuration.md` reference, and the affected consumer skill docs in the same change. Ordinary keys may also live in optional checkout-local `config.local.yaml` (overrides the repo file). `docs_root` belongs only in `config.yaml`. Durable team instructions still belong in the project's normal agent-instructions mechanism.
- Fork releases are cut by hand: bump the version in `package.json`, `plugin.json`, and `.omp-plugin/marketplace.json` together, then tag. There is no release automation in this fork.
- `CHANGELOG.md` is upstream history; fork release notes live on the tag.

Useful validation commands:

```bash
jq . .omp-plugin/marketplace.json
bun test tests/omp-native-install.test.ts tests/plugin-manifest-conformance.test.ts
```

## Runtime vs Authoring Context

`AGENTS.md` is authoring context for this source repository. Skills are installed into end-user environments, where they run against the user's local instruction files, not this repo's. Behavioral rules that must affect a skill at runtime belong in that skill's `SKILL.md` or files under its own `references/` directory.

## Working on Skills

This repository authors each skill once and distributes it across multiple agent models and harnesses. A skill is a set of goals, not a state machine: it hands the agent the goal, the done condition, the safe failure direction, and the facts it cannot derive from the repo in front of it, then gets out of the way. `docs/solutions/skill-design/portable-agent-skill-authoring.md` is the standard; the rules in this file supplement it and take precedence where more specific.

**Before creating, editing, reviewing, or acting on review feedback for anything under `skills/**`, invoke the repo-local `ce-skill-work` skill** (`.agents/skills/ce-skill-work/`, which OMP discovers directly as a repo-local skill). It carries the procedures for each of those four activities, the audit questions, the provenance rule for removals, and the validation contract. The same routing applies when a skill-authoring best practice itself changes or is newly learned — a prompt-guide lesson, a tuning that demonstrably worked, a standard-level correction: invoke `ce-skill-work` and record the practice in `docs/solutions/skill-design/portable-agent-skill-authoring.md` (and here when it must be always-loaded), never only in one skill's prose. This file states only what must be always-loaded; when the two disagree, fix the disagreement rather than following the shorter one.

Three rules that hold regardless of whether the skill was invoked:

- **State conditions, not procedures or cases.** When a block keeps absorbing "add the case we just found" — in authoring, in a review round, or in your own fix to a finding — the representation is wrong. Delete the additions and restate the goal, then re-verify against every path the additions served; a restatement that no longer names a path is a new defect, not a simplification.
- **Prescribe a mechanism only where it is owned.** A delegating skill states the condition, the safe failure direction, and the non-derivable callee facts, never a re-derivation of the callee's commands (`docs/solutions/skill-design/skill-gates-state-conditions-not-prescribed-git-commands.md`).
- **Bring the block you touch up to the standard**; leave untouched blocks alone and name them as follow-up. Skills predate the standard and evolve toward it.

### User-Facing Skill Invocations

Keep agent-to-agent or skill-to-skill routing semantic: format formal skill names as inline code (for example, `ce-plan`) and invoke the named skill through the active harness's callable skill mechanism. When a skill prints or copies a user-runnable invocation, default to `/skill-name`. On OMP, keep the default form for model-visible targets; use native `/skill:<name>` only when the target is not model-visible because it declares `disable-model-invocation` or `hide` (for example, `/skill:ce-polish`). In prose, render only the invocation as inline code; use a fenced block only when the command stands alone. Output exactly one form. Do not apply this rendering rule to built-in commands such as `/goal`.

At runtime, put the smallest self-contained rendering rule immediately before the smallest section that contains all affected user-copy seams. Do not repeat it in every step; repeat it only in a separately loaded reference that independently owns output.

### Reviewing a skill change (bots and humans)

Review bots read this file when reviewing a PR here. On `skills/**`:

- **A finding is a gap in the goal, the done condition, or the safe failure direction; over-prescription that degrades degrees of freedom; or a mechanism at the wrong owning layer** — commands prescribed in a skill that delegates that work, repeated command blocks where one parameterized recipe would decide the same behavior, a model-invoked description that opens with identity boilerplate or catalogs one branch, a category opener that omits the distinctive mechanism, a quoted-utterance catalog on a model-invoked skill, per-step done checks not protecting a fragile gate, repeated ask-first gates not marking a different external/destructive/scope/user-only boundary, a rule placed where it will not fire, a construct that cannot run on OMP, a rendering that breaks on OMP.
- **A case a stated condition already covers is not a finding.** Before filing "what if X" against a rule, check whether the rule's condition decides X. If it does, do not file; if the condition is wrong or missing, file *that*.
- **State the requested fix as a condition or an owning-layer move, never as a case to add.** "Command X fails in state Y" against a delegating skill is a finding about the representation; the fix is to drop the command and state the condition, not to correct the command.
- **A block restated to the standard is the expected shape of an edit**, not scope creep, when the restatement covers every path the old text served.
- Ordinary code under `src/`, `tests/`, and `scripts/` gets ordinary code review; these rules are about instruction prose.

### Acting on review feedback

This governs any agent or tool that acts on review feedback in this repository — `ce-resolve-pr-feedback`, another vendor's resolver, or a person — and on `skills/**` it takes precedence over the tool's own "default to fixing". Skill prose is not code: a natural-language instruction can always be made more specific, so a reviewer can produce a valid-looking edge case against any condition indefinitely, and patching each one dilutes the instruction (#1397: 24 findings over nine rounds on a two-condition step). A case the stated condition already decides is answered with the condition, not patched; only a wrong or missing condition, or a mechanism at the wrong owning layer, is a fix. On the second round against the same block, restate it rather than qualify it. The full procedure — Evidence, Owning layer, Mechanism, Reconcile, Stop the accretion loop — is `ce-skill-work`'s respond mode.

## Referencing Project Conventions in Skills

When a skill needs to discover a project convention at runtime — the issue tracker, coding standards, commit format, lint command, scope constraints, etc. — describe **what to look for in the agent's existing context**, not **which file to open**.

**On the read path, do not name the instruction file (`AGENTS.md`).** Phrase it as "the project's active instructions and conventions already in your context." Three reasons:

- **Redundant.** OMP auto-injects the project's root instruction file into context at session start (OMP loads `AGENTS.md`). Telling the agent to "read `AGENTS.md`" asks it to re-open content it already has.
- **Brittle / not portable.** OMP loads `AGENTS.md` at session start, so a hardcoded "read `AGENTS.md`" asks for content already in context and silently finds nothing where that context is absent, such as a fresh subagent without the project context.
- **Security smell.** Instructing an agent to go *read named instruction dotfiles* is the exact shape that prompt-injection defenses in some agent frameworks (e.g., Hermes) flag. Referencing context rather than filenames avoids tripping those guards.

**Name a concrete file only where the skill must do something a context reference can't express:**

- **Writing a convention back** (e.g., persisting `project_tracker: linear`) needs a target — name it minimally and as an example ("the project's root agent-instructions file, e.g., `AGENTS.md`; if it `@`-includes another, write to the substantive one").
- **Reading content that is genuinely not auto-loaded** — a subdirectory-scoped instruction file governing the area being changed, an optional project doc like `STRATEGY.md` / `CONCEPTS.md` / `README.md`, or any file a *fresh subagent* (which does not inherit the parent's loaded instructions) must open to do its job. Auditing tools that must enumerate every criteria file are a legitimate exception — they review the files, they don't re-read them for context. `ce-code-review`'s project-standards reviewer globs `CODING_STANDARDS.md`, the designated criteria source, and reads `AGENTS.md` only as criteria for changed files that no `CODING_STANDARDS.md` governs.

**Describe the capability, not the tool.** Pair this with naming the *category* of thing rather than a closed set: "the project's issue tracker (e.g., GitHub Issues, Linear, Jira)" and "whatever interface that tracker exposes (connector/MCP, documented API, or a documented CLI)" — never assume a specific CLI exists, and never treat a missing binary / env var / MCP server as proof the capability is unavailable.

## Validating Agent and Skill Changes

Behavioral changes to a plugin skill or skill-local persona (anything under `skills/`) need a different validation path than mechanical code changes, because of how OMP loads plugins.

- **Test prose changes by injecting the current on-disk skill into a fresh agent.** Plugin skills cache at session start, so invoking the edited skill in the authoring session tests stale content. This repository does not ship an eval skill. The portable path is the host CLI you already have, against a skill dir extracted from a ref: `bun run test:skill-eval-cell`. Named scenarios (pre-change contract vs current tree) run with `bun run test:skill-eval-pack -- --skill <name> --arm ab`. That uses `omp` on PATH and bills OMP, not a separate API key.

- **Plugin agent and skill definitions both cache at session start.** Once an OMP session is open, dispatching a typed plugin agent runs the in-memory copy that was loaded when the session began. The same applies to skills: invoking a skill goes through the cached skill loader, so edits to skill scripts are also not tested via that path. File edits to either layer after session start do not propagate within the same session. Any iteration loop built around typed-agent dispatch or Skill-tool invocation in the same session is testing pre-edit content, not your changes.

- **Do NOT edit `~/.omp/plugins/cache/` or `~/.omp/plugins/marketplaces/` to try to force a reload.** Those paths are user machine state, not repo-managed. Modifying them does not reliably bypass the in-session cache (it didn't, in observed behavior), risks being silently overwritten by plugin updates, and is the wrong layer to test from. Inject current disk content into a fresh agent instead; if you genuinely need fresh-loaded behavior of the typed-agent dispatch path, restart the session.

- **A version-matched cache is not automatically stale — confirm by content, not by version.** A marketplace install copies the plugin into `~/.omp/plugins/cache/plugins/<marketplace>___<plugin>___<version>/`; an `omp plugin link` install is a live symlink. Do not assume the running copy is stale just because it lives under the cache — compare a distinctive edited line.

- **Mechanical changes do not have this restriction.** Skill scripts (e.g., `extract-metadata.py`), parser logic, and anything `bun test` exercises always run the current source. The caching issue only affects LLM-driven skill prose behavior dispatched through the plugin loader.

## CI and Quality Gates

PR CI (`.github/workflows/ci.yml`) is the merge gate. It runs, in order: PR-title lint (PRs only) and `bun run test`. Do not invent a parallel local-only mechanical suite — if a check is deterministic and should block merges, put it in one of those steps (usually `bun run test`).

The `test` script runs `bun test --parallel`, which distributes test *files* across worker processes (one file still runs its own tests serially, and `--parallel` implies `--isolate`). This is the single biggest lever on CI wall time, because most of the suite is spent blocked on subprocesses — `python3`, `bash`, `git`, and `bun run src/index.ts` — not on CPU. Keeping it in the package script rather than the workflow means CI and a contributor's local run cannot drift apart.

That makes cross-file isolation load-bearing rather than incidental: a test file may not depend on another file's leftovers, and any test that writes outside its own `mktemp` directory is a latent flake. There are no exceptions — a test that needs a dirty tree builds a throwaway git repo for it.

**A test that runs a bundled script which inspects the repository must point that script at a throwaway repo, never this checkout.** Otherwise the developer's uncommitted work becomes test input. `tests/skills/ce-code-review-cross-model-routes.test.ts` ran the real review script against `git diff HEAD` in the checkout, so any uncommitted change over roughly 160KB crossed the script's large-diff threshold and failed 31 of its tests for reasons unrelated to the change under test. CI never saw it, because CI runs on a committed tree. The fixture pattern is `dirtyFixtureRepo()` in that file: `git init` a temp dir, two commits so `HEAD~1` resolves, then one staged edit.

**Do not pin a worker count.** `--parallel` with no value tracks the runner's core count, which is what you want. Raising it looks free — the suite is idle-bound, so more workers should pack better — but it was measured on CI and it is not: at `--parallel=8` on a 4-core runner, wall time improved ~9% (102s -> 93s) while total test-CPU inflated from 223s to 343s, and five tests crossed the 5000ms default per-test timeout. That converts runner busyness into red builds. A file that legitimately runs for seconds should call `setDefaultTimeout` instead, as the subprocess-heavy suites do.

A file never splits across workers, so an oversized file sets a floor. The former unit workspace suite was 4,564 lines and 86 tests under one `describe`; it was split into five shard files sharing one helpers harness. Measured with three `workflow_dispatch` runs per ref in the same window, the `Run tests` step went from a median of 88s (87/112/88) to 81s (83/80/81). That stack was later deleted as orphaned (no native-path caller invokes it), so its shard paths are history; the measured lesson stands.

**Splitting bought ~8% of CI wall time and most of the run-to-run variance** — baseline spread 25s, split spread 3s. That second effect is the durable one: a 60s serial file makes wall time depend on which worker takes it, so a busy runner produced the 112s outlier. Locally the same split is much larger (160s -> 75s), because a developer machine has enough cores for the long file to be the whole critical path.

**Do not use `bun test --parallel=4` on a many-core laptop as a CI proxy.** It predicted a 26% CI win where the real number was 8%: capping bun to four workers still leaves the other cores absorbing the `git` / `python3` / `bash` subprocess load, so it does not behave like a 4-core runner. Dispatch the real workflow on both refs instead.

At 81s the suite is nearer CPU-bound on a 4-core runner than bounded by its slowest file, so further file splitting has small returns; `tests/ce-babysit-pr-snapshot.test.ts` (~36s) is the largest remaining file and was deliberately left intact.

**Size a test file by its measured time, not its line count.** A file is a wall-time problem when it approaches the suite's slowest-file ceiling. Roughly a thousand lines under one `describe` is a smell worth measuring, never a threshold to split at on sight — splitting a file that already runs well under the ceiling buys nothing. Get per-file times before deciding:

```bash
bun test --parallel --reporter=junit --reporter-outfile=/tmp/t.xml
```

The former shards each ran 10-23s against that ~36s ceiling, so two of them sitting just over a thousand lines was fine and they were deliberately left whole while the stack lived. Put shared fixtures in `tests/skills/helpers/`.

### What belongs where

| Kind of check | Where it lives | Notes |
|---|---|---|
| Deterministic invariants (frontmatter, parity, path safety, script behavior, OMP catalog/manifest agreement, greppable skill contracts) | `bun test` | Must pass in CI |
| Skill *prose behavior* (routing judgment, restraint, cross-model peer outcomes) | Fresh-agent eval (on-disk skill injected), local / PR evidence | Not a CI job; non-deterministic and needs a model |

That split is intentional. See `docs/solutions/skill-design/portable-agent-skill-authoring.md` ("Evaluate proportionally"). Mechanical checks belong in CI; behavioral agent evals are best-effort evidence, not an exhaustive CI matrix.

### Right-size new mechanical guards

When a review bot or human finds a greppable invariant that `bun test` missed:

1. Prefer **tightening an existing guard** over adding a new suite (e.g. widen a regex that already documents the rule).
2. Pin the **smallest falsifiable unit** — a token, enum, path, heading, or one fixture that would have failed on the regressing diff. Do not snapshot whole skill bodies or pin incidental wording.
3. If the failure needs an LLM to judge, keep it as a behavioral eval; do not fake it as a brittle string test.

### Maintaining the OMP load surfaces

- `tests/omp-native-install.test.ts` asserts the catalog shape (`name`, single `./` plugin entry, naming rules) and that `.omp-plugin/marketplace.json`, `package.json`, and `plugin.json` agree on `version`. Bump all three together when cutting a release; never one alone.
- `omp install --dry-run --json .` must keep listing `./.pi/extensions/compound-engineering.ts` and `./skills`; the extension is the key omp loads the plugin through.

## Coding Conventions

- `src/` stays limited to the repo tooling commands (`list`, `plugin-path`) and the frontmatter parser. Plugin loading is OMP-native via `package.json#pi` and `.pi/extensions/compound-engineering.ts`; do not reintroduce converters, per-host writers, or install paths.

## Commit Conventions

- **Prefix is based on intent, not file type.** Use conventional prefixes (`feat:`, `fix:`, `docs:`, `refactor:`, etc.) but classify by what the change does, not the file extension. Files under `skills/` and plugin manifests are product code even though they are Markdown or JSON. Reserve `docs:` for files whose sole purpose is documentation (`README.md`, `docs/`, `CHANGELOG.md`).
- **Type selection — classify by intent, not diff shape.** Where `fix:` and `feat:` could both seem to fit, default to `fix:`: a change that remedies broken or missing behavior is `fix:` even when implemented by adding code, and net additions do not turn a fix into a `feat:`. Reserve `feat:` for capabilities the user could not previously accomplish where nothing was broken. Other conventional types (`chore:`, `refactor:`, `docs:`, `perf:`, `test:`, `ci:`, `build:`, `style:`) remain primary when they describe the change more precisely than either. Heuristic: if a regression test you could write today would have failed *before* the change, it's `fix:`. The user may override this default for a specific change.
- **Include a component scope.** The scope appears verbatim in the changelog. Pick the narrowest useful label: skill/agent name (`document-review`, `learnings-researcher`), CLI or marketplace area (`cli`, `marketplace`), or shared area when cross-cutting (`review`, `research`, `omp`). Never use `compound-engineering` — it's the entire plugin and tells the reader nothing. Omit scope only when no single label adds clarity.
- **Never use `!` or a `BREAKING CHANGE:` footer without explicit user confirmation.** These markers signal a major version bump — a decision the user may not want even when a change is technically breaking. If a change appears breaking, surface that to the user and let them decide whether to apply the marker.

## Specialist Prompt Assets in Skills

The compound-engineering plugin no longer ships standalone agent definitions under `agents/`. When a skill needs a specialist persona, store it inside that skill directory, usually under `references/agents/` or `references/personas/`, and have the calling skill dispatch a generic subagent with that file's contents in the prompt.

Internal prompt asset file names should be descriptive and unprefixed because they are not externally exposed agent names.

Example:
- `references/agents/learnings-researcher.md` (correct)
- `references/agents/ce-learnings-researcher.md` (wrong for an internal prompt asset)

These prompt assets must not include YAML frontmatter. Model selection, tool constraints, and dispatch policy belong in the calling skill's `SKILL.md`, not in the prompt asset.

## File References in Skills

Each skill directory is a self-contained unit. A SKILL.md file must only reference files within its own directory tree (e.g., `references/`, `assets/`, `scripts/`) using relative paths from the skill root. Never reference files outside the skill directory — whether by relative traversal or absolute path.

Broken patterns:

- `../other-skill/references/schema.yaml` — relative traversal into a sibling skill
- `/home/user/compound-engineering-plugin/skills/other-skill/file.md` — absolute path to another skill
- `~/.omp/plugins/cache/plugins/<marketplace>___<plugin>___<version>/skills/other-skill/file.md` — absolute path to an installed plugin location

Why this matters:

- **Runtime resolution:** Skills execute from the user's working directory, not the skill directory. Cross-directory paths and absolute paths will not resolve as expected.
- **Unpredictable install paths:** Plugins installed from the marketplace are cached at versioned paths. Absolute paths that worked in the source repo will not match the installed layout, and the version segment changes on every release.

If two skills need the same supporting file, duplicate it into each skill's directory. Prefer small, self-contained reference files over shared dependencies.

> **Note (March 2026):** This constraint reflects current OMP skill resolution behavior. OMP resolves each skill directory as a self-contained unit with no shared-files mechanism or cross-skill imports. If OMP introduces such a mechanism in the future, this guidance should be revisited with supporting documentation.

## Lean Repo Grounding

Use the project's active instructions already in the main agent's context, then go directly to task-specific current evidence. Pass fresh subagents the relevant project and task context, or have them read the applicable current instruction source when operational rules affect their work. If a task cannot be scoped from that context, use one targeted probe. Do not create a reusable generic repo profile or run a default root, stack, or layout scan.

## Platform-Specific Variables in Skills

This plugin is authored once for oh-my-pi (omp). Do not use platform-specific environment variables or string substitutions (e.g., `${OMP_PLUGIN_ROOT}`, `${OMP_SKILL_DIR}`, `${OMP_SESSION_ID}`, `OMPCODE`, `OMP_SANDBOX`) in skill content without a graceful fallback that works when the variable is unavailable or unresolved.

How a bundled-file reference resolves depends on *who* resolves it and whether a shell is involved, so references fall into three tiers. Do not assume a bare `scripts/…` path behaves the same in all three.

**Tier 1 — Read-time file references (relative, no anchor):** When skill *content* points the agent at a co-located file to read (e.g., "read `references/schema.yaml`"), use a relative path from the skill root. The skill loader resolves these against the skill's own directory on all major platforms — no variable prefix needed. This is the rule in *File References in Skills* above.

**Tier 2 — Prose pointers to a bundled file the agent acts on (relative + a "from this skill's directory" cue):** When skill prose names a bundled file the agent will use but does *not* put it in an executed shell command (e.g., "drive the loop with `scripts/hitl-loop.template.sh`" or "generate the package with `scripts/review-package BASE HEAD`"), use a relative path plus an explicit "from this skill's directory" phrase. The cue tells the agent what to resolve against without the verbosity of an anchor.

**Tier 3 — Executed shell commands (the `SKILL_DIR` anchor):** When skill content puts a bundled script in a command the agent runs through the Bash tool — a fenced ` ```bash ` block **or** an inline `bash …` / `python …` — anchor it to the skill dir. The Bash tool's working directory is the user's **project**, not the skill directory, on OMP, so a bare `bash scripts/my-script.sh` resolves to `<project>/scripts/…`. Relative paths here *often still work* — a capable agent resolves them against the skill dir it loaded (which is how the agentskills.io spec and other ecosystems ship them) — but that relies on the agent translating the path, and the failure mode is a fenced block copied **verbatim** into a Bash call, which runs literally and misses (`exit 127`; recovery is a wasted round-trip that weaker models / mid-tier subagents botch). Anchoring bakes the resolution into the command, so it is **deterministic**. Use the anchor for executed shell as the house default — a conservative choice, not a claim that bare relative *cannot* work (recurring bug class: #764 `ce-worktree`, #811 `ce-code-review`, #898 `ce-compound`):

```
# set inline in the SAME command (shell state does not persist between Bash calls):
SKILL_DIR="<absolute path of the directory containing the SKILL.md you just read>";
bash "$SKILL_DIR/scripts/my-script.sh" ARG
```

**Keep the trailing `;` on the assignment line.** OMP may flatten a fenced multi-line block into a single line by replacing the newline with a space before executing it. Without the `;`, `SKILL_DIR="…"` + newline + `bash "$SKILL_DIR/…"` collapses to the env-var-prefix form `SKILL_DIR="…" bash "$SKILL_DIR/…"`, where the shell expands `$SKILL_DIR` *before* the prefix assignment takes effect — so it expands to empty and the script path becomes `/scripts/my-script.sh` (`No such file or directory`). The trailing `;` makes the assignment a complete statement that survives flattening; it is load-bearing, not a style choice, so do not remove it.

An existence guard (`if [ -f "$SKILL_DIR/scripts/my-script.sh" ]; then … else echo "not found — re-check the SKILL.md path"; fi`) is optional — useful when there's a real fallback, but see the permission caveat below before guarding a pinned call.

`SKILL_DIR` is a **model-filled** value, not a harness variable: OMP loads SKILL.md from a real absolute path the agent knows, so the skill instructs the agent to set `SKILL_DIR` to that directory. This works on OMP because it depends on no host-specific variable: `SKILL_DIR` is **not** an env var, yet the script runs because the agent supplies the path. This is the production pattern used by widely-installed skills (e.g. `last30days`). Two constraints: (1) shell state does **not** persist between separate Bash-tool calls, so `SKILL_DIR` cannot be set once and reused — each invocation must carry the absolute path (set it inline in the same command). (2) A script that needs its *own* directory (to read a sibling file) derives it from `BASH_SOURCE`, not `SKILL_DIR`, since `SKILL_DIR` is the orchestrator's shell var and is not exported to the child process — see `skills/ce-code-review/scripts/cross-model-adversarial-review.sh` for the reference implementation. `last30days` adopted this anchor for its critical multi-host engine after a path-resolution regression; it is the right tool when a script must run *reliably*, which is why it is the tier-3 default — but tiers 1 and 2 deliberately stay lighter.

**Avoid variable-substituted skill dirs here: in this OMP plugin it is a footgun, not a neutral alternative.** Every skill in this repo is authored once and runs on OMP, where a substituted dir value is empty when unresolved, and a substituted SKILL.md content value (not an env var) is empty when unresolved. So a substituted-guard call's `then` branch quietly never fires: the genuine silent skip. The model-filled `SKILL_DIR` anchor works on OMP, so it is the right replacement wherever a substituted-guard executed-shell call exists today (tier 3). Do not reach for a substituted dir as a "portable" option: it is not. Reach for it only for behavior that will never run on OMP: which, given this plugin's OMP install model, is essentially never; treat any new use as a smell to justify or remove.

So: a skill's *core* behavior **can** live in a bundled script across hosts — invoke it via the `SKILL_DIR`-from-read-path anchor. You no longer need to avoid bundled scripts for portability; anchor them instead. Read-time references (`references/*.md`) still resolve against the skill dir on all targets and need no anchor.

**Permission caveat (OMP).** OMP's permission checker evaluates every subcommand of a compound command, and a bare `[ -f ... ]` test is not pre-approved, so wrapping a pinned `bash "...sh"` call in an `if ... then ... fi` guard defeats a narrow `Bash(bash *...sh)` allow-rule and prompts on every run. If a bundled-script call must stay auto-approved via such a pin, keep it a single pinned command rather than guarding it inline. Note the model-filled `SKILL_DIR` anchor produces a dynamic absolute path that will not match a static `Bash(bash /.../scripts/x.sh)` pin regardless of guarding, so for the anchor, expect a one-time approval prompt per distinct command (or use a broader allow-rule); the static-pin trick mainly applies to the fixed variable form.

**Do not use `!` load-time pre-resolution in skills.** The `!`cmd`` SKILL.md syntax runs `cmd` at skill load and inlines its stdout, but it is banned here (enforced by `tests/skill-shell-safety.test.ts`) for two unfixable reasons: it is inert literal text on OMP, and where it does run, a command that exits non-zero aborts skill load with a user-facing error. Every real use was git context (`git rev-parse …`, `gh pr view …`) whose non-zero exit is a *normal* state (no PR yet, no `origin/HEAD`, detached HEAD, not a repo), so the ordinary case broke the skill. The POSIX guards that force exit 0 (`2>/dev/null || echo SENTINEL`) then fail to parse under Windows PowerShell 5.1, which broke skill load there instead (issue #1066). No single command string both exits 0 on the expected-failure states and parses under both POSIX sh and PowerShell, so the construct cannot be made safe.

**Gather context at runtime instead.** Have the agent run one argv-style command per shell tool call (`git …`, `gh …`) — no `;`, `&&`, `||`, pipes, `$(…)`, or redirects — and interpret each exit status as control flow. This parses identically under POSIX sh and PowerShell because it is a single external-program invocation, and a non-zero exit becomes data the agent reads rather than a load-time abort. See `ce-commit` / `ce-commit-push-pr` for the pattern.

**When a platform variable is unavoidable:** resolve it at runtime with a single shell tool call and include explicit fallback instructions, so the agent knows what to do if the value is empty, a literal command string, or an error: e.g. run `jq -r .version "${OMP_PLUGIN_ROOT}/plugin.json"`; if it resolved to a semantic version use it, otherwise fall back to the versionless behavior. This applies equally to any platform variable: a skill that assumes platform-only variables exist without a fallback has the same problem.

## Repository Docs Convention

- **Guides** live in `docs/guides/` — the user-facing skill catalog and configuration reference. Keep them here, not under `skills/`, so they do not ship inside the plugin package.
- **Plans** live in `docs/plans/` — unified plan artifacts. New `ce-brainstorm` outputs are requirements-only unified plans (`artifact_readiness: requirements-only`); `ce-plan` enriches them to implementation-ready plans (`artifact_readiness: implementation-ready`). Historical `docs/brainstorms/*-requirements.*` files remain readable legacy inputs and should not be migrated just because a new plan is created.
- **Brainstorm evidence / legacy requirements** may live in `docs/brainstorms/` — historical requirements docs and specialized analysis artifacts such as `docs/brainstorms/riffrec-feedback/`. Do not treat this as the canonical output path for new `ce-brainstorm` artifacts.
- **Solutions** live in `docs/solutions/` — documented solutions to past problems (bugs, best practices, workflow patterns), organized by category with YAML frontmatter (`module`, `tags`, `problem_type`). Relevant when implementing or debugging in documented areas.
- **Specs** live in `docs/specs/` — target platform format specifications.

### Solution categories (`docs/solutions/`)

This repo builds a plugin *for* developers. Categorize solutions from the perspective of the end user (a developer using the plugin), not a contributor to this repo.

- **`developer-experience/`** — Issues with contributing to *this repo*: local dev setup, shell aliases, test ergonomics, CI friction. If the fix only matters to someone with a checkout of this repo, it belongs here.
- **`integrations/`** — Issues where a skill misbehaves on the host platform or OS. Cross-platform bugs and host-specific tool behavior go here.
- **`workflow/`**, **`skill-design/`** — Plugin skill and agent design patterns, workflow improvements.

When in doubt: if the bug affects someone running the installed plugin, it's an integration or product issue, not developer-experience.
