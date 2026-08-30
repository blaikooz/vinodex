import { describe, expect, it } from 'vitest';
import { buildWineEntries } from '@/shared/constants';
import { computePassport } from './passport';
import { STAMP_CATALOG, stampFor } from './stampCatalog';

describe('the stamp series', () => {
  it('is the passport\'s badges, one stamp each, in badge order', () => {
    const badges = computePassport([], buildWineEntries(), 0, 'NOVICE').badges.map(b => b.id);
    expect(STAMP_CATALOG.map(s => s.id)).toEqual(badges);
  });

  it('gives every stamp a title, a story, its own ink and a denomination', () => {
    const inks = new Set<string>();
    for (const s of STAMP_CATALOG) {
      expect(s.title).toMatch(/^[A-Z ]+$/);
      expect(s.info.length).toBeGreaterThan(20);
      expect(s.colorHex).toMatch(/^#[0-9A-F]{6}$/i);
      expect(s.denomination).toMatch(/^\d+¢$/);
      inks.add(s.colorHex);
    }
    expect(inks.size, 'two stamps share an ink').toBe(STAMP_CATALOG.length);
    expect(stampFor('sommelier').denomination).toBe('50¢');
  });
});
