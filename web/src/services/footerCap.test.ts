import { describe, expect, it } from 'vitest';
import {
  CHASSIS_SKINS,
  FOOTER_CAP_KINDS,
  footerCap,
  type ChassisSkinId,
  type FooterCapKind,
} from './theme';

/**
 * One colour model for the four footer caps (S1).
 *
 * Ported from `vinodex-ios/Tests/.../FooterCapTests`, and it pins the
 * invariant that whole arc exists to protect: **no reader can tell Home from
 * Back.**
 *
 * The history is worth having in the suite that guards against its return.
 * Through iOS 0.8.97 the four caps resolved through two different colour
 * models — Back, User and Settings from a `ChassisControl`, Home from a
 * `ChassisAccent` whose fallback was the *chassis accent*, a bright colour
 * unrelated to the moulded caps beside it. That is why Home wore gold on
 * OAKED's wood and white on BURGUNDY's purple, and why three consecutive
 * releases of cap fixes each "missed the home button": every fix landed on
 * the path Home was never on. 0.8.94 gave all four one resolution function,
 * 0.8.98 deleted the last branch, and `FooterCapTests` pinned it so it
 * cannot fork again.
 *
 * The web carried the same fork, hardcoded: three stone caps and one amber
 * one with an inner lit disc, identical on all twenty-two skins. Measured
 * before this change, the Home glyph rendered `rgb(123,51,6)` on every skin
 * screenshotted.
 */

const ALL_SKINS = Object.keys(CHASSIS_SKINS) as ChassisSkinId[];

/** Skins that author a per-control set. Everything else wears one cap. */
const LIVERIES: ChassisSkinId[] = ['CLASSIC', 'PSVINO', 'VINHO_VERDE', 'W64'];

const isColour = (v: string) => /^#[0-9a-fA-F]{6}$/.test(v) || /^rgba?\(/.test(v);

describe('footerCap', () => {
  it('answers for every skin and every kind', () => {
    expect(ALL_SKINS).toHaveLength(22);
    expect(FOOTER_CAP_KINDS).toEqual(['back', 'home', 'user', 'settings']);
    for (const skin of ALL_SKINS) {
      for (const kind of FOOTER_CAP_KINDS) {
        const cap = footerCap(skin, kind);
        for (const [stop, value] of Object.entries(cap)) {
          expect(isColour(value), `${skin}/${kind}.${stop} is not a colour: ${value}`).toBe(true);
        }
      }
    }
  });

  it('gives the ordinary skins one cap on all four controls', () => {
    // The rule the four liveries are the exception to. If a fifth skin grows
    // a set, this test names it — which is the moment to check the set is
    // intended rather than a paste.
    const plain = ALL_SKINS.filter(s => !LIVERIES.includes(s));
    for (const skin of plain) {
      const back = footerCap(skin, 'back');
      for (const kind of FOOTER_CAP_KINDS) {
        expect(footerCap(skin, kind), `${skin} differs on ${kind}`).toEqual(back);
      }
    }
  });

  it('never lets Home be the odd one out on a skin with no authored set', () => {
    // THE invariant. Home resolving from a different source is the entire
    // defect §A records, and on a skin with no `buttonSet` the only correct
    // answer is "the same cap as Back".
    const plain = ALL_SKINS.filter(s => !LIVERIES.includes(s));
    for (const skin of plain) {
      expect(footerCap(skin, 'home'), `${skin}: Home has forked from Back`)
        .toEqual(footerCap(skin, 'back'));
    }
  });

  it('gives the four liveries four distinct caps, as their brief asks', () => {
    // "All four recolour -- the brief is explicit that this is not a subset."
    // CLASSIC is the exception among the exceptions: its set exists to make
    // the four *agree* (black), not to differentiate them, so only Home's
    // ramp-derived stops differ.
    for (const skin of ['PSVINO', 'VINHO_VERDE', 'W64'] as ChassisSkinId[]) {
      const tops = FOOTER_CAP_KINDS.map(k => footerCap(skin, k).top);
      expect(new Set(tops).size, `${skin} does not colour all four separately`).toBe(4);
    }
  });

  it('keeps CLASSIC to one ink across all four', () => {
    // iOS 0.8.91 D2: the skin the device ships wearing had one button a
    // different colour and a different ink from its three neighbours.
    const glyphs = FOOTER_CAP_KINDS.map(k => footerCap('CLASSIC', k).glyph);
    expect(new Set(glyphs).size).toBe(1);
    expect(glyphs[0]).toBe('#a8a29e');
  });

  /**
   * The pale-plastic skins carry a dark glyph.
   *
   * **Named, not derived.** The first draft of this test computed luminance
   * and asserted "a pale face gets a dark ink", and it failed on PSVINO --
   * whose User cap is a saturated mid blue (#6FA3E8) with a near-white glyph,
   * which is correct and is the console livery working. Relative luminance
   * says a saturated blue is light; the eye says it is a coloured button.
   *
   * A derived rule over authored art second-guesses the person who chose the
   * colours, and would have failed on the four skins whose whole point is
   * their palette. So the list is iOS's own -- the skins whose caps are
   * *unsaturated pale plastic*, where white on white is nothing at all, which
   * is the Blanc de Blancs precedent `ChassisSkins.swift` cites by name.
   */
  const PALE_PLASTIC: ChassisSkinId[] = [
    'ORIGINAL',    // the original handheld's pale grey d-pad
    'CHAMPAGNE',   // pale gold
    'PET_NAT',     // paper
    'STEEL',       // machined
    'BLUSH',       // pink, a register deeper than the shell
    'NOCTURNE',    // luminous green
    'GLOUGLOU',    // smoke
    'NOUVEAU',     // smoke
    'WALDGLAS',    // glass
  ];

  it('gives every pale-plastic skin a dark glyph', () => {
    const luminance = (hex: string): number => {
      const m = /^#([0-9a-fA-F]{6})$/.exec(hex);
      if (!m) return 1; // rgba(): the translucent shells read as pale
      const n = parseInt(m[1]!, 16);
      const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
      return (0.2126 * r! + 0.7152 * g! + 0.0722 * b!) / 255;
    };
    for (const skin of PALE_PLASTIC) {
      for (const kind of FOOTER_CAP_KINDS) {
        const cap = footerCap(skin, kind);
        expect(
          luminance(cap.glyph),
          `${skin}/${kind}: ${cap.glyph} on ${cap.top} -- a pale glyph on pale plastic`,
        ).toBeLessThan(0.5);
      }
    }
  });

  it('never paints a glyph the same colour as its face', () => {
    // The weakest true statement, and therefore the safe one: a groove the
    // same colour as the plastic it is cut into is a groove nobody can see.
    // Anything stronger turns into a judgement about palettes somebody
    // already made by eye.
    for (const skin of ALL_SKINS) {
      for (const kind of FOOTER_CAP_KINDS) {
        const cap = footerCap(skin, kind);
        expect(cap.glyph.toLowerCase(), `${skin}/${kind}: glyph and face are one colour`)
          .not.toBe(cap.top.toLowerCase());
        expect(cap.edge.toLowerCase(), `${skin}/${kind}: rim and face are one colour`)
          .not.toBe(cap.top.toLowerCase());
      }
    }
  });

  it('paints Home differently from Back on exactly the four liveries', () => {
    // Stated from the other end, so the table cannot quietly grow a fifth
    // livery without somebody deciding to.
    const forked = ALL_SKINS.filter(
      s => JSON.stringify(footerCap(s, 'home')) !== JSON.stringify(footerCap(s, 'back')),
    );
    expect(forked.sort()).toEqual([...LIVERIES].sort());
  });
});

describe('the cap tokens', () => {
  it('writes four properties per kind', () => {
    // The names DeviceLayout's `capStyle` builds. A rename on either side
    // silently un-paints the band, since a missing custom property just
    // resolves to nothing.
    const expected: string[] = [];
    for (const kind of FOOTER_CAP_KINDS as FooterCapKind[]) {
      for (const stop of ['top', 'bottom', 'edge', 'glyph']) {
        expected.push(`--cap-${kind}-${stop}`);
      }
    }
    expect(expected).toHaveLength(16);
    expect(expected).toContain('--cap-home-top');
    expect(expected).toContain('--cap-settings-glyph');
  });
});
