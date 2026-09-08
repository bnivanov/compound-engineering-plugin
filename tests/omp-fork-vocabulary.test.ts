import { existsSync, readFileSync, readdirSync } from "fs"
import path from "path"
import { describe, expect, test } from "bun:test"

/**
 * OMP fork vocabulary pin: the shipped surface carries zero non-OMP literals.
 *
 * Three groups:
 *
 * 1. "shipped surface carries zero non-OMP literals" walks skills/** (scanned
 *    extensions), docs/** (minus brainstorms, plans, solutions, ideation),
 *    and root *.md (minus CHANGELOG.md), skipping every dot-path, and asserts
 *    no case-insensitive SUBSTRING match of SUBSTRING_TOKENS and no
 *    case-insensitive WORD-BOUNDARY match of BOUNDARY_TOKENS, except the
 *    per-file token exemptions in ALLOWLIST. Boundary matching keeps the
 *    domain word "diffable" from firing on "fable".
 *
 * 2. "domain-term allowlist is exact" verifies every ALLOWLIST entry against
 *    the tree: each listed file must exist and must still contain at least one
 *    of its tokens. A clean entry is a stale entry, so this fails until the
 *    entry is dropped. It fails on any allowlisted file that is missing.
 *
 * 3. "tests carry no straggler harness names" walks tests/** (minus fixtures
 *    and skill-eval-cell) and asserts no word-boundary STRAGGLER_TOKENS hit.
 *    tests/ necessarily names retired things in contract assertions, so only
 *    the never-valid stragglers are pinned here. "windsurf" is deliberately
 *    not pinned: tests/frontmatter.test.ts keeps an inline IDE-clutter skip
 *    list (.claude/.codex/.cursor/.windsurf/.opencode) that is functional
 *    directory filtering, so pinning it would force an arbitrary single-entry
 *    drop or a behavior-changing rewrite of that list.
 *
 * Notes on the allowlist (verified against the tree at authoring time):
 * - The performance-reviewer entry lives at
 *   skills/ce-code-review/references/personas/performance-reviewer.md: the
 *   tree has no skills/ce-code-review/personas/ directory, so the path without
 *   the references/ segment was adjusted to the real file.
 * - SCANNED_EXTS covers .js and .css in addition to the prose/config set
 *   because the two ce-prototype asset entries only make sense when scanned
 *   (comment-composer UI names, CSS cursor property).
 * - skills/ce-sweep/scripts/sweep-state.py and the two
 *   repo-research-analyst.md files were added after a full-tree scan: the
 *   sweep-state engine, GraphQL-style cursor variables, and the composer.json
 *   PHP manifest row are domain vocabulary that cannot be renamed.
 * - Dropped as clean (no scan token fires, verified): scope.md,
 *   ce-product-pulse run.md and guide (only boundary-exempt "diffable"),
 *   ce-setup check-health and repo-fixes.md (only retired-key names such as
 *   cross_model_peer and work_engine_mode, which are not scan tokens;
 *   check-health is also extensionless, outside the scanned extensions), and
 *   lfg SKILL.md (only the plan_model carrier, not a scan token).
 */

const REPO_ROOT = path.join(import.meta.dir, "..")

// Case-insensitive SUBSTRING tokens: any occurrence in a scanned line is a hit.
const SUBSTRING_TOKENS = [
  "codex",
  "claude",
  "grok",
  "cursor",
  "composer",
  "opencode",
  "haiku",
  "sonnet",
  "orca",
  "windsurf",
  "gemini-cli",
]

// Case-insensitive WORD-BOUNDARY tokens: matched with \b on both sides.
const BOUNDARY_TOKENS = ["fable", "opus", "luna", "auggie"]

// Never-valid stragglers pinned in tests/. "windsurf" is deliberately absent:
// tests/frontmatter.test.ts keeps an inline IDE-clutter skip list
// (.claude/.codex/.cursor/.windsurf/.opencode) that is functional directory
// filtering, so pinning windsurf there would force either an arbitrary
// single-entry drop or a behavior-changing rewrite of the skip list.
const STRAGGLER_TOKENS = ["orca", "gemini-cli"]

const SCANNED_EXTS = new Set([
  ".md",
  ".py",
  ".sh",
  ".yaml",
  ".yml",
  ".json",
  ".js",
  ".css",
])

const DOCS_EXCLUDED_DIRS = [
  "docs/brainstorms",
  "docs/plans",
  "docs/solutions",
  "docs/ideation",
]

const TESTS_EXCLUDED_DIRS = ["tests/fixtures", "tests/skill-eval-cell"]

// Files exempt from the tests/ straggler walk. This pin file exempts itself:
// spelling the pinned names in its token lists, test titles, and snapshots
// is the pin, and scanning itself would fail on its own definition.
const TESTS_EXCLUDED_FILES = ["tests/omp-fork-vocabulary.test.ts"]

const ROOT_EXCLUDED_MD = ["CHANGELOG.md"]

interface AllowEntry {
  tokens: string[]
  why: string
}

// The ONLY files that may carry scan tokens, and the only tokens each may
// carry. Every other scan token stays a failure even in these files.
const ALLOWLIST: Record<string, AllowEntry> = {
  "skills/ce-sweep/SKILL.md": {
    tokens: ["cursor"],
    why: "sweep-state cursor vocabulary (cursor order, cursor-advance)",
  },
  "skills/ce-sweep/references/interview.md": {
    tokens: ["cursor"],
    why: "sweep-state cursor vocabulary (legacy state import carries cursors)",
  },
  "skills/ce-sweep/references/run.md": {
    tokens: ["cursor"],
    why: "sweep-state cursor vocabulary (cursor-get, cursor-advance protocol)",
  },
  "skills/ce-sweep/references/state-schema.md": {
    tokens: ["cursor"],
    why: "sweep-state cursor vocabulary (per-source resume cursor schema)",
  },
  "skills/ce-sweep/references/sources/email.md": {
    tokens: ["cursor"],
    why: "source-API cursor vocabulary (received-date cursor semantics)",
  },
  "skills/ce-sweep/references/sources/github-issues.md": {
    tokens: ["cursor"],
    why: "source-API cursor vocabulary (updatedAt cursor semantics)",
  },
  "skills/ce-sweep/references/sources/slack.md": {
    tokens: ["cursor"],
    why: "source-API cursor vocabulary (message-ts cursor semantics)",
  },
  "docs/guides/ce-sweep.md": {
    tokens: ["cursor"],
    why: "sweep-state cursor vocabulary in the user guide",
  },
  "skills/ce-code-review/references/review-output-template.md": {
    tokens: ["cursor"],
    why: "pagination vocabulary in the review example (cursor/page contract)",
  },
  "skills/ce-code-review/references/subagent-template.md": {
    tokens: ["cursor"],
    why: "pagination vocabulary in the reviewer template (cursor-based option)",
  },
  "skills/ce-code-review/references/personas/performance-reviewer.md": {
    tokens: ["cursor"],
    why: "pagination vocabulary in the persona (limit/offset, cursor, streaming)",
  },
  "skills/ce-prototype/assets/annotate.js": {
    tokens: ["composer", "cursor"],
    why: "comment-composer UI names; CSS cursor property allowlist",
  },
  "skills/ce-prototype/assets/annotate.css": {
    tokens: ["cursor", "composer"],
    why: "CSS cursor property; comment-composer class names",
  },
  "CONCEPTS.md": {
    tokens: ["cursor", "claude"],
    why: "ingestion cursor definition; non-Claude retired-history glossary line",
  },
  "skills/ce-sweep/scripts/sweep-state.py": {
    tokens: ["cursor"],
    why: "sweep-state engine implementation (cursor get/advance commands)",
  },
  "skills/ce-optimize/references/agents/repo-research-analyst.md": {
    tokens: ["composer"],
    why: "language table names composer.json, the PHP manifest filename",
  },
  "skills/ce-plan/references/agents/repo-research-analyst.md": {
    tokens: ["composer"],
    why: "language table names composer.json, the PHP manifest filename",
  },
  "skills/ce-resolve-pr-feedback/scripts/get-pr-comments": {
    tokens: ["cursor"],
    why: "GraphQL pagination vocabulary (endCursor/pageInfo review threads)",
  },
  "skills/ce-resolve-pr-feedback/scripts/get-thread-for-comment": {
    tokens: ["cursor"],
    why: "GraphQL pagination vocabulary (endCursor/pageInfo review threads)",
  },
  "skills/ce-babysit-pr/scripts/pr-snapshot": {
    tokens: ["cursor"],
    why: "GraphQL pagination vocabulary (endCursor/pageInfo review threads)",
  },
}

function isDotPath(rel: string): boolean {
  return rel.split("/").some((seg) => seg.startsWith("."))
}

function walk(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(full))
    else out.push(full)
  }
  return out
}

function readText(file: string): string | null {
  let raw: string
  try {
    raw = readFileSync(file, "utf8")
  } catch {
    return null
  }
  if (raw.includes("\0")) return null
  return raw
}

function subPattern(tokens: string[]): RegExp | null {
  const rest = SUBSTRING_TOKENS.filter((t) => !tokens.includes(t))
  if (rest.length === 0) return null
  return new RegExp(`(${rest.join("|")})`, "gi")
}

function boundPattern(tokens: string[]): RegExp | null {
  const rest = BOUNDARY_TOKENS.filter((t) => !tokens.includes(t))
  if (rest.length === 0) return null
  return new RegExp(`\\b(${rest.join("|")})\\b`, "gi")
}

// Scan one file's text for scan tokens outside its exemption set. Each
// offender row names file, line, and matched token.
function scanText(rel: string, text: string, allowed: string[]): string[] {
  const sub = subPattern(allowed)
  const bound = boundPattern(allowed)
  const offenders: string[] = []
  text.split("\n").forEach((line, i) => {
    const found = new Set<string>()
    if (sub) {
      sub.lastIndex = 0
      for (const m of line.matchAll(sub)) found.add(m[1].toLowerCase())
    }
    if (bound) {
      bound.lastIndex = 0
      for (const m of line.matchAll(bound)) found.add(m[1].toLowerCase())
    }
    if (found.size > 0) {
      offenders.push(
        `${rel}:${i + 1} [${[...found].sort().join(", ")}] ${line.trim().slice(0, 160)}`,
      )
    }
  })
  return offenders
}

function tokenFires(text: string, token: string): boolean {
  if (BOUNDARY_TOKENS.includes(token)) {
    return new RegExp(`\\b${token}\\b`, "i").test(text)
  }
  return text.toLowerCase().includes(token.toLowerCase())
}

function collectShippedFiles(): string[] {
  const files: string[] = []
  for (const file of walk(path.join(REPO_ROOT, "skills"))) {
    if (isDotPath(path.relative(REPO_ROOT, file))) continue
    if (!SCANNED_EXTS.has(path.extname(file)) && path.extname(file) !== "") continue
    files.push(file)
  }
  for (const file of walk(path.join(REPO_ROOT, "docs"))) {
    const rel = path.relative(REPO_ROOT, file)
    if (isDotPath(rel)) continue
    if (DOCS_EXCLUDED_DIRS.some((d) => rel === d || rel.startsWith(`${d}/`))) {
      continue
    }
    files.push(file)
  }
  for (const entry of readdirSync(REPO_ROOT, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".md")) continue
    if (ROOT_EXCLUDED_MD.includes(entry.name)) continue
    if (isDotPath(entry.name)) continue
    files.push(path.join(REPO_ROOT, entry.name))
  }
  return files
}

describe("shipped surface carries zero non-OMP literals", () => {
  test("no scanned file carries a non-exempted token", () => {
    const offenders: string[] = []
    for (const file of collectShippedFiles()) {
      const rel = path.relative(REPO_ROOT, file)
      const text = readText(file)
      if (text === null) continue
      offenders.push(...scanText(rel, text, ALLOWLIST[rel]?.tokens ?? []))
    }
    expect(
      offenders,
      `Non-OMP literals must not ship (file:line [token]):\n${offenders.join("\n")}`,
    ).toEqual([])
  })
})

describe("domain-term allowlist is exact", () => {
  test("every allowlisted file exists and still carries a listed token", () => {
    const problems: string[] = []
    for (const [rel, entry] of Object.entries(ALLOWLIST)) {
      const file = path.join(REPO_ROOT, rel)
      if (!existsSync(file)) {
        problems.push(`${rel}: allowlisted file is missing (drop the entry)`)
        continue
      }
      const text = readText(file)
      if (text === null) {
        problems.push(`${rel}: allowlisted file is unreadable (drop the entry)`)
        continue
      }
      const fires = entry.tokens.filter((t) => tokenFires(text, t))
      if (fires.length === 0) {
        problems.push(
          `${rel}: clean entry, none of [${entry.tokens.join(", ")}] fires (drop the entry)`,
        )
      }
    }
    expect(
      problems,
      `Stale allowlist entries must be dropped:\n${problems.join("\n")}`,
    ).toEqual([])
  })
})

describe("tests carry no straggler harness names", () => {
  test("no word-boundary orca|gemini-cli outside fixtures and skill-eval-cell", () => {
    const straggler = new RegExp(`\\b(${STRAGGLER_TOKENS.join("|")})\\b`, "gi")
    const offenders: string[] = []
    for (const file of walk(path.join(REPO_ROOT, "tests"))) {
      const rel = path.relative(REPO_ROOT, file)
      if (TESTS_EXCLUDED_FILES.includes(rel)) continue
      if (isDotPath(rel)) continue
      if (
        TESTS_EXCLUDED_DIRS.some((d) => rel === d || rel.startsWith(`${d}/`))
      ) {
        continue
      }
      const text = readText(file)
      if (text === null) continue
      text.split("\n").forEach((line, i) => {
        straggler.lastIndex = 0
        const found = new Set<string>()
        for (const m of line.matchAll(straggler)) found.add(m[1].toLowerCase())
        if (found.size > 0) {
          offenders.push(
            `${rel}:${i + 1} [${[...found].sort().join(", ")}] ${line.trim().slice(0, 160)}`,
          )
        }
      })
    }
    expect(
      offenders,
      `Never-valid harness names must not linger in tests (file:line [token]):\n${offenders.join("\n")}`,
    ).toEqual([])
  })
})

describe("scan-case snapshots", () => {
  test("token lists and scope lists are immutable", () => {
    expect(SUBSTRING_TOKENS).toEqual([
      "codex",
      "claude",
      "grok",
      "cursor",
      "composer",
      "opencode",
      "haiku",
      "sonnet",
      "orca",
      "windsurf",
      "gemini-cli",
    ])
    expect(BOUNDARY_TOKENS).toEqual(["fable", "opus", "luna", "auggie"])
    expect(STRAGGLER_TOKENS).toEqual(["orca", "gemini-cli"])
    expect(DOCS_EXCLUDED_DIRS).toEqual([
      "docs/brainstorms",
      "docs/plans",
      "docs/solutions",
      "docs/ideation",
    ])
    expect(TESTS_EXCLUDED_DIRS).toEqual([
      "tests/fixtures",
      "tests/skill-eval-cell",
    ])
    expect(TESTS_EXCLUDED_FILES).toEqual(["tests/omp-fork-vocabulary.test.ts"])
    expect(ROOT_EXCLUDED_MD).toEqual(["CHANGELOG.md"])
  })
})
