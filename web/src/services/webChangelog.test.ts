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
        // eslint-disable-next-line no-control-regex
        expect(note, `${r.version} has a non-ASCII note: ${note}`).toMatch(/^[\x20-\x7E]+$/);
      }
    }
  });

  it('is a separate line from the device firmware', () => {
    // The distinction FirmwareHistoryScreen draws, pinned so a later edit
    // cannot quietly merge the two. `shared/data/firmware.ts` is the device's
    // line and is shared with iOS; this file is the web shell's own, and the
    // two release on different clocks by design.
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
