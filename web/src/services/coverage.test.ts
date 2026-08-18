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
 * One structural difference from Swift, and it is **pinned rather than
 * reconciled** (W18). `EntryCategory` on iOS cannot decode COUNTRY_GATE, so
 * that category is filtered out of the iOS bundle; the web ships those 80
 * gates as real entries. The two apps therefore honestly report two totals:
 *
 *     web BIOS / DATA panel   526   (446 + 80 country gates)
 *     iOS BIOS / DATA panel   446
 *
 * Both numbers are true about their own catalogue and neither is a bug. The
 * old header here said iOS totalled 284, which was three data batches out of
 * date while the assertion below already said 446 — a comment drifting from
 * the code it explains, in the file whose whole job is to stop that.
 *
 * The real guardrail is the equality: the five categories iOS counts sum to
 * exactly the number iOS reports, so the two apps are looking at one dataset.
 * Both sides of the divergence are asserted, so neither can move silently.
 */
describe('dataset coverage', () => {
  const all: WineEntry[] = getAllEntries();
  const countIn = (category: string) => all.filter(e => e.category === category).length;

  /**
   * The web's own total, gates included — the number its BIOS and DATA panel
   * print. Pinned to the entry (W18): this assertion used to be
   * `toBeGreaterThan(0)`, which passes on a dataset of one and is exactly the
   * shape of check that lets a data swap through.
   *
   * A legitimate data batch moves this. Update it *with a comment naming the
   * batch*, as the per-category pins below are updated — never by relaxing
   * it back to an inequality.
   */
  it('ships 526 entries, the number the BIOS reports', () => {
    expect(all.length).toBe(526);
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
    // Re-pinned 0.7.4, catching up two iOS batches at once: 0.7.3c added Brazil
    // (+2 regions, which web never re-pinned) and 0.7.4's grape overhaul added
    // 25 grapes and 6 regions. Flavours stay at 106 — every new tasting note
    // was drawn from the existing vocabulary on purpose.
    // Re-pinned again for iOS 0.7.9 (G): sommbot's P1/P2 batch, +6 grapes
    // (Sercial, Boal, Malvasia de Sao Jorge, Gouais Blanc, Plavac Mali, Manto
    // Negro) and +2 styles (Madeira, Cava). Regions and flavours unchanged.
    expect(countIn('GRAPES')).toBe(177);
    expect(countIn('REGIONS')).toBe(124);
    expect(countIn('STYLES')).toBe(33);
    expect(countIn('CONTINENTS')).toBe(6);
    expect(countIn('FLAVORS')).toBe(106);
  });

  /**
   * The category iOS does not decode, pinned on its own (W18).
   *
   * It was the one category with no count at all, which is precisely the one
   * that most needed it: the gates are the whole of the web's divergence from
   * iOS's total, so an unpinned COUNTRY_GATE meant the divergence itself was
   * unobserved. 526 - 446 = 80 is now checked from both ends.
   */
  it('ships the 80 country gates iOS filters out', () => {
    expect(countIn('COUNTRY_GATE')).toBe(80);
    const shared =
      countIn('GRAPES') + countIn('REGIONS') + countIn('STYLES') + countIn('FLAVORS') + countIn('CONTINENTS');
    expect(shared + countIn('COUNTRY_GATE')).toBe(all.length);
  });

  /**
   * The five categories iOS counts must still total its 446 — the number the
   * DATA panel shows on both platforms.
   */
  it('totals the same 446 entries iOS reports', () => {
    const shared =
      countIn('GRAPES') + countIn('REGIONS') + countIn('STYLES') + countIn('FLAVORS') + countIn('CONTINENTS');
    expect(shared).toBe(446);
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
      // Pinned, not merely non-zero (W18). The *relationship* is the point of
      // the test — 106 distinct flavours standing for 528 note instances — and
      // a bound of "more than nothing" would hold if the grapes lost every
      // tasting profile they have.
      expect(flavors.length).toBe(106);
      expect(noteInstances).toBe(528);
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
    // The same 26 the pin above counts, so this test cannot pass vacuously
    // on an empty origin set (W18).
    expect(origins.length).toBe(26);

    const missing = origins.filter(origin => {
      const gate = all.find(e => e.category === 'COUNTRY_GATE' && e.name === origin);
      return !gate || !gate.description;
    });
    expect(missing).toEqual([]);
  });
});

