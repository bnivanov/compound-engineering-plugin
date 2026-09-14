import { createHash } from "crypto"
import { mkdtempSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import path from "path"
import { spawnSync } from "node:child_process"
import { describe, expect, setDefaultTimeout, test } from "bun:test"

setDefaultTimeout(20_000)

const SKILL_DIR = path.join(process.cwd(), "skills", "ce-work")
const GATE_SCRIPT = path.join(SKILL_DIR, "scripts", "envelope-gate.py")

function fixturePlan(): { dir: string; plan: string; digest: string } {
  const dir = mkdtempSync(path.join(tmpdir(), "ce-envelope-gate-"))
  const plan = path.join(dir, "plan.md")
  const content = "# Plan\n\nthe implementation authority\n"
  writeFileSync(plan, content)
  const digest = createHash("sha256").update(content).digest("hex")
  return { dir, plan, digest }
}

function fixturePlanWithUnits(): { dir: string; plan: string; digest: string } {
  const dir = mkdtempSync(path.join(tmpdir(), "ce-envelope-gate-"))
  const plan = path.join(dir, "plan.md")
  const content = "# Plan\n\n### U1. first unit\n\n### U2. second unit\n"
  writeFileSync(plan, content)
  const digest = createHash("sha256").update(content).digest("hex")
  return { dir, plan, digest }
}

function runGate(plan: string, envelope: unknown, continuations = 0) {
  return spawnSync(
    "python3",
    [GATE_SCRIPT, "--plan", plan, "--continuations", String(continuations)],
    { input: JSON.stringify(envelope), encoding: "utf8" },
  )
}

function baseEnvelope(plan: string, digest: string, overrides: Record<string, unknown> = {}) {
  return {
    status: "complete",
    source_kind: "plan",
    source_digest: digest,
    plan_path: plan,
    u_ids_attempted: ["U9"],
    verification_evidence: [],
    behavior_change: true,
    ...overrides,
  }
}

describe("ce-work envelope emission gate", () => {
  test("a unit with no verification evidence cannot emit a PASS envelope", () => {
    const { plan, digest } = fixturePlan()
    const result = runGate(plan, baseEnvelope(plan, digest))
    expect(result.status).toBe(2)
    const verdict = JSON.parse(result.stdout)
    expect(verdict.decision).toBe("block")
    expect(verdict.reason).toContain("U9")
    expect(verdict.reason).toContain("UNVERIFIED-never-PASS")
    expect(verdict.checks.unverified_never_pass.status).toBe("blocked")
  })

  test("structured evidence covering every attempted unit passes the gate", () => {
    const { plan, digest } = fixturePlan()
    const envelope = baseEnvelope(plan, digest, {
      verification_evidence: [
        {
          unit: "U9",
          behavior_changed: true,
          tests_added_or_changed: 2,
          verification: "bun test tests/ce-work-envelope-gate.test.ts",
        },
      ],
    })
    const result = runGate(plan, envelope)
    expect(result.status).toBe(0)
    const verdict = JSON.parse(result.stdout)
    expect(verdict.decision).toBe("pass")
    expect(verdict.checks.plan_reinjection.status).toBe("pass")
    expect(verdict.checks.tamper_attestation.status).toBe("pass")
    expect(verdict.plan_digest).toBe(digest)
  })

  test("an evidence entry with no discharger blocks, and prose-only entries block", () => {
    const { plan, digest } = fixturePlan()
    const noDischarger = runGate(
      plan,
      baseEnvelope(plan, digest, {
        verification_evidence: [{ unit: "U9", behavior_changed: true, tests_added_or_changed: 0 }],
      }),
    )
    expect(noDischarger.status).toBe(2)
    expect(JSON.parse(noDischarger.stdout).reason).toContain("U9")

    const proseOnly = runGate(
      plan,
      baseEnvelope(plan, digest, { verification_evidence: ["implemented U9 and it looks fine"] }),
    )
    expect(proseOnly.status).toBe(2)
    expect(JSON.parse(proseOnly.stdout).reason).toContain("structured entry")
  })

  test("a deliberate exception discharges a non-behavioral unit", () => {
    const { plan, digest } = fixturePlan()
    const envelope = baseEnvelope(plan, digest, {
      u_ids_attempted: ["U1"],
      behavior_change: false,
      verification_evidence: [
        { unit: "U1", behavior_changed: false, exception_reason: "pure docs change, no behavioral surface" },
      ],
    })
    const result = runGate(plan, envelope)
    expect(result.status).toBe(0)
    expect(JSON.parse(result.stdout).decision).toBe("pass")
  })

  test("a tampered plan produces blocked-with-recovery, not a re-baselined digest", () => {
    const { plan, digest } = fixturePlan()
    writeFileSync(plan, "# Plan\n\ntampered after checkpoint\n")
    const result = runGate(plan, baseEnvelope(plan, digest))
    expect(result.status).toBe(3)
    const verdict = JSON.parse(result.stdout)
    expect(verdict.decision).toBe("blocked_with_recovery")
    expect(verdict.reason).toContain("do not re-baseline")
    // The gate reports the on-disk digest, never silently adopts the
    // recorded one or rewrites state.
    expect(verdict.plan_digest).not.toBe(digest)
    expect(verdict.checks.tamper_attestation.status).toBe("blocked")
  })

  test("a missing plan file is environmental blocked-with-recovery", () => {
    const { plan, digest } = fixturePlan()
    const result = runGate(path.join(path.dirname(plan), "absent.md"), baseEnvelope(plan, digest))
    expect(result.status).toBe(3)
    const verdict = JSON.parse(result.stdout)
    expect(verdict.decision).toBe("blocked_with_recovery")
    expect(verdict.reason).toContain("re-injection")
  })

  test("a missing source_digest is environmental, never a re-baseline", () => {
    const { plan, digest } = fixturePlan()
    const envelope = baseEnvelope(plan, digest)
    delete envelope.source_digest
    const result = runGate(plan, envelope)
    expect(result.status).toBe(3)
    const verdict = JSON.parse(result.stdout)
    expect(verdict.decision).toBe("blocked_with_recovery")
    expect(verdict.reason).toContain("never re-baseline")
  })

  test("an unparseable envelope is environmental blocked-with-recovery", () => {
    const { plan } = fixturePlan()
    const result = spawnSync("python3", [GATE_SCRIPT, "--plan", plan], {
      input: "{not json",
      encoding: "utf8",
    })
    expect(result.status).toBe(3)
    expect(JSON.parse(result.stdout).decision).toBe("blocked_with_recovery")
  })

  test("the stop gate holds to the cap, then emits blocked-with-recovery", () => {
    const { plan, digest } = fixturePlan()
    const envelope = baseEnvelope(plan, digest)

    const holding = runGate(plan, envelope, 7)
    expect(holding.status).toBe(2)
    const holdingVerdict = JSON.parse(holding.stdout)
    expect(holdingVerdict.decision).toBe("block")
    expect(holdingVerdict.continuations).toBe(8)
    expect(holdingVerdict.checks.stop_gate.status).toBe("holding")

    const capped = runGate(plan, envelope, 8)
    expect(capped.status).toBe(3)
    const cappedVerdict = JSON.parse(capped.stdout)
    expect(cappedVerdict.decision).toBe("blocked_with_recovery")
    expect(cappedVerdict.reason).toContain("infinite hold")
    expect(cappedVerdict.checks.stop_gate.status).toBe("environmental")
  })

  test("an honest blocked envelope passes when the digest matches", () => {
    const { plan, digest } = fixturePlan()
    const envelope = baseEnvelope(plan, digest, {
      status: "blocked",
      u_ids_attempted: [],
      behavior_change: false,
      blockers: ["upstream service unavailable"],
    })
    const result = runGate(plan, envelope)
    expect(result.status).toBe(0)
    const verdict = JSON.parse(result.stdout)
    expect(verdict.decision).toBe("pass")
    expect(verdict.checks.unverified_never_pass.status).toBe("pass")
  })

  test("a complete envelope omitting u_ids_attempted blocks", () => {
    const { plan, digest } = fixturePlan()
    const envelope = baseEnvelope(plan, digest, {
      verification_evidence: [
        {
          unit: "U9",
          behavior_changed: true,
          tests_added_or_changed: 2,
          verification: "bun test tests/ce-work-envelope-gate.test.ts",
        },
      ],
    })
    delete envelope.u_ids_attempted
    const result = runGate(plan, envelope)
    expect(result.status).toBe(2)
    const verdict = JSON.parse(result.stdout)
    expect(verdict.decision).toBe("block")
    expect(JSON.stringify(verdict.checks.unverified_never_pass.detail)).toContain(
      "u_ids_attempted",
    )
  })

  test("a complete envelope with empty verification_evidence blocks", () => {
    const { plan, digest } = fixturePlan()
    const result = runGate(
      plan,
      baseEnvelope(plan, digest, { verification_evidence: [] }),
    )
    expect(result.status).toBe(2)
    const verdict = JSON.parse(result.stdout)
    expect(verdict.decision).toBe("block")
    expect(JSON.stringify(verdict.checks.unverified_never_pass.detail)).toContain(
      "verification_evidence",
    )
  })

  test("a vacuous completion claim omitting both attempt and evidence blocks", () => {
    const { plan, digest } = fixturePlan()
    const result = runGate(plan, {
      status: "complete",
      source_kind: "plan",
      changed_files: ["a"],
      source_digest: digest,
    })
    expect(result.status).toBe(2)
    const verdict = JSON.parse(result.stdout)
    expect(verdict.decision).toBe("block")
    const detail = JSON.stringify(verdict.checks.unverified_never_pass.detail)
    expect(detail).toContain("u_ids_attempted")
    expect(detail).toContain("verification_evidence")
  })

  test("a fabricated unit id blocks against a plan that defines U<n> ids", () => {
    const { plan, digest } = fixturePlanWithUnits()
    const envelope = baseEnvelope(plan, digest, {
      u_ids_attempted: ["U99"],
      verification_evidence: [
        { unit: "U99", behavior_changed: true, tests_added_or_changed: "yes" },
      ],
    })
    const result = runGate(plan, envelope)
    expect(result.status).toBe(2)
    const verdict = JSON.parse(result.stdout)
    expect(verdict.decision).toBe("block")
    expect(verdict.reason).toContain("U99")
    expect(verdict.reason).toContain(plan)
    expect(verdict.checks.plan_unit_membership.status).toBe("blocked")
  })

  test("an attempted unit defined by the plan passes with membership recorded", () => {
    const { plan, digest } = fixturePlanWithUnits()
    const envelope = baseEnvelope(plan, digest, {
      u_ids_attempted: ["U1"],
      verification_evidence: [
        {
          unit: "U1",
          behavior_changed: true,
          tests_added_or_changed: 2,
          verification: "bun test tests/ce-work-envelope-gate.test.ts",
        },
      ],
    })
    const result = runGate(plan, envelope)
    expect(result.status).toBe(0)
    const verdict = JSON.parse(result.stdout)
    expect(verdict.decision).toBe("pass")
    expect(verdict.checks.plan_unit_membership.status).toBe("pass")
  })

  test("a plan with no U<n> ids never false-blocks — membership is environmental", () => {
    const { plan, digest } = fixturePlan()
    const envelope = baseEnvelope(plan, digest, {
      verification_evidence: [
        {
          unit: "U9",
          behavior_changed: true,
          tests_added_or_changed: 2,
          verification: "bun test tests/ce-work-envelope-gate.test.ts",
        },
      ],
    })
    const result = runGate(plan, envelope)
    expect(result.status).toBe(0)
    const verdict = JSON.parse(result.stdout)
    expect(verdict.decision).toBe("pass")
    expect(verdict.checks.plan_unit_membership.status).toBe("environmental")
    expect(verdict.checks.plan_unit_membership.detail).toContain("not checkable")
  })

  test("a mismatched envelope plan_path blocks", () => {
    const { plan, digest } = fixturePlan()
    const result = runGate(
      plan,
      baseEnvelope(plan, digest, { plan_path: "/nonexistent/other.md" }),
    )
    expect(result.status).toBe(2)
    const verdict = JSON.parse(result.stdout)
    expect(verdict.decision).toBe("block")
    expect(verdict.reason).toContain("/nonexistent/other.md")
    expect(verdict.reason).toContain(plan)
    expect(verdict.checks.plan_identity.status).toBe("blocked")
  })

  test("an out-of-range --continuations value never computes a hold", () => {
    const { plan, digest } = fixturePlan()
    const negative = runGate(plan, baseEnvelope(plan, digest), -100)
    expect(negative.status).toBe(3)
    const negativeVerdict = JSON.parse(negative.stdout)
    expect(negativeVerdict.decision).toBe("blocked_with_recovery")
    expect(negativeVerdict.reason).toContain("-100")
    expect(negativeVerdict.reason).toContain("[0, 8]")
    expect(negativeVerdict.checks.stop_gate.status).toBe("environmental")

    const capped = runGate(plan, baseEnvelope(plan, digest), 8)
    expect(capped.status).toBe(3)
    expect(JSON.parse(capped.stdout).decision).toBe("blocked_with_recovery")

    const holding = runGate(plan, baseEnvelope(plan, digest), 7)
    expect(holding.status).toBe(2)
    expect(JSON.parse(holding.stdout).checks.stop_gate.detail).toBe("block 8 of 8")
  })

  test("a usage error exits 64, distinguishable from a block", () => {
    const result = spawnSync("python3", [GATE_SCRIPT, "--nope"], {
      encoding: "utf8",
    })
    expect(result.status).toBe(64)
    expect(result.status).not.toBe(0)
    expect(result.status).not.toBe(2)
    expect(result.stdout ?? "").not.toContain("decision")
    expect(result.stderr).toContain("usage")
  })

  test("an unexpected exception fails closed as blocked-with-recovery (exit 3)", () => {
    const { plan } = fixturePlan()
    const result = spawnSync("python3", [GATE_SCRIPT, "--plan", plan], {
      input: Buffer.from([0xff, 0xfe, 0xfd, 0x20, 0x7b]),
      encoding: "utf8",
      env: { ...process.env, PYTHONIOENCODING: "utf-8:strict" },
    })
    expect(result.status).toBe(3)
    const verdict = JSON.parse(result.stdout)
    expect(verdict.decision).toBe("blocked_with_recovery")
    expect(verdict.reason).toContain("UnicodeDecodeError")
  })

})
