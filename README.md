# Golfers Nation

Golfers Nation now runs as a monorepo with two clients:

- a native Expo app as the primary product target
- a maintained web app for desktop use, testing, and fallback workflows

Shared product logic lives in shared packages so scoring, course behavior, and backend-facing rules stay consistent across both clients.

## Current product areas

- Live group play and score syncing
- Golfer stats and player history
- Tournament creation and management scaffold
- Local and social game linking
- Gear, apparel, and accessory scaffold

## Platform split

- `apps/native`
  Primary mobile product. Native polish, installable tester builds, mobile realtime, and future device features belong here first.
- `src/` and `src/shell/`
  Maintained web client. Keep it functional for browser testing, desktop access, and larger-screen workflows such as tournament review.
- `packages/core`, `packages/course`, `packages/backend`
  Shared source of truth for product logic and backend contracts.

## Architecture at a glance

- `apps/native`: Expo Router app, native screens, Zustand store, and mobile runtime integrations
- `packages/core`: shared round logic, scoring, sync helpers, and request lifecycle helpers
- `packages/course`: shared course models, capability helpers, and search/ranking helpers
- `packages/backend`: shared backend contracts and backend-facing models
- `src/shell`: the only editable browser shell source for `index.html`, `styles.css`, `manifest.json`, `service-worker.js`, and `runtime-config.js`
- `src/domain`: round factories and scoring logic
- `src/services`: storage, mock API, and sync transport layer
- `src/state`: seed data and lightweight store
- `src/ui`: render pipeline and templates
- `app.js`: generated browser bundle output, never hand-edited
- `dist/`: generated deploy package for Cloudflare/Netlify, never hand-edited

## Source-of-truth workflow

Golfers Nation now follows one shared-core workflow:

- Edit shared product logic in `packages/`
- Edit native client code in `apps/native/`
- Edit web client code in `src/` and `src/shell/`
- Edit build/deploy tooling in `scripts/`

Do not edit these generated outputs directly:

- `app.js`
- `index.html`
- `styles.css`
- `manifest.json`
- `service-worker.js`
- `runtime-config.js`
- anything inside `dist/`

Those files are build artifacts generated from `src/` and `src/shell/`.

## Development policy

Before adding or changing features, read [DEVELOPMENT_POLICY.md](C:/Users/Bower/OneDrive/Desktop/golf%20nation/DEVELOPMENT_POLICY.md).

That policy defines:

- what must live in shared packages
- what is native-first
- what stays web-only
- when web/native parity is required
- how features should be classified before coding

Contributors should follow that policy so shared logic stays centralized, native remains the primary product target, and web stays maintained without becoming a second competing product.

For Android tester builds and sideload workflow, use [docs/native-sideload-testing.md](C:/Users/Bower/OneDrive/Desktop/golf%20nation/docs/native-sideload-testing.md).

## Web + APK test release

The old manual chain:

- `npm run build:cloudflare`
- `git add .`
- `git commit -m "..."`
- `git push ...`

does not reliably trigger an Android test build by itself. Use the wrapper script instead from the repo root:

- `npm run release:test -- --CommitMessage "redeploy latest update"`
- `npm run release:test:force -- -CommitMessage "redeploy latest update"`

That flow:

- rebuilds the Cloudflare web package
- stages and commits current repo changes if needed
- pushes `main`
- triggers a new Expo sideload APK build with `--no-wait`
- prints the latest Android build list so the new artifact can be tracked

Use the force variant only when you intentionally want the same behavior as `git push -f origin main`.

## Run it

1. Install dependencies:
   `npm install`
2. Start the native app:
   `npm run native:start`
3. Build the local browser artifacts:
   `npm run build:web`
4. Open the generated root `index.html` in a modern browser, or serve the root folder from a local web server.

Native is the primary release path. Web stays maintained for testing, desktop use, and flows that benefit from a larger screen. The root browser files are rebuilt outputs for local use. Browser Bluetooth remains an optional prototype transport, not the primary multiplayer architecture.

## Build artifacts

Do not commit installable build artifacts or Expo export output. Keep:

- `*.apk`
- `*.aab`
- `*.apks`
- `apps/native/.expo-export/`
- `sideload-test/`

out of source control. Use Expo/EAS artifact links or release storage for tester downloads.

For a repeatable repo-wide verification pass, use:

- `npm run validate`

## Auth and tester accounts

Golfers Nation now supports two account paths:

- Real tester auth with Supabase email sign-up and sign-in when runtime config is provided
- Local review/demo accounts as an optional fallback when you want to test quickly without live backend setup

Review/demo accounts remain available:

- Free demo account: `free@golfersnation.demo` / `fairway123`
- Premium demo account: `premium@golfersnation.demo` / `fairway123`
- `Continue with Google` and `Continue with Apple` remain review/demo fallbacks for now

When Supabase is configured, testers can create their own real email accounts and keep rounds, stats, settings, and course history tied to that account.

## PWA deployment and install

Golfers Nation now includes a manifest, placeholder app icons, and a service worker so it can be installed to a phone home screen like a real test app.

For desktop or local browser testing:

1. Rebuild the local browser artifacts after source changes:
   `npm run build:web`
2. Serve the folder from a local web server:
   `npx serve .`
3. Open the served URL in a browser.

## Cloudflare Pages deployment for phone testing

The project now includes:

- `npm run build` / `npm run build:cloudflare` to generate a clean deployable `dist/` folder
- `_redirects` for SPA routing fallback
- the same static PWA shell used by the Netlify build

### Build workflow

- `npm run build:shell`: rebuilds the root browser shell from `src/shell/`
- `npm run build:app`: rebuilds `app.js` from `src/**/*.js`
- `npm run build:web`: rebuilds the full local browser root output
- `npm run build` or `npm run build:cloudflare`: rebuilds root output, then rebuilds `dist/`

Cloudflare Pages should publish `dist/` only. Root files exist for local browser/PWA testing and should still be treated as generated output.

### Fastest manual deploy with Cloudflare Pages

1. Build the deploy package:
   `npm run build:cloudflare`
2. Open [Cloudflare Pages](https://developers.cloudflare.com/pages/)
3. Create a new Pages project and choose direct upload, or connect the repo.
4. Upload the generated `dist/` folder.
5. Wait for the deploy to finish and copy the `*.pages.dev` URL.
6. Open that URL on your phone or send it to testers.

### Repo-connected deploy on Cloudflare Pages

1. Push the project to GitHub or GitLab.
2. In Cloudflare, open `Workers & Pages` and create a new Pages project.
3. Connect the repo.
4. Use this build command:
   `npm run build:cloudflare`
5. Use this output directory:
   `dist`

### Supabase tester setup

For a real tester build, edit [runtime-config.js](C:/Users/Bower/OneDrive/Desktop/golf%20nation/src/shell/runtime-config.js) before running `npm run build:cloudflare`:

- `supabaseUrl`
- `supabaseAnonKey`
- `supabaseResetRedirectUrl`
- `siteUrl`

Cloudflare direct-upload deploy:

1. Update [runtime-config.js](C:/Users/Bower/OneDrive/Desktop/golf%20nation/src/shell/runtime-config.js)
2. Run `npm run build:cloudflare`
3. Upload the generated `dist/` folder

Repo-connected deploy:

1. Update [runtime-config.js](C:/Users/Bower/OneDrive/Desktop/golf%20nation/src/shell/runtime-config.js) in the repo
2. Commit and push
3. Trigger a new Pages deploy

[runtime-config.js](C:/Users/Bower/OneDrive/Desktop/golf%20nation/src/shell/runtime-config.js) is the source of truth, and the build copies it into the generated root output and then into [dist](C:/Users/Bower/OneDrive/Desktop/golf%20nation/dist).

### Important testing note

With Supabase configured, email sign-up, sign-in, session restore, cloud-backed user workspaces, and in-app tester feedback are real. Review/demo accounts still remain available as a fallback path. Realtime round sync is still device/mock based for now.

## In-app tester feedback with Supabase

The app includes an in-app tester feedback form inside:

- `Profile & settings` -> `App & Support`

### How it works

- Testers can submit a short note from inside the app
- The form includes lightweight context such as:
  - current area of the app
  - free vs premium plan
  - install state
  - theme / appearance
  - recent activity summary
- Feedback is saved to the Supabase `tester_feedback` table for review
- The SQL for that table and its RLS policies is in [docs/supabase-setup.md](C:/Users/Bower/OneDrive/Desktop/golf%20nation/docs/supabase-setup.md)

### Suggested lightweight analytics plan

Until a fuller analytics stack exists, use this combination:

- Supabase `tester_feedback` for structured tester notes
- screenshots / screen recordings from testers
- manual issue tagging by area:
  - onboarding
  - round
  - stats
  - community
  - premium

This keeps the feedback loop working even when you change static hosts.

For phone installation, deploy the static files to an HTTPS host. The fastest options are:

1. Cloudflare Pages direct upload with the generated `dist/` folder, or
2. A repo-connected Cloudflare Pages deploy.

Make sure these files are published together:

- `index.html`
- `styles.css`
- `app.js`
- `manifest.json`
- `service-worker.js`
- `icons/`

### Install on iPhone

1. Open the deployed HTTPS URL in Safari.
2. Tap the Share button.
3. Choose `Add to Home Screen`.
4. Confirm the app name `Golfers Nation`.
5. Launch it from the home screen. It should open in standalone mode without the normal browser chrome.

### Install on Android

1. Open the deployed HTTPS URL in Chrome.
2. Wait for the install prompt, or open the browser menu.
3. Tap `Install app` or `Add to Home screen`.
4. Confirm `Golfers Nation`.
5. Launch it from the home screen. It should open in standalone mode with the app theme color and offline shell support.

## Product foundation notes

- Invite code flow is the main multiplayer entry point.
- Nearby and browser Bluetooth are abstracted behind the sync service for future replacement.
- Round, group, tournament, and gear records are stored with backend-ready identifiers and relationships.
- The scoring layer supports `stroke`, `match`, and `scramble` with room for more formats later.

## Further documentation

See `docs/product-foundation.md` for:

- recommended file structure
- architectural decisions
- backend schema suggestion

See `docs/course-quality-admin.md` for:

- manual course override workflow
- reconciliation report outputs
- backend-ready course quality table mapping
- native app migration plan
- roadmap from MVP to production

See `docs/developer-review-map.md` for:

- the source-of-truth workflow
- the fastest way for engineers to review the repo
- the main backend/service seams
- what is live today vs still scaffolded

See `docs/supabase-setup.md` for:

- Supabase table and RLS setup
- runtime env variable details
- what is now real vs still mocked
- recommended tester deployment notes

## Peer review bundle

If you want to send the project for team review in one place:

1. Run:
   `npm run review:bundle`
2. Share:
   - `docs/business-partner-overview.md`
   - `docs/peer-review-guide.md`
   - `docs/peer-review-bundle.md`

The business overview gives leadership the product story and step-by-step build summary. The guide gives reviewers the quickest way to understand the architecture and flows. The bundle file consolidates the current source-of-truth code and tests into one reviewable document.

## Running tests locally

This repository now includes a Vitest-based unit test setup for:

- scoring logic
- factories
- storage service
- sync service

To run the tests once Node.js is available:

1. Install dependencies:
   `npm install`
2. Run the unit test suite:
   `npm test`
3. Rebuild the local browser output:
   `npm run build:web`
4. Rebuild the deploy package:
   `npm run build`
5. Run Vitest in watch mode:
   `npm run test:watch`
6. Run the end-to-end placeholder script:
   `npm run test:e2e`

Notes:

- The current setup uses `jsdom` only in the browser-adjacent service tests.
- Playwright was not added because browser automation support was not available in the setup environment.
