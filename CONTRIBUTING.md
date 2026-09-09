# Contributing to Compound Engineering

Contributions are welcome — issues, bug reports, and pull requests all help, and bug reports especially.

Compound Engineering is opinionated by design. This fork is maintained by [@bnivanov](https://github.com/bnivanov). Upstream is [@kieranklaassen](https://github.com/kieranklaassen) and [@tmchow](https://github.com/tmchow). Its direction reflects a specific point of view about how AI-assisted engineering should work. We can't promise to accept every change — some proposals won't fit that vision even when they're good ideas on their own. We'd rather say that upfront than waste your time.

## Before you open a PR

- **File an issue first.** If you are not a maintainer, open an issue describing the problem or proposal and reference it from your PR.
- **New skills need approval before you build them.** Adding a skill is a bigger commitment than it looks — it ships to every omp install of this plugin and has to be maintained. Raise it in an issue and get explicit maintainer sign-off *before* starting the work, rather than arriving with a finished PR we may have to turn down.
- **Everything goes through a pull request.** Direct pushes and direct merges to `main` are not allowed; branch protection enforces it.

## Getting set up

```bash
bun install
bun run test              # full suite, --parallel, exactly as CI runs it
```

Both commands are host-independent. To load the checkout into omp for testing, see **[docs/development.md](docs/development.md)**.

## What CI checks

Pull-request CI runs, in order: PR-title lint and `bun run test`. Both must pass before a PR can merge.

Use conventional commit prefixes (`feat:`, `fix:`, `docs:`, `refactor:`, and so on) classified by *intent*, not by file type — files under `skills/` are product code even though they are Markdown. Include a narrow component scope, for example `fix(ce-plan):` or `feat(cli):`.

Do not hand-bump versions in plugin or marketplace manifests, and do not hand-write `CHANGELOG.md` entries. Fork releases are manual SR tags, not release-please.

## Working on skills

Skills live in `skills/<name>/SKILL.md` and are authored once for oh-my-pi (omp); a skill is a set of goals, not a state machine, and it must work with the host's model-routed and deterministic (`/skill:<name>`) invocation paths alike. Read `AGENTS.md` before changing anything under `skills/`.

When you add a user-facing skill, document it: add a `docs/guides/<skill-name>.md` page and a catalog row in `docs/guides/README.md`.

## Reporting security issues

Please don't file security problems as public issues. See [SECURITY.md](SECURITY.md).
