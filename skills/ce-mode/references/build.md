# Build

**Entry:** a capability the repo does not have.

If the request no longer matches this playbook, return to the match table.

1. **Scope.** Invoke `ce-brainstorm` when the user cannot already state done. Artifact: a requirements-only plan, or a chat paragraph. Skip when they can.
2. **Plan (G1).** Invoke `ce-plan`. Artifact: a plan path.
3. **Work (G2).** Invoke `ce-work` with that plan path. Artifact: a locally verified change set and the evidence that run recorded.
4. **Simplify.** Invoke `ce-simplify-code`. Skip docs-only or roughly under 10 lines. Artifact: the same change, behavior preserved.
5. **Review (G3).** Invoke `ce-code-review`. Artifact: a review report.

Then follow the shared tail in this skill's kernel.
