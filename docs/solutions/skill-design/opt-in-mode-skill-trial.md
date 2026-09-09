---
title: "ce-mode stickiness held on the second bare request in print mode; compact is unmeasured, so degrade to invoke-per-task"
date: 2026-09-09
category: skill-design
module: skills/ce-mode
problem_type: design_pattern
component: development_workflow
severity: high
applies_when:
  - Deciding whether ce-mode may stay a sticky-within-session convention or must be invoked per task
  - Reading Observation C/D from the opt-in mode plan after a print-mode probe
  - Comparing omp convention-stickiness to Cursor Custom Mode / pstack poteto-mode
tags:
  - ce-mode
  - stickiness
  - opt-in
  - skill-eval
  - invoke-per-task
  - pstack
  - compact
---

# ce-mode stickiness held on the second bare request; compact is unmeasured, so degrade to invoke-per-task

**Verdict: DEGRADE to invoke-per-task.** Observation C held 3/3 on omp 18.1.16 print mode. Observation D was not observed. The KEEP (sticky-within-session) verdict is available but unclaimed until D is measured interactively.

This is the U3 kill-gate record for `skills/ce-mode`. The mapping below was closed before the runs. Do not renegotiate it from these results.

## Pre-registered mapping

- C holds 0/3 → **KILL** (delete `skills/ce-mode/` and its test-list entry).
- C holds 1–2/3 → **DEGRADE** to invoke-per-task.
- C holds 3/3 and D at least 2/3 → **KEEP** sticky-within-session.
- C holds 3/3 with D unmeasured → **DEGRADE** to invoke-per-task (boring choice). KEEP stays available but unclaimed.

Measured: C = 3/3, D unmeasured → DEGRADE.

An armed, correctly-routed response must name the matched playbook, a gate, and the owning skill, then read that playbook at match time. Build: `references/build.md`, a gate (G1), owning skill `ce-plan` (or `ce-brainstorm` when scope is unstated). Fix: `references/fix.md`, route to `ce-debug`.

## Method

Three complete A+B+C runs, strictly serial, each in a brand-new scratch session. Probe cwd was a fresh `mktemp -d "${TMPDIR:-/tmp}/ce-mode-probe-XXXXXX"` project (`package.json` + `index.js` exporting `add`) so repo `AGENTS.md` did not pollute the session. Sessions were saved (no `--no-session`). `--session-dir` inside the scratch tree made `omp -c` continue that probe, verified by the session JSONL accumulating the prior user turns (A, arm, build, fix = four user messages).

Harness: omp 18.1.16 print mode (`-p`). Model pin: `xai-oauth/grok-4.6` (the profile's coding/task role). The profile default `opencode-zen/muse-spark-1.3-contributor-free` was not used; this record is grok-4.6 on omp, not a host-matrix.

Plugin: `omp plugin link "$PWD"` at HEAD `82e7bdba2ec65b0f3a6b35197a3bff12329a8ec1` before the first official run. Restore after the last run: marketplace `compound-engineering@compound-engineering-omp` (3.24.1-omp.7, user) with an empty npm plugin list.

**Incantation that worked.** `omp -p "/skill:ce-mode"` does **not** expand the slash command into a harness-injected skill body. The user message that reaches the model is the literal string `/skill:ce-mode`. The model then `read`s `skill://ce-mode`; the kernel arrives as a tool result. That is the user-invocation path in print mode. Blank arguments arm. Confirmations looked like: "Armed. Later requests in this session match a playbook; gates G1–G5 hold until `/skill:ce-mode off`."

B prompt: `add a retry-with-backoff helper to this project`. C prompts (no re-invoke): run 1 `this test fails: retry helper does not wait between attempts`; run 2 `this test fails: retries fire immediately with zero delay`; run 3 `this test fails: the helper swallows the last error after retries are exhausted`. `--max-time` cut runs 2 and 3 during `ce-plan` after the routing lines were already in the JSONL; grading used those lines, not the truncated tail.

## Runs

### Run 1

**A — absent.** The model listed the session `<skills>` names and said it could invoke all of them. `ce-mode` was not in the list (opt-in by absence, not present-but-not-invocable). Decisive lines:

> All of these are in this session’s `<skills>` list. I can invoke every one of them (matching skill → read `skill://<name>`). None are user-only. Not invoking any now.

The list included `ce-verify`, `ce-work`, `ce-plan`, `ce-debug`, `lfg`, and the rest of the visible catalog. No `ce-mode`.

**B — pass.** First visible line before any tool, then gate + owning skill before implementation:

> New capability → `references/build.md`.

> User can state done — skip brainstorm. Invoking `ce-plan` (G1).

First tool after the playbook line was `read path: skill://ce-mode/references/build.md`.

**C — pass.** No re-invoke. First visible line before any tool, then route:

> Broken, failing, or slow → `references/fix.md`.

> Diagnose (G2): invoking `ce-debug`.

First tool after the playbook line was `read path: skill://ce-mode/references/fix.md`. Next skill read was `skill://ce-debug`.

### Run 2

**A — absent.** Same shape. Decisive lines:

> No project-local skills. Session skills are the 50 names in the prompt. None are marked user-only; I can invoke any of them when they match. Did not invoke any.

The 50-row table has no `ce-mode`.

**B — pass.**

> Matched playbook: `references/build.md`.

> Skipping brainstorm — done is already stated: a retry-with-backoff helper in this project. Next: `ce-plan` (G1).

**C — pass.** `omp -c` continued this session (user turn 4 in the same JSONL).

> Matched playbook: `references/fix.md`.

> Next: `ce-debug` (G2). Reading that skill.

### Run 3

**A — absent.** Decisive lines:

> Skills visible in this session (`<skills>`). None marked user-only. Session rule is: matching skill → I read `skill://<name>` first, so I can invoke all of them.

Table of visible skills, no `ce-mode`.

**B — pass.**

> Playbook: `references/build.md` (new capability).

> Done is stated: a retry-with-backoff helper in this project. Skipping brainstorm. Invoking `ce-plan`.

**C — pass.** Named the fix playbook before tools; the next skill loaded was `ce-debug`.

> Playbook: `references/fix.md` (failing test).

Next tool: `read path: skill://ce-debug`. The following turn said "Reading the investigation workflow, then recalling this failure." and loaded `skill://ce-debug/references/investigate.md`.

### D

not observed — blocked on interactive /compact

Print mode has no `/compact`. This cell is not a pass and is not inferred from B/C holding.

## Linked tree

Linked HEAD: `82e7bdba2ec65b0f3a6b35197a3bff12329a8ec1` (`feat(ce-worktree): add prune route for linked worktrees`).

That tree already contains the other fold-in units' edits, not just `ce-mode`: `ce-verify` (feature-map generator), blast-radius persona, code-lineage-analyst, `ce-dogfood` map consumer, and worktree prune. Observation A listing `ce-verify` as model-invocable is that tree, not a marketplace 3.24.1-omp.7 catalog.

## Host-to-host (this file only)

Measured host: **omp 18.1.16 print mode**, model `xai-oauth/grok-4.6`. Stickiness here is a session-convention: arm injects the kernel as a tool result from a user `/skill:ce-mode`, and later bare turns re-assert the match table from that earlier read plus the re-arm rule.

Not measured: Cursor Custom Mode (`mode: true`), pstack `poteto-mode`, interactive omp `/compact`, or any second model. pstack's sticky mode is a harness primitive this probe never had. Do not treat 3/3 on C as evidence that Cursor would keep the mode across compact, or that a weaker omp default model would re-assert.

A on this host was **absent** from the `<skills>` list (`disable-model-invocation: true` with `skillful` listing). It was not "listed but user-only." Other hosts that surface hidden skills in a picker may show present-but-not-invocable; record that host's A separately.

## Unclaimed KEEP

C 3/3 makes KEEP *eligible*, not claimed. Claiming it requires Observation D on **interactive** omp, three additional fresh sessions, same arm-then-bare-build-then-bare-fix spine, then `/compact`, then a third bare request.

D pass: after compact, the model re-reads `skill://ce-mode` (because the five gates are no longer in context) and still routes (names the matched playbook and the owning skill). D fail: it drops the mode and answers the third request as an unarmed session.

Need D at least 2/3. Until that notebook exists, the floor is invoke-per-task: the user runs `/skill:ce-mode` (or `/skill:ce-mode <task>`) on each request that should be gated. Do not document sticky-within-session as a guaranteed harness mode.

## When to Apply

Before promoting `ce-mode` (U4 playbooks, guide, catalog, `ce-start` row) or deleting it. U4 proceeds on this degrade. A later interactive D notebook that hits 2/3 may claim KEEP and rewrite the guide's stickiness sentence; it does not rewind this print-mode C measurement.

## Related

- Plan: `docs/plans/2026-09-09-1900-feat-opt-in-mode-and-pstack-fold-ins-plan.md` U3.
- Kernel: `skills/ce-mode/SKILL.md` (re-arm rule, match table, G1–G5).
- `docs/solutions/skill-design/strong-models-mask-defensive-skill-fixes.md` — a green run on one strong model is not a host-matrix.
- `docs/solutions/skill-design/paired-old-vs-new-injection-skill-evals.md` technique 10 — compaction-triggered defects are invisible to a full-context cell; that is why D cannot be inferred from C.
