# Skill-eval cell driver

Extract `skills/<name>` from a git ref and run the same prompt headlessly through the `omp` CLI. Uses whatever provider auth your existing omp setup already has. No extra API key, no extra harness.

One cell per invocation: `hosts_run` is always `["omp"]` and `summary.json` records the single cell under `cells.omp`. Exit 2 only when the `omp` CLI is not on PATH. Not in default `bun test` except mechanical pins (`hosts.test.ts`, `extract.test.ts`, `path-shim.test.ts`).

## Run

```bash
bun run test:skill-eval-cell -- \
  --skill ce-debug \
  --fixture tests/skill-eval-cell/fixtures/seat-cap \
  --git-init \
  --shim-git-push \
  --task "mode:pipeline the seat cap test is failing. Run node tests/seat-cap.check.js."
```

`--git-remote` (catalog: `git_remote: true`) adds a fake `origin` whose `main` is the seed commit, so a shipping tail takes the push/PR path — where `--shim-git-push` then fails — instead of the local-commit path it takes when no remote exists.

`--read-only` enforces the fake boundary, it does not merely suggest it: the cell runs `--tools read,grep,glob`, which the default `always-ask` approval mode auto-approves. The write arm runs `--tools read,grep,glob,edit,write,bash` plus `--approval-mode yolo` — the cell spawns with stdin from `/dev/null`, so any approval prompt would burn the full `--timeout-secs`.

Prints a `summary.json` path. The cell gets its own workspace copy plus stdout/stderr, git status/log, and a file list. PATH shims live beside that workspace, never inside it, so the skill under test never sees harness files as its own dirty tree. Grade those; stdout is plain text and the `FILES_READ:`/`ACTIONS:` trailers are greppable lines.

Each invocation requires a new or empty `--out` directory and records input and
evidence fingerprints. Packs freeze their scenario criteria and grader hashes.
Regrading applies current criteria by default; `--mode original` reproduces the
recorded assessment. Both write separate reports and preserve original grades.
See [reproducible evaluation evidence](reproducibility.md) for regrading commands,
partial collection outcomes, legacy-pack compatibility, and snapshot limits.

Gotchas baked in: discovery isolation (`--no-skills --no-rules --no-extensions`) keeps installed plugin copies, user-profile skills, and repo-local `.omp/` surfaces from serving the cell instead of the extracted git-ref skill; `--approval-mode yolo` on the write arm; `NO_COLOR=1`.

## Sweep A/B pack

Cases live in `catalog.ts`, authored from the skill bodies **before** the 8KB merges (`PRE_SWEEP_REF` = parent of #1433). The same prompt runs against that ref, then against the **working tree** (`POST_SWEEP_REF` = the `WORKTREE` sentinel, the default `--ref`). `git archive` only ever sees committed content, so the post arm copies `skills/<name>` off disk — that is what lets you grade a skill edit before committing it. Pass a real git ref to `--ref` for a committed arm. See `scenarios.md` for the inventory.

```bash
bun run test:skill-eval-pack -- --list
bun run test:skill-eval-pack -- --wave1 --arm ab
bun run test:skill-eval-pack -- --id ce-babysit-pr/refuse-unasked-update --arm ab
bun run test:skill-eval-pack -- --id lfg/plan-first --arm ab
```

`--arm ab` is pre+post for every catalog skill (the 8KB sweep is fully merged). `--wave1` is the cheap read-only decision set, not every scenario. Live mutation and oracle dispatch are separate ids. The pack exits non-zero when any arm failed, after writing `pack.json`, so it can be used as a check. `ok` is the only verdict: a listed `files_read_post` miss fails the cell; unlisted references are not graded. Not in default `bun test`.
