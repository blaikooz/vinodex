import { describe, expect, it } from 'vitest';
import { appellationName, hasAppellationName } from './entryDisplay';
import { getAllEntries } from './wineData';
import { isRegionEntry, WineEntry } from '@/shared/types';

/**
 * Ported from the `docIsCountrySpecific` and `appellationNamesResolve` cases in
 * `vinodex-ios/Tests/VinodexCoreTests/CoverageTests.swift`.
 *
 * Both were unportable until now for the same reason: the web had no
 * `appellationName` at all, so the region readout printed a bare abbreviation
 * and there was nothing for these to assert against.
 */
describe('appellationName', () => {
  const all: WineEntry[] = getAllEntries();

  it('spells out the unambiguous systems', () => {
    expect(appellationName('AOC', 'France')).toBe("Appellation d'Origine Contrôlée");
    expect(appellationName('AVA', 'USA')).toBe('American Viticultural Area');
    expect(appellationName('DOCG', 'Italy')).toBe('Denominazione di Origine Controllata e Garantita');
    expect(appellationName('WO', 'South Africa')).toBe('Wine of Origin');
    expect(appellationName('GI', 'Australia')).toBe('Geographical Indication');
  });

  /** `DOC` means three different things, so the lookup is keyed by the pair. */
  it('resolves DOC per country', () => {
    expect(appellationName('DOC', 'Italy')).toBe('Denominazione di Origine Controllata');
    expect(appellationName('DOC', 'Portugal')).toBe('Denominação de Origem Controlada');
    expect(appellationName('DOC', 'Argentina')).toBe('Denominación de Origen Controlada');
  });

  it('is case-insensitive on both sides', () => {
    expect(appellationName('doc', 'italy')).toBe('Denominazione di Origine Controllata');
    expect(appellationName('AoC', 'FRANCE')).toBe("Appellation d'Origine Contrôlée");
  });

  it('tolerates surrounding whitespace', () => {
    expect(appellationName('  DOC  ', 'Italy')).toBe('Denominazione di Origine Controllata');
  });

  /** An unknown system passes through rather than rendering empty. */
  it('passes an unknown system through unchanged', () => {
    expect(appellationName('XYZ', 'Nowhere')).toBe('XYZ');
    expect(appellationName('', 'Nowhere')).toBe('');
  });

  describe('hasAppellationName', () => {
    it('distinguishes a real expansion from a pass-through', () => {
      expect(hasAppellationName('AOC', 'France')).toBe(true);
      expect(hasAppellationName('XYZ', 'Nowhere')).toBe(false);
      expect(hasAppellationName('', 'France')).toBe(false);
      expect(hasAppellationName('   ', 'France')).toBe(false);
    });
  });

  /**
   * The region screen spells out the abbreviation. An unmapped system falls
   * back to the abbreviation, which renders but reads as a bug — so adding a
   * region in a new country should fail here first.
   *
   * Prädikatswein is the documented exception in the Swift case: it is already
   * the spelled-out name, so it has nothing to expand to.
   */
  it('gives every region in the dataset a spelled-out system', () => {
    const unmapped = all
      .filter(isRegionEntry)
      .filter(r => {
        const short = (r.details.classification || '').trim();
        if (!short || short === 'Prädikatswein') return false;
        return !hasAppellationName(short, r.details.origin || '');
      })
      .map(r => `${r.name}: '${r.details.classification}' (${r.details.origin})`);

    expect(unmapped).toEqual([]);
  });
});
