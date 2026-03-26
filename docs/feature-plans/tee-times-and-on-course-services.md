# Feature Plan

## Feature
- Name: Tee Times and On-Course Service Requests
- Requested by: Product direction / user ideation
- Date: 2026-03-26

## Outcome
- Golfers Nation should eventually let golfers book or request tee times through the app and request on-course service during a round. The product should feel like a real golf operating platform, not just a scoring app. However, these are not small UI additions. They require partner/course operations, backend contracts, request lifecycle handling, and clear course-by-course availability rules.

## Classification
- Type: `shared` + `native-first`
- Reason:
  - tee time booking/request changes core product data, backend contracts, and request state
  - on-course service requests change round/session state and require backend workflow
  - the mobile experience should be primary if these become real product features

## Shared logic impact
- Does this change product logic or data rules? `yes`
- If yes, which package(s)?
  - `packages/core`
  - `packages/backend`
  - `packages/course`
- Shared modules/files to touch:
  - tee time request models
  - service request models
  - request status lifecycle
  - course capability flags
  - backend gateway interfaces

## Client ownership
- Native work required: `yes`
- Web work required: `yes`, but later
- Is parity required: `no` for the first phase
- Reason:
  - native should own the first customer-facing experience
  - web can support admin/testing views later
  - this should not block core mobile product progress

## UI ownership
- Native UI files:
  - future tee time flow screens in `apps/native/app`
  - future service request surface in `apps/native/app/(tabs)/score.js` or a nested round route
- Web UI files:
  - optional admin/testing tools later
  - optional fallback request views later
- Can any UI stay web-only:
  - yes, internal partner/admin tooling

## Data/backend impact
- Auth impact:
  - users must be authenticated for booking/request ownership
- Data persistence impact:
  - store tee time requests, booking metadata, service requests, request status, timestamps, and course/operator response state
- Realtime impact:
  - service requests likely need live status updates
  - tee time booking can start with async request/confirmation
- Course/catalog impact:
  - courses need capability flags such as:
    - accepts tee time requests
    - has direct booking link
    - supports on-course service requests
    - supports beverage cart / marshal / club services

## Product constraints
- Tee times are not just a UI feature. Real booking usually requires:
  - direct course partnership
  - aggregator integration
  - external booking links
  - or a request/lead workflow first
- “Cart girls” should be implemented as a broader and more defensible product concept:
  - `On-course service request`
  - examples:
    - beverage cart
    - food/drink
    - club service
    - marshal/help
- That framing is easier to support operationally, easier to sell to courses, and safer as a long-term product feature.

## Recommended phased rollout

### Phase 1
- Add course capability flags in shared course/backend models
- Add external tee time link support per course
- Add a simple native `Book Tee Time` / `Visit Booking Site` CTA when a course supports it
- No direct booking flow yet

### Phase 2
- Add tee time request objects and status lifecycle
- Support:
  - requested
  - confirmed
  - rejected
  - canceled
- Start with request-based partner workflow, not instant booking

### Phase 3
- Add on-course service requests during a live round
- Start with a generic request button and service types
- Keep it disabled unless the course supports it

### Phase 4
- Add operator-facing admin tooling
- web can own internal dashboards here

## Implementation order
1. Define shared models and capability flags for tee times and on-course service requests
2. Add backend contracts and persistence shape without exposing major UI yet
3. Add native-first course-level tee time CTA flow
4. Add native on-course service request flow only for flagged/supported courses

## Tests
- Shared tests:
  - request lifecycle transitions
  - capability flag handling
  - course support detection
- Native tests:
  - CTA visibility only on supported courses
  - request creation flow
  - round service request entry flow
- Web tests:
  - only if internal admin/request review UI is added
- Manual checks:
  - supported course shows tee time CTA
  - unsupported course does not
  - service request button only appears when course capability is enabled
  - request state updates remain stable across session restore

## Definition of done
- Shared models and lifecycle rules exist
- Native UI only exposes supported features
- Unsupported courses do not show fake/placeholder controls
- Tests cover lifecycle and visibility rules
- Android test build can be regenerated from native if needed

## Recommendation
- Do not implement full tee time booking first.
- Start with:
  - course capability flags
  - external booking link support
  - request-based tee time workflow
  - generic on-course service requests
- This gets Golfers Nation closer to a real golf platform without overcommitting to course-operations complexity on the first pass.
