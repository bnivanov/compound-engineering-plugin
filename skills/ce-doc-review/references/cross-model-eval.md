# Cross-Model Judgment Pass: Skill-Creator Eval Spec

This is the eval-case specification for the cross-model judgment pass. It is the
**load-bearing behavioral gate**: `bun test` does
not exercise SKILL.md/reference prose, and plugin skill definitions cache at
session start, so behavioral wiring must be validated through the `skill-creator`
skill's eval workflow, which injects the current on-disk skill/reference content
into a fresh subagent at dispatch time (per AGENTS.md "Validating Agent and Skill
Changes"). Run it with `/skill-creator` and its eval workflow; do not rely on
in-session typed-agent dispatch (it tests the pre-edit cached copy).

The pass is a `task` `reviewer` dispatch, not a shell worker. This eval covers
the parts only an end-to-end behavioral run can prove.

## Eval cases

Each case injects the current `SKILL.md`, `references/cross-model-review.md`, and
`references/synthesis-and-presentation.md`, then asserts the orchestrator behaves
as specified.

Run them with the fake-CLI harness pattern: a stub `omp` CLI placed first on
PATH, on OMP.

1. **Activation gate: fires (R1, R2).** A document that activates at least one
   trio lens (e.g. a greenfield plan with a high-stakes domain activating
   `security-lens`, or a requirements doc with challengeable claims activating
   `adversarial`) → the orchestrator runs one foreground
   `cross-model-doc-review.sh` worker call per activated trio lens, in the same
   dispatch wave as the in-process reviewers. Assert: a worker call runs for
   each activated trio lens and none for non-activated lenses.

2. **Activation gate: does not fire (R2, R3).** A routine plan with validated
   upstream provenance (`product_contract_source: ce-brainstorm`), no high-stakes
   domain, and no new abstraction → no trio lens activates → **no** worker call
   runs. Assert: zero worker calls; the review completes normally.

3. **Excluded lenses never run cross-model (R3).** For a document that activates
   `feasibility`/`coherence`/`scope-guardian` but no trio lens, assert no
   worker call runs for any of those lenses.

4. **Fixed omp dispatch precedes egress (R7, R15, R16).** Assert the
   orchestrator passes `CROSS_MODEL_HOST_HARNESS` set to `omp` and
   `CROSS_MODEL_FIXED_ROUTE` set to `omp` in the environment; the worker exits 2
   on any other value. The orchestrator discloses the document-content egress,
   prints the shared deadline in the same shell as the worker call, then runs
   the worker foreground with a Bash timeout above the worker 1200s self-cap
   and reads the artifact.

5. **Context slots threaded (R13).** Assert the orchestrator passes `document_type`
   (the Phase 1 classification) and `origin` (the same `{origin_path}` slot the
   in-process personas receive) to each worker call.

6. **Fixed route on every lens (R4; R5 superseded).** Assert every activated
   trio lens uses the fixed `omp` route. Prose does not restate model IDs; the
   receipt records requested `auto` with serving model unverified.

7. **Fold-in with no promotion on an omp receipt (R8, R9, R18).** Given a
   stubbed `<reviewer-name>-omp.json` return with `independence_verified: false`
   whose finding merged with an in-process twin, assert synthesis keeps the
   merged finding as attributed evidence with no agreement promotion. Assert the
   finding is **never** rendered/applied as
   `safe_auto`. Also assert the promotion
   path stays capped: a **worker-only** `manual` finding at confidence 100 with a
   mechanically-implied `suggested_fix` is **not** promoted to `safe_auto` by 3.6
   nor silently applied by 3.7, unless an in-process reviewer independently raised
   the same finding (merged twin in 3.3). Assert the cap withholds *apply
   authority only*: a worker-only `manual` finding **stays `manual` on the decision
   surface** and is not demoted into the grouped confirmation, since `Apply all`
   would otherwise sweep a genuine choice, and a `manual` finding may carry no
   `suggested_fix` to apply at all. Only a worker-only finding the table would have
   sent to Apply is diverted to the batch.

8. **Announce by mode (R12).** Interactive host, default mode → before egress, a
   prominent line names the fixed `omp` route, requested `auto` with serving
   model unverified, and document-content egress scope. It never calls the pass
   independent since independence is always false.
   Non-interactive mode → no user-facing prose about the pass (the script still emits the
   stderr egress audit log).

9. **Non-blocking (R11).** With the `omp` CLI absent/unauthed, or with the worker
   failing after dispatch, assert the review completes with all in-process
   findings. A never-started pass reports "cross-model pass: not run"; a started
   failed pass is named with its terminal state.

10. **Whole-document sweep + trio slicing (R20, KTD6, KTD3).** When the pass runs,
    assert exactly **one** additional `whole-doc` worker call runs (not one per
    lens) on the **full** document, folds in as `whole-doc-omp`, and remains
    attributed evidence without promotion since the artifact records
    `independence_verified: false`. The
    sweep is never `safe_auto`. Assert that on a **unified plan** the trio reviewers
    receive their in-process twin's slice (e.g. product-lens/adversarial get the
    Product Contract), not the full document.

11. **Unverified-identity announce.** On this route, which carries no
    served-model receipt, assert the announce/reconcile wording reads
    "requested auto; serving model unverified on this route" rather than
    asserting a concrete serving model.

## Pass criteria

All eleven cases pass on the current on-disk source, and case 2 confirms the
conditional cost profile (no worker call on a routine validated plan).
