import { describe, expect, setDefaultTimeout, test } from "bun:test"
import { promises as fs } from "fs"
import path from "path"
import os from "os"

setDefaultTimeout(20_000)

describe("CLI list", () => {
  test("list returns a root plugin in a temp workspace", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "cli-list-root-"))
    await fs.writeFile(
      path.join(tempRoot, "plugin.json"),
      '{\n  "name": "demo-root-plugin",\n  "version": "1.0.0"\n}\n',
    )

    const repoRoot = path.join(import.meta.dir, "..")
    const proc = Bun.spawn(["bun", "run", path.join(repoRoot, "src", "index.ts"), "list"], {
      cwd: tempRoot,
      stdout: "pipe",
      stderr: "pipe",
    })

    const exitCode = await proc.exited
    const stdout = await new Response(proc.stdout).text()
    const stderr = await new Response(proc.stderr).text()

    if (exitCode !== 0) {
      throw new Error(`CLI failed (exit ${exitCode}).\nstdout: ${stdout}\nstderr: ${stderr}`)
    }

    expect(stdout.trim()).toBe("demo-root-plugin")
  })

  test("list reports no plugins when no manifest exists", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "cli-list-empty-"))

    const repoRoot = path.join(import.meta.dir, "..")
    const proc = Bun.spawn(["bun", "run", path.join(repoRoot, "src", "index.ts"), "list"], {
      cwd: tempRoot,
      stdout: "pipe",
      stderr: "pipe",
    })

    const exitCode = await proc.exited
    const stdout = await new Response(proc.stdout).text()
    const stderr = await new Response(proc.stderr).text()

    if (exitCode !== 0) {
      throw new Error(`CLI failed (exit ${exitCode}).\nstdout: ${stdout}\nstderr: ${stderr}`)
    }

    expect(stdout).toContain("No plugins found.")
  })
})
