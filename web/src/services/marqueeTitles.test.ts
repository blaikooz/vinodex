import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { MARQUEE_ART } from './marqueeArt';
import { SITE_MARQUEE_TITLE } from './appRoutes';

/**
 * Every screen title resolves to a marquee panel, or is an accepted fallback
 * (W20).
 *
 * `marqueeArt.test.ts` already holds the map and the mirrored directory to
 * each other in both directions — every mapped stem has a file, every file is
 * mapped or named as drawn-ahead. What neither it nor anything else checked
 * was the **third** side of the triangle: whether the titles the app actually
 * mounts are in the map at all.
 *
 * A title with no panel and no lucide case falls through to the wineglass. On
 * a dex screen that is a silent downgrade — a screen that should carry its own
 * drawn panel quietly showing the app's generic mark, discoverable only by
 * looking at it. On a **company-site** screen it is correct and deliberate:
 * the site is a different product that shares the chassis, and giving it its
 * own set of dex marquee panels would be exactly the leakage the separation
 * rule forbids.
 *
 * So the fallback list is explicit and small, and every member of it is a
 * portal title. A dex title arriving without a panel fails here.
 *
 * ## Titles this cannot see
 *
 * Six call sites pass an expression rather than a literal — the listing's
 * `getTitle()`, the settings panel's `section`, the entry readout's
 * `scanTitle`, the portal's `project.name`, the portal content page's
 * `title` (which is how WHO WE ARE arrives), and the Suspense fallback's
 * derived label. Those are covered by the map's own scan-title entries and by
 * `marqueeArt.test.ts`; this suite is about the literals, which is where a
 * new screen's title arrives. WHO WE ARE is therefore *not* in the accepted
 * list below — it is not a literal, and listing it would make the list claim
 * a completeness it does not have.
 */

const COMPONENTS = path.resolve(__dirname, '../../components');
const APP = path.resolve(__dirname, '../../App.tsx');

/**
 * Titles that deliberately have no drawn panel.
 *
 * Every one is a company-site screen. The site reuses `DeviceLayout` and the
 * tile styling on purpose, so the two products read as one brand — and stops
 * there. Marquee panels are dex chrome.
 *
 * UNLOCK and UNLOCK VINODEX left this list in v0.3.0 with the screens they
 * named: the access code is gone (v8#3), and the honesty check below is what
 * forced the removal rather than letting two dead names sit here looking
 * deliberate.
 */
const ACCEPTED_FALLBACKS = new Set([
  'OUR WORK',        // the OUR WORK list
  'CONTACT US',
  'HORIZON/GODOT',   // the site's front page
  SITE_MARQUEE_TITLE.toUpperCase(), // WELCOME — see `siteMarquee` below
]);

/** Literal `title=` props on `<DeviceLayout>`, with the file that carries them. */
const literalTitles = (): { title: string; file: string }[] => {
  const out: { title: string; file: string }[] = [];
  const scan = (file: string) => {
    const src = readFileSync(file, 'utf8');
    for (const m of src.matchAll(/<DeviceLayout\b/g)) {
      // Walk to the end of the opening tag, tracking JSX expression braces so
      // a `title={cond ? 'A' : 'B'}` is skipped rather than half-read.
      let i = m.index! + m[0].length;
      let depth = 0;
      while (i < src.length) {
        const c = src[i];
        if (c === '{') depth += 1;
        else if (c === '}') depth -= 1;
        else if (c === '>' && depth === 0) break;
        i += 1;
      }
      const tag = src.slice(m.index!, i);
      // `(?<![a-zA-Z])` so `subtitle=""` — which every one of these tags
      // also carries — is not read as the title. It was, and produced three
      // phantom empty-string failures on the first run.
      const t = tag.match(/(?<![a-zA-Z])title="([^"]*)"/);
      if (t) out.push({ title: t[1]!, file: path.basename(file) });
    }
  };
  scan(APP);
  for (const name of readdirSync(COMPONENTS)) {
    const full = path.join(COMPONENTS, name);
    if (!statSync(full).isFile() || !/\.tsx$/.test(name) || name.includes('.test.')) continue;
    scan(full);
  }
  return out;
};

/**
 * The site's marquee override, which is not a `title=` prop (v8#8).
 *
 * `DeviceLayout` passes `SITE_MARQUEE_TITLE` to the band on every site screen,
 * so it is a string this app puts on that panel — and it would have been
 * invisible to a scan that only reads `<DeviceLayout title="...">`. Folding it
 * in keeps the gate's claim true: *every* title the panel can show is either
 * mapped or listed. Without this the override would be the one string on the
 * marquee that nothing checked.
 */
const siteMarquee = (): { title: string; file: string } => ({
  title: SITE_MARQUEE_TITLE,
  file: 'appRoutes.ts',
});

describe('marquee titles', () => {
  const titles = [...literalTitles(), siteMarquee()];

  it('finds the screens it is meant to be checking', () => {
    // Guards the guard: a regex that matched nothing would make every
    // assertion below pass.
    expect(titles.length).toBeGreaterThan(15);
    expect(titles.map(t => t.title)).toContain('VINODEX');
  });

  it('gives every dex screen title a drawn panel', () => {
    const missing = titles
      .filter(t => !MARQUEE_ART[t.title.toUpperCase()] && !ACCEPTED_FALLBACKS.has(t.title.toUpperCase()))
      .map(t => `${t.title}  (${t.file})`);
    expect(
      missing,
      'these titles fall through to the generic wineglass:\n'
      + `${missing.join('\n')}\n`
      + 'Either map the title in MARQUEE_ART, or — if it is a company-site screen — '
      + 'add it to ACCEPTED_FALLBACKS with the reason.',
    ).toEqual([]);
  });

  it('keeps the fallback list to site screens, and keeps it honest', () => {
    // A fallback that has since gained a panel should leave the list, or the
    // list stops meaning "deliberately without one".
    const stale = [...ACCEPTED_FALLBACKS].filter(t => MARQUEE_ART[t]);
    expect(stale, `these now have panels and should leave ACCEPTED_FALLBACKS: ${stale.join(', ')}`).toEqual([]);

    // And every entry must actually be mounted somewhere, or it is a name
    // nobody removed after deleting a screen.
    const mounted = new Set(titles.map(t => t.title.toUpperCase()));
    const orphaned = [...ACCEPTED_FALLBACKS].filter(t => !mounted.has(t));
    expect(orphaned, `ACCEPTED_FALLBACKS names titles no screen uses: ${orphaned.join(', ')}`).toEqual([]);
  });
});
