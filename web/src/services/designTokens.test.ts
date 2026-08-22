import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * The design foundation, pinned (v0.4.0, m2).
 *
 * **Why a text suite and not a render test.** Same argument
 * `reducedMotion.test.ts` makes and for the same reason: the failure this
 * guards against is a stylesheet that *stops containing a rule*. jsdom does
 * not resolve `color-mix()`, does not cascade custom properties into
 * `getComputedStyle`, and cannot evaluate `linear()`. A token renamed out from
 * under its call sites resolves to nothing in a real browser -- CSS treats a
 * missing `var()` as the empty string -- so a card would silently lose its
 * paint with no error anywhere and every render test would still pass. Reading
 * the CSS as text is the honest way to catch that.
 *
 * The browser half is covered where it belongs: `web/e2e/screenshots.spec.ts`
 * runs the real engine and photographs the result.
 */

const WEB_ROOT = path.resolve(__dirname, '../..');
const componentsDir = path.join(WEB_ROOT, 'components');
/**
 * The stylesheet with its comments stripped.
 *
 * Not an optimisation -- a correctness fix, and the same one R8 records at the
 * head of index.css. Prose has to be able to name what it changed: the note
 * above the font faces quotes the third-party stylesheet import it deleted,
 * and the
 * token blocks name their own tokens while explaining them. Matched against
 * the raw text, every assertion below can be satisfied by a comment
 * *describing* the thing rather than the thing existing -- which is exactly
 * how a deleted rule keeps testing as present.
 */
const css = fs
  .readFileSync(path.join(WEB_ROOT, 'index.css'), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '');

/**
 * Every token the foundation promises, grouped the way the stylesheet groups
 * them. A rename is a red test here rather than an unpainted card in
 * production.
 */
const TOKENS = {
  type: [
    '--font-sans',
    '--text-display', '--text-title', '--text-heading',
    '--text-body', '--text-label', '--text-caption',
  ],
  radius: ['--radius-control', '--radius-card', '--radius-surface'],
  elevation: ['--shadow-elev-1', '--shadow-elev-2', '--shadow-elev-3'],
  motion: [
    '--motion-overlay', '--ease-overlay',
    '--motion-crossfade', '--ease-crossfade',
    '--motion-press', '--ease-press',
    '--motion-settle', '--ease-settle',
    '--press-scale',
  ],
  layout: ['--pad-screen', '--pad-card', '--gap-grid', '--gap-stack'],
  surface: [
    '--surface-sunken', '--surface-base', '--surface-raised',
    '--surface-high', '--surface-line', '--surface-line-strong',
  ],
  tint: ['--tint-surface', '--tint-subtle', '--tint-border', '--tint-ink', '--tint-solid'],
  focus: ['--focus-ring'],
};

/** `DexTileLivery`'s seven cases, which the web now carries in full. */
const LIVERIES = ['violet', 'green', 'amber', 'red', 'orange', 'sky', 'emerald'];

describe('design tokens', () => {
  for (const [group, names] of Object.entries(TOKENS)) {
    it(`declares every ${group} token`, () => {
      const missing = names.filter(n => !css.includes(`${n}:`));
      expect(missing, `index.css no longer declares: ${missing.join(', ')}`).toEqual([]);
    });
  }

  /**
   * The type scale honours the SMALL/LARGE setting.
   *
   * This is the hole the scale was built to close: `.lcd-themed` sets
   * `font-size: calc(1em * var(--text-scale))`, which only ever reached text
   * with no explicit size of its own -- and the app sizes almost everything
   * with rem utilities, so the accessibility control did close to nothing on
   * the screens people actually read. Every step multiplies by the scale, so
   * a step that forgets to is a step that quietly opts out.
   */
  it('multiplies every type step by --text-scale', () => {
    for (const step of TOKENS.type.filter(t => t.startsWith('--text-'))) {
      const m = new RegExp(`${step}:\\s*([^;]+);`).exec(css);
      expect(m, `${step} is not declared`).not.toBeNull();
      expect(m![1], `${step} ignores the text-scale setting`).toContain('var(--text-scale');
    }
  });

  /**
   * Both halves of `DexTileLivery`, in agreement.
   *
   * iOS hoisted this table precisely because "light mode was added to the
   * settings grid and missed on the main menu, because there was no one place
   * that knew a tile face has two values". A light half that is missing a row
   * is that bug, reintroduced, and it is invisible until somebody switches to
   * one of the four pale screen modes.
   */
  it('carries a dark and a light value for all seven liveries', () => {
    const lightBlock = css.slice(css.indexOf("[data-lcd-light='true']"));
    for (const name of LIVERIES) {
      for (const suffix of ['', '-deep']) {
        const token = `--livery-${name}${suffix}:`;
        expect(css, `the dark table has no ${token}`).toContain(token);
        expect(
          lightBlock.slice(0, lightBlock.indexOf('}')),
          `the light table has no ${token} -- the four pale screen modes will `
          + 'draw the dark-mode face on a pale page',
        ).toContain(token);
      }
    }
  });

  /**
   * The two spring easings are real springs.
   *
   * A `cubic-bezier` cannot both overshoot and settle back, which is why these
   * are sampled `linear()` curves rather than a hand-picked bezier. The
   * assertions are the properties that make them ports rather than guesses:
   * they start at rest, they end at rest, and they go past 1 on the way -- so
   * a well-meaning "simplification" to a bezier fails here.
   */
  for (const [name, minOvershoot] of [['press', 1.05], ['settle', 1.005]] as const) {
    it(`--ease-${name} is a spring, not a bezier`, () => {
      const m = new RegExp(`--ease-${name}:\\s*linear\\(([^)]+)\\);`).exec(css);
      expect(m, `--ease-${name} is not a linear() easing`).not.toBeNull();
      const stops = m![1]!.split(',').map(s => Number(s.trim()));
      expect(stops.length, 'too few stops to describe a spring').toBeGreaterThanOrEqual(16);
      expect(stops.every(Number.isFinite), 'a stop is not a number').toBe(true);
      expect(stops[0]).toBe(0);
      expect(stops[stops.length - 1]).toBe(1);
      expect(
        Math.max(...stops),
        `--ease-${name} does not overshoot, so it is not the iOS spring`,
      ).toBeGreaterThan(minOvershoot);
    });
  }

  /**
   * The tint ramp is derived, not authored.
   *
   * Four steps from one hue is the whole point: it is what makes the ramp
   * correct on all nine LCD modes without a nine-by-seven table. A step
   * spelled as a literal is a step that will be wrong on eight of them.
   */
  it('derives every tint step from --tint and the mode\'s own colours', () => {
    const block = css.slice(css.indexOf('.dex-tint {'));
    const body = block.slice(0, block.indexOf('}'));
    for (const step of ['--tint-surface', '--tint-subtle', '--tint-border', '--tint-ink']) {
      const m = new RegExp(`${step}:\\s*([^;]+);`).exec(body);
      expect(m, `${step} is not in .dex-tint`).not.toBeNull();
      expect(m![1], `${step} is not derived from --tint`).toContain('var(--tint)');
      expect(m![1], `${step} is not mixed against the current mode`).toMatch(/var\(--lcd-/);
    }
  });

  /**
   * The self-hosted faces, and the absence of the thing they replaced.
   *
   * Stated as an absence as well as a presence: an `@import` of a third-party
   * font stylesheet coming back would restore the two extra round trips, the
   * offline hole and the render-gate flake in one line, and would do it
   * silently -- the page would still look right on a machine with a network.
   */
  it('self-hosts its faces and imports none', () => {
    expect(css, 'a third-party font @import is back in index.css')
      .not.toMatch(/@import\s+url\(['"]?https:\/\/fonts\.googleapis/);
    for (const face of ['Inter', 'Press Start 2P', 'VT323']) {
      expect(css, `${face} has no @font-face`).toContain(`font-family: '${face}'`);
    }
    const fonts = path.join(WEB_ROOT, 'public', 'fonts');
    for (const file of [
      'inter-latin.woff2', 'inter-latin-ext.woff2',
      'press-start-2p-latin.woff2', 'press-start-2p-latin-ext.woff2',
      'vt323-latin.woff2', 'vt323-latin-ext.woff2',
    ]) {
      expect(fs.existsSync(path.join(fonts, file)), `public/fonts/${file} is missing`).toBe(true);
    }
    // SIL OFL 1.1 requires the licence to travel with the font.
    for (const lic of ['OFL-Inter.txt', 'OFL-PressStart2P.txt', 'OFL-VT323.txt']) {
      expect(fs.existsSync(path.join(fonts, lic)), `public/fonts/${lic} is missing`).toBe(true);
    }
  });

  /**
   * The screens converted to the foundation carry no raw colour.
   *
   * A hardcoded hex on a themed surface beats the cascade -- it cannot follow
   * a screen mode, a skin or a contrast retune -- and this is the exact defect
   * the audit found scattered across the app. The list grows one screen at a
   * time as the rollout reaches them; a screen on this list may not regress.
   *
   * `Card.tsx` is on it from the start, because a primitive that hardcodes a
   * colour hardcodes it everywhere at once.
   */
  const CONVERTED = ['Card.tsx', 'MainMenu.tsx', 'WebsitePortal.tsx'];

  /**
   * The one kind of literal colour that is not paint.
   *
   * `MainMenu`'s dial cuts each quadrant's concave inner corner with a
   * `radial-gradient` used as a **mask**, and in a mask only the alpha channel
   * is read: `#000` there means "keep this pixel", nothing more. Theming it
   * would be meaningless -- there is no screen mode in which the scoop should
   * be a different shape -- and swapping it for `rgb(0 0 0 / 1)` to slip past
   * the regex would be worse than either.
   *
   * Listed per file and per value rather than as a blanket "ignore lines
   * containing `mask`", so an actual paint colour cannot hide behind the
   * exemption by being on the same line as one.
   */
  const NOT_PAINT: Record<string, string[]> = {
    'MainMenu.tsx': ['#000'],
  };

  for (const file of CONVERTED) {
    it(`${file} styles with tokens, not literal colour`, () => {
      const src = fs.readFileSync(path.join(componentsDir, file), 'utf8');
      const allowed = [...(NOT_PAINT[file] ?? [])];
      const offenders: string[] = [];
      for (const line of src.split('\n')) {
        // Prose in a doc comment may name a colour; code may not.
        if (/^\s*(\*|\/\/)/.test(line)) continue;
        for (const m of line.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) {
          const at = allowed.indexOf(m[0]);
          if (at >= 0) { allowed.splice(at, 1); continue; }
          offenders.push(m[0]);
        }
      }
      expect(
        offenders,
        `${file} carries literal colour: ${offenders.join(', ')} -- use a token so it `
        + 'follows the screen mode',
      ).toEqual([]);
      // The exemption is spent, not standing: a mask that goes away should
      // take its entry with it.
      expect(
        allowed,
        `${file}'s NOT_PAINT list names values that are no longer in the file: ${allowed.join(', ')}`,
      ).toEqual([]);
    });
  }
});
