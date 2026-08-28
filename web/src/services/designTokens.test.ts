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
    '--font-retro', '--font-mono',
    '--text-display', '--text-title', '--text-heading',
    '--text-label', '--text-micro', '--text-body', '--text-caption',
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
  it('self-hosts its two faces and imports none', () => {
    expect(css, 'a third-party font @import is back in index.css')
      .not.toMatch(/@import\s+url\(['"]?https:\/\/fonts\.googleapis/);
    for (const face of ['Press Start 2P', 'VT323']) {
      expect(css, `${face} has no @font-face`).toContain(`font-family: '${face}'`);
    }
    const fonts = path.join(WEB_ROOT, 'public', 'fonts');
    for (const file of [
      'press-start-2p-latin.woff2', 'press-start-2p-latin-ext.woff2',
      'vt323-latin.woff2', 'vt323-latin-ext.woff2',
    ]) {
      expect(fs.existsSync(path.join(fonts, file)), `public/fonts/${file} is missing`).toBe(true);
    }
    // SIL OFL 1.1 requires the licence to travel with the font.
    for (const lic of ['OFL-PressStart2P.txt', 'OFL-VT323.txt']) {
      expect(fs.existsSync(path.join(fonts, lic)), `public/fonts/${lic} is missing`).toBe(true);
    }
  });

  /**
   * ALL RETRO, ALWAYS (v0.6.11 -- the PREMIUM RETRO ruling).
   *
   * v0.4.0 added Inter and v0.4.3 made it the body face; the owner reversed
   * that: "Press Start 2P for headings, labels, chrome. VT323 for body and
   * reading text. No sans font anywhere." This pins the reversal in four
   * places a regression could enter -- a face declaration, a preload, the
   * body default, and a class on any component -- because every one of them
   * would otherwise be a silent taste drift rather than a failure.
   */
  describe('all-retro type', () => {
    it('declares no sans face and preloads none', () => {
      expect(css, 'an Inter @font-face is back').not.toContain("font-family: 'Inter'");
      expect(css, 'a font file for Inter is referenced').not.toMatch(/inter-latin/);
      // Comments stripped, so the note recording Inter's removal cannot fail
      // the test that enforces it.
      const html = fs.readFileSync(path.join(WEB_ROOT, 'index.html'), 'utf8').replace(/<!--[\s\S]*?-->/g, '');
      expect(html, 'index.html preloads a sans face').not.toMatch(/inter-latin|Inter/);
      const fonts = path.join(WEB_ROOT, 'public', 'fonts');
      expect(fs.readdirSync(fonts).filter(f => /inter/i.test(f)), 'Inter files are still shipped').toEqual([]);
    });

    it('reads in VT323 by default and removes the font-sans utility', () => {
      const body = /body\s*\{([^}]*)\}/.exec(css);
      expect(body, 'no body rule').not.toBeNull();
      expect(body![1], 'the body face is not the terminal face').toMatch(/font-family:\s*var\(--font-mono\)/);
      expect(css, '`--font-sans: initial` is what stops Tailwind generating `font-sans`')
        .toMatch(/--font-sans:\s*initial;/);
    });

    it('gives every type role its face: pixel for chrome, terminal for reading', () => {
      const pixel = /:where\(([^)]*)\)\s*\{\s*font-family:\s*var\(--font-retro\);/.exec(css);
      const terminal = /:where\(([^)]*)\)\s*\{\s*font-family:\s*var\(--font-mono\);/.exec(css);
      expect(pixel, 'no role rule for the pixel face').not.toBeNull();
      expect(terminal, 'no role rule for the terminal face').not.toBeNull();
      for (const role of ['.text-display', '.text-title', '.text-heading', '.text-label', '.text-micro']) {
        expect(pixel![1], `${role} is not Press Start 2P`).toContain(role);
      }
      for (const role of ['.text-body', '.text-caption']) {
        expect(terminal![1], `${role} is not VT323`).toContain(role);
      }
    });

    it('carries no font-sans class and no synthetic weight on a role, in any component', () => {
      const offenders: string[] = [];
      const walk = (dir: string) => {
        for (const name of fs.readdirSync(dir)) {
          const full = path.join(dir, name);
          if (fs.statSync(full).isDirectory()) { walk(full); continue; }
          if (!/\.tsx?$/.test(name) || name.includes('.test.')) continue;
          const src = fs.readFileSync(full, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
          for (const line of src.split('\n')) {
            if (/^\s*(\*|\/\/)/.test(line)) continue;
            if (/\bfont-sans\b/.test(line)) offenders.push(`${name}: font-sans`);
            // Both faces ship one weight; a `font-bold` on a role step is a
            // faux bold the browser smears onto pixel art.
            if (/\btext-(display|title|heading|label|micro|body|caption)\b/.test(line)
              && /\bfont-(semibold|bold|extrabold|medium)\b/.test(line)) {
              offenders.push(`${name}: synthetic weight on a type role`);
            }
          }
        }
      };
      walk(path.join(WEB_ROOT, 'components'));
      walk(path.join(WEB_ROOT, 'src'));
      walk(path.join(WEB_ROOT, 'App.tsx').replace(/App\.tsx$/, ''));
      expect([...new Set(offenders)], 'the sans is back, or a weight is faked').toEqual([]);
    });
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
  const CONVERTED = [
    'Card.tsx', 'MainMenu.tsx', 'WebsitePortal.tsx',
    // Stage 4, batch 1 — lists and tiles (v0.4.3).
    'Chip.tsx', 'EntryTile.tsx', 'EncyclopediaList.tsx',
    // Stage 4, batch 2 — the entry readout and its decomposition.
    'EntryDetail.tsx', 'EntryDetailSections.tsx', 'EntryDetailHeaders.tsx',
    // Stage 4, batch 3 — the settings family. `DexAlert.tsx` is deliberately
    // NOT here: it is fixed-colour end to end by design (iOS's DexAlert), and
    // listing it would force tokens onto the one surface that refuses them.
    'SettingsPanel.tsx', 'FirmwareHistoryScreen.tsx', 'SupportScreen.tsx', 'CheatConsoleScreen.tsx',
    // Stage 4, batch 4 — the tools family. `RegionMapScreen.tsx` and
    // `RetroGlobeScreen.tsx` are deliberately NOT here: both are drawn
    // instruments (the radar, the globe) whose phosphor rendering is the
    // point, recorded as fixed in the v9 §9 ledger notes.
    'MinigamesScreen.tsx', 'RecommendationsScreen.tsx', 'GrapeLineageScreen.tsx',
    'MoonDialScreen.tsx', 'ChipFilterScreen.tsx', 'BookmarksScreen.tsx', 'ScannerScreen.tsx',
    // Stage 4, batch 5 — passport, exam, professor. NOT here, with reasons:
    // the professor cards, RatingPrompt, StampUnlockedPrompt and InstallBanner
    // are fixed-palette overlays of the DexAlert family; WalkthroughScreen's
    // schematic mini-device is an illustration drawn in painted colours.
    'PassportScreen.tsx', 'WineExamScreen.tsx', 'TastingQuizScreen.tsx',
    'ProfVinoScreen.tsx', 'InsightSection.tsx',
  ];

  /**
   * The kinds of literal colour that are not paint.
   *
   * Listed per file and per value rather than as a blanket "ignore lines
   * containing `mask`", so an actual paint colour cannot hide behind the
   * exemption by being on the same line as one. Each entry is spent, not
   * standing: MainMenu's former black alpha mask left with the dial's move to
   * geometric SVG clips, and took its `#000` entry with it.
   */
  const NOT_PAINT: Record<string, string[]> = {
    // The CONTINENT chip's colours are chip DATA — a continent's own cyan,
    // fixed on both platforms exactly like the `shared/services/chipColors`
    // country table — not paint that should follow the screen mode.
    'EntryTile.tsx': ['#0f2027', '#0891b2', '#7dd3fc'],
    // A comparison against a DATA table's own sentinel ("did the wine-type
    // table answer black ink"), not paint: the readable stand-in it picks is
    // the table's border colour, also data.
    'EntryDetailHeaders.tsx': ['#000000'],
    // The skin-preview's stage: a *picture* of the device on its dark desk,
    // drawn in the skin's own data colours. The stage is part of the drawing
    // and does not follow the screen mode, exactly like the chassis itself.
    // Then TILE_FACE: the system grid's face/shadow/ink triples are iOS
    // `SettingsPanel.swift` tileColors DATA, ported verbatim per mode — the
    // same both-platforms rule as the chip tables. They already carry their
    // own pale-vs-dark variants keyed off the screen mode, which is the whole
    // job the token remap does for paint.
    'SettingsPanel.tsx': [
      '#1B1D21',
      '#22C55E', '#15803D', '#FFFFFF', '#15803D', '#0B4A24', '#FFFFFF',
      '#EAB308', '#A16207', '#FFFFFF', '#B45309', '#7A3606', '#FFFFFF',
      '#EF4444', '#991B1B', '#FFFFFF', '#B91C1C', '#7A1010', '#FFFFFF',
      '#F97316', '#9A3412', '#FFFFFF', '#C2410C', '#7C2D12', '#FFFFFF',
      '#2AB5FF', '#136A99', '#FFFFFF', '#1D6FA8', '#11486E', '#FFFFFF',
      '#A855F7', '#6B21A8', '#FFFFFF', '#7E22CE', '#4C1D95', '#FFFFFF',
    ],
    // TOOL_ROSTER's face/shadow/ink triples are iOS `ToolsScreen`'s current
    // values — tool DATA shared across platforms, same rule as TILE_FACE.
    'MinigamesScreen.tsx': [
      '#22C55E', '#15803D', '#FFFFFF', '#3B82F6', '#1D4ED8', '#FFFFFF',
      '#A855F7', '#6B21A8', '#FFFFFF', '#EF4444', '#991B1B', '#FFFFFF',
      '#EAB308', '#A16207', '#FFFFFF', '#0891B2', '#155E75', '#FFFFFF',
    ],
  };

  /**
   * What counts as literal colour (widened for stage 4). Hex was never the
   * only spelling: `rgb()`/`hsl()` write the same fixed paint, and a Tailwind
   * palette utility (`bg-stone-900`, `text-green-500`) is a fixed hex wearing
   * a class name — on a converted screen it either escapes the `.lcd-themed`
   * remap outright or quietly depends on it, and the whole point of
   * conversion is that neither happens. Bare `black`/`white` utilities are
   * deliberately not matched: a `bg-black/80` scrim is a shadow, not paint,
   * and is legible in every mode by construction.
   */
  const LITERAL_COLOUR = [
    // The lookbehind exempts HTML entities: `&#9656;` is a triangle bullet,
    // not a hex colour, and its digits happen to be valid hex.
    /(?<!&)#[0-9a-fA-F]{3,8}\b/g,
    /\b(?:rgb|rgba|hsl|hsla|oklch|oklab)\(/g,
    /\b(?:bg|text|border|from|via|to|ring|placeholder|fill|stroke|shadow|divide|outline|decoration|caret)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}(?:\/\d{1,3})?/g,
  ];

  for (const file of CONVERTED) {
    it(`${file} styles with tokens, not literal colour`, () => {
      // Block comments stripped first — the same correctness fix the CSS half
      // makes above: a JSX `{/* ... */}` comment's continuation lines do not
      // start with `*`, so prose naming the colour a conversion REMOVED would
      // otherwise fail the file that removed it.
      const src = fs
        .readFileSync(path.join(componentsDir, file), 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '');
      const allowed = [...(NOT_PAINT[file] ?? [])];
      const offenders: string[] = [];
      for (const line of src.split('\n')) {
        // Line comments may name a colour; code may not.
        if (/^\s*(\*|\/\/)/.test(line)) continue;
        for (const re of LITERAL_COLOUR) {
          for (const m of line.matchAll(re)) {
            const at = allowed.indexOf(m[0]);
            if (at >= 0) { allowed.splice(at, 1); continue; }
            offenders.push(m[0]);
          }
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
