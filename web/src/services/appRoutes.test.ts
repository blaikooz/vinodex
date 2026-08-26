import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  DEX_PREFIXES,
  SITE_EXACT,
  SITE_PREFIXES,
  browserTitle,
  bootDecision,
  isDexPath,
  isSharePath,
  isSitePath,
} from './appRoutes';

/**
 * The two lists, and the boot they decide (v8#1, v8#2).
 *
 * This file is the seam five behaviours now hang off — the BIOS, the chassis
 * skin, the screensaver, the bezel wordmark and the marquee — so the risk is
 * not that a function is wrong, it is that **`App.tsx` grows a route nobody
 * classifies**. An unclassified dex screen would launch without a boot, wearing
 * the site's CLASSIC shell, on somebody else's device colourway; an
 * unclassified site page would sleep into the screensaver.
 *
 * So the first suite reads `App.tsx`'s route table and demands that every
 * `path=` in it land on one side or the other. It is the same source-scan
 * discipline `storageKeys.test.ts` and `marqueeTitles.test.ts` use, and for
 * the same reason: the failure is a line somebody forgot to add, and only a
 * scan can see a line that is not there.
 */

const APP = resolve(process.cwd(), 'web/App.tsx');

/** Every `path="..."` on a `<Route>` in App.tsx. */
const routePaths = (): string[] => {
  const src = readFileSync(APP, 'utf8');
  return [...src.matchAll(/<Route\s+path="([^"]+)"/g)].map(m => m[1]!);
};

/** `/list/:category` -> `/list/GRAPES`: a param stands for any real segment. */
const concrete = (pattern: string): string =>
  pattern.replace(/:[A-Za-z_$][\w$]*/g, 'X');

describe('the route table is fully classified', () => {
  const paths = routePaths();

  it('finds the routes it is meant to be checking', () => {
    // Guards the guard: a changed JSX spelling would empty this and make every
    // assertion below pass by checking nothing.
    expect(paths.length).toBeGreaterThan(20);
    expect(paths).toContain('/dex');
    expect(paths).toContain('/');
  });

  it('puts every route on exactly one side of the line', () => {
    const unclassified: string[] = [];
    const both: string[] = [];
    for (const pattern of paths) {
      if (pattern === '*') continue; // the catch-all, which redirects to '/'
      const path = concrete(pattern);
      const site = isSitePath(path);
      const dex = isDexPath(path);
      if (site && dex) both.push(pattern);
      if (!site && !dex) unclassified.push(pattern);
    }
    expect(
      unclassified,
      'these App.tsx routes are neither site nor dex — add them to SITE_* or '
      + `DEX_PREFIXES in appRoutes.ts:\n${unclassified.join('\n')}`,
    ).toEqual([]);
    expect(both, `these routes claim to be both products: ${both.join(', ')}`).toEqual([]);
  });

  it('names no prefix that no route uses', () => {
    // A list that outlives the screens it names stops meaning "the dex", and
    // the next reader trusts it anyway.
    const concretePaths = paths.map(concrete);
    const orphaned = [...DEX_PREFIXES, ...SITE_PREFIXES, ...SITE_EXACT].filter(
      prefix => !concretePaths.some(p => p === prefix || p.startsWith(`${prefix}/`)),
    );
    expect(orphaned, `classified prefixes no route uses: ${orphaned.join(', ')}`).toEqual([]);
  });
});

describe('path classification', () => {
  it('uses only the active product name in the browser title', () => {
    for (const p of ['/', '/apps', '/project/vinodex', '/who-we-are', '/garbage']) {
      expect(browserTitle(p), p).toBe('HORIZON/GODOT');
    }
    for (const p of ['/dex', '/detail/G001', '/settings', '/list/GRAPES']) {
      expect(browserTitle(p), p).toBe('VINODEX');
    }
  });

  it('knows the site from the dex', () => {
    for (const p of ['/', '/apps', '/who-we-are', '/contact', '/privacy', '/terms', '/project/focuspond']) {
      expect(isSitePath(p), p).toBe(true);
      expect(isDexPath(p), p).toBe(false);
    }
    for (const p of ['/dex', '/detail/G001', '/list/GRAPES', '/settings/DATA', '/saved']) {
      expect(isDexPath(p), p).toBe(true);
      expect(isSitePath(p), p).toBe(false);
    }
  });

  it('keeps every v0.2.x /website spelling on the site', () => {
    // These are redirects now, but they are still *the site's* URLs while the
    // redirect resolves — a boot or a screensaver on the way through would be
    // visible.
    for (const p of ['/website', '/website/apps', '/website/who-we-are', '/website/contact', '/website/unlock', '/website/project/varied-mix']) {
      expect(isSitePath(p), p).toBe(true);
      expect(isDexPath(p), p).toBe(false);
    }
  });

  it('matches whole segments, not string prefixes', () => {
    // The failure a naive startsWith gives: a route that merely begins with the
    // same letters is claimed by the wrong product.
    expect(isDexPath('/dexterity')).toBe(false);
    expect(isDexPath('/settings-old')).toBe(false);
    expect(isSitePath('/projectile')).toBe(false);
    expect(isSitePath('/contact-us')).toBe(false);
  });

  it('treats an unknown URL as neither', () => {
    // It is on its way to the catch-all and then to '/'. Claiming it for the
    // dex would boot the device for a screen nobody reached.
    expect(isDexPath('/garbage')).toBe(false);
    expect(isSitePath('/garbage')).toBe(false);
    expect(bootDecision(null, '/garbage')).toBe(false);
  });
});

describe('the boot decision', () => {
  it('never boots on the site', () => {
    for (const p of ['/', '/apps', '/who-we-are', '/contact', '/privacy', '/terms', '/project/focuspond', '/website']) {
      expect(bootDecision(null, p), `cold ${p}`).toBe(false);
      expect(bootDecision('/dex', p), `from the dex to ${p}`).toBe(false);
      expect(bootDecision('/', p), `within the site to ${p}`).toBe(false);
    }
  });

  it('boots every time the app is opened from the site', () => {
    // The ruling, stated plainly: not once per session — every entry. Two trips
    // in and out of the app in one page-load boot twice.
    expect(bootDecision('/', '/dex')).toBe(true);
    expect(bootDecision('/project/vinodex', '/dex')).toBe(true);
    expect(bootDecision('/apps', '/dex')).toBe(true);
    expect(bootDecision('/website', '/dex')).toBe(true);
  });

  it('boots a cold launch on any dex route but the share page', () => {
    for (const p of ['/dex', '/passport', '/settings', '/list/GRAPES', '/quiz']) {
      expect(bootDecision(null, p), `cold ${p}`).toBe(true);
    }
    expect(bootDecision(null, '/detail/G001'), 'a shared link is a page, not a launch').toBe(false);
    expect(isSharePath('/detail/G001')).toBe(true);
  });

  it('never boots inside the app', () => {
    // Including out of a deep-linked share page: the visitor is already in the
    // device, so nothing may power-cycle under them mid-browse. This is the
    // half of the ruling the rejected alternative got wrong.
    expect(bootDecision('/dex', '/passport')).toBe(false);
    expect(bootDecision('/detail/G001', '/dex')).toBe(false);
    expect(bootDecision('/detail/G001', '/detail/G002')).toBe(false);
    expect(bootDecision('/detail/G001', '/list/GRAPES')).toBe(false);
    expect(bootDecision('/settings', '/settings/DATA')).toBe(false);
  });

  it('boots again when a deep-link visitor leaves and comes back', () => {
    // The compensation for the exception above: the BIOS is deferred, not
    // skipped. The moment they actually open the app, it runs.
    expect(bootDecision('/detail/G001', '/')).toBe(false);
    expect(bootDecision('/', '/dex')).toBe(true);
  });
});
