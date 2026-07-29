import { describe, expect, it } from 'vitest';
import { getSoilsForRegion, soilKeywordFor, soilResolves } from './soilDisplay';
import { getAllEntries } from './wineData';
import { isRegionEntry, WineEntry } from '@/shared/types';

/**
 * Ported from `soilsResolve` and `soilKeywordOrder` in
 * `vinodex-ios/Tests/VinodexCoreTests/CoverageTests.swift`.
 *
 * Neither could be written against the old `soilDisplay`, which carried seven
 * hand-maintained keywords against the manifest's fifteen. Six terms in the
 * dataset — Alluvial, Laterite, Loess, basalt, red loam and shale — fell
 * through to the default mountain, which is exactly the count the Swift comment
 * reports ("six terms were silently doing exactly that").
 */
describe('soilDisplay', () => {
  const all: WineEntry[] = getAllEntries();

  const soilsInData = (): string[] => {
    const soils = new Set<string>();
    for (const r of all.filter(isRegionEntry)) {
      for (const s of getSoilsForRegion(r.details.soilType, r.climate)) soils.add(s);
    }
    return [...soils].sort();
  };

  /**
   * Every soil the region screen can show must match a keyword. Falling through
   * to the default renders, but reads as a bug.
   */
  it('resolves every soil in the dataset to a specific glyph', () => {
    const soils = soilsInData();
    expect(soils.length, 'no soils were exercised at all').toBeGreaterThan(0);

    const unresolved = soils.filter(s => !soilResolves(s));
    expect(unresolved).toEqual([]);
  });

  it('covers the six terms that used to fall through', () => {
    for (const soil of ['Alluvial', 'Laterite', 'Loess', 'basalt', 'red loam', 'shale']) {
      expect(soilResolves(soil), `${soil} falls back to the default glyph`).toBe(true);
    }
  });

  /**
   * Matching is first-substring-wins, so the generated keyword order is
   * load-bearing: "clay loam" must reach clay, "sandstone" must reach sand.
   */
  describe('keyword order disambiguates compound terms', () => {
    it.each([
      ['Clay loam', 'clay'],
      ['clay loam', 'clay'],
      ['red loam', 'loam'],
      ['sandstone', 'sand'],
      ['Volcanic ash', 'volcanic'],
      ['Limestone', 'limestone'],
      ['Alluvial', 'alluvial'],
      ['Loess', 'loess'],
      ['Laterite', 'laterite'],
      ['shale', 'shale'],
      ['basalt', 'basalt'],
    ])('%s resolves to %s', (soil, keyword) => {
      expect(soilKeywordFor(soil)).toBe(keyword);
    });

    /** Limestone must not be captured by an earlier, shorter keyword. */
    it('does not let a later keyword shadow an earlier one wrongly', () => {
      expect(soilKeywordFor('Limestone')).not.toBe('sand');
      expect(soilKeywordFor('Schist')).toBe('schist');
    });
  });

  it('returns nothing for a soil it does not know', () => {
    expect(soilKeywordFor('Unobtanium')).toBeNull();
    expect(soilResolves('Unobtanium')).toBe(false);
  });

  describe('getSoilsForRegion', () => {
    it('splits an explicit soil type, capped at three', () => {
      expect(getSoilsForRegion('Clay, Limestone, Gravel, Sand')).toEqual([
        'Clay',
        'Limestone',
        'Gravel',
      ]);
    });

    it('trims and drops empties', () => {
      expect(getSoilsForRegion(' Clay ,, Sand ')).toEqual(['Clay', 'Sand']);
    });

    it('falls back to a climate triplet when there is no soil type', () => {
      expect(getSoilsForRegion(undefined, 'maritime')).toEqual(['Alluvial', 'Clay', 'Sand']);
      expect(getSoilsForRegion(undefined, 'continental')).toEqual(['Limestone', 'Loess', 'Gravel']);
    });

    it('falls back to the default triplet with neither', () => {
      expect(getSoilsForRegion(undefined, undefined)).toEqual(['Alluvial', 'Clay', 'Limestone']);
    });

    /** Every fallback triplet must itself resolve, or the fallback is the bug. */
    it('gives every climate a triplet of resolvable soils', () => {
      for (const climate of ['maritime', 'continental', 'cool', 'warm', 'mediterranean'] as const) {
        const soils = getSoilsForRegion(undefined, climate);
        expect(soils).toHaveLength(3);
        for (const s of soils) {
          expect(soilResolves(s), `${climate} fallback '${s}' does not resolve`).toBe(true);
        }
      }
    });

    it('always offers at most three soils', () => {
      for (const r of all.filter(isRegionEntry)) {
        expect(getSoilsForRegion(r.details.soilType, r.climate).length).toBeLessThanOrEqual(3);
      }
    });
  });
});
