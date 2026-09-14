---
name: lfg
description: "Run the full autonomous shipping pipeline end-to-end, hands-off with no check-ins. Use only when the user explicitly asks to build or ship something autonomously all the way to an open PR, or invokes lfg directly — it pushes and opens a PR without stopping. Not for in-the-loop work where the user reviews each step: use ce-plan, ce-work, ce-debug, or ce-commit-push-pr instead."
argument-hint: "[feature description; optionally assign planning and/or implementation to a model or harness]"
---

CRITICAL: You MUST execute every step below IN ORDER. Do NOT jump ahead to coding or implementation. The plan phase (step 1) MUST be completed and verified BEFORE any work begins.

LFG runs hands-off, from schedulers, loops, and nested orchestrators with no user to answer, so no step stops to ask. The one exception is the upfront routing question `references/stage-routing.md` defines. Before step 1, if `max_run_budget` is set and remaining host budget is below it, stop. If invoked with `mode:supervised` or checkout `lfg_supervised: true`, read `references/supervised.md` before step 1.

Resolve every skill named below against the host's available-skills list and invoke that exact entry; some hosts namespace it (`compound-engineering:ce-plan`), and a short-form guess that is not in the list fails.

Read `references/task-visibility.md` before step 1: it owns the stage-level view this pipeline publishes through the platform's task-tracking capability, the per-step chat narration, and the completion discipline.

## Per-stage routing carriers

Before step 1, judge whether the conversation expresses semantic intent to assign a stage (planning or implementation) to an OMP agent; a plain mention in feature content, quotes, comparisons, or a filename is not an assignment. When one exists, read `references/stage-routing.md` before step 1: only it carries the routable stages, scope resolution, the return-to-caller seam, and the sanitization that keeps routing out of planning and review inputs.

1. **Read `references/plan-brief.md` first**, then invoke the `ce-plan` skill with the sanitized feature request — or the arguments you were invoked with, unchanged, when no routing directive was present — and with the settled-decisions brief that file specifies. Only it carries the artifact-root rule this step's gate reads, the brief's required fields, and the readiness values the gate applies. Pass no `plan_model` carrier.

   GATE: STOP. Stop the pipeline and tell the user why when `ce-plan` reports the task is non-software (LFG requires software tasks), returns any explicit `status: blocked` report (including `settled-decision-invalidated`), or when the plan it wrote fails the readiness check in `references/plan-brief.md`. Blocked status outranks an existing artifact and is never retried. Only absence of both a blocker and a plan file `ce-plan` reported writing this run invokes `ce-plan` again with those same arguments, reusing the composed brief verbatim; never proceed to step 2 without a written plan.


   **Record the plan file path** (it is passed to ce-work in step 2 and ce-code-review in step 4). LFG never launches `/goal` directly; `ce-work` owns goal-mode handling natively and returns control to LFG afterward.

2. **Read `references/work-return.md` first**, then invoke the `ce-work` skill with `mode:return-to-caller <plan-path-from-step-1>`, or with the carrier form from `references/stage-routing.md` when a routing carrier resolved. Only it carries what each return status means, the receipt fields a `status: complete` return must contain, the verification-evidence contract, how `settled_decision_conflicts` route, and the one recovery invocation.

   GATE: STOP. Read the structured return before continuing. Only a valid `status: complete` may advance; every other status or malformed return stops the pipeline.

3. **Read `references/review-followup.md` now**, then invoke the `ce-simplify-code` skill on the branch diff — **skip** only the invocation, never the read, when the change is docs-only (only markdown/docs paths changed) or trivial (roughly under 10 changed lines). That file governs steps 3 through 6, which have no usable form without it: only it carries this step's scope and structure pins, the review read-back, which findings step 5 applies and how they are committed, the fresh-verifier receipt its gate defines, and the residual record step 6 makes durable.

4. Invoke the `ce-code-review` skill with `mode:agent plan:<plan-path-from-step-1>`.

   GATE: STOP. A `settled_conflict`-stamped finding whose evidence is invalidating — the settled decision cannot work: infeasible, wrong-thing, or destructive — stops the pipeline as blocked, with the finding reported, before the shipping precondition.


**Shipping precondition (steps 5–9).** Run `git remote` once before the shipping steps. No remote means shipping is local-only: make every commit the steps below call for, but **skip every push, PR create/edit, and CI-watch action**, including step 9 in full.

5. **Apply and persist review fixes** (REQUIRED after step 4, before the residual handoff)

   Execute the apply step of `references/review-followup.md`. Do not proceed to the residual handoff, run browser tests, or output DONE while eligible review fixes remain only in the working tree uncommitted.

   GATE: STOP — the fresh-verifier acceptance gate. Once step 5's apply-and-commit is settled, dispatch the verifier `references/review-followup.md` defines: an agent with no implementation history, judging the post-fix tree against the plan. Hold only a `verdict: PASS` receipt for step 8's consumption. A `verdict: BLOCK` triggers that file's one bounded rework or stops the pipeline as blocked; a missing receipt stops as blocked.

6. **Autonomous residual handoff** — run it whenever anything divergent is left to make durable: an actionable `downstream-resolver` finding step 5 did not apply, a `settled_conflict` stamp from step 4, or a proceeded-and-flagged `settled_decision_conflicts` entry from step 2. Skip only when none of the three exists — `Actionable findings: none.` does not decide it alone.

   Do not prompt the user.

   **Durable record — the PR body.** Compose the residual checklist per `references/review-followup.md`; step 8 renders it. Do not output DONE until the residuals are durable: in the PR body, else (no PR) in tickets or the DONE report. Never block DONE on tracker filing failures.

7. Invoke the `ce-test-browser` skill with `mode:pipeline`.

8. Ship: the goal is the remaining work committed, pushed, and in an open PR whose URL you hold. **Read `references/shipping-tail.md` first** — it governs steps 8 through 10 and opens by consuming the PASS verifier receipt step 5's gate held: a missing or BLOCK receipt stops before anything ships — then invoke the `ce-commit-push-pr` skill with `mode:pipeline branding:on` unless that file routes this run elsewhere. It owns when a project-defined process supersedes that default, and the no-remote substitution.

9. **Watch the PR to CI-decided via `ce-babysit-pr`** (only when an open PR exists for the current branch)

   Detect the PR with `gh pr view --json number,url,state`; if none exists or `gh` is unavailable, skip to step 10. When step 8 already handed off a stack babysit, `references/shipping-tail.md` decides this step — never start a second bare pipeline babysit on the current-branch URL. Otherwise invoke **`ce-babysit-pr mode:pipeline <pr-url>`**, and follow that same file for the returned `{ status, fixes_applied, residuals }`. Do not reimplement CI-watching here.

10. Output `<promise>DONE</promise>` when complete, after the close-out in `references/shipping-tail.md`, which owns the handoff rendering and the next-work offer gate.

Start with step 1 now. Remember: plan FIRST, then work. Never skip the plan.
