import { describe, expect, it } from 'vitest';
import {
  resolveFlavorClassIcon,
  resolveFlavorIcon,
  resolveFlavorSubclassIcon,
} from '@/shared/services/flavorIcon';
import { flavorClasses, flavorsInClass } from './grapeScan';
import { getAllEntries } from './wineData';
import { WineEntry } from '@/shared/types';
import iconManifest from '../data/iconManifest.json';

/**
 * Ported from `flavorTaxonomyGlyphs` in
 * `vinodex-ios/Tests/VinodexCoreTests/CoverageTests.swift`.
 *
 * Unlike the soil suite next door, this one pins rather than fixes: the web
 * already satisfies the 1:1 rule. It is worth having anyway, because the bug it
 * guards is invisible — the scanner's CLASS and SUBCLASS tiles sit side by side,
 * and they once both drew the entry's own glyph, so they were always identical
 * to each other and changed with whichever note was open.
 */
const FALLBACK = (iconManifest as { fallback: string }).fallback;

interface FlavorBag {
  classification?: string;
  subclass?: string;
}

describe('flavour taxonomy glyphs', () => {
  const all: WineEntry[] = getAllEntries();
  const flavors = all.filter(e => e.category === 'FLAVORS');

  it('has flavours to exercise', () => {
    expect(flavors.length).toBeGreaterThan(0);
  });

  /**
   * Qualified by kind, not by name alone: SALTY is *both* a class and a
   * subclass, and they are two levels that each need their own glyph.
   */
  it('gives every class and subclass its own glyph, one to one', () => {
    const owners = new Map<string, string>();
    const levels = new Set<string>();
    const clashes: string[] = [];

    for (const f of flavors) {
      const bag = f.details as FlavorBag;
      const pairs: Array<[string, string, string]> = [
        ['class', bag.classification ?? '', resolveFlavorClassIcon(bag.classification)],
        ['subclass', bag.subclass ?? '', resolveFlavorSubclassIcon(bag.subclass)],
      ];

      for (const [kind, value, icon] of pairs) {
        const level = `${kind} ${value}`;
        levels.add(level);
        expect(icon, `flavor ${level} has no glyph`).not.toBe(FALLBACK);

        const owner = owners.get(icon);
        if (owner && owner !== level) clashes.push(`${level} reuses ${icon}, owned by ${owner}`);
        else owners.set(icon, level);
      }
    }

    expect(levels.size, 'no flavor classes or subclasses were exercised').toBeGreaterThan(0);
    expect([...new Set(clashes)]).toEqual([]);
    expect(owners.size, 'glyphs and taxonomy levels are not 1:1').toBe(levels.size);
  });

  it('keeps SALTY distinct as a class and as a subclass', () => {
    // The case that motivates qualifying levels by kind.
    expect(resolveFlavorClassIcon('SALTY')).not.toBe(resolveFlavorSubclassIcon('SALTY'));
  });

  it('resolves a glyph for every class the scanner offers', () => {
    const classes = flavorClasses(all);
    expect(classes.length).toBeGreaterThan(0);
    for (const c of classes) {
      expect(resolveFlavorClassIcon(c), `class ${c} has no glyph`).not.toBe(FALLBACK);
      expect(flavorsInClass(all, c).length, `class ${c} is empty`).toBeGreaterThan(0);
    }
  });

  describe('resolveFlavorIcon', () => {
    it('gives every flavour entry a glyph', () => {
      for (const f of flavors) {
        const bag = f.details as FlavorBag;
        expect(resolveFlavorIcon(f.name, bag.subclass), `${f.name} has no glyph`).toBeTruthy();
      }
    });

    it('falls back rather than throwing on an unknown note', () => {
      expect(() => resolveFlavorIcon('Not A Real Note', undefined)).not.toThrow();
      expect(resolveFlavorIcon(undefined, undefined)).toBeTruthy();
    });
  });
});
