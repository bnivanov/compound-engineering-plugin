# Merge Conflicts

Load this when an in-progress git merge, rebase, or cherry-pick has offered conflicted files. It traces both sides' intent so a resolution can preserve the behaviors and user data those sides carried. It does not finish or abort the operation.

**Result:** each offered file is either resolved so both intended behaviors survive (or names an explicit trade-off when they cannot compose) or returned as semantically ambiguous.
**Next consumer:** the caller that owns continue and abort of the in-progress operation.
**Done:** every offered conflict is classified; conflict markers remain only on files returned as ambiguous; this helper has not continued or aborted the git operation.

`ce-babysit-pr` still parks unresolvable semantic conflicts as `needs-human`. This reference does not change that boundary and does not authorize babysit to continue, abort, rebase, or force-push.

## Identify the operation and the offered files

Name the in-progress operation from git state, not from the conversation. Merge leaves `MERGE_HEAD`; rebase leaves `rebase-merge/` or `rebase-apply/`; cherry-pick leaves `CHERRY_PICK_HEAD`. If none of those is present, this helper does not apply.

The offered set is the paths git still lists as unmerged. Do not resolve a path that is not in that set, and do not skip one that is. Record ours, theirs, and base blob identities for each unmerged path so a later clean file can still be compared to what was offered.

## Trace intent on both sides, including base

For each offered path, recover why each side changed it, including the merge base:

- The merge base is the shared starting point, not a third side to discard.
- Ours and theirs are the two intents that must compose. Read the commits that touched the path on each side, their messages, and any linked PR or issue — that history is the primary source of intent, not the conflict markers.
- Uncommitted user edits in an offered file are user data. Preserve them; they are not a vote for either side.

If intent cannot be recovered from history, return that gap rather than inventing behavior.

## Preserve both behaviors; distinguish text from meaning

Where both intents can coexist, keep both. Where they cannot, pick the one that matches the operation's stated goal — the merge, rebase, or cherry-pick the caller started — and record the trade-off. Do not invent a third behavior.

Removing conflict markers and leaving a compiling file is textual success only. Semantic ambiguity remains when two resolutions are still plausible, when the composed result would change user-visible behavior neither side asked for, or when user data would be dropped. Return those files unresolved rather than guessing.

Continue and abort stay with the caller after this helper returns. This helper never treats "always resolve, never abort" as a rule, and it does not run a finishing pipeline of checks or `git * --continue`.
