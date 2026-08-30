import { describe, expect, it } from 'vitest';
import { buildWineEntries } from '@/shared/constants';
import { getColorType } from '@/shared/services/entryUtils';
import { filterEntries } from './entryFilter';

/**
 * v10#6 — the colour bugs iOS fixed in 0.9.0, pinned here as *not present*.
 *
 * iOS 0.9.0 fixed two things: "Prosecco was labelled a rosé" (its colour
 * inference matched substrings, and 'rose' sits inside 'p-rose-cco') and
 * "Rosé and Orange Wine's COLOR chip opened onto an empty list" (the chip
 * led to grapes by colour, and no grape is rosé). The audit found the web
 * already matches colour words whole (`\brose\b`) and routes the COLOR tile
 * to a STYLES list by colour — so neither reproduces. This suite is what
 * keeps that true: a substring test creeping back into `getColorType`, or
 * the tile's target moving to grapes, fails here with the iOS bug's name.
 */
describe('style colour inference (v10#6)', () => {
  const entries = buildWineEntries();
  const styles = entries.filter(e => e.category === 'STYLES');

  it('matches colour words whole: Prosecco is a white (by override), never a rosé', () => {
    // The web goes one better than iOS's DUAL: `STYLE_NAME_COLOR_OVERRIDES`
    // names Prosecco WHITE outright. Either is right; ROSE is the bug.
    expect(getColorType('Prosecco')).toBe('WHITE');
    expect(getColorType('Proseccos of the world')).not.toBe('ROSE');
    expect(getColorType('Rosé')).toBe('ROSE');
    expect(getColorType('Orange Wine')).toBe('ORANGE');
    expect(getColorType('Full-Body Red')).toBe('RED');
    expect(getColorType('Primrose Path')).toBe('DUAL'); // a made-up name: still not a rosé
  });

  it('the catalogue agrees: the Prosecco entry is not a rosé and the Rosé entry is', () => {
    const prosecco = styles.find(s => s.name === 'Prosecco');
    const rose = styles.find(s => s.name === 'Rosé');
    expect(prosecco && getColorType(prosecco.name)).not.toBe('ROSE');
    expect(rose && getColorType(rose.name)).toBe('ROSE');
  });

  it("the COLOR tile's target is never empty: a styles list by colour for ROSE and ORANGE", () => {
    // EntryDetailHeaders routes the tile to `onFilterByType(colorType, 'STYLES')`,
    // which `filterEntries` answers with the styles of that colour.
    for (const colour of ['ROSE', 'ORANGE', 'RED', 'WHITE'] as const) {
      const list = filterEntries(entries, { category: 'STYLES', filterMode: 'TYPE', filterValue: colour });
      expect(list.length, `${colour} styles list is empty`).toBeGreaterThan(0);
      for (const e of list) expect(getColorType(e.name)).toBe(colour);
    }
  });
});
