---
name: ce-undo
description: "Reverse the agent's last change set at the smallest grade that undoes it — commits, working tree, or branch — after one confirmation. Use when the agent's own recent changes should be taken back."
argument-hint: "[commits | tree | branch]"
---

# /ce-undo

Reverse an agent's change set with one confirmation. Do not invent a fourth grade.

## Grades

1. **commits** (default) — `git revert` the commit(s) this agent made on the current branch this session. Prefer revert over reset when the commits were pushed.
2. **tree** — restore tracked files to `HEAD` (`git restore --source=HEAD --worktree --staged -- <paths>`). Untracked files the agent created are listed and deleted only after confirmation.
3. **branch** — switch back to the previous branch and leave the agent's branch unmerged. Do not `git branch -D` unless the user names the branch to delete.

If the invocation names a grade, use it. Otherwise pick the smallest grade that undoes the visible damage and say which grade you picked.

## Confirmation

**MUST stop without acting until the user confirms.** Show:

- grade
- exact git commands
- files or commits that will change
- whether anything was pushed (revert vs reset)

On confirm, run only those commands. On redirect, follow the new grade or stop.

## Safety

- Never `git push --force` to a shared default branch.
- Never drop uncommitted work the user wrote (not this agent) without saying so.
- If you cannot tell agent changes from user changes, stop and ask rather than guessing.
- This skill does not resume plugin runs; it only reverses git state.
