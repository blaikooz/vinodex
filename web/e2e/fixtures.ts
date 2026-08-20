import { test as base, expect, Page } from '@playwright/test';
import { FIRST_TIME_TRIGGERS } from '../src/services/vinoDialogue';

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

/**
 * The standard seeded device: past the BIOS is *not* included — see `enterDex`.
 *
 * **Two seeds left in v0.3.0.** `unlockedAppIDs` went with the access door
 * (v8#3), and the `booted` session flag went with the once-per-session BIOS
 * (v8#2). Neither has a replacement, because neither fact exists any more.
 *
 * What is left is what it always was: a device that has met the professor and
 * been offered the walkthrough, so those two do not stand in front of the
 * screen a spec is actually about.
 */
export const seedDevice = async (page: Page, extra: Record<string, string> = {}) => {
  await page.addInitScript(e => {
    window.localStorage.setItem('firstTimeTriggersSeen', 'firstLaunch,firstLaunchNamed');
    window.localStorage.setItem('coachmarkOffered', 'true');
    for (const [k, v] of Object.entries(e)) window.localStorage.setItem(k, v);
  }, extra);
};

/**
 * Open a dex route and let the device finish booting.
 *
 * **This replaces `sessionStorage.booted`, and it is a better fixture than the
 * flag was.** The old seed asserted a fact into storage and the app read it
 * back; the BIOS itself was therefore never exercised by any of the ~40 specs
 * that used it, which is half of why the v0.2.0 layering fault (the intro card
 * and the coachmark spotlight drawing over the boot) could hide. This presses
 * the skip the way a player can — the boot layer is one big
 * `aria-label="Skip boot"` button — so every one of those specs now walks
 * through a real power-on on its way in.
 *
 * Tolerant of the boot not being there: `/detail/:id` is a cold share arrival
 * and deliberately does not boot (v8#2), and a spec that navigates *within*
 * the dex will not meet a second one.
 */
export const enterDex = async (page: Page, route: string) => {
  await page.goto(route);
  const skip = page.getByRole('button', { name: 'Skip boot' });
  // A beat for the first paint, so "no boot" is an answer rather than a race.
  await page.waitForTimeout(250);
  if (await skip.count()) {
    await skip.click({ force: true });
    await expect(skip).toHaveCount(0);
  }
};

/**
 * A genuinely fresh device: nothing seeded at all.
 *
 * **First run was untested by construction (W20).** `seedDevice` exists to skip
 * past the professor's greeting and the walkthrough offer, because those get in
 * the way of testing the screen behind them — so every test that used it was,
 * by definition, not testing first run. And first run is where this app keeps
 * hiding bugs: the BIOS layering fault (the intro card and the coachmark
 * spotlight drawing over the boot, cleanbot H1) and the W1 remount both live in
 * that window, and the hole that hid H1 was precisely that the professor's test
 * seeded past the BIOS while the BIOS test seeded past the professor.
 *
 * It seeded `unlockedAppIDs` until v0.3.0, on the grounds that the access code
 * was a doorman rather than part of the experience under test. There is no
 * door now (v8#3), so the fixture is what its name always claimed: empty.
 * What a real first visitor meets is what the test meets.
 */
/**
 * A player the professor has nothing left to say to.
 *
 * For specs that *navigate by pressing the chassis*. His bubble is a
 * viewport-fixed layer whose card takes pointer events, and it overlaps the
 * button band -- so with a line on screen, a click aimed at the Home cap lands
 * on the bubble instead. That is a real behaviour and worth its own look (see
 * IOS-PARITY-v8 section 5); it is not what a routing test is measuring, so
 * these specs seed past every line rather than dismissing one at a time.
 *
 * The whole vocabulary, from the source of truth, so a new trigger is covered
 * the day it is added.
 */
export const ALL_TRIGGERS_SEEN = { firstTimeTriggersSeen: FIRST_TIME_TRIGGERS.join(',') };

export const seedFreshDevice = async (page: Page) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
};
