# Cross-Model Judgment Pass (OMP-only)

Cross-model independence on OMP is dispatching a `reviewer` agent; the worker
provides evidence transport only. Each lens keeps its in-process twin as the
decision-maker: the omp reviewer is a separate read of the same persona brief,
never a substitute. Its receipt always records `independence_verified: false`.

Run one call per activated trio lens (`security-lens`, `adversarial`,
`product-lens`) plus one `whole-doc` sweep of the full document, only when that
lens was activated by Phase 1 selection. No new activation triggers exist.

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
SKILL_DIR="<absolute path of the directory containing the ce-doc-review SKILL.md you read>";
[ "${OMPCODE:-}" = "1" ] || fail "must run under OMPCODE=1";
echo "peer-deadline-secs=$(( ${CROSS_MODEL_HARD_SECS:-1200} + 10 ))";
CROSS_MODEL_HOST_HARNESS="omp" CROSS_MODEL_FIXED_ROUTE="omp" bash "$SKILL_DIR/scripts/cross-model-doc-review.sh" "unknown" "omp" "<reviewer-name>" "<document-path>" "<document-type>" "<origin>" "$RUN_DIR"
```
Run this Bash call foreground with a timeout above the worker 1200s self-cap (for example 1320s); the worker self-caps first, then read the artifact.

The first two worker args are ignored placeholders kept for positional
stability. `<reviewer-name>` derives the persona brief and is never a path.
Documents over `CROSS_MODEL_MAX_DOC_CHARS` skip cleanly rather than truncate.
Do not forward a resolved hard-secs value; leave `CROSS_MODEL_HARD_SECS` ambient so the worker self-cap applies.

## 3. Oversized input, read-only controls, receipt

Inputs that exceed the inline budget are not truncated: oversized documents
skip, and sliced trio lenses receive the same reviewer-specific slice their
in-process twin got while `whole-doc` always receives the full document. The
reviewer never rebuilds the full text from slices.

The omp run uses an empty private scratch dir as its working dir with no tools
(`--no-tools`), no project context, and the document embedded in the prompt. It
never writes outside its scratch. Each send emits one stderr audit line so
egress stays auditable in silent modes.

Receipt `<run-dir>/<reviewer-name>-omp.json` schema:

- `reviewer`: `<reviewer-name>-omp`
- `cross_model_route` / `cross_model_target` / `cross_model_harness`: `omp`
- `serving_family`: `unknown`
- `independence_verified`: always `false`
- `model_requested`: `auto`; `model_actual`: `unverified`
- `effort_requested` / `effort_actual`: `unverified`
- `receipt_supported`: `false`
- `findings` (peer `safe_auto` downgraded to `gated_auto`), `residual_risks`, `deferred_questions`

## 4. Fold-in

Run foreground and read the artifact.
Fold findings through ordinary synthesis; never promote agreement on an omp
receipt since independence is always false. A missing file means the pass did
not run; never fail the review for it.
