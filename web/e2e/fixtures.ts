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
      // An in-flight image cancelled by a navigation is `net::ERR_ABORTED`,
      // not a failure -- it happened once under full-suite load to
      // `/art/vino/vino-thinking.png` and failed the walkthrough spec. A
      // mistyped stem is still a 404 response, caught below, so the
      // art-reference guard this fixture exists for is untouched.
      if (r.failure()?.errorText === 'net::ERR_ABORTED') return;
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
    // Two races live here under a loaded runner: the click can lose to the
    // boot finishing on its own (the overlay is still in the DOM but no
    // longer clickable), and a click can misfire while the overlay is mid
    // transition. So: try, give it a beat, try again -- and the assertion of
    // record is that the boot ends, clicked or not, inside the time the POST
    // takes to run itself out.
    for (let attempt = 0; attempt < 3 && (await skip.count()); attempt += 1) {
      await skip.click({ force: true }).catch(() => undefined);
      const gone = await expect(skip)
        .toHaveCount(0, { timeout: 3_000 })
        .then(() => true, () => false);
      if (gone) break;
    }
    await expect(skip).toHaveCount(0, { timeout: 15_000 });
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
/*
 * `ALL_TRIGGERS_SEEN` stood here for one commit and is gone (v8#11).
 *
 * It seeded past every one of the professor's lines, for the two specs that
 * navigate by *pressing the chassis* -- because his bubble sat on the button
 * band and ate the click. That is a fixture written around a bug, and the bug
 * is fixed: the bubble clears the band now, so the two specs press Home and
 * Back with him mid-sentence and assert that it works. A helper that exists to
 * step around a defect has to leave with the defect, or the next person reads
 * it as a fact about the app.
 */

export const seedFreshDevice = async (page: Page) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
};
