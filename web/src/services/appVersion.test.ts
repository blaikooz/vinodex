import { describe, expect, it } from 'vitest';
import { APP_VERSION, APP_VERSION_DISPLAY, BUILD_NUMBER } from './appVersion';
import pkg from '@/package.json';

/**
 * The web app's version number, and the two things that must not drift from it.
 *
 * The one service suite here with **no Swift original to inherit from** — every
 * other header in this directory names the XCTest file it ports. There is
 * deliberately no counterpart: as of the repo split the two apps version
 * independently, and this suite exists to keep that decision from rotting back
 * into a mirror of `AppVersion.swift`.
 *
 * Two screens render this, and neither can be checked by reading the constant:
 * the engraved nameplate on `DeviceBackPanel` (reached by holding the orb to
 * flip the device) and the VERSION / BUILD rows in `SettingsPanel`'s DEV
 * diagnostics.
 */
describe('appVersion', () => {
  /**
   * Three parts, so `package.json`, the `v0.1.0` git tag and the string on the
   * nameplate are one spelling. It also structurally excludes the iOS format —
   * `0.4.2.1.2` has five — so a bump made out of iOS habit fails here rather
   * than shipping a number this app does not use.
   */
  it('is three-part semver', () => {
    expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });

  /**
   * The drift guard, and the whole reason `package.json` moved off the Vite
   * scaffold default. Two places stating a version is exactly the arrangement
   * that produced 0.4.1.7 here against 0.4.1.5 in the frozen `ios/` copy.
   */
  it('matches the version in package.json', () => {
    expect(pkg.version).toBe(APP_VERSION);
  });

  describe('display form', () => {
    it('is the version with a leading v', () => {
      expect(APP_VERSION_DISPLAY).toBe(`v${APP_VERSION}`);
    });

    /** The nameplate renders it raw into a fixed-width engraved plate. */
    it('carries no whitespace', () => {
      expect(APP_VERSION_DISPLAY).not.toMatch(/\s/);
    });
  });

  /**
   * A build id, not a version: it tells two deploys of the same version apart,
   * which is what the DEV panel wants and what a nameplate does not. A commit
   * count never grows dots, so this pins the demotion — if it ever starts
   * looking like a version, something has put it back where it does not belong.
   *
   * `vitest.config.ts` defines this as '0', matching the fallback
   * `vite.config.ts` uses when `git rev-list` fails.
   */
  it('exposes a build number that is a bare integer', () => {
    expect(BUILD_NUMBER).toMatch(/^\d+$/);
  });
});
