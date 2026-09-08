# Agent Plugins (root manifest posture)

Last verified: 2026-08-07 against [Agent Plugins v1.0.0](https://agent-plugins.org/specification) (**Working Draft**) and `plugin.schema.json`.

## What this repo does

Root `plugin.json` follows the Agent Plugins 1.0.0 manifest authoring rules (field set and shapes) but **currently omits the `$schema` field**:

```text
https://agent-plugins.org/schemas/1.0.0/plugin.schema.json
```

**Why `$schema` is withheld:** OMP does not read the root manifest; it installs from `.omp-plugin/marketplace.json` and `package.json#pi`. The root manifest is retained as the fork's version-carrying manifest and stays without `$schema` to keep OMP on its lenient frontmatter path (see #1411). The skill prompt budget test pins this: it asserts the root manifest carries no Agent Plugins `$schema` at all.

Layout already matches the portable package shape: root manifest + `skills/<name>/SKILL.md`. No `mcp.json` (valid — MCP is optional).

CI pins authoring rules in `tests/plugin-manifest-conformance.test.ts` (schema const, name pattern, closed field set, field shapes). Rules are pinned locally; tests never fetch the schema at runtime.

## Skill body size: what actually constrains it

Verified 2026-08-21. The Agent Plugins spec imposes **no size limit of any kind** on a skill body, and neither does the [Agent Skills spec](https://agentskills.io/specification) it defers to for `SKILL.md` format. Agent Skills constrains only frontmatter (`name` <= 64 chars, `description` <= 1024, `compatibility` <= 500) and says of the body verbatim: "There are no format restrictions." Its size guidance is explicitly a recommendation, not a constraint.

On OMP, skills load in full with no host body truncation on the shipping path. The repo still keeps bodies small as good practice: ordering inside a body is load-bearing, so whatever must survive belongs above whatever a reader may skim.

## Skills frontmatter (nuance)

Agent Plugins discovers skills via the [Agent Skills](https://agentskills.io/specification) format. This repo's skills include top-level keys (`argument-hint`, `disable-model-invocation`) that are **not** in the Agent Skills listed field set.

**What is proven**

- The reference library [`skills-ref`](https://github.com/agentskills/agentskills/tree/main/skills-ref) rejects unknown top-level frontmatter keys (`ALLOWED_FIELDS` only: `name`, `description`, `license`, `compatibility`, `metadata`, `allowed-tools`). Example (2026-08-07): `skills-ref validate skills/ce-commit` passes; `skills/ce-plan` fails on `argument-hint`.
- Agent Skills documents **`metadata:`** as the place for additional properties, not free top-level keys.
- Agent Plugins §7.1: if a skill does not conform to Agent Skills, a client **must skip that skill** (and continue loading others). That only applies if the **client** treats the skill as non-conformant.

**What is not proven**

- ~~That shipping Agent Plugins clients run `skills-ref` at load time, or skip skills with extra top-level keys.~~ **Now proven (#1411):** omp 17.3.5's `validateAgentSkillFrontmatter` mirrors `skills-ref` and rejects the skill; the manifest posture above is what keeps omp on its lenient path.

**Source policy**

- Keep extra frontmatter keys at the top level in source; do not relocate them under `metadata:` in-tree without a regression check against a strict frontmatter validator.
- No `agent-plugins` converter exists in this fork; if a client or marketplace ever requires `skills-ref`-clean frontmatter, that is a new, separately motivated change.

## Consumers of root `plugin.json`

| Consumer | Role |
| --- | --- |
| oh-my-pi (omp) | Not read; omp installs from `.omp-plugin/marketplace.json` and `package.json#pi`. Root manifest is retained as the fork's version-carrying Agent Plugins manifest. |
| Agent Plugins clients | Manifest schema + `skills/` discovery |

## Re-verify when

- A strict Agent Plugins client we ship to needs conformance (then add an emitted conformant package for it — do not add `$schema` to the root)
- omp adds a per-host override / lenient fallback for `$schema` packages
- Agent Plugins leaves Working Draft / publishes a new schema version
- Adding top-level fields to root `plugin.json`
- A concrete Agent Plugins client is observed to skip or reject skills with strict frontmatter (observed 2026-08-17: omp 17.3.5, #1411)
