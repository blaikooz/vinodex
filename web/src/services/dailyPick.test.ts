import { beforeEach, describe, expect, it } from 'vitest';
import { dayIndex, revealCursor } from './dailyPick';

/**
 * The surviving half of the DailyPickTests port. Ruling v6#6 deleted the
 * WHAT'S THAT…? reveal (matching iOS 0.8.93), and its cases — `revealEntry`,
 * `categoryForDay`, the cursor advance — went with the engine (review R3:
 * trimmed, not deleted). What remains are the two primitives every dated
 * feature reads.
 *
 * Dates are built with the local-time `Date` constructor, not parsed from
 * ISO strings: `dayIndex` works in local time on purpose, and
 * `new Date('2026-07-28')` would be parsed as UTC and land on the previous
 * day west of Greenwich.
 */
const localDay = (y: number, m: number, d: number, hour = 0): Date =>
  new Date(y, m - 1, d, hour);

describe('dailyPick primitives', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  describe('dayIndex', () => {
    it('is stable across the hours of one local day', () => {
      expect(dayIndex(localDay(2026, 7, 28, 0))).toBe(dayIndex(localDay(2026, 7, 28, 9)));
      expect(dayIndex(localDay(2026, 7, 28, 0))).toBe(dayIndex(localDay(2026, 7, 28, 23)));
    });

    it('advances by exactly one per calendar day', () => {
      expect(dayIndex(localDay(2026, 7, 29)) - dayIndex(localDay(2026, 7, 28))).toBe(1);
    });

    /** Crosses a DST boundary in most northern-hemisphere zones. */
    it('advances by one across a DST change', () => {
      expect(dayIndex(localDay(2026, 3, 9)) - dayIndex(localDay(2026, 3, 8))).toBe(1);
      expect(dayIndex(localDay(2026, 11, 2)) - dayIndex(localDay(2026, 11, 1))).toBe(1);
    });

    it('goes negative before the epoch', () => {
      expect(dayIndex(localDay(1962, 3, 4))).toBeLessThan(0);
    });
  });

  describe('revealCursor', () => {
    it('starts at zero when nothing is stored', () => {
      expect(revealCursor()).toBe(0);
    });

    it('reads a persisted value under its unrenamed key', () => {
      window.localStorage.setItem('revealCursor', '17');
      expect(revealCursor()).toBe(17);
    });

    it('treats an unparseable stored value as zero', () => {
      window.localStorage.setItem('revealCursor', 'not-a-number');
      expect(revealCursor()).toBe(0);
    });
  });
});
