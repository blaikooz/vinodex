/**
 * The Device Workshop's data model (v0.5.0, v6#35) — `PartColor`,
 * `GrilleShape`, `DeviceAxis` and `DeviceBuild`, ported from
 * `vinodex-ios/Sources/VinodexUI/DeviceParts.swift` and
 * `vinodex-ios/Sources/VinodexCore/DeviceBuild.swift`.
 *
 * **Same idea and data model as iOS, web's own presentation** (the §0 rule).
 * The persisted vocabulary is identical on both platforms — the thirteen
 * `PartColor` raw values, the five `GrilleShape` raw values, the ten
 * `devicePart*` storage keys and the "empty means as-the-device-ships"
 * invariant — so a build described on one platform is intelligible on the
 * other. What each string *paints* is this module's derivations, which follow
 * iOS's own: one authored base hex per colour, everything else mixed from it
 * with the same plain 0–1 sRGB interpolation `DexRGB.mixed` uses, calibrated
 * against CLASSIC's hand-authored parts.
 *
 * **One base hex per entry, everything else derived** — iOS's argument
 * verbatim: thirteen colours across the axes is sixty-five hand-authored
 * ramps if each is written out, which is sixty-five chances for one stop to
 * be from the wrong colourway.
 */

import type { ChassisCap } from './theme';

// ---------------------------------------------------------------------------
// Colour arithmetic — DexRGB, in miniature.
// ---------------------------------------------------------------------------

type Rgb = [number, number, number];

const parseHex = (raw: string): Rgb => {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(raw.trim());
  // Mid grey on anything else, matching `DexRGB(hex:)` — a colour is never
  // worth a crash.
  if (!m) return [0.47, 0.44, 0.42];
  const n = parseInt(m[1]!, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

const toHex = (rgb: Rgb): string =>
  '#' + rgb
    .map(c => Math.round(Math.min(Math.max(c, 0), 1) * 255).toString(16).padStart(2, '0'))
    .join('');

/** `DexRGB.mixed(with:amount:)`: plain componentwise interpolation. */
const mix = (a: Rgb, b: Rgb, t: number): Rgb => {
  const k = Math.min(Math.max(t, 0), 1);
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
};

const WHITE: Rgb = [1, 1, 1];
const BLACK: Rgb = [0, 0, 0];

/** Rec. 709 relative luminance, as `DexRGB.luminance` computes it. */
const luminance = (rgb: Rgb): number => 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];

// ---------------------------------------------------------------------------
// PartColor
// ---------------------------------------------------------------------------

/** The thirteen raw values. Persisted — never rename. */
export type PartColorId =
  | 'CRIMSON' | 'CLARET' | 'ROSE' | 'AMBER' | 'STRAW' | 'ABSINTHE' | 'VERDANT'
  | 'GLACIER' | 'COBALT' | 'VIOLET' | 'SLATE' | 'IVORY' | 'ONYX';

export const PART_COLOR_IDS: PartColorId[] = [
  'CRIMSON', 'CLARET', 'ROSE', 'AMBER', 'STRAW', 'ABSINTHE', 'VERDANT',
  'GLACIER', 'COBALT', 'VIOLET', 'SLATE', 'IVORY', 'ONYX',
];

/** The one authored value per colour — `PartColor.baseHex`, hex for hex. */
export const PART_COLOR_BASE: Record<PartColorId, string> = {
  CRIMSON: '#D2384F',
  CLARET: '#8E2436',
  ROSE: '#F2A0B5',
  AMBER: '#F0A324',
  STRAW: '#EFD25C',
  ABSINTHE: '#A8E04A',
  VERDANT: '#3FBF6A',
  GLACIER: '#3FC8E0',
  COBALT: '#3B6FE0',
  VIOLET: '#9B6BF2',
  SLATE: '#8895A6',
  IVORY: '#EFE6D2',
  ONYX: '#33373F',
};

/** The display name — the accent lives here, not in the raw value. */
export const partColorName = (id: PartColorId): string => (id === 'ROSE' ? 'ROSÉ' : id);

const base = (id: PartColorId): Rgb => parseHex(PART_COLOR_BASE[id]);
const lighter = (id: PartColorId, amount: number): string => toHex(mix(base(id), WHITE, amount));
const darker = (id: PartColorId, amount: number): string => toHex(mix(base(id), BLACK, amount));

/**
 * Ink that reads on this colour — `PartColor.inkHex`. `> 0.55` rather than
 * `> 0.5`, matching `LcdMode.chromeInk`'s stated reason: white-on-mid reads
 * worse than black-on-mid at small faces, so the tie goes to dark ink. The
 * dark form is a very dark form of the colour itself rather than flat black.
 */
const inkHex = (id: PartColorId): string =>
  luminance(base(id)) > 0.55 ? darker(id, 0.80) : '#FFFFFF';

/** The six-stop lit ramp — Home's colours (`PartColor.accent`). */
export interface PartAccent {
  pale: string; light: string; bright: string; mid: string; edge: string; ink: string;
}

export function partAccent(id: PartColorId): PartAccent {
  // ONYX inverts (iOS 0.8.93, item 7): the standard derivation lightens
  // toward white, which on the one colour whose whole identity is "black"
  // produced a near-white Home disc wearing white ink. ORANGE WINE's authored
  // black ramp is the precedent. Scoped by name, not luminance — CLARET is
  // also dark and is asking to be deep red, not black.
  if (id === 'ONYX') {
    return {
      pale: lighter(id, 0.30),
      light: lighter(id, 0.12),
      bright: PART_COLOR_BASE[id],
      mid: darker(id, 0.40),
      edge: darker(id, 0.70),
      ink: '#FFFFFF',
    };
  }
  return {
    pale: lighter(id, 0.80),
    light: lighter(id, 0.56),
    bright: PART_COLOR_BASE[id],
    mid: darker(id, 0.20),
    edge: darker(id, 0.52),
    ink: inkHex(id),
  };
}

/** The moulded (unlit) cap — `PartColor.control`, calibrated against CLASSIC. */
export function partControl(id: PartColorId): ChassisCap {
  return {
    top: lighter(id, 0.10),
    bottom: darker(id, 0.70),
    edge: lighter(id, 0.48),
    glyph: inkHex(id),
  };
}

/**
 * Home restated as the moulded cap its ramp colours —
 * `ChassisControl(litRamp:)`: top = light, bottom = mid, edge = edge,
 * glyph = ink. "Lit is a colour, not a code path" (iOS 0.8.98).
 */
export function partHomeCap(id: PartColorId): ChassisCap {
  const a = partAccent(id);
  return { top: a.light, bottom: a.mid, edge: a.edge, glyph: a.ink };
}

/** The orb bead and its glow — `PartColor.orb` / `.orbGlow`. */
export const partOrb = (id: PartColorId): string => lighter(id, 0.32);
export const partOrbGlow = (id: PartColorId): string => PART_COLOR_BASE[id];

/**
 * A trio of lamps in this colour, light to deep — `PartColor.lampTrio`.
 * Border 45% toward black from the fill, ink another 45% from the border —
 * `ChassisSkin.statusLights`' own derivation, so a workshop trio and an
 * authored one are shaded by the same rule.
 */
export function partLampTrio(id: PartColorId): [fill: string, edge: string][] {
  const stops: Rgb[] = [mix(base(id), WHITE, 0.42), base(id), mix(base(id), BLACK, 0.38)];
  return stops.map(stop => {
    const border = mix(stop, BLACK, 0.45);
    return [toHex(stop), toHex(border)] as [string, string];
  });
}

/** The marquee's lit phosphor ground, grid and letter shadow. */
export const partMarqueeText = (id: PartColorId): string => PART_COLOR_BASE[id];
export const partMarqueeGrid = (id: PartColorId): string => lighter(id, 0.22);
export const partMarqueeShadow = (id: PartColorId): string => darker(id, 0.84);

/**
 * Whether this colour is legible as *text* on a pale or dark ground —
 * `PartColor.readsAsInk(onLightGround:)`, the one guard the font axis
 * genuinely needs: an unreadable device must not be reachable. Asymmetric
 * thresholds because white grounds are brighter than dark grounds are dark.
 */
export function readsAsInk(id: PartColorId, onLightGround: boolean): boolean {
  const v = luminance(base(id));
  return onLightGround ? v < 0.62 : v > 0.26;
}

// ---------------------------------------------------------------------------
// GrilleShape
// ---------------------------------------------------------------------------

/** The five raw values. SLATS is the default and is stored as absence. */
export type GrilleShapeId = 'SLATS' | 'BARS' | 'DOTS' | 'MESH' | 'NONE';
export const GRILLE_SHAPE_IDS: GrilleShapeId[] = ['SLATS', 'BARS', 'DOTS', 'MESH', 'NONE'];

// ---------------------------------------------------------------------------
// DeviceAxis + DeviceBuild
// ---------------------------------------------------------------------------

/** The ten axes, in workshop order. */
export type DeviceAxisId =
  | 'shell' | 'buttons' | 'orb' | 'headerLamps' | 'marquee' | 'marqueeLamps'
  | 'grilleColor' | 'grilleShape' | 'screen' | 'font';

export interface DeviceAxisMeta {
  id: DeviceAxisId;
  /**
   * The localStorage key — iOS's `UserDefaults` key, spelled identically.
   * `shell` and `screen` keep the keys the theme has always used; the eight
   * added keys share the `devicePart` prefix so a storage dump groups them.
   */
  storageKey: string;
  /** What the workshop calls this row. */
  title: string;
}

export const DEVICE_AXES: DeviceAxisMeta[] = [
  { id: 'shell', storageKey: 'chassisSkin', title: 'SHELL' },
  { id: 'buttons', storageKey: 'devicePartButtons', title: 'FOOTER BUTTONS' },
  { id: 'orb', storageKey: 'devicePartOrb', title: 'ORB' },
  { id: 'headerLamps', storageKey: 'devicePartHeaderLamps', title: 'HEADER LIGHTS' },
  { id: 'marquee', storageKey: 'devicePartMarquee', title: 'MARQUEE' },
  { id: 'marqueeLamps', storageKey: 'devicePartMarqueeLamps', title: 'MARQUEE LIGHTS' },
  { id: 'grilleColor', storageKey: 'devicePartGrille', title: 'GRILLE' },
  { id: 'grilleShape', storageKey: 'devicePartGrilleShape', title: 'GRILLE PATTERN' },
  { id: 'screen', storageKey: 'lcdMode', title: 'SCREEN' },
  { id: 'font', storageKey: 'devicePartFont', title: 'FONT' },
];

export const axisMeta = (id: DeviceAxisId): DeviceAxisMeta =>
  DEVICE_AXES.find(a => a.id === id)!;

/**
 * Every part selection that makes up one device. Untyped strings, exactly as
 * iOS's Core carries them: **empty means "as the device ships"**, and an
 * empty axis is stored as *absence* — the invariant that makes a stock device
 * byte-identical to a device that never met the workshop.
 */
export type DeviceBuild = Record<DeviceAxisId, string>;

export const STOCK_BUILD: DeviceBuild = {
  shell: '', buttons: '', orb: '', headerLamps: '', marquee: '', marqueeLamps: '',
  grilleColor: '', grilleShape: '', screen: '', font: '',
};

export const isStock = (b: DeviceBuild): boolean =>
  DEVICE_AXES.every(a => (b[a.id] ?? '') === '');

/** The "3 OF 10 PARTS" readout. */
export const chosenCount = (b: DeviceBuild): number =>
  DEVICE_AXES.filter(a => (b[a.id] ?? '') !== '').length;

export const buildsEqual = (a: DeviceBuild, b: DeviceBuild): boolean =>
  DEVICE_AXES.every(ax => (a[ax.id] ?? '') === (b[ax.id] ?? ''));

/**
 * A stored blob decoded defensively — every field `decodeIfPresent`-style,
 * defaulting to `''`, which is iOS's hand-written decoder and its reason: a
 * synthesised strict decode would silently delete every saved build the
 * first time an axis is added.
 */
export function sanitizeBuild(raw: unknown): DeviceBuild {
  const out: DeviceBuild = { ...STOCK_BUILD };
  if (raw && typeof raw === 'object') {
    for (const axis of DEVICE_AXES) {
      const v = (raw as Record<string, unknown>)[axis.id];
      if (typeof v === 'string') out[axis.id] = v.trim();
    }
  }
  return out;
}

/** The device as it looks right now — a *read* of the ten keys. */
export function activeBuild(): DeviceBuild {
  const out: DeviceBuild = { ...STOCK_BUILD };
  try {
    for (const axis of DEVICE_AXES) {
      out[axis.id] = (window.localStorage.getItem(axis.storageKey) ?? '').trim();
    }
  } catch {
    /* private-mode Safari: the stock build is a fine answer */
  }
  return out;
}

/**
 * Write the build into the ten keys. Removes the key for an empty axis
 * rather than storing `''` — absence and emptiness must not be two states.
 * The caller (theme.ts) re-applies and notifies; this only writes.
 */
export function writeBuild(b: DeviceBuild): void {
  try {
    for (const axis of DEVICE_AXES) {
      const value = (b[axis.id] ?? '').trim();
      if (value === '') window.localStorage.removeItem(axis.storageKey);
      else window.localStorage.setItem(axis.storageKey, value);
    }
  } catch {
    /* ignored — the applied theme is still correct for this session */
  }
}

/** The valid PartColor for a stored string, or null. */
export const partColorOf = (raw: string): PartColorId | null =>
  (PART_COLOR_IDS as string[]).includes(raw) ? (raw as PartColorId) : null;

/** The valid GrilleShape for a stored string, falling back to SLATS. */
export const grilleShapeOf = (raw: string): GrilleShapeId =>
  (GRILLE_SHAPE_IDS as string[]).includes(raw) ? (raw as GrilleShapeId) : 'SLATS';
