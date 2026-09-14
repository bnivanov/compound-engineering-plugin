#!/usr/bin/env python3
"""Orchestrator-envelope emission gate for ce-work Return-to-Caller Mode.

Enforcement evaluates at envelope emission, never at worker return (KTD4):
a per-worker hook would promote unverified work. The gate is read-only, so
a block preserves all state by construction.

Mechanisms enforced at this single point:

1. UNVERIFIED-never-PASS: ``status: complete`` requires a structured
   verification-evidence entry per attempted unit, each showing tests added
   or changed, tests used unchanged, or an explicit exception reason.
2. Plan re-injection: the plan is re-read from disk at emission and the
   verdict is rendered against that fresh read, so a compacted or drifted
   context cannot emit an envelope grounded in remembered plan content.
3. SHA-256 tamper attestation: the on-disk plan digest is compared to the
   envelope's recorded ``source_digest``. A mismatch emits
   blocked-with-recovery with state preserved — never a silent re-baseline
   and never a parallel hash file.
4. Deterministic stop gate: environmental failures emit blocked-with-recovery
   immediately; work-failure blocks carry an incrementing continuation count
   bounded at 8 (matching the host ``session_stop`` cap) instead of an
   infinite hold.

Verdict JSON on stdout; exit code owns emission: 0 pass, 2 block
(continuation warranted), 3 blocked-with-recovery.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from typing import Any

CONTINUATION_CAP = 8

PASS = "pass"
BLOCK = "block"
BLOCKED_WITH_RECOVERY = "blocked_with_recovery"

EXIT_CODES = {PASS: 0, BLOCK: 2, BLOCKED_WITH_RECOVERY: 3}


def verdict(
    decision: str,
    reason: str,
    checks: dict[str, Any],
    plan_path: str | None,
    plan_digest: str | None,
    continuations: int,
    plan_checkpoint: Any = None,
) -> dict[str, Any]:
    result: dict[str, Any] = {
        "decision": decision,
        "reason": reason,
        "checks": checks,
        "plan_path": plan_path,
        "plan_digest": plan_digest,
        "continuations": continuations,
    }
    if plan_checkpoint is not None:
        result["plan_checkpoint"] = plan_checkpoint
    return result


def nonempty_str(value: Any) -> bool:
    return isinstance(value, str) and bool(value.strip())


def entry_discharges_evidence(entry: dict[str, Any]) -> bool:
    """An entry discharges UNVERIFIED-never-PASS when it shows real
    verification (tests added/changed, tests used unchanged) or a deliberate
    exception with a stated reason."""
    if entry.get("tests_added_or_changed"):
        return True
    if entry.get("tests_used_unchanged"):
        return True
    return nonempty_str(entry.get("exception_reason"))


def unverified_problems(envelope: dict[str, Any]) -> list[str]:
    problems: list[str] = []
    attempted = envelope.get("u_ids_attempted") or []
    evidence = envelope.get("verification_evidence") or []

    if envelope.get("behavior_change") is True and not evidence:
        problems.append(
            "behavior_change is true but verification_evidence is empty — "
            "UNVERIFIED work cannot emit a PASS envelope"
        )

    covered: dict[str, list[dict[str, Any]]] = {}
    for index, entry in enumerate(evidence):
        if not isinstance(entry, dict):
            problems.append(
                f"verification_evidence[{index}] is not a structured entry "
                "(unit, behavior_changed, tests_added_or_changed, "
                "tests_used_unchanged, exception_reason, verification required)"
            )
            continue
        unit = entry.get("unit")
        if not nonempty_str(unit):
            problems.append(
                f"verification_evidence[{index}] names no unit"
            )
            continue
        covered.setdefault(str(unit).strip(), []).append(entry)

    for u_id in attempted:
        key = str(u_id).strip()
        entries = covered.get(key)
        if not entries:
            problems.append(
                f"attempted unit {key} has no verification_evidence entry — "
                "a unit with no verification evidence cannot emit a PASS envelope"
            )
            continue
        if not any(entry_discharges_evidence(entry) for entry in entries):
            problems.append(
                f"unit {key}: no evidence entry shows tests_added_or_changed, "
                "tests_used_unchanged, or an exception_reason — UNVERIFIED "
                "work cannot emit a PASS envelope"
            )
    return problems


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Gate a ce-work Return-to-Caller envelope at emission."
    )
    parser.add_argument("--plan", required=True, help="plan file path")
    parser.add_argument(
        "--envelope", help="envelope JSON path; default: stdin"
    )
    parser.add_argument(
        "--continuations",
        type=int,
        default=0,
        help="prior gate blocks this run (stop-gate counter)",
    )
    args = parser.parse_args()

    checks: dict[str, Any] = {}

    try:
        raw = sys.stdin.read() if args.envelope is None else open(args.envelope, encoding="utf-8").read()
    except OSError as error:
        checks["envelope"] = {"status": "environmental", "detail": str(error)}
        print(json.dumps(verdict(BLOCKED_WITH_RECOVERY, f"envelope unreadable: {error}", checks, None, None, args.continuations), sort_keys=True))
        return EXIT_CODES[BLOCKED_WITH_RECOVERY]
    try:
        envelope = json.loads(raw)
    except json.JSONDecodeError as error:
        checks["envelope"] = {"status": "environmental", "detail": str(error)}
        print(json.dumps(verdict(BLOCKED_WITH_RECOVERY, f"envelope is not valid JSON: {error}", checks, None, None, args.continuations), sort_keys=True))
        return EXIT_CODES[BLOCKED_WITH_RECOVERY]
    if not isinstance(envelope, dict):
        checks["envelope"] = {"status": "environmental", "detail": "not a JSON object"}
        print(json.dumps(verdict(BLOCKED_WITH_RECOVERY, "envelope is not a JSON object", checks, None, None, args.continuations), sort_keys=True))
        return EXIT_CODES[BLOCKED_WITH_RECOVERY]

    plan_checkpoint = envelope.get("plan_checkpoint")

    # Mechanism 2 — plan re-injection: read the plan from disk at emission.
    try:
        with open(args.plan, "rb") as handle:
            plan_bytes = handle.read()
    except OSError as error:
        checks["plan_reinjection"] = {"status": "environmental", "detail": str(error)}
        print(
            json.dumps(
                verdict(
                    BLOCKED_WITH_RECOVERY,
                    f"plan file unavailable for re-injection at envelope emission: {error}",
                    checks,
                    args.plan,
                    None,
                    args.continuations,
                    plan_checkpoint,
                ),
                sort_keys=True,
            )
        )
        return EXIT_CODES[BLOCKED_WITH_RECOVERY]
    plan_digest = hashlib.sha256(plan_bytes).hexdigest()
    checks["plan_reinjection"] = {
        "status": "pass",
        "detail": f"re-read {args.plan} from disk ({len(plan_bytes)} bytes); verdict rendered against the fresh read",
    }

    if envelope.get("source_kind") != "plan":
        checks["tamper_attestation"] = {"status": "environmental", "detail": "source_kind is not plan"}
        print(
            json.dumps(
                verdict(
                    BLOCKED_WITH_RECOVERY,
                    "emission gate applies to Return-to-Caller plan mode; "
                    f"source_kind is {envelope.get('source_kind')!r}",
                    checks,
                    args.plan,
                    plan_digest,
                    args.continuations,
                    plan_checkpoint,
                ),
                sort_keys=True,
            )
        )
        return EXIT_CODES[BLOCKED_WITH_RECOVERY]

    recorded_digest = envelope.get("source_digest")
    if not nonempty_str(recorded_digest):
        checks["tamper_attestation"] = {"status": "environmental", "detail": "no source_digest recorded"}
        print(
            json.dumps(
                verdict(
                    BLOCKED_WITH_RECOVERY,
                    "no source_digest recorded for the plan; re-disclose the "
                    "plan digest to the caller — never re-baseline",
                    checks,
                    args.plan,
                    plan_digest,
                    args.continuations,
                    plan_checkpoint,
                ),
                sort_keys=True,
            )
        )
        return EXIT_CODES[BLOCKED_WITH_RECOVERY]

    # Mechanism 3 — SHA-256 tamper attestation: detect-and-block, state
    # preserved, never a silent re-baseline.
    if recorded_digest.strip().lower() != plan_digest:
        checks["tamper_attestation"] = {
            "status": "blocked",
            "detail": f"recorded {recorded_digest.strip().lower()} != on-disk {plan_digest}",
        }
        print(
            json.dumps(
                verdict(
                    BLOCKED_WITH_RECOVERY,
                    "tamper attestation failed: plan digest mismatch (recorded "
                    f"{recorded_digest.strip().lower()}, on-disk {plan_digest}). "
                    "State is preserved; do not re-baseline the digest and do "
                    "not edit the plan to match. Recover by restoring the plan "
                    "file (e.g. from git) or obtaining a re-disclosed "
                    "checkpoint from the caller.",
                    checks,
                    args.plan,
                    plan_digest,
                    args.continuations,
                    plan_checkpoint,
                ),
                sort_keys=True,
            )
        )
        return EXIT_CODES[BLOCKED_WITH_RECOVERY]
    checks["tamper_attestation"] = {"status": "pass", "detail": f"on-disk digest matches recorded source_digest ({plan_digest})"}

    status = envelope.get("status")
    if status not in ("complete", "blocked", "failed"):
        checks["unverified_never_pass"] = {"status": "blocked", "detail": f"invalid status {status!r}"}
        decision = BLOCK
        reason = (
            f"envelope status {status!r} is not complete/blocked/failed; "
            "emit one of the contract statuses"
        )
    elif status == "complete":
        # Mechanism 1 — UNVERIFIED-never-PASS.
        problems = unverified_problems(envelope)
        if problems:
            checks["unverified_never_pass"] = {"status": "blocked", "detail": problems}
            decision = BLOCK
            reason = "UNVERIFIED-never-PASS: " + "; ".join(problems)
        else:
            checks["unverified_never_pass"] = {
                "status": "pass",
                "detail": "every attempted unit carries a discharging evidence entry",
            }
            decision = PASS
            reason = "envelope passes the emission gate"
    else:
        checks["unverified_never_pass"] = {
            "status": "pass",
            "detail": f"status {status} does not claim completion; UNVERIFIED-never-PASS not triggered",
        }
        decision = PASS
        reason = f"envelope declares {status}; the caller owns recovery"

    # Mechanism 4 — deterministic stop gate.
    if decision == BLOCK:
        if args.continuations >= CONTINUATION_CAP:
            checks["stop_gate"] = {
                "status": "environmental",
                "detail": f"continuation cap {CONTINUATION_CAP} reached",
            }
            print(
                json.dumps(
                    verdict(
                        BLOCKED_WITH_RECOVERY,
                        "stop gate: continuation cap "
                        f"{CONTINUATION_CAP} reached without a pass — emitting "
                        "blocked-with-recovery instead of an infinite hold. "
                        "Recover via the caller: resolve the named defects "
                        "outside this run or re-dispatch with a corrected plan.",
                        checks,
                        args.plan,
                        plan_digest,
                        args.continuations,
                        plan_checkpoint,
                    ),
                    sort_keys=True,
                )
            )
            return EXIT_CODES[BLOCKED_WITH_RECOVERY]
        checks["stop_gate"] = {
            "status": "holding",
            "detail": f"block {args.continuations + 1} of {CONTINUATION_CAP}",
        }
        print(
            json.dumps(
                verdict(
                    BLOCK,
                    reason,
                    checks,
                    args.plan,
                    plan_digest,
                    args.continuations + 1,
                    plan_checkpoint,
                ),
                sort_keys=True,
            )
        )
        return EXIT_CODES[BLOCK]

    checks["stop_gate"] = {"status": "pass", "detail": "no hold required"}
    print(
        json.dumps(
            verdict(decision, reason, checks, args.plan, plan_digest, args.continuations, plan_checkpoint),
            sort_keys=True,
        )
    )
    return EXIT_CODES[decision]


if __name__ == "__main__":
    raise SystemExit(main())
