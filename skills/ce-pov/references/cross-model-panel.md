# Independent POV Panel (OMP-only)

Independence is a peer whose serving family differs from the
session family. Dispatch peers through the host `task` tool.
There is no shell worker and no `omp -p` subprocess. ce-pov remains the
decision-maker: each peer is a separate read of the framed question, never
a vote. The session model aggregates; do not dispatch a third agent to
reconcile.

Discovery is explicit-only. There is no automatic panel: dispatch
only when the user explicitly asks for a separate read, names the panel
behavior, or requests an independent cross-check in conversation. A request
for the POV take alone does not dispatch. Never auto-start a reviewer on
silence. Reversibility tiers size grounding; they do not authorize
dispatch. Foreign CLIs, even via herdr, need the user's explicit ask for
herdr + that CLI.

A summons (panel, cross-check, oracle, council) runs two `task` items in
one batch with distinct agent types, because the host maps one model pin
per type: `agent: reviewer` and `agent: planner`. Both items get the same
framed payload, the same read scope, `references/agents/pov-peer.md`, and
the POV JSON schema. The planner type is a pin, not a planning job.

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

## 2. Dispatch the council

Dispatch one `task` batch of two items:

- `agent: reviewer`
- `agent: planner`

- Read-only. The prompt forbids writes, shell, and tree mutation. Allowed
  tools: `read`, `grep`, `glob`, plus bounded public web lookup where the
  brief allows.
- Prompt: read the framed payload at `<payload-path>`, ground from the shared
  tree within the declared scope, return POV JSON matching
  `references/pov-schema.json`. Seed `references/agents/pov-peer.md`.
  Withhold ce-pov's frozen position from the independent round.

Do not invoke a shell worker. That worker is gone.

If the host exposes a per-agent model pin, those pins are requests, not
serving attestations. Dispatch anyway and record each voice from host
metadata.

If a voice plans, writes, or returns non-schema output, drop that voice
and continue with survivors. Do not weaken read-only to make a type fit.

Payloads over `CROSS_MODEL_MAX_PAYLOAD_CHARS` skip cleanly rather than
truncate.

## 3. Receipt

Write one artifact per voice under `<run-dir>/`:

- `voice`: `peer-omp`
- `cross_model_route` / `cross_model_target` / `cross_model_harness`: `omp`
- `serving_family`: from host/backend attestation of that agent (event-stream or return metadata), else `unknown`
- `independence_verified`: `true` only when `serving_family` is a known family, differs from the session family, AND came from that attestation — never from the reviewer's own prose. Otherwise `false`
- `model_requested`: `reviewer` or `planner`; `model_actual`: attested serving model, else `unverified`
- `effort_requested` / `effort_actual`: `unverified`
- `receipt_supported`: `true` only when `model_actual` is attested, else `false`
- `position`, `reasoning`, `evidence`, `external_check`, `mode`, `movement`, `final`

Claim council-level family diversity only when host metadata attests both
peer families and they are pairwise distinct. Otherwise describe the pair
as two processes, not two families.

## 4. Fold-in

Collect the task returns, then read the artifacts. Reconcile disagreement in
ordinary language in this session. Present any surviving voice as separate-model corroboration only
when that voice's `independence_verified` is `true`. Present the pair as a
cross-family council only when both are `true` and the attested families
differ from each other. A missing file means that voice did
not run; continue with the surviving panel.
