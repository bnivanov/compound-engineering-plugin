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

## Sync 2026-09-11

- **Base (merge-base):** `8df67793b9733d2220fa9a7fc37139931471af62` (upstream 3.24.0, 2026-09-08)
- **Upstream HEAD at check:** `c4a643b1e4b87507782293367e7f3110daceea16` (2026-09-11)
- **Range:** 17 commits, 438 files
- **Plan:** `docs/plans/2026-09-11-2257-fix-upstream-sync-ports-plan.md`
- **Branch:** `fix/upstream-sync-ports`

| Commit | Subject | Disposition | Evidence |
|---|---|---|---|
| `b8866a1d` | feat: add experimental Bake-off approach comparison (#1652) | pending-decision | New skill; adoption is a user decision |
| `fe74844c` | fix(ce-bakeoff): drop experimental labeling (#1655) | pending-decision | Presupposes adopting ce-bakeoff; grouped with #1652 |
| `153e605e` | feat(ce-noslop): add the plain-prose skill (#1653) | pending-decision | New skill; adoption is a user decision |
| `bec6b419` | fix: let explain and pov support calling workflows (#1658) | ported | `55269e89`; 30 files; `cross-model-panel.md` hunk skipped (fork's OMP-only rewrite removed the target paragraph; semantics land via ported intake.md/SKILL.md) |
| `b36047e1` | fix(ce-babysit-pr): sustain monitoring after PR handoff (#1659) | ported | `d1172a46`; watch-loop.md condition ported into OMP background-and-wake mechanism; catalog cells translated to OMP scenario shape |
| `b3efbd6c` | fix(review): release collected agents before follow-on work (#1649) | ported | `1998a529` (with ae6226f5); conditions ported into OMP task-dispatch mechanism |
| `235252fa` | feat(site): publish docs site (#1664) | n/a-fork | Fork has no `site/` surface |
| `5130557e` | feat(packs): Compound Packs (#1549) | pending-decision | New subsystem; adoption is a user decision |
| `ae6226f5` | fix(ce-code-review): collect reviewers by attributable terminal outcome (#1667) | ported | `1998a529` (ordered pair with b3efbd6c) |
| `2783b8e3` | fix(site): built HTML at any base path (#1669) | n/a-fork | Fork has no `site/` surface |
| `390b0138` | fix(ce-optimize): focus progress updates on useful findings (#1668) | ported | `92a00fe0`; 8 files; catalog cells translated to OMP shape |
| `16c2b972` | fix: reduce review noise and clarify agent communication (#1657) | partial | `c6ac2dbc`; 50 files ported; 51 upstream files skipped (ce-noslop skill files, upstream-only eval reports, calibration-scenarios.ts module + 44 eval fixtures); `cross-model-panel.md` hunk skipped (fork-adapted) |
| `f831db7c` | fix(ce-optimize): reject incomplete paired baselines (#1651) | ported | `f5819db0`; clean apply, both files identical to base |
| `6a00e35c` | fix(ce-commit-push-pr): preserve ignored files during branch switches (#1647) | ported | `41add928`; contract-test hunks hand-merged onto drifted file |
| `9ac32720` | fix(ce-work): honor CROSS_MODEL_EFFORT_OVERRIDE (#1634) | n/a-fork | Fork deleted `skills/ce-work/scripts/cross-model-work.sh` |
| `1a9f16c4` | refactor(skills): restate skill bodies in plain language (#1671) | skipped | Conflicts wholesale with OMP-adapted prose; revisit only if upstream style becomes canonical. Ported files land at pre-restatement state — re-check them against upstream HEAD if this is ever adopted |
| `c4a643b1` | refactor(skills): restate remaining dense skill references (#1681) | skipped | Same as 1a9f16c4 |

### Port notes

- Ports are file-granular, not cherry-picks: every commit except `f831db7c` fails `git apply --check` on at least one file because the fork drifted. Commit messages cite the upstream SHA.
- `tests/skill-eval-cell/catalog.ts` is contended by four ported commits; it was serialized through units in the order b36047e1 → bec6b419 → 390b0138 → 16c2b972, each translating upstream's `exec_command`-shaped scenario cells to the fork's OMP scenario shape.
- The `16c2b972` catalog hunk imports `calibration-scenarios.ts`, a module the fork lacks — the import and its scenario entries were skipped.
- Fork version `3.24.1-omp.12` is fork-local; upstream remains at 3.24.0.
