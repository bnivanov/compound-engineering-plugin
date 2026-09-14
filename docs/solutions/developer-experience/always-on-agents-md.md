---
title: "Always-on AGENTS.md vs task-loaded contributor notes"
date: 2026-09-12
last_updated: 2026-09-14
category: developer-experience
module: compound-engineering
problem_type: best_practice
component: development_workflow
severity: medium
applies_when:
  - Editing root AGENTS.md / CLAUDE.md
  - Changing CI layout, scratch roots, or platform-variable skill prose
  - Deciding whether an instruction belongs in the always-on file
tags:
  - agents-md
  - context-tax
  - astra
  - ci
  - scratch
  - portability
---

# Always-on AGENTS.md vs task-loaded notes

Root `AGENTS.md` (also `CLAUDE.md`) loads on every turn. Keep invariants there. Load the sections below only when the task needs them.

[OpenAI's Astra note](https://developers.openai.com/blog/rethinking-skills-and-prompts-for-gpt-6-astra) is the reason this split exists: a stack of docs before every edit burns context, and extra test-cheerleading causes extra tests. The always-on file already has Lean Repo Grounding. These notes are the essays that used to sit beside it.

## Scratch-root layout

Default to OS temp. Use `.context/` only when the artifact is repo-bound and user-curated, branch-inseparable, or the path is core UX. Copy the scratch-root preamble from any shipped skill (for example `skills/ce-explain/SKILL.md`); do not re-derive it. `tests/scratch-root-preamble-executes.test.ts` runs every copy, including the fallback.

- **Per-run throwaway:** `mktemp -d "${TMPDIR:-/tmp}/<prefix>-XXXXXX"` (OS handles cleanup). Use for files consumed once and discarded — captured screenshots, stitched GIFs, intermediate build outputs, recordings, delegation prompts/results, single-run checkpoints. Always pass an explicit template under `${TMPDIR:-/tmp}`. Do not use bare `mktemp`, bare `mktemp -d`, `mktemp -t`, or `mktemp -d -t`: those forms ignore `$TMPDIR` on macOS and can resolve outside a sandbox's writable temp directory.
- **Cross-invocation reusable:** use a stable, effective-user-owned prefix under `/tmp/compound-engineering-<effective-uid>/<skill-name>/` — **not** `mktemp -d` — so later invocations by the same OS user can find prior outputs without sharing a writable root with other users. Derive the effective UID with `id -u`, reject a symlink or path not owned by the current user, and create or repair the top-level root to mode `0700` before use. **Probe before committing to `/tmp`:** when that root cannot be created, is not yours, or is not writable, use `${TMPDIR:-/tmp}/compound-engineering-<effective-uid>` instead — the same rule, in the same order, in every shell preamble and Python default, so a later invocation resolves the same root. OMP's macOS sandbox allowlists writes under `$TMPDIR` (`/tmp/omp-<uid>`) but not `/tmp` itself, so without the fallback every skill's scratch setup aborts there with `Operation not permitted`; and an existing root from an unsandboxed session passes `mkdir -p` as a no-op yet refuses the first write, which is why the probe is a writability check (`[ -w ]`), not creation alone. The default layout is one `<scratch-root>/<skill-name>/<run-id>/` directory per run; use it for caches keyed by session, checkpoints meant to survive context compaction, intermediate state, and outputs whose lifecycle or mutation belongs to one run.
- **Discoverable collection exception:** omit the per-run directory only when later invocations intentionally enumerate multiple sibling **final artifacts** as core product behavior and run isolation would materially worsen discovery or the user-facing path. Use a stable collection namespace (for example, repository identity plus a `general` fallback), descriptive immutable filenames, metadata that supports ranking, and no-overwrite collision handling that atomically reserves the final filename and retries with the next suffix on collision; never check availability and then write. Do not use this exception for caches, checkpoints, intermediate files, or merely to shorten a path.
- Prefer `/tmp` over `$TMPDIR` so paths stay accessible: `$TMPDIR` on unsandboxed macOS resolves to `/var/folders/64/.../T/`, which is hostile for users who want to inspect checkpoints, grep them, or copy them out — which is why `$TMPDIR` is the fallback, taken only when `/tmp` cannot host the root, and never the first choice. The explicit effective-UID segment supplies the required cross-user boundary while preserving a readable path. Agents running as the same OS user intentionally remain in one discretionary-access-control principal.
- **Exception: `.context/`** — use only when the artifact is genuinely bound to the CWD repo AND meets at least one of: (a) **User-curated**: the user is expected to inspect, manipulate, or manually curate the artifact outside the skill; (b) **Repo+branch-inseparable**: the artifact's meaning is inseparable from this specific repo or branch; (c) **Path is core UX**: surfacing the artifact path back to the user is a core part of the skill's output and that path is easier to communicate as a repo-relative location. Namespace under `.context/compound-engineering/<workflow-or-skill-name>/`, add a per-run subdirectory when concurrent runs are plausible, and decide cleanup behavior per the artifact's lifecycle. "Shared between skills" is not by itself sufficient — OS temp handles that equally well.
- Durable outputs (plans, specs, learnings, docs, final deliverables) belong in `docs/` or another repo-tracked location, not in either scratch tier.
- **Cross-platform note:** `/tmp` is writable on macOS (symlink to `/private/tmp`), Linux, and WSL. For per-run throwaway files, use an explicit `${TMPDIR:-/tmp}` template so macOS and sandboxed hosts honor the selected temp parent. Skills authored here assume Unix-like shells (bash on macOS/Linux, or Git Bash on Windows). Native Windows is a supported target for Python interpreter resolution and peer-job detach — never hardcode `python3`; probe execution per `docs/solutions/conventions/resolve-python-interpreter-not-python3.md`.

## CI wall-time notes

Load when changing test-file layout, worker counts, or CI proxies.

The `test` script runs plain `bun test --parallel`, which distributes test *files* across worker processes (one file still runs its own tests serially, and `--parallel` implies `--isolate`). Keeping it in the package script rather than the workflow means CI and a contributor's local run cannot drift apart. Bun can lose a child-exit inside a worker (oven-sh/bun#34069) — a timeout followed by a later pass is still the bun shape; this fork does not wrap the run, so a flake shows up as a red run rather than a re-run that masks it.

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

## Plugin-cache confirmation

Load when deciding whether an OMP session is running your current skill edit.

A version-matched cache is not automatically stale — confirm by content, not by version. A marketplace install copies the plugin into `~/.omp/plugins/cache/plugins/<marketplace>___<plugin>___<version>/`; an `omp plugin link` install is a live symlink. Do not assume the running copy is stale just because it lives under the cache, and do not assume a matching `<version>` segment means it includes your latest edit — edits within a release do not bump the version. Diff the specific cache file against the working-tree file, or compare a distinctive edited line. Never infer "stale" or "current" from the version segment alone. Do not edit `~/.omp/plugins/cache/` or `~/.omp/plugins/marketplaces/` to force a reload.

## Platform-variable tiers

Load when writing executed shell in a skill. The always-on file keeps the invariant and the `SKILL_DIR` shape.

This plugin is authored once for oh-my-pi (omp). Do not use platform-specific environment variables or string substitutions (`${OMP_PLUGIN_ROOT}`, `${OMP_SKILL_DIR}`, `${OMP_SESSION_ID}`, `OMPCODE`, `OMP_SANDBOX`) in skill content without a graceful fallback that works when the variable is unavailable or unresolved.

How a bundled-file reference resolves depends on *who* resolves it and whether a shell is involved, so references fall into three tiers. Do not assume a bare `scripts/…` path behaves the same in all three.

- **Tier 1 — Read-time file references (relative, no anchor):** when skill *content* points the agent at a co-located file to read (e.g., "read `references/schema.yaml`"), use a relative path from the skill root. The skill loader resolves these against the skill's own directory — no variable prefix needed.
- **Tier 2 — Prose pointers to a bundled file the agent acts on (relative + a "from this skill's directory" cue):** when skill prose names a bundled file the agent will use but does *not* put it in an executed shell command, use a relative path plus an explicit "from this skill's directory" phrase. The cue tells the agent what to resolve against without the verbosity of an anchor.
- **Tier 3 — Executed shell commands (the `SKILL_DIR` anchor):** when skill content puts a bundled script in a command the agent runs through the Bash tool — a fenced ` ```bash ` block **or** an inline `bash …` / `python …` — anchor it to the skill dir. The Bash tool's working directory is the user's **project**, not the skill directory, so a bare `bash scripts/my-script.sh` resolves to `<project>/scripts/…`. Relative paths here *often still work* — a capable agent resolves them against the skill dir it loaded — but that relies on the agent translating the path, and the failure mode is a fenced block copied **verbatim** into a Bash call, which runs literally and misses (`exit 127`; recovery is a wasted round-trip that weaker models / mid-tier subagents botch). Anchoring bakes the resolution into the command, so it is **deterministic**. Use the anchor for executed shell as the house default — a conservative choice, not a claim that bare relative *cannot* work (recurring bug class: #764 `ce-worktree`, #811 `ce-code-review`, #898 `ce-compound`):

```
SKILL_DIR="<absolute path of the directory containing the SKILL.md you just read>";
bash "$SKILL_DIR/scripts/my-script.sh" ARG
```

**Keep the trailing `;` on the assignment line.** OMP may flatten a fenced multi-line block into a single line by replacing the newline with a space before executing it. Without the `;`, `SKILL_DIR="…"` + newline + `bash "$SKILL_DIR/…"` collapses to the env-var-prefix form `SKILL_DIR="…" bash "$SKILL_DIR/…"`, where the shell expands `$SKILL_DIR` *before* the prefix assignment takes effect — so it expands to empty and the script path becomes `/scripts/my-script.sh` (`No such file or directory`). The trailing `;` makes the assignment a complete statement that survives flattening; it is load-bearing, not a style choice, so do not remove it.

An existence guard (`if [ -f "$SKILL_DIR/scripts/my-script.sh" ]; then … else echo "not found — re-check the SKILL.md path"; fi`) is optional — useful when there's a real fallback, but see the permission caveat below before guarding a pinned call.

`SKILL_DIR` is a **model-filled** value, not a harness variable: OMP loads SKILL.md from a real absolute path the agent knows, so the skill instructs the agent to set `SKILL_DIR` to that directory. It works because it depends on no host-specific variable: `SKILL_DIR` is **not** an env var, yet the script runs because the agent supplies the path. Two constraints: (1) shell state does **not** persist between separate Bash-tool calls, so `SKILL_DIR` cannot be set once and reused — each invocation must carry the absolute path (set it inline in the same command). (2) A script that needs its *own* directory (to read a sibling file) derives it from `BASH_SOURCE`, not `SKILL_DIR`, since `SKILL_DIR` is the orchestrator's shell var and is not exported to the child process — see `skills/ce-code-review/scripts/cross-model-adversarial-review.sh` for the reference implementation.

**Avoid variable-substituted skill dirs here: in this OMP plugin it is a footgun, not a neutral alternative.** A substituted dir value is empty when unresolved, and a substituted SKILL.md content value (not an env var) is empty when unresolved, so a substituted-guard call's `then` branch quietly never fires: the genuine silent skip. The model-filled `SKILL_DIR` anchor works on OMP, so it is the right replacement wherever a substituted-guard executed-shell call exists today (tier 3). Do not reach for a substituted dir as a "portable" option: it is not. Reach for it only for behavior that will never run on OMP: which, given this plugin's OMP install model, is essentially never; treat any new use as a smell to justify or remove.

**Permission caveat (OMP).** OMP's permission checker evaluates every subcommand of a compound command, and a bare `[ -f ... ]` test is not pre-approved, so wrapping a pinned `bash "...sh"` call in an `if ... then ... fi` guard defeats a narrow `Bash(bash *...sh)` allow-rule and prompts on every run. If a bundled-script call must stay auto-approved via such a pin, keep it a single pinned command rather than guarding it inline. Note the model-filled `SKILL_DIR` anchor produces a dynamic absolute path that will not match a static `Bash(bash /.../scripts/x.sh)` pin regardless of guarding, so for the anchor, expect a one-time approval prompt per distinct command (or use a broader allow-rule); the static-pin trick mainly applies to the fixed variable form.

**Do not use `!` load-time pre-resolution in skills.** The `!`cmd`` SKILL.md syntax runs `cmd` at skill load and inlines its stdout, but it is banned here (enforced by `tests/skill-shell-safety.test.ts`) for two unfixable reasons: it is inert literal text on OMP, and where it does run, a command that exits non-zero aborts skill load with a user-facing error. Every real use was git context (`git rev-parse …`, `gh pr view …`) whose non-zero exit is a *normal* state (no PR yet, no `origin/HEAD`, detached HEAD, not a repo), so the ordinary case broke the skill. The POSIX guards that force exit 0 (`2>/dev/null || echo SENTINEL`) then fail to parse under Windows PowerShell 5.1, which broke skill load there instead (issue #1066). No single command string both exits 0 on the expected-failure states and parses under both POSIX sh and PowerShell, so the construct cannot be made safe.

**Gather context at runtime instead.** Have the agent run one argv-style command per shell tool call (`git …`, `gh …`) — no `;`, `&&`, `||`, pipes, `$(…)`, or redirects — and interpret each exit status as control flow. This parses identically under POSIX sh and PowerShell because it is a single external-program invocation, and a non-zero exit becomes data the agent reads rather than a load-time abort. See `ce-commit` / `ce-commit-push-pr` for the pattern.

**When a platform variable is unavoidable:** resolve it at runtime with a single shell tool call and include explicit fallback instructions, so the agent knows what to do if the value is empty, a literal command string, or an error: e.g. run `jq -r .version "${OMP_PLUGIN_ROOT}/plugin.json"`; if it resolved to a semantic version use it, otherwise fall back to the versionless behavior. This applies equally to any platform variable: a skill that assumes platform-only variables exist without a fallback has the same problem.
