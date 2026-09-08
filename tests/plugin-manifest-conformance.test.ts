import path from "path"
import { describe, expect, test } from "bun:test"

// Fork note (S5.5): kept verbatim from the deleted tests/release-metadata.test.ts.
// That suite's version-agreement checks conflicted with `-omp.N` tags, but this
// Agent Plugins root-manifest conformance block imports nothing from src/release
// and is the only CI check over the root plugin.json OMP loads. Do not re-add
// version-agreement assertions here — fork versions are `X.Y.Z-omp.N`, not `^X.Y.Z$`.

/** Agent Plugins v1.0.0 root-manifest authoring rules (pinned locally; no schema fetch). */
const AGENT_PLUGINS_SCHEMA =
  "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json"
const AGENT_PLUGINS_NAME_PATTERN =
  /^(?!.*(?:--|\.\.))[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/
const AGENT_PLUGINS_PERMITTED_KEYS = new Set([
  "$schema",
  "name",
  "version",
  "description",
  "author",
  "homepage",
  "repository",
  "license",
  "keywords",
  "extensions",
])
const AGENT_PLUGINS_AUTHOR_KEYS = new Set(["name", "email", "url"])
const AGENT_PLUGINS_STRING_FIELDS = [
  "version",
  "description",
  "homepage",
  "repository",
  "license",
] as const

function agentPluginsManifestErrors(manifest: Record<string, unknown>): string[] {
  const errors: string[] = []

  // $schema is deliberately absent while any SKILL.md exceeds Codex's 8000-byte
  // Agent Plugin prompt bound (see tests/codex-skill-prompt-budget.test.ts, #1412).
  if (manifest.$schema !== undefined && manifest.$schema !== AGENT_PLUGINS_SCHEMA) {
    errors.push(`$schema must be ${AGENT_PLUGINS_SCHEMA} when present`)
  }

  if (typeof manifest.name !== "string") {
    errors.push("name must be a string")
  } else if (
    manifest.name.length < 1 ||
    manifest.name.length > 64 ||
    !AGENT_PLUGINS_NAME_PATTERN.test(manifest.name)
  ) {
    errors.push("name must match Agent Plugins §5.5 constraints")
  }

  for (const key of Object.keys(manifest)) {
    if (!AGENT_PLUGINS_PERMITTED_KEYS.has(key)) {
      errors.push(`unknown top-level field: ${key}`)
    }
  }

  if (manifest.author !== undefined) {
    if (
      typeof manifest.author !== "object" ||
      manifest.author === null ||
      Array.isArray(manifest.author)
    ) {
      errors.push("author must be an object")
    } else {
      for (const [key, value] of Object.entries(manifest.author as Record<string, unknown>)) {
        if (!AGENT_PLUGINS_AUTHOR_KEYS.has(key)) {
          errors.push(`author has unknown field: ${key}`)
        } else if (typeof value !== "string") {
          errors.push(`author.${key} must be a string`)
        }
      }
    }
  }

  for (const field of AGENT_PLUGINS_STRING_FIELDS) {
    if (manifest[field] !== undefined && typeof manifest[field] !== "string") {
      errors.push(`${field} must be a string`)
    }
  }

  if (manifest.keywords !== undefined) {
    if (
      !Array.isArray(manifest.keywords) ||
      manifest.keywords.some((item) => typeof item !== "string")
    ) {
      errors.push("keywords must be an array of strings")
    }
  }

  if (manifest.extensions !== undefined) {
    if (
      typeof manifest.extensions !== "object" ||
      manifest.extensions === null ||
      Array.isArray(manifest.extensions)
    ) {
      errors.push("extensions must be an object")
    } else {
      for (const [ns, value] of Object.entries(
        manifest.extensions as Record<string, unknown>,
      )) {
        if (typeof value !== "object" || value === null || Array.isArray(value)) {
          errors.push(`extensions.${ns} must be an object`)
        }
      }
    }
  }

  return errors
}

describe("Agent Plugins root manifest conformance", () => {
  test("repo root plugin.json matches Agent Plugins v1.0.0 authoring rules", async () => {
    const repoRoot = path.join(import.meta.dir, "..")
    const manifest = JSON.parse(
      await Bun.file(path.join(repoRoot, "plugin.json")).text(),
    ) as Record<string, unknown>

    expect(agentPluginsManifestErrors(manifest)).toEqual([])
  })

  test("rejects the legacy Antigravity $schema value", () => {
    const errors = agentPluginsManifestErrors({
      $schema: "https://antigravity.google/schemas/v1/plugin.json",
      name: "compound-engineering",
      version: "3.21.4",
    })
    expect(errors.some((e) => e.includes("$schema"))).toBe(true)
  })

  test("rejects unknown top-level fields (authoring closed-set)", () => {
    const errors = agentPluginsManifestErrors({
      $schema: AGENT_PLUGINS_SCHEMA,
      name: "compound-engineering",
      commands: [],
    })
    expect(errors.some((e) => e.includes("unknown top-level field: commands"))).toBe(true)
  })

  test("rejects author objects with extra fields", () => {
    const errors = agentPluginsManifestErrors({
      $schema: AGENT_PLUGINS_SCHEMA,
      name: "compound-engineering",
      author: { name: "x", twitter: "@x" },
    })
    expect(errors.some((e) => e.includes("author has unknown field: twitter"))).toBe(true)
  })

  test("rejects wrong-typed permitted fields", () => {
    const errors = agentPluginsManifestErrors({
      $schema: AGENT_PLUGINS_SCHEMA,
      name: "compound-engineering",
      repository: { type: "git", url: "https://example.com" },
    })
    expect(errors.some((e) => e.includes("repository must be a string"))).toBe(true)
  })

  test("rejects non-object extensions values", () => {
    const errors = agentPluginsManifestErrors({
      $schema: AGENT_PLUGINS_SCHEMA,
      name: "compound-engineering",
      extensions: { "com.example.client": "not-an-object" },
    })
    expect(errors.some((e) => e.includes("extensions.com.example.client must be an object"))).toBe(
      true,
    )
  })
})
