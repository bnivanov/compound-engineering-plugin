---
name: ce-code-review
description: "Review a diff or PR with dispatched reviewer personas, confidence-gated findings, and the standards the repo itself declares. Use before opening a PR, when asked to review a change, or when asked to apply this review's findings locally. Not for feedback already left on a PR; that is ce-resolve-pr-feedback."
argument-hint: "[mode:agent] [apply:local] [blank to review current branch, or provide PR link]"
---

# Code Review


## Artifact Root

<!-- ce-docs-root:start -->
**Resolve the CE artifact root `<root>` before composing any artifact path.**

- **Read** `docs_root` from `<repo-root>/.compound-engineering/config.yaml` only (`<repo-root>` = `git rev-parse --show-toplevel`). Do not read it from `config.local.yaml`. Unset -> `<root>` is `docs`, exactly as before.
- **Validate** a set value: a repo-relative directory whose real, symlink-resolved path stays inside the repo and is neither the repo root nor under `.git/`. Otherwise stop with an error naming `docs_root` and the value -- never fall back to `docs`.
- **Use** `<root>` as the sole artifact location: create it if absent, compose each path as `<root>/<subdir>` with this skill's own subdirectory, and never also read `docs`.
<!-- ce-docs-root:end -->

**Agent lifecycle.** Collect terminal outcomes, including failures, before cleanup. Close or release review-owned agents when the harness provides caller-owned cleanup, before refilling slots, advancing stages, or returning. Do not message completed agents with no remaining work. Do not infer released capacity from completion or interruption, or invent cleanup operations.

## Execution spine

Follow these steps in order; the references supply the detail but never change the order. Each reference named below is a required read for its step: load it before doing that step's work.

1. Read `references/modes-and-output.md` first. It settles what the arguments mean, which argument conflicts stop the run before any reviewer is dispatched, whether the quick-review short-circuit applies, and what this invocation returns.
2. **Stage 1.** Read `references/scope.md` and resolve the reviewed diff, the scope mode, and the deterministic scope signals.
3. **Stage 2.** Read `references/intent-and-plan.md`, write the intent summary every reviewer receives, and discover the plan Stage 6 verifies requirements against.
4. **Stage 3.** Read `references/persona-catalog.md` and `references/select-and-route.md`, then select the risk-driven reviewer roster, discover applicable standards paths, and bind the adversarial route.
5. **Stage 3d.** When adversarial is selected for a local reviewed tree, run the independent `reviewer` pass that `references/cross-model-review.md` defines, **before any local persona dispatch**. Dispatch it through the host `task` tool (`agent: reviewer`). Invoking this skill is itself the authorization for that pass. Do not ask the user to confirm a second time. An explicit user prohibition on a separate read overrides it, as does a checkout that sets `cross_model_review_mode: off` with no live opt-in. This pass's only skip key is `cross_model_review_mode`. There is no shell worker. A started separate read replaces the local adversarial persona for this run.
6. **Stage 4.** Read `references/dispatch-reviewers.md`. Dispatch the materialized local roster as one foreground concurrent batch sized to the host's active-agent cap. Every successful launch is collected when its terminal outcome is in hand: consume valid compact returns, classify a terminal tool error or malformed output as a failed reviewer, and keep launch receipts uncollected. Use the host's blocking collection capability for asynchronous receipts; a terminal outcome may arrive as the call's return, a blocking wait's return, or a host-delivered terminal message that names the launch and carries its payload; a progress update is not one. Do not synthesize until every successful launch is collected. If launched work cannot be collected reliably, stop all launched agents before returning the failure result, and never end the turn on progress to await it. Detaching local review into a polled background job is forbidden.
7. **Stages 5 and 6.** Once the reviewer returns are ready, read `references/finish-review.md`. Collect the reviewer-agent return once, run the documented findings mechanics, and run every validator the reference selects; only then return the report. Never synthesize directly from raw reviewer artifacts. In the multi-agent path, emit only this skill's report: do not also invoke a harness-native findings or reporting tool, which belongs to the quick-review short-circuit alone.

## Operating principles

- **Report-only by default; never push.** A bare `ce-code-review` invocation produces findings and does not apply them. Entering the apply stage requires `apply:local`, or an explicit user request in the invoking prompt to apply or fix this review's findings; a deprecated `mode:autofix` token is neither. `mode:agent` never mutates the tree, even when nested inside a workflow that later applies findings. Never push, open PRs, or file tickets in any mode.
- **No blocking prompts.** Never use the `ask` tool or other blocking question tools. Infer intent, plan, and scope from explicit tokens, git state, PR metadata, and conversation. Note uncertainty in Coverage or the verdict -- do not stop to ask.
- **Explicit mutations only.** Never run `gh pr checkout`, `git checkout`, `git switch`, or similar branch-switch commands. Passing a PR number, URL, or branch name selects **review scope**, not permission to mutate the working tree. Uncommitted work can only be reviewed from the checkout that holds it, so to review it on a feature branch, stay on that branch (or check it out yourself) and pass `base:` or no target.
- **Report outcomes, not machinery.** What you show the user is about the review: what is being examined, which coverage is included and the one-line reason for each conditional lens, the independent reviewer pass, and the findings. Open the report with the verdict and the one next action in plain language, then the findings. Name what the user would recognize — a PR number, a reviewer's concern, a peer model — rather than this skill's plumbing, whose internal labels, dispatch bookkeeping, and setup narration stay out of user-facing text. Never claim more about the peer than its receipt attests. This governs *what* you surface and suppress, not the wording; use your own voice.

## Task Visibility

For the multi-agent path, once the review scope is resolved, use the platform's task-tracking capability when available to show a short user-facing view derived from the execution spine. Track review outcomes, not individual personas, setup mechanics, or tool calls; add conditional work only when its gate fires, and update the view at meaningful transitions. If no task-tracking capability is available, continue with the normal progress and final report without simulating a task list in chat.
