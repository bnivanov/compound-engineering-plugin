# Supervised LFG

Armed by `mode:supervised` or checkout `lfg_supervised: true`. Adds exactly two
gates. Never a third.

Before step 1: if the host exposes `budget`, name remaining budget in one line.
If `max_run_budget` is set and remaining budget is below it, stop before step 1.

**Plan gate (after step 1):** STOP and ask whether to proceed with
implementation. On no, output DONE with the plan path; do not start step 2.

**Review gate (after step 4):** STOP and ask whether to open the PR. On no, keep
the local commits and skip steps 8–9.
