import { mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { spawnSync } from "node:child_process"
import { readFile } from "fs/promises"
import path from "path"
import { describe, expect, test } from "bun:test"

async function readRepoFile(relativePath: string): Promise<string> {
  return readFile(path.join(process.cwd(), relativePath), "utf8")
}

const STRICT_SCHEMA_KEYWORDS = new Set([
  "$comment",
  "$id",
  "$ref",
  "$schema",
  "additionalItems",
  "additionalProperties",
  "allOf",
  "anyOf",
  "const",
  "contains",
  "contentEncoding",
  "contentMediaType",
  "default",
  "definitions",
  "dependencies",
  "description",
  "else",
  "enum",
  "examples",
  "exclusiveMaximum",
  "exclusiveMinimum",
  "format",
  "if",
  "items",
  "maxItems",
  "maxLength",
  "maxProperties",
  "maximum",
  "minItems",
  "minLength",
  "minProperties",
  "minimum",
  "multipleOf",
  "not",
  "oneOf",
  "pattern",
  "patternProperties",
  "properties",
  "propertyNames",
  "readOnly",
  "required",
  "then",
  "title",
  "type",
  "uniqueItems",
  "writeOnly",
])

function extensionSchemaKeywords(schema: unknown, location = "$."): string[] {
  if (!schema || typeof schema !== "object" || Array.isArray(schema)) return []

  const record = schema as Record<string, unknown>
  const extensions = Object.keys(record)
    .filter((key) => !STRICT_SCHEMA_KEYWORDS.has(key))
    .map((key) => `${location}${key}`)

  for (const container of ["properties", "patternProperties", "definitions"] as const) {
    const children = record[container]
    if (children && typeof children === "object" && !Array.isArray(children)) {
      for (const [name, child] of Object.entries(children)) {
        extensions.push(...extensionSchemaKeywords(child, `${location}${container}.${name}.`))
      }
    }
  }

  for (const keyword of [
    "additionalItems",
    "additionalProperties",
    "contains",
    "else",
    "if",
    "not",
    "propertyNames",
    "then",
  ] as const) {
    if (typeof record[keyword] === "object") {
      extensions.push(...extensionSchemaKeywords(record[keyword], `${location}${keyword}.`))
    }
  }

  const items = record.items
  if (Array.isArray(items)) {
    items.forEach((item, index) => {
      extensions.push(...extensionSchemaKeywords(item, `${location}items[${index}].`))
    })
  } else if (items) {
    extensions.push(...extensionSchemaKeywords(items, `${location}items.`))
  }

  for (const keyword of ["allOf", "anyOf", "oneOf"] as const) {
    const alternatives = record[keyword]
    if (Array.isArray(alternatives)) {
      alternatives.forEach((alternative, index) => {
        extensions.push(...extensionSchemaKeywords(alternative, `${location}${keyword}[${index}].`))
      })
    }
  }

  const dependencies = record.dependencies
  if (dependencies && typeof dependencies === "object" && !Array.isArray(dependencies)) {
    for (const [name, dependency] of Object.entries(dependencies)) {
      if (!Array.isArray(dependency)) {
        extensions.push(...extensionSchemaKeywords(dependency, `${location}dependencies.${name}.`))
      }
    }
  }

  return extensions
}

function personaPromptPath(personaName: string): string {
  return `skills/ce-code-review/references/personas/${personaName}.md`
}

/**
 * The runtime contract is spread across the always-loaded body and the references each spine
 * step names, so an invariant that merely has to hold *somewhere* at runtime is asserted
 * against this corpus. Rules that must control behavior from the context window without a
 * reference read are pinned against the body alone, in "always-loaded body pins" below.
 */
async function readCodeReviewRuntimeContract(): Promise<string> {
  const parts = await Promise.all([
    readRepoFile("skills/ce-code-review/SKILL.md"),
    readRepoFile("skills/ce-code-review/references/modes-and-output.md"),
    readRepoFile("skills/ce-code-review/references/scope.md"),
    readRepoFile("skills/ce-code-review/references/intent-and-plan.md"),
    readRepoFile("skills/ce-code-review/references/select-and-route.md"),
    readRepoFile("skills/ce-code-review/references/persona-catalog.md"),
    readRepoFile("skills/ce-code-review/references/dispatch-reviewers.md"),
    readRepoFile("skills/ce-code-review/references/action-class-rubric.md"),
    readRepoFile("skills/ce-code-review/references/finish-review.md"),
  ])
  return parts.join("\n")
}

/**
 * Rules that must control behavior from the context window, with no reference read. Everything
 * else this skill states was relocated into the step references and is asserted against
 * readCodeReviewRuntimeContract() instead (#1412 restructure). Do not convert a pin here into a
 * corpus grep: a rule the body stops stating is a rule that stops firing before the read that
 * would have supplied it.
 */
describe("ce-code-review always-loaded body pins", () => {
  test("the body stays inside Codex's 8000-byte Agent Plugins prompt bound", async () => {
    const body = await readRepoFile("skills/ce-code-review/SKILL.md")
    const lf = body.replace(/\r\n/g, "\n")
    const crlfBytes = Buffer.byteLength(lf, "utf8") + (lf.match(/\n/g)?.length ?? 0)
    expect(crlfBytes).toBeLessThanOrEqual(8_000)
  })

  test("no reference is @-inlined back into the always-loaded body", async () => {
    const body = await readRepoFile("skills/ce-code-review/SKILL.md")
    // Every reference here is late-sequence, so an `@`-include would charge its full weight to
    // every early-stage turn and every subagent dispatch. The rule is mechanical, so it is
    // asserted rather than carried as always-loaded prose.
    expect(body).not.toMatch(/@\.?\/?references\//)
  })

  test("the mutation boundary fires without a reference read", async () => {
    const body = await readRepoFile("skills/ce-code-review/SKILL.md")

    // skills/ce-code-review/SKILL.md:34 (report-only by default)
    expect(body).toMatch(/Never push, open PRs, or file tickets/i)
    // skills/ce-code-review/SKILL.md:36 (explicit mutations only)
    expect(body).toMatch(/Never run `gh pr checkout`/i)
    expect(body).toMatch(/never mutates the tree/i)
    expect(body).toMatch(/Entering the apply stage requires `apply:local`/i)
    // skills/ce-code-review/SKILL.md:35 (no blocking prompts via host ask tool)
    expect(body).toMatch(/Never use the `ask` tool/i)
  })

  test("the spine keeps its order and names the reference each step requires", async () => {
    const body = await readRepoFile("skills/ce-code-review/SKILL.md")
    const spine = body.split("## Execution spine")[1].split("\n## ")[0]
    const order = [
      "references/modes-and-output.md",
      "references/scope.md",
      "references/intent-and-plan.md",
      "references/persona-catalog.md",
      "references/select-and-route.md",
      "references/dispatch-reviewers.md",
      "references/finish-review.md",
    ]
    let cursor = -1
    for (const reference of order) {
      const at = spine.indexOf(reference)
      expect(at, `${reference} missing from the execution spine`).toBeGreaterThan(cursor)
      cursor = at
    }
  })

  test("the exclusive adversarial route is decided from the window", async () => {
    const body = await readRepoFile("skills/ce-code-review/SKILL.md")

    expect(body).toMatch(/before any local persona dispatch/i)
    expect(body).toContain("Invoking this skill is itself the authorization for that pass")
    expect(body).toContain("A started separate read replaces the local adversarial persona")
    const stage3d = body.indexOf("Stage 3d")
    const stage4 = body.indexOf("Stage 4.", stage3d)
    expect(stage3d).toBeGreaterThan(-1)
    expect(stage4).toBeGreaterThan(stage3d)
  })

  test("synthesis provenance fires from the window; the peer tuple is pinned where it is read", async () => {
    const body = await readRepoFile("skills/ce-code-review/SKILL.md")
    expect(body).toMatch(/Never synthesize directly from raw reviewer artifacts/i)
    expect(body).toMatch(/Never claim more about the peer than its receipt attests/i)

    // The keyed peer fields are read off the peer artifact, so they belong to the reference the
    // routing step loads before any peer starts — not to the always-loaded body.
    const peer = await readRepoFile("skills/ce-code-review/references/cross-model-review.md")
    for (const field of [
      "model_requested",
      "model_actual",
      "effort_requested",
      "effort_actual",
      "receipt_supported",
      "independence_verified",
    ]) {
      expect(peer).toContain(`\`${field}\``)
    }
  })
})

describe("ce-code-review contract", () => {
  test("documents explicit modes and orchestration boundaries", async () => {
    const content = await readCodeReviewRuntimeContract()

    expect(content).toContain("## Argument Parsing")
    expect(content).toContain("mode:autofix` is no longer supported")
    expect(content).toContain("mode:report-only")
    expect(content).toContain("mode:agent")
    expect(content).toContain("apply:local")
    expect(content).toContain("mode:headless")
    expect(content).toMatch(/mode:non-interactive` is \*\*not\*\* an alias for `mode:agent`/i)
    expect(content).toContain('SCRATCH_ROOT="/tmp/compound-engineering-$(id -u)"')
    expect(content).toContain('RUN_DIR="$SCRATCH_ROOT/ce-code-review/$RUN_ID"')
    expect(content).toMatch(/Never push, open PRs, or file tickets/i)
    expect(content).toContain("run artifact")
    expect(content).toMatch(/check out the PR branch/i)
    expect(content).toMatch(/Never run `gh pr checkout`/i)
    expect(content).not.toContain("Which severities should I fix?")
  })

  test("keeps plan requirements completeness compatible with current and legacy unit formats", async () => {
    const content = await readCodeReviewRuntimeContract()

    expect(content).toContain("current numeric subsections")
    expect(content).toContain("`### U1.`")
    expect(content).toContain("`### Unit 1:`")
    expect(content).toContain("legacy bullet or checkbox unit entries")
    expect(content).toContain("unaddressed requirements or implementation units")
  })

  test("documents agent mode contract for programmatic callers", async () => {
    const content = await readCodeReviewRuntimeContract()

    // mode:agent is report-only (skips Stage 5c apply); same reviewer pipeline as default
    expect(content).toContain("## Operating principles")
    expect(content).toMatch(/Default and `mode:agent` are \*\*report-only\*\*/i)
    expect(content).toMatch(/does not change reviewer selection, merge logic, or scope rules/i)

    // No blocking prompts (skills/ce-code-review/SKILL.md:35)
    expect(content).toMatch(/Never use the `ask` tool/i)

    // JSON output format
    expect(content).toContain("### JSON output format")
    expect(content).toContain('"status": "complete"')
    expect(content).toContain("review.json")

    // Report-only is the default; mutation requires separate, explicit authority.
    expect(content).toMatch(/never mutates the tree/i)
    expect(content).toMatch(/default.{0,40}report-only/i)
    expect(content).toMatch(/explicit (user )?request.{0,40}(apply|fix)|explicit.{0,40}(apply|fix).{0,40}request/i)

    // Never checkout — explicit mutations only
    expect(content).toMatch(/Never run `gh pr checkout`/i)
    expect(content).toMatch(/Do \*\*not\*\* check out/i)

    // Conflicting arguments
    expect(content).toContain("**Conflicting arguments:**")

    // Structured failure JSON
    expect(content).toContain('{"status":"failed","reason":"..."}')

    // Deprecated alias preserved
    expect(content).toContain("**Deprecated alias**")
  })

  test("documents policy-driven routing and actionable handoff", async () => {
    const content = await readCodeReviewRuntimeContract()

    // Action Routing: autofix_class is signal only; apply authority is separate.
    expect(content).toContain("## Action Routing")
    expect(content).toMatch(/does not grant apply permission/i)
    expect(content).toContain("references/action-class-rubric.md")

    // No post-review triage — report is the complete handoff
    expect(content).toContain("Do not run post-review triage")
    expect(content).not.toContain("references/walkthrough.md")
    expect(content).not.toContain("references/bulk-preview.md")
    expect(content).not.toContain("references/tracker-defer.md")
    expect(content).not.toMatch(/Review each finding one by one/)
    expect(content).not.toMatch(/File a \[TRACKER\] ticket per finding/)

    expect(content).not.toContain("What should I do with the remaining findings?")
    expect(content).not.toContain("What should I do?")

    expect(content).toContain("Actionable Findings")
    expect(content).toContain("Actionable findings: none.")

    expect(content).not.toContain("ce-todo-create")
    expect(content).not.toContain("create durable todo files")
    expect(content).not.toMatch(/harness task primitive|task-tracking primitive/)

    // Subagent template carries the why_it_matters framing guidance that replaces the
    // rejected synthesis-time rewrite pass. Assert presence of the observable-behavior
    // rule and the required-field reminder without pinning exact prose.
    const subagentTemplate = await readRepoFile(
      "skills/ce-code-review/references/subagent-template.md",
    )
    expect(subagentTemplate).toMatch(/observable behavior/i)
    expect(subagentTemplate).toMatch(/required/i)

    expect(content).toContain("Do not offer push/PR/create-branch next steps from this skill.")
  })

  test("keeps findings schema and downstream docs aligned", async () => {
    const rawSchema = await readRepoFile(
      "skills/ce-code-review/references/findings-schema.json",
    )
    const schema = JSON.parse(rawSchema) as {
      properties: {
        findings: {
          items: {
            properties: {
              autofix_class: { enum: string[] }
              owner: { enum: string[] }
              requires_verification: { type: string }
              confidence: { type: string; enum: number[] }
            }
            required: string[]
          }
        }
      }
    }

    expect(schema.properties.findings.items.required).toEqual(
      expect.arrayContaining(["autofix_class", "owner", "requires_verification"]),
    )
    expect(schema.properties.findings.items.properties.autofix_class.enum).toEqual([
      "gated_auto",
      "manual",
      "advisory",
    ])
    expect(schema.properties.findings.items.properties.owner.enum).toEqual([
      "downstream-resolver",
      "human",
      "release",
    ])
    expect(schema.properties.findings.items.properties.requires_verification.type).toBe("boolean")

    // Anchored confidence: integer enum, no floats
    expect(schema.properties.findings.items.properties.confidence.type).toBe("integer")
    expect(schema.properties.findings.items.properties.confidence.enum).toEqual([0, 25, 50, 75, 100])

  })

  test("hydrates compact reviewer returns before final output", async () => {
    const finish = await readRepoFile(
      "skills/ce-code-review/references/finish-review.md",
    )

    expect(finish).toMatch(/build a source-detail map keyed by reviewer plus the helper fingerprint/i)
    expect(finish).toMatch(/semantic duplicate[\s\S]{0,180}original source-map keys/i)
    expect(finish).toMatch(/Hydrate every retained primary and pre-existing finding/i)
    expect(finish).toMatch(/non-empty `why_it_matters` string and non-empty `evidence` array/i)
    expect(finish).toMatch(/never emit a partial finding/i)
  })

  test("keeps extension keywords out of draft-07 cross-model schemas", async () => {
    for (const schemaPath of [
      "skills/ce-code-review/references/findings-schema.json",
      "skills/ce-doc-review/references/findings-schema.json",
      "skills/ce-pov/references/pov-schema.json",
    ]) {
      const schema = JSON.parse(await readRepoFile(schemaPath))
      expect(schema.$schema).toBe("http://json-schema.org/draft-07/schema#")
      expect(extensionSchemaKeywords(schema)).toEqual([])
    }
  })

  test("subagent template carries verbatim 5-anchor rubric and lint-ignore suppression", async () => {
    const template = await readRepoFile(
      "skills/ce-code-review/references/subagent-template.md",
    )

    // Anchored rubric: each anchor named with behavioral criterion
    expect(template).toMatch(/`0`.*Not confident/)
    expect(template).toMatch(/`25`.*Somewhat confident/)
    expect(template).toMatch(/`50`.*Moderately confident/)
    expect(template).toMatch(/`75`.*Highly confident/)
    expect(template).toMatch(/`100`.*Absolutely certain/)

    // Schema conformance hard constraints reject floats
    expect(template).toContain("`0`, `25`, `50`, `75`, or `100`")
    expect(template).toMatch(/0\.85.*validation failure/i)

    // Lint-ignore rule in false-positive catalog
    expect(template).toMatch(/lint.ignore|lint disable|eslint-disable/i)
    expect(template).toMatch(/suppress unless the suppression itself violates/i)

    // Advisory routing rule preserved
    expect(template).toMatch(/Advisory observations.*route to advisory/i)

    // Personas never produce anchors 0 or 25 (suppress silently)
    expect(template).toMatch(/personas never produce/i)
  })

  test("subagent template and schema require load-bearing line provenance in evidence", async () => {
    const template = await readRepoFile(
      "skills/ce-code-review/references/subagent-template.md",
    )
    const schemaRaw = await readRepoFile(
      "skills/ce-code-review/references/findings-schema.json",
    )
    const schema = JSON.parse(schemaRaw)
    const evidenceDescription = schema.properties.findings.items.properties.evidence.description as string

    expect(template).toMatch(/Load-bearing line provenance/i)
    expect(template).toMatch(/provenance: <shortsha>/i)
    expect(template).toMatch(/omit provenance when the finding is fully justified from the diff/i)
    expect(template).toMatch(/must not replace the quote-the-line/i)
    expect(template).toMatch(/Do not dump full-file blame/i)
    expect(template).toMatch(/pr-remote.*branch-remote.*reviewed head ref/is)

    expect(evidenceDescription).toMatch(/additional concise provenance line/i)
    expect(evidenceDescription).toMatch(/never dump full-file blame/i)
    expect(evidenceDescription).toMatch(/omit when the finding is justified from the diff alone/i)
  })

  test("subagent template points to action-class rubric without safe_auto", async () => {
    const template = await readRepoFile(
      "skills/ce-code-review/references/subagent-template.md",
    )

    expect(template).toContain("references/action-class-rubric.md")
    expect(template).not.toContain("safe_auto")
    expect(template).not.toContain("review-fixer")
    expect(template).toMatch(/gated_auto.*manual.*advisory/s)
  })

  test("action-class rubric defines caller routing without safe_auto", async () => {
    const rubric = await readRepoFile(
      "skills/ce-code-review/references/action-class-rubric.md",
    )

    expect(rubric).toContain("gated_auto")
    expect(rubric).toContain("manual")
    expect(rubric).toContain("advisory")
    expect(rubric).toMatch(/Do \*\*not\*\* emit `safe_auto`/)
    expect(rubric).toMatch(/Do not use `review-fixer`/i)
  })

  test("Stage 4 dispatches reviewers on the session-model and task tiers", async () => {
    const content = await readRepoFile(
      "skills/ce-code-review/references/dispatch-reviewers.md",
    )

    // skills/ce-code-review/references/dispatch-reviewers.md:26 (top-tier inherits session model)
    expect(content).toMatch(/Three reviewers inherit the session model with no override/i)
    expect(content).toMatch(/correctness-reviewer.*security-reviewer.*adversarial-reviewer/s)
    // skills/ce-code-review/references/dispatch-reviewers.md:28 (everything else is task tier)
    expect(content).toMatch(/All other persona subagents.*dispatch as `task` agents/i)
    // skills/ce-code-review/references/dispatch-reviewers.md:46-47 (reviewer vs task tier pins)
    expect(content).toMatch(/Reviewer tier.*`correctness-reviewer`, `security-reviewer`, and `adversarial-reviewer` only/s)
    expect(content).toMatch(/Task tier.*every other persona/s)
    // skills/ce-code-review/references/dispatch-reviewers.md:47 (OMP agent name is model selection)
    expect(content).toMatch(/On OMP the agent name is the model selection/i)
    // skills/ce-code-review/references/dispatch-reviewers.md:51 (foreground batch, cap-sized, serial floor)
    expect(content).toMatch(/foreground concurrent batch/i)
    expect(content).toMatch(/never hard-code a number/i)
    expect(content).toMatch(/degrades to serial/i)
    expect(content).not.toMatch(/exactly one reviewer|one reviewer at a time|one at a time/i)
    // skills/ce-code-review/references/dispatch-reviewers.md:57 (detached-delegate ban)
    expect(content).toMatch(/detached/i)
  })

  test("Stage 4 concurrent-batch dispatch preserves cap-safety and determinism", async () => {
    const content = await readRepoFile(
      "skills/ce-code-review/references/dispatch-reviewers.md",
    )

    // Batch size is learned from the host, never a fixed constant, so it can't overrun a cap.
    expect(content).toMatch(/never hard-code a number/i)
    expect(content).toMatch(/active-agent cap/i)

    // A requested batch larger than the host cap clamps and drops no reviewer (restores #1031's
    // backpressure guarantee per batch slot instead of the strict pool-of-one).
    expect(content).toMatch(/dropping no reviewer/i)
    expect(content).toMatch(/retried in a later batch/i)

    // Determinism does not depend on completion order: findings are order-independent and
    // stable numbers are assigned downstream after the post-merge sort.
    expect(content).toMatch(/completion order cannot change any finding/i)
    expect(content).toMatch(/after the post-merge sort/i)

    // Anti-poll invariant still holds: no sleep/status/wakeup loops to await reviewers.
    expect(content).toMatch(/scheduled wakeups/i)
    expect(content).toMatch(/still waiting/i)
  })

  test("Stage 4 isolates tree-mutating testing reviewers from the shared checkout (#1566)", async () => {
    const dispatch = await readRepoFile(
      "skills/ce-code-review/references/dispatch-reviewers.md",
    )
    expect(dispatch).toContain('isolation: "worktree"')
    expect(dispatch).toContain("HEAD equals the reviewed commit")
    expect(dispatch).toContain("Mutation testing on the shared tree is forbidden")
    expect(dispatch).toContain("faithful snapshot of the reviewed tree")
    expect(dispatch).toContain("local-aligned")
    const testing = await readRepoFile(
      "skills/ce-code-review/references/personas/testing-reviewer.md",
    )
    expect(testing).toContain("Never mutate the shared checkout")
    expect(testing).toContain("faithful snapshot of the reviewed tree")
  })

  test("Stage 4 collects one foreground batch and fails reviewers on terminal error", async () => {
    const skill = await readRepoFile("skills/ce-code-review/SKILL.md")
    const content = await readRepoFile(
      "skills/ce-code-review/references/dispatch-reviewers.md",
    )

    // skills/ce-code-review/SKILL.md:29 (one foreground batch, terminal collection)
    expect(skill).toContain("one foreground concurrent batch")
    expect(skill).toMatch(/classify a terminal tool error or malformed output as a failed reviewer/i)
    expect(skill).toContain("keep launch receipts uncollected")
    expect(skill).toContain("blocking collection capability for asynchronous receipts")
    expect(skill).toMatch(/do not synthesize until every successful launch is collected/i)
    // skills/ce-code-review/references/dispatch-reviewers.md:51-53 (same collection contract at point of action)
    expect(content).toMatch(/foreground concurrent batch/i)
    expect(content).toMatch(/classify a terminal tool error or malformed output as a failed reviewer/i)
    expect(content).toMatch(/launch receipt is uncollected/i)
    expect(content).toMatch(/blocking collection capability until every successful launch reaches a terminal outcome/i)
  })

  test("Stage 5 synthesis uses anchor gate and one-anchor promotion", async () => {
    const content = await readRepoFile(
      "skills/ce-code-review/references/finish-review.md",
    )
    const mechanics = await readRepoFile(
      "skills/ce-code-review/scripts/findings-mechanics.py",
    )

    // Deterministic mechanics live in the helper, while the skill keeps the route inline.
    expect(content).toContain("scripts/findings-mechanics.py")
    expect(content).toMatch(/^SKILL_DIR="<absolute path[^\n]+>";$/m)
    expect(mechanics).toContain("CONFIDENCES = (0, 25, 50, 75, 100)")

    // Confidence gate at anchor 75 with P0 exception at 50
    expect(mechanics).toContain('finding["confidence"] < 75')
    expect(mechanics).toContain('finding["severity"] != "P0"')

    // One-anchor promotion replaces +0.10 boost
    expect(mechanics).toContain("{50: 75, 75: 100, 100: 100}")
    expect(content).not.toContain("boost the merged confidence by 0.10")

    // Stable numbering is a helper responsibility.
    expect(mechanics).toMatch(/enumerate\(survivors, 1\)/)
  })

  test("Stage 5b validation pass dispatches conditionally and bounds parallelism", async () => {
    const content = await readRepoFile(
      "skills/ce-code-review/references/finish-review.md",
    )
    const validatorTemplate = await readRepoFile(
      "skills/ce-code-review/references/validator-batch-template.md",
    )

    // Stage 5b exists between Stage 5 and Stage 6
    expect(content).toContain("### Stage 5b: Validation pass")

    // Cross-model corroboration is the only validator shortcut.
    expect(content).toMatch(/ordinary reviewer plus an `adversarial-<provider>` reviewer/i)
    expect(content).toMatch(/Same-model corroboration never licenses this shortcut/i)

    // Remaining findings use one bounded foreground batch.
    expect(content).toMatch(/deterministic validator batch/i)
    expect(content).toMatch(/Eight findings is the normal cap/i)
    expect(content).toMatch(/expand that same batch.*include every surviving P0\/P1/i)
    expect(content).toMatch(/never split the work into another batch/i)
    expect(content).toMatch(/Run the validator batch foreground/i)
    expect(content).toMatch(/Cost, elapsed time, confidence.*never licenses an additional skip/i)

    // Foreground is a request, not proof that the host returned a verdict in-band.
    expect(content).toMatch(/compact.*verdict.*in[- ]band/i)
    expect(content).toMatch(/launch receipt.*not.*validator return/i)
    expect(content).toMatch(/launch receipt.*uncollected/i)
    expect(content).toMatch(/blocking collection/i)
    expect(content).toMatch(/terminal outcome/i)
    expect(content).toMatch(/malformed output.*validator infrastructure failure/i)
    expect(content).toMatch(/validator infrastructure failure/i)
    expect(content).not.toMatch(/A foreground Agent call is the wait/i)

    // Validator template exists and is read-only
    expect(validatorTemplate).toMatch(/validator is independent|independent validation gate/i)
    expect(validatorTemplate).toMatch(/Eight findings is the normal cap/i)
    expect(validatorTemplate).toMatch(/expand that same batch.*every surviving P0\/P1/i)
    expect(validatorTemplate).toMatch(/read-only tools|Do not edit, commit, push, or mutate files/i)
    expect(validatorTemplate).toContain('"validated": true | false')
    expect(validatorTemplate).toMatch(/predates and is unaffected by this diff/i)
    expect(validatorTemplate).toMatch(/surrounding code handles it/i)
    expect(validatorTemplate).toMatch(/one verdict for every input # exactly once/i)
    expect(validatorTemplate).toMatch(/Do not invent new findings/i)
  })

  test("Stage 5c requires explicit local-apply authority and mode:agent is always report-only", async () => {
    const content = await readCodeReviewRuntimeContract()
    const template = await readRepoFile(
      "skills/ce-code-review/references/review-output-template.md",
    )

    // Act stage is separately authorized; bare and mode:agent invocations stay report-only.
    expect(content).toContain("### Stage 5c: Act on findings")
    expect(content).toMatch(/Skip unless local apply was explicitly authorized/i)
    expect(content).toMatch(/bare `ce-code-review` invocation.{0,80}does not apply/i)
    expect(content).toMatch(/`mode:agent` does not apply fixes/i)

    // Bias to act, push back if wrong, no deny-list
    expect(content).toMatch(/bias to act/i)
    expect(content).toMatch(/Push back.*do not apply.*reviewer is wrong/i)
    expect(content).toMatch(/There is no deny-list/i)

    // Scope invariant + verify-then-keep + commit-on-clean-tree, never push
    expect(content).toMatch(/Apply only when the working tree \*?is\*? what was reviewed/i)
    expect(content).toMatch(/revert that fix and report it/i)
    expect(content).toMatch(/Commit when the pre-review tree was clean/i)
    expect(content).toMatch(/Never push, open a PR, or file tickets/i)

    // Applied reporting (skill + template)
    expect(content).toMatch(/Applied \(explicit local apply only\)/i)
    expect(template).toContain("### Applied")

    // Apply is an authority token, not an output mode.
    expect(content).toMatch(/`apply:local` is authority, not an output mode/i)
  })

  test("right-sizes generic reviewers with explicit domain gates", async () => {
    const content = await readCodeReviewRuntimeContract()
    const catalog = await readRepoFile(
      "skills/ce-code-review/references/persona-catalog.md",
    )
    const docs = await readRepoFile("docs/guides/ce-code-review.md")

    expect(content).toContain("**Core (always-on):** `correctness-reviewer`.")
    expect(content).toMatch(/project-standards-reviewer.*only when Stage 3b finds/i)
    expect(content).toMatch(/testing-reviewer.*test files|test files.*testing-reviewer/i)
    expect(content).toMatch(/testing-reviewer[\s\S]*meaningful runtime behavior without corresponding test work/i)
    expect(content).toMatch(/Production-file presence alone[\s\S]*non-behavioral edits do not select/i)
    expect(content).toMatch(/maintainability-reviewer.*(large|structural|refactor)/i)
    expect(content).toMatch(/agent-native-reviewer.*agent-facing/i)
    expect(content).toMatch(/learnings-researcher.*<root>\/solutions/i)

    expect(catalog).toContain("## Core and standards gate")
    expect(catalog).toContain("## Generic conditional")
    expect(catalog).toMatch(/testing.*test files/i)
    expect(catalog).toMatch(/testing[\s\S]*meaningful runtime behavior changed without corresponding test work/i)
    expect(catalog).toMatch(/production-file presence alone is insufficient/i)
    expect(catalog).toMatch(/agent-native.*agent-facing/i)

    expect(docs).toMatch(/testing for changed tests\/harnesses or meaningful runtime behavior with no corresponding test work/i)
    expect(docs).toMatch(/Production-file presence alone and non-behavioral edits do not select testing/i)
  })

  test("keeps the fast pass visible only for urgent preliminary findings", async () => {
    const content = await readRepoFile(
      "skills/ce-code-review/references/dispatch-reviewers.md",
    )

    expect(content).toMatch(/fast pass.{0,120}P0\/P1/i)
    expect(content).toMatch(/P2\/P3.{0,80}final report/i)
    expect(content).toMatch(/(never|do \*\*not\*\*) assign stable `#`/i)
    expect(content).toMatch(/immediately before the first foreground reviewer dispatch/i)
    expect(content).not.toMatch(/While local reviewers run, do the inline fast pass/i)
  })

  test("allows project standards inside the lite roster without disabling it", async () => {
    const content = await readCodeReviewRuntimeContract()

    expect(content).toMatch(
      /Stage 3b standards discovery completed successfully \(with applicable paths or a confirmed empty result\)/i,
    )
    expect(content).toMatch(
      /No conditional persona other than `project-standards` was selected in Stage 3/i,
    )
    expect(content).toMatch(
      /Lite roster:[\s\S]{0,200}`project-standards-reviewer` only when Stage 3b found applicable paths/i,
    )
  })

  test("findings presentation is action-shaped and enforces hard constraints, mirrors the template", async () => {
    const content = await readRepoFile(
      "skills/ce-code-review/references/finish-review.md",
    )
    const template = await readRepoFile(
      "skills/ce-code-review/references/review-output-template.md",
    )

    // Render-time load of the canonical skeleton (not just "see the template")
    expect(content).toContain("load `references/review-output-template.md` and mirror")
    expect(template).toContain("canonical skeleton")

    // Per-finding clarity: the four things an actor needs (what/why/response/confidence)
    expect(content).toMatch(/what response it needs/i)
    expect(content).toMatch(/why it matters/i)

    // Group by unit of work/decision: decisions a human must make vs mechanical work
    expect(content).toMatch(/decision/i)
    expect(content).toMatch(/mechanical/i)

    // Economy is about expression, not coverage: no file pasting / diff restating
    expect(content).toMatch(/do not paste file contents/i)

    // Long output: the closing (verdict + actionable list) stands alone
    expect(content).toMatch(/stand alone without scrolling/i)
    expect(content).toMatch(/Actionable list are present, last, and self-sufficient/i)

    // Shape serves the finding type, but consistent within a section
    expect(content).toMatch(/consistent within (a |the )?section/i)

    // Hard constraint: ASCII-safe, no box-drawing (skill + template)
    expect(content).toMatch(/box-drawing/i)
    expect(template).toMatch(/box-drawing/i)

    // Stable numbering reused; multi-file applied fix is one row; keyed detail line is the home for depth
    expect(content).toMatch(/reuse the same `#`/i)
    expect(template).toMatch(/one row with one `#`/i)
    expect(template).toMatch(/\*\*#N\*\*/)
  })

  test("PR-mode skip-condition pre-check stops without dispatching reviewers", async () => {
    const content = await readCodeReviewRuntimeContract()

    // Skip-check section exists
    expect(content).toContain("**Skip-condition pre-check.**")

    // gh pr view fetches state and file list for trivial judgment
    expect(content).toMatch(/gh pr view.*--json state,title,body,files/)

    // Hard skip rules
    expect(content).toMatch(/state.*CLOSED.*MERGED/)

    // Draft PRs are explicitly NOT skipped
    expect(content).not.toMatch(/isDraft.*true.*stop/)
    expect(content).toMatch(/Draft PRs are reviewed normally/)

    // Trivial-PR judgment uses lightweight model, not a regex
    expect(content).toMatch(/lightweight sub-agent/)
    expect(content).toMatch(/cheapest capable model/)
    expect(content).toMatch(/omit the model override/)
    expect(content).not.toMatch(/chore\\?\(deps\\?\)/)

    // Skip cleanly without dispatching reviewers
    expect(content).toMatch(/stop without dispatching reviewers/)

    // Standalone, base:, and branch-remote paths unaffected by PR skip rules
    expect(content).toMatch(/Standalone.*`base:`.*branch-remote/)
  })

  test("remote scope modes forbid workspace inspection on wrong tree", async () => {
    const skill = await readCodeReviewRuntimeContract()
    const stage2c = skill.split("### Stage 3:")[0].split("### Stage 2c:")[1]
    const diffScope = await readRepoFile(
      "skills/ce-code-review/references/diff-scope.md",
    )
    const validator = await readRepoFile(
      "skills/ce-code-review/references/validator-template.md",
    )

    expect(skill).toContain("<pr-scope-mode>branch-remote</pr-scope-mode>")
    expect(skill).toContain("<branch-head-ref>")
    expect(skill).toMatch(/local-aligned.*local tree diff/i)
    expect(skill).not.toMatch(/append.*`DIFF:`.*unpushed/i)
    expect(skill).toMatch(/Do \*\*not\*\* call `gh pr diff` or append remote hunks/)
    expect(stage2c).toMatch(
      /pr-remote.*branch-remote.*targeted probe.*`git show`.*reviewed head ref.*supplied diff hunks.*never inspect workspace paths/is,
    )

    expect(diffScope).toContain("branch-remote")
    expect(diffScope).toContain("pr-remote")

    expect(validator).toContain("branch-remote")
  })

  test("mode-aware demotion routes weak general-quality findings to soft buckets", async () => {
    const content = await readRepoFile(
      "skills/ce-code-review/references/finish-review.md",
    )
    const stage5 = content.split("### Stage 5b:")[0].split("### Stage 5:")[1]

    expect(content).toMatch(/Soft-bucket demotion/i)
    expect(content).toMatch(/single-reviewer P2\/P3 advisory from `testing`/)
    expect(content).toMatch(/from `maintainability`, `reliability`, or an adversarial reviewer/)
    expect(content).toMatch(/Inspect both surviving `findings` and `suppressed_findings`/)

    // Route demoted findings to soft buckets
    expect(content).toMatch(/`testing_gaps`/)
    expect(content).toMatch(/`residual_risks`/)

    // Coverage section reports demotion count
    expect(content).toMatch(/mode-aware demotion/)

    // Confidence-gated candidates remain non-primary after soft-bucket inspection
    expect(content).toMatch(/Suppressed candidates routed here remain absent from primary `findings`/)
    expect(content).toMatch(/discard all other `suppressed_findings`/)

    // Settlement reconciliation owns suppressed preferences before the remainder is discarded.
    expect(stage5).toMatch(/Settled decisions[\s\S]*surviving `findings` and `suppressed_findings`/)
    expect(stage5).toMatch(/include it in the synthetic rerun[\s\S]*helper preserves it in the primary report/)
    expect(stage5.indexOf("**Settled decisions.**")).toBeLessThan(
      stage5.indexOf("**Soft-bucket demotion before validation.**"),
    )
    expect(stage5).toMatch(
      /Soft-bucket demotion[\s\S]*Keep every `settled_conflict`-stamped finding primary/,
    )
  })

  test("personas use anchored rubric language and no float references remain", async () => {
    const personas = [
      "correctness-reviewer",
      "testing-reviewer",
      "maintainability-reviewer",
      "project-standards-reviewer",
      "security-reviewer",
      "performance-reviewer",
      "api-contract-reviewer",
      "data-migration-reviewer",
      "reliability-reviewer",
      "adversarial-reviewer",
      "previous-comments-reviewer",
      "julik-frontend-races-reviewer",
      "swift-ios-reviewer",
      "agent-native-reviewer",
    ]

    for (const persona of personas) {
      const content = await readRepoFile(personaPromptPath(persona))

      // Anchored language appears
      expect(content).toMatch(/Anchor (75|100)/)
      expect(content).toMatch(/Anchor 25 or below.*suppress/i)

      // No float confidence references
      expect(content).not.toMatch(/0\.\d{2}\+/)
      expect(content).not.toMatch(/0\.60-0\.79/)
      expect(content).not.toMatch(/below 0\.60/)
    }
  })

  test("documents stack-specific conditional reviewers for the JSON pipeline", async () => {
    const content = await readCodeReviewRuntimeContract()
    const catalog = await readRepoFile(
      "skills/ce-code-review/references/persona-catalog.md",
    )

    for (const agent of ["julik-frontend-races-reviewer", "swift-ios-reviewer"]) {
      expect(content).toContain(agent)
      expect(catalog).toContain(agent)
    }

    for (const removed of [
      "ce-dhh-rails-reviewer",
      "ce-kieran-rails-reviewer",
      "ce-kieran-python-reviewer",
      "ce-kieran-typescript-reviewer",
    ]) {
      expect(content).not.toContain(removed)
      expect(catalog).not.toContain(removed)
    }

    expect(content).toContain("## Language-Aware Conditionals")
    expect(content).not.toContain("## Language-Agnostic")
  })

  test("stack-specific reviewer agents follow the structured findings contract", async () => {
    const reviewers = [
      {
        path: personaPromptPath("julik-frontend-races-reviewer"),
        reviewer: "julik-frontend-races",
      },
      {
        path: personaPromptPath("swift-ios-reviewer"),
        reviewer: "swift-ios",
      },
    ]

    for (const reviewer of reviewers) {
      const content = await readRepoFile(reviewer.path)

      expect(content).not.toMatch(/^---\n/)
      expect(content).toContain("## Confidence calibration")
      expect(content).toContain("## What you don't flag")
      expect(content).toContain("Return your findings as JSON matching the findings schema. No prose outside the JSON.")
      expect(content).toContain(`"reviewer": "${reviewer.reviewer}"`)
    }
  })

  test("JSON-pipeline prompt assets stay frontmatter-free while template permits artifact write", async () => {
    // The ce-code-review subagent template instructs each persona to write its full
    // analysis to the absolute {run_dir}/{reviewer}.json supplied by the orchestrator.
    // Prompt assets no longer carry tool frontmatter; the caller/template owns
    // artifact-write permission in the generic subagent dispatch.
    const skill = await readCodeReviewRuntimeContract()
    const template = await readRepoFile(
      "skills/ce-code-review/references/subagent-template.md",
    )
    const personas = [
      "correctness-reviewer",
      "testing-reviewer",
      "maintainability-reviewer",
      "project-standards-reviewer",
      "security-reviewer",
      "performance-reviewer",
      "api-contract-reviewer",
      "data-migration-reviewer",
      "reliability-reviewer",
      "adversarial-reviewer",
      "previous-comments-reviewer",
      "julik-frontend-races-reviewer",
      "swift-ios-reviewer",
    ]

    for (const persona of personas) {
      const content = await readRepoFile(personaPromptPath(persona))

      expect(content).not.toMatch(/^---\n/)
      expect(content).not.toMatch(/^tools:/m)
    }

    expect(skill).toContain("The one permitted write is saving their full analysis")
    expect(template).toContain("This is the ONE write operation you are permitted to make")
  })

  test("data-migration reviewer consolidates schema drift and migration safety", async () => {
    const content = await readRepoFile(personaPromptPath("data-migration-reviewer"))
    const skill = await readCodeReviewRuntimeContract()

    expect(content).toContain("## Step 0: Schema drift")
    expect(content).toContain('"reviewer": "data-migration"')
    expect(content).toContain("Return your findings as JSON matching the findings schema.")
    expect(skill).toContain("data-migration` spawn gate")
    expect(skill).not.toContain("ce-schema-drift-detector")
    expect(skill).not.toContain("ce-data-migration-expert")
    expect(skill).not.toContain("ce-data-migrations-reviewer")
  })

  test("PR mode uses gh pr diff without checkout; branch/standalone fail closed on missing base", async () => {
    const content = await readCodeReviewRuntimeContract()

    // No scope path should fall back to `git diff HEAD` or `git diff --cached` — those only
    // show uncommitted changes and silently produce empty diffs on clean feature branches.
    expect(content).not.toContain("git diff --name-only HEAD")
    expect(content).not.toContain("git diff -U10 HEAD")
    expect(content).not.toContain("git diff --cached")

    // PR mode uses remote diff API, not checkout
    expect(content).toContain("gh pr diff")
    expect(content).toMatch(/Do not fall back to checkout/i)

    // Branch and standalone modes must stop when no base can be resolved
    const stopGuardMatches = content.match(/Do not fall back to `git diff HEAD`/g)
    expect(stopGuardMatches?.length).toBeGreaterThanOrEqual(1)
  })

  test("orchestration callers invoke review-only code review", async () => {
    const lfg = await readRepoFile("skills/lfg/SKILL.md")
    expect(lfg).toMatch(/ce-code-review[^\n]*mode:agent/)
    expect(lfg).toContain("references/review-followup.md")
    expect(lfg).not.toMatch(/mode:autofix/)
  })

  test("ce-work documents review-findings followup after Tier 2", async () => {
    const followup = await readRepoFile(
      "skills/ce-work/references/review-findings-followup.md",
    )
    const skill = await readRepoFile("skills/ce-work/SKILL.md")
    const shipping = await readRepoFile("skills/ce-work/references/shipping-workflow.md")
    expect(followup).toContain("review-only")
    expect(followup).toContain("suggested_fix")
    // The apply followup consumes the review the caller already ran; re-invocation is a
    // cold-caller fallback only (it must not start a second review in the ce-work Tier 2 path).
    expect(followup).toMatch(/consume the completed review/i)
    expect(followup).toMatch(/invoke[^\n]*review[^\n]*cold caller/i)
    expect(followup).toMatch(/does not investigate findings/i)
    expect(followup).toMatch(/Group by `file`/i)
    expect(followup).toMatch(/batch/i)
    expect(followup).toContain("mode:agent")
    expect(skill).toContain("references/shipping-workflow.md")
    expect(shipping).toContain("**Review is not fix — two steps:**")
    expect(shipping).toContain("Review-only via `mode:agent`")
    expect(shipping).toContain("review-findings-followup.md")
    expect(shipping).toMatch(/batch.*file|batch applicable findings by file/i)
  })

  test("ce-work shipping-workflow enforces a residual-work gate after Tier 2 review", async () => {
    for (const path of [
      "skills/ce-work/references/shipping-workflow.md",
    ]) {
      const workflow = await readRepoFile(path)
      await expect(readRepoFile(path.replace("shipping-workflow.md", "tracker-defer.md"))).resolves.toContain(
        "Non-interactive mode",
      )
      await expect(readRepoFile(path.replace("shipping-workflow.md", "tracker-defer.md"))).resolves.not.toMatch(
        /no-sink/,
      )

      // Gate step is explicitly labeled and required after Tier 2.
      expect(workflow).toContain("**Residual Work Gate**")
      expect(workflow).toMatch(/do not proceed to Final Validation/i)

      // Three forward options + one abort; labels are self-contained.
      expect(workflow).toContain("Apply/fix now")
      expect(workflow).toContain("File tickets via project tracker")
      expect(workflow).toContain("Accept and proceed")
      expect(workflow).toContain("Stop — do not ship")

      // Accept-and-proceed path threads findings into the PR description under the
      // heading ce-resolve-pr-feedback ticks; see the cross-skill heading test below.
      expect(workflow).toContain("## Unapplied review findings")
      expect(workflow).toContain("If the user later chooses the no-PR `ce-commit` path")
      // With no PR and no reachable tracker there is no durable sink, so the run says so
      // outright. The committed record file that used to fill this slot was removed: it
      // fired once in the repo's history, wrongly, and outlived the ticket it duplicated.
      expect(workflow).toContain("recorded nowhere else")
      expect(workflow).not.toContain("residual-review-findings")
    }
  })

  test("lfg records residuals in the PR body checklist and files tickets only with no PR", async () => {
    const lfg = await readRepoFile("skills/lfg/SKILL.md")
    // Steps 3-6 are owned by the reference lfg's step 3 names as a required read;
    // the body keeps each step's gate and the DONE-durability rule. Assertions on
    // relocated mechanics read the reference, not the body.
    const followupRef = await readRepoFile("skills/lfg/references/review-followup.md")
    const shippingTail = await readRepoFile("skills/lfg/references/shipping-tail.md")
    await expect(readRepoFile("skills/lfg/references/tracker-defer.md")).resolves.toContain(
      "Non-interactive mode",
    )
    await expect(readRepoFile("skills/lfg/references/tracker-defer.md")).resolves.not.toMatch(
      /no-sink/,
    )

    // Autonomous residual handoff step exists between code review and test-browser.
    expect(lfg).toContain("Apply and persist review fixes")
    const followup = await readRepoFile("skills/lfg/references/review-followup.md")
    expect(followup).toContain("fix(review): apply review findings")
    expect(lfg).toContain("references/review-followup.md")
    expect(lfg).toContain("Autonomous residual handoff")
    expect(lfg).toMatch(/Do not prompt the user/)

    // tracker-defer is invoked in non-interactive mode only on the no-PR path.
    expect(followupRef).toContain("references/tracker-defer.md")
    expect(followupRef).toContain("**non-interactive mode**")
    expect(followupRef).toMatch(/When no PR will exist[^\n]*tracker-defer/)
    expect(lfg).not.toContain("skills/ce-code-review/references/tracker-defer.md")
    expect(followupRef).toMatch(/no_sink/)

    // With a PR, residuals are a checklist in the PR body — the reviewer decides each
    // (lfg never merges). Not a ticket per finding (tracker flood) and not a PR
    // comment (buried). The body is written by step 8, never edited here.
    expect(lfg).toContain("the PR body")
    expect(lfg).not.toContain("never the PR body")
    expect(lfg).not.toContain("run-report comment")
    expect(lfg).not.toContain("gh pr edit PR_NUMBER --body-file BODY_FILE")
    expect(followupRef).toContain("## Unapplied review findings")
    expect(followupRef).toContain("- [ ] <severity> — <file:line> — <title>")
    expect(followupRef).not.toContain("gh pr comment")
    expect(followupRef).not.toContain("## Residual Review Findings")
    expect(shippingTail).toContain("## Unapplied review findings")
    expect(lfg).not.toContain("residual-review-findings")
    expect(followupRef).not.toContain("residual-review-findings")
    expect(lfg).toContain("Do not output DONE until the residuals are durable")

    // Step 9 delegates CI to ce-babysit-pr pipeline mode; the hand-rolled
    // CI-watch loop is retired.
    expect(lfg).toContain("ce-babysit-pr mode:pipeline")
    expect(shippingTail).toMatch(/[Ss]tack handoff from step 8/)
    expect(shippingTail).toMatch(/never treat "started" as DONE/i)
    expect(shippingTail).toMatch(/bottom open non-draft[\s\S]{0,120}posture:stack-ready[\s\S]{0,80}posture:stack-land/i)
    expect(lfg).not.toContain("gh pr checks --watch")
    expect(shippingTail).not.toContain("gh pr checks --watch")

    // Shipping precondition: a remote-less repo (e.g. a sandbox/throwaway checkout)
    // finishes locally instead of deadlocking on an impossible push.
    expect(lfg).toContain("Shipping precondition")
    expect(lfg).toContain("skip every push, PR create/edit, and CI-watch action")

    // Autopilot contract: never prompt, but require a durable sink before DONE.
    expect(lfg).toContain("Do not prompt the user")
    expect(lfg).toMatch(/Never block DONE on tracker filing failures/i)
  })

  test("every writer of the PR-body residual checklist uses the heading ce-resolve-pr-feedback ticks", async () => {
    // The heading is a cross-skill contract: lfg, ce-work, and ce-debug write it into
    // the PR body; ce-resolve-pr-feedback finds it by name to tick bullets its fixes close.
    const heading = "## Unapplied review findings"
    for (const path of [
      "skills/lfg/references/review-followup.md",
      "skills/ce-work/references/shipping-workflow.md",
      "skills/ce-debug/references/post-fix-handoff.md",
      "skills/ce-resolve-pr-feedback/SKILL.md",
      "skills/ce-resolve-pr-feedback/references/pipeline-mode.md",
    ]) {
      expect(await readRepoFile(path)).toContain(heading)
    }
    const resolver = await readRepoFile("skills/ce-resolve-pr-feedback/SKILL.md")
    expect(resolver).toMatch(/tick it to `- \[x\]`/)
    expect(resolver).toMatch(/never add to, reorder, or create that section/)
    for (const path of ["skills/ce-work/references/shipping-workflow.md", "skills/ce-debug/references/post-fix-handoff.md"]) {
      expect(await readRepoFile(path)).not.toContain("Known Residuals")
    }
  })

  test("ce-code-review emits actionable findings summary for callers", async () => {
    const content = await readCodeReviewRuntimeContract()
    expect(content).toContain("### Emit actionable findings summary")
    expect(content).toContain("Actionable Findings")
    expect(content).toContain("with stable `#`, severity, file:line, title, `autofix_class`")
    expect(content).toContain("Actionable findings: none.")
  })

  test("ce-code-review uses stable sequential finding numbers across grouped output", async () => {
    const content = await readRepoFile(
      "skills/ce-code-review/references/finish-review.md",
    )
    const mechanics = await readRepoFile(
      "skills/ce-code-review/scripts/findings-mechanics.py",
    )
    const template = await readRepoFile(
      "skills/ce-code-review/references/review-output-template.md",
    )
    const fixture = await readRepoFile("tests/fixtures/ce-code-review-stable-numbering.md")

    const stage5 = content.split("### Stage 5b:")[0].split("### Stage 5:")[1]
    expect(stage5).toMatch(/stable `#` numbering/)
    expect(stage5).toMatch(/reuse the (same |helper's )?stable `#`/i)
    expect(mechanics).toMatch(/enumerate\(survivors, 1\)/)

    const stage6 = content.split("### Headless output format")[0].split("### Stage 6: Synthesize and present")[1]
    expect(stage6).toContain("Finding numbers come from the stable assignment in Stage 5")
    expect(stage6).toContain("never re-derive them per severity section")
    expect(template).toContain("Stable sequential finding numbers")
    expect(template).toContain("reuse those same numbers when findings are repeated in Actionable Findings")

    // Per-severity tables are 5-column (# | File | Issue | Reviewer | Confidence);
    // Route lives in the Actionable Findings table + JSON, not the scannable tables.
    const primaryFindingIds = Array.from(
      fixture.matchAll(/^\| (\d+) \| `[^`]+` \| .* \| .* \| \d+ \|$/gm),
      ([, id]) => Number(id),
    )
    expect(primaryFindingIds).toEqual([1, 2, 3])

    // Applied findings keep their stable # and appear only in the Applied section (default mode), not severity tables
    const appliedSection = fixture.split("### Applied")[1].split("\n### ")[0]
    const appliedIds = Array.from(
      appliedSection.matchAll(/^\| (\d+) \| `[^`]+` \| .* \| .* \|$/gm),
      ([, id]) => Number(id),
    )
    expect(appliedIds).toEqual([4])
    expect(appliedIds.every((id) => !primaryFindingIds.includes(id))).toBe(true)

    // Keyed detail lines under a table are supplements, not findings — they reuse a # and never add one
    expect(fixture).toMatch(/^- \*\*#1\*\*/m)

    const residualSection = fixture.split("### Actionable Findings")[1]
    const residualIds = Array.from(
      residualSection.matchAll(/^\| (\d+) \| `[^`]+` \| .* \| `.*` \| .* \|$/gm),
      ([, id]) => Number(id),
    )
    expect(residualIds).toEqual([2, 3])
    expect(residualIds.every((id) => primaryFindingIds.includes(id))).toBe(true)
  })

  test("documents grouping tokens as presentation with conflict handling", async () => {
    const content = await readCodeReviewRuntimeContract()

    // Three grouping tokens in the Argument Parsing table, auto as default
    expect(content).toContain("`grouping:auto`")
    expect(content).toContain("`grouping:off`")
    expect(content).toContain("`grouping:always`")

    // Grouping never changes review behavior — presentation only
    expect(content).toContain("Grouping is presentation, not a mode.")
    expect(content).toMatch(/never reviewer selection, merge logic, scope rules, or the Stage 5c apply decision/)

    // Conflicting grouping tokens stop the review like conflicting modes do
    expect(content).toMatch(/Multiple distinct `grouping:` tokens/)
  })

  test("Stage 5 builds triage groups without mutating findings", async () => {
    const content = await readRepoFile(
      "skills/ce-code-review/references/finish-review.md",
    )
    const stage5 = content.split("### Stage 5b:")[0].split("### Stage 5:")[1]

    expect(stage5).toMatch(/Build thematic triage groups/)
    // Grouping is distinct from dedup and never alters the merged finding set
    expect(stage5).toMatch(/distinct from deduplication/)
    expect(stage5).toMatch(/never merge findings or change severity, confidence, route, owner, or stable `#`/)
    // auto triggers on distinct concerns (mirrors plan Requirements grouping), not item count
    expect(stage5).toMatch(/the trigger is distinct concerns, not item count/)
    expect(stage5).toMatch(/prefer no groups over decorative single-item groups/)
    expect(stage5).toMatch(/A finding appears in at most one group/)
  })

  test("triage groups are pruned after validation drops and after apply", async () => {
    const content = await readRepoFile(
      "skills/ce-code-review/references/finish-review.md",
    )

    // Stage 5b: groups never reference findings dropped by validation
    const stage5b = content.split("### Stage 5c:")[0].split("### Stage 5b:")[1]
    expect(stage5b).toMatch(/Prune triage groups after drops/)
    expect(stage5b).toMatch(/record the batch, per-finding verdicts, failures, and degraded blockers/)

    // Stage 5c: groups describe remaining work — applied findings leave the groups
    const stage5c = content.split("### Stage 6:")[0].split("### Stage 5c:")[1]
    expect(stage5c).toMatch(/Re-partition triage groups after apply/)
    expect(stage5c).toMatch(/never tell the user to handle a finding that was already applied/)
  })

  test("triage groups render as a stable-numbered pipe table and JSON field", async () => {
    const content = await readRepoFile(
      "skills/ce-code-review/references/finish-review.md",
    )
    const template = await readRepoFile(
      "skills/ce-code-review/references/review-output-template.md",
    )
    const fixture = await readRepoFile("tests/fixtures/ce-code-review-stable-numbering.md")

    // Stage 6 renders groups as a compact table that supplements, never replaces, the findings,
    // and marks each group as an apply-queue or a decision-gate for downstream actors
    const stage6 = content.split("### Stage 6: Synthesize and present")[1].split("## Quality Gates")[0]
    expect(stage6).toMatch(/render a `### Triage Groups` section before the findings/)
    expect(stage6).toContain("| Group | Findings | Context | Preferred Resolution | Why |")
    expect(stage6).toMatch(/groups supplement the findings, never replace them/i)
    expect(stage6).toMatch(/apply-queue or a decision-gate/i)

    // Template carries the canonical skeleton and formatting rule
    expect(template).toContain("### Triage Groups")
    expect(template).toContain("| Group | Findings | Context | Preferred Resolution | Why |")
    expect(template).toMatch(/never replace the severity tables, merge findings, or renumber them/)

    // Fixture group references resolve to primary finding numbers
    const primaryFindingIds = Array.from(
      fixture.matchAll(/^\| (\d+) \| `[^`]+` \| .* \| .* \| \d+ \|$/gm),
      ([, id]) => Number(id),
    )
    const groupSection = fixture.split("### Triage Groups")[1].split("\n### ")[0]
    const groupIds = Array.from(groupSection.matchAll(/#(\d+)/g), ([, id]) => Number(id))
    expect(groupIds.length).toBeGreaterThan(0)
    expect(groupIds.every((id) => primaryFindingIds.includes(id))).toBe(true)

    // mode:agent carries groups in the JSON contract instead of a markdown section
    expect(content).toContain('"triage_groups": []')
    expect(content).toMatch(/Each object in `triage_groups` carries/)
    expect(template).toMatch(/`triage_groups`.*batch related fixes by theme/)
  })
})

describe("cross-model omp receipt identity", () => {
  test("code review receipt records omp transport with conditional independence", async () => {
    const ref = await readRepoFile(
      "skills/ce-code-review/references/cross-model-review.md",
    )
    expect(ref).toContain("`reviewer`: `adversarial-omp`")
    expect(ref).toContain("`cross_model_route` / `cross_model_target` / `cross_model_harness`: `omp`")
    expect(ref).toContain("never from the reviewer's own prose")
    expect(ref).toContain("`model_requested`: `reviewer`")
    expect(ref).toContain("There is no shell worker")
  })

  test("doc review receipt records omp transport with conditional independence", async () => {
    const ref = await readRepoFile(
      "skills/ce-doc-review/references/cross-model-review.md",
    )
    expect(ref).toContain("`reviewer`: `<reviewer-name>-omp`")
    expect(ref).toContain("`cross_model_route` / `cross_model_target` / `cross_model_harness`: `omp`")
    expect(ref).toContain("never from the reviewer's own prose")
    expect(ref).toContain("`model_requested`: `reviewer`")
    expect(ref).toContain("There is no shell worker")
  })
})

describe("testing-reviewer contract", () => {
  test("hunting for behavioral changes with no test additions", async () => {
    const content = await readRepoFile(personaPromptPath("testing-reviewer"))

    expect(content).toContain("Behavioral changes with no test additions")
    expect(content).toContain("distinct from untested branches")
    expect(content).toContain("Non-behavioral changes")
  })
})


describe("ce-code-review dispatch templates", () => {
  // #1509: a placeholder named in the template's prose gets filled like a slot, so
  // `{diff}` in the closing note re-emitted the whole diff into every reviewer prompt.
  // Each placeholder may appear only once inside the fenced template, as its slot.
  test("the reviewer template names each placeholder once, as a slot", async () => {
    const content = await readRepoFile(
      "skills/ce-code-review/references/subagent-template.md",
    )
    // The template fence nests a ```json example, so bound it by the heading that follows it.
    const fenced = content.match(/^```\n[\s\S]*?^```\n\n## Variable Reference/m)?.[0]
    expect(fenced).toBeDefined()
    const counts = new Map<string, number>()
    for (const m of fenced!.matchAll(/\{([a-z_]+)\}/g)) {
      counts.set(m[1], (counts.get(m[1]) ?? 0) + 1)
    }
    for (const name of ["file_list", "diff"]) {
      expect(counts.get(name)).toBe(1)
    }
  })

  test("compact-return contract uses exact schema keys in both output tiers", async () => {
    const template = await readRepoFile(
      "skills/ce-code-review/references/subagent-template.md",
    )
    const outputContract = template.match(/<output-contract>[\s\S]*?<\/output-contract>/)?.[0]
    expect(outputContract).toBeDefined()

    expect(outputContract).toMatch(/full analysis \(all schema fields, including why_it_matters, evidence/)
    expect(outputContract).toMatch(/ONLY merge-tier fields per finding:/)
    expect(outputContract).toContain(
      "title, severity, file, line, confidence, autofix_class, owner, requires_verification, pre_existing, suggested_fix, first_evidence.",
    )
    expect(outputContract).toMatch(/artifact conforms to the full schema below/)
    expect(outputContract).toMatch(/compact finding uses only this merge-tier allowlist/)
    expect(outputContract).toMatch(/`pre_existing` as a boolean/)
    expect(outputContract).toMatch(/`notes` is not a field/)
    expect(template).not.toMatch(/independence_verified/)
  })
})

describe("cross-model fold-in", () => {
  // The foreground peer return folds in exactly once; an omp receipt never
  // promotes agreement and a missing artifact is a pass that did not run.
  test("the reviewer folds in once and promotes agreement only when independence is verified", async () => {
    const skill = await readRepoFile("skills/ce-code-review/SKILL.md")
    expect(skill).toContain("independent `reviewer` pass")
    const code = await readRepoFile(
      "skills/ce-code-review/references/cross-model-review.md",
    )
    expect(code).toContain("Promote agreement, and skip a validator, only when")
    expect(code).toMatch(/A missing file means the pass did\s+not run/i)
    expect(code).toMatch(/never fail the\s+review for it/i)
    const doc = await readRepoFile(
      "skills/ce-doc-review/references/cross-model-review.md",
    )
    expect(doc).toContain("Promote agreement only when `independence_verified` is `true`")
    expect(doc).toMatch(/A\s+missing file means the pass did\s+not run/i)
    expect(doc).toMatch(/never fail the\s+review for it/i)
  })
})
