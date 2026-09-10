# `ce-verify`

> Generate or refresh a repo-local drive-and-verify skill with a durable feature map, for CLI, TUI, service, desktop, or web — not only a browser.

`ce-verify` writes `.agents/skills/verify-<app>/`: a small skill that knows how to launch, doctor, drive, evidence, and clean up one app, plus a feature map other workflows can reuse. Create interviews the repo and proves the path once. Refresh checks the map against the product and updates drift.

It is not `ce-dogfood` (QA matrix, feel judgment, dogfood report) and not `ce-test-browser` (diff-scoped browser tests of the current change). The generated skill never judges experience and never writes that report.

---

## TL;DR

| Question | Answer |
|----------|--------|
| What does it do? | Creates or maintains a repo-local verify skill and feature map, then drives launch → doctor → a feature → evidence → cleanup |
| When to use it | When the repo has no durable way to drive the real app, or when an existing map has drifted |
| What it produces | `.agents/skills/verify-<app>/SKILL.md`, `features/README.md`, and `features/<feature>.md`; evidence that survives cleanup |
| What's next | `ce-dogfood` can read the map when present. Refresh again when the product moves |

---

## Example invocations

```text
# Interview the repo, write the verify skill, prove one feature
/ce-verify

# Same, said explicitly, with a surface hint
/ce-verify create notes CLI

# Re-check an existing map against the product
/ce-verify refresh

# Refresh a named app
/ce-verify refresh notes
```

If a map already exists and you said `create`, it asks once whether to refresh instead.

---

## The Problem

A CLI, TUI, service, or desktop app has no durable drive recipe:

- Every dogfood or debug run re-derives how to start the process, where logs go, and how to isolate an instance
- Browser-only helpers do not cover a PTY or an HTTP service
- A feature map that is not written down drifts, or gets rewritten to hide a product break

## The Solution

One skill with two routes:

- **Create** — read the repo; ask only unobservables (Surface, Run, Drive, Observe, Isolate); pick a drive adapter; write the verify skill and 3–5 seed features; prove launch → doctor → one feature → evidence → cleanup, including cleanup after failures
- **Refresh** — glob existing maps; fix index hygiene; read-only check per feature file; coordinator drives the live pass; outcome `clean`, `changed`, or `blocked`

Drive prefers a harness the repo already has, then host `browser` for web or Electron, a PTY for CLI or TUI, HTTP for a service.

---

## What Makes It Novel

### The map is an artifact, not a one-off transcript

Detection is a glob of `.agents/skills/verify-*/features/README.md`. No map is a normal state. When the files exist, later runs and `ce-dogfood` can read entry points and drive recipes instead of rediscovering them.

### Create vs refresh is a hard split

Create writes and proves. Refresh maintains. Create will not silently overwrite; refresh will not invent a first map.

### Drift is not a regression

If the map and the app disagree, the map is wrong (doc drift — edit the feature file) or the app is wrong (product regression — report it, leave the map). Refresh never edits product code and never rewrites the map to match a break.

### Cleanup cannot destroy the proof

Launch records process handles and an evidence directory. Cleanup signals those handles only — never a process name — and never deletes evidence. A failed prove still cleans up.

### Isolation is a gate

If the surface cannot give this run a private instance, the skill stops. It will not double-drive a shared server, desktop session, or TUI the user already has open.

---

## Quick Example

You have a notes CLI and no drive recipe. You run `/ce-verify create notes`.

It reads the README and `note --help`, asks how to isolate a vault, writes `.agents/skills/verify-notes/` with Launch/Doctor/Drive/Evidence/Cleanup/Helpers and a few feature files (search among them). It starts an isolated vault, doctors the prompt, runs `note search meeting`, keeps the transcript, and stops the recorded PID. The transcript is still there after cleanup.

Weeks later `/ce-verify refresh notes` finds that search now uses `--open` instead of a positional path. That is drift: it updates `features/search.md` and invokes `ce-commit-push-pr`. If search instead crashed while the map still matched `--help`, it would report a regression and leave the file alone.

---

## When to Reach For It

Use `ce-verify` when:

- The real app (any surface) has no durable launch-and-drive skill in-repo
- An existing `.agents/skills/verify-<app>/` map has gone stale
- You want `ce-dogfood` to consume entry points instead of re-deriving them

Skip it when:

- You want a QA matrix, persona feel, or a dogfood report → `/ce-dogfood`
- You want diff-scoped browser tests of this change → `/ce-test-browser`
- You want iOS simulator evidence → `/ce-test-xcode`
- You cannot isolate an instance of the app

---

## Chain Position

On-demand. Nothing in the core loop calls this. It produces the map; it does not run the QA loop.

`ce-dogfood` may read the map when present. Absence leaves dogfood unchanged. Refresh `changed` hands off to `ce-commit-push-pr`.

---

## Reference

| Argument | Effect |
|----------|--------|
| _(empty)_ or `create` | Interview, write `.agents/skills/verify-<app>/`, prove one feature |
| `refresh` | Maintain an existing map. Outcomes `clean` / `changed` / `blocked` |
| `<app or surface hint>` | Slug or surface to create or refresh |

Required: a driveable, isolatable instance of the app, and one of: an in-repo harness, host `browser`, a PTY, or HTTP.

Generated tree:

```text
.agents/skills/verify-<app>/SKILL.md
.agents/skills/verify-<app>/features/README.md
.agents/skills/verify-<app>/features/<feature>.md
```

Feature files use `## Sub-features`, `## How to get to it (user POV)`, `## Driving it with <harness>`, `## Gotchas`. The generated skill uses `## Launch`, `## Doctor`, `## Drive`, `## Evidence`, `## Cleanup`, `## Helpers`.

---

## FAQ

**Does this replace `ce-dogfood`?**
No. This writes and maintains the drive skill. Dogfood still owns the matrix and the report.

**What if there is no map yet?**
That is normal. Create writes one. Refresh stops and says so.

**Will it change product code?**
No. Drift updates the map. A product break is reported.

**What if create finds an existing map?**
It asks once whether to refresh. It does not overwrite on its own.

**Where does evidence live?**
A directory Launch creates. Cleanup must not delete it.

---

## See Also

- [`ce-dogfood`](./ce-dogfood.md): consumes the map when present; still the QA runner
- [`ce-test-browser`](./ce-test-browser.md): diff-scoped browser tests
- [`ce-test-xcode`](./ce-test-xcode.md): iOS simulator
- [`ce-commit-push-pr`](./ce-commit-push-pr.md): invoked on refresh `changed`
