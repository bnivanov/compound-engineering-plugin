# Pre-ship quality tail (LFG steps 3–6)

`ce-code-review` is review-only. LFG applies eligible fixes itself, then commits.

## The shipping precondition, in these steps

A missing remote is a terminal local-only state, not an error: never retry a push or hunt for a remote. Step 5 still makes every commit it calls for; only the pushes and the PR-side records drop. With no PR to carry the residuals, step 6 files them as tracker tickets and the DONE report states the rest — never a committed file nobody will read.

## Step 3 — simplify before review

Simplification runs before review so the code-review in step 4 covers the simplified code. Let `ce-simplify-code` resolve the branch-diff scope itself; it preserves behavior and runs the test suite. Pass the plan path from step 1 as structure-pin context, not as the simplification scope (the branch diff remains the scope), with a one-line constraint: `session-settled:`-labeled KTDs are structure pins the simplification must preserve (deliberate duplication stays duplicated).

Do not commit in this step. `ce-simplify-code` leaves its changes in the working tree; step 4's review scopes the working tree (uncommitted changes included), and step 8's `ce-commit-push-pr` commits whatever remains. Committing here would sweep any still-uncommitted `ce-work` edits into a misleading `refactor` commit and could stall on a tree that never goes clean.

## Step 4 — invoke `ce-code-review`

Load `ce-code-review` from the host catalog's listed path. A host skill named `review` is not this step; do not invent `skills/review/SKILL.md` under this plugin.

```
ce-code-review mode:agent plan:<plan-path-from-step-1>
```

Read the **Actionable Findings** summary and artifact path. Do not pass `mode:autofix`.

Pass the plan file path from step 1 so `ce-code-review` can verify requirements completeness. Also read any findings stamped `settled_conflict` (each names the conflicting KTD). A stamp reaching the report is always evidence-backed — a finding that the settled approach cannot achieve the agreed outcome; synthesis discards preference-grade stamps upstream, so none arrive here. Stamped findings are report-only but must flow into step 6's residual record.

`mode:agent` is report-only **by design** — it surfaces findings but never edits the tree; LFG applies the eligible ones in step 5. When narrating progress to the user, frame this as "review found X -> applied X in step 5," not as "code review did not auto-fix." A report-only review followed by an LFG-applied fix is the intended contract, not a gap.

Capture parsed JSON (`status`, `actionable_findings`, `findings`, `artifact_path`, `run_id`) or the markdown Actionable Findings section. If `status` is `failed`, stop and surface `reason`.

## Step 5 — apply and persist review fixes

### What to apply

Apply a finding in the working tree only when **all** of the following hold:

1. **`suggested_fix` is present** — concrete change shape from the reviewer.
2. **`confidence` is `100`, or `75` with cross-persona agreement noted in the report** — do not apply anchor-50 findings.
3. **The fix is mechanical** — one coherent change, no contract/permission/security posture change, no new public API shape, no behavior change that needs product sign-off.
4. **Evidence still matches the code** at the cited `file:line` before editing.

Do not treat `autofix_class` as permission to auto-apply.

### What not to apply

- `autofix_class: manual` without a clear mechanical `suggested_fix`
- `autofix_class: advisory` — report-only
- `gated_auto` findings that change behavior, contracts, auth, or permissions
- Anything that needs a design conversation

### Execution

1. Filter `actionable_findings` (or markdown Actionable Findings) with the bar above.
2. Apply eligible fixes in the working tree in severity order (`#` stable from the review).
3. Run targeted tests when `requires_verification: true` on any applied finding.
4. If `git status --short` shows changes, stage only review-driven files, commit `fix(review): apply review findings`, and push before step 6 **when a remote is configured** (per LFG's shipping precondition). To push: if an upstream exists, run `git push`. If no upstream exists but a remote is configured (common on a fresh feature branch), resolve a writable remote dynamically: prefer `origin` when present, otherwise use `git remote` and choose the first configured remote. Then run `git push --set-upstream <remote> HEAD`. If there is no remote at all, do not push — the local commit suffices. If no eligible fixes were applied, note explicitly and skip commit.

## The fresh-verifier acceptance gate — fired after step 5, held for step 8

An agent that never saw the implementation now gates acceptance. Dispatch it when step 5's apply-and-commit is settled and before the residual handoff; `references/shipping-tail.md` consumes the receipt at the start of step 8, so a BLOCK halts shipping. `references/work-return.md` stays unchanged: its receipt certifies the step-2 return, which is too early to certify the post-fix tree, so the verifier receipt extends its field inventory instead of amending it.

**Dispatch with fresh context and no implementation history.** Dispatch one verifier as a fresh `task` agent. Its prompt carries only the plan path from step 1, the branch-diff scope — the same scope step 4's review read, committed and working-tree changes together — and the receipt contract below. It never receives the implementation transcript, ce-work's return, the review findings, the applied fixes' history, or LFG's conversation: it re-derives acceptance from the plan artifact (its Verification Contract, per-unit Verification fields, Definition of Done, and Scope Boundaries) and the tree, re-running the plan's named verification commands where they are runnable here, and returns the verifier receipt.

**Serving and independence.** omp v18.1.21's `task` wire schema exposes no per-spawn model field (the audit's R3b finding), and this repo pins no new config keys, so the verifier runs on the session model — there is no tiered routing to a cheaper tier. The receipt records the audit's actual finding, not an aspiration: `serving_mode: session-model` and `independence: structural-only`, meaning fresh context and no implementation history are the only separation and this is a same-family re-read. No consumer may present it as cross-model or independent-model assurance — that presentation is the trust failure this label exists to prevent. (It is categorically weaker than `ce-code-review`'s cross-model receipt, whose `independence_verified: true` requires cross-family attestation.)

**The verifier receipt.** Required on every verdict, extending `work-return.md`'s field inventory:

- `verdict` — `PASS` or `BLOCK`; nothing else is valid.
- `u_ids_scoped` — the plan units the verdict covers, derived from changed files against the plan's Implementation Units. A changed file outside every declared unit is a BLOCK, not an out-of-scope PASS.
- `evidence_pointers` — what the verifier actually checked: the plan sections read, the diff scope, the verification commands re-run with their results, and the per-unit observations behind the verdict.
- `serving_mode` — `session-model`.
- `independence` — `structural-only`.

A BLOCK receipt also carries `blockers` — one entry per failed check: unit, what failed, where — and `recovery_path` naming the one bounded rework below. A missing or malformed receipt fails closed: stop blocked the same way; the pipeline never ships without a receipt.

PASS means every scoped unit's acceptance holds against the tree as it stands: each scoped unit's named verification checks hold, behavior-changing units carry verification evidence, and no files outside declared units changed. BLOCK means any named check fails or cannot be demonstrated, or the scope boundary is breached.

**The one bounded rework.** On BLOCK, either stop the pipeline as blocked with the receipt, or invoke `ce-work` one more time in recovery mode with the same plan path, threading the BLOCK receipt's blockers — the same one-recovery-invocation precedent `references/work-return.md` owns; this is evidence and repair reconciliation on the already-implemented work, never a fresh dispatch — then re-dispatch the verifier once against the repaired tree. A second BLOCK verdict, or a decline to rework, stops the pipeline as blocked with the latest receipt; there is no second rework and no hold. If the verifier itself cannot run (host capability missing, plan artifact unreadable), stop blocked-with-recovery naming the environmental gap — never an infinite hold.

The PASS receipt is held for step 8; `references/shipping-tail.md` names the consumption seam and renders the independence label into the PR body.

## Step 6 — residual handoff

Residuals are actionable findings **not** applied in step 5 — not leftovers from in-skill autofix. Use the Actionable Findings summary / artifact from step 4.

Two further triggers also require step 6, both outside the apply path: step 4 emitted any `settled_conflict`-stamped findings — always evidence-backed when present, since preference-grade stamps are discarded upstream before the report — or step 2's return carried proceeded-and-flagged `settled_decision_conflicts` entries. They are the divergent class and must be made durable here.

A residual at this point is undecided, not accepted debt: step 5 declined it because it needs judgment, and the pipeline never merges, so the human reviewing the PR supplies that judgment — fix it in this branch, dismiss it, or file it to carry past merge. The record therefore goes where that reviewer already looks, the PR body, and the pipeline files no tickets on its behalf; one ticket per finding, decided by nobody, is how a run of small nits floods a tracker.

**When a PR will exist (a remote is configured):** compose a `## Unapplied review findings` section, one checkbox bullet per item so a human ticks it when they close it:

- For each unapplied actionable finding: `- [ ] <severity> — <file:line> — <title>`, plus the reviewer's `suggested_fix` on the next line when present.
- For each `settled_conflict`-stamped finding from step 4: the same bullet plus the conflicting KTD the stamp names — each stamp marks a finding that the settled approach cannot achieve the agreed outcome, and the bullet stands even though the finding is report-only.
- For each proceeded-and-flagged `settled_decision_conflicts` entry from step 2: a bullet with the KTD, the evidence, and how it was routed.

Close the section with the review run context (`run_id`, `artifact_path`). Hand the section to step 8 as PR-description context; `references/shipping-tail.md` names the seam. Step 8 writes the body, so nothing here edits the PR directly, and nothing posts a PR comment for these.

**When no PR will exist (no remote):** load `references/tracker-defer.md` in **non-interactive mode** with the same items, collect `{ filed: [...], failed: [...], no_sink: [...] }`, and state every `failed` and `no_sink` item verbatim in the DONE report — the report is the only record those get.
