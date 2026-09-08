# Cross-Model POV Panel (OMP-only)

Cross-model independence on OMP is dispatching a `reviewer` agent; the worker
provides evidence transport only. ce-pov remains the decision-maker: the omp
voice is a separate read of the framed question, never a vote. Its receipt
always records `independence_verified: false`.

Discovery is explicit-only. There is no automatic panel: run an omp voice only
when the user explicitly asks for a separate read, names the panel behavior, or
requests an independent cross-check in conversation. A request for the POV take
alone does not dispatch. Never auto-start a worker on silence.

## 1. Assert OMP and freeze scope

Assert the harness before any egress; the worker fail-closes without it:

```bash
[ "${OMPCODE:-}" = "1" ] || fail "must run under OMPCODE=1"
```

Normalize one read scope (workspace root plus optional include/exclude
patterns) and pass the identical scope to the prompt and the run. Point at
repository files instead of copying their contents; inline conversation-only
material only when it is unavailable in the tree. Capture the committed
revision plus a digest of dirty content in scope and revalidate before fold-in;
on change, disclose and restart rather than folding stale voices.

## 2. Explicit omp dispatch

The fixed route is always `omp`. Pass it in the environment; the worker exits 2
on any other value. Print the shared deadline in the same shell as the worker call.

```bash
SKILL_DIR="<absolute path of the directory containing the ce-pov SKILL.md you read>";
[ "${OMPCODE:-}" = "1" ] || fail "must run under OMPCODE=1";
echo "peer-deadline-secs=$(( ${CROSS_MODEL_HARD_SECS:-600} + 10 ))";
CROSS_MODEL_HOST_HARNESS="omp" CROSS_MODEL_FIXED_ROUTE="omp" CROSS_MODEL_READ_ROOT="<read-root>" bash "$SKILL_DIR/scripts/cross-model-pov.sh" "unknown" "omp" "<payload-path>" "<run-dir>"
```
Run this Bash call foreground with a timeout above the worker 600s self-cap (for example 720s); the worker self-caps first, then read the artifact.

The first worker arg is an ignored placeholder kept for positional stability;
the second must be `omp`. Payloads over `CROSS_MODEL_MAX_PAYLOAD_CHARS` skip
cleanly rather than truncate. Do not forward a resolved hard-secs value; leave `CROSS_MODEL_HARD_SECS` ambient so the worker self-cap applies.

## 3. Oversized input, read-only controls, receipt

Oversized subjects are not truncated per route: a payload that exceeds the
budget skips, and every voice receives the same complete payload. The reviewer
grounds itself from the shared tree within the declared scope and may use
bounded public web checks where the brief allows.

The omp run is read-only least-privilege at the declared read root with an
allowlist of read tools plus bounded web lookup, session-ephemeral with private
scratch outside the repository. It never mutates the project. Each send emits
one stderr audit line so egress stays auditable.

Receipt `<run-dir>/pov-omp.json` schema:

- `voice`: `peer-omp`
- `cross_model_route` / `cross_model_target` / `cross_model_harness`: `omp`
- `serving_family`: `unknown`
- `independence_verified`: always `false`
- `model_requested`: `auto`; `model_actual`: `unverified`
- `effort_requested` / `effort_actual`: `unverified`
- `receipt_supported`: `false`
- `position`, `reasoning`, `evidence`, `external_check`, `mode`, `movement`, `final`

## 4. Fold-in

Run foreground and read the artifact.
Reconcile disagreement in ordinary language; never present the omp voice as
separate-model corroboration since independence is always false. A missing file
means that voice did not run; continue with the surviving panel.
