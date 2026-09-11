import { readFileSync } from "fs"
import path from "path"
import { describe, expect, test } from "bun:test"

function readRepoFile(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8")
}

// Prose phase standardized model-visible invocation on the single native
// /skill: form. Each row pins the shipped /skill: strings verbatim; the test
// asserts the single-form contract (render rule + no bare $ or /ce- forms).
// Checked 2026-09-08: the old :125 regexes genuinely mismatched shipped text
// (no "defaults to /...", no Codex/dollar copy, three files lack
// "output one form only"), so they were replaced with the checks below.
const modelVisibleRendererCases = [
  {
    // The pre-DONE handoff lines that print these invocations moved into lfg's
    // close-out reference.
    file: "skills/lfg/references/shipping-tail.md",
    skill: ["/skill:ce-explain <name>", "/skill:ce-babysit-pr <pr-url>"],
    singleForm: true,
  },
  {
    file: "skills/ce-babysit-pr/references/setup.md",
    skill: ["/skill:ce-babysit-pr <url>"],
    singleForm: false,
  },
  {
    file: "skills/ce-babysit-pr/references/watch-loop.md",
    skill: ["/skill:ce-babysit-pr <url>"],
    singleForm: false,
  },
  {
    // The concept trailer that prints the invocation moved into the apply reference.
    file: "skills/ce-commit-push-pr/references/apply-and-handoff.md",
    skill: ["/skill:ce-explain <name>"],
    singleForm: false,
  },
  {
    file: "skills/ce-sweep/SKILL.md",
    skill: ["/skill:lfg <root>/plans/feedback-sweep-plan.md"],
    singleForm: true,
  },
  {
    file: "skills/ce-handoff/SKILL.md",
    skill: ["/skill:ce-handoff resume <source>"],
    singleForm: true,
  },
  {
    // Both ce-compound seams moved out of the body with the steps that print
    // them: the refresh recommendation into the refresh reference, the retry
    // line into lightweight's completion block. The rule follows its seam.
    file: "skills/ce-compound/references/refresh-and-discoverability.md",
    skill: ["/skill:ce-compound-refresh <scope>"],
    singleForm: true,
  },
  {
    // report.md is loaded on its own and independently prints the refresh
    // invocation in both terminal templates, so it carries its own rule.
    file: "skills/ce-compound/references/report.md",
    skill: ["/skill:ce-compound-refresh <scope>"],
    singleForm: true,
  },
  {
    file: "skills/ce-compound/references/lightweight.md",
    skill: ["/skill:ce-compound"],
    singleForm: true,
  },
  {
    file: "skills/ce-plan/references/universal-planning.md",
    skill: ["/skill:ce-plan"],
    singleForm: true,
  },
  {
    file: "skills/ce-prototype/SKILL.md",
    skill: ["/skill:ce-prototype", "/skill:ce-brainstorm", "/skill:ce-plan"],
    singleForm: true,
  },
  {
    file: "skills/ce-setup/SKILL.md",
    skill: ["/skill:ce-setup"],
    singleForm: true,
  },
] as const

const explicitOnlyRendererCases = [
  {
    file: "skills/ce-dogfood/SKILL.md",
    skill: ["/skill:ce-setup", "/skill:ce-dogfood <original arguments>"],
    targets: ["ce-dogfood"],
  },
  {
    file: "skills/ce-sweep/references/interview.md",
    skill: ["/skill:ce-sweep"],
    targets: ["ce-sweep"],
  },
] as const

describe("user-facing skill invocation rendering", () => {
  test.each(modelVisibleRendererCases)(
    "$file keeps model-visible handoffs on the single native form",
    ({ file, skill, singleForm }) => {
      const body = readRepoFile(file)

      for (const invocation of skill) expect(body).toContain(invocation)
      expect(body).toMatch(/render only.*invocation as inline code|render it as the fenced command below/i)
      if (singleForm) expect(body).toMatch(/output one form only/i)
      expect(body).not.toContain("$ce-")
      expect(body).not.toContain("$lfg")
      expect(body).not.toMatch(/[`"']\/ce-[a-z]/)
      expect(body).not.toMatch(/[`"']\/lfg[ \s<]/)
    },
  )

  test.each(explicitOnlyRendererCases)(
    "$file uses deterministic OMP syntax for explicit-only skill targets",
    ({ file, skill, targets }) => {
      const body = readRepoFile(file)

      for (const target of targets) {
        expect(readRepoFile(`skills/${target}/SKILL.md`)).toMatch(/^disable-model-invocation:\s*true$/m)
      }
      for (const invocation of skill) expect(body).toContain(invocation)
      expect(body).toMatch(/render only.*invocation as inline code|render it as the fenced command below/i)
      expect(body).not.toContain("$ce-")
      expect(body).not.toContain("$lfg")
      expect(body).not.toMatch(/[`"']\/ce-[a-z]/)
    },
  )

  test("rendering rules sit at the output sections that consume them", () => {
    const setup = readRepoFile("skills/ce-setup/SKILL.md")
    expect(setup.indexOf("User-runnable invocation rendering")).toBeLessThan(
      setup.indexOf("Run `<rendered invocation>`"),
    )

    const sweep = readRepoFile("skills/ce-sweep/SKILL.md")
    expect(sweep.indexOf("User-runnable invocation rendering", sweep.indexOf("#### 2i. Wrap-up"))).toBeGreaterThan(-1)
    expect(sweep).toContain("<rendered lfg invocation for <root>/plans/feedback-sweep-plan.md>")

    const handoff = readRepoFile("skills/ce-handoff/SKILL.md")
    expect(handoff.indexOf("User-runnable invocation rendering")).toBeLessThan(
      handoff.indexOf("<rendered resume invocation>"),
    )
  })

  test("agent-to-agent routes use semantic skill names instead of user command syntax", () => {
    const planHandoff = readRepoFile("skills/ce-plan/references/plan-handoff.md")
    expect(planHandoff).toContain("**Start `ce-work`**")
    expect(planHandoff).not.toContain("**Start `/ce-work`**")

    const verdictRouting = readRepoFile("skills/ce-brainstorm/references/verdict-routing.md")
    expect(verdictRouting).toContain("invoke the `ce-pov` skill")
    expect(verdictRouting).toContain("want a `ce-pov` verdict")
    expect(verdictRouting).not.toContain("tell the user to type `/ce-pov`")

    // ce-work's bare-prompt complexity routing lives in the reference Phase 0 mandates.
    const work = readRepoFile("skills/ce-work/references/work-intake.md")
    expect(work).toContain("benefit from `ce-brainstorm` or `ce-plan`")

    const debug = readRepoFile("skills/ce-debug/SKILL.md")
    expect(debug).toContain("control has transferred to `ce-brainstorm`")

    const optimizeWrapUp = readRepoFile("skills/ce-optimize/references/wrap-up.md")
    expect(optimizeWrapUp).toContain("**Run `ce-code-review`**")
    expect(optimizeWrapUp).toContain("**Run `ce-compound`**")
  })

  test("static ce-optimize examples use host-neutral capability wording", () => {
    const usageGuide = readRepoFile("skills/ce-optimize/references/usage-guide.md")

    expect(usageGuide).toContain("Run the `ce-optimize` skill to find")
    expect(usageGuide).toContain("Run the `ce-optimize` skill to improve")
    expect(usageGuide).toContain("Run the `ce-optimize` skill to create")
    expect(usageGuide).not.toContain("Use /ce-optimize")
  })

  test("Codex goal remains a built-in exception, not a converted skill invocation", () => {
    const planHandoff = readRepoFile("skills/ce-plan/references/plan-handoff.md")
    expect(planHandoff).toContain("Run it as a `/goal`")
    expect(planHandoff).not.toContain("$goal")
  })
})
