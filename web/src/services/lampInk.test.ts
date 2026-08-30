import { describe, expect, it } from 'vitest';
import { SKIN_LIGHTS, lampInk } from './theme';

const lum = (hex: string): number => {
  const n = parseInt(hex.slice(1), 16);
  const lin = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
};
const contrast = (a: string, b: string): number => {
  const la = lum(a);
  const lb = lum(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
};

/** The legend reads on every lamp of every skin (v0.6.36, WCAG AA). */
describe('lampInk', () => {
  it('reaches 4.5:1 against the fill for all 66 lamps', () => {
    for (const [skin, lights] of Object.entries(SKIN_LIGHTS)) {
      for (const [i, [fill, edge]] of lights.lamps.entries()) {
        expect(contrast(lampInk(edge, fill), fill), `${skin} lamp ${i + 1}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it('keeps the classic dark derivation where it already read', () => {
    // CLASSIC lamp 2: #facc15 fill, #ca8a04 edge -- edge x 0.55 passes, so
    // the ink is byte-for-byte what it was before the search existed.
    expect(lampInk('#ca8a04', '#facc15')).toBe('#6f4c02');
  });

  it('goes pale rather than darker on a lamp with nowhere darker to go', () => {
    const ink = lampInk('#3D1200', '#8A2E00');
    expect(contrast(ink, '#8A2E00')).toBeGreaterThanOrEqual(4.5);
    expect(lum(ink)).toBeGreaterThan(lum('#8A2E00'));
  });

  it('still refuses to invent a colour from a malformed edge', () => {
    expect(lampInk('rgba(1,2,3,0.5)', '#8A2E00')).toBe('rgba(1,2,3,0.5)');
  });
});
