# Issue Fan-Out (Plan Units → Tracker Issues)

This reference owns the per-unit issue fan-out bridge: turning a plan's Implementation Units into one tracker issue per unit. It is loaded only when the user explicitly selects fan-out at the Phase 5.4 handoff, or when a non-interactive caller supplies explicit standing authority for it. It is never loaded for a plain "Create Issue" selection — that path creates the single plan issue and stops.

The bridge is a handoff step, not a tracker client ce-plan owns: it composes issue titles and bodies and submits them through whatever interface the project's tracker exposes, exactly as the Issue Creation section of `references/plan-handoff.md` does. No scripts, no config keys, no stored credentials.

---

## Gate: interface plus write-approval posture

Fan-out runs only when **both** hold. Check them in order; a failure at either step ends the bridge with a stated reason — never a speculative workaround.

1. **Reachable tracker interface.** Detect the project's tracker and probe reachability the same way the Issue Creation section does: the tracker named by the project's instructions already in context (`project_tracker:` declaration or documented convention; supplementary signals `README.md`, `CONTRIBUTING.md`, `.github/` PR templates, visible tracker URLs), then confirm an invocable interface — connector/MCP tool discovered via the platform's tool-discovery primitive, an authenticated documented CLI, or documented API credentials. A missing binary, env var, or unloaded MCP server is not proof of absence. If no interface is reachable, say so plainly ("no reachable tracker interface for per-unit issues") and return to the handoff options.
2. **Write-approval posture for agent-path writes.** A reachable API is not authorization. Fan-out creates a batch of durable artifacts under the agent's identity, so it additionally requires one of:
   - a documented project convention that authorizes agent-created issues (e.g., the project's instructions or contributing docs state agents may file issues, or a `project_tracker:` declaration paired with such a convention), or
   - explicit in-session authorization: the user selected fan-out through the blocking question (interactive), or the caller's directive explicitly authorized per-unit issue creation (non-interactive — see below).

   If neither holds, decline with the reason and the flip condition: "per-unit fan-out deferred — the project has no documented approval for agent-created tracker issues; it flips when the project documents that convention or the user authorizes this run." Record the deferral in the handoff output; do not fall back to a local issue-plan document unless the user explicitly asks for one.

## Selection and authority

- **Interactive:** after the single plan issue is created (or when the user asks for per-unit issues directly), ask once via the host's blocking question tool already in the current tool list: "File one tracker issue per implementation unit?" Options: `File per-unit issues`, `Skip`. Fan-out fires only on the explicit selection. Never bundle it into the Create Issue default and never re-ask after a Skip.
- **Non-interactive (pipeline / `disable-model-invocation` / goal-driven):** no prompt exists, so fan-out fires only when the invocation itself carries explicit standing authority — the caller's directive names per-unit issue creation (e.g., "file an issue per unit"). A generic "create issues" or "hand off" instruction is not standing authority. Absent it, skip fan-out and note the skip in the returned result.
- Fan-out is additive: the one-plan-issue default is unchanged, and a fan-out run does not recreate it.

## Unit → issue mapping

For each unit in the plan's Implementation Units table (or the plan's equivalent task list), compose one issue:

- **Title:** `<U-ID>: <unit title>` — stable across reruns because the U-ID and title come from the plan, not from session state.
- **Body:**
  - One-paragraph summary of the unit's Goal.
  - Key files and dependencies (the unit's Files / Depends on fields, when present).
  - Test scenarios or the unit's verification note, trimmed to the tracker's body limit.
  - **Link back to the plan:** the plan's absolute path (and repo-relative path when the tracker renders repo links), so every issue points at its source document.
  - **Dedup metadata line** (required, last line of the body): `Source plan: <plan path> · Unit: <U-ID>` — this is the machine-findable identity the rerun check searches for.
- **Labels** (when the tracker supports them): a `ce-plan` or equivalent origin label when the project's label conventions have one; otherwise none — do not invent label taxonomies.

## Idempotency: plan path + U-ID is the dedup identity

Before creating anything, search the tracker for existing issues carrying this run's identity — query for the dedup metadata line (`Source plan: <plan path>`) or, where the tracker lacks body search, the title prefix `<U-ID>:`. Then decide per unit:

- **No match** → create the issue; report `created` with its URL.
- **Open match** → update the existing issue's body in place to the current unit content; report `updated` with its URL. Never create a second issue.
- **Closed match** → skip; report `skipped (closed)` with its URL. Do not reopen — closure is a tracker-side decision the bridge does not override.

A rerun over the same plan therefore produces zero new issues: every unit resolves to `updated` or `skipped`. The identity is stable because the plan path identifies the document and the U-ID identifies the unit within it; a renamed plan file is a new identity (its issues are legitimately new), and a renamed U-ID is a new unit.

## Failure path

When a create/update call fails (API error, auth expiry, rate limit, 4xx/5xx): interactive mode surfaces the failure and asks Retry / Skip this unit / Abort fan-out via the blocking question tool; non-interactive mode records the unit in a `failed` bucket and continues with the rest. Partial results are always reported — `created`, `updated`, `skipped`, `failed` per unit — so the caller sees exactly which issues exist. A failed fan-out never blocks the rest of the handoff; return to the post-generation options (interactive) or include the failure list in the returned result (non-interactive).
