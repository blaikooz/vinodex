import { describe, it, expect } from 'vitest';
import { buildWineEntries } from '@/shared/constants';
import type { WineEntry } from '@/shared/types';
import {
  ChipFacet,
  CHIP_FACETS,
  FACET_TITLE,
  FACET_NOTE,
  facetOptions,
  isOn,
  toggleOption,
  matchingEntries,
  countWithChip,
  filterCount,
  filterIsEmpty,
  ChipFilter,
  ChipOption,
} from './chipFilter';

const all = buildWineEntries() as WineEntry[];
const option = (facet: ChipFacet, value: string): ChipOption => facetOptions(facet, all).find(o => o.value === value)!;

// Mirrors ChipFilterTests in ToolsTests.swift.
describe('chip filter', () => {
  it('an empty filter excludes nothing', () => {
    const f: ChipFilter = {};
    expect(filterIsEmpty(f)).toBe(true);
    expect(matchingEntries(f, all).length).toBe(all.length);
  });

  it('every facet offers at least two chips and has a title + note', () => {
    for (const facet of CHIP_FACETS) {
      expect(facetOptions(facet, all).length, facet).toBeGreaterThanOrEqual(2);
      expect(FACET_TITLE[facet].length).toBeGreaterThan(0);
      expect(FACET_NOTE[facet].length).toBeGreaterThan(0);
    }
  });

  it('chip ids are unique across every facet', () => {
    const ids = CHIP_FACETS.flatMap(f => facetOptions(f, all).map(o => `${o.facet}:${o.value}`));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('toggling a chip on and off returns to empty', () => {
    let f: ChipFilter = {};
    const red = option('color', 'red');
    f = toggleOption(f, red);
    expect(isOn(f, red)).toBe(true);
    expect(filterCount(f)).toBe(1);
    f = toggleOption(f, red);
    expect(isOn(f, red)).toBe(false);
    expect(filterIsEmpty(f)).toBe(true);
  });

  it('within a facet chips OR, across facets they AND', () => {
    const reds = toggleOption({}, option('color', 'red'));
    const whites = toggleOption({}, option('color', 'white'));
    const both = toggleOption(reds, option('color', 'white'));
    const redCount = matchingEntries(reds, all).length;
    const whiteCount = matchingEntries(whites, all).length;
    expect(matchingEntries(both, all).length).toBe(redCount + whiteCount);
    // Across facets narrows.
    const redNoble = toggleOption(reds, option('rarity', 'NOBLE'));
    expect(matchingEntries(redNoble, all).length).toBeLessThanOrEqual(redCount);
  });

  it('a grape-only facet excludes other categories', () => {
    const reds = toggleOption({}, option('color', 'red'));
    expect(matchingEntries(reds, all).every(e => e.category === 'GRAPES')).toBe(true);
    const climate = toggleOption({}, option('climate', 'maritime'));
    expect(matchingEntries(climate, all).every(e => e.category === 'REGIONS')).toBe(true);
  });

  it('a category chip returns only that category', () => {
    const f = toggleOption({}, option('category', 'GRAPES'));
    const r = matchingEntries(f, all);
    expect(r.length).toBeGreaterThan(0);
    expect(r.every(e => e.category === 'GRAPES')).toBe(true);
  });

  it('incompatible facets yield nothing rather than throwing', () => {
    let f = toggleOption({}, option('category', 'REGIONS'));
    f = toggleOption(f, option('color', 'red'));
    expect(matchingEntries(f, all).length).toBe(0);
  });

  it('the count shown on a chip is the count it produces', () => {
    const base = toggleOption({}, option('category', 'GRAPES'));
    for (const facet of CHIP_FACETS) {
      for (const chip of facetOptions(facet, all)) {
        const predicted = countWithChip(base, chip, all);
        const actual = matchingEntries(toggleOption(base, chip), all).length;
        expect(predicted, `${chip.facet}:${chip.value}`).toBe(actual);
      }
    }
  });

  it('a filter round-trips through JSON for the screen-state store', () => {
    let f = toggleOption({}, option('color', 'white'));
    f = toggleOption(f, option('rarity', 'NOBLE'));
    const back = JSON.parse(JSON.stringify(f)) as ChipFilter;
    expect(back).toEqual(f);
    expect(filterCount(back)).toBe(2);
  });
});
