# S12 skill-power dogfood

Created: 2026-09-09

What you're getting: one session that walks the S12 CE loop on a tiny product and records whether the skills actually carry a limited-knowledge operator.

What I assumed: scratch repo (not this plugin); novice operator who only follows skill handoffs; OMP-only; no foreign CLIs.

What could go wrong: dogfooding inside this plugin checkout, or launching Codex/Claude "for a second opinion," silently reintroduces the machinery S12 deleted.

Next: after `omp/s12` is on `main`, run this in a fresh OMP session on the scratch repo.

## Problem

S12 rewired CE for OMP-only novices (`ce-start`, `ce-undo`, session-model only, `task` reviewer, OMP `browser`). Unit tests cannot tell whether that loop has power. This runbook is the proof: idea → working tiny product, using only CE skills.

## Assumptions

- Operator has limited product/engineering knowledge on purpose. Do not skip `ce-start`. Do not name a skill until `ce-start` routes there.
- Scratch product lives in a new repo, not `compound-engineering-plugin`.
- Plugin under test is this checkout after `omp/s12` lands on `main` (or the session's repo-local `skills/`). Do not install stock EveryInc CE.
- Session model stays whatever the host is serving. Do not pin `plan_model` / `brainstorm_model`. Do not start `codex` or `claude` panes.
- `ce-dogfood` is for a product UI diff. Use it only in Phase 4 against the scratch app, never against this plugin.

## Product under test: Shelf

One local web page. Add a book (title). Mark it unread / reading / done. Persist in `localStorage`. No auth, no backend, no deploy.

Why this: small enough to finish in one session; real product choices (what is a shelf vs a TBR list); a visible UI so OMP `browser` and `ce-undo` have something to touch.

Prompt to give `ce-start`, nothing more:

> I want a simple page where I keep the books I own and whether I have read them.

## Phases

### 0. Host

- New empty git repo for Shelf.
- OMP with profile `hermes-jobs` (or the operator's CE-enabled profile).
- Confirm `ce-start` is visible. If not, `/skill:ce-setup` on the scratch repo, then stop if CE still missing.
- Do not `omp plugin marketplace add` stock CE.

### 1. Front door — `ce-start`

Give only the Shelf sentence. Expect a route into `ce-brainstorm` (idea, not a named skill). Fail the run if the agent jumps to `ce-work` or writes code.

### 2. Product — `ce-brainstorm`

Stay through a requirements-only plan. Fail if it offers model elevation or writes HTML-and-markdown both. Capture the plan path.

### 3. How — `ce-plan`

Enrich that same plan. Fail if it invents a second plan file or a `plan_model` carrier.

### 4. Build — `ce-work`

Implement from the plan. Verify by running the page, not by adding tests "so it has tests." If there is a UI, drive it with OMP `browser` (open, add a book, mark done, reload, still there). Fail if the agent installs or uses `agent-browser`.

### 5. Review — `ce-code-review`

Review the scratch diff. Expect a `task` `reviewer` when adversarial applies, receipt independence from host attestation, never a detached peer or shell worker. Apply only attested-independent promotions.

### 6. Undo — `ce-undo`

Make one small unwanted edit, then `/ce-undo`. Expect a confirmation, then restore. Fail if it runs `git reset --hard` without asking, or claims it undid agent edits it did not.

### 7. Debug (only if something is actually broken)

`/ce-debug` on the failing behavior. Fail if it reaches for `agent-browser`. If nothing is broken, skip and record skip.

### 8. Remember — `ce-compound`

One lesson that was not already obvious from the code. Skip if the run produced none.

### 9. Ship the scratch app (optional)

Only if the operator wants a PR on Shelf: `ce-commit-push-pr`. On the plugin repo, do not run LFG unsupervised during this dogfood.

## Pass / fail

The run **passes** when all of these are true:

- Shelf shows at least one book, status can change, reload keeps it.
- Every skill entered was via `ce-start` or the previous skill's handoff.
- Zero foreign CLI launches.
- Zero `agent-browser` / `plan_model` / `brainstorm_model` / detached peer jobs.
- `ce-undo` restored the planted edit.
- A short receipt is written (below).

The run **fails** if the operator had to know CE internals to finish, or if any deleted S12 path came back.

## Receipt

Write `docs/dogfood-reports/YYYY-MM-DD-shelf-skill-power.md` in the **scratch** repo (create `docs/` there). Keep it to:

- Plugin version / git SHA under test
- Skills actually invoked, in order
- Pass or fail per phase
- One paragraph: did the loop carry a novice, or did the operator have to steer?

Do not file that receipt in this plugin repo.

## Out of scope

- Dogfooding this plugin's own Markdown as a web app
- Hitting every CE skill (pulse, ideate, prototype, riffrec, …)
- Marketplace cutover, version bump, SR tag
- Re-enabling peer CLIs "just this once"

## Stop

Stop after the receipt. Do not keep polishing Shelf. Power is proven or not in one pass.
