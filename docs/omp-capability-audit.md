# OMP Capability Audit (Slice 0 — program baseline fd8abda7)

**Audit date:** 2026-09-14 · **Host:** oh-my-pi (omp) v18.1.21 (CLI-reported) · **Method:** host docs (`omp read omp://…`, 131 files), CLI surface (`omp --help`, subcommand help), and executed probes — in that source-of-truth order. Repo grep is cited only as in-repo evidence of absence and never as host absence (plan R3/KTD2).

**Primary sources consulted (all via `omp read omp://…` on 2026-09-14):** `hooks.md`, `extensions.md`, `skills/authoring-hooks.md`, `compaction.md`, `skills.md`, `tools/task.md`, `task-agent-discovery.md`, `slash-command-internals.md`, `context-files.md`, `settings.md`, plus `omp --help`.

This record updates the older `docs/specs/omp.md` (last verified against omp 17.2.9, 2026-08-05); where the two differ, this file reflects v18.1.21 and wins for program decisions.

---

## R3(a) — Full lifecycle-hook surface, with registration mechanisms

**Answer:** OMP exposes one unified registration mechanism — `pi.on(event, handler)` on either `ExtensionAPI` (current, preferred) or the legacy `HookAPI` — fed by a single event catalog. There is no second registration system; the legacy hook loader and the extension runner share the same event names and the same discovery pipeline (hook factories under `.omp/hooks/pre|post/` are loaded *as extensions*).

Registration mechanisms, enumerated:

1. **Extension module factory** (preferred): a TS/JS module default-exporting `(pi: ExtensionAPI) => void`, loaded from `.omp/extensions/`, plugin extension entry points, or `--extension`/`-e` paths (`omp://extensions.md`).
2. **Hook factory** (legacy alias): same factory shape over `HookAPI`; discovered only from `<cwd>/.omp/hooks/pre/*.{ts,js}` and `<agentDir>/hooks/pre|post/*.{ts,js}` — a file placed directly in `hooks/` is silently not discovered (`omp://hooks.md`). `--hook` is treated as an alias of `--extension` at the CLI.
3. The repo's one registration precedent, `.pi/extensions/compound-engineering.ts`, subscribes only to `resources_discover` (confirmed by read of that file, 2026-09-14) — and OMP docs state `resources_discover` is implemented in `ExtensionRunner` but **has no `AgentSession` callsites** in current code (`omp://extensions.md`, `omp://hooks.md`); the extension is effectively inert on omp.

Full event catalog (`omp://extensions.md` "Event surface", cross-checked `omp://skills/authoring-hooks.md`):

| Lifecycle area | Events |
|---|---|
| Session lifecycle | `session_start`, `session_before_switch`/`session_switch`, `session_before_branch`/`session_branch`, `session_before_compact`/`session.compacting`/`session_compact`, `session_before_tree`/`session_tree`, `session_shutdown` |
| Prompt / turn lifecycle | `input`, `before_agent_start`, `before_provider_request`, `after_provider_response`, `context`, `agent_start`/`agent_end`, `session_stop`, `turn_start`/`turn_end`, `message_start`/`message_update`/`message_end` |
| Tool lifecycle | `tool_call` (may block or revise input), `tool_result` (may patch content/details), `tool_execution_start`/`tool_execution_update`/`tool_execution_end` (observability), `tool_approval_requested`/`tool_approval_resolved` (observability) |
| Reliability / runtime | `auto_compaction_start`/`auto_compaction_end`, `auto_retry_start`/`auto_retry_end`, `ttsr_triggered`, `todo_reminder`, `goal_updated`, `credential_disabled` |
| MCP | `mcp_notification` |
| User command interception | `user_bash`, `user_python` |
| Extension-only (no HookAPI) | `tool_execution_*`, `input`, `user_bash`, `user_python` |
| Inert | `resources_discover` — typed and emitted, zero `AgentSession` callsites |

Notable behaviors with program consequences:

- **`session_stop`** is the "Stop hook" candidate the plan named: main-session only, awaited before settle, may continue with `{ continue: true, additionalContext }` or block with `{ decision: "block", reason }`, capped at 8 consecutive continuations, never fires for task/subagent sessions, and defers while agent-owned background jobs are pending (`omp://extensions.md`).
- **Pre-tool interception** is `tool_call`: any handler returning `{ block: true }` blocks execution (reason becomes the tool error); a throwing handler fails closed; a non-blocking handler may rewrite the tool's execution `input`. For model-issued calls it fires at arg-prep time in the agent loop, so a revision is seen by scheduling, the persisted assistant message, and the approval gate (`omp://extensions.md`, `omp://hooks.md`).
- **Known non-events:** eval-prelude host-bridge calls (`browser.open`, `tab.run`, direct `computer` helpers) do not emit `tool_call`/`tool_result` (`omp://hooks.md`).
- **Prompt-submit** maps to `input` (user prompt interception) plus `before_agent_start` (inject a message before the turn).

**Probe executed (ModelFieldProbe, 2026-09-14):** a dispatched task subagent ran to completion through the live `task` tool; its session JSONL records per-assistant `model`/`provider` fields (see R3b), and the dispatch/return cycle exercised the documented task lifecycle end to end — no hook fired on worker return in a way visible to the parent, consistent with `session_stop`'s "never fires for task/subagent sessions" doc claim.

## R3(b) — Does task dispatch carry a per-spawn model field?

**Answer:** **No — the no-per-spawn-model-field claim is still true on omp v18.1.21, and is no longer merely OMP-17-era hearsay: it is current host-doc fact.** But the conclusion is nuanced: the *wire schema* has no model field, while *agent definitions* do — so per-spawn model routing exists, one indirection up.

Evidence:

- **Wire schema** (`omp://tools/task.md`, "Inputs"): a task item is `{ name?, agent?, task, effort?, outputSchema?, schemaMode?, isolated? }` — there is no `model` field, conditionally exposed or otherwise. `SingleResult` results expose `model` only as read-only metadata (`modelOverride`, `resolvedModel`), never as an accepted input.
- **Executed probe (ModelFieldProbe, 2026-09-14):** dispatched a task item carrying a `model` field through this harness's live `task` tool. The spawn succeeded and completed ("OK", 38.7 s) — the parent accepted the call without schema rejection — but the child session JSONL shows the model actually used was the session default (`glm-5.3-flash` / provider `opencode-go`), not the requested string. The unknown field was ignored, not honored: direct confirmation that no per-spawn model field reaches the executor.
- **Where model routing actually lives** (`omp://tools/task.md` flow step 7; `omp://task-agent-discovery.md` "Model and structured-output precedence"): precedence is (1) `task.agentModelOverrides[agentName]` setting → (2) the agent frontmatter's prioritized `model` list (a single selector, CSV, or array, tried in order, with `@role` aliases expanded through `modelRoles`) → (3) the parent session's active/default model. A shared eval bridge can inject an invocation-local override, but "the task wire schema does not expose that field."
- **Adjacent per-spawn knobs that do exist:** `effort` (`lo|med|hi`) appears on the wire only when `task.enableEffort=true` (default off); prewalk can hand off to a cheaper model at first edit; `task.agentServiceTierOverrides` handles service tiers per agent.
- **Program consequence (R9):** tiered routing for the fresh-verifier gate is expressible only by defining an agent (e.g. a `.omp/agents/fresh-verifier.md` with a `model:` frontmatter list), not by passing a model at dispatch time. Since the repo pins "no new config keys: `modelRoles`/`task.agentModelOverrides` do not exist in this repo" (plan R9), the verifier runs on the session model with structural separation, carrying an `independence: structural-only` label — unless the gate ships its own agent file, which is an agent *definition*, not a config key.

## R3(c) — Does OMP lazily load per-skill context?

**Answer:** **Yes — lazy on invocation, confirmed by host doc and probe.** OMP eagerly loads only skill *metadata* (name + description) into the system prompt; skill *bodies* are loaded on demand.

Evidence:

- Host doc (`omp://skills.md`, "Skills are … exposed to the model as"): "lightweight metadata in the system prompt (name + description)", "on-demand content via the `read` tool against `skill://…`", optional `/skill:<name>` commands. There is no setting that eagerly injects skill bodies; `hide: true` still keeps only metadata, and subagents receive the same discovered-skills list with "no per-task skill pinning override."
- **Executed probe (2026-09-14, `omp --no-session --mode=json` in a scratch dir):** asked omp "Output NOTFOUND unless a skill named ce-work is visible; if visible output its description verbatim." The model answered **from system-prompt metadata alone** — it recited the `ce-work` *description* ("Execute a plan or concrete work prompt end-to…") correctly while having no access to the body (the JSONL transcript contains the description string only inside the assistant's own echo; no body text appears anywhere before a `read` call). A follow-up probe in the same scratch dir had the model call `read` on `skill://ce-work`, and the tool result then returned the actual SKILL.md content — content arrives at the moment of `read`, not before. (The probe model's confirm-first rule intercepted the final print, but the read result in the transcript is the evidence that matters.)
- Program consequence (R15): re-injection post-compaction has a real gap to fix — a compaction that drops the active skill's body loses it entirely; metadata-only exposure does not restore it. The mechanism is not deferred-with-reason on lazy-loading grounds.

## R3(d) — Does OMP dedupe capability names across sources, first match wins?

**Answer:** **Yes on both paths — with different, documented precedence orders per path.**

- **Skills (user-invocation path)** (`omp://skills.md`): dedup key is skill **name**, first wins by provider priority: `native` (100) → `omp-plugins` (90) → `claude` (80) → `claude-plugins`/`agents`/`codex` (70, registration order) → `opencode` (55) → `github` (30) → `omp-managed` (5, dead-last by design). Custom-directory skills merge after provider skills and override same-named default-path provider skills; among custom directories the first same-named wins; identical files dedupe by realpath; later collisions emit warnings. Authoring guidance states it outright: "Avoid duplicate skill names across sources; first match wins by provider precedence."
- **Task agents (agent-dispatch path)** (`omp://task-agent-discovery.md`, "Merge and collision rules"): discovery uses **first-wins dedup by exact `agent.name`** (case-sensitive) across: project `.omp/agents` → user `.omp/agents` → OMP extension-package `agents/` roots (CLI `--extension` → project settings → user settings → installed npm/link plugins) → Claude marketplace plugin roots → bundled agents. Lookup is exact-name linear `find`, so the dedup winner is the dispatch winner.
- **Slash-command surface** (`omp://slash-command-internals.md`): `buildAvailableSlashCommands(...)` is likewise first-wins: built-ins → skill commands → extension commands → TS/MCP custom commands → file commands; built-in names and aliases are reserved.
- **Executed probe (2026-09-14):** a scratch project defined a shadow `skills/ce-work/SKILL.md` (same name, different description: "DEDUP-PROBE shadow copy from custom dir"). Headless `omp --no-session --mode=json` in that directory: the system prompt still carried the *original* fork description (the `skills.md` doc's provider-precedence rule — the CE plugin's `omp-plugins` provider wins over the scratch custom-dir scan for a default-path provider skill); `skill://ce-work` resolution via a live `read` call returned the original SKILL.md, not the shadow. One observed winner per name on both the metadata and the `skill://` resolution path. Caveat honestly recorded: the probe model's confirm-first behavior prevented a clean final-text print, so the decisive evidence is the transcript's tool result and prompt metadata rather than the model's prose.
- Program consequence (R13): the claim is verified on both paths; the name-shadowing authoring rule may be codified as planned in `docs/solutions/skill-design/portable-agent-skill-authoring.md`, noting that "first" means *provider-priority first* (skills) and *discovery-order first* (agents), not a single global rule.

---

## Mechanism × required-hook × fallback

| Mechanism (plan ref) | Required hook / capability | Audit verdict | Fallback if hook were missing |
|---|---|---|---|
| Fresh-verifier acceptance gate in lfg (R9) | Per-spawn model field on task dispatch (for tiered routing); task dispatch + `agent:` naming (for a fresh-context verifier agent) | Task dispatch exists; **no wire-level model field** (R3b). A verifier agent can be defined in frontmatter, but the repo pins no-new-config-keys, so routing stays session-model | Port proceeds with structural separation only: fresh context, no implementation history, `independence: structural-only` label through to the PR body. A same-family re-read is never presented as cross-model assurance |
| Hook-enforcement: proofpunk UNVERIFIED-never-PASS contract (R11) | A pre-return or pre-continue enforcement point at the orchestrator envelope; candidate hooks: `session_stop` (main-session, `{ decision: "block", reason }`) and `tool_call` (pre-exec block) | **Both hooks exist.** `session_stop` never fires for task/subagent sessions — exactly matching KTD4's orchestrator-envelope placement (a per-worker hook would promote unverified work) | Not needed — hooks confirmed. On host regression: blocked-with-reason in this record + `docs/upstream-sync.md`; interim fallback is envelope review text, never a per-worker hook |
| Hook-enforcement: planning-with-files plan re-injection (R11) | An injection point that can re-add plan context; candidate hooks: `context` (per-LLM-call message rewrite) and `session.compacting` (inject `context[]`) | **Both exist** (`omp://extensions.md` event catalog; `omp://compaction.md`) | Not needed; fallback would be the existing approved-plan reference handed to subagents (omp already does this), recorded as approximation only if hooks regressed |
| Hook-enforcement: SHA-256 tamper attestation (R11) | Enforcement at envelope emission reusing `source_digest`/`plan_checkpoint`; needs a detect-and-block point: `session_stop` block decision | Exists (`session_stop` `{ decision: "block", reason }`, awaited before settle); detect-and-block, never silent re-baseline, no parallel hash file | Not needed; a failure of `session_stop` would be blocked-with-reason with flip condition "session_stop restores decision:block" |
| Deterministic stop gate (R11, planning-with-files) | `session_stop` continuation cap must allow a bounded hold; blocked-with-recovery path required | Exists with the exact shape R11 requires: capped at 8 consecutive continuations, `{ decision: "block", reason }` supported; a gate that cannot pass environmentally emits blocked-with-recovery instead of holding | N/A (confirmed); on host regression, record blocked-with-reason with flip condition "session_stop restores decision:block" |
| pstack plan-verify nudge (R12) | A suitable completion event surface for interactive standalone completion only | **`session_stop` fits**: main-session only, never fires for task/subagent sessions, defers while background jobs run — matching the "fires only on interactive standalone completion" constraint. A report-only nudge needs no block decision | If judged unsuitable at port time: blocked-with-reason in this record and the sync record, flip condition "a user-visible interactive-completion event with pipeline exclusion" |
| Name-shadowing authoring rule (R13) | Name-dedup across sources on **both** user-invocation and agent-dispatch paths | **Verified on both paths** (R3d): skills dedupe first-wins by provider priority; agents dedupe first-wins by discovery order; slash commands first-wins | N/A (confirmed); a negative result would have recorded blocked-with-reason and left the `ce-` prefix convention unvalidated by the audit |
| Post-compaction skill re-injection (R15) | Compaction hook: `session_before_compact` (cancel / custom payload), `session.compacting` (inject `context[]` into `<additional-context>`, override `prompt`, `preserveData`), `session_compact` (post-notification) | **All three exist** (`omp://compaction.md` "Extension and hook touchpoints" + event catalog). Lazy loading confirmed (R3c), so there is a real gap: compaction drops the active skill body and only metadata remains | Hook path confirmed, so the port is live: re-inject only the active skill plus artifact root via `session.compacting`'s `context[]` return (KTD10 bounding). If OMP someday retained bodies eagerly, the mechanism flips to deferred-with-reason ("nothing to fix") |

**Blocked-with-reason entries resulting from this audit: none.** Every mechanism above finds its required surface in omp v18.1.21. The only negative finding (no wire-level per-spawn model field) lands on R9, whose plan already specifies the structural-separation fallback as the primary path.

**Flip conditions to re-check at each consuming slice:** OMP version bump (this audit pins v18.1.21); `resources_discover` gaining `AgentSession` callsites (would make the repo's existing extension registration live); `task` wire schema gaining a `model` field (would unlock R9 tiered routing).
