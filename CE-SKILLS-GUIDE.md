# CE Skills — Personal Cheat Sheet

Fork: `compound-engineering` (bnivanov). Authoritative descriptions: `docs/guides/README.md` in the plugin repo; this file is the practical "when do I type what." Descriptions below reflect the description-polish pass (mechanism-first + explicit use-when + sibling routing).

## How skills actually load (mental model)

- At session start, OMP gives the model every skill's **name + one-line description**. Bodies load only when a skill is used. Nothing is "loaded up" wholesale, and nothing is truly "off" — model-visible skills are dormant-but-visible, and the model may auto-invoke one when your request matches its description.
- **Hidden skills** (`disable-model-invocation: true` — currently `ce-mode`, `ce-polish`, `ce-dogfood`, `ce-product-pulse`, `ce-promote`, `ce-retune`, `ce-test-xcode`): the model can neither see-lobby-for nor self-invoke them. Only you trigger them.
- **`ce-mode` changes routing, not availability.** `/skill:ce-mode` (blank) arms the session: every later request must pass through a playbook that *names* the owning skill (build → `ce-plan`, broken/slow → `ce-debug`, ship → `ce-commit-push-pr`, verdict/doc → `ce-pov`/`ce-doc-review`/`ce-brainstorm`) and five gates hold (plan before multi-file build, evidence before done, review before PR, no push/merge without you, artifact or stop at each step). `/skill:ce-mode off` disarms; `/skill:ce-mode status` inspects. Un-armed, default CE behavior applies.
- Arming is **session-scoped**. Fresh session = unprimed (verified: the model won't volunteer `ce-mode`, 3/3). After a **handoff**, prime the new session again. Stickiness across `/compact` is unproven (degrade verdict) — your workflow of handoff + re-arm avoids that gap entirely.
- Descriptions now carry explicit sibling routing ("Use ce-X for that job"), so misroutes between close siblings (commit vs commit-push-pr, debug vs work, pov vs doc-review) should be rarer.

## The core loop (per piece of work)

| Skill | What it does | When you type it |
|---|---|---|
| `/ce-ideate` | Generate many grounded ideas, critique all, rank survivors with reasons | Direction not chosen yet; you want options or surprising angles |
| `/ce-brainstorm` | Turn a vague idea into a requirements-only unified plan via one-decision-at-a-time dialogue | "What should this be?" — before any plan exists |
| `/ce-plan` | Turn a request/requirements/existing plan into an implementation-ready plan (units, test scenarios, confidence check) | Requirements exist; HOW not yet decided |
| `/ce-work` | Execute a plan end-to-end with quality gates | Plan is ready; build it |
| `/ce-compound` | Write learnings into `docs/solutions/` | After solved, verified work worth remembering |

## Around the loop

| Skill | What it does | When |
|---|---|---|
| `/ce-strategy` | Create/update `STRATEGY.md` | Starting a product or changing direction |
| `/ce-product-pulse` | Time-windowed read-only report: usage, perf, errors, follow-ups from configured signals | Periodic health check ("how did launch hour go?") |
| `/ce-sweep` | Sweep feedback sources since last run: acknowledge at source, verify claimed fixes merged, rolling `/lfg`-ready plan | Feedback backlog triage |
| `/ce-compound-refresh` | Audit captured learnings against current code; Keep/Update/Consolidate/Replace/Delete each | Learnings feel stale, duplicated, or drifted |

## On-demand tools

| Skill | What it does | When |
|---|---|---|
| `/ce-pov` | Decisive project-grounded verdict (adoption call, document take, approach pick; consult other models via `oracle`) | You want a call, not options |
| `/ce-explain` | Durable visual teaching artifact — the user actually learns one thing (concept, change, recap) | You want to *understand*, not just ship |
| `/ce-prototype` | Throwaway prototype at the fidelity that answers how it should work/feel/read | Wrong answer would be expensive to unravel |
| `/ce-debug` | Trace failure to root cause: causal chain + file:line evidence; test-first fix when you choose | Anything failing/slow with unknown cause |
| `/ce-code-review` | Diff/PR review with personas, confidence-gated findings, repo-declared standards | Before PRs |
| `/ce-doc-review` | Review a requirements/plan/spec with personas; apply findings in the doc's format | Improving a planning document |
| `/ce-simplify-code` | Refine recently changed code, behavior preserved | After implementation, before review |
| `/ce-optimize` | Measured optimization loop (attribute cost, score variants, keep winners) | A metric must move |
| `/ce-retune` | Measurement-first corpus retune for a new model; refuses without an A/B harness | Model swap degraded a skill corpus |
| `/ce-riffrec-feedback-analysis` | Riffrec recording → structured feedback | Product feedback captured on video |

| `/ce-bakeoff` | Develop 2+ competing solutions to a brief, compare, synthesize the winner | Choosing well needs real alternatives built out, not opinions (use `ce-pov` to judge finished material, `ce-ideate` to find options) |
| `/ce-noslop` | Rewrite/check/draft prose with no AI tells, every source fact intact | Making writing plainer (use `ce-promote` for marketing copy) |

## Git & PR

| Skill | What it does | When |
|---|---|---|
| `/ce-commit` | Local commit(s) with explicit staging; nothing leaves the machine | Just commit; no push |
| `/ce-commit-push-pr` | Commit, push, open PR with a written description (full ship or body-only) | Ship |
| `/ce-babysit-pr` | Watch an open PR across ticks: work review comments, fix CI, honest terminal state | PR should converge without you watching |
| `/ce-worktree` | Isolated worktree: detect existing isolation, prefer native tool, else plain git | Parallel work or dirty-tree experiments |
| `/ce-resolve-pr-feedback` | Work through comments already on a PR: fix, reply, resolve each thread | Review feedback landed |
| `/ce-undo` | Reverse the last change set at the smallest grade (commits/tree/branch), one confirmation | Agent went too far |

## Automation & verification

| Skill | What it does | When |
|---|---|---|
| `/lfg` | Hands-off pipeline to an open PR | You explicitly want zero check-ins |
| `/ce-test-browser` | Drive changed pages in a real browser; Pass/Fail/Skip per affected route | UI-affecting change |
| `/ce-test-xcode` | iOS simulator build/test | iOS work |
| `/ce-dogfood` | Diff-scoped end-to-end browser QA: drive changed journeys, fix small breakages, persona judgment, report | Pre-merge product QA |
| `/ce-verify` | Generate/refresh a repo-local drive-and-verify skill + feature map, proved by launch-doctor-drive-evidence | A surface needs a repeatable verify loop |
| `/ce-setup` | Diagnose tool capabilities, repair `config.yaml` | Setup/upgrade/missing-tool complaints |

## Meta & collaboration

| Skill | What it does | When |
|---|---|---|
| `/ce-mode` | **Armed session mode** — every request routed through a gated playbook until disarmed | You want enforced discipline for a session; prime after each handoff |
| `/ce-start` | Ask one question, then route to and invoke the right CE skill | Don't know which skill fits |
| `/ce-skill-work` | Repo standard for authoring/reviewing skills (this plugin repo only) | Touching `skills/**` |
| `/ce-proof` | Publish/read markdown via Proof | Sharing specs/drafts |
| `/ce-promote` | Draft copy-pasteable announcement copy, one block per channel; never posts | Shipped something worth announcing |
| `/ce-polish` | Conversational UX polish in a browser (manual invoke) | Feature works, feel needs iteration |
| `/ce-handoff` | Write a session handoff / orient from one | Context is large or session must end |

## New in 3.24.1-omp.14 (2026-09-14)

The plugin-ecosystem port program. Behavior deltas to the rows above:

- `/ce-work` now **loops until a fresh context says converged** (a new verdict, not a counter), sends **one nudge** when an approved plan finishes, validates every return at **one emission gate** (junk-string passes like `tests_added_or_changed: "no"` are blocked — only a real true counts), and **audits milestones** at final validation.
- `/ce-plan` derives **readiness from content** (`artifact_readiness` is gone) and can **fan plan units out as tracker issues** — only with a reachable tracker *and* your write approval, otherwise it declines with a reason.
- `/ce-setup` gained **Compound Packs** (config-declared knowledge packs, resolved by `packs-resolve.py`) plus an opt-in, off-by-default **post-compaction re-injection** key: after a compaction, the session re-states which skill you were in and how to reload it.
- `/ce-code-review` reviews against **hardened named criteria**, and repeat findings across reviewers get **quorum-deduped**.
- `/lfg` needs a **fresh verifier's acceptance** before anything ships, with a review-followup step in the tail.
- New skills: `/ce-bakeoff` and `/ce-noslop` (rows above).

## Release mechanics (this fork)

Cuts are manual: bump version in `package.json`, `plugin.json`, `.omp-plugin/marketplace.json` together, tag. Branch work reaches your sessions only after merge → bump → tag → `omp plugin marketplace update <marketplace>` → `omp plugin upgrade <name>@<marketplace>` (repeat under `--profile hermes-jobs` for that profile). Learned 2026-09-14: fetching the marketplace mirror is not enough — the `marketplace update` verb is what moves version resolution; the upgrade then installs. New behavior goes live for new sessions only (skills cache at session start). Installed now: 3.24.1-omp.14.
