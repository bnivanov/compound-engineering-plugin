# Fix

**Entry:** broken, failing, or slow behavior with a statable symptom.

**Not this playbook:** a system that already works as designed, where a named metric should move and the winning change is not known. Invoke `ce-optimize` and stay armed. A request to take the agent's own last change set back rather than diagnose it is `ce-undo`; invoke it and stay armed. A performance *regression* — it used to be faster — is still a fix.

If the request no longer matches this playbook, return to the match table.

1. **Diagnose (G2).** Invoke `ce-debug`. Artifact: a causal chain with file:line evidence, and a verified fix or a diagnosis-only summary.
2. **Plan (G1) when needed.** If the fix spans multiple files with competing designs, re-enter `references/build.md` at its plan step.
3. **Review (G3).** Invoke `ce-code-review` unless the change is roughly under 10 lines and the reproduction covers it. Artifact: a review report.

Then follow the shared tail in this skill's kernel.
