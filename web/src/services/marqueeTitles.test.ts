import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { MARQUEE_ART, SITE_MARK_TITLE, WEB_MARQUEE_ART } from './marqueeArt';
import { SITE_MARQUEE_TITLE } from './appRoutes';

/**
 * Every screen title resolves to a drawn panel (W20, rewritten at v8#10).
 *
 * `marqueeArt.test.ts` holds each map and its directory to each other in both
 * directions — every mapped stem has a file, every file is mapped or named as
 * drawn-ahead. What neither it nor anything else checked was the **third**
 * side of the triangle: whether the titles the app actually mounts are in
 * either map at all.
 *
 * A title with no panel and no lucide case falls through to `<Wine>`. On a dex
 * screen that is a silent downgrade — a screen that should carry its own drawn
 * panel quietly showing the app's generic mark, discoverable only by looking
 * at it.
 *
 * ## What changed, and why this is now a stronger gate
 *
 * There used to be an `ACCEPTED_FALLBACKS` set here — company-site titles that
 * were *allowed* to show the wineglass, on the grounds that marquee panels are
 * dex chrome and giving the site its own would be leakage.
 *
 * That reasoning had the conclusion backwards, and v8#10 reverses it: the
 * wineglass **is** the leak. It is the encyclopedia's own mark, appearing on
 * the studio's front page, arriving through a `default:` branch rather than
 * through an import — which is precisely the kind of leak a separation rule
 * enforced at the import level cannot see. The site now stamps its own
 * web-authored mark (`WEB_MARQUEE_ART`) on every one of its screens.
 *
 * So the allow-list is **deleted rather than shortened**, and every title —
 * dex and site alike — must resolve to a drawn panel. There is nothing left to
 * grandfather, and no list for a sixth entry to be quietly added to. Which
 * side a title is on is decided by the file it is declared in: a fact about
 * the source, rather than a name somebody remembered to maintain.
 *
 * ## Titles this cannot see
 *
 * Six call sites pass an expression rather than a literal — the listing's
 * `getTitle()`, the settings panel's `section`, the entry readout's
 * `scanTitle`, the site's `project.name`, its content page's `title` (which is
 * how WHO WE ARE arrives), and the Suspense fallback's derived label. Those are
 * covered by the map's own scan-title entries and by `marqueeArt.test.ts`; this
 * suite is about the literals, which is where a new screen's title arrives.
 * The expression-titled *site* screens take the same `marqueeMark` from the
 * same branch in `DeviceLayout` as the literal ones, so they are covered by
 * construction rather than by being listed.
 */

const COMPONENTS = path.resolve(__dirname, '../../components');
const APP = path.resolve(__dirname, '../../App.tsx');

/** The file that declares the company site's screens. A title found there is a
 *  site title; anything else is the dex. */
const SITE_FILE = 'WebsitePortal.tsx';

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
 * The landing's marquee override, which is not a `title=` prop (v8#8).
 *
 * `DeviceLayout` passes `SITE_MARQUEE_TITLE` to the band on `/`, so it is a
 * string this app puts on that panel — and it would be invisible to a scan
 * that only reads `<DeviceLayout title="...">`. Folding it in keeps the gate's
 * claim true: *every* string the panel can show is accounted for. It is a site
 * string, so it is held to the site's rule below.
 */
const siteOverride = (): { title: string; file: string } => ({
  title: SITE_MARQUEE_TITLE,
  file: SITE_FILE,
});

describe('marquee titles', () => {
  const titles = [...literalTitles(), siteOverride()];
  const dexTitles = titles.filter(t => t.file !== SITE_FILE);
  const siteTitles = titles.filter(t => t.file === SITE_FILE);

  it('finds the screens it is meant to be checking', () => {
    // Guards the guard: a regex that matched nothing would make every
    // assertion below pass.
    expect(titles.length).toBeGreaterThan(15);
    expect(titles.map(t => t.title)).toContain('VINODEX');
    // And that both sides are populated, so neither branch below is vacuous.
    expect(dexTitles.length).toBeGreaterThan(10);
    expect(siteTitles.length).toBeGreaterThan(2);
  });

  it('gives every dex screen title a drawn panel', () => {
    const missing = dexTitles
      .filter(t => !MARQUEE_ART[t.title.toUpperCase()])
      .map(t => `${t.title}  (${t.file})`);
    expect(
      missing,
      'these titles fall through to the generic wineglass:\n'
      + `${missing.join('\n')}\n`
      + 'Map the title in MARQUEE_ART.',
    ).toEqual([]);
  });

  it('stamps the studio mark on every company-site screen', () => {
    // The site does not get per-screen panels — those are dex chrome, drawn by
    // iOS for iOS's routes. It gets one mark on all of them, and the mark
    // exists, and it comes from the directory the sync leg cannot reach.
    expect(WEB_MARQUEE_ART[SITE_MARK_TITLE], `${SITE_MARK_TITLE} has no web-authored mark`).toBeTruthy();
    expect(WEB_MARQUEE_ART[SITE_MARK_TITLE]).toMatch(/^\/art\/site\//);
  });

  it('lets no dex panel reach a company-site screen', () => {
    // The separation rule, stated where it actually breaks. An import check
    // cannot see this: a site title colliding with a dex one — DATA is the live
    // near-miss, and the site's DATA tile does open a dex route — would
    // silently borrow the encyclopedia's drawn panel.
    const borrowed = siteTitles
      .filter(t => MARQUEE_ART[t.title.toUpperCase()])
      .map(t => `${t.title} -> ${MARQUEE_ART[t.title.toUpperCase()]}`);
    expect(
      borrowed,
      `these site titles resolve to a dex panel: ${borrowed.join(', ')}. `
      + 'The site stamps SITE_MARK_TITLE over the top today, so this bites only '
      + 'if the mark branch is removed — but the collision is the hazard worth naming.',
    ).toEqual([]);
  });

  it('keeps the web-authored set from clashing with the mirrored one', () => {
    // The old fallback list's honesty check, pointed at the map that replaced
    // it: a title with a mark drawn here AND a panel mirrored from iOS means
    // the two maps disagree about who owns it, and the resolution order
    // silently decides.
    const clashing = Object.keys(WEB_MARQUEE_ART).filter(t => MARQUEE_ART[t]);
    expect(
      clashing,
      `these have both a web-authored mark and an iOS panel: ${clashing.join(', ')}`,
    ).toEqual([]);
  });
});
