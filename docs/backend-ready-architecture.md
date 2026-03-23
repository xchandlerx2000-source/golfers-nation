# Backend-Ready Architecture

Golfers Nation still runs locally for testing, but auth, persistence, and round sync now sit behind backend-friendly service boundaries.

## What Is Mocked Today

- Auth provider execution is still local and mocked for Google and Apple.
- Data still persists to local storage on the device.
- Real-time round sync still uses device-only transports like `BroadcastChannel`, nearby mode, and browser Bluetooth fallback.

## What Is Backend-Ready Now

- `src/services/auth-gateway.js`
  - Central auth boundary for email sign-up, email sign-in, OAuth-style provider sign-in, sign-out, session restore, review accounts, and test premium toggling.
- `src/services/data-gateway.js`
  - Central data boundary for loading app state, persisting state, saving user workspaces, and exporting backend-ready workspace snapshots.
- `src/services/realtime-gateway.js`
  - Central real-time boundary for session lifecycle, round update publishing, transport changes, nearby sync, and Bluetooth sync.
- `src/services/backend-models.js`
  - Supabase-friendly and Firebase-friendly record serializers for accounts, profiles, rounds, groups, tournaments, gear, and session state.
- `src/services/product-platform.js`
  - Single platform factory that composes auth, data, and realtime adapters so the app can swap providers later without rewriting the UI flow.

## Supabase Migration Notes

- Auth
  - Replace `createLocalAuthGateway()` with a Supabase-backed gateway that calls `supabase.auth.signUp`, `signInWithPassword`, `signInWithOAuth`, `signOut`, and `getSession`.
- Data
  - Persist `auth_user`, `profiles`, `rounds`, `groups`, `tournaments`, `gear_items`, and `social_activity` into Postgres tables.
  - Use the shapes returned by `toBackendWorkspaceSnapshot()` as the starting contract for insert/upsert operations.
- Realtime
  - Replace `createLocalRealtimeGatewayFactory()` with a Supabase Realtime adapter that subscribes to round/group channels and publishes score updates through row changes or broadcast channels.

## Firebase Migration Notes

- Auth
  - Replace `createLocalAuthGateway()` with Firebase Auth methods for email/password, Google, Apple, session restore, and sign-out.
- Data
  - Store serialized workspace collections in Firestore documents and subcollections using the snapshot returned by `toBackendWorkspaceSnapshot()`.
- Realtime
  - Replace the local realtime adapter with Firestore listeners or Realtime Database subscriptions for round updates, group presence, and shared score changes.

## Recommended First Production Swap

1. Replace the auth gateway.
2. Replace the data gateway.
3. Replace the realtime gateway.

The UI and round flow should stay largely unchanged if those adapters preserve the current method contracts.
