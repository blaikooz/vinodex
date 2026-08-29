import { describe, expect, it } from 'vitest';
import {
  BOUNCE_VELOCITY,
  CORNER_START,
  SCREENSAVER_PALETTE,
  bounceCount,
  bouncePosition,
  distanceAt,
  fold,
  randomStart,
  screensaverStart,
  tintForBounce,
} from './screensaver';

/**
 * Ported from the `ScreensaverBounce` cases of
 * `vinodex-ios/Tests/VinodexCoreTests/` — the closed form is the whole reason
 * these are writable at all.
 */
describe('screensaver bounce', () => {
  const box = { width: 300, height: 200 };
  const mark = { width: 60, height: 40 };

  it('the mark never leaves its box, even at t = 10,000 seconds', () => {
    for (const t of [0, 1, 7.3, 100, 999.5, 10_000]) {
      const p = bouncePosition(t, box, mark, CORNER_START);
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(box.width - mark.width);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(box.height - mark.height);
    }
  });

  it('a fold at the top of the range puts the far edge exactly on the wall', () => {
    expect(fold(240, 240)).toBe(240);
    expect(fold(241, 240)).toBe(239);
    expect(fold(480, 240)).toBe(0);
  });

  it('a box smaller than the mark has no travel and says so', () => {
    expect(fold(50, 0)).toBe(0);
    expect(fold(50, -10)).toBe(0);
    const p = bouncePosition(5, { width: 40, height: 30 }, mark);
    expect(p).toEqual({ x: 0, y: 0 });
  });

  it('the axes move at different, coprime-ish speeds', () => {
    expect(BOUNCE_VELOCITY.x).not.toBe(BOUNCE_VELOCITY.y);
  });

  it('a phase selects a point on the cycle and a heading', () => {
    const span = 240;
    // Phase 0.5 is half a cycle in — the fold's peak, i.e. the far wall —
    // and from there the very next instant travels back the way it came.
    expect(fold(distanceAt(0, BOUNCE_VELOCITY.x, span, 0.5), span)).toBe(span);
    const outbound = fold(distanceAt(0.1, BOUNCE_VELOCITY.x, span, 0), span);
    const inbound = fold(distanceAt(0.1, BOUNCE_VELOCITY.x, span, 0.5), span);
    expect(outbound).toBeCloseTo(BOUNCE_VELOCITY.x * 0.1);
    expect(inbound).toBeCloseTo(span - BOUNCE_VELOCITY.x * 0.1);
  });

  it('phases wrap rather than clamp, and non-finite input degrades to zero', () => {
    expect(screensaverStart(1.25, -0.25)).toEqual({ x: 0.25, y: 0.75 });
    expect(screensaverStart(Number.NaN, Number.POSITIVE_INFINITY)).toEqual({ x: 0, y: 0 });
    const s = randomStart(() => 0.4);
    expect(s).toEqual({ x: 0.4, y: 0.4 });
  });

  it('the position is a pure function of time — same t, same point', () => {
    const a = bouncePosition(123.456, box, mark, { x: 0.3, y: 0.7 });
    const b = bouncePosition(123.456, box, mark, { x: 0.3, y: 0.7 });
    expect(a).toEqual(b);
  });

  /**
   * The colour half (v0.6.14) — `ScreensaverBounceTests`' bounce cases,
   * ported. The count and the position read the same distance, so the hue
   * changes exactly at the wall and never anywhere else.
   */
  describe('bounces and the palette', () => {
    it('starts on zero and counts one wall per half-cycle on each axis', () => {
      expect(bounceCount(0, box, mark)).toBe(0);
      // travelX = 240 at 47/s -> first wall at ~5.106 s; travelY = 160 at
      // 31/s -> first wall at ~5.161 s.
      expect(bounceCount(5.0, box, mark)).toBe(0);
      expect(bounceCount(5.12, box, mark)).toBe(1);
      expect(bounceCount(5.2, box, mark)).toBe(2);
    });

    it('counts a wall exactly when the position folds', () => {
      // Walk time finely: whenever the count rises, the mark must be within
      // one sample's travel of a wall on some axis -- the colour changes at
      // the wall and nowhere else.
      const dt = 0.01;
      let prev = bounceCount(0, box, mark);
      for (let i = 1; i <= 4000; i += 1) {
        const t = i * dt;
        const n = bounceCount(t, box, mark);
        if (n === prev) continue;
        const p = bouncePosition(t, box, mark);
        const nearX = Math.min(p.x, box.width - mark.width - p.x) <= BOUNCE_VELOCITY.x * dt;
        const nearY = Math.min(p.y, box.height - mark.height - p.y) <= BOUNCE_VELOCITY.y * dt;
        expect(nearX || nearY, `the colour changed at t=${t} away from any wall`).toBe(true);
        expect(n - prev, 'two walls in one sample').toBeLessThanOrEqual(2);
        prev = n;
      }
      expect(prev).toBeGreaterThan(10);
    });

    it('a mid-flight start still opens on the first colour', () => {
      // A phase of 0.9 has notionally passed a wall already; those are
      // subtracted, so the run begins at 0 and reaches 1 at its own first
      // real bounce.
      const start = { x: 0.9, y: 0.9 };
      expect(bounceCount(0, box, mark, start)).toBe(0);
      expect(bounceCount(0.001, box, mark, start)).toBe(0);
      // x: 0.9 * 480 = 432 -> next wall at 480, i.e. 48/47 s ~ 1.02 s.
      expect(bounceCount(1.1, box, mark, start)).toBeGreaterThanOrEqual(1);
    });

    it('a box with no travel never bounces', () => {
      expect(bounceCount(100, { width: 40, height: 30 }, mark)).toBe(0);
    });

    it("cycles iOS's six-colour palette, accent first", () => {
      expect(SCREENSAVER_PALETTE).toHaveLength(6);
      expect(SCREENSAVER_PALETTE[0]).toBe('var(--lcd-accent)');
      expect(tintForBounce(0)).toBe(SCREENSAVER_PALETTE[0]);
      expect(tintForBounce(1)).toBe('#ef4444');
      expect(tintForBounce(6)).toBe(SCREENSAVER_PALETTE[0]);
      expect(tintForBounce(7)).toBe('#ef4444');
    });
  });
});
