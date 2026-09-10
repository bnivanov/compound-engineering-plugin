# `ce-mode`

> Opt-in playbook router: match each request to a gated Compound Engineering skill. Invoke it per task.

`ce-mode` is a hidden, user-invoked session mode. You arm it; it matches the current request to a playbook, reads that playbook, and runs the owning skill under five gates. It does not plan, review, implement, or ship the work itself.

It is not `ce-start` (one question, one route, then stop) and not `lfg` (hands-off through an open PR). Use it when you want to stay in the loop and still have every request hit a named playbook and a named gate.

**Shipped behavior is invoke-per-task.** You run `/skill:ce-mode` (or `/skill:ce-mode <task>`) on each request that should be gated. Within one continuous session the armed match convention holds. The compaction re-anchor experiment is unproven; do not treat sticky-with-self-re-anchor as the shipped contract. The trial record is [`docs/solutions/skill-design/opt-in-mode-skill-trial.md`](../solutions/skill-design/opt-in-mode-skill-trial.md).

---

## TL;DR

| Question | Answer |
|----------|--------|
| What does it do? | Matches the current request to a playbook, reads that playbook, and runs the owning skill under gates G1–G5 |
| When to use it | You want in-the-loop work gated by a playbook, not a one-hop route and not a hands-off pipeline |
| What it produces | The owning skill's artifact (plan, diagnosis, verdict, findings, review, or an open PR). This skill produces no artifact of its own |
| What's next | The playbook's last step, then G4 names `lfg` and waits unless you already said to ship existing work |
| What it does not do | Plan, review, implement, or ship itself. Survive compaction as a guaranteed mode |

---

## Example invocations

Hidden skill: type `/skill:ce-mode`. Blank arguments arm. A task as arguments arms and matches immediately. Invoke again on the next task.

```text
# Arm, then match later requests in this continuous session
/skill:ce-mode

# Arm and match this task immediately (the shipped per-task form)
/skill:ce-mode add a retry-with-backoff helper

# Report whether the session is armed and which playbook last matched
/skill:ce-mode status

# Disarm
/skill:ce-mode off
```

---

## The Problem

The catalog already has a front door and a hands-off pipeline. Neither is an in-the-loop rigor mode you turn on:

- `ce-start` asks once, routes once, and stops. The next request is unarmed.
- `lfg` carries plan through PR without you in the loop. Wrong when you want to inspect each stage.
- A bare agent can skip the plan, skip review, or push without being asked.

## The Solution

One hidden skill you invoke per task. Playbooks live as references and are read only when matched:

| Request | Playbook | Owning skill |
|---------|----------|----------------|
| New capability | `references/build.md` | `ce-brainstorm` (when done is unstated) → `ce-plan` → `ce-work` → `ce-simplify-code` → `ce-code-review` |
| Broken, failing, or slow | `references/fix.md` | `ce-debug` |
| Verdict, scope, or document request | `references/decide.md` | `ce-pov` / `ce-brainstorm` / `ce-doc-review` |
| Existing work you said to ship | `references/ship.md` | `ce-simplify-code` → `ce-code-review` → `ce-commit-push-pr` → `ce-babysit-pr` |
| Anything else | stay armed | route via `ce-start` |

Gates, verbatim:

- **G1** plan-before-multi-file-build
- **G2** evidence-before-done
- **G3** review-before-PR
- **G4** no push, open, merge, or comment without you — name `lfg` instead
- **G5** each step names its artifact or stops

The ship playbook is the exception to G4's `lfg` name: you already said to ship existing work, so it names `ce-commit-push-pr`.

---

## What Makes It Novel

### Playbooks are match-time reads

Arming does not load every playbook. The kernel names the matched file in one line, then reads it. An earlier read does not count for a later match.

### Five gates, no second copy

When a callee already gates a step, this skill does not add another gate. Playbooks name the owning skill and the artifact. They do not re-derive that skill's procedure.

### Invoke-per-task is the floor

Within one continuous session, later bare requests can still match. That is a convention, not a harness mode. Compaction can drop the kernel. Re-reading `skill://ce-mode` after compact was not measured, so the guide does not claim it. Invoke `/skill:ce-mode` on each task that should be gated. Details: [`docs/solutions/skill-design/opt-in-mode-skill-trial.md`](../solutions/skill-design/opt-in-mode-skill-trial.md).

### Hidden on purpose

Model-routing it would let a routine request hijack session routing. You type it.

---

## Quick Example

You want a retry-with-backoff helper and you want the plan gate to fire.

```text
/skill:ce-mode add a retry-with-backoff helper
```

It arms, matches `references/build.md`, and names `ce-plan` (G1) before any implementation. After work, simplify, and review, it names `lfg` and waits.

A later failing test in the same continuous session can still match `references/fix.md` and route to `ce-debug`. The shipped path is to invoke `/skill:ce-mode` again for that request. After a compact, invoke it again; do not assume the mode re-anchored.

---

## When to Reach For It

Use `ce-mode` when:

- You want this request gated by a playbook and you will stay in the loop
- You want G1–G5 to hold without handing the whole job to `lfg`
- You have existing work and you said to ship it, and you want simplify → review → `ce-commit-push-pr` rather than a new plan

Skip it when:

- You only need a one-hop route → `/ce-start`
- You want the work shipped hands-off → `/lfg`
- You already know the skill (`/ce-plan`, `/ce-debug`, `/ce-pov`, …) — invoke that skill
- You want the mode to survive compact without a re-invoke — that is not shipped

---

## Chain Position

On-demand. Nothing in the core loop calls this.

```text
/skill:ce-mode <task>  →  playbook  →  owning skill  →  G4 names lfg
```

`ce-start` remains the unarmed front door. A match-table miss routes through `ce-start` and stays armed for this continuous session. `lfg` remains the hands-off pipeline; this skill names it rather than pushing. The ship playbook is the in-the-loop ship path for work that already exists.

---

## Reference

| Argument | Effect |
|----------|--------|
| _(empty)_ | Arm. Later requests in this continuous session match the table. Invoke again per task; that is the shipped floor |
| `<task>` | Arm and match that task immediately |
| `status` | Report armed or disarmed, and which playbook last matched |
| `off` | Disarm. Stop matching. Confirm once |

Required: you type `/skill:ce-mode`. The model will not pick it.

Playbooks: `skills/ce-mode/references/build.md`, `fix.md`, `decide.md`, `ship.md`.

---

## FAQ

**Does the mode stay on for the rest of the session?**
Within one continuous session the armed match convention holds. That is not a guarantee across compact. Invoke per task.

**What happens after compact?**
Unproven. The trial did not measure a compaction re-anchor. Invoke `/skill:ce-mode` again. See [`docs/solutions/skill-design/opt-in-mode-skill-trial.md`](../solutions/skill-design/opt-in-mode-skill-trial.md).

**Will it push a PR on its own?**
No. G4 names `lfg` and waits. The ship playbook runs only when you said to ship existing work, and even then the user-copy form is `/ce-commit-push-pr`.

**How is this different from `ce-start`?**
`ce-start` routes once and stops. This skill matches every gated request to a playbook and holds G1–G5.

**How is this different from `lfg`?**
`lfg` is hands-off through an open PR. This skill keeps you in the loop.

---

## See Also

- [`ce-start`](./ce-start.md): unarmed front door; fallback row when no playbook matches
- [`lfg`](./lfg.md): hands-off pipeline G4 names instead of pushing
- [`ce-plan`](./ce-plan.md): G1 owner on the build playbook
- [`ce-debug`](./ce-debug.md): owner on the fix playbook
- [`ce-pov`](./ce-pov.md): verdict owner on the decide playbook
- [`ce-brainstorm`](./ce-brainstorm.md): scope owner on decide; also first build step when done is unstated
- [`ce-doc-review`](./ce-doc-review.md): document-review owner on decide
- [`ce-commit-push-pr`](./ce-commit-push-pr.md): ship playbook's user-copy seam
- [`ce-babysit-pr`](./ce-babysit-pr.md): watch step after that PR exists
- [Trial record](../solutions/skill-design/opt-in-mode-skill-trial.md): invoke-per-task verdict
