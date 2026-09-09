# Independent Adversarial Pass (OMP-only)

Independence is a `reviewer` agent whose serving family differs from the
session family. Dispatch it through the host `task` tool (`agent: reviewer`).
There is no shell worker and no `omp -p` subprocess.

Run the adversarial lens only when Stage 3 selected `adversarial-reviewer`,
and only when scope is local-aligned or standalone. Skip in remote modes: the
reviewer reads the local tree, which is not the remote head.

## 1. Assert OMP, then apply the checkout gate

```bash
[ "${OMPCODE:-}" = "1" ] || fail "must run under OMPCODE=1"
```

<!-- ce-config-layers:start -->
**Resolve ordinary CE yaml keys from the two repo files.**

- **Read** `<repo-root>/.compound-engineering/config.local.yaml`, then `config.yaml` (`<repo-root>` = `git rev-parse --show-toplevel`). Missing files are skipped. Gitignore does not change resolution.
- **Win** with the first active (non-commented) value. For scalars, empty is unset; an invalid value continues to the next layer, then the skill default. For lists and maps, a present key — including an empty list or map — replaces the whole key.
- **Do not** use this rule for `docs_root` — that key is `config.yaml` only.
<!-- ce-config-layers:end -->

Read `cross_model_review_mode:` under the rule above. Valid values are `auto`
(default) and `off`. When it resolves to `off`, skip the automatic pass with
one quiet line stating the checkout policy, and dispatch no reviewer agent.
An explicit user request for a separate read in conversation still runs.

## 2. Dispatch the reviewer agent

Before dispatch, write `adversarial-review-constraints.md` (at most 32 KiB) and
`adversarial-review-brief.md` (at most 32 KiB) under `<run-dir>`. Missing or
oversized constraints stop before dispatch.

Dispatch one `task` item:

- `agent: reviewer`
- Read-only. The prompt forbids writes, shell, and tree mutation. Allowed
  tools: `read`, `grep`, `glob`, `lsp`.
- Prompt: read the constraints and brief files, apply the adversarial persona
  at `references/personas/adversarial-reviewer.md`, return findings JSON.

Do not invoke a shell worker. That worker is gone.
Do not start a foreign CLI.

If the host exposes a per-agent model pin, pin the reviewer to a model whose
family differs from the session family. If it does not, dispatch anyway and
record independence as unverified.

## 3. Receipt

Write `<run-dir>/adversarial-omp.json`:

- `reviewer`: `adversarial-omp`
- `cross_model_route` / `cross_model_target` / `cross_model_harness`: `omp`
- `serving_family`: from the reviewer return if named, else `unknown`
- `independence_verified`: `true` iff `serving_family` is a known family AND
  differs from the session family; otherwise `false`
- `model_requested`: `reviewer`; `model_actual`: from the return if named,
  else `unverified`
- `effort_requested` / `effort_actual`: `unverified`
- `receipt_supported`: `true` when `model_actual` is named, else `false`
- `findings` (peer `safe_auto` downgraded to `gated_auto`), `residual_risks`,
  `testing_gaps`

## 4. Fold-in

Collect the task return, then read the artifact. Fold findings through ordinary
dedup. Promote agreement, and skip a validator, only when
`independence_verified` is `true`. Name route, model, effort, and independence
from the artifact. A missing file means the pass did not run; never fail the
review for it.
