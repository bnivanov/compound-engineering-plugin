# Cross-Model Adversarial Pass: Skill-Creator Eval Spec

This behavioral eval covers ce-code-review's host-task adversarial orchestration.
Inject the current `SKILL.md`, `references/cross-model-review.md`, and Stage 5
synthesis prose through the `skill-creator` workflow. Run on OMP with controlled
host `task` returns and host/backend attestation metadata.

## Eval cases

1. **Activation uses the existing gate.** A local-aligned or standalone diff
   selecting `adversarial-reviewer` starts the separate pass at Stage 3d, subject
   to the checkout policy and explicit user prohibition. A trivial diff without
   that persona starts none. Both `pr-remote` and `branch-remote` skip the
   separate pass and keep the selected in-process adversarial lens.

2. **Dispatch uses one reviewer task.** Before dispatch, the orchestrator writes
   separate constraints and semantic-brief files under the private run directory,
   each at most 32 KiB. Missing or oversized constraints prevent dispatch. It then
   sends one host `task` item with `agent: reviewer`, the read-only persona
   prompt, and allowed tools `read`, `grep`, `glob`, and `lsp`. The prompt
   forbids shell and writes. No shell worker, subprocess, or foreign CLI runs.
   Collect the terminal return with the host's blocking collection capability.

3. **Fold-in requires attested independence.** An `adversarial-omp.json` receipt
   promotes agreement or licenses the validator shortcut only when
   `independence_verified: true`: the known serving family differs from the
   session family and comes from host/backend attestation, never reviewer prose.
   A stub with `independence_verified: false` matching an ordinary reviewer
   finding remains attributed evidence, not corroboration. Unknown or same-family
   attestation cannot promote. OMP findings never gain silent apply authority;
   reviewer `safe_auto` is downgraded to `gated_auto`.

4. **Failures are non-blocking.** A reviewer agent that cannot start, fails,
   times out, or returns a missing or unusable artifact is named in Coverage.
   The in-process review completes; a did-not-run pass restores the selected
   in-process `adversarial-reviewer`, never a duplicate completed same-brief
   review. The separate pass's failure alone does not fail the review.

5. **Disclosure reflects the receipt.** Human-facing mode names requested
   `reviewer`, route `omp`, and the host-attested serving model or
   `unverified`. It never calls an unverified pass independent. Receipt fields
   preserve attested versus unverified provenance; requested identity and reviewer
   prose do not establish the serving model. `mode:agent` emits no progress
   prose and preserves this information in its structured artifacts.

6. **Oversized diffs use paths, not giant prompts.** A fixture above the inline
   token or file-count limit gives the reviewer the orchestrator's compact
   semantic map plus a private exact-diff path, never the whole diff in the
   prompt. The orchestrator derives material risk divisions; the reviewer reads
   bounded ranges and narrows them further rather than returning a progress
   note or silently omitting the pass. Normal-sized fixtures retain direct diff
   access without manufacturing semantic shards.

## Pass criteria

All six cases pass on the current on-disk source on OMP. Negative activation
cases dispatch no separate reviewer task. Eligible cases dispatch exactly one;
only host-attested different-family receipts promote agreement. Failure remains
visible and non-blocking, and no finding gains implicit mutation authority.
