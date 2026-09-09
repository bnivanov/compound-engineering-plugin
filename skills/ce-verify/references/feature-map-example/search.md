# Search

Find notes by substring, tag, or recency.

## Sub-features

- Substring match across title and body
- `--tag` filter
- `--open` to print the matching file path

## How to get to it (user POV)

From any directory in the notes vault:

```text
note search meeting
note search --tag work inbox
```

An empty query lists the twenty most recently edited notes.

## Driving it with PTY

1. Start `note search <query>` in a PTY with the vault as cwd.
2. Wait for a line matching `^[0-9]+ hits?$`.
3. To open the first hit, send `--open` on a second invocation of the same query rather than paging a list — this CLI prints and exits.
4. A non-zero exit with `not a vault` means cwd is wrong, not that search is broken.

## Gotchas

- Quoting: `note search " hal"` keeps the leading space; unquoted words are separate terms (AND).
- `--tag` is exact and case-sensitive.
- Exit 1 means zero hits; exit 2 means usage or vault error. Do not treat exit 1 as a driver failure.
