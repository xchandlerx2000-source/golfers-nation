# Golfers Nation Product Foundation

## Recommended file structure

```text
index.html
styles.css
app.js
src/
  config.js
  main.js
  domain/
    factories.js
    scoring.js
  services/
    storage-service.js
    mock-api.js
    sync-service.js
  state/
    default-state.js
    store.js
  ui/
    render.js
    templates.js
  utils/
    formatters.js
docs/
  product-foundation.md
```

## Architectural decisions

1. The app is split into `domain`, `services`, `state`, and `ui` so business rules do not depend on the current rendering approach.
2. Invite-code social linking is the primary multiplayer flow. Nearby and browser Bluetooth are optional transports behind `sync-service.js`, which keeps the long-term architecture open for native BLE or real backend sockets later.
3. Rounds, groups, tournaments, and gear are modeled as first-class records with stable IDs so the app can move from local storage into a backend without changing the mental model.
4. The state layer is intentionally lightweight. The store and renderer can be swapped for React, React Native, Zustand, Redux, or another mobile state solution later.
5. Scoring logic is mode-aware and separate from templates, which is important for adding skins, best ball, Stableford, or league formats later.

## Suggested backend schema

### users

- `id`
- `display_name`
- `home_course`
- `handicap_index`
- `city`
- `season_goal`
- `created_at`
- `updated_at`

### player_profiles

- `id`
- `user_id`
- `dominant_hand`
- `preferred_ball`
- `bag_summary`
- `avatar_url`

### groups

- `id`
- `title`
- `host_user_id`
- `invite_code`
- `status`
- `transport_type`
- `created_at`
- `updated_at`

### group_members

- `id`
- `group_id`
- `user_id`
- `round_player_id`
- `role`
- `connection_state`
- `joined_at`

### rounds

- `id`
- `group_id`
- `tournament_id`
- `status`
- `mode`
- `course_name`
- `tee_box`
- `weather_snapshot`
- `visibility`
- `invite_code`
- `started_at`
- `completed_at`
- `created_at`
- `updated_at`

### round_players

- `id`
- `round_id`
- `user_id`
- `display_name`
- `role`

### round_sides

- `id`
- `round_id`
- `name`

### round_side_members

- `id`
- `side_id`
- `round_player_id`

### round_holes

- `id`
- `round_id`
- `hole_number`
- `par`
- `yards`

### hole_scores

- `id`
- `round_hole_id`
- `participant_type`
- `participant_id`
- `strokes`
- `putts`
- `fairway_hit`
- `gir`
- `updated_at`

### tournaments

- `id`
- `name`
- `course_name`
- `date`
- `mode`
- `field_size`
- `status`
- `created_at`

### tournament_entries

- `id`
- `tournament_id`
- `user_id`
- `seed`
- `status`

### gear_items

- `id`
- `user_id`
- `category`
- `name`
- `notes`
- `weather_use`
- `packed`
- `created_at`
- `updated_at`

### sync_events

- `id`
- `round_id`
- `group_id`
- `actor_user_id`
- `event_type`
- `payload_json`
- `created_at`

## Native app migration path

1. Move `src/domain` directly into a shared package or monorepo workspace. These files already avoid DOM dependencies.
2. Replace `src/state/store.js` with a mobile state layer such as Zustand, Redux Toolkit, or React Context plus hooks.
3. Swap `src/ui/templates.js` for React Native screens and components while keeping factories, scoring, and most service contracts intact.
4. Replace `storage-service.js` with SQLite, MMKV, or Realm for offline persistence on device.
5. Replace `mock-api.js` with real API clients. Keep the same high-level methods for host round, join by invite code, fetch nearby games, and get gear recommendations.
6. Replace `sync-service.js` transport internals with WebSocket or Supabase Realtime for cloud sync, plus native BLE or Multipeer/Nearby Connections if local-only linking is still desired.
7. Add auth, user identity, push notifications, and media upload once the backend is in place.

## Roadmap from MVP to production

### Phase 1

- Offline-first web foundation
- Invite-code hosting and joining
- Mode-aware score tracking
- Round history persistence
- Tournament and gear scaffolds

### Phase 2

- Real backend with auth and sync
- Cloud-hosted invite code rooms
- Live leaderboard updates
- Tournament registration and event admin
- Gear catalog and affiliate integration

### Phase 3

- Native mobile app
- Push notifications
- GPS/course mapping
- Native BLE and nearby play experiments
- Commerce, drops, and personalized recommendations

### Phase 4

- Regional ladders and leagues
- Verified tournament payouts
- Team formats beyond scramble and match
- Rich player profile stats and coaching insights
