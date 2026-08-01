import { describe, expect, it } from 'vitest';
import {
  continentEntry,
  continentEntryId,
  countriesIn,
  hasRegionsInCountry,
  regionsIn,
  CONTINENT_BOUNDS,
  CONTINENT_COORDINATES,
  CONTINENT_KEYS,
} from './continents';
import { getAllEntries } from './wineData';
import { WineEntry } from '@/shared/types';

/**
 * Ported from `vinodex-ios/Tests/VinodexCoreTests/ContinentTests.swift`.
 *
 * Two Swift cases are adapted. `destinationRoute` asserts a `DexRoute` case
 * that has no web analogue — routing here is URL-based — so it becomes a check
 * that the id a continent resolves to is the `CONT_` one the router builds its
 * path from. And `continentPresentation` requires six *distinct glyphs*; the
 * web pairs its glyphs by landmass (Africa/Europe, Asia/Oceania, the two
 * Americas), which is a real divergence recorded in IOS-PARITY.md rather than
 * something this suite can assert away — so what is checked here is the thing
 * the web does guarantee, that every continent is distinguishable by colour.
 */
describe('continents', () => {
  const all: WineEntry[] = getAllEntries();

  it('ships exactly the six continents', () => {
    expect(CONTINENT_KEYS).toHaveLength(6);
    expect(all.filter(e => e.category === 'CONTINENTS')).toHaveLength(6);
  });

  it('resolves every key to its CONT_ entry', () => {
    for (const key of CONTINENT_KEYS) {
      const entry = continentEntry(all, key);
      expect(entry, `no ${continentEntryId(key)} entry in the dataset`).toBeDefined();
      expect(entry!.id).toBe(continentEntryId(key));
      expect(entry!.category).toBe('CONTINENTS');
    }
  });

  it('accounts for every CONTINENTS entry with a key', () => {
    const ids = all.filter(e => e.category === 'CONTINENTS').map(e => e.id).sort();
    expect(ids).toEqual(CONTINENT_KEYS.map(continentEntryId).sort());
  });

  it('gives every continent a description and a country list', () => {
    for (const key of CONTINENT_KEYS) {
      const entry = continentEntry(all, key)!;
      expect(entry.description, `${entry.name} has no INFO description`).toBeTruthy();
      expect(countriesIn(all, key).length, `${entry.name} has no countries listed`).toBeGreaterThan(0);
    }
  });

  it('distinguishes every continent by colour', () => {
    const colors = all.filter(e => e.category === 'CONTINENTS').map(e => e.color);
    expect(colors.every(Boolean)).toBe(true);
    expect(new Set(colors).size).toBe(6);
  });

  /**
   * The case that would have caught the bug this table was written to fix.
   *
   * The web pinned North America to (38, -122) — San Francisco — and Africa to
   * (-33, 20) — Cape Town, so both markers sat off the landmass they label.
   * iOS found it, fixed it, and named this repo's `RetroGlobeScreen.tsx` as the
   * source. Nothing on this side could have noticed: the globe is UI, so it is
   * otherwise untested.
   */
  describe('marker coordinates', () => {
    it.each(CONTINENT_KEYS)('%s sits inside its own landmass', key => {
      const { lat, lng } = CONTINENT_COORDINATES[key];
      const bounds = CONTINENT_BOUNDS[key];

      expect(lat, `${key} latitude ${lat} outside ${bounds.lat}`).toBeGreaterThanOrEqual(bounds.lat[0]);
      expect(lat, `${key} latitude ${lat} outside ${bounds.lat}`).toBeLessThanOrEqual(bounds.lat[1]);
      expect(lng, `${key} longitude ${lng} outside ${bounds.lng}`).toBeGreaterThanOrEqual(bounds.lng[0]);
      expect(lng, `${key} longitude ${lng} outside ${bounds.lng}`).toBeLessThanOrEqual(bounds.lng[1]);
    });

    it('rejects the wine-city coordinates it replaced', () => {
      // San Francisco and Cape Town, the two the Swift comment names.
      expect(CONTINENT_COORDINATES.NORTH_AMERICA).not.toEqual({ lat: 38, lng: -122 });
      expect(CONTINENT_COORDINATES.AFRICA).not.toEqual({ lat: -33, lng: 20 });
    });

    it('keeps every pin a real coordinate', () => {
      for (const key of CONTINENT_KEYS) {
        const { lat, lng } = CONTINENT_COORDINATES[key];
        expect(Number.isFinite(lat) && Number.isFinite(lng)).toBe(true);
        expect(Math.abs(lat)).toBeLessThanOrEqual(90);
        expect(Math.abs(lng)).toBeLessThanOrEqual(180);
      }
    });
  });

  describe('hasRegionsInCountry', () => {
    it('is true for a country with regions in the dataset', () => {
      expect(hasRegionsInCountry(all, 'France')).toBe(true);
    });

    /** Both sides are hand-authored strings, so case must not matter. */
    it('is case-insensitive', () => {
      expect(hasRegionsInCountry(all, 'france')).toBe(true);
      expect(hasRegionsInCountry(all, 'FRANCE')).toBe(true);
    });

    it('is false for a country with no regions', () => {
      expect(hasRegionsInCountry(all, 'Egypt')).toBe(false);
    });

    it('is false for nothing at all', () => {
      expect(hasRegionsInCountry(all, '')).toBe(false);
      expect(hasRegionsInCountry(all, '   ')).toBe(false);
    });
  });

  /**
   * A marker that resolves to no region dead-ends in NO DATA FOUND. The Swift
   * `continentHasRegion` case — the one that caught Kakheti being filed under
   * Europe while Asia's marker pointed at it.
   */
  it.each(CONTINENT_KEYS)('%s resolves to at least one region', key => {
    expect(countriesIn(all, key).length, `${key} has no country list`).toBeGreaterThan(0);
    const regions = regionsIn(all, key);
    expect(
      regions.length,
      `${key} resolves to no region — marker would dead-end. countries: ${countriesIn(all, key).join(', ')}`,
    ).toBeGreaterThan(0);
  });

  /**
   * Guards against a continent listing a country whose name can never resolve
   * because it does not match how region origins spell it.
   */
  it.each(CONTINENT_KEYS)('%s has at least one tappable country', key => {
    const linkable = countriesIn(all, key).filter(c => hasRegionsInCountry(all, c));
    expect(linkable.length, `${key} has no country whose regions are in the dataset`).toBeGreaterThan(0);
  });

  it('returns regions name-sorted', () => {
    const names = regionsIn(all, 'EUROPE').map(e => e.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });
});
