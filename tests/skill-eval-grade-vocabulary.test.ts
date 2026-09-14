import { readFileSync } from "fs"
import path from "path"
import { describe, expect, test } from "bun:test"
import { SCENARIOS } from "./skill-eval-cell/catalog"

/**
 * Grade-vocabulary drift detection (plugin-eval delta, R16/U14).
 *
 * wshobson's plugin-eval certifies plugin quality with three layers: static
 * structural analysis, LLM-judge semantic scoring, and Monte Carlo reliability.
 * R16 ports only the static layer, as the delta over what this fork's harness
 * already checks: the LLM-judge and reliability layers are eval evidence, never
 * a merge gate.
 *
 * The gap this file closes: CI runs `bun run test` (bun strips types; nothing
 * typechecks), so the declared-decision grade contract is enforced nowhere at
 * run time. Two drift directions are silent today:
 *
 * 1. A typo'd key in a scenario's `grade` object (`must_iclude:`) is ignored by
 *    gradeHost — the eval dimension passes vacuously while the catalog looks
 *    stricter than it grades.
 * 2. A key declared in the `Grade` contract but never consumed by gradeHost
 *    lets future scenario authors set it and believe it grades.
 *
 * Both directions fail the suite, identically locally and in CI, because this
 * is an ordinary `tests/**` file under `bun test --parallel` — not a
 * `make garden` port and not a CI-only step.
 *
 * Coverage enumeration (what existing checks already do — this file adds none
 * of them): description/name caps, reference integrity, self-containment, and
 * platform-variable fallback live in tests/skill-conventions.test.ts; the ce-
 * prefix and name/dir parity in tests/skill-agent-ce-prefix.test.ts and
 * tests/frontmatter.test.ts; the 8000-byte cap in
 * tests/codex-skill-prompt-budget.test.ts; per-skill trigger-shape pins in
 * tests/skills/astra-description-triggers.test.ts; scenario integrity (ids,
 * refs, fixtures, pointer existence) in tests/skill-eval-cell/catalog.test.ts;
 * grader behavior on well-formed grades in tests/skill-eval-cell/grade.test.ts.
 * None of those validates that the grade vocabulary the catalog declares is
 * the vocabulary the grader consumes.
 */

const REPO_ROOT = path.join(import.meta.dir, "..")

/** Every `Grade` key gradeHost actually reads, extracted from grade.ts source. */
export function consumedGradeKeys(gradeSource: string): Set<string> {
  const keys = new Set<string>()
  for (const match of gradeSource.matchAll(/opts\.grade\??\.(\w+)/g)) {
    keys.add(match[1])
  }
  return keys
}

/** Every key the `Grade` contract in catalog.ts declares, extracted from source. */
export function declaredGradeKeys(catalogSource: string): Set<string> {
  const start = catalogSource.indexOf("export type Grade = {")
  expect(start, "catalog.ts must declare `export type Grade = {`").toBeGreaterThanOrEqual(0)
  const bodyStart = catalogSource.indexOf("{", start) + 1
  const end = catalogSource.indexOf("\n}", bodyStart)
  const body = catalogSource.slice(bodyStart, end)
  const keys = new Set<string>()
  for (const line of body.split("\n")) {
    const match = line.match(/^ {2}([A-Za-z_]\w*)\??:/)
    if (match) keys.add(match[1])
  }
  return keys
}

/** Grade-object keys that are not part of the given vocabulary. */
export function unknownGradeKeys(grade: Record<string, unknown>, vocabulary: Set<string>): string[] {
  return Object.keys(grade).filter((key) => !vocabulary.has(key))
}

describe("declared-decision grade vocabulary (catalog <-> grader drift)", () => {
  const gradeSource = readFileSync(path.join(REPO_ROOT, "tests/skill-eval-cell/grade.ts"), "utf8")
  const catalogSource = readFileSync(path.join(REPO_ROOT, "tests/skill-eval-cell/catalog.ts"), "utf8")
  const consumed = consumedGradeKeys(gradeSource)
  const declared = declaredGradeKeys(catalogSource)

  test("every Grade contract key is consumed by gradeHost (no dead contract keys)", () => {
    const dead = [...declared].filter((key) => !consumed.has(key))
    expect(
      dead,
      `Grade keys declared in catalog.ts but never read by gradeHost — a scenario setting them grades nothing:\n${dead.join("\n")}`,
    ).toEqual([])
  })

  test("every scenario grade key is a declared Grade key (no typo'd vacuous dimensions)", () => {
    const offenders: string[] = []
    for (const scenario of SCENARIOS) {
      for (const key of unknownGradeKeys(scenario.grade as Record<string, unknown>, declared)) {
        offenders.push(`${scenario.id}: ${key}`)
      }
    }
    expect(
      offenders,
      `Scenario grade keys gradeHost cannot consume — bun does not typecheck, so these pass vacuously:\n${offenders.join("\n")}`,
    ).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Synthetic fixtures: prove violations are caught and valid content passes
// (mutation-resistance layer, mirroring tests/skill-conventions.test.ts).
// The real-tree checks above pass on today's tree; these prove the scanners
// themselves fail on the drift they exist to catch.
// ---------------------------------------------------------------------------

describe("consumedGradeKeys", () => {
  test("extracts every property access, optional-chained or not", () => {
    const keys = consumedGradeKeys(`
      const a = opts.grade.files_read_post?.length
      const b = opts.grade.actions === "none"
      const c = opts.grade?.declared ?? {}
    `)
    expect([...keys].sort()).toEqual(["actions", "declared", "files_read_post"])
  })

  test("a grader that never reads a declared key leaves it unconsumed", () => {
    const keys = consumedGradeKeys(`if (opts.grade.must_exclude?.length) reason()`)
    expect(keys.has("must_iclude")).toBe(false)
    expect(keys.has("must_exclude")).toBe(true)
  })
})

describe("declaredGradeKeys", () => {
  test("reads the two-space keys of the Grade block and nothing else", () => {
    const keys = declaredGradeKeys(`export type Grade = {
  /** doc comment */
  files_read_post?: string[]
  declared?: Record<string, string>
  workspace_contains?: Array<{ path: string; needle: string }>
}

export type Scenario = { id: string }`)
    expect([...keys].sort()).toEqual(["declared", "files_read_post", "workspace_contains"])
  })
})

describe("the drift the real-tree checks exist to catch", () => {
  test("a declared-but-unconsumed key composes into a dead-key finding", () => {
    // check 1's exact pipeline over crafted sources: the contract declares
    // `must_iclude`, the grader never reads it, so the real-tree test would fail.
    const catalog = `export type Grade = {\n  must_iclude?: string[]\n}\n`
    const grader = `if (opts.grade.must_include?.length) reason()\n`
    const dead = [...declaredGradeKeys(catalog)].filter((key) => !consumedGradeKeys(grader).has(key))
    expect(dead).toEqual(["must_iclude"])
  })
})

describe("unknownGradeKeys", () => {
  test("flags a typo'd grade key that bun's type stripping would let pass", () => {
    expect(unknownGradeKeys({ must_iclude: ["x"] }, new Set(["must_include"]))).toEqual(["must_iclude"])
  })

  test("passes a well-formed grade object", () => {
    expect(unknownGradeKeys({ must_include: ["x"], actions: "none" }, new Set(["must_include", "actions"]))).toEqual([])
  })
})
