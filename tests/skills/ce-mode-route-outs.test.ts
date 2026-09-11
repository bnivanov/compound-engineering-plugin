import { describe, expect, test } from "bun:test"
import { readFileSync } from "fs"
import path from "path"

// The four-lane decision is settled: a lane earns existence only when (a) a
// distinct owning CE skill exists, (b) the applicable gate set differs from
// every existing lane, and (c) the entry condition states without a case list.
// Operate fails (a) — no CE skill owns run/deploy/observe, so the catch-all
// lands in ce-start's no-owner row instead. Undo fails (b) — ce-undo already
// owns grade selection and its single confirmation, and ce-mode's Boundaries
// forbid a second gate where the callee already gates. Spike stays a route-out
// rather than a lane: ce-prototype genuinely owns it and its gates genuinely
// differ (nothing survives, so G1/G3 do not apply), but per-playbook gate
// conditioning is already the shipped convention (fix.md conditions G1 and
// waives G3), so the absorbing lane states the waiver without a new file.
// FLIP CONDITION: a second throwaway-shaped request needing a different gate
// statement than the first turns the route-out into a lane — split build.md.
const MODE_DIR = path.join(import.meta.dir, "..", "..", "skills", "ce-mode")
const START_DIR = path.join(import.meta.dir, "..", "..", "skills", "ce-start")
const modeBody = readFileSync(path.join(MODE_DIR, "SKILL.md"), "utf8")
const fix = readFileSync(path.join(MODE_DIR, "references", "fix.md"), "utf8")
const build = readFileSync(path.join(MODE_DIR, "references", "build.md"), "utf8")
const decide = readFileSync(path.join(MODE_DIR, "references", "decide.md"), "utf8")
const ship = readFileSync(path.join(MODE_DIR, "references", "ship.md"), "utf8")
const start = readFileSync(path.join(START_DIR, "SKILL.md"), "utf8")

// Paragraph extraction keeps each pin inside its owning block: a later step
// that merely mentions the same skill must not satisfy the pin.
function notThisPlaybook(text: string): string {
  const marker = "**Not this playbook:**"
  const at = text.indexOf(marker)
  expect(at).toBeGreaterThan(-1)
  const end = text.indexOf("\n\n", at)
  return text.slice(at, end === -1 ? undefined : end)
}

describe("ce-mode match table stays four lanes plus the ce-start catch-all", () => {
  const matchAt = modeBody.indexOf("## Match")
  const tailAt = modeBody.indexOf("## Shared tail")
  expect(matchAt).toBeGreaterThan(-1)
  expect(tailAt).toBeGreaterThan(matchAt)
  const match = modeBody.slice(matchAt, tailAt)

  test("names exactly four playbook rows: build, decide, fix, ship", () => {
    // No dedup collapse: a fifth row reusing an existing playbook still fails.
    const rows = [...match.matchAll(/references\/([a-z-]+\.md)/g)]
      .map((m) => m[1])
      .sort()
    expect(rows).toEqual(["build.md", "decide.md", "fix.md", "ship.md"])
  })

  test("a match-table miss routes through ce-start and stays armed", () => {
    expect(match).toMatch(/Anything else/)
    expect(match).toContain("ce-start")
    expect(match).toMatch(/stay armed/)
  })
})

describe("route-outs pin the condition to the owning skill", () => {
  test("fix.md routes a take-back request to ce-undo", () => {
    const block = notThisPlaybook(fix)
    expect(block).toContain("take the agent's own last change set back")
    expect(block).toContain("ce-undo")
  })

  test("fix.md keeps the ce-optimize route-out", () => {
    const block = notThisPlaybook(fix)
    expect(block).toContain("named metric should move")
    expect(block).toContain("ce-optimize")
  })

  test("build.md routes a throwaway question to ce-prototype", () => {
    const block = notThisPlaybook(build)
    expect(block).toContain("nothing is meant to survive")
    expect(block).toContain("ce-prototype")
  })
})

describe("playbooks carry no git, gh, or test commands", () => {
  for (const [name, text] of [
    ["fix.md", fix],
    ["build.md", build],
    ["decide.md", decide],
    ["ship.md", ship],
  ] as const) {
    test(`${name} has no git/gh/test command`, () => {
      // The backtick class catches Markdown-quoted commands like `git status`.
      expect(text).not.toMatch(/(^|[\s`])(git|gh)\s+\S/m)
      expect(text).not.toContain("bun run test")
      expect(text).not.toContain("bun test")
    })
  }
})

// ce-mode's catch-all is only as good as its destination.
describe("ce-start answers every ce-mode miss", () => {
  const table = start
    .split("\n")
    .filter((line) => line.startsWith("|"))
    .join("\n")

  test("table routes each miss condition to its owning skill", () => {
    expect(table).toContain("| Try something throwaway before committing to it | `ce-prototype` |")
    expect(table).toContain("| Make a working thing faster or cheaper | `ce-optimize` |")
    expect(table).toContain("| Undo the last agent change | `ce-undo` |")
  })

  test("table exits with a stop when no skill owns the request", () => {
    expect(table).toMatch(/No existing CE skill owns the request/)
    expect(table).toMatch(/stop routing/)
  })
})
