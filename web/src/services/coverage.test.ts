import { describe, expect, it } from 'vitest';
import { getAllEntries } from './wineData';
import { entryNamed } from './entryFilter';
import { isGrapeEntry, isRegionEntry, WineEntry } from '@/shared/types';

/**
 * Guardrails on the shipped dataset, ported from
 * `vinodex-ios/Tests/VinodexCoreTests/CoverageTests.swift`.
 *
 * These exist because a data swap that silently drops a UI state should fail
 * here — in two seconds — rather than on a deploy, or worse, not at all. The
 * numbers are pinned deliberately: a change you did not intend is exactly what
 * this is for. Update them on purpose when the data changes.
 *
 * One structural difference from Swift. `EntryCategory` on iOS cannot decode
 * COUNTRY_GATE, so that category is filtered out of the iOS bundle and its
 * total is 284. The web ships COUNTRY_GATE as real entries, so the raw total
 * here is higher — but the five categories iOS counts still sum to exactly the
 * same 284, which is asserted below. That equality is the real guardrail: it
 * says the two apps are looking at one dataset.
 */
describe('dataset coverage', () => {
  const all: WineEntry[] = getAllEntries();
  const countIn = (category: string) => all.filter(e => e.category === category).length;

  it('loads a non-empty dataset', () => {
    expect(all.length).toBeGreaterThan(0);
  });

  it('gives every entry an id, a name and a category', () => {
    for (const e of all) {
      expect(e.id, `${e.name} has no id`).toBeTruthy();
      expect(e.name, `${e.id} has no name`).toBeTruthy();
      expect(e.category, `${e.id} has no category`).toBeTruthy();
    }
  });

  it('has no duplicate ids', () => {
    const ids = all.map(e => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  /**
   * The per-category counts iOS pins, to the entry. Re-pinned 0.6.5: the
   * batch-2 FR/IT/ES expansion took the catalog to 405 (iOS CoverageTests)
   * pins the same numbers), and the parity line brought the web onto the same
   * shared/ data, so these now agree with iOS exactly.
   */
  it('matches the iOS per-category counts', () => {
    expect(countIn('GRAPES')).toBe(146);
    // REGIONS brought to iOS main's 124 (added R117–R124: the Brazilian, Galician,
    // Balearic, Azorean, SW-French, Chilean and San Benito regions). GRAPES (177)
    // and STYLES (33) on iOS main are still ahead — tracked as separate imports.
    expect(countIn('REGIONS')).toBe(124);
    expect(countIn('STYLES')).toBe(31);
    expect(countIn('CONTINENTS')).toBe(6);
    expect(countIn('FLAVORS')).toBe(106);
  });

  /**
   * The web's running total: 405 + the 8 regions imported this batch = 413.
   * (iOS main reports 446; the remaining 33 are the grape/style backlog above.)
   */
  it('totals its 413 entries across the five counted categories', () => {
    const shared =
      countIn('GRAPES') + countIn('REGIONS') + countIn('STYLES') + countIn('FLAVORS') + countIn('CONTINENTS');
    expect(shared).toBe(413);
  });

  it('accounts for every entry in a known category', () => {
    const known = ['GRAPES', 'REGIONS', 'STYLES', 'FLAVORS', 'CONTINENTS', 'COUNTRY_GATE'];
    const unaccounted = all.filter(e => !known.includes(e.category));
    expect(unaccounted.map(e => `${e.id}:${e.category}`)).toEqual([]);
  });

  it('draws regions from the twenty-six countries iOS counts', () => {
    const origins = new Set(
      all.filter(isRegionEntry).map(e => e.details.origin).filter((o): o is string => !!o),
    );
    // 25 → 26: the R117/R118 import makes Brazil a region-origin country.
    expect(origins.size).toBe(26);
  });

  /** All four rarity tiers must be represented, or a UI state goes untested. */
  it('represents all four rarity tiers', () => {
    const tiers = new Set(all.filter(isGrapeEntry).map(e => e.rarity).filter(Boolean));
    for (const tier of ['COMMON', 'UNCOMMON', 'RARE', 'NOBLE']) {
      expect(tiers, `missing rarity tier ${tier}`).toContain(tier);
    }
  });

  it('represents all five climates', () => {
    const climates = new Set(all.filter(isRegionEntry).map(e => e.climate).filter(Boolean));
    for (const climate of ['maritime', 'continental', 'cool', 'warm', 'mediterranean']) {
      expect(climates, `missing climate ${climate}`).toContain(climate);
    }
  });

  /**
   * Flavours are derived from the grapes' tasting notes, collapsing shared
   * notes across grapes — so the count must stay well below the number of note
   * *instances*. The real assertion is the loop: every flavour must link a
   * grape that exists.
   */
  describe('flavours are derived from the grapes', () => {
    const flavors = all.filter(e => e.category === 'FLAVORS');

    it('collapses shared notes rather than listing every instance', () => {
      const noteInstances = all
        .filter(isGrapeEntry)
        .reduce((sum, g) => sum + (g.tastingProfile?.length ?? 0), 0);
      expect(flavors.length).toBeGreaterThan(0);
      expect(flavors.length).toBeLessThan(noteInstances);
    });

    it('links every flavour to at least one grape that exists', () => {
      const grapeNames = new Set(all.filter(isGrapeEntry).map(e => e.name));
      const orphans = flavors
        .filter(f => {
          const linked = (f.details as { notableGrapes?: string[] }).notableGrapes ?? [];
          return !linked.some(n => grapeNames.has(n));
        })
        .map(f => f.name);
      expect(orphans).toEqual([]);
    });

    /**
     * Flavour INFO is only worth showing while the blurbs are specific. They
     * were hidden originally because every one was the same sentence with the
     * nouns swapped.
     */
    it('gives every flavour a distinct, non-empty description', () => {
      const seen = new Set<string>();
      for (const f of flavors) {
        expect(f.description, `${f.name} has no description`).toBeTruthy();
        expect(seen.has(f.description), `duplicate blurb: ${f.description}`).toBe(false);
        seen.add(f.description);
      }
    });
  });

  /**
   * Grape stat bars must carry the authored values, not values re-derived from
   * descriptive text — an earlier skeleton invented these
   * (`aromatics = tastingProfile.count + 2`). This pins the real ones.
   */
  it('keeps Cabernet Sauvignon characteristics authored', () => {
    const cab = entryNamed(all, 'Cabernet Sauvignon');
    expect(cab).toBeDefined();
    expect(isGrapeEntry(cab!)).toBe(true);
    if (!isGrapeEntry(cab!)) return;

    expect(cab.grapeCharacteristics.tannin).toBe(4);
    expect(cab.grapeCharacteristics.acid).toBe(4);
    expect(cab.grapeCharacteristics.aromatics).toBe(5);
    expect(cab.grapeCharacteristics.body).toBe(5);
    expect(cab.rarity).toBe('NOBLE');
    expect(cab.grapeBodyClass).toBe('Full');
  });

  /**
   * Napa is the only region exercising `state` and `synonyms`; if it is ever
   * swapped out, those fields go untested.
   */
  it('keeps Napa exercising the state and synonyms fields', () => {
    const napa = entryNamed(all, 'Napa Valley');
    expect(napa).toBeDefined();
    expect(isRegionEntry(napa!)).toBe(true);
    if (!isRegionEntry(napa!)) return;

    expect(napa.details.state).toBe('California');
    expect(napa.details.synonyms).toContain('Napa');
    expect(napa.climate).toBe('warm');
  });

  /**
   * Every country a region names must have a gate entry with authored prose
   * behind it — otherwise the country page falls back to a derived summary
   * line, which is what the whole block used to be.
   */
  it('gives every region origin a country entry with a blurb', () => {
    const origins = [
      ...new Set(all.filter(isRegionEntry).map(e => e.details.origin).filter((o): o is string => !!o)),
    ].sort();
    expect(origins.length).toBeGreaterThan(0);

    const missing = origins.filter(origin => {
      const gate = all.find(e => e.category === 'COUNTRY_GATE' && e.name === origin);
      return !gate || !gate.description;
    });
    expect(missing).toEqual([]);
  });
});

