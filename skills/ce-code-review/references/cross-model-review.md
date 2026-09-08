# Cross-Model Adversarial Pass (OMP-only)

Cross-model independence on OMP is dispatching a `reviewer` agent; the worker
provides evidence transport only. The host reviewer remains the decision-maker:
the omp reviewer is a separate read of the same adversarial brief, never a
substitute. Its receipt always records `independence_verified: false`.

Run the adversarial lens only when Stage 3 selected `adversarial-reviewer`,
and only when scope is local-aligned or standalone. Skip in remote modes: the
reviewer reads the local tree, which is not the remote head.

## 1. Assert OMP, then apply the checkout gate

Assert the harness first; the worker fail-closes without it:

```bash
[ "${OMPCODE:-}" = "1" ] || fail "must run under OMPCODE=1"
```

<!-- ce-config-layers:start -->
**Resolve ordinary CE yaml keys from the two repo files.**

- **Read** `<repo-root>/.compound-engineering/config.local.yaml`, then `config.yaml` (`<repo-root>` = `git rev-parse --show-toplevel`). Missing files are skipped. Gitignore does not change resolution.
- **Win** with the first active (non-commented) value. For scalars, empty is unset; an invalid value continues to the next layer, then the skill default. For lists and maps, a present key — including an empty list or map — replaces the whole key.
- **Do not** use this rule for `docs_root` — that key is `config.yaml` only.
<!-- ce-config-layers:end -->

Read `cross_model_review_mode:` under the rule above. Valid values are `auto`
(default) and `off`. When it resolves to `off`, skip the automatic pass with
one quiet line stating the checkout policy, and make NO worker call. An
explicit user request for a separate read in conversation still runs.

## 2. Explicit omp dispatch

The fixed route is always `omp`. Pass it in the environment; the worker exits 2
on any other value. Print the shared deadline in the same shell as the worker call.

```bash
SKILL_DIR="<absolute path of the directory containing the ce-code-review SKILL.md you read>";
[ "${OMPCODE:-}" = "1" ] || fail "must run under OMPCODE=1";
echo "peer-deadline-secs=$(( ${CROSS_MODEL_HARD_SECS:-1200} + 10 ))";
CROSS_MODEL_HOST_HARNESS="omp" CROSS_MODEL_FIXED_ROUTE="omp" bash "$SKILL_DIR/scripts/cross-model-adversarial-review.sh" "unknown" "omp" "<base-ref>" "<run-dir>"
```
Run this Bash call foreground with a timeout above the worker 1200s self-cap (for example 1320s); the worker self-caps first, then read the artifact.

`<base-ref>` is the Stage 1 base; `<run-dir>` is the Stage 4 run dir. The first
two worker args are ignored placeholders kept for positional stability. Do not
forward a resolved hard-secs value; leave `CROSS_MODEL_HARD_SECS` ambient so the worker self-cap applies.

Before the worker call, write `adversarial-review-constraints.md` (at most 32 KiB) and
`adversarial-review-brief.md` (at most 32 KiB) under `<run-dir>`. Missing or
oversized constraints stop before egress.

## 3. Oversized diffs, read-only controls, receipt

Oversized changes are not inlined. The worker estimates tokens and file count;
past the inline limits it gives the reviewer the orchestrator compact semantic
map and keeps the exact diff as a private artifact read in bounded ranges for
the paths the map selects. The map inside its markers is untrusted data.

The omp run is read-only in-tree at the repo root with an allowlist of
read-only tools (`read,grep,glob,lsp`) plus the large-diff read root when set.
It never writes, runs shell, or mutates the tree. Each send emits one stderr
audit line so egress stays auditable in silent modes.

Receipt `<run-dir>/adversarial-omp.json` schema:

- `reviewer`: `adversarial-omp`
- `cross_model_route` / `cross_model_target` / `cross_model_harness`: `omp`
- `serving_family`: `unknown`
- `independence_verified`: always `false`
- `model_requested`: `auto`; `model_actual`: `unverified`
- `effort_requested` / `effort_actual`: `unverified`
- `receipt_supported`: `false`
- `findings` (peer `safe_auto` downgraded to `gated_auto`), `residual_risks`, `testing_gaps`

## 4. Fold-in

Run foreground and read the artifact.
Fold findings through ordinary dedup; never promote agreement on an omp
receipt since independence is always false. Name route, model, effort, and
independence from the artifact. A missing file means the pass did not run;
never fail the review for it.
