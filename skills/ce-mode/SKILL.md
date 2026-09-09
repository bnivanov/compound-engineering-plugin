---
name: ce-mode
description: "Armed in-the-loop session mode that matches each request to a playbook and holds gates. Use for `/skill:ce-mode`."
disable-model-invocation: true
argument-hint: "[blank to arm | off | status | a task to run under the mode]"
---

# Mode

**Outcome:** each request in this session is matched to a playbook, the owning skill runs, and the five gates hold until the user disarms. The next consumer is that skill, then the user.

**Done:** the matched playbook finished or stopped at a named artifact, the session is disarmed, or the request was routed through `ce-start` while remaining armed.

**User-runnable invocation rendering.** When this skill prints or copies a user-runnable invocation, use `/skill:ce-mode off`. Render only the invocation as inline code and output exactly one form.

## Arm, disarm, status

- Blank arguments arm the session. Later requests in this session match against the table below.
- `off` disarms. Stop matching. Confirm once.
- `status` reports whether the session is armed and which playbook last matched.
- A task as arguments arms and matches that task immediately.

## Gates

- **G1** plan-before-multi-file-build. A new capability that spans more than one file is planned before it is built.
- **G2** evidence-before-done. A done claim names the evidence that produced it.
- **G3** review-before-PR. A change is reviewed before it is offered as a PR.
- **G4** no push/open/merge/comment without the user — name `lfg` instead.
- **G5** each step names its artifact or stops.

## Match

Read the playbook when the request matches it, not at arm time. A read made earlier does not satisfy that match-time read.

| Request | Playbook |
|---|---|
| New capability | `references/build.md` |
| Broken, failing, or slow | `references/fix.md` |
| Anything else | route via `ce-start` and stay armed |

## Shared tail

After the playbook's last owned step, G4 ship: name `lfg` and wait. Then invoke `ce-compound` only when the code and the plan do not already carry the reasoning.

## Re-arm

While armed, name the matched playbook in one line before any tool call. If the five gates are not in context, re-read `skill://ce-mode`.

## Boundaries

This skill never plans, reviews, implements, or ships itself. When a callee already gates a step, do not add a second gate.
