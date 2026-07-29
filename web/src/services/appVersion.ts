/**
 * The running build's version, for anywhere in the UI that states it.
 *
 * Ported from `vinodex-ios/Sources/VinodexCore/AppVersion.swift`, and kept in
 * step with it deliberately: the two apps are the same product, and a web build
 * claiming a different version from the phone in your hand is worse than no
 * version at all.
 *
 * The back plate used to read `v0.0.<commit count>`, which was honest about the
 * git history and told a reader nothing about the app. A literal nobody
 * remembers to edit is a literal that silently lies — this constant is the one
 * place to bump, and the back plate is the one screen whose whole job is to
 * state what this thing is.
 */

/** Bump with the batch. Matches `AppVersion.fallback` in Swift. */
export const APP_VERSION = '0.4.1.7';

/** Display form, e.g. `v0.4.1.7`. */
export const APP_VERSION_DISPLAY = `v${APP_VERSION}`;

/**
 * The git commit count, injected by `vite.config.ts`. Kept as a *build*
 * identifier rather than a version: it is useful for telling two deploys of the
 * same version apart, which is exactly what the DEV panel wants and exactly
 * what a nameplate does not.
 */
export const BUILD_NUMBER = String(__GIT_COMMIT_COUNT__);
