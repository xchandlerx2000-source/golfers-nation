# Development Policy

## Product Ownership
- Shared packages are the source of truth for app logic.
- The native app is the primary product target.
- The web app is secondary but maintained.
- APKs are disposable test artifacts rebuilt from the native app.

## What Must Be Shared
Put product behavior and data rules in shared packages first.

Must be shared:
- scoring rules
- round lifecycle rules
- game mode behavior
- leaderboard generation
- finish, leave, and end round rules
- course normalization
- course search ranking logic
- course template generation
- player stats calculations
- social/friend derived logic
- live session reconciliation logic
- backend contract shapes
- data transformation and validation logic

Primary shared locations:
- `packages/core`
- `packages/course`
- `packages/backend`

Rule:
- If a feature changes product outcomes, round state, scoring, or backend-facing behavior, it should not live only in a client.

## What Is Native-First
Anything tied to the real mobile product experience defaults to native first.

Native-first:
- Home, Score, Community, and Profile UX
- navigation
- sheets, modals, drawers, accordions
- button feel and gestures
- inputs and keyboard behavior
- safe-area handling
- native auth/session UX
- native realtime room behavior
- notifications
- GPS/location
- course view and green view
- club tracking
- device integrations
- store release readiness
- crash reporting and mobile analytics
- offline/on-device cache behavior

Primary native location:
- `apps/native`

Rule:
- If the feature exists because this is becoming a real phone app, native owns it first.

## What Stays Web-Only
Web-only should be limited to iteration, fallback access, and internal tooling.

Web-only:
- quick prototype UI experiments
- temporary tester flows
- internal admin/review tooling not needed on-device
- desktop-friendly diagnostics
- web-specific deploy helpers
- PWA/service-worker behavior
- browser-only support/testing surfaces

Primary web locations:
- `src/ui`
- `src/shell`

Rule:
- Web-only is acceptable if the feature is not part of the core mobile product promise.

## What Should Ship In Both Clients
Only parity-critical product spine features should be maintained in both clients.

Ship in both when the feature is core to the product:
- auth/sign-in basics
- Home launch state
- Start Round
- course select
- format select
- join by code
- live lobby basics
- score entry
- finish/end/leave round
- basic profile identity and stats
- core multiplayer/session behavior

Rule:
- If users must trust it as a core Golfers Nation behavior, keep it aligned across web and native.

## Decision Order Before Coding
Use this order every time:

1. Is it product logic or data logic?
- Yes: shared first.

2. Is it part of the core mobile experience?
- Yes: native first.

3. Does web still need it for parity or validation?
- Yes: port to web after shared/native is stable.

4. Is it only useful for internal/testing/admin/prototype use?
- Yes: web-only is fine.

5. Is it a build artifact concern?
- Yes: never code against the APK; rebuild from native.

## Working Rules
Before coding a feature:
- identify shared logic first
- decide if web truly needs parity
- classify it as `shared`, `native-first`, `web-only`, or `parity`

Artifact handling:
- never commit APK, AAB, APKS, Expo export output, or sideload bundles
- treat installable Android/iOS files as disposable release artifacts
- distribute test binaries through EAS artifact links or release storage, not git
- keep `apps/native/.expo-export` and `sideload-test/` out of source control

Planning artifacts:
- `docs/feature-planning-workflow.md`
- `docs/feature-plan-template.md`

Implementation order:
1. shared package changes
2. native implementation
3. web parity only if justified
4. rebuild APK from native when needed

## Definition Of Done
A feature is done only when:
- shared logic is in the right package if applicable
- native behavior works if it belongs to the mobile product
- web parity is updated if the feature is parity-critical
- tests are updated at the correct layer
- Android test builds can be regenerated from native if needed
