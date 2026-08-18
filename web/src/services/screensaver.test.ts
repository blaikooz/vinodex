import { describe, expect, it } from 'vitest';
import {
  BOUNCE_VELOCITY,
  CORNER_START,
  bouncePosition,
  distanceAt,
  fold,
  randomStart,
  screensaverStart,
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
});
