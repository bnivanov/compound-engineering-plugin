---
name: Compound Engineering
last_updated: 2026-09-09
---

# Compound Engineering Strategy

Compound Engineering is an open-source plugin of agent skills, installed into
oh-my-pi (omp) and run against the user's own repo.

## Purpose

A person building a product through a coding agent earns hard-won knowledge
every session, and it scatters — across sessions, with no way to compound it —
while output outruns the judgment available to check it. Capable models don't
fix this on their own: left to themselves they plan thinly, review shallowly,
and write nothing down. People with limited product and engineering knowledge
feel this worst: they can describe what they want but cannot yet tell a good
plan from a plausible one, or a real review finding from a nit.

## Positioning

We believe knowledge from agents and humans should compound, so that each unit
of work is easier than the last. Our core skills impose an opinionated
workflow — plan, build, review, then capture what was learned where the next
run will read it — and the plugin's judgment stands in for the user's missing
judgment until they have it. Around that core we ship additional skills that
make everyday software engineering easier, and we keep them working as models
move, on one host: omp.

## Users

**Primary:** People building products with omp who can describe an outcome but
cannot yet evaluate a plan, a review finding, or a shipping state. They're
hiring this plugin so the workflow supplies the judgment they don't yet have,
and so each session's knowledge lands in their repo instead of a transcript.

## Boundaries

- No telemetry, ever. The plugin installs into private codebases; shipping no
  analytics is part of what makes it safe to install, and operating blind is a
  cost we accept deliberately.
- OMP only. The plugin never runs outside omp; foreign coding CLIs are
  operator-launched via herdr, never plugin-launched.
- Open source, and not monetized directly. Nothing is built here to be sold
  behind it.

_Resist a change when:_ it doesn't fit the sequence our skills form as a
workflow, it can't materially justify its usefulness against what omp already
does on its own, or it reintroduces a multi-harness abstraction the fork
deleted.

## Key metrics

We ship no product analytics by choice, so these are signals we watch, not
measurements. Adoption and effectiveness inside other people's repos are not
observable to us, and this doc shouldn't pretend otherwise.

- **Community feedback** — issues, discussions, and PRs from people who aren't
  maintainers, plus what people say publicly. GitHub and social; the only
  outside signal we have.
- **Our own compounding** — learnings written in this repo and, more
  importantly, reused by later runs. `docs/solutions/` and
  `ce-compound-refresh` audits.
- **Frontier currency** — whether the skills still work well on the newest
  models served inside omp, and how fast they get there after a release.
  Release dates against the PRs that land support.

## Tracks

### The skills that run the loop

The six core skills and the judgment they encode — brainstorm, plan, work,
simplify, review, compound — plus the on-demand skills that earn a place in
that sequence.

_Why it serves the approach:_ The skills are the product; the philosophy only
reaches anyone through what they do in a session.

### Frontier re-tuning

Keeping the skills correct and current as models move: evals, review,
prompt-budget limits, re-authoring prose for new model generations.

_Why it serves the approach:_ An installed skill that was tuned for last year's
model quietly stops earning its place, and a skill pack is only worth
installing if it tracks the frontier.

### The knowledge substrate

How learnings get written into the user's repo, retrieved, refreshed, and kept
from rotting — the store itself, not the skills that fill it.

_Why it serves the approach:_ Compounding is the commitment, and the substrate
is where it either happens or quietly doesn't.

<!-- Host reach — the OMP manifest, catalog, and load path — is maintenance the three
     tracks depend on, not a fourth track. -->
