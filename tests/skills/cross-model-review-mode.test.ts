import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import path from "node:path"

const repoRoot = path.join(__dirname, "../..")
const read = (p: string) => readFileSync(path.join(repoRoot, p), "utf8")

// `cross_model_review_mode: off` is a checkout-local egress gate for the review
// skills' automatic cross-model pass. It is evaluated before the fixed omp
// dispatch in both consumers (no peer resolution exists), and the template
// ships an active auto default.
describe("cross_model_review_mode egress gate", () => {
  const references = [
    "skills/ce-code-review/references/cross-model-review.md",
    "skills/ce-doc-review/references/cross-model-review.md",
  ]

  for (const ref of references) {
    test(`${ref} gates the automatic pass on cross_model_review_mode before omp dispatch`, () => {
      const content = read(ref)
      const gate = content.indexOf("cross_model_review_mode")
      // skills/*/references/cross-model-review.md:33 (no preference order to
      // resolve: the fixed omp dispatch is the only route)
      const dispatch = content.indexOf("Explicit omp dispatch")
      expect(gate).toBeGreaterThan(-1)
      expect(dispatch).toBeGreaterThan(gate)
      // skills/*/references/cross-model-review.md:28-29 (auto default, off valid)
      expect(content).toMatch(/`auto`\s+\(default\)/)
      expect(content).toContain("`off`")
      // skills/*/references/cross-model-review.md:29-30 (off skips quietly, no worker call)
      expect(content).toContain("skip the automatic pass")
      expect(content).toContain("NO worker call")
      // skills/*/references/cross-model-review.md:31 (live opt-in still runs)
      expect(content).toContain("explicit user request for a separate read in conversation still runs")
    })
  }

  test("both SKILL.md files wire the gate into their cross-model step", () => {
    for (const p of ["skills/ce-code-review/SKILL.md", "skills/ce-doc-review/SKILL.md"]) {
      expect(read(p)).toContain("cross_model_review_mode")
    }
  })

  test("ce-code-review body treats a missing key as the default auto route", () => {
    const body = read("skills/ce-code-review/SKILL.md")
    // skills/ce-code-review/SKILL.md:28 (absent key means auto, never a skip)
    expect(body).toContain("only skip key is `cross_model_review_mode`")
    expect(body).toContain("Missing files or unset keys take the default auto route")
  })

  test("config template, example, and configuration reference document the key", () => {
    for (const p of [
      "skills/ce-setup/references/config-template.yaml",
      ".compound-engineering/config.example.yaml",
      "docs/guides/configuration.md",
      "docs/guides/ce-code-review.md",
      "docs/guides/ce-doc-review.md",
    ]) {
      expect(read(p)).toContain("cross_model_review_mode")
    }
    // Fork S6b: the template ships an ACTIVE auto default (S2 landed, so the
    // egress gate is safe to keep open); set `off` for fully local reviews.
    expect(read("skills/ce-setup/references/config-template.yaml")).toMatch(
      /^cross_model_review_mode: auto\s+# auto \| off \(default: auto\)/m,
    )
    expect(read("skills/ce-setup/references/config-template.yaml")).not.toMatch(
      /^#\s*cross_model_review_mode:/m,
    )
    expect(read(".compound-engineering/config.example.yaml")).toMatch(
      /^cross_model_review_mode: auto\s+# auto \| off \(default: auto\)/m,
    )
  })

  test("fork template ships OMP-safe generation defaults (S6/S7.2 snapshot)", () => {
    const content = read("skills/ce-setup/references/config-template.yaml")
    // (a) active auto gate for newly generated configs
    expect(content).toMatch(/^cross_model_review_mode: auto/m)
    // (b) no active retired key: the work engine and the old peer preference
    // are unread; re-adding either as an active key revives dead routing.
    expect(content).not.toMatch(/^work_engine_mode:/m)
    expect(content).not.toMatch(/^cross_model_peer:/m)
  })
})
