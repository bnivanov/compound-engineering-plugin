# Independent Judgment Pass (OMP-only)

Independence is a `reviewer` agent whose serving family differs from the
session family. Dispatch it through the host `task` tool (`agent: reviewer`).
There is no shell worker and no `omp -p` subprocess.

Run one task per activated trio lens (`security-lens`, `adversarial`,
`product-lens`) plus one `whole-doc` sweep of the full document, only when that
lens was activated by Phase 1 selection. No new activation triggers exist.

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

Dispatch one `task` item per activated lens:

- `agent: reviewer`
- Read-only. The prompt forbids writes, shell, and tree mutation.
- Prompt: apply the persona at `references/personas/<persona-file>.md` to the
  document path, type, and origin; return findings JSON. `<reviewer-name>`
  derives the persona brief and is never a path.

Do not invoke a shell worker. That worker is gone.
Do not start a foreign CLI.

If the host exposes a per-agent model pin, pin the reviewer to a model whose
family differs from the session family. If it does not, dispatch anyway and
record independence as unverified.

Documents over `CROSS_MODEL_MAX_DOC_CHARS` skip cleanly rather than truncate.

## 3. Receipt

Write `<run-dir>/<reviewer-name>-omp.json`:

- `reviewer`: `<reviewer-name>-omp`
- `cross_model_route` / `cross_model_target` / `cross_model_harness`: `omp`
- `serving_family`: from host/backend attestation of the reviewer agent (event-stream or return metadata), else `unknown`
- `independence_verified`: `true` only when `serving_family` is a known family, differs from the session family, AND came from that attestation — never from the reviewer's own prose. Otherwise `false`
- `model_requested`: `reviewer`; `model_actual`: attested serving model, else `unverified`
- `effort_requested` / `effort_actual`: `unverified`
- `receipt_supported`: `true` only when `model_actual` is attested, else `false`
- `findings` (peer `safe_auto` downgraded to `gated_auto`), `residual_risks`,
  `deferred_questions`

## 4. Fold-in

Collect each task return, then read the artifact. Fold findings through ordinary
synthesis. Promote agreement only when `independence_verified` is `true`. A
missing file means the pass did not run; never fail the review for it.
