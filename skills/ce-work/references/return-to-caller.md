# Return to Caller

Read this when input triage enters Return-to-Caller Mode, and read it again immediately before returning. Input triage owns and validates the invocation grammar. This file owns the full producer envelope, evidence gate, idempotent recovery, and exclusion of standalone simplify, review, PR, CI, and babysitting work.

In this mode `ce-work` performs implementation and local verification only — including mid-implementation Phase 2 "Simplify as You Go" — then returns a structured summary instead of running the standalone shipping tail.

Return:

- `status`: `complete`, `blocked`, or `failed`
- `plan_path`
- `changed_files`
- `u_ids_attempted`
- `u_ids_completed`
- `verification_results`
- `verification_evidence`: one structured entry per attempted unit, plus any non-behavioral unit where tests were intentionally skipped. Each entry is a JSON object the emission gate parses mechanically — `unit` (the U-ID or task id), `behavior_changed` (boolean), `existing_tests_inspected`, `tests_added_or_changed`, `tests_used_unchanged`, `exception_reason` (non-empty only when discharging by deliberate exception), and `verification` (commands/results, plus the red failure or characterization observed when applicable). For units executed by subagents, this entry is assembled from each worker's returned evidence, not reconstructed from the diff — the red-before-implementation observation exists only in the worker's report. Prose-only entries fail the gate.
- `run_id`: durable external run identifier, or `null` for native execution
- `source_kind` and `source_digest`: controller-recorded implementation authority (`plan` plus its digest in Return-to-Caller Mode; standalone bare-prompt runs use `prompt`)
- `unit_receipts`: route, model, detached-process, integration, verification, canonical-commit, and cleanup state for each attempted unit
- `plan_checkpoint`: the disclosed checkpoint commit when the selected plan was the only canonical dirt, otherwise `null`
- `blockers`
- `recovery_path`: preserved owner-checked run/workspace location when recovery remains, otherwise `null`
- `settled_decision_conflicts`: conflicts with `session-settled:`-labeled KTDs or Key Decisions encountered during implementation — each entry names the labeled entry, the evidence, and how it was routed (proceeded-and-flagged vs blocker); empty when none
- `behavior_change`: whether behavior-bearing code changed
- `standalone_shipping_skipped: true`

Return `status: complete` only when behavior-bearing work has verification evidence or a deliberate exception. If a previous return-to-caller run implemented code but omitted evidence, a later same-plan return-to-caller run should use the idempotency check to inspect the existing work, complete the evidence, and return without reimplementing.

## Envelope emission gate

Enforcement evaluates at this envelope's emission, never at worker return — a per-worker hook would promote unverified work. Before emitting any result in this mode, run the bundled gate `scripts/envelope-gate.py`: fully assembled envelope on stdin, `--plan <plan_path>`, and `--continuations <n>` (the count of prior gate blocks this run, starting at 0). The gate is read-only, so a block preserves all state by construction. Its exit code owns emission:

- **0 (`pass`)** — emit the envelope as assembled.
- **2 (`block`)** — emission is refused. Fix the named defect and re-run the gate with `--continuations` set to the verdict's `continuations` value, or emit `status: blocked` carrying the gate's reason. Never emit `complete` past a block.
- **3 (`blocked_with_recovery`)** — emit `status: blocked` with the gate's reason and `recovery_path`; do not retry past it in this run.

The gate enforces four mechanisms at this single point:

1. **UNVERIFIED-never-PASS.** `status: complete` requires every attempted unit's evidence entry to show tests added or changed, tests used unchanged, or an explicit `exception_reason`. A unit with no verification evidence cannot emit a PASS envelope — the gate blocks naming the unit.
2. **Plan re-injection.** The gate re-reads the plan file from disk and renders its verdict against that fresh read, so a compacted or drifted context cannot emit an envelope grounded in remembered plan content. Re-read the plan yourself before assembling the envelope too; after any compaction during the run, the gate's disk read is the re-injection guarantee that survives context loss.
3. **SHA-256 tamper attestation.** The gate recomputes the plan file's SHA-256 and compares it to the recorded `source_digest`. A mismatch emits blocked-with-recovery with state preserved — never re-baseline the digest, never edit the plan to match. Recovery is restoring the plan file or obtaining a re-disclosed checkpoint from the caller; the verdict echoes `plan_checkpoint` for exactly that.
4. **Deterministic stop gate.** Work-failure blocks are bounded: at the 8th consecutive block — matching the host `session_stop` continuation cap — the gate converts to blocked-with-recovery instead of holding indefinitely. Environmental failures (unreadable plan, missing `source_digest`, unparseable envelope) emit blocked-with-recovery immediately, never a hold.

A gate that cannot run is a missing bundled reference: stop before emission and report the missing owner per the kernel's fail-closed rule. Never emit an ungated envelope.

Implementation in this mode is always native: run inline or via subagents under `references/execution-strategy.md`. Do not emit a copyable goal/workflow prompt — a manual paste step strands the caller; run inline/subagents or return a blocker instead, and never open a PR, run the owner workflow tail, or bypass the caller-owned gates.
