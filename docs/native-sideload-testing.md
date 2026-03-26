# Native Sideload Testing

## Goal
Create installable Android test builds without depending on Play Store setup.

## Source Of Truth
- Native source lives in `apps/native`
- APKs are build artifacts only
- Do not commit generated APK, AAB, APKS, or Expo export files

## Preferred Workflow
Run from the repo root:

1. install deps
   - `npm install`
2. validate shared and web/native source
   - `npm test`
   - `npm run build`
3. request a sideload Android build
   - `npm run native:build:sideload:android`
4. inspect build status
   - `npm run native:build:list`
5. download the finished APK artifact from the Expo build page

## Combined Web + APK Test Release
If you want the web deploy package and Android sideload build to move together, do not run the manual git chain by hand. Use:

- normal push:
  - `npm run release:test -- --CommitMessage "redeploy latest update"`
- force push:
  - `npm run release:test:force -- -CommitMessage "redeploy latest update"`

That wrapper script handles:
- `npm run build:cloudflare`
- `git add .`
- `git commit -m ...` when changes exist
- push to `origin main`
- `eas build --platform android --profile sideload-android --no-wait`
- latest Android build listing

Result:
- web stays ready for Cloudflare testing
- a fresh APK build is queued at the same time for Android testing

## Current EAS Profile
- profile: `sideload-android`
- distribution: `internal`
- build type: `apk`

## Local Android Build Notes
Local Gradle builds are optional. They require:
- JDK 17 or JDK 21
- Android SDK installed locally
- `ANDROID_HOME` or `ANDROID_SDK_ROOT` configured

If local SDK tooling is missing, use EAS sideload builds instead.

## Repo Hygiene
Keep these out of git:
- `*.apk`
- `*.aab`
- `*.apks`
- `apps/native/.expo-export/`
- `sideload-test/`

## Tester Loop
1. ship a new sideload APK
2. install on Android from unknown sources
3. test the critical path:
   - auth
   - Start Round
   - join/live scoring
   - finish/end round
   - tee-time/service request surfaces
4. fix issues in shared/native source
5. rebuild and repeat
