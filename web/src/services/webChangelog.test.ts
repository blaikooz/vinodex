import { describe, expect, it } from 'vitest';
import { APP_VERSION } from './appVersion';
import { CHANGELOG_VERSION, WEB_RELEASES, releaseFor } from './webChangelog';
import { FIRMWARE_RELEASES } from '@/shared/constants';

/**
 * The version cannot move without someone saying what changed.
 *
 * `APP_VERSION` sat at `0.1.0` while the tree ran 102 commits past its tag.
 * Nothing was inconsistent — `appVersion.test.ts` held all three spellings
 * equal and did its job — but nothing tied the number to reality, because
 * bumping it cost nothing and not bumping it cost nothing either.
 *
 * This suite is the cost. It is the web's version of the contract iOS gets
 * from `shared/data/firmware.ts`: the shipped version must be an authored
 * entry, and the entry has to be legible.
 */

const SEMVER = /^\d+\.\d+\.\d+$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

describe('the web changelog', () => {
  it('has an entry for the version the app ships', () => {
    // The gate. A bump with no entry fails here, naming the version.
    expect(
      releaseFor(APP_VERSION),
      `APP_VERSION is ${APP_VERSION} and web/src/services/webChangelog.ts has no entry for it. `
      + 'Add one (promote CURRENT into PREVIOUS, write the new CURRENT) rather than relaxing this test.',
    ).toBeDefined();
  });

  it('agrees with appVersion.ts about what the current version is', () => {
    expect(CHANGELOG_VERSION).toBe(APP_VERSION);
  });

  it('is newest-first, with no version listed twice', () => {
    const versions = WEB_RELEASES.map(r => r.version);
    expect(new Set(versions).size, `duplicate version in the changelog: ${versions}`).toBe(versions.length);

    const rank = (v: string) => v.split('.').map(Number);
    for (let i = 1; i < WEB_RELEASES.length; i += 1) {
      const [aMaj, aMin, aPat] = rank(WEB_RELEASES[i - 1]!.version);
      const [bMaj, bMin, bPat] = rank(WEB_RELEASES[i]!.version);
      const newer =
        aMaj! > bMaj! || (aMaj === bMaj && (aMin! > bMin! || (aMin === bMin && aPat! > bPat!)));
      expect(newer, `${WEB_RELEASES[i - 1]!.version} must sort above ${WEB_RELEASES[i]!.version}`).toBe(true);
    }
  });

  it('holds every entry to the same shape iOS holds its firmware to', () => {
    for (const r of WEB_RELEASES) {
      expect(r.version, `${r.version} is not three-part semver`).toMatch(SEMVER);
      expect(r.date, `${r.version} has a malformed date`).toMatch(ISO_DATE);
      expect(r.headline, `${r.version} has no headline`).not.toBe('');
      expect(r.headline.length, `${r.version}'s headline is over 24 characters`).toBeLessThanOrEqual(24);
      expect(r.headline, `${r.version}'s headline must be uppercase ASCII`).toMatch(/^[A-Z0-9 .,'!-]+$/);
      expect(r.notes.length, `${r.version} has no notes`).toBeGreaterThan(0);
      for (const note of r.notes) {
        expect(note.trim(), `${r.version} has an empty note`).not.toBe('');
        // ASCII only: the panel and the terminal font both predate anything else.
        expect(note, `${r.version} has a non-ASCII note: ${note}`).toMatch(/^[\x20-\x7E]+$/);
      }
    }
  });

  it('never loses a release the log once carried', () => {
    // The promotion discipline (R-S5). A bump is "promote CURRENT into
    // PREVIOUS, write the new CURRENT" — but nothing structural stops an
    // editor overwriting CURRENT in place, which would silently delete a
    // release from the player-facing FIRMWARE HISTORY log. So the floor is
    // pinned: the log holds at least two releases, and the first release ever
    // shipped is still on it. **When a release lands, raise the floor to the
    // new length** — the log only grows, and a shrink is a deletion someone
    // has to explain here rather than a diff nobody reads.
    // Raised to 6 by v0.4.0's own landing, and to 8 by v0.4.2's — which also
    // paid the debt v0.4.1 left, having grown the log to 7 without moving the
    // floor. The discipline stands: the log grows by one per release and the
    // floor follows it. At 21 since v0.6.17.
    expect(WEB_RELEASES.length, 'the changelog shrank — a release was deleted, not promoted').toBeGreaterThanOrEqual(21);
    expect(releaseFor('0.1.0'), 'the first web release fell off the log').toBeDefined();
  });

  it('is a separate line from the device firmware', () => {
    // Pinned so a later edit cannot quietly merge the two release lines.
    // `shared/data/firmware.ts` is the device's line, shared with iOS and
    // spanning 0.6.2 -> 0.9.2 (and growing); this file is the web shell's
    // own, on its own clock. (`FirmwareHistoryScreen` now renders only this
    // file — since ruling v7 §4a it draws no distinction on screen, so this
    // test is the only place the separation is enforced.)
    //
    // **If this fails on an ordinary web bump** — say the web reaches 0.6.2,
    // a number iOS's firmware line already used — nothing is broken. The two
    // lines have coincided, and the resolution is that the web renumbers
    // past the collision (skip to the next free number), not that either
    // line rewrites its history.
    const firmwareVersions = new Set(FIRMWARE_RELEASES.map(r => r.version));
    const webVersions = new Set(WEB_RELEASES.map(r => r.version));
    const shared = [...webVersions].filter(v => firmwareVersions.has(v));
    expect(
      shared,
      `the web changelog and the device firmware share version(s) ${shared.join(', ')}. `
      + 'These are two different release lines on two different clocks; if they have converged, '
      + 'that is a coincidence to break rather than a fact to encode.',
    ).toEqual([]);
  });
});
