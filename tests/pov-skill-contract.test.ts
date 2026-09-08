import { readFile } from "fs/promises"
import path from "path"
import { describe, expect, test } from "bun:test"

const ROOT = process.cwd()

async function skillFile(relative: string): Promise<string> {
  return readFile(path.join(ROOT, "skills/ce-pov", relative), "utf8")
}

function between(content: string, start: string, end: string): string {
  const from = content.indexOf(start)
  const to = content.indexOf(end, from + start.length)
  if (from < 0 || to <= from) throw new Error(`missing contract region: ${start} -> ${end}`)
  return content.slice(from, to)
}

function compact(content: string): string {
  return content.replace(/\s+/g, " ")
}

describe("ce-pov subject-shape contract", () => {
  test("the activation contract names all three POV shapes and avoids generic repo profiling", async () => {
    const skill = await skillFile("SKILL.md")

    expect(skill).toContain("external-adoption question")
    expect(skill).toContain("holistic take")
    expect(skill).toContain("approach set")
    expect(skill).toContain("Send scouts directly to candidate-specific current evidence")
    expect(skill).not.toContain("repo-profile-cache")
  })

  test("licenses bounded inline grounding while keeping the prior-decision scan mandatory", async () => {
    const skill = await skillFile("SKILL.md")
    const phaseOne = between(skill, "### Phase 1: Ground", "### Phase 2: Verify Grounding")

    expect(phaseOne).toContain("Send scouts directly to candidate-specific current evidence")
    expect(phaseOne).toMatch(/bounded reads.*instead of dispatching scouts/)
    expect(phaseOne).toMatch(/a pointer to check, never self-verifying/)
    expect(phaseOne).toMatch(/unscoped or noisy grounding still dispatches/)
    expect(phaseOne).toMatch(/prior-decision scan.*stays mandatory on either path/)
  })

  test("semantic cross-model requests activate without the oracle shorthand", async () => {
    const skill = await skillFile("SKILL.md")
    const frontmatter = skill.split("---", 3)[1] ?? ""

    expect(frontmatter).toContain("consult other models")
    expect(frontmatter).toContain("reconcile their opinions")
  })

  test("the always-loaded Phase 0 frame names the document and approach intents", async () => {
    const skill = await skillFile("SKILL.md")
    const phaseZero = between(skill, "### Phase 0: Frame and Classify", "### Phase 1: Ground")

    expect(phaseZero).toContain("Document-take")
    expect(phaseZero).toContain("Approach-set")
  })

  test("keeps user-facing copy decision-oriented without exposing project internals", async () => {
    const skill = await skillFile("SKILL.md")
    const userCopy = between(skill, "## User-facing communication", "## Interaction Method")

    expect(userCopy).toContain("person deciding")
    expect(userCopy).toContain("decision, question, or recommendation")
    expect(userCopy).toContain("internal workflow vocabulary")
    expect(userCopy).toContain('"this project" or "the repository"')
    expect(userCopy).toMatch(/never promote.*directory.*worktree.*checkout.*branch/i)
  })

  test("intake and boundaries distinguish takes, findings reviews, and supplied approaches", async () => {
    const [intake, boundaries] = await Promise.all([
      skillFile("references/intake.md"),
      skillFile("references/boundaries.md"),
    ])

    expect(intake).toContain("**Document-take**")
    expect(intake).toContain("**Approach-set**")
    expect(boundaries).toContain('"review this doc"')
    expect(boundaries).toContain('"what do you think of this doc?"')
    expect(boundaries).toContain("`ce-doc-review`")
    expect(boundaries).toContain("Options supplied")
    expect(boundaries).toContain("`ce-ideate`")
  })

  test("method keeps adoption grades and defines honest non-adoption outcomes", async () => {
    const method = await skillFile("references/method.md")

    for (const grade of ["**Adopt**", "**Trial**", "**Hold**", "**Reject**", "**Not-our-problem**"]) {
      expect(method).toContain(grade)
    }
    expect(method).toContain('**"Blocked — insufficient project grounding"**')
    expect(method).toContain('**"Blocked — external evidence unavailable"**')
    expect(method).toContain('**"Either is viable"**')
    expect(method).toContain("Never manufacture certainty with a scorecard")
  })
})

describe("ce-pov cross-model panel contract", () => {
  // Split by load-time: the body must route into the panel protocol before any
  // participation or offer decision (that pointer has to fire from the window),
  // while the OMP-only protocol mechanics (evidence transport, explicit-only
  // discovery, the OMP assert) live in the reference the pointer mandates.
  test("loads the panel protocol before deciding whether to offer", async () => {
    const skill = await skillFile("SKILL.md")
    const phaseThree = between(skill, "### Phase 3: Point of View", "### Phase 4: Follow-up")

    expect(phaseThree).toContain("may qualify for a proactive offer")
    expect(phaseThree).toContain("before resolving participation or deciding whether to offer")
    expect(phaseThree).toContain("references/cross-model-panel.md")
  })

  test("forms an independent solo POV before the panel and emits only after it finishes", async () => {
    const skill = await skillFile("SKILL.md")
    const phaseThree = between(skill, "### Phase 3: Point of View", "### Phase 4: Follow-up")

    const formSolo = phaseThree.indexOf("form ce-pov's own independent POV")
    const runPanel = phaseThree.search(/[Ff]inish the panel branch/)
    const emitFinal = phaseThree.indexOf("Only then emit")

    expect(formSolo).toBeGreaterThan(-1)
    expect(runPanel).toBeGreaterThan(formSolo)
    expect(emitFinal).toBeGreaterThan(runPanel)
    expect(phaseThree).toContain("Freeze that position")
    expect(phaseThree).toMatch(/keep it out of an independent peer's initial context/i)
    expect(phaseThree).toMatch(/critique that position|reconciliation round/)
  })

  // Split by load-time: Phase 4 always reads followup.md, so the body pins the
  // shapes the offer is reasoned from and the reference owns the tier gates.
  test("follow-up covers every subject shape while retaining adoption tier gates", async () => {
    const skill = await skillFile("SKILL.md")
    const phaseFour = skill.slice(skill.indexOf("### Phase 4: Follow-up"))
    const followup = await skillFile("references/followup.md")

    expect(phaseFour).toContain("references/followup.md")
    expect(phaseFour).toContain("active subject shape")
    expect(phaseFour).toContain("Document take")
    expect(phaseFour).toContain("Approach-set position")
    expect(followup).toContain("For adoption subjects")
    expect(followup).toContain("Tier 1")
    expect(followup).toContain("Tier 2/3")
  })

  test("warm invocations return a POV block without proactive follow-up", async () => {
    const skill = await skillFile("SKILL.md")
    const phaseFour = skill.slice(skill.indexOf("### Phase 4: Follow-up"))

    expect(phaseFour).toContain("output the POV block")
    expect(phaseFour).not.toContain("output the verdict block")
  })

  test("uses the JSON Schema draft supported by the Claude CLI", async () => {
    const schema = JSON.parse(await skillFile("references/pov-schema.json"))

    expect(schema.$schema).toBe("http://json-schema.org/draft-07/schema#")
  })

  test("requires explicit movement and an independence receipt", async () => {
    const schema = JSON.parse(await skillFile("references/pov-schema.json"))

    expect(schema.required).toContain("movement")
    expect(schema.properties.movement.enum).toEqual(["initial", "moved", "held"])
    expect(schema.properties.independence_verified.type).toBe("boolean")
    expect(schema.properties.cross_model_target.type).toBe("string")
    expect(schema.properties.cross_model_harness.type).toBe("string")
    expect(schema.properties.serving_family.type).toBe("string")
  })

  test("grounds initial peers in the subject and shared tree without a host-curated project floor", async () => {
    const peer = await skillFile("references/agents/pov-peer.md")
    const prose = compact(peer)

    expect(prose).toMatch(/supplied subject.*shared working tree/)
    expect(prose).toContain("Do not require or infer a host-curated project summary")
    expect(prose).not.toContain("verified project floor")
    expect(prose).not.toContain("shared project floor")
  })

  // The panel reference is OMP-only: a reviewer dispatch carrying evidence,
  // never a vote, with independence permanently unverified.
  test("panel is OMP-only evidence transport, never a vote", async () => {
    const panel = await skillFile("references/cross-model-panel.md")

    // skills/ce-pov/references/cross-model-panel.md:1 (OMP-only title)
    expect(panel).toContain("# Cross-Model POV Panel (OMP-only)")
    // skills/ce-pov/references/cross-model-panel.md:3-6 (transport, decision-maker, receipt)
    expect(panel).toContain("provides evidence transport only")
    expect(panel).toContain("never a vote")
    expect(panel).toContain("ce-pov remains the decision-maker")
    expect(panel).toContain("always records `independence_verified: false`")
  })

  test("discovery is explicit-only with no auto-start on silence", async () => {
    const panel = await skillFile("references/cross-model-panel.md")

    // skills/ce-pov/references/cross-model-panel.md:8-11 (explicit-only discovery)
    expect(panel).toContain("Discovery is explicit-only.")
    expect(panel).toContain("There is no automatic panel")
    expect(panel).toContain("explicitly asks for a separate read")
    expect(panel).toContain("Never auto-start a worker on silence.")
  })

  test("asserts OMP before any egress", async () => {
    const panel = await skillFile("references/cross-model-panel.md")

    // skills/ce-pov/references/cross-model-panel.md:13-19 (harness assert)
    expect(panel).toContain("Assert the harness before any egress")
    expect(panel).toContain('[ "${OMPCODE:-}" = "1" ] || fail "must run under OMPCODE=1"')
    expect(panel).toContain("the worker fail-closes without it")
  })

  test("dispatches the fixed omp route with its receipt schema", async () => {
    const panel = await skillFile("references/cross-model-panel.md")

    // skills/ce-pov/references/cross-model-panel.md:28-43 (explicit omp dispatch)
    expect(panel).toContain("The fixed route is always `omp`")
    expect(panel).toContain('CROSS_MODEL_HOST_HARNESS="omp" CROSS_MODEL_FIXED_ROUTE="omp"')
    expect(panel).toMatch(/the second must be `omp`/)
    // skills/ce-pov/references/cross-model-panel.md:57-66 (receipt schema)
    expect(panel).toContain("Receipt `<run-dir>/pov-omp.json` schema:")
    expect(panel).toContain("`voice`: `peer-omp`")
    expect(panel).toContain("`cross_model_route` / `cross_model_target` / `cross_model_harness`: `omp`")
    expect(panel).toContain("`serving_family`: `unknown`")
    expect(panel).toContain("`independence_verified`: always `false`")
    expect(panel).toContain("`model_requested`: `auto`; `model_actual`: `unverified`")
  })

  test("folds in foreground without separate-model corroboration", async () => {
    const panel = await skillFile("references/cross-model-panel.md")

    // skills/ce-pov/references/cross-model-panel.md:68-73 (fold-in)
    expect(panel).toContain("Run foreground and read the artifact.")
    expect(panel).toMatch(/never present the omp voice as\s+separate-model corroboration/)
    expect(panel).toMatch(/A missing file\s+means that voice did not run/)
  })

  test("the worker gates shaped output on voice, position, reasoning, and enums", async () => {
    const worker = await skillFile("scripts/cross-model-pov.sh")
    // skills/ce-pov/scripts/cross-model-pov.sh:113-115 (pov_shaped gate)
    const gate = worker.slice(worker.indexOf("pov_shaped() {"), worker.indexOf("recover_pov_json()"))
    expect(gate).toContain("pov_shaped()")

    expect(gate).toContain('(.voice|type)=="string" and (.voice|length)>0')
    expect(gate).toContain('(.position|type)=="string" and (.position|length)>0')
    expect(gate).toContain('(.reasoning|type)=="string" and (.reasoning|length)>0')
    expect(gate).toContain('(.evidence|type)=="array" and all(.evidence[]; type=="string" and length>0)')
    expect(gate).toContain('.external_check=="ran" or .external_check=="unavailable"')
    expect(gate).toContain('.mode=="independent" or .mode=="skeptic"')
    expect(gate).toContain('.movement=="initial" or .movement=="moved" or .movement=="held"')
  })
})
