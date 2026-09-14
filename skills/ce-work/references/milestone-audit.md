# Milestone Audit

This file owns the milestone audit grafted into Phase 3 Step 5 (Final Validation). It is a cross-phase audit of the completed work against the plan artifact and the sync record — modeled on gsd-omp's `/gsd-audit-uat` and `/gsd-audit-milestone` commands, with an audit checklist defined here rather than trusted from the upstream source (upstream rigor is unverified).

**Authority boundary.** The audit is done-judgment over artifacts: it judges and reports. It is **read-only over product code** — it never edits product code, never edits the plan artifact or the sync record, and never drives the capability-audit matrix (`docs/omp-capability-audit.md` is at most a read-only input). Recording dispositions in the sync record belongs to the slice's own done condition, not to this audit; an audit that finds a missing disposition reports it as a gap.

**When it runs.** After the Final Validation bullets resolve, before the ship handoff. In Return-to-Caller Mode this audit does not run — the invoking workflow owns the seam. When the run had no plan artifact (concrete-work-prompt runs), record `Milestone audit: skipped (no plan artifact)` in the shipping summary and continue.

**Inputs.** Two artifacts, nothing else:

- The **plan artifact** the run executed from — its Implementation Units (U-IDs), each unit's `Verification` field and `Test scenarios`, the Requirements (or legacy Requirements Trace), the Verification Contract, and the Definition of Done.
- The **sync record** (`docs/upstream-sync.md`) — the disposition ledger (ported / partial / skipped / pending-decision / n/a-fork) and any program-item notes for graft work.

Judge only what these artifacts carry. Do not invent fields, verification states, or dispositions the artifacts do not record — an absence in the artifact is reported as an absence, never filled by inference.

## The Audit Checklist

Work the three checks in order. Each produces named findings or passes.

### 1. Outstanding verification items

For each implementation unit in the plan's Implementation Units section, read that unit's `Verification` field:

- Each verification item that the run's recorded evidence does not demonstrate is an **outstanding item**. Name it in the report as `<U-ID>: <item>`.
- A unit whose plan carries no `Verification` field at all is itself an outstanding item, reported as `U-<n>: plan carries no verification entry` — a gap in the plan artifact, not a pass by default.
- A unit whose verification was satisfied by a recorded exception (e.g. an explicit no-test justification) is outstanding only when the exception was never recorded. Check the shipping summary and the run's task record before calling it satisfied.

### 2. Milestone completion vs stated intent

Compare the delivered state against what the plan stated, not against what the work ended up doing:

- Read the plan's Requirements entries (or Requirements Trace), the unit-level Goals, and the Definition of Done for the units in this run's scope.
- Each unit that delivered something other than its stated goal — a different mechanism, a narrower scope, a substituted approach — is a **divergence**. A divergence is flagged `not passed` and named; it is never silently passed because the delivered substitute looked reasonable.
- A divergence that the sync record or the plan itself already disposes (a recorded disposition, a plan-sanctioned conditional, a session-settled decision the plan names) is reported as a **disposed divergence** — flagged and cited, still visible in the report, not blocking when the disposition covers it.
- A divergence with no recorded disposition blocks the audit.

### 3. Residual accounting

Every outstanding item and divergence from checks 1–2 must land in a recorded home:

- The sync record's disposition vocabulary (ported / partial / skipped / pending-decision / n/a-fork) for plan-level items, or
- The authorized PR's `## Unapplied review findings` section for review-sourced residuals, or
- The shipping summary's deferral notes for run-scoped concerns.

An outstanding item with no recorded home fails the audit. The audit itself does not create the record — it names where the record is missing and who owns writing it.

## Report

End with one of:

- **Pass** — every unit's verification items are demonstrated or covered by a recorded exception; no divergence beyond disposed ones; all residuals accounted for. State the count of units audited and the dispositions relied on.
- **Gap report** — Final Validation is **not passed**. Each finding names its U-ID and item, which check produced it, and whether a recorded home exists. The shipping workflow treats a gap report exactly like a failed Final Validation bullet: the run is not done.

The report goes into the shipping summary alongside the review receipt. It is evidence for the PR description, not a gate the audit itself enforces by editing anything.
