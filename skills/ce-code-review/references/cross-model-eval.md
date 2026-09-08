# Cross-Model Adversarial Pass: Skill-Creator Eval Spec

This is the load-bearing behavioral eval for ce-code-review's cross-model
adversarial pass. Deterministic route tests cover the worker; these cases cover
the SKILL.md/reference orchestration that only a fresh agent can execute. Inject
the current `SKILL.md`, `references/cross-model-review.md`, and the relevant
Stage 5 synthesis prose through the `skill-creator` workflow. Run on OMP
with a fake `omp` CLI first on PATH.

## Eval cases

1. **Activation fires only on the existing gate.** A local-aligned or standalone
   diff that selects `adversarial-reviewer` runs one foreground worker call in
   the Stage 4 wave. A trivial diff that does not select the persona runs none.
   A `pr-remote` or `branch-remote` review runs none even when adversarial
   analysis is warranted.

2. **Fixed omp dispatch precedes egress.** The orchestrator passes
   `CROSS_MODEL_HOST_HARNESS` set to `omp` and `CROSS_MODEL_FIXED_ROUTE` set to
   `omp` in the environment; the worker exits 2 on any other value. The
   orchestrator discloses the reviewed-code egress, prints the shared deadline
   in the same shell as the worker call, then runs the worker foreground with a
   Bash timeout above the worker 1200s self-cap and reads the artifact.

3. **Fold-in never promotes on an omp receipt.** Given a stubbed
   `adversarial-omp.json` return with `independence_verified: false` whose
   finding matches the in-process adversarial finding, synthesis keeps it as
   attributed evidence and does not count it as corroboration. Omp findings
   never gain silent apply authority.

4. **Failures are additive and non-blocking.** With the `omp` CLI absent or
   unauthed, no worker call starts and a human-facing markdown review reports
   the pass as not run. A failed or unusable return is named in Coverage and
   the in-process review completes.

5. **Mode-specific disclosure is honest.** Human-facing default mode announces
   the fixed `omp` route and egress before dispatch and never calls it
   independent since independence is always false. The announce names requested
   `auto` with serving model unverified on this route. `mode:agent` emits no
   user-facing prose but retains the worker stderr audit record.

6. **Oversized diffs recover without one giant prompt.** A fixture above the
   inline token or file-count limit gives the reviewer the orchestrator compact
   semantic review map plus a private exact-diff path, never the whole diff.
   The worker does not cut semantic shards or invent risk divisions; the
   orchestrator does, and the adversarial agent reads bounded ranges and narrows
   them further rather than returning a progress note or silently omitting the
   pass. A normal-sized fixture keeps the direct diff path.

## Pass criteria

All six cases pass on the current on-disk source on OMP. The
negative activation cases run no worker, the fixed-route case exits 2 on any
non-`omp` value, and no omp artifact promotes agreement.
