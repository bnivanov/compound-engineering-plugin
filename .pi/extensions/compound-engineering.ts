import { dirname, resolve } from "node:path"
import { readFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"

const extensionDir = dirname(fileURLToPath(import.meta.url))
const packageRoot = resolve(extensionDir, "../..")
const skillsDir = resolve(packageRoot, "skills")

// U13 (post-compaction skill re-injection), opt-in and default OFF.
//
// OMP lazy-loads skill bodies: metadata sits in the system prompt, the body
// arrives only when the model calls `read skill://<name>`. Compaction
// summarizes conversation text, so the body can be rewritten out of context
// while the session is still inside that skill's workflow. When opted in, this
// extension observes skill reads via `tool_call`, records the active skill
// durably in the session journal, and at compaction re-injects one bounded
// pointer line naming that skill so the model re-`read`s it. Never the whole
// body, never other skills.
//
// The factory deliberately types `pi`/`ctx` structurally instead of importing
// the SDK: the extension must stay importable in tests without @oh-my-pi
// packages, and the handlers only need this small surface.

/** Minimal structural view of the ExtensionAPI surface this extension uses. */
interface ExtensionApi {
  on(event: string, handler: (event: unknown, ctx: unknown) => unknown): void
  appendEntry(customType: string, data: unknown): void
}

/** Minimal structural view of the handler context (omp://extensions.md § 2). */
interface HandlerContext {
  cwd?: unknown
  sessionManager?: unknown
}

/** Session journal customType for the active-skill record. Extension-owned; not a core-reserved value. */
const ACTIVE_SKILL_ENTRY_TYPE = "dev.compound-engineering.active-skill"

/** Config keys, resolved with the repo's existing convention. */
const OPT_IN_KEY = "skill_reinject"
const DOCS_ROOT_KEY = "docs_root"

/**
 * Read one top-level scalar from the repo's flat CE config convention
 * (skills/ce-setup/scripts/check-health `read_flat_config_value`): first
 * active (non-commented) `key:` line across the given layers wins; comments,
 * blank values, and surrounding quotes are handled exactly as there.
 * Deliberately not a YAML parser -- no dependency, and a missing, malformed,
 * or unreadable file is skipped rather than fatal.
 */
async function readFlatConfigValue(files: string[], key: string): Promise<string | undefined> {
  for (const file of files) {
    let text: string
    try {
      text = await readFile(file, "utf8")
    } catch {
      continue // missing or unreadable layer: skipped, per the repo cascade
    }
    for (const line of text.split("\n")) {
      // Active line only: a commented example (`# key: value`) must not win.
      if (!line.startsWith(key)) continue
      const rest = line.slice(key.length)
      if (!/^[ \t]*:/.test(rest)) continue
      const value = rest
        .replace(/^[ \t]*:[ \t]*/, "")
        .replace(/[ \t]+#.*$/, "") // trailing comment
        .replace(/^[ \t]+/, "")
        .replace(/[ \t]+$/, "")
      if (value === "") continue // empty scalar continues to the next layer
      // Strip one pair of surrounding quotes, matching check-health.
      const unquoted = value.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1")
      return unquoted
    }
  }
  return undefined
}

/**
 * Type guard: is this a `tool_call` event from the `read` tool whose input
 * names a `skill://<name>` path? Returns the normalized skill NAME (never the
 * raw path) so re-injection cannot echo a path the loader would reject;
 * undefined for every other shape.
 */
function skillNameFromReadCall(event: unknown): string | undefined {
  if (typeof event !== "object" || event === null) return undefined
  const record = event as { toolName?: unknown; input?: unknown }
  if (record.toolName !== "read" || typeof record.input !== "object" || record.input === null) {
    return undefined
  }
  const raw = (record.input as { path?: unknown }).path
  if (typeof raw !== "string") return undefined
  const match = /^skill:\/\/([^/?#\s]+)$/.exec(raw)
  return match ? match[1] : undefined
}

/** Session cwd per handler contract; falls back to the process cwd. */
function cwdOf(ctx: unknown): string {
  if (typeof ctx === "object" && ctx !== null) {
    const cwd = (ctx as HandlerContext).cwd
    if (typeof cwd === "string") return cwd
  }
  return process.cwd()
}

export default function compoundEngineeringPiExtension(pi: ExtensionApi) {
  pi.on("resources_discover", async () => ({
    skillPaths: [skillsDir],
  }))

  // --- U13: opt-in, default OFF ---
  //
  // Handlers are registered unconditionally so the off-state is provably
  // inert as a property of the code path: each one short-circuits on the
  // memoized flag before doing any work. `tool_call` fires before every tool
  // execution, so the opt-in is resolved ONCE per session and memoized --
  // after the first resolution the per-tool-call cost is a boolean check with
  // no filesystem IO. Any config trouble resolves OFF (fail safe).

  // undefined = not yet resolved; otherwise the resolved opt-in.
  let optIn: boolean | undefined
  // Active-skill cache. Durable state is the journal (pi.appendEntry +
  // getBranch reconstruction, the documented pattern) so the record survives
  // resume; this cache only avoids re-walking the branch on every handler
  // call and is rebuilt from the journal when empty.
  let activeSkill: string | undefined

  async function resolveOptIn(projectDir: string): Promise<boolean> {
    if (optIn !== undefined) return optIn
    const layers = [
      resolve(projectDir, ".compound-engineering", "config.local.yaml"),
      resolve(projectDir, ".compound-engineering", "config.yaml"),
    ]
    let value: string | undefined
    try {
      value = await readFlatConfigValue(layers, OPT_IN_KEY)
    } catch {
      value = undefined // never let config trouble turn a no-op into a failure
    }
    // Opt-in is the exact boolean literal; anything else (absent, commented,
    // "yes", malformed) stays off.
    optIn = value === "true"
    return optIn
  }

  async function ensureActiveSkill(ctx: unknown): Promise<string | undefined> {
    if (activeSkill !== undefined) return activeSkill
    try {
      const ctxRecord = (typeof ctx === "object" && ctx !== null ? ctx : {}) as HandlerContext
      const branch = (ctxRecord.sessionManager as
        | { getBranch?: () => unknown }
        | undefined)?.getBranch?.()
      if (Array.isArray(branch)) {
        for (const entry of branch) {
          if (
            typeof entry === "object" &&
            entry !== null &&
            (entry as { type?: unknown }).type === "custom" &&
            (entry as { customType?: unknown }).customType === ACTIVE_SKILL_ENTRY_TYPE
          ) {
            const data = (entry as { data?: unknown }).data
            const skill = (typeof data === "object" && data !== null ? data : {} as Record<string, unknown>) as
              | { skill?: unknown }
              | Record<string, unknown>
            const name = (skill as { skill?: unknown }).skill
            if (typeof name === "string" && name !== "") {
              activeSkill = name // last one wins: journal order
            }
          }
        }
      }
    } catch {
      // unreadable branch: leave undefined, compaction then injects nothing
    }
    return activeSkill
  }

  pi.on("tool_call", async (event, ctx) => {
    try {
      const projectDir = cwdOf(ctx)
      if (!(await resolveOptIn(projectDir))) return // off: memoized boolean, no IO, no state
      const skill = skillNameFromReadCall(event)
      if (!skill) return // not a skill read: nothing to record
      if ((await ensureActiveSkill(ctx)) === skill) return // dedup: same skill already recorded
      pi.appendEntry(ACTIVE_SKILL_ENTRY_TYPE, { skill, path: `skill://${skill}` })
      activeSkill = skill
    } catch {
      // U13 contract: a skill read is never worth failing a tool call over.
      // Swallow; nothing is appended, the tool call proceeds untouched.
    }
  })

  pi.on("session.compacting", async (_event, ctx) => {
    try {
      const projectDir = cwdOf(ctx)
      if (!(await resolveOptIn(projectDir))) return
      const skill = await ensureActiveSkill(ctx)
      if (!skill) return // nothing recorded: inject nothing
      const lines = [
        `Active skill: ${skill} (its instructions were in context before compaction; re-read skill://${skill} to reload the full body before continuing the workflow).`,
      ]
      // The project artifact root rides along only when the project config
      // declares one, using the existing key; no new key is invented. Per the
      // documented convention, docs_root is read from tracked config.yaml only.
      let docsRoot: string | undefined
      try {
        docsRoot = await readFlatConfigValue(
          [resolve(projectDir, ".compound-engineering", "config.yaml")],
          DOCS_ROOT_KEY,
        )
      } catch {
        docsRoot = undefined
      }
      if (docsRoot) lines.push(`Project artifact root (docs_root): ${docsRoot}`)
      return { context: lines }
    } catch {
      return // compaction must never see an extension error from this feature
    }
  })
}
