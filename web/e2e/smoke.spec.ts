import { test, expect, enterDex, seedDevice, seedFreshDevice } from './fixtures';
import type { Page } from '@playwright/test';

/**
 * Render smoke over the routes the v6 sweeps built and nobody had ever
 * looked at. Every test fails on a console error, a page error, a failed
 * request or any 4xx/5xx — see `fixtures.ts` — which is the point: a screen
 * that throws on mount, or an <img> pointing at a stem that does not exist,
 * still typechecks and still passes vitest.
 *
 * Each test takes `consoleErrors` so the fixture is actually instantiated;
 * Playwright only builds a fixture a test asks for.
 */

/** Past the professor and the walkthrough offer, so the screen under test is
 *  the thing on screen. The BIOS is walked through by `enterDex`, not seeded
 *  past (v8#2). */
const seed = (page: Page) => seedDevice(page);

const routes: [string, string][] = [
  ['/dex', 'the main menu'],
  ['/quiz', 'the wine exam'],
  ['/prof-vino', "the professor's page"],
  ['/passport', 'the passport'],
  ['/minigames', 'the tools shelf'],
  ['/firmware', 'the firmware log'],
  ['/cheats', 'the cheat console'],
  ['/support', 'support'],
  ['/recommendations', 'you might like'],
  ['/settings', 'the settings grid'],
  ['/settings/CUSTOMIZE', 'the customize panel'],
  ['/settings/DEV', 'the dev panel'],
  ['/list/GRAPES', 'the grape listing'],
  ['/saved', 'the collection'],
  ['/walkthrough', 'the tutorial'],
];

for (const [route, name] of routes) {
  test(`renders ${name} (${route})`, async ({ page, consoleErrors }) => {
    void consoleErrors;
    await seed(page);
    await enterDex(page, route);
    await expect(page).toHaveTitle('VINODEX');
    // The chassis always paints something; an empty body is a dead screen.
    await expect(page.locator('body')).not.toBeEmpty();
    await page.waitForTimeout(600);
  });
}

test('a grape entry and its lineage render', async ({ page, consoleErrors }) => {
    void consoleErrors;
  await seed(page);
  await enterDex(page, '/list/GRAPES');
  await page.waitForTimeout(800);
  const firstRow = page.locator('[data-coachmark="listingRow"] button').first();
  await firstRow.click();
  await expect(page).toHaveURL(/\/detail\//);
  await page.waitForTimeout(600);
  // The lineage door only appears for a connected grape; walk to one.
  await page.goto('/lineage/G001');
  await page.waitForTimeout(600);
  await expect(page.locator('body')).not.toBeEmpty();
});

test('the tools shelf is the fixed six', async ({ page, consoleErrors }) => {
    void consoleErrors;
  await seed(page);
  await enterDex(page, '/minigames');
  await page.waitForTimeout(600);
  const tiles = page.locator('[data-ios-grid="tools"] > .ios-grid-tile');
  await expect(tiles).toHaveCount(6);
  await expect(page.getByText("WHAT'S THAT")).toHaveCount(0);
  await expect(page.getByText('PROF. VINO')).toBeVisible();
});

test('the professor greets a fresh device and takes a name', async ({ page, consoleErrors }) => {
    void consoleErrors;
  // Deliberately NOT seeded past first run: this is the first-run flow. The
  // BIOS is walked rather than seeded away (v8#2) -- it runs on every entry
  // now, and pressing past it is what a player does.
  await enterDex(page, '/dex');
  await page.waitForTimeout(900);
  const card = page.getByRole('dialog', { name: /introduces himself/i });
  await expect(card).toBeVisible();
  await page.getByLabel('Your name').fill('PAT');
  await page.getByRole('button', { name: 'SUBMIT' }).click();
  // The after-name line lands as the card leaves, and greets by name.
  await expect(page.getByText(/Pleasure, PAT/)).toBeVisible({ timeout: 5000 });
});

test('the stored-data dialogs open and refuse a foreign file', async ({ page, consoleErrors }) => {
    void consoleErrors;
  await seed(page);
  await enterDex(page, '/settings/SETTINGS');
  await page.waitForTimeout(600);
  await page.getByRole('button', { name: /CLEAR SAVED DATA/ }).click();
  await expect(page.getByText('CLEAR SAVED DATA?')).toBeVisible();
  await page.getByRole('button', { name: 'CANCEL' }).click();
  // A file that is not ours is refused by name, not silently ignored.
  await page.setInputFiles('input[type=file]', {
    name: 'not-ours.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ app: 'somebody-else', format: 1 })),
  });
  await expect(page.getByText(/Not a Vinodex backup/)).toBeVisible({ timeout: 5000 });
});

/**
 * The BIOS runs every time the app is opened, and never on the site (v8#2).
 *
 * **This replaces "the BIOS boots once a session".** That test's second half
 * navigated to `/passport` and asserted the boot did *not* run, which was the
 * `sessionStorage 'booted'` contract stated as a browser test. The contract is
 * gone: boot is no longer a session fact, it is what happens when you open the
 * app. Rewritten rather than deleted, and the new assertions are the harder
 * ones -- the old test could not tell "booted once" from "booted never again",
 * and could say nothing at all about the site, which is where the ruling's
 * other half lives.
 *
 * Three things, in the order a visitor meets them: the site does not boot, the
 * crossing into the app does, and moving around inside the app does not.
 */
test('the BIOS runs on entering the app, and never on the site', async ({ page, consoleErrors }) => {
    void consoleErrors;
  await seedDevice(page);
  const post = page.getByText(/VINODEX BIOS/);

  // 1. The company site is the landing, and nothing powers on there.
  await page.goto('/');
  await page.waitForTimeout(700);
  await expect(post).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'HORIZON/GODOT' })).toBeVisible();

  // 2. OUR WORK -> VINODEX -> OPEN VINODEX, with no keypad in the way (v8#3).
  await page.getByRole('button', { name: 'OUR WORK' }).click();
  await page.getByRole('button', { name: /VINODEX/ }).first().click();
  await expect(page).toHaveURL(/\/project\/vinodex$/);
  await page.getByRole('button', { name: /OPEN VINODEX/ }).click();

  // The POST states what the device actually carries: the web ships
  // COUNTRY_GATE rows as entries, so its number is its own, not iOS's.
  await expect(post).toBeVisible();
  await expect(page.getByText(/\d+ ENTRIES/)).toBeVisible();
  await page.getByRole('button', { name: 'Skip boot' }).click();
  await expect(post).toBeHidden();
  await expect(page).toHaveURL(/\/dex$/);

  // 3. Inside the app, nothing power-cycles under you.
  await page.goto('/passport');
  await page.waitForTimeout(700);
  await expect(post).toHaveCount(0);
});

/**
 * And it runs *again* on the next entry -- the half of the ruling that the old
 * once-per-session model made impossible to state (v8#2).
 */
test('the BIOS runs again the second time you open the app', async ({ page, consoleErrors }) => {
    void consoleErrors;
  await seedDevice(page);
  const post = page.getByText(/VINODEX BIOS/);

  await enterDex(page, '/dex');
  await expect(post).toHaveCount(0);

  // Back out past the menu: the site is what the app sits on (v8#9).
  await page.getByRole('button', { name: 'Back', exact: true }).first().click();
  await page.waitForTimeout(400);
  expect(new URL(page.url()).pathname).toBe('/');
  await expect(post).toHaveCount(0);

  // In again. A session flag would have suppressed this; nothing does.
  await page.getByRole('button', { name: 'OUR WORK' }).click();
  await page.getByRole('button', { name: /VINODEX/ }).first().click();
  await page.getByRole('button', { name: /OPEN VINODEX/ }).click();
  await expect(post).toBeVisible();
  await page.getByRole('button', { name: 'Skip boot' }).click();
  await expect(post).toBeHidden();
});

/**
 * A shared link opens the page, not the app (v8#2).
 *
 * The one deep-link exception, and the reason for it: `/detail/:id` is the
 * share surface -- 440 prerendered OG pages exist for exactly these URLs -- so
 * a stranger who taps one gets the entry rather than a power-on test in front
 * of it. And nothing power-cycles under them afterwards, which is what the
 * second half checks: opening a related screen from there is in-app
 * navigation.
 */
test('a shared entry link does not boot the device', async ({ page, consoleErrors }) => {
    void consoleErrors;
  // **Deliberately not seeded past the professor** (v8#11). Arriving at a grape
  // fires `firstGrapeViewed`, so his bubble is up when Home is pressed below --
  // and until v0.3.0 that bubble sat on the button band and swallowed the
  // click. This test is where the bug was found; it is now the test that
  // prevents it.
  await seedDevice(page);
  const post = page.getByText(/VINODEX BIOS/);

  await page.goto('/detail/G001');
  await page.waitForTimeout(700);
  await expect(post).toHaveCount(0);
  await expect(page).toHaveURL(/\/detail\/G001$/);

  // Asserted as present before the press, so a bubble that stopped appearing
  // at all could not make the click succeed for the wrong reason.
  await expect(page.getByText('PROF. VINO')).toBeVisible();

  // Home takes them into the app proper, and still does not power-cycle:
  // they are already inside the device.
  await page.getByRole('button', { name: 'Home', exact: true }).first().click();
  await expect(page).toHaveURL(/\/dex$/);
  await page.waitForTimeout(700);
  await expect(post).toHaveCount(0);
});

/**
 * The hole that hid H1: the professor test seeded past the BIOS and the BIOS
 * test seeded past the professor, so the two were never up at once — and on
 * a genuinely fresh launch they are, with the intro card (z-85) and the
 * spotlight (z-80) drawing straight over the boot (z-70).
 */
test('the BIOS runs alone on a genuinely fresh device', async ({ page, consoleErrors }) => {
  void consoleErrors;
  // Nothing seeded at all: no triggers, no coachmark, and -- since v0.3.0 --
  // nothing else either, because the two seeds that used to be left out named
  // facts that no longer exist (v8#2, v8#3).
  //
  // Through `seedFreshDevice` since L6. This test hand-rolled its own init
  // script, and W20 then added a *second*, weaker first-run test alongside it
  // purely to give the new fixture a caller — asserting only that the body was
  // non-empty and that two chassis buttons existed, both of which this test
  // and every other test already cover. The duplicate is deleted and the
  // fixture serves the test that actually checks first run.
  //
  // `page.goto` rather than `enterDex`, and that is the point: this is the one
  // test that must *watch* the boot rather than press past it. A cold arrival
  // on a dex route is a launch, so it boots (v8#2) -- the same window the old
  // `booted`-absent seed opened, reached through the model instead of around
  // it.
  await seedFreshDevice(page);
  await page.goto('/dex');

  // While the POST is up, nothing may cover it.
  await expect(page.getByText(/VINODEX BIOS/)).toBeVisible();
  await expect(page.getByRole('dialog', { name: /introduces himself/i })).toHaveCount(0);
  await expect(page.getByText(/TUTORIAL \d\/\d/)).toHaveCount(0);

  // It waits at the BIOS until the player explicitly hands over.
  await page.getByRole('button', { name: 'Skip boot' }).click();
  await expect(page.getByText(/VINODEX BIOS/)).toBeHidden();
  await expect(page.getByRole('dialog', { name: /introduces himself/i })).toBeVisible({ timeout: 10_000 });
});

test('a returning untoured player is not spotlit over the BIOS', async ({ page, consoleErrors }) => {
  void consoleErrors;
  await page.addInitScript(() => {
    // Met the professor, never took the tour: the auto-start path. There is no
    // `booted` to leave out any more -- a cold arrival on a dex route boots by
    // the model (v8#2), which is exactly the window this test needs.
    window.localStorage.setItem('firstTimeTriggersSeen', 'firstLaunch,firstLaunchNamed');
  });
  await page.goto('/dex');
  await expect(page.getByText(/VINODEX BIOS/)).toBeVisible();
  await expect(page.getByText(/TUTORIAL \d\/\d/)).toHaveCount(0);
  await page.getByRole('button', { name: 'Skip boot' }).click();
  await expect(page.getByText(/VINODEX BIOS/)).toBeHidden();
  // The tour takes over only after the device is handed to the player.
  await expect(page.getByText(/TUTORIAL \d\/\d/)).toBeVisible({ timeout: 10_000 });
});

/**
 * One detail route per category (W3).
 *
 * The suite opened exactly one entry — a grape, by clicking the first row of
 * `/list/GRAPES` — while `EntryDetail` branches seven ways with separate
 * header-tile code down each branch. Six of the app's largest screen's seven
 * shapes had never been rendered in a real browser, where the things that
 * actually break live: an `<img>` pointing at an art stem that does not
 * exist, a lazy chunk that fails to resolve, a `TypeError` in a tile.
 *
 * `EntryDetail.categories.test.tsx` renders the same six under vitest and
 * pins their section lists. This is the other half: vitest proves the tree is
 * built, the browser proves the assets behind it resolve. The console-error
 * fixture is what makes that second claim mean anything — a 404 on a flavour
 * portrait fails the test.
 *
 * Ids rather than a click-through per category, deliberately: reaching a
 * continent by navigation is four clicks that test the *listing*, and the
 * listing already has its own route smoke above.
 */
const DETAIL_IDS: [string, string][] = [
  ['G001', 'a grape'],
  ['R001', 'a region'],
  ['S001', 'a style'],
  ['FLAVOR-BLACKCURRANT', 'a flavour'],
  ['CONT_NORTH_AMERICA', 'a continent'],
  ['STAL001', 'a country gate'],
];

for (const [id, name] of DETAIL_IDS) {
  test(`renders the detail readout for ${name} (/detail/${id})`, async ({ page, consoleErrors }) => {
    void consoleErrors;
    await seed(page);
    await enterDex(page, `/detail/${id}`);
    await page.waitForTimeout(700);
    // An unknown id redirects to /dex, so staying on the route is the check
    // that the fixture id is real — a silent redirect would make this test
    // pass while rendering the menu.
    await expect(page).toHaveURL(new RegExp(`/detail/${id}$`));
    await expect(page.locator('body')).not.toBeEmpty();
  });
}



/**
 * The lamp chooser's modality, proved rather than declared (W-1).
 *
 * `aria-modal="true"` is a **claim about the surroundings**: it tells assistive
 * technology that everything outside the dialog is inert. The chooser's scrim
 * only covers the LCD, so before `inert` was threaded through the chassis the
 * claim was false in a way a pointer could disprove in two clicks — the review
 * opened the chooser, pressed the SETTINGS cap and navigated away from
 * underneath it, then pressed the other lamp and navigated again.
 *
 * jsdom does not implement `inert`, so this has to be a browser test. It
 * asserts the two exact routes that were reachable.
 */
test('nothing outside the lamp chooser answers a pointer', async ({ page, consoleErrors }) => {
  void consoleErrors;
  await seedDevice(page, { chassisSkin: 'CLASSIC' });
  await enterDex(page, '/dex');
  await page.waitForTimeout(700);

  const lamps = page.locator('.lamp-hit');
  await lamps.first().click({ button: 'right' });
  await expect(page.getByRole('dialog')).toBeVisible();

  // The cap that used to navigate to /settings. Scoped to the footer, because
  // with the chooser open there is also a SETTINGS chip inside it — and that
  // one is supposed to work. `force`, because the whole point is that a real
  // user's click lands on an inert element; Playwright's actionability checks
  // would otherwise refuse and the test would pass for the wrong reason.
  const settingsCap = page.locator('footer').getByRole('button', { name: 'Settings' });
  await settingsCap.click({ force: true });
  await page.waitForTimeout(400);
  await expect(page).toHaveURL(/\/dex$/);
  await expect(page.getByRole('dialog')).toBeVisible();

  // The other lamp, which used to navigate to /settings/CUSTOMIZE.
  await lamps.nth(1).click({ force: true });
  await page.waitForTimeout(400);
  await expect(page).toHaveURL(/\/dex$/);
  await expect(page.getByRole('dialog')).toBeVisible();

  // And the island's orb, the third surface outside the LCD.
  await expect(page.locator('.island-strip')).toHaveAttribute('inert', '');

  // Closing gives the device back, and returns focus to the lamp that raised
  // it — a dialog that leaves focus on <body> puts a keyboard user at the top
  // of the document with no idea where the lamp went.
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(await page.evaluate(() => document.activeElement?.getAttribute('aria-label'))).toBe('TOOLS');
  await settingsCap.click();
  await page.waitForTimeout(500);
  await expect(page).toHaveURL(/\/settings$/);
});

/**
 * The engraved legend keeps iOS's floor as well as its cap (W-6).
 *
 * `LampLegend.size` clamps to `max(min(bandPillLabel, fitted), 6)`. The web had
 * the cap and not the floor, and measured 6.28px at a 320px viewport with
 * nothing to stop it going further. Below the floor iOS truncates rather than
 * shrinking — "a visible failure rather than the silent per-label refitting
 * that was the bug" — so the clip is checked with it.
 */
test('the lamp legend never shrinks below its floor', async ({ page, consoleErrors }) => {
  void consoleErrors;
  await page.setViewportSize({ width: 320, height: 720 });
  await seedDevice(page, { chassisSkin: 'CLASSIC' });
  await enterDex(page, '/dex');
  await page.waitForTimeout(700);

  const legends = page.locator('.lamp-legend');
  await expect(legends).toHaveCount(2);
  const sizes = await legends.evaluateAll(ns =>
    ns.map(n => ({
      size: parseFloat(getComputedStyle(n).fontSize),
      overflow: getComputedStyle(n).overflow,
    })),
  );
  for (const { size, overflow } of sizes) {
    expect(size, 'the legend fell through iOS 6pt floor').toBeGreaterThanOrEqual(6);
    expect(overflow, 'nothing clips the legend, so it spills instead of truncating').toBe('hidden');
  }
  // D1 still holds at the floor: both lamps wear one size.
  expect(sizes[0]!.size).toBe(sizes[1]!.size);
});

/**
 * A return visit with the network off (v0.6.21, Phase 3). Deliberately
 * without the `consoleErrors` fixture: offline, every request the service
 * worker cannot answer fails by definition, and that is the condition under
 * test, not a defect. What is asserted is the thing the precache exists for:
 * the shell, the catalogue and the menu come back with no network at all,
 * and the LCD says OFFLINE while it lasts.
 */
test('a return visit works with the network off, and the LCD says so', async ({ page, context }) => {
  test.setTimeout(150_000);
  await seedDevice(page);
  await enterDex(page, '/dex');
  await page.evaluate(() => navigator.serviceWorker.ready);
  // The precache is 400+ entries; wait for it to finish rather than racing it.
  await page.waitForFunction(async () => {
    const names = await caches.keys();
    const name = names.find(n => n.includes('precache'));
    if (!name) return false;
    return (await (await caches.open(name)).keys()).length > 400;
  }, null, { timeout: 90_000 });

  await context.setOffline(true);
  try {
    await page.reload();
    const skip = page.getByRole('button', { name: 'Skip boot' });
    await expect(skip).toBeVisible({ timeout: 20_000 });
    await skip.click({ force: true });
    await expect(page.getByRole('button', { name: /GRAPES/ })).toBeVisible();
  } finally {
    await context.setOffline(false);
  }
});

/**
 * The OFFLINE pill, driven the way the browser drives it. `setOffline` above
 * cuts the network but does not flip `navigator.onLine` in this Chromium, so
 * the pill is proved from the signal it actually reads: the flag and the
 * `offline` / `online` events.
 */
test('the LCD says OFFLINE while the browser says so', async ({ page, consoleErrors }) => {
  void consoleErrors;
  await page.addInitScript(() => {
    let online = false;
    Object.defineProperty(navigator, 'onLine', { get: () => online, configurable: true });
    (window as unknown as { __setOnline: (v: boolean) => void }).__setOnline = (v: boolean) => {
      online = v;
      window.dispatchEvent(new Event(v ? 'online' : 'offline'));
    };
  });
  await seedDevice(page);
  await page.goto('/');
  const pill = page.locator('[data-offline-pill]');
  await expect(pill).toBeVisible();
  await expect(pill).toHaveText('OFFLINE');
  await page.evaluate(() => (window as unknown as { __setOnline: (v: boolean) => void }).__setOnline(true));
  await expect(pill).toHaveCount(0);
  await page.evaluate(() => (window as unknown as { __setOnline: (v: boolean) => void }).__setOnline(false));
  await expect(pill).toBeVisible();
});

/** SETTINGS ▸ DATA offers the install, in whichever shape this browser has (v0.6.22). */
test('SETTINGS ▸ DATA carries the INSTALL row', async ({ page, consoleErrors }) => {
  void consoleErrors;
  await seedDevice(page);
  await enterDex(page, '/settings/DATA');
  const row = page.locator('[data-install-row]');
  await expect(row).toHaveCount(1);
  // Headless Chromium on 127.0.0.1 may or may not make the offer; either
  // shape is a row that says INSTALL, never nothing.
  await expect(row).toContainText(/INSTALL VINODEX|ADD TO HOME SCREEN/);
});
