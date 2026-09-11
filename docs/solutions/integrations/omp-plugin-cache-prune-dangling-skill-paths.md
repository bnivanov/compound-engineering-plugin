---
title: "OMP plugin cache prune leaves running sessions with dangling skill:// paths"
date: 2026-09-10
category: integrations
module: omp-plugin-cache
problem_type: integration_issue
component: tooling
severity: high
symptoms:
  - "Running `/skill:ce-compound` or `skill://ce-compound` fails with `Error: ENOENT: no such file or directory, open '~/.omp/profiles/<profile>/plugins/cache/plugins/compound-engineering-omp___compound-engineering___3.24.1-omp.8/skills/ce-compound/SKILL.md'`"
  - "The profile plugin cache contains only the newly installed version directory (`...___3.24.1-omp.9`); the previously resolved omp.8 directory is gone."
  - "The new-version cache still has the skill body (omp.9 `skills/ce-compound/SKILL.md` and all 37 skills); only the running session's resolved path dangles."
  - "`installed_plugins.json` already records installPath and version 3.24.1-omp.9 while the session still opens the pruned omp.8 path."
root_cause: concurrency
resolution_type: environment_setup
framework_version: "oh-my-pi (hermes-jobs profile); compound-engineering 3.24.1-omp.8 pruned to 3.24.1-omp.9"
tags:
  - oh-my-pi
  - plugin-cache
  - skill-resolution
  - session-start
  - enoent
  - reload-plugins
  - versioned-cache
  - host-routing
---

# OMP plugin cache prune leaves running sessions with dangling skill:// paths

## Problem

An OMP marketplace update of `compound-engineering` (`3.24.1-omp.8` → `3.24.1-omp.9`) on the `hermes-jobs` profile pruned the previously-installed versioned cache directory while sessions were still running. Those sessions had already resolved `skill://` bodies to paths under the omp.8 tree, so every subsequent skill-body load fails `ENOENT`.

## Symptoms

`/skill:ce-compound` (and `read skill://ce-compound`) fails with:

```
Error: ENOENT: no such file or directory, open '~/.omp/profiles/hermes-jobs/plugins/cache/plugins/compound-engineering-omp___compound-engineering___3.24.1-omp.8/skills/ce-compound/SKILL.md'
```

The session itself stays up. Anything that still needs a not-yet-loaded skill body — Skill-tool invocation, plugin agent dispatch that reads a skill file, `read skill://...` — hits the dangling path. Skills already injected into context are unaffected until they are re-read.

Verified 2026-09-10:

- `installed_plugins.json:7-10` (profile `hermes-jobs`): `installPath` is `~/.omp/profiles/hermes-jobs/plugins/cache/plugins/compound-engineering-omp___compound-engineering___3.24.1-omp.9`, `"version": "3.24.1-omp.9"`, `installedAt`/`lastUpdated` `2026-09-10T10:04:01.803Z`.
- `~/.omp/profiles/hermes-jobs/plugins/cache/plugins/` contains only that omp.9 directory; the omp.8 directory is gone.
- The omp.9 tree contains `skills/ce-compound/SKILL.md` (7.7KB) and the rest of the skill set (37 skills).
- This checkout still records `3.24.1-omp.8` in `package.json`, `plugin.json`, and `.omp-plugin/marketplace.json`; the omp.9 copy came from the marketplace, not this tree.

## What Didn't Work

Nothing was tried and failed in-session. The miss is in the pre-existing notes, not in a failed workaround.

`AGENTS.md` **Validating Agent and Skill Changes** already says plugin skills "cache at session start" (line 155) and "Plugin agent and skill definitions both cache at session start" (line 157). That, plus "A version-matched cache is not automatically stale — confirm by content, not by version" (line 161), covers *content* staleness: a still-present, version-matched cache directory is not automatically the wrong bytes. It does not cover the directory being deleted under a live session.

(OMP memory) An earlier ship-time note recorded that already-running sessions keep the prior plugin version while new sessions and hermes-launched jobs pick up the newly installed version immediately. That predicts stale *content*, not `ENOENT`. The pruned-directory failure is the delta those notes did not predict.

Editing the cache to force a reload was never an option: `AGENTS.md` **Validating Agent and Skill Changes** (line 159) says "Do NOT edit `~/.omp/plugins/cache/` or `~/.omp/plugins/marketplaces/` to try to force a reload." The observed store is the profile-scoped equivalent (`~/.omp/profiles/<profile>/plugins/cache/`); same class of user machine state.

## Solution

1. In the running session, `/reload-plugins`, or restart the session. `AGENTS.md` **Quick Start** → **Local OMP Development** (line 20): "skills reload on the next session or `/reload-plugins`". The loader re-resolves to the installed version. Verified: the omp.9 tree holds `skills/ce-compound/SKILL.md`.
2. For authoring sessions inside this plugin source checkout: do not wait on `skill://`. Read `skills/<name>/SKILL.md` and `skills/<name>/references/...` from the repo. That is how the interrupted `ce-compound` run continued.
3. After cutting or installing a plugin release, treat every still-open session as holding dangling `skill://` paths. Reload or restart them as part of the release checklist — not only sessions that "look stale."

## Why This Works

Verified: at session start the skill loader pins `skill://` to a versioned directory under `~/.omp/profiles/<profile>/plugins/cache/plugins/<marketplace>___<plugin>___<version>/`. After the omp.9 install, only that version directory remains, `installed_plugins.json` points at it, and the omp.8 path is absent. Reload (or a new session) re-resolves against the current install record. Reading the checkout bypasses the cache entirely.

Inference, not OMP-source evidence: the update *prunes* the previous version directory rather than leaving it beside the new one. That is inferred from (a) the install timestamp on `installed_plugins.json:7-10`, (b) the cache listing containing only omp.9, and (c) running sessions still opening the omp.8 path. We did not read OMP's installer to confirm the prune is intentional.

## Prevention

After `omp install` or a marketplace plugin update, reload or restart every still-open session that will invoke skills — including authoring sessions in this repo. Fold that into the existing hand-cut release habit (`AGENTS.md` **Working Agreement**: bump `package.json`, `plugin.json`, and `.omp-plugin/marketplace.json` together, then tag). When a skill or test reads `skill://` paths, treat them as a session-start snapshot of a versioned cache directory, not a stable live tree; a subsequent install can delete the directory those paths name. Do not add a CI check for this: it is host session state, not repo content.

(session history) The rule is not hypothetical: the 2026-09-10 session that squash-merged PR #4 and pushed tag `3.24.1-omp.9` had itself been running since ~08:00 with a planned install onto both profiles, and its captured history records no reload or restart afterward — the releasing session was pinning the very omp.8 paths the install deleted.

## Related Issues

- `docs/specs/omp.md` — host contract this failure sits on: marketplace upgrade into a new version-keyed cache directory, `/reload-plugins` live refresh, `skill://<name>` resolution. Its Updates section does not yet document that the previous version directory is removed while long-lived sessions still point at it.
- `AGENTS.md` **Validating Agent and Skill Changes** — carries the cache-at-session-start and do-not-edit-cache rules; the prune-under-session half documented here is the missing complement.
- `docs/development.md` — link-vs-cache distinction: `omp plugin link` is a live symlink and is immune to this failure; marketplace installs are versioned snapshots and are not.
- [docs/solutions/integrations/agent-plugins-schema-is-a-host-routing-switch.md](agent-plugins-schema-is-a-host-routing-switch.md) — the other documented omp skill-invocation failure (skills missing with no install-time error, root cause `$schema` routing). Do not collapse the two: that one is config, this one is a deleted directory.
- [docs/solutions/integrations/native-plugin-install-strategy.md](native-plugin-install-strategy.md) — the native marketplace install path that produces these versioned cache directories.
- [docs/solutions/developer-experience/codex-local-skill-development-workflow.md](../developer-experience/codex-local-skill-development-workflow.md) — sibling "marketplace install copies into a cache" lesson on Codex; stale content there, ENOENT after prune here.
- GitHub #1411 (closed) — prior omp skill-loading incident (`$schema` swap); related symptom class, different cause.
