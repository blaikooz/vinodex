import { describe, expect, it } from 'vitest';
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { MARQUEE_ART } from './marqueeArt';

/**
 * The marquee map and the mirrored directory, held to each other in both
 * directions.
 *
 * A title-keyed map has two silent failure modes and this closes both: a
 * stem with no file draws a broken image (the console gate catches it only
 * on a route somebody visits), and a mirrored panel with no key is art that
 * shipped and reaches no screen — the "drawn, imported, and reaching no
 * screen yet" fault iOS keeps its own named list for.
 */
const files = new Set(
  readdirSync(resolve(__dirname, '../../public/art/marquee'))
    .filter(f => f.endsWith('.png'))
    .map(f => f.replace(/\.png$/, '')),
);

describe('marquee art', () => {
  it('keeps ACCESS as the route id while SHOP wears its canonical panel', () => {
    expect(MARQUEE_ART.ACCESS).toBe('marquee-shop');
    expect(MARQUEE_ART.SHOP).toBe('marquee-shop');
  });

  it('every mapped stem has a file', () => {
    for (const [title, stem] of Object.entries(MARQUEE_ART)) {
      expect(files.has(stem), `${title} -> ${stem}.png is missing`).toBe(true);
    }
  });

  /**
   * Panels mirrored ahead of the screen that will use them — named, never
   * inferred, on iOS's own `drawnAheadOutlines` discipline: a panel here
   * that gains a screen has to come out, and a panel missing from disk means
   * art was deleted. Without the list, "the screen does not exist yet" and
   * "somebody forgot to wire it" are the same observation.
   */
  const DRAWN_AHEAD = new Set([
    // marquee-deviceworkshop left this list when the workshop screen wired it
    // up (v0.5.0).
    'marquee-labelscanner', // v6#27, deferred with reason (no web OCR dep)
  ]);

  it('every mirrored panel is reachable from some title', () => {
    const used = new Set(Object.values(MARQUEE_ART));
    const unreachable = [...files].filter(f => !used.has(f) && !DRAWN_AHEAD.has(f)).sort();
    // Named rather than counted, so adding a panel without a key fails with
    // the panel's name in the message.
    expect(unreachable, `mirrored but unreachable: ${unreachable.join(', ')}`).toEqual([]);
  });

  it('nothing drawn-ahead has quietly gained a screen', () => {
    const used = new Set(Object.values(MARQUEE_ART));
    for (const stem of DRAWN_AHEAD) {
      expect(used.has(stem), `${stem} is wired now - take it off DRAWN_AHEAD`).toBe(false);
      expect(files.has(stem), `${stem} is on DRAWN_AHEAD but its art is gone`).toBe(true);
    }
  });
});
