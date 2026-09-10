# Ship

**Entry:** existing work the user said to ship.

If the request no longer matches this playbook, return to the match table.

1. **Simplify.** Invoke `ce-simplify-code`. Skip docs-only or roughly under 10 lines. Artifact: the same change, behavior preserved.
2. **Review (G3).** Invoke `ce-code-review`. Artifact: a review report.

**User-runnable invocation rendering.** When this skill prints or copies a user-runnable invocation, use `/ce-commit-push-pr`. Render only the invocation as inline code and output exactly one form.

3. **Ship.** Invoke `ce-commit-push-pr`. Artifact: an open PR, or local commits when there is no remote.
4. **Watch.** Read `ce-commit-push-pr`'s reported result. Invoke `ce-babysit-pr` only when that result leaves watch still owed. The result reports whether it already handed off and whether the user opted out. When the callee already settled watch, this step is complete. Artifact: CI and review watch on that PR.

Then follow the shared tail in this skill's kernel.
