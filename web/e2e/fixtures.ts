import { test as base, expect, Page } from '@playwright/test';

/**
 * The console-error fixture, shared by every spec.
 *
 * It lived inside `smoke.spec.ts` and therefore applied to nothing else —
 * the screenshot suite ran with no error checking at all, so a shell that
 * threw on mount still passed. Hoisting it is the fix.
 *
 * **The filter is on the request URL, never on the word "404".** Chrome logs
 * a broken `<img>` as "...status of 404 (Not Found)", and this repo just
 * added 72 `/art/` image references, so a text filter on "404" would hide
 * exactly the mistyped-stem failure the gate exists to catch.
 */
const IGNORABLE = /favicon|manifest\.webmanifest|apple-touch-icon/i;

export const test = base.extend<{ consoleErrors: string[] }>({
  consoleErrors: async ({ page }, use) => {
    const found: string[] = [];
    page.on('console', m => {
      if (m.type() !== 'error') return;
      const url = m.location()?.url ?? '';
      if (IGNORABLE.test(url)) return;
      found.push(`${m.text()}${url ? ` @ ${url}` : ''}`);
    });
    page.on('pageerror', e => found.push(String(e)));
    page.on('requestfailed', r => {
      if (!IGNORABLE.test(r.url())) found.push(`request failed: ${r.url()}`);
    });
    // A missing image is a 404 response, not a failed request.
    page.on('response', r => {
      if (r.status() >= 400 && !IGNORABLE.test(r.url())) found.push(`HTTP ${r.status()}: ${r.url()}`);
    });
    await use(found);
    expect(found, `console/network errors:\n${found.join('\n')}`).toEqual([]);
  },
});

export { expect };

/** The standard seeded device: unlocked, past the BIOS, past the first run. */
export const seedDevice = async (page: Page, extra: Record<string, string> = {}) => {
  await page.addInitScript(e => {
    window.localStorage.setItem('unlockedAppIDs', JSON.stringify(['vinodex']));
    window.localStorage.setItem('firstTimeTriggersSeen', 'firstLaunch,firstLaunchNamed');
    window.localStorage.setItem('coachmarkOffered', 'true');
    window.sessionStorage.setItem('booted', '1');
    for (const [k, v] of Object.entries(e)) window.localStorage.setItem(k, v);
  }, extra);
};

/**
 * A genuinely fresh device: unlocked, and nothing else.
 *
 * **First run was untested by construction (W20).** `seedDevice` exists to
 * skip past the BIOS, the professor's greeting and the walkthrough offer,
 * because those get in the way of testing the screen behind them — so every
 * test that used it was, by definition, not testing first run. And first run
 * is where this app keeps hiding bugs: the BIOS layering fault (the intro
 * card and the coachmark spotlight drawing over the boot, cleanbot H1) and
 * the W1 remount both live in that window, and the hole that hid H1 was
 * precisely that the professor's test seeded past the BIOS while the BIOS
 * test seeded past the professor.
 *
 * `unlockedAppIDs` is the one thing seeded, and only because the unlock code
 * is a doorman rather than part of the experience under test — typing it in
 * every spec would add a keypad walk to each one without exercising anything
 * the spec is about. Everything else is left absent: no `booted`, no
 * `firstTimeTriggersSeen`, no `coachmarkOffered`. What a real first visitor
 * meets is what the test meets.
 */
export const seedFreshDevice = async (page: Page) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.localStorage.setItem('unlockedAppIDs', JSON.stringify(['vinodex']));
  });
};
