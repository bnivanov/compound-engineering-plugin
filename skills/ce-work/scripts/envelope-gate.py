#!/usr/bin/env python3
"""Orchestrator-envelope emission gate for ce-work Return-to-Caller Mode.

Enforcement evaluates at envelope emission, never at worker return (KTD4):
a per-worker hook would promote unverified work. The gate is read-only, so
a block preserves all state by construction.

Mechanisms enforced at this single point:

1. UNVERIFIED-never-PASS: ``status: complete`` requires a non-empty
   ``u_ids_attempted`` list and a structured verification-evidence entry per
   attempted unit, each showing tests added or changed, tests used
   unchanged, or an explicit exception reason. A completion claim that
   omits either list — or attempts a unit absent from the re-read plan —
   is vacuous and blocked.
2. Plan re-injection: the plan is re-read from disk at emission and the
   verdict is rendered against that fresh read, so a compacted or drifted
   context cannot emit an envelope grounded in remembered plan content.
   Every attempted unit id must appear among the fresh read's ``U<n>``
   unit markers; a plan using no unit markers is recorded as not
   checkable instead of false-blocked.
3. SHA-256 tamper attestation: the on-disk plan digest is compared to the
   envelope's recorded ``source_digest``. A mismatch emits
   blocked-with-recovery with state preserved — never a silent re-baseline
   and never a parallel hash file.
4. Deterministic stop gate: environmental failures emit blocked-with-recovery
   immediately; work-failure blocks carry an incrementing continuation count
   bounded at 8 (matching the host ``session_stop`` cap) instead of an
   infinite hold. An out-of-range ``--continuations`` value is environmental.

Verdict JSON on stdout; exit code owns emission: 0 pass, 2 block
(continuation warranted), 3 blocked-with-recovery. Usage errors exit 64;
an unexpected exception emits a blocked-with-recovery verdict and exits 3.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
from typing import Any, NoReturn

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


def truthy_behavior_change(value: Any) -> bool:
    """Model-authored envelopes spell booleans loosely; accept the JSON
    boolean and the plausible string spellings of true."""
    if value is True:
        return True
    return isinstance(value, str) and value.strip().lower() in ("true", "yes")


PLAN_UNIT_ID_RE = re.compile(r"\bU\d+\b")


def plan_unit_ids(plan_text: str) -> set[str] | None:
    """Conservative scan for the plan's ``U<n>`` unit markers. ``None`` when
    the plan contains no unit ids at all — an arbitrary plan format the gate
    must not false-block."""
    ids = set(PLAN_UNIT_ID_RE.findall(plan_text))
    return ids or None


def plan_membership_check(
    envelope: dict[str, Any], plan_text: str, plan_path: str
) -> dict[str, Any]:
    """Mechanism 2's comparison step: every attempted unit must exist in the
    plan that was re-read from disk. Fails safe — a plan with no ``U<n>``
    markers is recorded environmental (not checkable), never blocked."""
    ids = plan_unit_ids(plan_text)
    if ids is None:
        return {
            "status": "environmental",
            "detail": (
                f"plan {plan_path} contains no U<n> unit ids; "
                "attempted-unit membership was not checkable"
            ),
        }
    attempted_raw = envelope.get("u_ids_attempted")
    if not isinstance(attempted_raw, list):
        # unverified_problems already names the malformed field; never
        # iterate a non-list as if it were unit ids.
        return {
            "status": "environmental",
            "detail": (
                "u_ids_attempted is not a list; attempted-unit membership "
                "was not checkable"
            ),
        }
    fabricated = sorted({str(u_id).strip() for u_id in attempted_raw} - ids)
    if fabricated:
        return {
            "status": "blocked",
            "detail": [
                f"attempted unit {u_id!r} does not appear in the re-read "
                f"plan {plan_path} — an attempt claim must name a unit the "
                "gated plan defines"
                for u_id in fabricated
            ],
        }
    if not attempted_raw:
        return {
            "status": "pass",
            "detail": (
                "u_ids_attempted names no units; nothing to check against "
                "the plan (the empty attempt list is flagged elsewhere)"
            ),
        }
    return {
        "status": "pass",
        "detail": (
            f"every attempted unit id appears in the re-read plan {plan_path}"
        ),
    }


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
    # A non-list value would keep its truthy self through `or []` and then be
    # iterated as characters (str) or keys (dict), turning one malformed field
    # into a garbage problem per element. Fail closed, and say what is wrong.
    attempted_raw = envelope.get("u_ids_attempted")
    evidence_raw = envelope.get("verification_evidence")
    # A completion claim that names no attempted unit is vacuous: absence,
    # non-list garbage, and the empty list all fail closed by name.
    if attempted_raw is None:
        problems.append(
            "u_ids_attempted is missing — a completion claim that names "
            "no attempted unit is vacuous"
        )
    elif not isinstance(attempted_raw, list):
        problems.append("u_ids_attempted is not a list")
    elif not attempted_raw:
        problems.append(
            "u_ids_attempted is empty — a completion claim that names "
            "no attempted unit is vacuous"
        )
    if evidence_raw is None:
        problems.append(
            "verification_evidence is missing — a completion claim with "
            "no verification evidence is vacuous"
        )
    elif not isinstance(evidence_raw, list):
        problems.append("verification_evidence is not a list")
    elif not evidence_raw:
        problems.append(
            "verification_evidence is empty — UNVERIFIED work cannot "
            "emit a PASS envelope"
        )
    attempted = attempted_raw if isinstance(attempted_raw, list) else []
    evidence = evidence_raw if isinstance(evidence_raw, list) else []

    if truthy_behavior_change(envelope.get("behavior_change")) and not evidence:
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


class _UsageErrorParser(argparse.ArgumentParser):
    """Usage errors exit 64 (EX_USAGE): a malformed invocation must be
    distinguishable from the gate's own BLOCK verdict (exit 2). Usage goes
    to stderr; stdout stays verdict-only."""

    def error(self, message: str) -> NoReturn:
        self.print_usage(sys.stderr)
        sys.stderr.write(f"envelope-gate: {message}\n")
        raise SystemExit(64)


def main() -> int:
    parser = _UsageErrorParser(
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

    def emit(
        decision: str,
        reason: str,
        checks: dict[str, Any],
        plan_path: str | None,
        plan_digest: str | None,
        continuations: int,
        plan_checkpoint: Any = None,
    ) -> int:
        """Print the final verdict JSON and return the decision's exit code."""
        print(
            json.dumps(
                verdict(
                    decision,
                    reason,
                    checks,
                    plan_path,
                    plan_digest,
                    continuations,
                    plan_checkpoint,
                ),
                sort_keys=True,
            )
        )
        return EXIT_CODES[decision]
    if not 0 <= args.continuations <= CONTINUATION_CAP:
        checks["stop_gate"] = {
            "status": "environmental",
            "detail": (
                f"--continuations {args.continuations} is outside the valid "
                f"range [0, {CONTINUATION_CAP}]"
            ),
        }
        return emit(
            BLOCKED_WITH_RECOVERY,
            f"stop gate: --continuations {args.continuations} is outside "
            f"the valid range [0, {CONTINUATION_CAP}] — refusing to compute "
            "a hold from an invalid continuation count; re-run the gate "
            "with --continuations within the range",
            checks,
            None,
            None,
            args.continuations,
        )

    try:
        if args.envelope is None:
            raw = sys.stdin.read()
        else:
            with open(args.envelope, encoding="utf-8") as handle:
                raw = handle.read()
    except OSError as error:
        checks["envelope"] = {"status": "environmental", "detail": str(error)}
        return emit(BLOCKED_WITH_RECOVERY, f"envelope unreadable: {error}", checks, None, None, args.continuations)
    try:
        envelope = json.loads(raw)
    except json.JSONDecodeError as error:
        checks["envelope"] = {"status": "environmental", "detail": str(error)}
        return emit(BLOCKED_WITH_RECOVERY, f"envelope is not valid JSON: {error}", checks, None, None, args.continuations)
    if not isinstance(envelope, dict):
        checks["envelope"] = {"status": "environmental", "detail": "not a JSON object"}
        return emit(BLOCKED_WITH_RECOVERY, "envelope is not a JSON object", checks, None, None, args.continuations)

    plan_checkpoint = envelope.get("plan_checkpoint")

    # Mechanism 2 — plan re-injection: read the plan from disk at emission.
    try:
        with open(args.plan, "rb") as handle:
            plan_bytes = handle.read()
    except OSError as error:
        checks["plan_reinjection"] = {"status": "environmental", "detail": str(error)}
        return emit(
            BLOCKED_WITH_RECOVERY,
            f"plan file unavailable for re-injection at envelope emission: {error}",
            checks,
            args.plan,
            None,
            args.continuations,
            plan_checkpoint,
        )
    plan_digest = hashlib.sha256(plan_bytes).hexdigest()
    plan_text = plan_bytes.decode("utf-8", errors="replace")
    checks["plan_reinjection"] = {
        "status": "pass",
        "detail": f"re-read {args.plan} from disk ({len(plan_bytes)} bytes); verdict rendered against the fresh read",
    }

    if envelope.get("source_kind") != "plan":
        checks["tamper_attestation"] = {"status": "environmental", "detail": "source_kind is not plan"}
        return emit(
            BLOCKED_WITH_RECOVERY,
            "emission gate applies to Return-to-Caller plan mode; "
            f"source_kind is {envelope.get('source_kind')!r}",
            checks,
            args.plan,
            plan_digest,
            args.continuations,
            plan_checkpoint,
        )
    # Mechanism 2's identity half: an envelope attested against another
    # plan must not ride through this gate's re-read of a different file.
    # realpath on both sides folds symlink and tmpdir aliasing (a symlinked
    # tmp root vs its real path) into one name, so the same file reached
    # through a different path still matches.
    identity_mismatch = False
    recorded_plan_path = envelope.get("plan_path")
    if nonempty_str(recorded_plan_path):
        recorded_real = os.path.realpath(str(recorded_plan_path).strip())
        gated_real = os.path.realpath(args.plan)
        if recorded_real != gated_real:
            identity_mismatch = True
            checks["plan_identity"] = {
                "status": "blocked",
                "detail": (
                    f"envelope plan_path {str(recorded_plan_path).strip()!r} "
                    f"(resolved {recorded_real}) does not match the gated "
                    f"plan {args.plan} (resolved {gated_real})"
                ),
            }
        else:
            checks["plan_identity"] = {
                "status": "pass",
                "detail": (
                    f"envelope plan_path matches the gated plan ({gated_real})"
                ),
            }
    else:
        checks["plan_identity"] = {
            "status": "pass",
            "detail": "envelope carries no plan_path; identity not compared",
        }

    recorded_digest = envelope.get("source_digest")
    if not nonempty_str(recorded_digest):
        checks["tamper_attestation"] = {"status": "environmental", "detail": "no source_digest recorded"}
        return emit(
            BLOCKED_WITH_RECOVERY,
            "no source_digest recorded for the plan; re-disclose the "
            "plan digest to the caller — never re-baseline",
            checks,
            args.plan,
            plan_digest,
            args.continuations,
            plan_checkpoint,
        )

    # Mechanism 3 — SHA-256 tamper attestation: detect-and-block, state
    # preserved, never a silent re-baseline.
    if recorded_digest.strip().lower() != plan_digest:
        checks["tamper_attestation"] = {
            "status": "blocked",
            "detail": f"recorded {recorded_digest.strip().lower()} != on-disk {plan_digest}",
        }
        return emit(
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
        )
    checks["tamper_attestation"] = {"status": "pass", "detail": f"on-disk digest matches recorded source_digest ({plan_digest})"}

    status = envelope.get("status")
    if identity_mismatch:
        decision = BLOCK
        reason = (
            "plan identity mismatch: the envelope attests "
            f"{str(recorded_plan_path).strip()!r} but the gate re-read "
            f"{args.plan}; re-assemble the envelope against the plan "
            "being gated"
        )
    elif status not in ("complete", "blocked", "failed"):
        checks["unverified_never_pass"] = {"status": "blocked", "detail": f"invalid status {status!r}"}
        decision = BLOCK
        reason = (
            f"envelope status {status!r} is not complete/blocked/failed; "
            "emit one of the contract statuses"
        )
    elif status == "complete":
        # Mechanism 1 — UNVERIFIED-never-PASS, plus mechanism 2's
        # membership comparison against the fresh on-disk read.
        problems = unverified_problems(envelope)
        membership = plan_membership_check(envelope, plan_text, args.plan)
        checks["plan_unit_membership"] = membership
        if membership["status"] == "blocked":
            problems.extend(membership["detail"])
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
            return emit(
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
            )
        checks["stop_gate"] = {
            "status": "holding",
            "detail": f"block {args.continuations + 1} of {CONTINUATION_CAP}",
        }
        return emit(
            BLOCK,
            reason,
            checks,
            args.plan,
            plan_digest,
            args.continuations + 1,
            plan_checkpoint,
        )

    checks["stop_gate"] = {"status": "pass", "detail": "no hold required"}
    return emit(decision, reason, checks, args.plan, plan_digest, args.continuations, plan_checkpoint)


if __name__ == "__main__":
    try:
        code = main()
    except SystemExit:
        # Usage errors (64) own their exit code; never convert one to a verdict.
        raise
    except Exception as error:  # noqa: BLE001 — fail closed on anything else
        print(
            json.dumps(
                verdict(
                    BLOCKED_WITH_RECOVERY,
                    f"unexpected {type(error).__name__}: {error} — the gate "
                    "failed closed; recover via the caller",
                    {
                        "gate": {
                            "status": "environmental",
                            "detail": (
                                f"unexpected {type(error).__name__} escaped "
                                f"the gate: {error}"
                            ),
                        }
                    },
                    None,
                    None,
                    None,
                ),
                sort_keys=True,
            )
        )
        code = EXIT_CODES[BLOCKED_WITH_RECOVERY]
    raise SystemExit(code)
