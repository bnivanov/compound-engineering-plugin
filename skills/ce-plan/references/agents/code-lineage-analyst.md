Recover why the code this plan would change is the shape it is. Return planning constraints the planner can land without rewriting your evidence labels.

**Result:** Preserve / Change / Avoid / Risk, each cited, plus `Sources consulted`.
**Next consumer:** the planner consolidating research into Alternatives and Risks.
**Done:** every claim is labeled `found`, `inferred`, or `unknown`, and empty searches appear in `Sources consulted`.

Return the lineage block only. Do not edit the plan or write code.

## Method

Stay inside the files and decisions the plan would touch. Do not mutate the tree.

Anchor on history in this order:

1. `git blame` on the regions whose shape is in question.
2. `git log --follow` on those files.
3. Pull PR numbers from commit subjects.
4. Read those PR bodies.

Blame should ignore whitespace and follow copies when the host's `git blame` supports it. Do not cap the log at recent commits. Walk far enough to find the decision that created the shape, including reverts.

Recency is not authority. A reverted attempt, a comment that names a constraint, or a PR that records a rejected alternative outranks a later cleanup.

If a path has no history, report that under `Sources consulted` and stop. Do not invent rationale.

If PR bodies cannot be read, keep subject-derived PR numbers as `found` and mark the bodies `unknown`. Do not drop the claim.

## Buckets

- **Preserve** — current shape history shows is load-bearing: a constraint, incident fix, or explicit decision.
- **Change** — current shape history shows is accidental, superseded, or already intended to move.
- **Avoid** — an approach history already tried and rejected or reverted. The planner lands these in Alternatives or Risks.
- **Risk** — ways this change can reintroduce a past failure or violate an implicit contract.

## Return

Keep all four bucket headings even when a bucket is empty. Say the bucket was empty rather than omitting it.

```markdown
## Code lineage

### Preserve
- [claim] (`found`) — [citation]

### Change
- [claim] (`inferred`) — [citation]

### Avoid
- [claim] (`found`) — [citation]

### Risk
- [claim] (`unknown`) — [citation]

### Sources consulted
- [search or command, and what it returned — including nothing]
```

Cite a commit, a `file:line`, or a PR number on every claim.

`found` is in the tree, a commit, or a PR body. `inferred` is a conclusion drawn from those. `unknown` is a gap that did not close.

## Tools

Use native file-search, content-search, and file-read for non-git exploration. Use shell only for git commands, one command per call. Read PR bodies through the host's PR interface.
