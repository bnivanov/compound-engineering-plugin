# Generate a verify skill

Read this before writing any files on the create route.

## Interview the repo

Derive the app from the tree: README, bin stubs, package scripts, service entrypoints, UI routes. Ask the user only for facts the repo cannot show. Those unobservables are:

| Name | What you still need |
|------|---------------------|
| **Surface** | CLI, TUI, service, desktop, web, or a mix |
| **Run** | The exact command or entry that starts a driveable instance |
| **Drive** | How an agent interacts once it is up |
| **Observe** | Where output, logs, screenshots, or responses are read |
| **Isolate** | How this run gets its own instance so it does not collide with one the user already has |

Skip any row the repo or the invocation already answered. If Isolate has no answer that yields a private instance, stop — do not drive a shared copy.

## Drive adapter

Required capability: send input to the running surface and read an observable result. Prefer, in this order:

1. A harness the repo already uses to drive the app.
2. Host `browser` for web or Electron.
3. A PTY for CLI or TUI: write to stdin; move with arrow keys; the caret is the insertion point.
4. HTTP for a service.

If none of those can drive the surface, stop and name the missing capability. Do not install a substitute browser stack.

## Files to write

`<app>` is a short slug from the surface name: lowercase, digits, hyphens. Paths:

```text
.agents/skills/verify-<app>/SKILL.md
.agents/skills/verify-<app>/features/README.md
.agents/skills/verify-<app>/features/<feature>.md
```

Absence of this tree is a normal state until this route writes it.

### Generated `SKILL.md` headings

Write exactly these sections, in this order: `## Launch`, `## Doctor`, `## Drive`, `## Evidence`, `## Cleanup`, `## Helpers`.

- **Launch** — start an isolated instance; record PIDs, ports, PTY handles, or session ids; create the evidence directory.
- **Doctor** — confirm this is the instance just launched (prompt, port, version) and that it is healthy enough to drive.
- **Drive** — how to send input through the chosen adapter.
- **Evidence** — what to capture (transcript, screenshot, HTTP body, exit code) and the path Launch created. That path outlives Cleanup.
- **Cleanup** — signal only recorded handles. Never kill by process name. Never delete the evidence directory or its files. Run Cleanup after failed attempts too.
- **Helpers** — shared recipes Launch, Doctor, and Drive reuse (ready-wait, fixture reset, auth).

The generated skill never judges experience, never builds a QA matrix, and never writes a dogfood report.

### Feature files

Seed the **top 3–5** features the repo actually exposes, not the whole product. Copy headings from `references/feature-map-example/` (a fictional `note` CLI — copy the shape, not the product):

- `## Sub-features`
- `## How to get to it (user POV)`
- `## Driving it with <harness>`
- `## Gotchas`

`features/README.md` is the index: one row per feature file, no extras, no missing files.

## Prove once

After the files exist, run the generated skill end to end: Launch → Doctor → one mapped feature → Evidence → Cleanup.

Cleanup runs even when Launch, Doctor, or Drive fails. Evidence of the failure stays on disk. Done on this route is that prove-once, not merely that files were written.
