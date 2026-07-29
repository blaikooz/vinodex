import { describe, expect, it } from 'vitest';
import {
  allowedCategoriesFor,
  entryNamed,
  filterEntries,
  matchesSearchTerm,
  matchesWholeTerm,
  normalizeTerm,
  showsSearchBar,
  US_STATES,
} from './entryFilter';
import { getAllEntries } from './wineData';
import { isGrapeEntry, isRegionEntry, WineEntry } from '@/shared/types';

/**
 * Ported from `FilterTests` and `CrossLinkTests` in
 * `vinodex-ios/Tests/VinodexCoreTests/FilterTests.swift`.
 *
 * One structural difference shapes most of these. On iOS every category takes a
 * `search:`; on the web the search field is only rendered for GRAPES, STYLES,
 * FLAVORS and the two search modes (`showsSearchBar`), and the predicate honours
 * that — a search term passed with `category: 'REGIONS'` is *ignored*, not
 * applied. So the Swift cases that search within REGIONS are ported onto
 * MASTER_SEARCH, which is the web's actual way of searching across places, and
 * a case is added below pinning the ignore-it behaviour so it stays deliberate.
 */
describe('entryFilter', () => {
  const all: WineEntry[] = getAllEntries();

  describe('term helpers', () => {
    it('normalises punctuation and whitespace to single spaces', () => {
      expect(normalizeTerm('Rías  Baixas')).toBe('rias baixas');
      expect(normalizeTerm('Italy-Slovenia/border')).toBe('italy slovenia border');
      expect(normalizeTerm('   ')).toBe('');
    });

    it('matches whole terms only', () => {
      expect(matchesWholeTerm('Italy', 'Italy')).toBe(true);
      expect(matchesWholeTerm('Italy-Slovenia border', 'Italy')).toBe(true);
      // The point of the whole-term rule: a prefix is not a match.
      expect(matchesWholeTerm('Italy', 'Ital')).toBe(false);
      expect(matchesWholeTerm('', 'Italy')).toBe(false);
      expect(matchesWholeTerm('Italy', '')).toBe(false);
    });

    it('folds case and diacritics when searching', () => {
      expect(matchesSearchTerm('Albariño', 'albarino')).toBe(true);
      expect(matchesSearchTerm('Rías Baixas', 'rias')).toBe(true);
      expect(matchesSearchTerm('Bordeaux', 'BORD')).toBe(true);
      expect(matchesSearchTerm('Bordeaux', 'burgundy')).toBe(false);
    });
  });

  describe('category scoping', () => {
    it('master search spans every category', () => {
      expect(allowedCategoriesFor('MASTER_SEARCH')).toContain('GRAPES');
      expect(allowedCategoriesFor('MASTER_SEARCH')).toContain('REGIONS');
      expect(allowedCategoriesFor('MASTER_SEARCH')).toContain('FLAVORS');
    });

    it('world search is places only', () => {
      expect(allowedCategoriesFor('WORLD_SEARCH')).toEqual(['REGIONS', 'COUNTRY_GATE', 'CONTINENTS']);
    });

    it('any other category is itself', () => {
      expect(allowedCategoriesFor('GRAPES')).toEqual(['GRAPES']);
    });

    it('shows the search field only where the app renders one', () => {
      for (const c of ['GRAPES', 'STYLES', 'FLAVORS', 'MASTER_SEARCH', 'WORLD_SEARCH'] as const) {
        expect(showsSearchBar(c)).toBe(true);
      }
      expect(showsSearchBar('REGIONS')).toBe(false);
    });
  });

  describe('search', () => {
    it('matches on name', () => {
      const hits = filterEntries(all, { category: 'MASTER_SEARCH', search: 'cabernet' });
      expect(hits.some(e => e.name === 'Cabernet Sauvignon')).toBe(true);
    });

    it('matches on origin', () => {
      const hits = filterEntries(all, { category: 'MASTER_SEARCH', search: 'japan' });
      expect(hits.some(e => e.name === 'Yamanashi')).toBe(true);
    });

    it('matches on a synonym', () => {
      // Napa Valley carries "Napa".
      const hits = filterEntries(all, { category: 'MASTER_SEARCH', search: 'napa' });
      expect(hits.some(e => e.name === 'Napa Valley')).toBe(true);
    });

    /**
     * The Swift `diacritics` case, and the reason `matchesSearchTerm` exists.
     * Before the extraction the search compared `.toLowerCase()` on both sides,
     * so neither of these found anything — you had to type the accent to reach
     * an entry whose distinguishing feature is that it has one.
     */
    it('is diacritic-insensitive', () => {
      const albarino = filterEntries(all, { category: 'MASTER_SEARCH', search: 'albarino' });
      expect(albarino.some(e => e.name === 'Albariño')).toBe(true);

      const rias = filterEntries(all, { category: 'MASTER_SEARCH', search: 'rias' });
      expect(rias.some(e => e.name === 'Rías Baixas')).toBe(true);
    });

    it('still finds the accented spelling when it is typed', () => {
      const hits = filterEntries(all, { category: 'MASTER_SEARCH', search: 'Albariño' });
      expect(hits.some(e => e.name === 'Albariño')).toBe(true);
    });

    it('an empty search returns the whole category', () => {
      const grapes = filterEntries(all, { category: 'GRAPES', search: '' });
      expect(grapes).toHaveLength(all.filter(isGrapeEntry).length);
    });

    it('a search matching nothing returns nothing', () => {
      expect(filterEntries(all, { category: 'GRAPES', search: 'zzzzzz' })).toEqual([]);
    });

    /** Deliberate web divergence — see the suite header. */
    it('ignores a search term for a category with no search field', () => {
      const regions = filterEntries(all, { category: 'REGIONS', search: 'zzzzzz' });
      expect(regions.length).toBe(all.filter(isRegionEntry).length);
    });
  });

  describe('ordering', () => {
    it('sorts results by name', () => {
      const names = filterEntries(all, { category: 'GRAPES' }).map(e => e.name);
      expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
    });
  });

  describe('filters', () => {
    it('no filter matches everything in the category', () => {
      expect(filterEntries(all, { category: 'STYLES' })).toHaveLength(
        all.filter(e => e.category === 'STYLES').length,
      );
    });

    it('rarity selects only that tier', () => {
      const noble = filterEntries(all, { category: 'GRAPES', filterMode: 'RARITY', filterValue: 'NOBLE' });
      expect(noble.length).toBeGreaterThan(0);
      expect(noble.every(e => isGrapeEntry(e) && e.rarity === 'NOBLE')).toBe(true);
    });

    it('climate selects only that climate', () => {
      const warm = filterEntries(all, { category: 'REGIONS', filterMode: 'CLIMATE', filterValue: 'warm' });
      expect(warm.length).toBeGreaterThan(0);
      expect(warm.every(e => isRegionEntry(e) && e.climate === 'warm')).toBe(true);
    });

    it('origin matches whole terms only', () => {
      const french = filterEntries(all, { category: 'REGIONS', filterMode: 'ORIGIN', filterValue: 'France' });
      expect(french.some(e => e.name === 'Bordeaux')).toBe(true);
      expect(french.every(e => (e.details as { origin?: string }).origin === 'France')).toBe(true);
    });

    it('system selects one appellation system', () => {
      const aoc = filterEntries(all, { category: 'REGIONS', filterMode: 'SYSTEM', filterValue: 'AOC' });
      expect(aoc.length).toBeGreaterThan(0);
      expect(
        aoc.every(e => (e.details as { classification?: string }).classification?.toLowerCase() === 'aoc'),
      ).toBe(true);
    });

    it('state selects US states only', () => {
      const california = filterEntries(all, {
        category: 'REGIONS',
        filterMode: 'STATE',
        filterValue: 'California',
      });
      expect(california.length).toBeGreaterThan(0);
      for (const e of california) {
        const bag = e.details as { origin?: string; state?: string };
        expect(bag.origin?.toUpperCase()).toBe('USA');
        expect(bag.state).toBe('California');
      }
    });

    it('an unknown filter value matches nothing', () => {
      expect(
        filterEntries(all, { category: 'REGIONS', filterMode: 'ORIGIN', filterValue: 'Atlantis' }),
      ).toEqual([]);
    });

    it('composes a filter with a search', () => {
      const result = filterEntries(all, {
        category: 'MASTER_SEARCH',
        filterMode: 'ORIGIN',
        filterValue: 'France',
        search: 'bordeaux',
      });
      expect(result.some(e => e.name === 'Bordeaux')).toBe(true);
      expect(result.every(e => (e.details as { origin?: string }).origin === 'France')).toBe(true);
    });
  });

  describe('the country gate', () => {
    it('synthesises a row per country, in the order given', () => {
      const rows = filterEntries(all, {
        category: 'COUNTRY_GATE',
        filterValue: ['France', 'Italy'],
      });
      expect(rows.map(e => e.name)).toEqual(['France', 'Italy']);
      expect(rows.every(e => e.category === 'COUNTRY_GATE')).toBe(true);
    });

    it('gives a known country its real appellation systems', () => {
      const [france] = filterEntries(all, { category: 'COUNTRY_GATE', filterValue: ['France'] });
      expect(france?.tags).toEqual(['AOC', 'IGP']);
    });

    it('falls back to a generic tag for a country with no table entry', () => {
      const [nowhere] = filterEntries(all, { category: 'COUNTRY_GATE', filterValue: ['Nowhere'] });
      expect(nowhere?.tags).toEqual(['SYSTEM']);
    });

    it('lists the US states, name-sorted', () => {
      const states = filterEntries(all, {
        category: 'COUNTRY_GATE',
        filterMode: 'STATE',
        filterValue: US_STATES,
      });
      expect(states.length).toBeGreaterThan(0);
      expect(states.map(e => e.name)).toEqual([...states.map(e => e.name)].sort((a, b) => a.localeCompare(b)));
      expect(states.every(e => US_STATES.includes(e.name))).toBe(true);
    });
  });

  /** Ported from the `CrossLinkTests` suite. */
  describe('cross-link resolution', () => {
    it('resolves a name that is in the dataset', () => {
      expect(entryNamed(all, 'Bordeaux')).toBeDefined();
    });

    it('is case-insensitive', () => {
      expect(entryNamed(all, 'cabernet sauvignon')).toBeDefined();
    });

    it('is diacritic-insensitive', () => {
      expect(entryNamed(all, 'albarino')?.name).toBe('Albariño');
    });

    /**
     * A name with no entry returns undefined rather than a near-match, so the
     * detail screen renders it as a plain label instead of a dead button.
     */
    it('returns undefined for a name that is not there', () => {
      expect(entryNamed(all, 'Definitely Not A Grape')).toBeUndefined();
      expect(entryNamed(all, '')).toBeUndefined();
      expect(entryNamed(all, '   ')).toBeUndefined();
    });

    it('does not cross categories when scoped', () => {
      // Champagne is both a style and a region.
      expect(entryNamed(all, 'Champagne', 'STYLES')).toBeDefined();
      expect(entryNamed(all, 'Champagne', 'REGIONS')).toBeDefined();
      expect(entryNamed(all, 'Champagne', 'GRAPES')).toBeUndefined();
    });

    /**
     * The Swift case pins a known content gap so it cannot grow unnoticed:
     * regions and styles reference grapes absent from the grape table. The web
     * number is 28 rather than Swift's 24, because this side canonicalises
     * "Syrah/Shiraz" to Syrah — so the literal "Shiraz", and a few other
     * synonym spellings, do not resolve here even though the grape exists.
     *
     * That is a content gap, not a fault: an unresolved name renders as a plain
     * label. The resolution *rate* is the real assertion — a break in the
     * mechanism shows up there rather than as a slow creep in the count.
     */
    it('resolves the great majority of grape cross-links', () => {
      const unresolved = new Set<string>();
      let total = 0;

      for (const entry of all.filter(e => e.category === 'REGIONS' || e.category === 'STYLES')) {
        for (const name of (entry.details as { notableGrapes?: string[] }).notableGrapes ?? []) {
          total += 1;
          if (!entryNamed(all, name)) unresolved.add(name);
        }
      }

      expect(total).toBeGreaterThan(0);
      expect(unresolved.size).toBeLessThanOrEqual(28);

      const resolved = total - unresolved.size;
      expect(resolved / total).toBeGreaterThan(0.85);
    });
  });
});
