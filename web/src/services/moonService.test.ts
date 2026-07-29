import { describe, expect, it } from 'vitest';
import {
  getDailyReadings,
  getElementForSign,
  getHourlyReadings,
  getMoonReading,
  getNextDateInSign,
  isInNodeWindow,
  ZODIAC_SIGNS,
  type BiodynamicElement,
} from './moonService';

/**
 * Ported from the `Moon dial` suite in
 * `vinodex-ios/Tests/VinodexCoreTests/MinigameTests.swift`.
 *
 * Two Swift cases have no counterpart. `drinkingDays` asserts that fruit *and
 * flower* days are good for drinking; the web reading exposes only
 * `isFruitDay`, so the flower half has nothing to assert against. And `quotes`
 * covers `MoonCalendar.quote`, which on the web lives in `MoonDialScreen`
 * rather than in this service — it is a view concern here.
 *
 * Everything the web adds on top of the Swift model — the sidereal (Lahiri)
 * offset, the ecliptic-node window, `degreesIntoSign`, and the sign-crossing
 * search — is covered below, since none of it has a Swift original to inherit
 * tests from.
 */
const ELEMENT_CYCLE: BiodynamicElement[] = ['fruit', 'root', 'flower', 'leaf'];

const utcDay = (y: number, m: number, d: number, hour = 12): Date =>
  new Date(Date.UTC(y, m - 1, d, hour));

describe('moonService', () => {
  describe('longitude and sign', () => {
    /**
     * The Swift `longitudeRange` case, including dates before J2000 where the
     * raw formula goes negative and a missing wrap would index off the front of
     * the sign table.
     */
    it('keeps the sidereal longitude in range across a long span', () => {
      for (let offset = -20_000; offset <= 20_000; offset += 137) {
        const day = new Date(Date.UTC(2000, 0, 1) + offset * 86_400_000);
        const { siderealLongitude, sign, degreesIntoSign } = getMoonReading(day);

        expect(siderealLongitude).toBeGreaterThanOrEqual(0);
        expect(siderealLongitude).toBeLessThan(360);
        expect(ZODIAC_SIGNS).toContain(sign);
        expect(degreesIntoSign).toBeGreaterThanOrEqual(0);
        expect(degreesIntoSign).toBeLessThan(30);
      }
    });

    it('reports a sign consistent with the longitude', () => {
      for (let offset = 0; offset < 60; offset++) {
        const { siderealLongitude, sign } = getMoonReading(utcDay(2026, 1, 1 + offset));
        expect(sign).toBe(ZODIAC_SIGNS[Math.floor(siderealLongitude / 30) % 12]);
      }
    });

    it('has twelve distinct signs in the table', () => {
      expect(ZODIAC_SIGNS).toHaveLength(12);
      expect(new Set(ZODIAC_SIGNS).size).toBe(12);
    });
  });

  describe('element mapping', () => {
    /**
     * The Swift `elementMapping` case. Element follows the sign's index modulo
     * four — fire, earth, air, water — which is the whole basis for the
     * fruit/root/flower/leaf scheme. The web maps by sign *name*, so this is
     * the check that the two spellings of the same rule agree.
     */
    it('follows the sign index modulo four', () => {
      ZODIAC_SIGNS.forEach((sign, index) => {
        expect(getElementForSign(sign)).toBe(ELEMENT_CYCLE[index % 4]);
      });
    });

    it('gives every reading an element matching its own sign', () => {
      for (let offset = 0; offset < 120; offset++) {
        const reading = getMoonReading(utcDay(2026, 1, 1 + offset));
        expect(reading.element).toBe(getElementForSign(reading.sign));
      }
    });

    it('flags fruit days and only fruit days', () => {
      for (let offset = 0; offset < 60; offset++) {
        const reading = getMoonReading(utcDay(2026, 1, 1 + offset));
        expect(reading.isFruitDay).toBe(reading.element === 'fruit');
      }
    });

    /**
     * The moon crosses all twelve signs in about 27 days, so a month of
     * sampling must produce every day type — a mapping stuck on one value would
     * still look plausible on any single day. The Swift `coversAllTypes` case.
     */
    it('covers all four day types within a lunar month', () => {
      const seen = new Set(getDailyReadings(utcDay(2026, 7, 1), 30).map(r => r.element));
      expect(seen.size).toBe(ELEMENT_CYCLE.length);
    });

    it('covers all twelve signs within a lunar month', () => {
      const seen = new Set(getDailyReadings(utcDay(2026, 7, 1), 30).map(r => r.sign));
      expect(seen.size).toBe(12);
    });
  });

  describe('sampling helpers', () => {
    it('returns the requested number of readings', () => {
      expect(getDailyReadings(utcDay(2026, 3, 1), 7)).toHaveLength(7);
      expect(getHourlyReadings(utcDay(2026, 3, 1), 24)).toHaveLength(24);
      expect(getDailyReadings(utcDay(2026, 3, 1), 0)).toEqual([]);
    });

    /** The moon moves ~13°/day, so a day of hourly samples must not stand still. */
    it('advances the longitude across a day of hourly samples', () => {
      const readings = getHourlyReadings(utcDay(2026, 3, 1, 0), 24);
      const first = readings[0]!.siderealLongitude;
      const last = readings[23]!.siderealLongitude;
      // Modulo the wrap, a day should move roughly half a sign.
      const moved = ((last - first) % 360 + 360) % 360;
      expect(moved).toBeGreaterThan(5);
      expect(moved).toBeLessThan(20);
    });
  });

  describe('the node window', () => {
    /** Web-only: no Swift original. The flag must at least agree with itself. */
    it('agrees with the reading it is derived from', () => {
      for (let offset = 0; offset < 40; offset++) {
        const day = utcDay(2026, 2, 1 + offset);
        expect(getMoonReading(day).nodeSuppressed).toBe(isInNodeWindow(day));
      }
    });

    /**
     * The moon crosses a node roughly twice a month, so a month of daily
     * samples must contain both suppressed and unsuppressed days — a threshold
     * that never fired, or always fired, would be invisible on any single day.
     */
    it('fires sometimes and not always across a month', () => {
      const flags = getDailyReadings(utcDay(2026, 5, 1), 30).map(r => r.nodeSuppressed);
      expect(flags).toContain(true);
      expect(flags).toContain(false);
    });
  });

  describe('getNextDateInSign', () => {
    it('finds a crossing into every sign within its horizon', () => {
      const from = utcDay(2026, 4, 1);
      for (const sign of ZODIAC_SIGNS) {
        const next = getNextDateInSign(sign, from);
        expect(next).not.toBeNull();
        expect(next!.getTime()).toBeGreaterThan(from.getTime());
        // It must actually be that sign when it arrives.
        expect(getMoonReading(next!).sign).toBe(sign);
      }
    });

    it('lands within the 32-day search horizon', () => {
      const from = utcDay(2026, 4, 1);
      const next = getNextDateInSign('Leo', from);
      const days = (next!.getTime() - from.getTime()) / 86_400_000;
      expect(days).toBeLessThanOrEqual(32);
    });
  });
});
