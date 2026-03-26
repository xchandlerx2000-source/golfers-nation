# Developer Review Map

This repo now follows one source-of-truth workflow for review and integration.

## Development policy

Before changing features, read [DEVELOPMENT_POLICY.md](C:/Users/Bower/OneDrive/Desktop/golf%20nation/DEVELOPMENT_POLICY.md).

That policy defines:
- what must live in shared packages
- what is native-first
- what stays web-only
- when parity is required
- how features should be classified before coding

For actual feature intake and planning, use:
- [feature-planning-workflow.md](C:/Users/Bower/OneDrive/Desktop/golf%20nation/docs/feature-planning-workflow.md)
- [feature-plan-template.md](C:/Users/Bower/OneDrive/Desktop/golf%20nation/docs/feature-plan-template.md)

## Edit vs generated

- Edit application logic only in `src/`
- Edit browser shell files only in `src/shell/`
- Edit build tooling only in `scripts/`
- Do not manually edit:
  - `app.js`
  - root shell files
  - anything in `dist/`

Those are generated outputs rebuilt by the project build scripts.

## Suggested review order

1. `README.md`
2. `docs/backend-ready-architecture.md`
3. `docs/supabase-setup.md`
4. `src/bootstrap/`
5. `src/state/`
6. `src/services/`
7. `src/ui/`

## Main module seams

- `src/bootstrap/`
  App boot, service worker registration, startup recovery.
- `src/state/`
  Store, persistence, session state, round state.
- `src/services/`
  Auth, data, realtime, Supabase bridge, course providers, product platform.
- `src/domain/`
  Round factories, scoring, round sync, course models.
- `src/ui/`
  Templates, render pipeline, view controller.

## Backend and live service seams

- `src/services/product-platform.js`
  Chooses local vs Supabase-backed gateways.
- `src/services/auth-gateway.js`
  Account auth boundary.
- `src/services/data-gateway.js`
  Workspace/profile persistence boundary.
- `src/services/realtime-gateway.js`
  Low-level live transport boundary.
- `src/services/realtime-session-service.js`
  Host/join/publish orchestration.
- `src/services/course-service.js`
  Provider-agnostic course search, nearby lookup, and round template building.

## Current live vs scaffolded

Live now:
- PWA shell
- local-first persistence
- Supabase auth/data path
- live round/session structure
- provider-agnostic local course layer

Scaffolded for later:
- licensed course database provider
- GolfNow provider
- maps / places provider
- deeper native proximity integrations

## Review note

This project uses a generated browser bundle. Source review should happen in `src/`, not by editing `app.js`.
