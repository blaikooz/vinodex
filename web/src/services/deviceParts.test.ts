import { afterEach, describe, expect, it } from 'vitest';
import {
  DEVICE_AXES,
  PART_COLOR_BASE,
  PART_COLOR_IDS,
  STOCK_BUILD,
  activeBuild,
  chosenCount,
  grilleShapeOf,
  isStock,
  partAccent,
  partColorName,
  partColorOf,
  partControl,
  partHomeCap,
  partLampTrio,
  readsAsInk,
  sanitizeBuild,
  writeBuild,
} from './deviceParts';

/**
 * The workshop's data model, pinned against the iOS source it ports
 * (`DeviceParts.swift` / `DeviceBuild.swift`). The persisted vocabulary —
 * raw values, storage keys, the empty-means-stock invariant — is the part
 * a rename would silently reset, so it is the part these tests hold.
 */

describe('PartColor', () => {
  it('carries the thirteen raw values, spelled as iOS spells them', () => {
    expect(PART_COLOR_IDS).toEqual([
      'CRIMSON', 'CLARET', 'ROSE', 'AMBER', 'STRAW', 'ABSINTHE', 'VERDANT',
      'GLACIER', 'COBALT', 'VIOLET', 'SLATE', 'IVORY', 'ONYX',
    ]);
    // The accent lives in the display name, never the raw value.
    expect(partColorName('ROSE')).toBe('ROSÉ');
    expect(partColorName('ONYX')).toBe('ONYX');
  });

  it('derives dark ink for pale colours and white for the rest', () => {
    // IVORY is the palest chip; its ink is a very dark form of itself, not
    // flat black — CLASSIC's #78350f-on-amber rule.
    const ivoryInk = partControl('IVORY').glyph;
    expect(ivoryInk).not.toBe('#FFFFFF');
    expect(ivoryInk.toLowerCase()).not.toBe('#000000');
    expect(partControl('CLARET').glyph).toBe('#FFFFFF');
  });

  it('inverts the ONYX accent ramp (iOS 0.8.93 item 7)', () => {
    const onyx = partAccent('ONYX');
    const claret = partAccent('CLARET');
    // ONYX's pale stop is a light grey stepping DOWN to the base; CLARET's
    // pale stop is a heavy white mix — dark red behaving normally.
    expect(onyx.pale.toLowerCase()).not.toBe(claret.pale.toLowerCase());
    expect(onyx.bright).toBe(PART_COLOR_BASE.ONYX);
    expect(onyx.ink).toBe('#FFFFFF');
  });

  it('restates Home as the cap its ramp colours (litRamp)', () => {
    for (const id of PART_COLOR_IDS) {
      const a = partAccent(id);
      const cap = partHomeCap(id);
      expect(cap).toEqual({ top: a.light, bottom: a.mid, edge: a.edge, glyph: a.ink });
    }
  });

  it('shades a lamp trio by the statusLights rule', () => {
    const trio = partLampTrio('VIOLET');
    expect(trio).toHaveLength(3);
    // The middle stop is the colour itself.
    expect(trio[1]![0].toLowerCase()).toBe(PART_COLOR_BASE.VIOLET.toLowerCase());
    // Each stop's rim is darker than its fill.
    for (const [fill, edge] of trio) {
      expect(parseInt(edge.slice(1), 16)).toBeLessThan(parseInt(fill.slice(1), 16));
    }
  });

  it('refuses the inks iOS refuses, per ground (readsAsInk)', () => {
    // 0.62 excludes IVORY, STRAW, ABSINTHE, GLACIER, AMBER and ROSÉ from the
    // pale modes; 0.26 excludes ONYX and CLARET from the dark ones. Both
    // sides keep seven or more choices — the property that makes the rule
    // worth having.
    const paleRefused = PART_COLOR_IDS.filter(id => !readsAsInk(id, true));
    const darkRefused = PART_COLOR_IDS.filter(id => !readsAsInk(id, false));
    expect(paleRefused.sort()).toEqual(['ABSINTHE', 'AMBER', 'GLACIER', 'IVORY', 'ROSE', 'STRAW'].sort());
    expect(darkRefused.sort()).toEqual(['CLARET', 'ONYX'].sort());
    expect(PART_COLOR_IDS.length - paleRefused.length).toBeGreaterThanOrEqual(7);
    expect(PART_COLOR_IDS.length - darkRefused.length).toBeGreaterThanOrEqual(7);
  });
});

describe('DeviceBuild', () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it('spells the ten storage keys exactly as iOS does', () => {
    expect(DEVICE_AXES.map(a => a.storageKey)).toEqual([
      'chassisSkin',
      'devicePartButtons',
      'devicePartOrb',
      'devicePartHeaderLamps',
      'devicePartMarquee',
      'devicePartMarqueeLamps',
      'devicePartGrille',
      'devicePartGrilleShape',
      'lcdMode',
      'devicePartFont',
    ]);
  });

  it('stores empty as absence, never as an empty string', () => {
    writeBuild({ ...STOCK_BUILD, orb: 'VIOLET' });
    expect(window.localStorage.getItem('devicePartOrb')).toBe('VIOLET');
    writeBuild(STOCK_BUILD);
    // Removed, not '': absence and emptiness must not be two states.
    expect(window.localStorage.getItem('devicePartOrb')).toBeNull();
  });

  it('round-trips a build through the ten keys', () => {
    const build = { ...STOCK_BUILD, buttons: 'COBALT', grilleShape: 'MESH', font: 'VERDANT' };
    writeBuild(build);
    expect(activeBuild()).toEqual(build);
    expect(isStock(activeBuild())).toBe(false);
    expect(chosenCount(activeBuild())).toBe(3);
  });

  it('decodes a stored blob defensively, axis by axis', () => {
    // An old blob missing new axes decodes to the device it described plus
    // axes nobody had chosen — iOS's hand-written decoder, whose absence
    // would have silently deleted every saved build on first launch.
    expect(sanitizeBuild({ orb: 'GLACIER' })).toEqual({ ...STOCK_BUILD, orb: 'GLACIER' });
    expect(sanitizeBuild(null)).toEqual(STOCK_BUILD);
    expect(sanitizeBuild({ orb: 42 })).toEqual(STOCK_BUILD);
  });

  it('validates part colours and grille shapes rather than trusting them', () => {
    expect(partColorOf('VIOLET')).toBe('VIOLET');
    expect(partColorOf('MAUVE')).toBeNull();
    expect(grilleShapeOf('MESH')).toBe('MESH');
    expect(grilleShapeOf('ZIGZAG')).toBe('SLATS');
  });
});
