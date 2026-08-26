# Releasing the web app

The web app versions on its own line — three-part semver, its own `v<version>`
git tag, independent of iOS. `web/src/services/appVersion.ts` is the single
source of truth; `appVersion.test.ts` pins it to `package.json` and the
lockfile, and `webChangelog.test.ts` pins it to an authored changelog entry.
The version cannot move without someone saying what changed, and this document
is the whole ceremony.

## The one-command flow

1. **Author the changelog entry first.** In
   `web/src/services/webChangelog.ts`: promote `CURRENT` into a named
   `PREVIOUS_x_y_z` constant, write the new `CURRENT`, and raise the
   never-shrinks floor in `webChangelog.test.ts` by one (the test's own
   comment says so). Headline: ALL-CAPS ASCII, **24 characters or fewer**.
   Notes: one line each, ASCII, sentence case.

2. **Bump every spelling at once:**

   ```
   npm run release -- patch|minor|major|x.y.z
   ```

   This rewrites `APP_VERSION` and `package.json`, runs
   `npm install --package-lock-only` (the step both prior lockfile drifts
   came from skipping), fails if the changelog has no entry for the new
   version, and finishes by running the two version-pinning suites.

3. **Gates, on `testing`:**

   ```
   npm run lint && npm run typecheck && npm test && npm run build && npm run check:refs
   npx playwright test        # at least once per release
   ```

4. **Ship:** commit on `testing`, push, wait for CI green
   (`gh run watch`), then:

   ```
   git checkout master && git merge --ff-only testing && git push
   git tag v<version> && git push origin v<version>
   git checkout testing
   ```

   The tag goes on **master**, after the fast-forward — it is the real
   record, and `master` is what Vercel serves. The release script prints
   these commands with the version filled in.

## Which bump

- **patch** — fixes, copy, performance, accessibility, infrastructure. No
  new user-facing surface: if a screenshot tour of the app looks the same
  afterwards, it is a patch.
- **minor** — a new screen or route, a visible redesign, a feature a user
  can point at. New user-facing surface of any size is a minor.
- **major** — the v1 launch, and after that only a breaking change to the
  app's information architecture or UX: URLs that stop resolving, stored
  data that stops being read, a navigation model that has to be relearned.

## What this is NOT

`shared/data/firmware.ts` is the **device's** firmware line — shared with
iOS, rendered by the BIOS POST and FIRMWARE HISTORY, spanning its own
0.6.2 → 0.9.x numbering. A web release never touches it, and the two lines
must never share a number (`webChangelog.test.ts` enforces the separation;
if the lines ever coincide, the web skips past the collision). The web's
release line is `webChangelog.ts`, and only that.

The Vite-injected commit count (`BUILD_NUMBER`) is a build identifier, not a
version — it tells two deploys of the same version apart and is never
tagged, never displayed on the nameplate.
