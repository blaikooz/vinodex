import { test, expect, enterDex, seedDevice } from './fixtures';
import { CHASSIS_SKINS } from '../src/services/theme';

/**
 * The company site is the landing, and it is the studio's device — not the
 * app's (v8#1, #4, #5, #6, #7, #8, #9).
 *
 * **Why a browser suite and not vitest.** Every claim in here is about what a
 * real engine *resolves*: an inherited custom property shadowed on one subtree,
 * an engraved wordmark drawn in the grille's own colour, an idle timer that
 * must not fire. jsdom computes none of those — it does not cascade custom
 * properties into `getComputedStyle`, and a skin override that silently
 * resolved to nothing would pass a jsdom assertion and ship a grey device.
 *
 * The 22-skin gate in `screenshots.spec.ts` reads `:root` and stays on `/dex`
 * for the reason stated there. This file is the other half: it reads the
 * element the chassis actually paints, which is the only place the site's
 * override exists.
 */

const rgbOf = (hex: string): string => {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
};

/** The colour the chassis moulding actually painted, resolved by the engine. */
const paintedChassis = (page: import('@playwright/test').Page) =>
  page.evaluate(() => {
    const el = document.querySelector('[style*="preserve-3d"] > div > div');
    return el ? getComputedStyle(el).backgroundColor : '';
  });

test('the site is what a visitor lands on', async ({ page, consoleErrors }) => {
  void consoleErrors;
  await seedDevice(page);
  await page.goto('/');
  await page.waitForTimeout(600);

  // The four tiles, and no fork. DEX / WEBSITE is gone with the splash (v8#1),
  // so a visitor is never asked which product they meant before being shown
  // either of them.
  await expect(page.getByRole('heading', { name: 'HORIZON/GODOT' })).toBeVisible();
  for (const tile of ['OPEN VINODEX', 'OUR WORK', 'WHO WE ARE', 'CONTACT US']) {
    await expect(page.getByRole('button', { name: tile })).toBeVisible();
  }
  await expect(page.getByText('PLAYFUL TOOLS, MADE WELL.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'DATA', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'DEX', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'WEBSITE', exact: true })).toHaveCount(0);

  // The old studio line is replaced by a concrete promise.
  await expect(page.getByText('CREATING ACROSS MULTITUDES')).toHaveCount(0);
});

test('every v0.2.x /website URL still resolves', async ({ page, consoleErrors }) => {
  void consoleErrors;
  await seedDevice(page);

  // Nothing already linked, bookmarked or shared may break (v8#1). Checked by
  // walking the old URLs in a real browser rather than by reading the route
  // table, because a redirect that renders a blank frame before it fires is
  // still a broken link to the person who followed it.
  const moved: [string, string][] = [
    ['/website', '/'],
    ['/website/apps', '/apps'],
    ['/website/who-we-are', '/who-we-are'],
    ['/website/contact', '/contact'],
    ['/website/project/focuspond', '/project/focuspond'],
    // The access door's own URL. Its whole purpose was to get into the app,
    // and nothing stands in the way now (v8#3), so it goes there.
    ['/website/unlock', '/dex'],
  ];
  for (const [from, to] of moved) {
    await page.goto(from);
    await page.waitForTimeout(500);
    expect(new URL(page.url()).pathname, `${from} should land on ${to}`).toBe(to);
    await expect(page.locator('body')).not.toBeEmpty();
  }
});

test('OUR WORK opens Vinodex with no code in the way', async ({ page, consoleErrors }) => {
  void consoleErrors;
  await seedDevice(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'OUR WORK' }).click();
  await expect(page).toHaveURL(/\/apps$/);

  // The tile stays; the keypad does not (v8#3). Stated as an absence as well
  // as a presence: a four-slot code entry reappearing anywhere on this walk
  // would mean the ruling was reversed without being revisited.
  await expect(page.getByText('ENTER ACCESS CODE')).toHaveCount(0);
  await expect(page.getByText(/DEMO CODE/)).toHaveCount(0);

  await page.getByRole('button', { name: /VINODEX/ }).first().click();
  await expect(page).toHaveURL(/\/project\/vinodex$/);
  await expect(page.getByText('ENTER ACCESS CODE')).toHaveCount(0);

  await page.getByRole('button', { name: /OPEN VINODEX/ }).click();
  await page.getByRole('button', { name: 'Skip boot' }).click({ force: true });
  await expect(page).toHaveURL(/\/dex$/);
});

test('OUR WORK includes Château and hands off safely', async ({ page, consoleErrors }) => {
  void consoleErrors;
  await seedDevice(page);
  await page.goto('/apps');

  await page.getByRole('button', { name: /CHÂTEAU/ }).click();
  await expect(page).toHaveURL(/\/project\/chateau-earth$/);
  const publication = page.getByRole('link', { name: /VISIT PUBLICATION/ });
  await expect(publication).toHaveAttribute('href', 'https://chateauearth.substack.com/');
  await expect(publication).toHaveAttribute('target', '_blank');
  await expect(publication).toHaveAttribute('rel', /noopener/);
});

test('the site wears CLASSIC while the player wears something else', async ({ page, consoleErrors }, testInfo) => {
  void consoleErrors;
  // A stored skin as far from the red shell as the table gets, so "the site is
  // CLASSIC" cannot pass by the override doing nothing.
  await seedDevice(page, { chassisSkin: 'NOCTURNE' });

  await page.goto('/');
  await page.waitForTimeout(600);
  const onSite = await paintedChassis(page);
  expect(onSite, 'the site chassis is not CLASSIC').toBe(rgbOf(CHASSIS_SKINS.CLASSIC.body));
  await testInfo.attach('site-classic', { body: await page.screenshot(), contentType: 'image/png' });
  await page.screenshot({ path: 'web/e2e/.shots/site-classic-over-nocturne.png' });

  // **The stored choice survives, which is the whole reason the override is
  // scoped rather than written.** `:root` still carries NOCTURNE while the
  // site paints CLASSIC — so nothing has to be restored on the way out, and a
  // reload on a site page cannot strand the override.
  const rootSkin = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--chassis-body').trim(),
  );
  expect(rootSkin.toLowerCase(), 'the site overwrote the stored skin').toBe(
    CHASSIS_SKINS.NOCTURNE.body.toLowerCase(),
  );
  expect(await page.evaluate(() => window.localStorage.getItem('chassisSkin'))).toBe('NOCTURNE');

  // And the app is the player's own shell again the moment they are in it.
  await enterDex(page, '/dex');
  await page.waitForTimeout(600);
  const inDex = await paintedChassis(page);
  expect(inDex, 'the dex is not the stored skin').toBe(rgbOf(CHASSIS_SKINS.NOCTURNE.body));
  await testInfo.attach('dex-nocturne', { body: await page.screenshot(), contentType: 'image/png' });
});

test('the site keeps its bezel, removes the footer, and navigates inside the LCD', async ({ page, consoleErrors }) => {
  void consoleErrors;
  await seedDevice(page);

  // The engraved wordmark remains part of the hardware, but the website no
  // longer carries the app's footer controls, marquee, or status lamps.
  await page.goto('/');
  await page.waitForTimeout(600);
  const bezel = page.locator('.bezel-wordmark');
  await expect(bezel).toHaveCount(1);
  expect((await bezel.textContent())?.trim(), 'the site bezel does not read HORIZON/GODOT')
    .toBe('HORIZON/GODOT');

  await expect(page.locator('footer')).toHaveCount(0);
  await expect(page.locator('.terminal-marquee')).toHaveCount(0);
  await expect(page.locator('.lamp-hit')).toHaveCount(0);

  await page.getByRole('button', { name: 'OUR WORK' }).click();
  const lcdNav = page.getByRole('navigation', { name: 'Screen navigation' });
  await expect(lcdNav).toBeVisible();
  await expect(lcdNav.getByRole('button', { name: 'Back' })).toBeVisible();
  await expect(lcdNav).toContainText('OUR WORK');

  // Inside the app it reads VINODEX again, and the dex's own script is
  // untouched: the menu greets once per launch, exactly as before.
  await enterDex(page, '/dex');
  await page.waitForTimeout(600);
  expect((await page.locator('.bezel-wordmark').textContent())?.trim(),
    'the dex bezel does not read VINODEX').toBe('VINODEX');
});

test('the screensaver never runs on the site', async ({ page, consoleErrors }) => {
  void consoleErrors;
  // The idle threshold is 60 s of real time, which no gate can afford to wait
  // out honestly — so the clock is moved instead of the test being slowed.
  // `Date.now` is stubbed forward before the page loads, so the poll that
  // compares "now" against the last activity sees a minute of silence on its
  // first tick.
  await page.addInitScript(() => {
    const real = Date.now;
    let offset = 0;
    // Two seconds of wall time buys ninety of device time.
    setInterval(() => { offset += 15_000; }, 250);
    Date.now = () => real() + offset;
  });
  await seedDevice(page);

  const saver = page.getByRole('button', { name: /Screensaver/ });

  await page.goto('/');
  await page.waitForTimeout(3_000);
  await expect(saver, 'the site went to screensaver').toHaveCount(0);

  // The other half, so this cannot pass because the screensaver is broken
  // everywhere: the same silence in the app does raise it.
  await enterDex(page, '/dex');
  await expect(saver).toHaveCount(1, { timeout: 15_000 });
});

test('backing out past the menu returns to the site', async ({ page, consoleErrors }) => {
  void consoleErrors;
  // Pressed rather than navigated, so the caps are the thing under test -- and
  // **deliberately not seeded past the professor** (v8#11). `/passport` fires
  // `firstPassport`, so his bubble is up when Home is pressed, which until
  // v0.3.0 meant the click landed on him instead of the cap. Asserted present
  // first, so the press cannot succeed for the wrong reason.
  await seedDevice(page);

  // Home is unchanged: an in-app control that lands on the dex menu (v8#9).
  await enterDex(page, '/passport');
  await expect(page.getByText('PROF. VINO')).toBeVisible();
  await page.getByRole('button', { name: 'Home', exact: true }).first().click();
  await expect(page).toHaveURL(/\/dex$/);

  // Back from the menu leaves the app, because the site is what it sits on.
  //
  // **And it leaves from here specifically**, which is the case that made the
  // destination fixed rather than a history pop: this walk arrived at the menu
  // *from* `/passport`, so `navigate(-1)` would have gone back into the app.
  // The menu's Back may not mean two different things depending on a history
  // the player cannot see.
  await page.getByRole('button', { name: 'Back', exact: true }).first().click();
  await page.waitForTimeout(400);
  expect(new URL(page.url()).pathname).toBe('/');
  await expect(page.getByRole('heading', { name: 'HORIZON/GODOT' })).toBeVisible();

  // And the settings door out says so in its own words.
  await enterDex(page, '/settings');
  await page.getByRole('button', { name: /EXIT TO SITE/ }).click();
  await page.waitForTimeout(400);
  expect(new URL(page.url()).pathname).toBe('/');
});

/**
 * Back on the site never launches the app (v8#12).
 *
 * **The release blocker.** `handleBack`'s no-history fallback was a flat
 * `navigate('/dex')` — carried out of v0.2.x, when it was true that "the user
 * is inside the app". It is wired to five *site* routes now, so on the release
 * whose thesis is that Vinodex is something you open from inside the site,
 * Back on the front page booted the encyclopedia.
 *
 * Both halves are covered, because the warm one is the subtle half: React
 * Router keeps `key === 'default'` on the initial history entry, so popping
 * back onto `/` puts you on the cold branch again. A test that only walked
 * forwards would have missed that and called the fix proved.
 */
test('Back on the site goes up the site, never into the app', async ({ page, consoleErrors }) => {
  void consoleErrors;
  await seedDevice(page);
  const post = page.getByText(/VINODEX BIOS/);

  // 1. The landing has no Back to press. `/` is the top of the site.
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Back', exact: true })).toHaveCount(0);
  await expect(post).toHaveCount(0);

  // 2. COLD on a site sub-page: no history to pop, so the fallback decides —
  //    and it must decide "up the site", not "into the app".
  await page.goto('/who-we-are');
  let back = page.getByRole('button', { name: 'Back', exact: true });
  await back.click();
  await page.waitForTimeout(400);
  expect(new URL(page.url()).pathname, 'cold Back on a site page left the site').toBe('/');
  await expect(post, 'cold Back on a site page booted the device').toHaveCount(0);

  // 3. WARM, and then warm-popped-back-onto-the-landing. Walking in and out
  //    puts `/` back on the initial history entry, which is where the cold
  //    branch lives again.
  await page.getByRole('button', { name: 'OUR WORK' }).click();
  await expect(page).toHaveURL(/\/apps$/);
  back = page.getByRole('button', { name: 'Back', exact: true });
  await back.click();
  await page.waitForTimeout(400);
  expect(new URL(page.url()).pathname).toBe('/');
  // Back on the landing again — still nothing to press, still no launch.
  await expect(page.getByRole('button', { name: 'Back', exact: true })).toHaveCount(0);
  await page.waitForTimeout(500);
  await expect(post, 'the device booted from the landing page').toHaveCount(0);
});

/**
 * The other half of v8#12's fallback, in its own test.
 *
 * It was the fourth step of the test above until the full suite ran it: five
 * navigations plus a real power-on walk tipped a single case past the 45s
 * budget under parallel load, while passing comfortably in isolation. Two
 * claims, two tests — which is what it should have been anyway, since "the
 * site's fallback goes up the site" and "the dex's fallback is untouched" are
 * different statements about different products.
 */
test('Back inside the app still falls back to the dex menu', async ({ page, consoleErrors }) => {
  void consoleErrors;
  await seedDevice(page);

  // Cold-opened, so there is no history and the fallback decides — the same
  // branch as above, answering the other way because the classifier says the
  // path is the app's.
  await enterDex(page, '/passport');
  await page.getByRole('button', { name: 'Back', exact: true }).first().click();
  await page.waitForTimeout(400);
  expect(new URL(page.url()).pathname, 'the dex fallback stopped landing on the menu').toBe('/dex');
});

/** The studio uses the larger LCD; the product keeps its hardware controls. */
test('marquee hardware appears only inside Vinodex', async ({ page, consoleErrors }) => {
  void consoleErrors;
  await seedDevice(page);

  for (const route of ['/', '/apps'] as const) {
    await page.goto(route);
    await expect(page.locator('.terminal-marquee')).toHaveCount(0);
    await expect(page.locator('footer')).toHaveCount(0);
  }

  // Vinodex keeps its own complete footer and marquee.
  await enterDex(page, '/dex');
  await page.waitForTimeout(600);
  await expect(page.locator('footer')).toHaveCount(1);
  await expect(page.locator('.terminal-marquee')).toHaveCount(1);
});
