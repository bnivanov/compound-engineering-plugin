# Refresh a verify skill

Read this before globbing on the refresh route. Edits stay inside the chosen `.agents/skills/verify-<app>/` directory. Product code is out of scope.

## Find maps

Glob `.agents/skills/verify-*/features/README.md`.

- None → stop and say so. Absence is normal; generate is the route that creates a map.
- The user named an app → use that slug only.
- Several match and the hint does not pick one → ask once.

## Index hygiene

`features/README.md` lists every `features/*.md` except itself, and every listed file exists. A missing row or a row whose file is gone is drift: fix the index. That alone makes the outcome `changed`.

## Read-only pass

Dispatch **one read-only subagent per feature file** in one turn. Each subagent reads the feature file and the repo. It never drives the app and never edits. It returns one of:

- still accurate
- drifted, with the disagreeing claims
- cannot tell without driving

The coordinator synthesizes; it does not take a subagent's edit.

## Live pass

The coordinator owns driving. Run Launch → Doctor from the generated skill, then drive enough of each feature to confirm or refute its recipe, then Evidence → Cleanup.

A recipe that cannot be reached is `blocked` for that feature, not a silent skip. Cleanup uses recorded handles only, never process name, and never deletes evidence.

## Map vs app

When the file and the live app disagree, decide which is wrong:

- **Doc drift** — the product's current correct behavior (what the repo implements and what a healthy instance does) does not match the file. Edit the feature file (and the index if names moved). Do not touch product code.
- **Product regression** — the map still describes the intended, previously proven behavior, and the live app does not. Report the break with evidence. Do not edit the map to match the break.

If both exist, apply the drift edits and still report the regression.

## Outcomes

| Outcome | Meaning |
|---------|---------|
| `clean` | Index and features match the product. Nothing to commit. |
| `changed` | Files under the verify skill directory were updated. Invoke `ce-commit-push-pr` by name, scoped to that directory. |
| `blocked` | Could not isolate, could not drive, or a product regression stopped the live pass. Report the blocker. Do not invent a passing map. |

The run outcome is `changed` if any map file was edited, even when a regression is also reported. It is `blocked` when nothing safe to edit could be confirmed and the live pass could not finish. It is `clean` only when the live pass finished and no map file changed.
