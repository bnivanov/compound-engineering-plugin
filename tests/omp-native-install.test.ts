import { describe, expect, setDefaultTimeout, test } from "bun:test"
import { existsSync, readdirSync, readFileSync } from "node:fs"
import path from "node:path"
import { parseFrontmatter } from "../src/utils/frontmatter"

// Smoke test for native oh-my-pi (omp) install of this repository (#1224).
// omp loads the repo directly from package.json#pi — no converter, no writer.
// Dry-run only: this file never installs into the user's real HOME.
setDefaultTimeout(20_000)

const REPO_ROOT = path.join(import.meta.dir, "..")

// Probed at module load (not beforeAll) because test.skipIf evaluates its
// condition at registration time, matching the convention in the
// *-writer.test.ts suites.
const OMP_BIN = Bun.which("omp")

const packageJson = JSON.parse(readFileSync(path.join(REPO_ROOT, "package.json"), "utf8")) as {
  name: string
  version: string
  pi?: { extensions?: string[]; skills?: string[]; version?: string }
}

describe("omp native install", () => {
  test.skipIf(OMP_BIN === null)("omp dry-run install recognizes the repository", async () => {
    const proc = Bun.spawn([OMP_BIN!, "install", "--dry-run", "--json", REPO_ROOT], {
      stdout: "pipe",
      stderr: "pipe",
    })
    const [stdout, stderr, exitCode] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
      proc.exited,
    ])
    expect(exitCode, `omp install --dry-run failed:\n${stderr}`).toBe(0)

    const result = JSON.parse(stdout) as {
      name: string
      manifest: { extensions?: string[]; skills?: string[]; version?: string }
    }
    expect(result.name).toBe("compound-engineering")
    expect(result.manifest.skills).toContain("./skills")
    expect(result.manifest.extensions).toContain("./.pi/extensions/compound-engineering.ts")
    // The pi manifest does not pin its own version; omp then reports the
    // package.json top-level version. Read both so the test drifts with the
    // repo instead of pinning a literal.
    const expectedVersion = packageJson.pi?.version ?? packageJson.version
    expect(result.manifest.version).toBe(expectedVersion)
  })

  // The dry-run JSON above does not enumerate discovered skills, so inventory
  // coverage is asserted on disk instead: omp requires a frontmatter
  // description for native-provider skill discovery and silently drops skills
  // without one. This test spawns nothing and stays unguarded so CI hosts
  // without omp still gate the inventory.
  test("omp discovers the full skill inventory", () => {
    const skillsDir = path.join(REPO_ROOT, "skills")
    const skillDirs = readdirSync(skillsDir, { withFileTypes: true })
      .filter((entry) =>
        entry.isDirectory() && existsSync(path.join(skillsDir, entry.name, "SKILL.md"))
      )
      .map((entry) => entry.name)
    expect(skillDirs.length).toBeGreaterThan(0)

    for (const dir of skillDirs) {
      const skillMdPath = path.join(skillsDir, dir, "SKILL.md")
      const { data } = parseFrontmatter(readFileSync(skillMdPath, "utf8"), skillMdPath)
      expect(
        typeof data.name === "string" && data.name.trim() !== "",
        `${dir}/SKILL.md must declare a non-empty frontmatter name`,
      ).toBe(true)
      expect(
        typeof data.description === "string" && data.description.trim() !== "",
        `${dir}/SKILL.md must declare a non-empty frontmatter description; omp drops skills without one`,
      ).toBe(true)
    }
  })
})

describe("omp marketplace catalog", () => {
  const catalog = JSON.parse(readFileSync(path.join(REPO_ROOT, ".omp-plugin", "marketplace.json"), "utf8")) as { name: string; owner: { name: string }; plugins: Array<{ name: string; description?: string; version?: string; source: unknown }> };
  const pluginManifest = JSON.parse(readFileSync(path.join(REPO_ROOT, "plugin.json"), "utf8")) as { version: string };
  const NAME_RULE = /^[a-z0-9][a-z0-9.-]{0,62}[a-z0-9]$|^[a-z0-9]$/;
  test("catalog is the only marketplace catalog omp can find", () => { expect(existsSync(path.join(REPO_ROOT, ".claude-plugin", "marketplace.json"))).toBe(false) });
  test("catalog and plugin entry satisfy omp naming rules and point at the repo root", () => { expect(catalog.name).toMatch(NAME_RULE); expect(typeof catalog.owner?.name).toBe("string"); expect(catalog.plugins).toHaveLength(1); const [plugin] = catalog.plugins; expect(plugin.name).toBe(packageJson.name); expect(plugin.name).toMatch(NAME_RULE); expect(`${plugin.name}@${catalog.name}`.length).toBeLessThanOrEqual(128); expect(plugin.source).toBe("./"); expect(plugin.description?.trim().length ?? 0).toBeGreaterThan(0) });
  test("catalog version agrees with package.json and plugin.json", () => { expect(catalog.plugins[0].version).toBe(packageJson.version); expect(pluginManifest.version).toBe(packageJson.version) });
});
