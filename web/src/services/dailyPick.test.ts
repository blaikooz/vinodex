import { beforeEach, describe, expect, it } from 'vitest';
import {
  advanceRevealCursor,
  categoryForDay,
  dayIndex,
  revealCursor,
  revealEntry,
  REVEAL_CATEGORIES,
} from './dailyPick';
import { getAllEntries } from './wineData';
import { WineEntry } from '@/shared/types';

/**
 * Ported from `vinodex-ios/Tests/VinodexCoreTests/DailyPickTests.swift`, with
 * the cases adapted where the web version deliberately diverges.
 *
 * Two divergences drive the differences. The web reveal rotates through grapes,
 * regions and styles rather than grapes alone, so the Swift `alwaysFree` case
 * (which also asserted `.grapes`) becomes a check that the pick is in one of
 * the three revealed categories — there is no free tier to assert against here,
 * since nothing on the web is gated. And the web pick takes a `cursor` as well
 * as a date, because the reveal is a game you can keep playing rather than one
 * entry a day, so "the same day always gives the same entry" is only claimed at
 * a fixed cursor.
 *
 * Dates are built with the local-time `Date` constructor, not parsed from ISO
 * strings: `dayIndex` works in local time on purpose, and `new Date('2026-07-28')`
 * would be parsed as UTC and land on the previous day west of Greenwich.
 */
const localDay = (y: number, m: number, d: number, hour = 0): Date =>
  new Date(y, m - 1, d, hour);

describe('dailyPick', () => {
  const all: WineEntry[] = getAllEntries();

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

  describe('revealEntry', () => {
    /** The Swift `stableWithinADay` — reopening must not reshuffle it. */
    it('gives the same entry all day at the same cursor', () => {
      const morning = revealEntry(all, 0, localDay(2026, 7, 28, 7));
      const evening = revealEntry(all, 0, localDay(2026, 7, 28, 21));
      expect(morning?.id).toBe(evening?.id);
    });

    it('consecutive days give different entries', () => {
      const seen = Array.from({ length: 5 }, (_, offset) =>
        revealEntry(all, 0, localDay(2026, 7, 28 + offset))?.id,
      );
      for (let i = 0; i < seen.length - 1; i++) {
        expect(seen[i]).toBeDefined();
        expect(seen[i]).not.toBe(seen[i + 1]);
      }
    });

    /**
     * `dayIndex` is negative before 1970, and a raw `%` would index backwards
     * off the front of the pool — the Swift `preEpoch` case.
     */
    it('resolves for dates before the epoch', () => {
      expect(revealEntry(all, 0, localDay(1962, 3, 4))).not.toBeNull();
    });

    it('resolves at a negative cursor', () => {
      expect(revealEntry(all, -5, localDay(2026, 7, 28))).not.toBeNull();
    });

    it('only ever reveals a revealed category', () => {
      for (let offset = 0; offset < 40; offset++) {
        const pick = revealEntry(all, offset, localDay(2026, 1, 1 + offset));
        expect(pick).not.toBeNull();
        expect(REVEAL_CATEGORIES).toContain(pick!.category);
      }
    });

    /**
     * Not a fixed number — the pool's size is a data decision — but 30 turns
     * landing on a handful would mean the cursor is barely moving. The Swift
     * `coversThePool` case.
     */
    it('covers many different entries across a cycle', () => {
      const ids = new Set<string>();
      for (let offset = 0; offset < 30; offset++) {
        ids.add(revealEntry(all, offset, localDay(2026, 1, 1))!.id);
      }
      expect(ids.size).toBeGreaterThanOrEqual(10);
    });

    it('returns null when nothing is revealable', () => {
      expect(revealEntry([], 0, localDay(2026, 7, 28))).toBeNull();
      const noneRevealable = all.filter(e => !REVEAL_CATEGORIES.includes(e.category));
      expect(noneRevealable.length).toBeGreaterThan(0);
      expect(revealEntry(noneRevealable, 0, localDay(2026, 7, 28))).toBeNull();
    });

    /** Order must not depend on the order entries arrive in. */
    it('is independent of input ordering', () => {
      const reversed = [...all].reverse();
      expect(revealEntry(reversed, 3, localDay(2026, 7, 28))?.id).toBe(
        revealEntry(all, 3, localDay(2026, 7, 28))?.id,
      );
    });
  });

  describe('categoryForDay', () => {
    it('is always one of the revealed categories', () => {
      for (let offset = 0; offset < 10; offset++) {
        expect(REVEAL_CATEGORIES).toContain(categoryForDay(localDay(2026, 5, 1 + offset)));
      }
    });

    it('steps one category per day and wraps', () => {
      const run = Array.from({ length: REVEAL_CATEGORIES.length + 1 }, (_, i) =>
        categoryForDay(localDay(2026, 5, 1 + i)),
      );
      expect(run[0]).toBe(run[REVEAL_CATEGORIES.length]);
      expect(new Set(run.slice(0, REVEAL_CATEGORIES.length)).size).toBe(REVEAL_CATEGORIES.length);
    });

    it('resolves before the epoch', () => {
      expect(REVEAL_CATEGORIES).toContain(categoryForDay(localDay(1962, 3, 4)));
    });
  });

  describe('revealCursor', () => {
    it('starts at zero and advances by one', () => {
      expect(revealCursor()).toBe(0);
      expect(advanceRevealCursor()).toBe(1);
      expect(revealCursor()).toBe(1);
      expect(advanceRevealCursor()).toBe(2);
    });

    it('persists across a re-read', () => {
      advanceRevealCursor();
      advanceRevealCursor();
      expect(window.localStorage.getItem('revealCursor')).toBe('2');
      expect(revealCursor()).toBe(2);
    });

    it('treats an unparseable stored value as zero', () => {
      window.localStorage.setItem('revealCursor', 'not-a-number');
      expect(revealCursor()).toBe(0);
    });
  });
});
