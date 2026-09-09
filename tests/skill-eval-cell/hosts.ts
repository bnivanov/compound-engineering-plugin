/**
 * Headless omp argv for skill eval cells.
 *
 * Plain print mode — no `--mode json`, whose envelope escapes the line-anchored
 * `FILES_READ:`/`ACTIONS:` trailer scans in grade.ts. Discovery isolation
 * (`--no-skills --no-rules --no-extensions`) keeps the installed plugin copy,
 * user-profile skills, and repo-local `.omp/` surfaces from serving the cell
 * instead of the extracted git-ref skill; no ephemeral `--profile`, which would
 * lack provider auth. The write arm pins `--approval-mode yolo` because the
 * cell spawns with stdin from /dev/null — any approval prompt burns the full
 * timeout. Invocation shape:
 *
 *   omp "@<prompt-file>" Follow the attached brief. -p --no-session \
 *     --no-skills --no-rules --no-extensions --add-dir <skill-dir> \
 *     --tools <read,grep,glob | read,grep,glob,edit,write,bash> \
 *     [--approval-mode yolo] --cwd <workspace-dir>
 *
 * Do not invent flags; pin the invocation that was measured to work.
 */
import path from "node:path"

/** Short positional prompt after the `@<prompt-file>` attachment. */
export const PROMPT_SUFFIX = "Follow the attached brief."

export const READ_ONLY_TOOLS = "read,grep,glob"
export const WRITE_TOOLS = "read,grep,glob,edit,write,bash"

export type CellPlan = {
  argv: string[]
  env: NodeJS.ProcessEnv
  notes: string[]
}

export function resolveOnPath(name: string): string | undefined {
  return Bun.which(name) ?? undefined
}

export function cellEnv(base: NodeJS.ProcessEnv = process.env): NodeJS.ProcessEnv {
  const env = { ...base }
  // Trailers are graded by line scan; forced color would corrupt the grep.
  delete env.CLICOLOR_FORCE
  delete env.GH_FORCE_TTY
  env.NO_COLOR = "1"
  return env
}

export function planCell(opts: {
  cwd: string
  promptFile: string
  skillDir: string
  readOnly?: boolean
}): CellPlan {
  const env = cellEnv()
  const notes: string[] = [
    "plain print mode: no --mode json, so the trailers stay greppable lines in stdout",
    "stdin is /dev/null: any approval prompt would burn the full timeout",
    `discovery isolation: --no-skills --no-rules --no-extensions keep installed/user/repo-local skill surfaces out of the cell`,
  ]
  const argv = [
    "omp",
    `@${opts.promptFile}`,
    PROMPT_SUFFIX,
    "-p",
    "--no-session",
    "--no-skills",
    "--no-rules",
    "--no-extensions",
    "--add-dir",
    opts.skillDir,
    "--tools",
    opts.readOnly ? READ_ONLY_TOOLS : WRITE_TOOLS,
  ]
  if (opts.readOnly) {
    // Toolset-bounded: the default always-ask approval mode auto-approves read tools.
    notes.push(`read-only: --tools ${READ_ONLY_TOOLS}, approval-free`)
  } else {
    argv.push("--approval-mode", "yolo")
    notes.push(`write: --tools ${WRITE_TOOLS} plus --approval-mode yolo`)
  }
  argv.push("--cwd", opts.cwd)
  return { argv, env, notes }
}

export const TRAILER_NAMES = {
  files_read: "FILES_READ",
  actions: "ACTIONS",
  delegates: "DELEGATES_DISPATCHED",
} as const

export function wrapPrompt(opts: { skillDir: string; workspace: string; task: string }): string {
  return [
    `Read the skill at ${path.join(opts.skillDir, "SKILL.md")} first.`,
    `Resolve bundled references and scripts from that directory.`,
    `Do not read or use an installed plugin copy of this skill (not a plugin cache, user-profile skills, or the project's .omp/ surfaces).`,
    `The project workspace is ${opts.workspace}. Stay inside it.`,
    ``,
    `Task:`,
    opts.task,
    ``,
    `When finished, end with these trailers on their own lines:`,
    `${TRAILER_NAMES.files_read}: <comma-separated paths you read>`,
    `${TRAILER_NAMES.actions}: <comma-separated mutations you performed, or none>`,
    `${TRAILER_NAMES.delegates}: <none or names>`,
  ].join("\n")
}
