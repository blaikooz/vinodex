import { describe, expect, it } from 'vitest';
import {
  isGoodForDrinking,
  moonDay,
  moonElement,
  moonLongitude,
  moonQuote,
  moonSummary,
  moonVerdict,
  zodiacIndex,
  zodiacName,
  MoonDay,
  MOON_DAYS,
} from './moonService';

/**
 * Ported from the `Moon dial` suite in
 * `vinodex-ios/Tests/VinodexCoreTests/MinigameTests.swift`.
 *
 * This replaces an earlier version of this file written against the sidereal
 * implementation. Both cases that could not be ported then — `drinkingDays` and
 * `quotes` — port directly now, because the service carries the same `MoonDay`
 * model and the same quote pools as the Swift original rather than exposing a
 * bare `isFruitDay`.
 *
 * Dates are built with the local-time constructor: the day is anchored at local
 * noon on purpose, and `new Date('2026-07-28')` parses as UTC, which lands on
 * the previous day west of Greenwich and can read a different sign.
 */
const localDay = (y: number, m: number, d: number, hour = 0): Date => new Date(y, m - 1, d, hour);

describe('moonService', () => {
  describe('longitude', () => {
    /**
     * The Swift `longitudeRange` case, including dates before J2000 where the
     * raw formula goes negative and a missing wrap would index off the front of
     * the sign table.
     */
    it('stays in range across a long span', () => {
      for (let offset = -20_000; offset <= 20_000; offset += 137) {
        const day = new Date(Date.UTC(2000, 0, 1) + offset * 86_400_000);
        const lon = moonLongitude(day);
        expect(lon, `longitude ${lon} out of range at offset ${offset}`).toBeGreaterThanOrEqual(0);
        expect(lon).toBeLessThan(360);

        const index = zodiacIndex(day);
        expect(index).toBeGreaterThanOrEqual(0);
        expect(index).toBeLessThanOrEqual(11);
      }
    });

    it('advances about 13.18° per day', () => {
      const a = moonLongitude(localDay(2026, 3, 10, 12));
      const b = moonLongitude(localDay(2026, 3, 11, 12));
      const moved = ((b - a) % 360 + 360) % 360;
      expect(moved).toBeCloseTo(13.176, 1);
    });

    it('is anchored at J2000 to the documented start position', () => {
      // 2000-01-01 12:00 UTC — zero days elapsed, so the constant stands alone.
      expect(moonLongitude(new Date(Date.UTC(2000, 0, 1, 12)))).toBeCloseTo(218.316, 3);
    });
  });

  describe('the day is judged once', () => {
    /**
     * The whole reason `anchor` exists: reading the live longitude made the
     * screen flip from a leaf day to a fruit day over lunch, and the quote with
     * it. Every hour of a calendar day must agree.
     */
    it('gives the same type at every hour of a day', () => {
      for (const hour of [0, 6, 12, 18, 23]) {
        expect(moonDay(localDay(2026, 7, 28, hour))).toBe(moonDay(localDay(2026, 7, 28, 0)));
        expect(zodiacName(localDay(2026, 7, 28, hour))).toBe(zodiacName(localDay(2026, 7, 28, 0)));
      }
    });

    it('gives the same quote at every hour of a day', () => {
      const morning = moonQuote(localDay(2026, 1, 14, 7));
      for (const hour of [0, 12, 22]) {
        expect(moonQuote(localDay(2026, 1, 14, hour))).toBe(morning);
      }
    });
  });

  describe('element mapping', () => {
    /**
     * Element follows the sign index modulo four — fire, earth, air, water —
     * which is the whole basis for the fruit/root/flower/leaf scheme. The Swift
     * `elementMapping` case.
     */
    it('follows the sign index modulo four', () => {
      const expected: MoonDay[] = ['FRUIT', 'ROOT', 'FLOWER', 'LEAF'];
      for (let offset = 0; offset < 120; offset++) {
        const day = localDay(2026, 1, 1 + offset);
        expect(moonDay(day)).toBe(expected[zodiacIndex(day) % 4]);
      }
    });

    it('maps each day type to its classical element', () => {
      expect(moonElement('FRUIT')).toBe('FIRE');
      expect(moonElement('ROOT')).toBe('EARTH');
      expect(moonElement('FLOWER')).toBe('AIR');
      expect(moonElement('LEAF')).toBe('WATER');
    });

    /**
     * The moon crosses all twelve signs in about 27 days, so a month of
     * sampling must produce every day type — a mapping stuck on one value would
     * still look plausible on any single day. The Swift `coversAllTypes` case.
     */
    it('covers all four day types within a lunar month', () => {
      const seen = new Set<MoonDay>();
      for (let offset = 0; offset < 30; offset++) seen.add(moonDay(localDay(2026, 7, 1 + offset)));
      expect(seen.size).toBe(MOON_DAYS.length);
    });

    it('covers all twelve signs within a lunar month', () => {
      const seen = new Set<string>();
      for (let offset = 0; offset < 30; offset++) seen.add(zodiacName(localDay(2026, 7, 1 + offset)));
      expect(seen.size).toBe(12);
    });
  });

  /** The Swift `drinkingDays` case — it had no counterpart before this port. */
  describe('the verdict', () => {
    it('rates fruit and flower days good, leaf and root days not', () => {
      expect(isGoodForDrinking('FRUIT')).toBe(true);
      expect(isGoodForDrinking('FLOWER')).toBe(true);
      expect(isGoodForDrinking('LEAF')).toBe(false);
      expect(isGoodForDrinking('ROOT')).toBe(false);
    });

    it('words the verdict from that rating', () => {
      expect(moonVerdict('FRUIT')).toBe('GOOD DAY TO DRINK');
      expect(moonVerdict('ROOT')).toBe('MAYBE NOT TODAY');
    });

    it('gives every day type a non-empty, distinct summary', () => {
      const summaries = MOON_DAYS.map(moonSummary);
      expect(summaries.every(s => s.length > 0)).toBe(true);
      expect(new Set(summaries).size).toBe(MOON_DAYS.length);
    });
  });

  /** The Swift `quotes` case — also newly portable. */
  describe('quotes', () => {
    it('is never empty and never changes within a day', () => {
      for (let offset = 0; offset < 40; offset++) {
        const day = localDay(2026, 1, 1 + offset);
        const a = moonQuote(day);
        expect(a.length, 'empty quote would render as a blank panel').toBeGreaterThan(0);
        expect(moonQuote(localDay(2026, 1, 1 + offset, 17))).toBe(a);
      }
    });

    it('draws from the pool belonging to the day type', () => {
      for (let offset = 0; offset < 40; offset++) {
        const day = localDay(2026, 2, 1 + offset);
        // Every line names its own day type, so a mismatched pool is visible.
        expect(moonQuote(day).toUpperCase()).toContain(moonDay(day));
      }
    });

    /** Two consecutive days of one type must not read identically. */
    it('rotates within a pool rather than repeating', () => {
      const seen = new Map<MoonDay, Set<string>>();
      for (let offset = 0; offset < 60; offset++) {
        const day = localDay(2026, 3, 1 + offset);
        const type = moonDay(day);
        if (!seen.has(type)) seen.set(type, new Set());
        seen.get(type)!.add(moonQuote(day));
      }
      for (const [type, quotes] of seen) {
        expect(quotes.size, `${type} never rotated its line`).toBeGreaterThan(1);
      }
    });

    it('resolves for dates before the epoch', () => {
      expect(moonQuote(localDay(1962, 3, 4)).length).toBeGreaterThan(0);
    });
  });
});
