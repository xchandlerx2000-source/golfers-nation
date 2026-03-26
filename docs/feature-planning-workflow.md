# Feature Planning Workflow

Use this workflow before implementation so feature routing is decided once and documented.

## Goal

Classify every feature before coding so work is not routed ad hoc between shared packages, native, and web.

## Required output

Before implementation, every feature should produce a short plan that answers:
- what problem is being solved
- what type of feature it is
- what must be shared
- whether native owns the UI first
- whether web needs parity
- what can stay web-only
- what tests are required

Use [feature-plan-template.md](C:/Users/Bower/OneDrive/Desktop/golf%20nation/docs/feature-plan-template.md).

Feature plans should be saved under:
- `docs/feature-plans/`

## Classification steps

1. Define the product change
- Describe the user-visible outcome in one short paragraph.

2. Classify the feature
- `shared`
- `native-first`
- `web-only`
- `parity`

3. Identify shared logic
- Decide whether the feature changes scoring, round state, live state, course logic, backend contracts, or derived player/social logic.
- If yes, shared packages must be updated first.

4. Identify client ownership
- If it is part of the real mobile app experience, native owns the UI first.
- If it is only for internal tooling, diagnostics, or browser-specific support, web-only is acceptable.
- If it is core product spine behavior, plan parity across native and web.

5. Define implementation order
- shared packages
- native client
- web parity if required
- test build regeneration if needed

6. Define tests
- shared unit tests for logic
- native/client tests if UI or state changes
- web tests only when parity or web-only behavior is affected

## Routing rules

### Shared
Use when the feature changes:
- scoring
- round lifecycle
- course selection/build logic
- leaderboard behavior
- player stats logic
- social derived behavior
- backend-facing contracts

Primary locations:
- `packages/core`
- `packages/course`
- `packages/backend`

### Native-first
Use when the feature changes:
- app navigation
- mobile UI/UX
- sheets/modals/drawers
- score entry UX
- auth/session UX
- realtime room UX
- mobile caching
- device capability hooks

Primary location:
- `apps/native`

### Web-only
Use when the feature is:
- internal admin tooling
- browser-specific support
- temporary prototype UI
- diagnostics/review tooling
- PWA-only behavior

Primary locations:
- `src/ui`
- `src/shell`

### Parity
Use when the feature affects the core product spine:
- auth/sign-in basics
- Home launch state
- Start Round
- join by code
- live lobby basics
- score entry
- finish/end/leave round
- basic profile identity and stats

## Exit criteria

A feature is ready to implement only when:
- its classification is explicit
- shared changes are identified or ruled out
- native/web ownership is explicit
- parity requirement is explicit
- tests are identified

If those answers are missing, the feature plan is incomplete.
