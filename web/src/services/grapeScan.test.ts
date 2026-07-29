import { describe, expect, it } from 'vitest';
import {
  bodyClassesInData,
  countriesInData,
  criteriaAreEmpty,
  emptyCriteria,
  flavorClasses,
  flavorsAreFull,
  flavorsInClass,
  grapeCarriesFlavor,
  grapesMatching,
  toggleFlavor,
  FLAVOR_LIMIT,
} from './grapeScan';
import { getAllEntries } from './wineData';
import { isGrapeEntry, WineEntry } from '@/shared/types';

/**
 * Ported from the `Scanner` suite in
 * `vinodex-ios/Tests/VinodexCoreTests/MinigameTests.swift`.
 *
 * One case is adapted rather than copied. Swift's `bodyClassesAreReal` iterates
 * `GrapeBody.allCases`, a closed three-value enum; the web type is wider and
 * `bodyClassesInData` derives the chips from the data instead, so the test
 * asserts the same guarantee — every chip the scanner offers selects something
 * — against the derived list. The Swift subclass cases are not ported: the web
 * scanner groups flavours by class only.
 */
describe('grapeScan', () => {
  const all: WineEntry[] = getAllEntries();
  const grapes = all.filter(isGrapeEntry);

  describe('criteria', () => {
    it('starts empty', () => {
      expect(criteriaAreEmpty(emptyCriteria())).toBe(true);
    });

    it('tracks whether anything was answered', () => {
      expect(criteriaAreEmpty({ ...emptyCriteria(), color: 'white' })).toBe(false);
      expect(criteriaAreEmpty({ ...emptyCriteria(), country: 'Italy' })).toBe(false);
      expect(criteriaAreEmpty({ ...emptyCriteria(), body: 'Full' })).toBe(false);
      expect(criteriaAreEmpty({ flavorIds: ['F001'] })).toBe(false);
    });

    it('refuses more flavours than the limit', () => {
      const flavours = all.filter(e => e.category === 'FLAVORS').slice(0, FLAVOR_LIMIT + 2);
      expect(flavours.length).toBe(FLAVOR_LIMIT + 2);

      let criteria = emptyCriteria();
      for (const f of flavours) criteria = toggleFlavor(criteria, f.id);

      expect(criteria.flavorIds).toHaveLength(FLAVOR_LIMIT);
      expect(flavorsAreFull(criteria)).toBe(true);
    });

    it('toggling one off makes room again', () => {
      const flavours = all.filter(e => e.category === 'FLAVORS').slice(0, FLAVOR_LIMIT);
      let criteria = emptyCriteria();
      for (const f of flavours) criteria = toggleFlavor(criteria, f.id);

      const first = criteria.flavorIds[0]!;
      criteria = toggleFlavor(criteria, first);

      expect(criteria.flavorIds).toHaveLength(FLAVOR_LIMIT - 1);
      expect(criteria.flavorIds).not.toContain(first);
      expect(flavorsAreFull(criteria)).toBe(false);
    });

    it('does not mutate the criteria it is given', () => {
      const criteria = emptyCriteria();
      toggleFlavor(criteria, 'F001');
      expect(criteria.flavorIds).toEqual([]);
    });
  });

  describe('grapesMatching', () => {
    it('matches every grape when told nothing', () => {
      expect(grapesMatching(all, emptyCriteria())).toHaveLength(grapes.length);
    });

    it('returns only grapes, never other categories', () => {
      expect(grapesMatching(all, emptyCriteria()).every(isGrapeEntry)).toBe(true);
    });

    it('narrows by colour, and every result is that colour', () => {
      const reds = grapesMatching(all, { ...emptyCriteria(), color: 'red' });
      expect(reds.length).toBeGreaterThan(0);
      expect(reds.length).toBeLessThan(grapes.length);
      for (const e of reds) {
        expect(isGrapeEntry(e) && e.grapeType).toBe('red');
      }
    });

    it('narrows further by body', () => {
      const reds = grapesMatching(all, { ...emptyCriteria(), color: 'red' });
      const body = bodyClassesInData(all)[0]!;
      const narrowed = grapesMatching(all, { ...emptyCriteria(), color: 'red', body });
      expect(narrowed.length).toBeLessThanOrEqual(reds.length);
      for (const e of narrowed) {
        expect(isGrapeEntry(e) && e.grapeBodyClass?.toLowerCase()).toBe(body.toLowerCase());
      }
    });

    /**
     * Every body chip the scanner offers must select something — a dead chip is
     * only discoverable by tapping it. The Swift `bodyClassesAreReal` case.
     */
    it('every body class the scanner offers has grapes behind it', () => {
      const classes = bodyClassesInData(all);
      expect(classes.length).toBeGreaterThan(0);
      for (const body of classes) {
        expect(grapesMatching(all, { ...emptyCriteria(), body }).length).toBeGreaterThan(0);
      }
    });

    it('every country chip has grapes behind it', () => {
      const countries = countriesInData(all);
      expect(countries.length).toBeGreaterThan(0);
      for (const country of countries) {
        expect(grapesMatching(all, { ...emptyCriteria(), country }).length).toBeGreaterThan(0);
      }
    });

    it('filters country by whole term', () => {
      const french = grapesMatching(all, { ...emptyCriteria(), country: 'France' });
      expect(french.length).toBeGreaterThan(0);
      for (const e of french) {
        expect(isGrapeEntry(e) && (e.grapeCountryOfOrigin ?? '')).toContain('France');
      }
    });

    it('an unknown country matches nothing', () => {
      expect(grapesMatching(all, { ...emptyCriteria(), country: 'Atlantis' })).toEqual([]);
    });

    /** Flavours are ANDed, so adding one can only ever shrink the result. */
    it('combines flavours with AND', () => {
      const flavour = all.find(
        e => e.category === 'FLAVORS' && (e.details as { notableGrapes?: string[] }).notableGrapes?.length,
      );
      expect(flavour).toBeDefined();

      const matched = grapesMatching(all, { flavorIds: [flavour!.id] });
      expect(matched.length).toBeGreaterThan(0);
      expect(matched.length).toBeLessThanOrEqual(grapes.length);
      for (const grape of matched) {
        expect(grapeCarriesFlavor(grape, flavour!)).toBe(true);
      }
    });

    it('adding a second flavour cannot widen the result', () => {
      const flavours = all
        .filter(e => e.category === 'FLAVORS' && (e.details as { notableGrapes?: string[] }).notableGrapes?.length)
        .slice(0, 2);
      expect(flavours).toHaveLength(2);

      const one = grapesMatching(all, { flavorIds: [flavours[0]!.id] });
      const two = grapesMatching(all, { flavorIds: [flavours[0]!.id, flavours[1]!.id] });
      expect(two.length).toBeLessThanOrEqual(one.length);
    });

    it('sorts results by name, case-insensitively', () => {
      const names = grapesMatching(all, { ...emptyCriteria(), color: 'white' }).map(e => e.name);
      const sorted = [...names].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
      expect(names).toEqual(sorted);
    });

    it('ignores a flavour id the dataset does not have', () => {
      // An unknown id resolves to no flavour, so it constrains nothing rather
      // than silently excluding everything.
      expect(grapesMatching(all, { flavorIds: ['NOT_A_FLAVOR'] })).toHaveLength(grapes.length);
    });
  });

  describe('flavour groups', () => {
    /** The scanner lists these as tiles, so each must lead somewhere. */
    it('every flavour class has entries behind it', () => {
      const classes = flavorClasses(all);
      expect(classes.length).toBeGreaterThan(0);
      for (const c of classes) {
        expect(flavorsInClass(all, c).length).toBeGreaterThan(0);
      }
    });

    it('an unknown class is empty rather than throwing', () => {
      expect(flavorsInClass(all, 'NOT_A_CLASS')).toEqual([]);
    });
  });
});
