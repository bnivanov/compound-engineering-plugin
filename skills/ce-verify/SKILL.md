---
name: ce-verify
description: "Generates and maintains a repo-local drive-and-verify skill with a durable feature map for any surface — CLI/TUI/service/desktop/web. Use when creating that skill for an app or surface that has no durable launch-doctor-drive-evidence path. Use when refreshing an existing verify skill after the product or its drive recipes drifted. Use ce-dogfood for a QA matrix or dogfood report; use ce-test-browser for diff-scoped browser tests of the current change."
argument-hint: "[create | refresh] [app or surface hint]"
---

# Verify

**Outcome:** a repo-local verify skill exists at `.agents/skills/verify-<app>/`, this run completed launch → doctor → one mapped feature → evidence → cleanup, and the evidence is still on disk.

**Next consumer:** `ce-dogfood` when a map is present; later refresh runs; a person re-driving the app.

**Done:** the generated files match the shape in `references/generate.md`; evidence survived cleanup; create ended after one proved feature, or refresh ended `clean`, `changed`, or `blocked`; and `changed` invoked `ce-commit-push-pr`. A missing map at start is normal. A named blocker (cannot isolate, an unobservable the user did not supply, user declined overwrite) is a stop.

This skill writes drive infrastructure. It never drives a QA matrix and never writes a dogfood report.

## Route

- Bare arguments or `create` → generate. Read `references/generate.md` from this skill's directory before writing files.
- `refresh` → maintain. Read `references/refresh.md` from this skill's directory before globbing.
- If a map already exists and the user said `create`, ask once whether to refresh instead. Do not overwrite until they answer.

Detect maps by globbing `.agents/skills/verify-*/features/README.md`.

## Boundaries

- Never edit product code.
- Map vs app disagreement is doc drift or a product regression: fix the map for drift; report a regression; never edit the map to match a break.
- Never kill a process by name. Cleanup signals only handles recorded at launch.
- Cleanup never deletes evidence.
- Refuse to drive a shared instance that cannot be isolated.
- Edit scope on refresh is the verify skill directory only.

## Authority

Invoking this workflow authorizes writing and editing `.agents/skills/verify-<app>/`, driving an isolated instance of the app, and on refresh `changed` invoking `ce-commit-push-pr` for that directory. It does not authorize product-code edits, kill-by-name, deleting evidence, or double-driving a shared instance.

## Pacing

Issue independent repo reads and, on refresh, one read-only subagent per feature file in one turn. Before the first tool call, name the route. After the map is written or the live pass starts, one line of what actually happened. Close with the verify path, the outcome, and the evidence path. A step is done only after it ran.
