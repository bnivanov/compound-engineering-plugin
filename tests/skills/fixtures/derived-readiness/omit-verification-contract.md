---
artifact_contract: ce-unified-plan/v1
execution: code
---

# Widget greeter - Plan

## Goal Capsule

Add `greetQuiet(name)` that returns an empty string when `name` is blank.

## Product Contract

### Requirements

- R1: `greetQuiet(name)` returns an empty string when `name` is blank.
- R2: Existing `greet` behavior is unchanged.

## Planning Contract

Planned approach: export `greetQuiet` from `src/greet.js` next to `greet`, reusing the existing blank-name check style of `greet`. No open questions; the blank-name edge case is settled as return `""`.

## Implementation Units

### U1. Quiet greeter

- Files: `src/greet.js`
- Approach: export `greetQuiet` next to `greet`
- Verification: a node assertion that blank input returns `""`

## Definition of Done

- Both requirements above are demonstrably met by the verification contract.
- No launch-blocking open question remains.
