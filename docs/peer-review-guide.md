# Golfers Nation Review Guide

This is the fastest way to hand Golfers Nation to a business partner, developer, or leadership reviewer without losing the big picture.

## Review package

- Business overview: `docs/business-partner-overview.md`
- Technical review guide: `docs/peer-review-guide.md`
- Single-file code bundle: `docs/peer-review-bundle.md`
- Source app code: `src/`
- Source tests: `tests/`

## Best order to review

1. Read `docs/business-partner-overview.md`
2. Read `README.md`
3. Open `docs/peer-review-bundle.md` for the full code and tests in one file
4. If deeper review is needed, inspect the source files in `src/` and `tests/`

## Build the review bundle

Run:

`npm run review:bundle`

That regenerates `docs/peer-review-bundle.md` with the current source files, runtime config scaffolding, deploy scripts, and tests in one place.

## What is live today

- Real Supabase email sign-up and sign-in
- Real per-user round, settings, and history persistence
- Session restore on reload
- Golden Nugget Lake Charles as the default first-course path
- PWA install support for phone testing
- Local-first live round safety with pending sync and retry states

## What is still mocked or scaffolded

- Google sign-in
- Apple sign-in
- Full production realtime multiplayer sync
- Live billing and subscription charging
- External social sharing APIs

## What reviewers should look at first

- App bootstrap and runtime flow:
  - `src/main.js`
  - `src/services/product-platform.js`
- Auth and user isolation:
  - `src/services/auth-gateway.js`
  - `src/services/account-service.js`
  - `src/services/data-gateway.js`
  - `src/services/supabase-rest.js`
- Round logic and live-round reliability:
  - `src/domain/factories.js`
  - `src/domain/scoring.js`
  - `src/domain/round-sync.js`
- Course library and real course setup:
  - `src/services/course-library.js`
- UI shell and screens:
  - `src/ui/templates.js`
  - `styles.css`
- Tests:
  - `tests/`

## Current reviewer demo flow

1. Open the app and create an account with a real email
2. Land in the Home screen with a clean new-user workspace
3. Start a round
4. Keep Golden Nugget selected as the default first course
5. Enter scores and finish the round
6. Refresh and confirm rounds and stats restore for that user
7. Sign out and sign in as another user to verify account separation

## Recommended leadership review questions

- Does the product feel credible enough for real tester distribution?
- Is the live-round experience strong enough to be the core product hook?
- Is the current foundation strong enough to invest further in backend, billing, and realtime?
- Which next step has the highest launch value:
  - stronger realtime play
  - more course coverage
  - premium feature expansion
  - analytics and tester feedback

## Suggested technical peer review questions

- Is the bootstrap flow safe and recoverable on empty or bad state?
- Are rounds, settings, and stats isolated correctly per authenticated user?
- Are the Supabase service boundaries clean enough for production hardening?
- Is the live-round local-first retry model trustworthy under weak signal?
- Are there any remaining UI actions that still feel dead or misleading?
