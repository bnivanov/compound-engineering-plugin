import { mkdtempSync, writeFileSync } from "fs"
import { readFile } from "fs/promises"
import { tmpdir } from "os"
import path from "path"
import { describe, expect, test } from "bun:test"

async function readRepoFile(relativePath: string): Promise<string> {
  return readFile(path.join(process.cwd(), relativePath), "utf8")
}

describe("ce-test-browser browser-driver policy", () => {
  test("uses OMP browser and does not fall back to agent-browser", async () => {
    const content = await readRepoFile("skills/ce-test-browser/SKILL.md")

    expect(content).toMatch(/OMP's `browser` primitive/i)
    expect(content).toMatch(/host-native integrated browser/i)
    expect(content).toMatch(/Do not fall back to `agent-browser`/i)
    expect(content).toMatch(/one driver for the entire run/i)
    expect(content).not.toContain("references/agent-browser-driver.md")

    expect(content).not.toContain("## Use `agent-browser` Only")
    expect(content).not.toContain("always choose `agent-browser`")
    expect(content).not.toContain("this skill cannot function without it")
  })

  test("distinguishes OMP browser from prohibited standalone substitutes", async () => {
    const content = await readRepoFile("skills/ce-test-browser/SKILL.md")

    expect(content).toMatch(/standalone Playwright, Puppeteer/is)
    expect(content).toMatch(/separately configured browser extension/i)
    expect(content).toMatch(/ad hoc browser automation/i)
  })


  test("pipeline mode changes orchestration without forcing a driver or hiding it", async () => {
    const content = await readRepoFile(
      "skills/ce-test-browser/references/pipeline-orchestration.md",
    )

    expect(content).toMatch(/does not change browser-driver selection/i)
    expect(content).toMatch(/unattended.+does not mean hidden/is)
    expect(content).toMatch(/visible.+non-blocking/is)
    expect(content).not.toContain("subsequent `agent-browser` command")
    expect(content).not.toContain("never pass `--headed`")
  })

  // Port seeding used to cross files as a prose-emitted line ("Preferred dev server
  // port: N") that step 4's block echoed and pipeline-orchestration.md told the agent
  // to retype. Claude Code routinely skipped emitting it, so pipeline runs silently
  // seeded 3000. The port now comes from a bundled script each mode runs itself.
  describe("port resolution is a script, not a printed line", () => {
    const script = "skills/ce-test-browser/scripts/resolve-port.sh"

    test("no file re-implements the port ladder or carries a port across shell calls", async () => {
      const body = await readRepoFile("skills/ce-test-browser/SKILL.md")
      const pipeline = await readRepoFile(
        "skills/ce-test-browser/references/pipeline-orchestration.md",
      )
      const routeAndReport = await readRepoFile(
        "skills/ce-test-browser/references/route-and-report.md",
      )

      for (const content of [body, pipeline, routeAndReport]) {
        expect(content).toContain("scripts/resolve-port.sh")
        expect(content).not.toContain("Preferred dev server port")
      }
      expect(pipeline).toContain('PORT=$(bash "$SKILL_DIR/scripts/resolve-port.sh" --free')
      expect(pipeline).not.toContain("find_free_port")
    })

    test("the script prints only the port, honoring the documented order", () => {
      const dir = mkdtempSync(path.join(tmpdir(), "ce-test-browser-port-"))
      const run = (...args: string[]) => {
        const proc = Bun.spawnSync({
          cmd: ["bash", path.join(process.cwd(), script), ...args],
          cwd: dir,
        })
        expect(proc.exitCode).toBe(0)
        return proc.stdout.toString().trim()
      }

      expect(run()).toBe("3000")

      writeFileSync(path.join(dir, ".env"), "PORT=4100 # dev server\n")
      expect(run()).toBe("4100")

      writeFileSync(
        path.join(dir, "package.json"),
        JSON.stringify({ scripts: { dev: "serve --port 4200" } }),
      )
      expect(run()).toBe("4200")

      expect(run("4300")).toBe("4300")
    })
  })

  test("user documentation describes the same OMP-only policy", async () => {
    const docs = await readRepoFile("docs/guides/ce-test-browser.md")
    const catalog = await readRepoFile("docs/guides/README.md")

    expect(docs).toMatch(/host-native.+integrated browser/is)
    expect(docs).toMatch(/embedded in or directly owned by the active harness/i)
    expect(docs).toMatch(/OMP `browser`/i)
    expect(docs).not.toMatch(/fall back to `agent-browser`/i)
    expect(docs).not.toMatch(/host-native browser.+`agent-browser` fallback/i)
    expect(docs).toMatch(/standalone Playwright.+Puppeteer/is)
    expect(docs).toMatch(/separately configured browser extensions or MCPs/i)
    expect(docs).toMatch(/visible.+non-blocking/is)
    expect(catalog).toMatch(/using OMP `browser`/i)
    expect(catalog).not.toMatch(/fall back to `agent-browser`/i)
    expect(catalog).not.toMatch(/host-native browser.+`agent-browser` fallback/i)
  })
})
