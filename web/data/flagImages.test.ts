import { describe, expect, it } from 'vitest';
import { buildWineEntries } from '@/shared/constants';
import { getFlagImage } from './flagImages';
import type { GrapeCard } from '@/shared/types';

/**
 * Every origin the catalogue actually names resolves to a drawn flag
 * (v0.6.38). Mexico shipped flagless for months because the art sat in the
 * mirror with no import and nothing counted the gap; this counts it. A new
 * country enters the data and this fails until its flag is wired.
 */
describe('the flag images', () => {
  it('has a drawn flag for every origin in the shipped catalogue', () => {
    const origins = new Set<string>();
    for (const e of buildWineEntries()) {
      const d = e.details as { origin?: string };
      if (d.origin) origins.add(d.origin);
      const card = (e as { grapeCard?: GrapeCard }).grapeCard;
      if (card?.countryOfOrigin) origins.add(card.countryOfOrigin);
    }
    const flagless = [...origins].filter(o => o !== 'Unknown' && !getFlagImage(o));
    expect(flagless, 'origins with no drawn flag -- wire them in flagImages.ts').toEqual([]);
    expect(origins.size).toBeGreaterThan(20);
  });

  it('gives the 0.6.38 backfill their own flags, not the fallback', () => {
    for (const country of ['Mexico', 'Slovenia', 'United Kingdom', 'Bulgaria', 'Lebanon']) {
      expect(getFlagImage(country), country).toBeTruthy();
    }
  });

  it('never hands New Mexico the Mexican flag', () => {
    const state = getFlagImage('New Mexico');
    expect(state).toBeTruthy();
    expect(state).not.toBe(getFlagImage('Mexico'));
    // And the looser state-first switch still answers the same way.
    expect(getFlagImage('New Mexico', { preferUsState: true })).toBe(state);
  });
});
