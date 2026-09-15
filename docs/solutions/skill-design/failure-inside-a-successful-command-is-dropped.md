---
title: A failure a consumer must act on belongs in the exit code, not only inside a successful command's payload
date: 2026-09-15
category: skill-design
module: compound-engineering (Compound Packs resolver)
problem_type: best_practice
component: skills/*/scripts/packs-resolve.py
severity: high
applies_when:
  - A bundled skill script reports a failure in its JSON output while exiting 0
  - A downstream model must notice that failure and record it in an artifact
  - Adding or reviewing a probe mode whose caller reads the payload rather than the status
tags:
  - skill-design
  - bundled-scripts
  - exit-codes
  - failure-signaling
  - compound-packs
  - skill-eval
---

# A failure inside a successful command is dropped

The Compound Packs resolver prints `{"roots": […], "warnings": […], "errors": […], "entries": n}` and, before this change, returned 0 whatever happened. A repo that declared a pack source which does not exist therefore got a *successful command carrying a field*. Two consumers of that same result, in runs of the same shape and against the same failing config, disagreed:

| Consumer | What decides that it records | Result on the failing config |
|---|---|---|
| `ce-code-review` | Its artifact contract requires a `coverage.compound_packs` field | Recorded, with the resolver's error verbatim |
| `ce-plan` | Prose: a failed resolution is never "no packs" | **Nothing anywhere** — a complete plan, no mention of packs |

With the exit code fixed — `return 1 if errors else 0` — the same `ce-plan` cell against the same fixture recorded the failure in three places, including the resolver's own line: `config.yaml:2: source directory … does not exist`.

## The rule

Where a consumer must act on a failure, put the failure in the channel the harness itself surfaces, not only in the payload. A field is exactly as reliable as the consumer's habit of reading it; a required artifact field, or a failed command, is what forces the recording. So:

- A **required field in the consumer's artifact template** is the strongest form, and it is why the review path never had this bug.
- A **non-zero exit** is the fallback for every consumer whose artifact has no such field: the harness reports it without the model parsing anything, and the prose condition ("the command exits non-zero, or the JSON carries `errors`") covers both.
- A **prose-only condition** is the weakest, and it will silently drop the failure on some runs — sometimes after the run has already produced a complete-looking artifact, which is the expensive case.

Exiting non-zero is for the mode whose caller treats the call as an action. A **probe** whose caller reads the payload to answer a question keeps exit 0: `--declared-only` exists so a scope helper can ask "is anything declared?", and a malformed declaration must come back as data, not as a broken run.

## Evidence

- Deterministic: `tests/skills/ce-packs.test.ts` pins the fail-closed case at exit 1 and the probe at exit 0; the seven copies stay byte-identical under a digest pin.
- Live, pre-fix vs post-fix, one variable (a declared source that does not exist): resolver exit 0 → a plan with no trace; resolver exit 1 → the same failure named in the assistant's reply and written into the plan's assumptions and sources.

## Evaluating a bundled-script change

`bun test` is the right gate for the script; a live cell only shows what the *model* does with the new signal. Two harness facts cost real time when building that cell:

- A `skill://` read returns content without a filesystem path, so a model asked to fill a `SKILL_DIR` anchor guesses; when the guess misses, it searches for an installed copy and runs that instead. Name the skill directory in the prompt, or the cell measures path resolution rather than the change.
- `omp -p` wedges in `readPipedInput` when it inherits a pipe that never closes. Redirect stdin from `/dev/null` in any detached harness.

Also give a fixture enough substance to survive the skill's intake: a minimal repo makes the model stop to ask a clarifying question, and print mode ends the process there — before the stage under test even runs.

## Related

- [`bundled-script-path-resolution-across-harnesses.md`](bundled-script-path-resolution-across-harnesses.md): where an executed script lives; this doc is about what its exit status has to carry.
- [`strong-models-mask-defensive-skill-fixes.md`](strong-models-mask-defensive-skill-fixes.md): the sibling method note for evaluating a skill change on a live cell rather than in prose.
