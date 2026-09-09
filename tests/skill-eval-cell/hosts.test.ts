import { describe, expect, test } from "bun:test"
import os from "node:os"
import path from "node:path"
import { READ_ONLY_TOOLS, WRITE_TOOLS, cellEnv, planCell, wrapPrompt } from "./hosts"

describe("skill-eval-cell omp builder pins the measured invocation", () => {
  const cwd = os.tmpdir()
  const promptFile = path.join(cwd, "prompt.md")
  const skillDir = path.join(cwd, "skill")

  test("cellEnv keeps stdout greppable for trailer scans", () => {
    const env = cellEnv({ CLICOLOR_FORCE: "1", GH_FORCE_TTY: "1" })
    expect(env.CLICOLOR_FORCE).toBeUndefined()
    expect(env.GH_FORCE_TTY).toBeUndefined()
    expect(env.NO_COLOR).toBe("1")
  })

  test("the read-only cell runs plain print mode with discovery isolation", () => {
    const plan = planCell({ cwd, promptFile, skillDir, readOnly: true })
    expect(plan.argv).toEqual([
      "omp",
      `@${promptFile}`,
      "Follow the attached brief.",
      "-p",
      "--no-session",
      "--no-skills",
      "--no-rules",
      "--no-extensions",
      "--add-dir",
      skillDir,
      "--tools",
      READ_ONLY_TOOLS,
      "--cwd",
      cwd,
    ])
    expect(Object.keys(plan).sort()).toEqual(["argv", "env", "notes"])
    expect(plan.env.NO_COLOR).toBe("1")
  })

  test("the write arm widens the toolset and pins --approval-mode yolo", () => {
    const plan = planCell({ cwd, promptFile, skillDir })
    expect(plan.argv).toContain("--tools")
    expect(plan.argv[plan.argv.indexOf("--tools") + 1]).toBe(WRITE_TOOLS)
    for (const tool of ["read", "grep", "glob", "edit", "write", "bash"]) {
      expect(WRITE_TOOLS.split(",")).toContain(tool)
    }
    expect(plan.argv).toContain("--approval-mode")
    expect(plan.argv[plan.argv.indexOf("--approval-mode") + 1]).toBe("yolo")
    // The cell spawns with stdin from /dev/null, so any approval prompt burns the
    // full timeout; both postures must stay approval-free.
    const readOnly = planCell({ cwd, promptFile, skillDir, readOnly: true })
    expect(readOnly.argv).not.toContain("--approval-mode")
  })

  test("discovery isolation keeps installed and repo-local skill surfaces out", () => {
    const plan = planCell({ cwd, promptFile, skillDir, readOnly: true })
    for (const flagName of ["--no-skills", "--no-rules", "--no-extensions"]) {
      expect(plan.argv).toContain(flagName)
    }
    // The extracted git-ref copy is attached beyond the working directory...
    expect(plan.argv[plan.argv.indexOf("--add-dir") + 1]).toBe(skillDir)
    // ...and the cell runs in its own workspace, not the authoring checkout.
    expect(plan.argv[plan.argv.indexOf("--cwd") + 1]).toBe(cwd)
  })

  test("notes record the isolation and approval contract", () => {
    const readOnly = planCell({ cwd, promptFile, skillDir, readOnly: true })
    const write = planCell({ cwd, promptFile, skillDir })
    expect(readOnly.notes.join("\n")).toMatch(/--no-skills/)
    expect(readOnly.notes.join("\n")).toMatch(/approval-free/)
    expect(write.notes.join("\n")).toMatch(/yolo/)
  })

  test("wrapPrompt does not tell the model it is an eval", () => {
    const prompt = wrapPrompt({
      skillDir: "/tmp/skill",
      workspace: "/tmp/ws",
      task: "Babysit PR #12.",
    })
    expect(prompt.toLowerCase()).not.toContain("eval")
    expect(prompt).toContain("Babysit PR #12.")
    expect(prompt).toContain("FILES_READ:")
    expect(prompt).toContain("plugin cache")
  })
})
