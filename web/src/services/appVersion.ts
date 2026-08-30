/**
 * The running build's version, for anywhere in the UI that states it.
 *
 * Hand-edited, and deliberately not derived from git. The commit count at the
 * foot of this file is what a derived version looks like: honest about the
 * history, silent about the app. This constant is the one place to bump, and
 * the back plate is the one screen whose whole job is to state what this is.
 *
 * **This number is the web app's own.** It used to mirror `AppVersion.swift`,
 * because the two apps were one repo shipping one product, and a web build
 * claiming a different version from the phone in your hand was worse than no
 * version at all. The repos split on 2026-07-29 and both halves of that
 * stopped being true:
 *
 * - They release on different clocks. A Vercel push is live in a minute; an
 *   App Store build waits on review. A shared number has to be wrong on one
 *   platform for as long as the gap lasts, and the gap is the normal state.
 * - They are no longer the same feature set, on purpose. There is no paywall
 *   and no `tiers.json` here (see `access.ts`), the scanner walks a flat
 *   country list where iOS walks the globe, there are no haptics, and the
 *   company site — everything `WebsitePortal` builds, which since v0.3.0 is
 *   the landing experience the app opens from — has no Swift counterpart at
 *   all.
 *
 * The mirroring had already failed before it was dropped: this repo held
 * 0.4.1.7 here and 0.4.1.5 in the frozen `ios/` copy while the live phone was
 * on 0.4.2.1.2. So the web starts over and counts on its own. Three parts,
 * plain semver, rather than the four- and five-part strings iOS carries — so
 * `package.json`, the `v<version>` git tag and the nameplate are one spelling.
 * `appVersion.test.ts` pins that they stay that way.
 */

/** Bump on release. The single source of truth for the web app's version. */
export const APP_VERSION = '0.6.29';

/** Display form, e.g. `v0.2.0`. */
export const APP_VERSION_DISPLAY = `v${APP_VERSION}`;

/**
 * The git commit count, injected by `vite.config.ts`. Kept as a *build*
 * identifier rather than a version: it is useful for telling two deploys of the
 * same version apart, which is exactly what the DEV panel wants and exactly
 * what a nameplate does not.
 */
export const BUILD_NUMBER = String(__GIT_COMMIT_COUNT__);
