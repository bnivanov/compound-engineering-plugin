# Reading ce-work's structured return (LFG step 2)

LFG's body permits only a valid `status: complete` return to advance and stops every other status or malformed return. This file owns complete-return validation: the required field inventory, the evidence contract, and the one recovery invocation.

## Missing-owner blocked return

When `ce-work` cannot reload its return owner after partial state exists, accept the kernel-owned reduced envelope as a valid terminal blocker rather than a malformed complete return. It contains `status: blocked`, `plan_path`, `run_id` when known, `changed_state`, `blockers`, and `recovery_path`. Preserve those recovery facts and stop; the complete-return field inventory below does not apply to this failure shape.

## Native-only execution

`ce-work` implements and locally verifies native on the current harness and session model. There is no route binding, no fallback, and no requirement strength, so every `status: complete` return describes native work and LFG validates the field inventory and evidence below.

## What `status: complete` must carry

Verify that implementation work was performed — files were created or modified beyond the plan. Require `status`, `plan_path`, `changed_files`, `u_ids_attempted`, `u_ids_completed`, `verification_results`, `verification_evidence`, `source_kind`, `source_digest`, `settled_decision_conflicts`, `behavior_change`, and `standalone_shipping_skipped: true`. The source fields must identify the same plan authority that entered the implementation run. Evidence and conflict fields are present on every complete return; empty arrays are valid when their conditions did not occur.

Also require the receipt fields `run_id`, `unit_receipts`, `plan_checkpoint`, `blockers`, and `recovery_path`. These fields are required on every complete return even when native execution makes some values `null`; together they carry the durable run, per-unit process/integration/verification/commit state, checkpoint disclosure, blockers, and recovery. A resumed return must carry the same `run_id`; never treat resume as permission to start a new unit or a second LFG tail.

## Verification evidence

When `behavior_change: true`, `verification_evidence` must name the relevant units/tasks, existing tests inspected, tests added/changed or used unchanged, red failure or characterization evidence when applicable, verification run, and any deliberate test exception. Do NOT decide the test strategy inside LFG; the evidence is ce-work's contract.

Also read `settled_decision_conflicts` from the return: blocker-routed entries arrive as `status: blocked` and stop the pipeline; **record any proceeded-and-flagged entries** — they must reach step 6's durable residual record and step 8's PR-description context, since later review may not rediscover them.

## The one recovery invocation

If `behavior_change: true` but `verification_evidence` is missing or too vague to tell how behavior was protected, invoke `ce-work` one more time in recovery mode with the same plan path; this preserves the pre-existing native idempotency/evidence-reconciliation path. Do not prompt the user and do not alter the plan path; this is evidence reconciliation, not a fresh dispatch. The recovery relies on ce-work's reconciliation path to inspect the already-implemented work, fill the missing evidence, and return without reimplementing. If the second return still lacks coherent verification evidence, stop as blocked and report the missing fields instead of continuing to simplify/review/ship.
