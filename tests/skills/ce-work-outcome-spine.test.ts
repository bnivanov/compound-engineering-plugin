import { readFile } from "fs/promises"
import path from "path"
import { describe, expect, test } from "bun:test"

async function readRepoFile(relativePath: string): Promise<string> {
  return readFile(path.join(process.cwd(), relativePath), "utf8")
}

// Mechanism pins follow the phase owner that the kernel requires before action. The
// always-loaded body keeps ordering, unread stops, WIP/write gates, review completion,
// and tail ownership; the references keep the detailed protocols.
async function readStrategy(): Promise<string> {
  return readRepoFile("skills/ce-work/references/execution-strategy.md")
}

async function readTriage(): Promise<string> {
  return readRepoFile("skills/ce-work/references/input-triage.md")
}

async function readReturnContract(): Promise<string> {
  return readRepoFile("skills/ce-work/references/return-to-caller.md")
}

async function readImplementationContract(): Promise<string> {
  const skill = await readRepoFile("skills/ce-work/SKILL.md")
  const implementationLoop = await readRepoFile("skills/ce-work/references/implementation-loop.md").catch(() => "")
  return `${skill}\n${implementationLoop}`
}

function sliceSection(content: string, startAnchor: string, endAnchor: string): string {
  const start = content.indexOf(startAnchor)
  expect(start, `start anchor not found: ${startAnchor}`).toBeGreaterThanOrEqual(0)
  const end = content.indexOf(endAnchor, start + startAnchor.length)
  expect(end, `end anchor not found: ${endAnchor}`).toBeGreaterThan(start)
  return content.slice(start, end)
}

describe("ce-work native characterization", () => {
  test("opens with result, next consumer, done condition, and host-owned canonical integration", async () => {
    const skill = await readRepoFile("skills/ce-work/SKILL.md")
    const outcome = sliceSection(skill, "## Outcome", "## Execution Workflow")

    expect(outcome).toContain("**Result:**")
    expect(outcome).toContain("**Next consumer:**")
    expect(outcome).toContain("**Done:**")
    expect(outcome).toContain("**Intent:**")
    expect(outcome).toContain("host orchestrator")
    expect(outcome).toContain("authoritative verification and canonical commits")
    // 2026-08-21 PR #1508 review: a host that reads every owner at skill load never re-reads at the acting step,
    // so the late missing-reference stops were unreachable; the kernel must say an early read does not count.
    expect(skill).toContain("a read made before that phase does not satisfy it")
    expect(skill).toContain("read again at its step even when already in context")
    expect(skill.indexOf("## Outcome")).toBeLessThan(skill.indexOf("## Execution Workflow"))
  })

  test("classifies caller mode, legacy aliases, bare prompts, and plans before execution", async () => {
    const skill = await readRepoFile("skills/ce-work/SKILL.md")
    const triage = await readTriage()

    expect(triage).toContain("**Otherwise, parse a leading mode token.**")
    expect(triage).toContain("mode:return-to-caller")
    expect(triage).toContain("mode:caller-owned-tail")
    expect(triage).toContain("caller:lfg")
    expect(triage).toContain("strip that token before anything else")
    expect(triage).toContain("**Plan document**")
    expect(triage).toContain("**Resolve a session-carried plan before blank or bare-prompt classification.**")
    expect(triage).toContain("Invocation origin is not observable or relevant")
    expect(triage).toContain("**Blank invocation latest-plan discovery:**")
    expect(triage).toContain("**Bare prompt**")
    expect(triage).toContain("skip only the task list")
    expect(skill).toContain("It owns source resolution, control grammar, recovery, read-only discovery, plan readiness, non-code routing, blank discovery, and bare-prompt intake")
  })

  test("activates direct recovery before ordinary input classification", async () => {
    const skill = await readRepoFile("skills/ce-work/SKILL.md")
    const bodyTriage = sliceSection(skill, "### Phase 0: Input Triage", "### Phase 1: Quick Start")
    const triage = await readTriage()

    expect(bodyTriage).toContain("**Recovery activation comes first.**")
    expect(bodyTriage).toContain("Recovery never dispatches a new worker")
    expect(bodyTriage.indexOf("**Recovery activation comes first.**")).toBeLessThan(bodyTriage.indexOf("references/input-triage.md"))
    expect(triage).toContain("interpret whether the user is semantically asking to resume, inspect status, or clean up")
    expect(triage).toContain("`^[A-Za-z0-9._-]{1,128}$`")
    expect(triage).toContain("runs native with no detached controller")
    expect(triage).toContain("report that external execution was removed")
    expect(triage).toContain("Recovery never dispatches a new worker")
    expect(triage.indexOf("**Recovery activation comes first.**")).toBeLessThan(triage.indexOf("**Otherwise, parse a leading mode token.**"))
  })

  test("executes natively through the strategy reference on the session model", async () => {
    const skill = await readRepoFile("skills/ce-work/SKILL.md")
    const nativeGate = sliceSection(skill, "2. **Execute natively.**", "### Phase 2: Execute")
    const strategy = await readStrategy()

    expect(nativeGate).toContain("read `references/execution-strategy.md`")
    expect(nativeGate).toContain("running everything native on the current harness and session model")
    expect(strategy).toContain("| **Inline** | Trivial work")
    expect(strategy).toContain("| **Parallel subagents** | The default for structured multi-unit plans")
    expect(strategy).toContain("| **Serial subagents** | Units the dependency graph genuinely chains")
    expect(strategy).toContain("**Native dispatch** uses your harness's subagent/worker mechanism for every unit")
    expect(strategy).toContain("A synchronous native unit stays in the active checkout")
  })

  test("derives bounded plan tasks before gating every execution read", async () => {
    const skill = await readRepoFile("skills/ce-work/SKILL.md")
    const workspace = await readRepoFile("skills/ce-work/references/workspace-setup.md")
    const nativeGate = sliceSection(skill, "2. **Execute natively.**", "### Phase 2: Execute")

    expect(workspace).toContain("**Read Plan and Clarify**")
    expect(workspace).toContain("**Create Task List**")
    expect(nativeGate).toContain("Before selecting a unit for execution, writing, dispatching, or committing")
    expect(nativeGate).toContain("read `references/execution-strategy.md`")
  })

  test("workspace setup pins fresh-base and current-branch observations", async () => {
    const workspace = await readRepoFile("skills/ce-work/references/workspace-setup.md")

    expect(workspace).toContain("`gh repo view --json defaultBranchRef`")
    expect(workspace).toContain("`git fetch origin <default>`")
    expect(workspace.match(/`git branch --show-current`/g)).toHaveLength(2)
    expect(workspace.indexOf("`git fetch origin <default>`")).toBeLessThan(
      workspace.indexOf("Base the new branch on the fetched `origin/<default>`"),
    )
  })

  test("new phase owners resolve sibling references from the skill root", async () => {
    const owners = await Promise.all([
      readTriage(),
      readRepoFile("skills/ce-work/references/workspace-setup.md"),
      readReturnContract(),
    ])

    for (const owner of owners) {
      expect(owner).not.toMatch(/(?<!references\/)`(?:cross-model-execution|work-intake|non-code-execution|execution-engines|shipping-workflow)\.md`/)
    }
  })

  test("bounds worker scope while leaving canonical verification and commits with the orchestrator", async () => {
    const strategy = await readStrategy()
    const dispatch = strategy.slice(strategy.indexOf("**Native dispatch**"))

    expect(dispatch).toContain("**bounded unit packet**")
    expect(dispatch).toContain("never broaden")
    expect(dispatch).toContain("Do not send \"read the whole plan\"")
    expect(dispatch).toContain("**Do not commit.**")
    expect(dispatch).toContain("the **orchestrator owns staging, committing, and the authoritative test runs**")
    expect(dispatch).toContain("retire each unit in dependency order")
    expect(dispatch).toContain("the orchestrator owns commits")
  })

  test("uses a fresh single-use context for each dispatched native worker while preserving inline execution", async () => {
    const strategy = await readStrategy()
    const dispatch = strategy.slice(strategy.indexOf("**Native dispatch**"))

    expect(dispatch).toContain("**Fresh worker invariant:**")
    expect(dispatch).toContain("create a new worker context with no prior implementation-unit transcript")
    expect(dispatch).toContain("never receive a different unit")
    expect(dispatch).toContain("never retask it or retain idle implementation workers for reuse")
    expect(dispatch).toContain("Inline execution creates no worker context or handle, so it has nothing to retire")
    expect(dispatch).toContain("**After each serial inline/subagent unit:**")
    expect(dispatch).toContain("retire its handle per the fresh worker invariant, then dispatch the next subagent unit in a new worker context")
    expect(dispatch).toContain("An inline unit has no worker handle to retire; start the next unit directly")
    expect(dispatch).toContain("**After a parallel inline/subagent batch")
    expect(dispatch).toContain("immediately retire that unit's worker per the fresh worker invariant before considering the next")
  })

  test("preserves standalone shipping and return-to-caller tail ownership", async () => {
    const skill = await readRepoFile("skills/ce-work/SKILL.md")
    const standalone = sliceSection(skill, "### Phase 3-4: Quality Check and Finishing Work", "## Return-to-Caller Mode")
    const caller = skill.slice(skill.indexOf("## Return-to-Caller Mode"))
    const returnContract = await readReturnContract()

    expect(standalone).toContain("references/shipping-workflow.md")
    expect(caller).toContain("implementation and local verification only")
    expect(caller).toContain("standalone_shipping_skipped: true")
    expect(caller).toContain("must not enter Phase 3-4")
    // Phase 0 enters the mode and the tail re-reads the owner before returning.
    expect(skill).toContain("When triage enters Return-to-Caller Mode, immediately read `references/return-to-caller.md`")
    expect(caller).toContain("read `references/return-to-caller.md` again")
    expect(returnContract).toContain("structured summary instead of running the standalone shipping tail")
    expect(returnContract).toContain("never open a PR")
  })

  test("separates scheduling from workspace selection and declines unsafe waves", async () => {
    const loop = await readRepoFile("skills/ce-work/references/implementation-loop.md")
    const gate = sliceSection(await readStrategy(), "**Parallel Safety Check.**", "**Native dispatch**")

    expect(gate).toContain("Scheduling is separate from workspace selection")
    expect(gate).toContain("decline parallelism")
    expect(gate).toContain("dependencies")
    expect(gate).toContain("declared files")
    expect(gate).toContain("migrations")
    expect(gate).toContain("lockfiles")
    expect(gate).toContain("generated")
    expect(gate).toContain("expected merge")
    expect(gate).toContain("3-5 workers")
    expect(gate).toContain("isolated workspace")
    expect(gate).toContain("synchronous native")
    expect(gate).toContain("active checkout")
    expect(gate).toContain("repeated collision disables further waves")
    expect(loop).toContain("Repeated collision or broad edits disable further parallel waves for the run")
  })

  test.skip("supervision of a crashed worker stays with the host, never a runner", async () => {
    // Tombstone: native dispatch classifies a launch failure inline ("Classify a
    // rejected native dispatch" in execution-strategy.md) and the host owns
    // verification and canonical commits (the Outcome Intent in SKILL.md), so a
    // crash is host-observed state, never something outsourced to a runner.
    // Skipped so a reintroduced runner supervision contract lands here first.
  })
})

describe("ce-work return envelope contract", () => {
  test("returns the native 17-field return envelope, no engine binding", async () => {
    const caller = await readReturnContract()

    for (const receipt of [
      "status",
      "plan_path",
      "changed_files",
      "u_ids_attempted",
      "u_ids_completed",
      "verification_results",
      "verification_evidence",
      "run_id",
      "source_kind",
      "source_digest",
      "unit_receipts",
      "plan_checkpoint",
      "blockers",
      "recovery_path",
      "settled_decision_conflicts",
      "behavior_change",
      "standalone_shipping_skipped",
    ]) {
      expect(caller).toContain(receipt)
    }
    for (const retired of [
      "implementation_engine_binding",
      "requested_route",
      "actual_route",
      "requested_model",
      "actual_model",
      "fallback_reason",
    ]) {
      expect(caller).not.toContain(retired)
    }
  })
})

describe("ce-work implementation-worker persona", () => {
  test("keeps external dispatch policy out of the implementation-worker persona", async () => {
    const worker = await readRepoFile("skills/ce-work/references/agents/implementation-worker.md")

    expect(worker).toContain("caller, unit packet, and controller own dispatch")
    expect(worker).toContain("Implement exactly the supplied implementation unit")
    expect(worker).toContain("Before returning `completed`")
    expect(worker).toContain("complete Git delta")
    expect(worker).toContain("disposable artifacts created by your own checks")
    expect(worker).toContain("every remaining changed path")
    expect(worker).not.toContain("make intermediate commits")
    expect(worker).toContain("`git add`")
    expect(worker).toContain("`git commit`")
    expect(worker).toContain("Leave the completed working tree uncommitted")
    expect(worker).toContain("host snapshots the tree")
    for (const dispatchPolicy of ["recipient", "model", "harness", "intermediary", "retry", "route", "additional workers"]) {
      expect(worker.toLowerCase()).not.toContain(dispatchPolicy)
    }
  })
})

describe("ce-work implementation evidence characterization", () => {
  test("loads the extracted protocol only at the implementation gate", async () => {
    const skill = await readRepoFile("skills/ce-work/SKILL.md")
    const implementationLoop = await readRepoFile("skills/ce-work/references/implementation-loop.md")
    const phase2 = sliceSection(skill, "### Phase 2: Execute", "### Phase 3-4: Quality Check and Finishing Work")

    expect(phase2).toContain("read `references/implementation-loop.md`")
    // Incremental commits moved into the loop reference the body mandates at this gate.
    expect(implementationLoop).toContain("2. **Incremental Commits**")
    expect(phase2).not.toContain("2. **Incremental Commits**")
    expect(skill).not.toContain("1. **Task Execution Loop**")
    expect(skill).not.toContain("**Evidence Strategy** — Test discovery decides where proof belongs")
    expect(implementationLoop).toContain("1. **Task Execution Loop**")
    expect(implementationLoop).toContain("**Evidence Strategy** — Test discovery decides where proof belongs")
  })

  test("retains every task evidence and verification stop across relocation", async () => {
    const contract = await readImplementationContract()
    const orderedStops = [
      "Mark task as in-progress",
      "Choose the evidence strategy for this task before changing behavior",
      "verify the expected failure or baseline capture before changing production code",
      "Implement following existing conventions",
      "Run System-Wide Test Check",
      "Run tests after changes",
      "Assess testing coverage",
      "Record verification evidence for the task",
      "Mark task as completed",
      "Evaluate for incremental commit",
    ]

    let previous = -1
    for (const stop of orderedStops) {
      const current = contract.indexOf(stop)
      expect(current, `missing implementation stop: ${stop}`).toBeGreaterThan(previous)
      previous = current
    }

    expect(contract).toContain("Guardrails for execution evidence:")
    expect(contract).toContain("**Test Discovery**")
    expect(contract).toContain("**Evidence Strategy**")
    expect(contract).toContain("**Test Scenario Completeness**")
    expect(contract).toContain("**System-Wide Test Check**")
  })
})

// 2026-08-22: small work sized by ce-plan in the same session is executed, not
// re-planned, and a mechanical diff ships without a post-PR watch.
describe("ce-work right-sized routes", () => {
  test("kernel decides the Trivial/mechanical route before the first reference read", async () => {
    const skill = await readRepoFile("skills/ce-work/SKILL.md")
    expect(skill).toMatch(/A bare prompt that is Trivial[^.]*skips the task list/)
    expect(skill).toMatch(/purely mechanical diff also ships without a post-PR watch/)
    expect(skill).toMatch(/never as a route back to `ce-plan` or `ce-brainstorm`/)
  })

  test("a mechanical diff passes babysit:off to the shipping skill, and the docs say the same", async () => {
    const shipping = await readRepoFile("skills/ce-work/references/shipping-workflow.md")
    expect(shipping).toMatch(/Code review: skipped \(mechanical diff\)`, also pass `babysit:off`/)
    const docs = await readRepoFile("docs/guides/ce-work.md")
    expect(docs).toMatch(/purely mechanical diff[^.]*ships without a post-PR watch/)
    expect(docs).not.toMatch(/Trivial route skips the task list and the post-PR watch/)
  })

  test("session-carried resolution accepts an in-conversation brief and intake does not re-route sized prompts", async () => {
    const triage = await readTriage()
    expect(triage).toMatch(/an in-conversation brief from `ce-plan`/)
    const intake = await readRepoFile("skills/ce-work/references/work-intake.md")
    expect(intake).toMatch(/Unless `ce-plan` already sized this prompt in this session/)
  })
})

describe("ce-work out-of-repo unit completion (#1574)", () => {
  test("implementation loop does not treat a clean tree as not-started for external deliverables", async () => {
    const loop = await readRepoFile("skills/ce-work/references/implementation-loop.md")
    expect(loop).toContain("out-of-repo state")
    expect(loop).toContain("no git-derived completion signal")
    expect(loop.indexOf("out-of-repo state")).toBeLessThan(
      loop.indexOf("If the unit's entire completion signal is repository-derived"),
    )
    const docs = await readRepoFile("docs/guides/ce-work.md")
    expect(docs).toContain("no git-derived completion signal")
  })
})
