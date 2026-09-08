import { spawnSync } from "node:child_process"
import { mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { describe, expect, test } from "bun:test"

const SKILLS_ROOT = path.join(process.cwd(), "skills")

const RUNTIME_FILES = [
  path.join(SKILLS_ROOT, "ce-babysit-pr/references/tick.md"),
  path.join(SKILLS_ROOT, "ce-brainstorm/references/dialogue.md"),
  path.join(SKILLS_ROOT, "ce-brainstorm/references/visual-probes.md"),
  path.join(SKILLS_ROOT, "ce-code-review/references/select-and-route.md"),
  path.join(SKILLS_ROOT, "ce-compound/references/research.md"),
  path.join(SKILLS_ROOT, "ce-explain/SKILL.md"),
  path.join(SKILLS_ROOT, "ce-handoff/references/create.md"),
  path.join(SKILLS_ROOT, "ce-handoff/references/resume.md"),
  path.join(SKILLS_ROOT, "ce-ideate/references/grounding.md"),
  path.join(SKILLS_ROOT, "ce-pov/references/grounding.md"),
]
const ROOT_ASSIGNMENT = 'SCRATCH_ROOT="/tmp/compound-engineering-$(id -u)"'

describe("owner-scoped scratch root", () => {
  test("runtime assets use the uid-scoped root, not the legacy shared root", () => {
    const offenders = RUNTIME_FILES
      .filter((file) => readFileSync(file, "utf8").includes("/tmp/compound-engineering/"))
      .map((file) => path.relative(process.cwd(), file))
    expect(offenders).toEqual([])
    expect(RUNTIME_FILES.some((file) => readFileSync(file, "utf8").includes(ROOT_ASSIGNMENT))).toBe(true)
  })

  test("per-run mktemp call sites do not use macOS forms that ignore TMPDIR", () => {
    const forbidden = [
      /\$\(\s*mktemp\s*\)/,
      /\$\(\s*mktemp\s+-d\s*\)/,
      /\$\(\s*mktemp(?:\s+-d)?\s+-t\b/,
    ]
    const offenders = RUNTIME_FILES.flatMap((file) =>
      readFileSync(file, "utf8")
        .split("\n")
        .flatMap((line, index) =>
          forbidden.some((pattern) => pattern.test(line))
            ? [`${path.relative(process.cwd(), file)}:${index + 1}`]
            : [],
        ),
    )
    expect(offenders).toEqual([])
  })

  test("every shell root assignment enforces private ownership without helper copies", () => {
    const helperCopies = RUNTIME_FILES.filter((file) => file.endsWith("scripts/scratch-root.py"))
    expect(helperCopies).toEqual([])

    for (const file of RUNTIME_FILES) {
      const content = readFileSync(file, "utf8")
      let offset = content.indexOf(ROOT_ASSIGNMENT)
      while (offset >= 0) {
        const block = content.slice(offset, offset + 700)
        expect(block).toMatch(/(?:\[ ! -L "\$SCRATCH_ROOT" \]|if \[ -L "\$SCRATCH_ROOT" \])/)
        // `(umask 077; mkdir -p …)`, not `install -d -m 700 …`: the latter fails outright on
        // native Windows Git Bash ("cannot change permissions"), which trips the guard's own
        // `|| exit 1` and makes every skill's scratch setup abort on a supported shell (#1285).
        // Same end state on POSIX — created 0700, then re-asserted by the chmod below — and it
        // is already the pattern every sub-directory in these blocks uses.
        expect(block).toContain('(umask 077; mkdir -p "$SCRATCH_ROOT")')
        expect(block).not.toContain("install -d")
        expect(block).toMatch(/\[ !? ?-O "\$SCRATCH_ROOT" \]/)
        expect(block).toContain('chmod 700 "$SCRATCH_ROOT"')
        offset = content.indexOf(ROOT_ASSIGNMENT, offset + ROOT_ASSIGNMENT.length)
      }

      const assignment = /\b(RUN_DIR|SCRATCH_DIR|MEDIA_DIR|STATE_DIR|HANDOFF_DIR|PROBE_DIR)="\$SCRATCH_ROOT\/[^"]+"/g
      for (const match of content.matchAll(assignment)) {
        const variable = match[1]
        const block = content.slice(match.index!, match.index! + 500)
        expect(block).toContain(`(umask 077; mkdir -p "$${variable}")`)
        expect(block).toContain(`chmod 700 "$${variable}"`)
      }
    }
  })

  test("the shell guard creates mode 0700 and rejects a symlink", () => {
    const script = String.raw`
root="$1/root"
umask 0777
mkdir -p "$root" || exit 8
chmod 755 "$root" || exit 8
[ ! -L "$root" ] && (umask 077; mkdir -p "$root") && [ ! -L "$root" ] && [ -O "$root" ] && chmod 700 "$root" || exit 9
run="$root/skill/run"
(umask 077; mkdir -p "$run") || exit 10
chmod 700 "$run" || exit 11
touch "$run/artifact" || exit 11
for dir in "$root" "$root/skill" "$run"; do
  mode=$(stat -c '%a' "$dir" 2>/dev/null)
  case "$mode" in ''|*[!0-7]*) mode=$(stat -f '%Lp' "$dir" 2>/dev/null) ;; esac
  [ "$mode" = 700 ] || exit 12
done
target="$1/target"
install -d -m 700 "$target"
link="$1/link"
ln -s "$target" "$link"
[ ! -L "$link" ] && (umask 077; mkdir -p "$link") && [ ! -L "$link" ] && [ -O "$link" ] && chmod 700 "$link" && exit 13
exit 0
`
    const parent = mkdtempSync(path.join(tmpdir(), "ce-scratch-contract-"))
    try {
      const result = spawnSync("sh", ["-c", script, "sh", parent], { encoding: "utf8" })
      expect(result.status, result.stderr).toBe(0)
    } finally {
      spawnSync("chmod", ["-R", "u+rwx", parent])
      rmSync(parent, { recursive: true, force: true })
    }
  })
})
