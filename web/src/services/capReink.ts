/**
 * The runtime footer-cap re-ink (v0.5.0) — the revisit trigger
 * `scripts/bake-footer-caps.py` wrote into its own header, pulled.
 *
 * ## The architecture, now that the Device Workshop exists
 *
 * The 22 stock skins keep their **baked** caps (`/art/caps/{SKIN}-{stem}.png`,
 * 88 files, zero JS, hash-pinned by `capsManifest.test.ts`) — that fast path
 * does not change. What the bake script could never cover is the workshop's
 * FOOTER BUTTONS axis: 13 `PartColor` values × 4 caps would be 1,144 more
 * baked files, which is the exact threshold its header names as "the trigger;
 * nothing smaller is". So a **custom** buttons part re-inks the four source
 * sprites (`/art/footer/footer-{stem}.png`, mirrored from iOS) at runtime, in
 * a canvas, and hands `DeviceFooter` a blob URL. Best of both: stock devices
 * never run a pixel of this, and a workshop device pays ~a frame once per
 * colour change, cached thereafter.
 *
 * ## Fidelity
 *
 * The pure half below is a line-for-line port of the bake script's
 * `fit_cap` / `reink` / `unpremultiply`, which is itself the port of
 * `ChassisCapArt.swift` — same constants (`litFloor` 0.55, `glyphValue` 0.60,
 * glyph reach 0.20 / 0.78, `edgeFeather` 1.5, outline clause ≤ 0.06), same
 * clauses (the outline keeps its own colour, a dark ink multiplies the face
 * down, the glyph inverts to print on a dark cap), and the same deliberate
 * omission: `lipBandTop` / `lipHex` are live Swift with no live caller since
 * iOS 0.8.98 and **must not be ported**. `capReink.test.ts` holds this port
 * equivalent to the baked output for a stock skin, within tolerance — the
 * drift gate the scoping report asked for, since the algorithm now exists in
 * three languages.
 *
 * Pure functions over typed arrays, deliberately: the maths runs anywhere
 * (the equivalence test runs it in Node against hand-decoded PNGs), and only
 * the thin loader at the bottom touches a canvas. Not a worker — `fitCap`
 * over a 254×256 sprite is milliseconds in JS (the Python port's seconds were
 * Python), it runs once per stem per session, and a worker would be a second
 * copy of the pipeline to keep honest.
 */

// Constants — ChassisCapArt.swift's, names kept so the three ports diff by eye.
const LIT_FLOOR = 0.55;
const GLYPH_VALUE = 0.60;
const GLYPH_INNER_REACH = 0.20;
const GLYPH_OUTER_LIMIT = 0.78;
const EDGE_FEATHER = 1.5;
const OUTLINE_CEILING = 0.06;

export type CapStem = 'back' | 'home' | 'user' | 'settings';

export interface FittedCap {
  /** 0–1 edge-feather ramp per pixel; 0 outside the moulded part. */
  coverage: Float64Array;
  /** 1 where the pixel belongs to the incised symbol. */
  isGlyph: Uint8Array;
}

/** Max channel over alpha, clamped — `ChassisCapLoader.value`. */
const valueOf = (rgba: Uint8ClampedArray, i: number): number => {
  const a = Math.max(rgba[i + 3]! / 255, 0.001);
  const mx = Math.max(rgba[i]!, rgba[i + 1]!, rgba[i + 2]!) / 255;
  return Math.min(mx / a, 1.0);
};

/** Measure one sprite once: coverage ramp and glyph mask, both ink-free. */
export function fitCap(rgba: Uint8ClampedArray, w: number, h: number): FittedCap {
  const n = w * h;
  const opaque = new Uint8Array(n);
  for (let p = 0; p < n; p += 1) opaque[p] = rgba[p * 4 + 3]! > 0 ? 1 : 0;

  // The moulded part: the largest four-connected run of opaque pixels — the
  // whole silhouette rule since iOS 0.8.6. The geodesic `outlineReach` trim
  // 0.8.7 added and 0.8.91 retired is not here and must not come back.
  const label = new Int32Array(n).fill(-1);
  const stack: number[] = [];
  let bestLabel = -1;
  let bestSize = 0;
  let nextLabel = 0;
  for (let seed = 0; seed < n; seed += 1) {
    if (!opaque[seed] || label[seed] !== -1) continue;
    let size = 0;
    stack.push(seed);
    label[seed] = nextLabel;
    while (stack.length > 0) {
      const p = stack.pop()!;
      size += 1;
      const y = (p / w) | 0;
      const x = p - y * w;
      if (y > 0 && opaque[p - w] && label[p - w] === -1) { label[p - w] = nextLabel; stack.push(p - w); }
      if (y < h - 1 && opaque[p + w] && label[p + w] === -1) { label[p + w] = nextLabel; stack.push(p + w); }
      if (x > 0 && opaque[p - 1] && label[p - 1] === -1) { label[p - 1] = nextLabel; stack.push(p - 1); }
      if (x < w - 1 && opaque[p + 1] && label[p + 1] === -1) { label[p + 1] = nextLabel; stack.push(p + 1); }
    }
    if (size > bestSize) { bestSize = size; bestLabel = nextLabel; }
    nextLabel += 1;
  }
  const part = new Uint8Array(n);
  for (let p = 0; p < n; p += 1) part[p] = label[p] === bestLabel ? 1 : 0;

  // Coverage: BFS distance from the outside, ramped over `edgeFeather`. The
  // sprites have strictly binary alpha, so without this every edge is an
  // aliased staircase all the way to the screen.
  const dist = new Int32Array(n).fill(0x7fffffff);
  const queue = new Int32Array(n);
  let qHead = 0;
  let qTail = 0;
  for (let p = 0; p < n; p += 1) {
    if (!part[p]) continue;
    const y = (p / w) | 0;
    const x = p - y * w;
    const interior =
      y > 0 && part[p - w] && y < h - 1 && part[p + w]
      && x > 0 && part[p - 1] && x < w - 1 && part[p + 1];
    if (!interior) { dist[p] = 1; queue[qTail++] = p; }
  }
  while (qHead < qTail) {
    const p = queue[qHead++]!;
    const nxt = dist[p]! + 1;
    const y = (p / w) | 0;
    const x = p - y * w;
    if (y > 0 && part[p - w] && dist[p - w]! > nxt) { dist[p - w] = nxt; queue[qTail++] = p - w; }
    if (y < h - 1 && part[p + w] && dist[p + w]! > nxt) { dist[p + w] = nxt; queue[qTail++] = p + w; }
    if (x > 0 && part[p - 1] && dist[p - 1]! > nxt) { dist[p - 1] = nxt; queue[qTail++] = p - 1; }
    if (x < w - 1 && part[p + 1] && dist[p + 1]! > nxt) { dist[p + 1] = nxt; queue[qTail++] = p + 1; }
  }
  const coverage = new Float64Array(n);
  for (let p = 0; p < n; p += 1) {
    if (part[p]) coverage[p] = Math.min(dist[p]! / EDGE_FEATHER, 1.0);
  }

  // Centroid + median outermost radius over 360 rays. A scale, not a boundary.
  let cy = 0;
  let cx = 0;
  let count = 0;
  for (let p = 0; p < n; p += 1) {
    if (!part[p]) continue;
    cy += (p / w) | 0;
    cx += p - ((p / w) | 0) * w;
    count += 1;
  }
  cy /= Math.max(count, 1);
  cx /= Math.max(count, 1);
  const limit = Math.max(w, h);
  const radii: number[] = [];
  for (let i = 0; i < 360; i += 1) {
    const th = (i * 2 * Math.PI) / 360;
    const dx = Math.cos(th);
    const dy = Math.sin(th);
    let last = 0;
    for (let r = 0; r < limit; r += 0.5) {
      const x = Math.round(cx + r * dx);
      const y = Math.round(cy + r * dy);
      if (x >= 0 && x < w && y >= 0 && y < h && part[y * w + x]) last = r;
    }
    radii.push(last);
  }
  radii.sort((a, b) => a - b);
  const radius = Math.max(radii[180]!, 1);

  // The incised symbol: dark regions that *start* inside `glyphInnerReach`
  // and stay inside `glyphOuterLimit`. Shape, not threshold — the rim, bevel
  // and knurl are annuli that never reach the centre.
  const dark = new Uint8Array(n);
  for (let p = 0; p < n; p += 1) {
    if (!part[p]) continue;
    const v = valueOf(rgba, p * 4);
    if (v > OUTLINE_CEILING && v < GLYPH_VALUE) dark[p] = 1;
  }
  const isGlyph = new Uint8Array(n);
  const visited = new Uint8Array(n);
  const region: number[] = [];
  for (let seed = 0; seed < n; seed += 1) {
    if (!dark[seed] || visited[seed]) continue;
    region.length = 0;
    stack.push(seed);
    visited[seed] = 1;
    let minR = Infinity;
    let maxR = 0;
    while (stack.length > 0) {
      const p = stack.pop()!;
      region.push(p);
      const y = (p / w) | 0;
      const x = p - y * w;
      const d = Math.hypot(x - cx, y - cy) / radius;
      if (d < minR) minR = d;
      if (d > maxR) maxR = d;
      if (y > 0 && dark[p - w] && !visited[p - w]) { visited[p - w] = 1; stack.push(p - w); }
      if (y < h - 1 && dark[p + w] && !visited[p + w]) { visited[p + w] = 1; stack.push(p + w); }
      if (x > 0 && dark[p - 1] && !visited[p - 1]) { visited[p - 1] = 1; stack.push(p - 1); }
      if (x < w - 1 && dark[p + 1] && !visited[p + 1]) { visited[p + 1] = 1; stack.push(p + 1); }
    }
    if (minR < GLYPH_INNER_REACH && maxR < GLYPH_OUTER_LIMIT) {
      for (const p of region) isGlyph[p] = 1;
    }
  }

  return { coverage, isGlyph };
}

// --- Colour space, matching the bake script's helpers exactly. -------------

type Hsv = [h: number, s: number, v: number];

/** `#rrggbb` or `rgba(r,g,b,a)` → (h, s, v); anything else → neutral white. */
function hsvOfCss(colour: string): Hsv {
  let r: number;
  let g: number;
  let b: number;
  const hex = /^#([0-9a-fA-F]{6})$/.exec(colour.trim());
  if (hex) {
    const bits = parseInt(hex[1]!, 16);
    r = (bits >> 16) & 255;
    g = (bits >> 8) & 255;
    b = bits & 255;
  } else {
    const fn = /^rgba?\(([^)]*)\)$/.exec(colour.trim());
    if (!fn) return [0, 0, 1];
    const parts = fn[1]!.split(',').map(p => parseFloat(p.trim()));
    r = Math.trunc(parts[0] ?? 0);
    g = Math.trunc(parts[1] ?? 0);
    b = Math.trunc(parts[2] ?? 0);
  }
  const mx = Math.max(r, g, b) / 255;
  const mn = Math.min(r, g, b) / 255;
  const d = mx - mn;
  let hue = 0;
  if (d !== 0) {
    if (mx === r / 255) hue = ((((g - b) / 255 / d) % 6) + 6) % 6 / 6;
    else if (mx === g / 255) hue = ((b - r) / 255 / d + 2) / 6;
    else hue = ((r - g) / 255 / d + 4) / 6;
  }
  return [hue, mx === 0 ? 0 : d / mx, mx];
}

const hsvToRgb = (hh: number, s: number, v: number): [number, number, number] => {
  const c = v * s;
  const x = c * (1 - Math.abs(((hh * 6) % 2) - 1));
  const m = v - c;
  const sector = Math.trunc(hh * 6) % 6;
  const table: [number, number, number][] = [
    [c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x],
  ];
  const [r, g, b] = table[sector]!;
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
};

/**
 * Keep each pixel's value, take the target's hue and saturation — with the
 * outline clause, `litFloor` and the glyph inversion, per the bake script's
 * own annotations. Returns **straight-alpha** RGBA (the premultiply the
 * Swift context implies is composed and then undone, exactly as the bake's
 * `unpremultiply` does before its pixels become a PNG).
 */
export function reinkPixels(
  rgba: Uint8ClampedArray,
  w: number,
  h: number,
  fitted: FittedCap,
  inkCss: string,
  glyphCss: string,
): Uint8ClampedArray {
  const n = w * h;
  const body = hsvOfCss(inkCss);
  const ink = glyphCss ? hsvOfCss(glyphCss) : body;
  const bodyScale = body[2] < LIT_FLOOR ? body[2] : 1.0;
  const invert = body[2] < LIT_FLOOR;

  // The bake composes premultiplied (the Swift context's model) and then
  // `unpremultiply`s before its pixels become a PNG. The round trip nets out
  // to: the derived colour itself, with alpha carrying the coverage — so this
  // port writes that straight form directly, which is what a canvas's
  // `putImageData` wants and stays within one count of the bake's roundings
  // (the equivalence test's tolerance absorbs it).
  const out = new Uint8ClampedArray(n * 4);
  for (let p = 0; p < n; p += 1) {
    const i = p * 4;
    const a = rgba[i + 3]!;
    const cov = fitted.coverage[p]!;
    if (a <= 0 || cov <= 0) continue;
    const outA = Math.round(a * cov);
    const v = valueOf(rgba, i);

    if (v <= OUTLINE_CEILING) {
      // The outline clause: near-black is structure and keeps its own
      // colour; only its alpha takes the coverage ramp.
      out[i] = rgba[i]!;
      out[i + 1] = rgba[i + 1]!;
      out[i + 2] = rgba[i + 2]!;
      out[i + 3] = outA;
      continue;
    }

    const isGlyph = fitted.isGlyph[p] === 1;
    let outV: number;
    let target: Hsv;
    if (isGlyph) {
      // On a dark cap the incised symbol becomes print — a groove cannot be
      // darker than near-black.
      outV = invert ? Math.min(Math.max(ink[2] * (1.05 - v), 0), 1) : v;
      target = ink;
    } else {
      outV = v * bodyScale;
      target = body;
    }
    const [r, g, b] = hsvToRgb(target[0], target[1], outV);
    out[i] = Math.round(r);
    out[i + 1] = Math.round(g);
    out[i + 2] = Math.round(b);
    out[i + 3] = outA;
  }
  return out;
}

// --- The canvas seam. ------------------------------------------------------

interface SpriteData { rgba: Uint8ClampedArray; w: number; h: number; fitted: FittedCap }

const spriteCache = new Map<CapStem, Promise<SpriteData>>();
const urlCache = new Map<string, Promise<string | null>>();

async function loadSprite(stem: CapStem): Promise<SpriteData> {
  const response = await fetch(`/art/footer/footer-${stem}.png`);
  if (!response.ok) throw new Error(`footer sprite ${stem}: HTTP ${response.status}`);
  const bitmap = await createImageBitmap(await response.blob());
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(bitmap, 0, 0);
  const data = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
  return {
    rgba: data.data,
    w: bitmap.width,
    h: bitmap.height,
    fitted: fitCap(data.data, bitmap.width, bitmap.height),
  };
}

/**
 * A blob URL for one custom-inked cap, cached per (stem, ink, glyph) — the
 * runtime twin of one baked `art/caps` file. `null` on any failure, and null
 * is a real answer: `DeviceFooter`'s fallback circle is already painted in
 * the same part colours through `--cap-*`, so a failed re-ink degrades to
 * the S1 gradient rather than to a hole.
 */
export function customCapUrl(stem: CapStem, inkCss: string, glyphCss: string): Promise<string | null> {
  const key = `${stem}|${inkCss}|${glyphCss}`;
  const hit = urlCache.get(key);
  if (hit) return hit;
  const made = (async (): Promise<string | null> => {
    try {
      let sprite = spriteCache.get(stem);
      if (!sprite) {
        sprite = loadSprite(stem);
        spriteCache.set(stem, sprite);
      }
      const { rgba, w, h, fitted } = await sprite;
      const out = reinkPixels(rgba, w, h, fitted, inkCss, glyphCss);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.putImageData(new ImageData(out, w, h), 0, 0);
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
      return blob ? URL.createObjectURL(blob) : null;
    } catch {
      return null;
    }
  })();
  urlCache.set(key, made);
  return made;
}
