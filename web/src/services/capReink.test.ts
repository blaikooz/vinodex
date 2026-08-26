import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fitCap, reinkPixels } from './capReink';
import { footerCap } from './theme';

/**
 * The runtime re-ink held equivalent to the baked caps (v0.5.0).
 *
 * The algorithm now exists in three languages — Swift (`ChassisCapArt`),
 * Python (`bake-footer-caps.py`) and TypeScript (`capReink.ts`) — and the
 * scoping report's D2 named exactly this as the mitigation for that
 * duplication: *"pin it with a test that renders one known cap ... so drift
 * is loud."* So: the TS port re-inks the source sprite with a stock skin's
 * own inks, is box-downsampled to the bake's 192px, and is compared against
 * the committed baked PNG within tolerance. A broken clause is two orders of
 * magnitude outside the tolerance — CLASSIC's back cap is an authored
 * `#292524`, i.e. **below `litFloor` with the glyph inversion active**, so a
 * port that lost either clause renders a pastel warm grey with an invisible
 * chevron and fails loudly.
 *
 * The tolerance exists because the two pipelines legitimately differ
 * downstream of the maths: the bake resizes with LANCZOS and quantises to a
 * 64-colour palette; this test resizes with a plain box filter and does not
 * quantise. Those account for single-digit mean error; they cannot account
 * for a missing clause.
 *
 * The PNG decoder below is deliberately minimal and dependency-free (Node's
 * own zlib): 8-bit, non-interlaced, colour types 0/2/3/6 — which is what the
 * four source sprites (RGBA) and the baked caps (palette+tRNS) are.
 */

const WEB_ROOT = path.resolve(__dirname, '../..');

interface Decoded { w: number; h: number; rgba: Uint8ClampedArray }

function decodePng(buf: Buffer): Decoded {
  const SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  for (let i = 0; i < 8; i += 1) {
    if (buf[i] !== SIG[i]) throw new Error('not a PNG');
  }
  let w = 0;
  let h = 0;
  let bitDepth = 0;
  let colorType = 0;
  let palette: Buffer | null = null;
  let trns: Buffer | null = null;
  const idat: Buffer[] = [];
  let off = 8;
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString('ascii', off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') {
      w = data.readUInt32BE(0);
      h = data.readUInt32BE(4);
      bitDepth = data[8]!;
      colorType = data[9]!;
      if (data[12] !== 0) throw new Error('interlaced PNG not supported');
      if (bitDepth !== 8) throw new Error(`bit depth ${bitDepth} not supported`);
    } else if (type === 'PLTE') palette = Buffer.from(data);
    else if (type === 'tRNS') trns = Buffer.from(data);
    else if (type === 'IDAT') idat.push(Buffer.from(data));
    else if (type === 'IEND') break;
    off += 12 + len;
  }
  const bppByType: Record<number, number> = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };
  const bpp = bppByType[colorType];
  if (!bpp) throw new Error(`colour type ${colorType} not supported`);
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = w * bpp;
  const out = new Uint8Array(h * stride);
  const paeth = (a: number, b: number, c: number): number => {
    const p = a + b - c;
    const pa = Math.abs(p - a);
    const pb = Math.abs(p - b);
    const pc = Math.abs(p - c);
    if (pa <= pb && pa <= pc) return a;
    if (pb <= pc) return b;
    return c;
  };
  for (let y = 0; y < h; y += 1) {
    const filter = raw[y * (stride + 1)]!;
    const rowIn = y * (stride + 1) + 1;
    const rowOut = y * stride;
    for (let x = 0; x < stride; x += 1) {
      const rawByte = raw[rowIn + x]!;
      const left = x >= bpp ? out[rowOut + x - bpp]! : 0;
      const up = y > 0 ? out[rowOut - stride + x]! : 0;
      const upLeft = y > 0 && x >= bpp ? out[rowOut - stride + x - bpp]! : 0;
      let value: number;
      switch (filter) {
        case 0: value = rawByte; break;
        case 1: value = rawByte + left; break;
        case 2: value = rawByte + up; break;
        case 3: value = rawByte + ((left + up) >> 1); break;
        case 4: value = rawByte + paeth(left, up, upLeft); break;
        default: throw new Error(`filter ${filter} not supported`);
      }
      out[rowOut + x] = value & 0xff;
    }
  }
  const rgba = new Uint8ClampedArray(w * h * 4);
  for (let p = 0; p < w * h; p += 1) {
    const i = p * 4;
    if (colorType === 6) {
      rgba[i] = out[p * 4]!;
      rgba[i + 1] = out[p * 4 + 1]!;
      rgba[i + 2] = out[p * 4 + 2]!;
      rgba[i + 3] = out[p * 4 + 3]!;
    } else if (colorType === 2) {
      rgba[i] = out[p * 3]!;
      rgba[i + 1] = out[p * 3 + 1]!;
      rgba[i + 2] = out[p * 3 + 2]!;
      rgba[i + 3] = 255;
    } else if (colorType === 3) {
      const idx = out[p]!;
      rgba[i] = palette![idx * 3]!;
      rgba[i + 1] = palette![idx * 3 + 1]!;
      rgba[i + 2] = palette![idx * 3 + 2]!;
      rgba[i + 3] = trns && idx < trns.length ? trns[idx]! : 255;
    } else {
      rgba[i] = rgba[i + 1] = rgba[i + 2] = out[p]!;
      rgba[i + 3] = 255;
    }
  }
  return { w, h, rgba };
}

/** Plain area-average resize on straight-alpha RGBA. */
function boxResize(src: Uint8ClampedArray, w: number, h: number, ow: number, oh: number): Uint8ClampedArray {
  const out = new Uint8ClampedArray(ow * oh * 4);
  for (let oy = 0; oy < oh; oy += 1) {
    const y0 = (oy * h) / oh;
    const y1 = ((oy + 1) * h) / oh;
    for (let ox = 0; ox < ow; ox += 1) {
      const x0 = (ox * w) / ow;
      const x1 = ((ox + 1) * w) / ow;
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      let area = 0;
      for (let sy = Math.floor(y0); sy < Math.ceil(y1); sy += 1) {
        const wy = Math.min(sy + 1, y1) - Math.max(sy, y0);
        for (let sx = Math.floor(x0); sx < Math.ceil(x1); sx += 1) {
          const wx = Math.min(sx + 1, x1) - Math.max(sx, x0);
          const weight = wx * wy;
          const i = (sy * w + sx) * 4;
          r += src[i]! * weight;
          g += src[i + 1]! * weight;
          b += src[i + 2]! * weight;
          a += src[i + 3]! * weight;
          area += weight;
        }
      }
      const o = (oy * ow + ox) * 4;
      out[o] = Math.round(r / area);
      out[o + 1] = Math.round(g / area);
      out[o + 2] = Math.round(b / area);
      out[o + 3] = Math.round(a / area);
    }
  }
  return out;
}

const readPng = (rel: string): Decoded =>
  decodePng(fs.readFileSync(path.join(WEB_ROOT, 'public', rel)));

describe('capReink', () => {
  /**
   * The one known cap, chosen for what it exercises: CLASSIC's authored back
   * cap is `#292524` — a value below `litFloor`, so the face multiplies down
   * AND the glyph inverts to print. The two dark-cap clauses, both live.
   */
  it('re-inks CLASSIC/back equivalent to the baked cap, within tolerance', () => {
    const src = readPng('art/footer/footer-back.png');
    const baked = readPng('art/caps/CLASSIC-back.png');
    const cap = footerCap('CLASSIC', 'back');
    expect(cap.top).toBe('#292524'); // the fixture's whole point — see above

    const fitted = fitCap(src.rgba, src.w, src.h);
    const inked = reinkPixels(src.rgba, src.w, src.h, fitted, cap.top, cap.glyph);
    const ours = boxResize(inked, src.w, src.h, baked.w, baked.h);

    let opaqueBoth = 0;
    let sumDiff = 0;
    let bad = 0;
    let silhouetteDisagree = 0;
    const n = baked.w * baked.h;
    for (let p = 0; p < n; p += 1) {
      const i = p * 4;
      const aBaked = baked.rgba[i + 3]!;
      const aOurs = ours[i + 3]!;
      if ((aBaked >= 128) !== (aOurs >= 128)) silhouetteDisagree += 1;
      if (aBaked < 250 || aOurs < 250) continue;
      opaqueBoth += 1;
      const d = Math.max(
        Math.abs(baked.rgba[i]! - ours[i]!),
        Math.abs(baked.rgba[i + 1]! - ours[i + 1]!),
        Math.abs(baked.rgba[i + 2]! - ours[i + 2]!),
      );
      sumDiff += d;
      if (d > 60) bad += 1;
    }

    // The part covers a meaningful share of the frame, or the comparison is
    // vacuous.
    expect(opaqueBoth).toBeGreaterThan(n * 0.4);
    // Silhouettes agree almost everywhere (resampler edge pixels differ).
    expect(silhouetteDisagree / n).toBeLessThan(0.015);
    // Mean worst-channel error: single digits is the two resamplers plus the
    // palette quantisation; a missing clause is >60 across the whole face.
    expect(sumDiff / opaqueBoth).toBeLessThan(10);
    // And no more than a sliver of pixels (glyph edges, knurl) may disagree
    // hard.
    expect(bad / opaqueBoth).toBeLessThan(0.02);
  });

  it('re-inks a bright livery equivalent too (the litFloor==1 path)', () => {
    const src = readPng('art/footer/footer-home.png');
    const baked = readPng('art/caps/VINHO_VERDE-home.png');
    const cap = footerCap('VINHO_VERDE', 'home');

    const fitted = fitCap(src.rgba, src.w, src.h);
    const inked = reinkPixels(src.rgba, src.w, src.h, fitted, cap.top, cap.glyph);
    const ours = boxResize(inked, src.w, src.h, baked.w, baked.h);

    let opaqueBoth = 0;
    let sumDiff = 0;
    const n = baked.w * baked.h;
    for (let p = 0; p < n; p += 1) {
      const i = p * 4;
      if (baked.rgba[i + 3]! < 250 || ours[i + 3]! < 250) continue;
      opaqueBoth += 1;
      sumDiff += Math.max(
        Math.abs(baked.rgba[i]! - ours[i]!),
        Math.abs(baked.rgba[i + 1]! - ours[i + 1]!),
        Math.abs(baked.rgba[i + 2]! - ours[i + 2]!),
      );
    }
    expect(opaqueBoth).toBeGreaterThan(n * 0.4);
    expect(sumDiff / opaqueBoth).toBeLessThan(10);
  });
});
