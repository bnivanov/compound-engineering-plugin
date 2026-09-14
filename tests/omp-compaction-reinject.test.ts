import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import compoundEngineeringExtension from "../.pi/extensions/compound-engineering"

// Focused tests for the U13 port: opt-in post-compaction re-injection of the
// active skill in .pi/extensions/compound-engineering.ts. The extension is
// imported without the omp SDK, driven through a fake `pi` that captures
// registrations and appended entries, and a fake ctx whose cwd points at a
// disposable temp project. No writes outside those fixtures.

type Handler = (event: unknown, ctx: unknown) => unknown

interface Harness {
  entries: Array<{ type: string; data: unknown }>
  call(event: string, payload?: unknown): Promise<unknown>
}

const OPT_IN = "skill_reinject: true"
const SKILL_ENTRY = "dev.compound-engineering.active-skill"

beforeEach(async () => {
  tempRoot = await mkdtemp(path.join(tmpdir(), "u13-reinject-"))
})

afterEach(async () => {
  if (tempRoot) await rm(tempRoot, { recursive: true, force: true })
  tempRoot = undefined
})

let tempRoot: string | undefined

async function writeConfig(relative: string, body: string): Promise<void> {
  const dir = path.join(tempRoot!, path.dirname(relative))
  await mkdir(dir, { recursive: true })
  await writeFile(path.join(tempRoot!, relative), body)
}

function harness(branch: unknown[] = []): Harness {
  const handlers: Record<string, Handler> = {}
  const entries: Harness["entries"] = []
  const pi = {
    on: (event: string, handler: Handler) => {
      handlers[event] = handler
    },
    appendEntry: (type: string, data: unknown) => {
      entries.push({ type, data })
    },
  }
  compoundEngineeringExtension(pi)
  const ctx = { cwd: tempRoot, sessionManager: { getBranch: () => branch } }
  return {
    entries,
    call: (event, payload = {}) => {
      const handler = handlers[event]
      if (!handler) throw new Error(`no handler registered for ${event}`)
      return Promise.resolve(handler(payload, ctx))
    },
  }
}

describe("U13 resources_discover", () => {
  test("still lists exactly the plugin skills dir", async () => {
    const h = harness()
    const result = (await h.call("resources_discover")) as { skillPaths: string[] }
    expect(result.skillPaths).toEqual([path.join(import.meta.dir, "..", "skills")])
  })
})

describe("U13 opt-in is default OFF", () => {
  test("key absent: no entry appended and no context returned", async () => {
    const h = harness()
    await h.call("tool_call", { toolName: "read", input: { path: "skill://ce-work" } })
    expect(h.entries).toEqual([])
    const compacted = (await h.call("session.compacting")) as { context?: string[] } | undefined
    expect(compacted?.context).toBeUndefined()
  })

  test("key explicitly false: equally inert", async () => {
    await writeConfig(".compound-engineering/config.yaml", `${OPT_IN.replace("true", "false")}\n`)
    const h = harness()
    await h.call("tool_call", { toolName: "read", input: { path: "skill://ce-work" } })
    expect(h.entries).toEqual([])
    const compacted = (await h.call("session.compacting")) as { context?: string[] } | undefined
    expect(compacted?.context).toBeUndefined()
  })

  test("only the exact boolean literal opts in", async () => {
    await writeConfig(".compound-engineering/config.yaml", "skill_reinject: yes\n")
    const h = harness()
    await h.call("tool_call", { toolName: "read", input: { path: "skill://ce-work" } })
    expect(h.entries).toEqual([])
  })

  test("a commented example never opts in", async () => {
    await writeConfig(".compound-engineering/config.yaml", `# ${OPT_IN}\n`)
    const h = harness()
    await h.call("tool_call", { toolName: "read", input: { path: "skill://ce-work" } })
    expect(h.entries).toEqual([])
  })

  test("malformed config resolves off without crashing", async () => {
    await writeConfig(".compound-engineering/config.local.yaml", "::::\n\t- [broken\n")
    const h = harness()
    await h.call("tool_call", { toolName: "read", input: { path: "skill://ce-work" } })
    expect(h.entries).toEqual([])
  })
})

describe("U13 recording of the active skill", () => {
  test("opted in: a skill read appends exactly one entry naming that skill", async () => {
    await writeConfig(".compound-engineering/config.yaml", `${OPT_IN}\n`)
    const h = harness()
    await h.call("tool_call", { toolName: "read", input: { path: "skill://ce-work" } })
    expect(h.entries).toHaveLength(1)
    expect(h.entries[0].type).toBe(SKILL_ENTRY)
    expect(h.entries[0].data).toEqual({ skill: "ce-work", path: "skill://ce-work" })
  })

  test("re-read of the same skill does not append again", async () => {
    await writeConfig(".compound-engineering/config.yaml", `${OPT_IN}\n`)
    const h = harness()
    const read = { toolName: "read", input: { path: "skill://ce-work" } }
    await h.call("tool_call", read)
    await h.call("tool_call", read)
    expect(h.entries).toHaveLength(1)
  })

  test("a different skill appends a second entry and becomes the active one", async () => {
    await writeConfig(".compound-engineering/config.yaml", `${OPT_IN}\n`)
    const h = harness()
    await h.call("tool_call", { toolName: "read", input: { path: "skill://ce-work" } })
    await h.call("tool_call", { toolName: "read", input: { path: "skill://ce-plan" } })
    expect(h.entries).toHaveLength(2)
    expect((h.entries[1].data as { skill: string }).skill).toBe("ce-plan")
  })

  test("local override wins over the repo file, both directions", async () => {
    await writeConfig(".compound-engineering/config.yaml", `${OPT_IN}\n`)
    await writeConfig(".compound-engineering/config.local.yaml", "skill_reinject: false\n")
    const off = harness()
    await off.call("tool_call", { toolName: "read", input: { path: "skill://ce-work" } })
    expect(off.entries).toEqual([])

    await writeConfig(".compound-engineering/config.yaml", "skill_reinject: false\n")
    await writeConfig(".compound-engineering/config.local.yaml", `${OPT_IN}\n`)
    const on = harness()
    await on.call("tool_call", { toolName: "read", input: { path: "skill://ce-work" } })
    expect(on.entries).toHaveLength(1)
  })

  test("non-read tools and non-skill paths are ignored", async () => {
    await writeConfig(".compound-engineering/config.yaml", `${OPT_IN}\n`)
    const h = harness()
    await h.call("tool_call", { toolName: "bash", input: { command: "echo skill://ce-work" } })
    await h.call("tool_call", { toolName: "read", input: { path: "/tmp/notes.md" } })
    expect(h.entries).toEqual([])
  })
})

describe("U13 compaction re-injection", () => {
  test("returns context naming only the recorded active skill", async () => {
    await writeConfig(".compound-engineering/config.yaml", `${OPT_IN}\n`)
    const h = harness()
    await h.call("tool_call", { toolName: "read", input: { path: "skill://ce-work" } })
    const compacted = (await h.call("session.compacting")) as { context?: string[] }
    expect(Array.isArray(compacted.context)).toBe(true)
    const joined = compacted.context!.join("\n")
    expect(joined).toContain("ce-work")
    expect(joined).toContain("skill://ce-work")
    expect(joined).not.toContain("ce-plan")
    expect(joined).not.toContain("ce-setup")
  })

  test("nothing recorded: compaction returns nothing", async () => {
    await writeConfig(".compound-engineering/config.yaml", `${OPT_IN}\n`)
    const h = harness()
    const compacted = (await h.call("session.compacting")) as { context?: string[] } | undefined
    expect(compacted?.context).toBeUndefined()
  })

  test("docs_root is surfaced when config.yaml declares it, omitted otherwise", async () => {
    await writeConfig(
      ".compound-engineering/config.yaml",
      `${OPT_IN}\ndocs_root: .compound-engineering/artifacts\n`,
    )
    const withRoot = harness()
    await withRoot.call("tool_call", { toolName: "read", input: { path: "skill://ce-work" } })
    const withRootResult = (await withRoot.call("session.compacting")) as { context?: string[] }
    expect(withRootResult.context).toHaveLength(2)
    expect(withRootResult.context![1]).toContain(".compound-engineering/artifacts")

    await writeConfig(".compound-engineering/config.yaml", `${OPT_IN}\n`)
    const withoutRoot = harness()
    await withoutRoot.call("tool_call", { toolName: "read", input: { path: "skill://ce-work" } })
    const withoutRootResult = (await withoutRoot.call("session.compacting")) as { context?: string[] }
    expect(withoutRootResult.context).toHaveLength(1)
  })

  test("docs_root declared only in config.local.yaml is ignored (repo convention)", async () => {
    await writeConfig(".compound-engineering/config.yaml", `${OPT_IN}\n`)
    await writeConfig(
      ".compound-engineering/config.local.yaml",
      `docs_root: local-only-root\n`,
    )
    const h = harness()
    await h.call("tool_call", { toolName: "read", input: { path: "skill://ce-work" } })
    const compacted = (await h.call("session.compacting")) as { context?: string[] }
    expect(compacted.context).toHaveLength(1)
    expect(compacted.context!.join("\n")).not.toContain("local-only-root")
  })

  test("state is rebuilt from the journal branch when the runtime cache is empty", async () => {
    await writeConfig(".compound-engineering/config.yaml", `${OPT_IN}\n`)
    const branch = [
      { type: "message", message: { role: "user" } },
      { type: "custom", customType: SKILL_ENTRY, data: { skill: "ce-work", path: "skill://ce-work" } },
    ]
    const h = harness(branch)
    const compacted = (await h.call("session.compacting")) as { context?: string[] }
    expect(compacted.context!.join("\n")).toContain("ce-work")
  })
})

describe("U13 hostile inputs fail silent-and-safe", () => {
  test("malformed tool_call events never throw and never append", async () => {
    await writeConfig(".compound-engineering/config.yaml", `${OPT_IN}\n`)
    const h = harness()
    await h.call("tool_call", {})
    await h.call("tool_call", { toolName: "read" })
    await h.call("tool_call", { toolName: "read", input: null })
    await h.call("tool_call", { toolName: "read", input: { path: 42 } })
    await h.call("tool_call", { toolName: "read", input: { path: { evil: true } } })
    await h.call("tool_call", { toolName: "read", input: { path: "skill://" } })
    await h.call("tool_call", { toolName: "read", input: { path: "skill://../etc/passwd" } })
    await h.call("tool_call", null)
    expect(h.entries).toEqual([])
  })

  test("a throwing getBranch never surfaces as a handler rejection", async () => {
    await writeConfig(".compound-engineering/config.yaml", `${OPT_IN}\n`)
    const handlers: Record<string, Handler> = {}
    const entries: Harness["entries"] = []
    compoundEngineeringExtension({
      on: (event, handler) => {
        handlers[event] = handler
      },
      appendEntry: (type, data) => entries.push({ type, data }),
    })
    const ctx = {
      cwd: tempRoot,
      sessionManager: {
        getBranch: () => {
          throw new Error("journal unavailable")
        },
      },
    }
    await handlers["tool_call"]!({ toolName: "read", input: { path: "skill://ce-work" } }, ctx)
    expect(entries).toHaveLength(1) // appendEntry does not read the branch; the record still lands
    // The runtime cache was set by the append above, so compaction still works.
    const compacted = await handlers["session.compacting"]!({}, ctx)
    expect((compacted as { context?: string[] } | undefined)?.context?.join("\n")).toContain("ce-work")

    // Fresh session (empty cache) + throwing journal: compaction injects nothing.
    const freshEntries: Harness["entries"] = []
    compoundEngineeringExtension({
      on: (event, handler) => {
        handlers[event] = handler
      },
      appendEntry: (type, data) => freshEntries.push({ type, data }),
    })
    const fresh = await handlers["session.compacting"]!({}, ctx)
    expect((fresh as { context?: string[] } | undefined)?.context).toBeUndefined()
    expect(freshEntries).toEqual([])
  })
})
