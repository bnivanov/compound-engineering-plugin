# Development

The repository's build and validation commands, and how to load a local checkout into oh-my-pi (omp). For contribution process — what to do before opening a PR — see [CONTRIBUTING.md](../CONTRIBUTING.md).

---

## Repository commands

```bash
bun install
bun run test              # full suite, --parallel, exactly as CI runs it
bun run list              # repo tooling: list plugins available in the cwd
```

The OMP catalog (`.omp-plugin/marketplace.json`) is asserted by `bun test tests/omp-native-install.test.ts`; there is no separate validator binary.

## From your local checkout

Link the checkout as a live plugin; edits to `skills/` are visible on the next session (or `/reload-plugins`):

```bash
omp plugin link "$PWD"
```

Confirm omp resolves the package metadata without installing anything:

```bash
omp install --dry-run --json "$PWD"
```

To exercise the marketplace flow against this checkout without touching your real registry:

```bash
tmp=$(mktemp -d "${TMPDIR:-/tmp}/omp-mkt-XXXXXX")
HOME="$tmp" omp plugin marketplace add "$PWD"
HOME="$tmp" omp plugin discover compound-engineering-omp
```

Do not use `omp plugin marketplace add "$PWD"` against your real profile for live development: it caches a snapshot of the checkout, so later edits are not reflected until reinstall. `omp plugin link` keeps omp on the current files.
