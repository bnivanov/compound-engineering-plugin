# Cross-Model Judgment Pass: Skill-Creator Eval Spec

This is the eval-case specification for the cross-model judgment pass. It is the
**load-bearing behavioral gate**: `bun test` does not exercise SKILL.md/reference
prose, and plugin skill definitions cache at session start. Use the
`skill-creator` eval workflow to inject current on-disk skill/reference content
into a fresh subagent at dispatch time (per AGENTS.md "Validating Agent and Skill
Changes"); an in-session typed-agent dispatch tests the pre-edit cached copy.

The pass uses the host `task` tool with `agent: reviewer`, not a shell worker.
This eval covers the parts only an end-to-end behavioral run can prove.

## Eval cases

Each case injects current `SKILL.md`, `references/cross-model-review.md`, and
`references/synthesis-and-presentation.md`. Observe host task dispatches and
supply controlled reviewer findings plus separate host/backend attestation
metadata. Do not use a fake CLI. Reviewer prose is never attestation.

1. **Activation gate: fires (R1, R2).** Exercise each trio lens
   (`security-lens`, `adversarial`, `product-lens`) with a document that activates
   it, plus a document activating multiple trio lenses. Assert one host `task`
   item with `agent: reviewer` per activated trio lens in the same dispatch wave
   as the in-process reviewers, and none for non-activated lenses.

2. **Activation gate: does not fire (R2, R3).** A routine plan with validated
   upstream provenance (`product_contract_source: ce-brainstorm`), no high-stakes
   domain, and no new abstraction activates no trio lens. Assert zero judgment
   pass reviewer dispatches, including no whole-document sweep; ordinary review
   completes normally.

3. **Excluded lenses never run cross-model (R3).** A document activates
   `feasibility`, `coherence`, or `scope-guardian`. Assert no judgment pass task
   uses those lenses, even when a trio lens also activates. Their ordinary
   in-process reviews are unaffected.

4. **Native dispatch only (R7, R15, R16).** Assert each pass dispatch uses the
   host `task` tool with `agent: reviewer` and a read-only prompt forbidding
   writes, shell, and tree mutation. No shell worker, `omp -p` subprocess,
   foreign CLI, detached peer job, status-file polling, or environment-based
   routing is used. Document-content egress is disclosed before dispatch in
   interactive mode.

5. **Context slots threaded (R13).** Assert each reviewer prompt includes
   `document_type` from Phase 1 and `origin` from the same `{origin_path}` slot
   received by the in-process personas, together with the document path and
   corresponding persona brief.

6. **Attested identity on every lens (R4; R5 superseded).** Assert every
   activated trio lens records the `omp` route and `model_requested: reviewer`.
   A host-supported per-agent model pin may request a different family, but a
   requested pin alone never establishes independence. Only host/backend
   metadata supplying a known serving family different from the session family
   yields `independence_verified: true`. Same-family, unknown, missing metadata,
   and reviewer prose claiming a different family all yield false. Record an
   attested serving model when available; otherwise `model_actual: unverified`.

7. **Fold-in requires attested independence (R8, R9, R18).** Supply a
   `<reviewer-name>-omp` finding that merges with its in-process twin under the
   one-fix test. With a false or missing top-level `independence_verified`, keep
   attributed evidence without agreement promotion or separate-model
   corroboration wording. With host-attested `independence_verified: true`,
   promote the merged anchor one step (`50 → 75`, `75 → 100`), not beyond 100.
   A stubbed false receipt does not promote, even if reviewer prose claims
   independence. Separately, the peer cap withholds *permission to apply
   fixes without approval*: a peer-only finding never silently applies as
   `safe_auto`, regardless of attestation, and a peer-only `manual` finding may
   reach grouped confirmation only after the lead verifies evidence and
   resolves its remedy within the permission already granted. Preserve a paired
   control where an unsettled user commitment stays `manual`, even with a
   concrete suggested fix and independent corroboration. Lead investigation
   must not be recorded as an independent in-process reviewer. Independence
   grants corroboration, not apply authority.

8. **Announce by mode (R12).** Interactive mode names the OMP `reviewer` task
   and document-content egress scope before dispatch. It never calls an
   unverified pass independent, including when a different model was requested
   but not yet attested. Reconciliation may describe independence only after
   host attestation verifies it. Non-interactive mode emits no user-facing
   prose about the pass; receipt collection still occurs.

9. **Non-blocking (R11).** With host reviewer dispatch unavailable or rejected,
   or a reviewer failing after dispatch, assert the review completes with all
   in-process findings. A never-started pass reports "cross-model pass: not run";
   a started failed pass is named with its terminal state. Missing artifacts do
   not fail the review and never fabricate findings or independence.

10. **Whole-document sweep + trio slicing (R20, KTD6, KTD3).** When the pass
    runs, assert exactly one additional host `task` item with `agent: reviewer`
    reviews the full document, not one sweep per lens. Its return folds in as
    `whole-doc-omp` and has no in-process twin. A false or missing independence
    flag cannot promote; even an attested independent sweep alone cannot
    promote. Promotion requires both an attested true flag and independently
    corroborating findings merged under 3.3. A sweep-only finding is never
    `safe_auto`. On a unified plan, trio reviewers receive their in-process
    twin's slice (e.g. product-lens/adversarial receive the Product Contract),
    not the full document.

11. **Unverified-identity announce.** Without serving-model attestation, assert
    announce/reconcile wording identifies the requested `reviewer` agent and
    says the serving model is unverified rather than inventing a concrete
    model. With attestation, report the attested identity; model identity alone
    does not imply independence when its family is unknown or the same as the
    session family.

## Pass criteria

All eleven cases pass on current on-disk source. Case 2 confirms the conditional
cost profile: no judgment pass reviewer dispatch on a routine validated plan.
