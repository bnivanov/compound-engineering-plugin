# Independent POV Panel (OMP-only)

Independence is a `reviewer` agent whose serving family differs from the
session family. Dispatch it through the host `task` tool (`agent: reviewer`).
There is no shell worker and no `omp -p` subprocess. ce-pov remains the
decision-maker: the reviewer is a separate read of the framed question, never
a vote.

Discovery is explicit-only. There is no automatic panel: dispatch a reviewer
only when the user explicitly asks for a separate read, names the panel
behavior, or requests an independent cross-check in conversation. A request
for the POV take alone does not dispatch. Never auto-start a reviewer on
silence. Foreign CLIs, even via herdr, need the user's explicit ask for
herdr + that CLI.

## 1. Assert OMP and freeze scope

```bash
[ "${OMPCODE:-}" = "1" ] || fail "must run under OMPCODE=1"
```

Normalize one read scope (workspace root plus optional include/exclude
patterns) and pass the identical scope to the prompt. Point at repository
files instead of copying their contents; inline conversation-only material
only when it is unavailable in the tree. Capture the committed revision plus
a digest of dirty content in scope and revalidate before fold-in; on change,
disclose and restart rather than folding stale voices.

## 2. Dispatch the reviewer agent

Dispatch one `task` item:

- `agent: reviewer`
- Read-only. The prompt forbids writes, shell, and tree mutation. Allowed
  tools: `read`, `grep`, `glob`, plus bounded public web lookup where the
  brief allows.
- Prompt: read the framed payload at `<payload-path>`, ground from the shared
  tree within the declared scope, return POV JSON.

Do not invoke a shell worker. That worker is gone.

If the host exposes a per-agent model pin, pin the reviewer to a model whose
family differs from the session family. If it does not, dispatch anyway and
record independence as unverified.

Payloads over `CROSS_MODEL_MAX_PAYLOAD_CHARS` skip cleanly rather than
truncate.

## 3. Receipt

Write `<run-dir>/pov-omp.json`:

- `voice`: `peer-omp`
- `cross_model_route` / `cross_model_target` / `cross_model_harness`: `omp`
- `serving_family`: from host/backend attestation of the reviewer agent (event-stream or return metadata), else `unknown`
- `independence_verified`: `true` only when `serving_family` is a known family, differs from the session family, AND came from that attestation — never from the reviewer's own prose. Otherwise `false`
- `model_requested`: `reviewer`; `model_actual`: attested serving model, else `unverified`
- `effort_requested` / `effort_actual`: `unverified`
- `receipt_supported`: `true` only when `model_actual` is attested, else `false`
- `position`, `reasoning`, `evidence`, `external_check`, `mode`, `movement`, `final`

## 4. Fold-in

Collect the task return, then read the artifact. Reconcile disagreement in
ordinary language. Present the reviewer as separate-model corroboration only
when `independence_verified` is `true`. A missing file means that voice did
not run; continue with the surviving panel.
