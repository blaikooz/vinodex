import { test, expect, seedDevice } from './fixtures';
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

/** The dex is behind an unlock code that persists; set it before first paint. */
const unlock = (page: Page) => seedDevice(page);

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
    await unlock(page);
    await page.goto(route);
    // The chassis always paints something; an empty body is a dead screen.
    await expect(page.locator('body')).not.toBeEmpty();
    await page.waitForTimeout(600);
  });
}

test('a grape entry and its lineage render', async ({ page, consoleErrors }) => {
    void consoleErrors;
  await unlock(page);
  await page.goto('/list/GRAPES');
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
  await unlock(page);
  await page.goto('/minigames');
  await page.waitForTimeout(600);
  const tiles = page.locator('.grid > button');
  await expect(tiles).toHaveCount(6);
  await expect(page.getByText("WHAT'S THAT")).toHaveCount(0);
  await expect(page.getByText('PROF. VINO')).toBeVisible();
});

test('the professor greets a fresh device and takes a name', async ({ page, consoleErrors }) => {
    void consoleErrors;
  // Deliberately NOT unlocked-past: this is the first-run flow.
  await page.addInitScript(() => {
    window.localStorage.setItem('unlockedAppIDs', JSON.stringify(['vinodex']));
    window.sessionStorage.setItem('booted', '1');
  });
  await page.goto('/dex');
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
  await unlock(page);
  await page.goto('/settings/SETTINGS');
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

test('the BIOS boots once a session and hands the device over', async ({ page, consoleErrors }) => {
    void consoleErrors;
  await page.addInitScript(() => {
    window.localStorage.setItem('unlockedAppIDs', JSON.stringify(['vinodex']));
    window.localStorage.setItem('firstTimeTriggersSeen', 'firstLaunch,firstLaunchNamed');
    window.localStorage.setItem('coachmarkOffered', 'true');
  });
  await page.goto('/dex');
  // The POST states what the device actually carries: the web ships
  // COUNTRY_GATE rows as entries, so its number is its own, not iOS's.
  await expect(page.getByText(/VINODEX BIOS/)).toBeVisible();
  await expect(page.getByText(/\d+ ENTRIES/)).toBeVisible();
  // And it gets out of the way.
  await expect(page.getByText(/VINODEX BIOS/)).toBeHidden({ timeout: 20_000 });
  // Second visit in the same session goes straight through.
  await page.goto('/passport');
  await expect(page.getByText(/VINODEX BIOS/)).toHaveCount(0);
});

/**
 * The hole that hid H1: the professor test seeded past the BIOS and the BIOS
 * test seeded past the professor, so the two were never up at once — and on
 * a genuinely fresh launch they are, with the intro card (z-85) and the
 * spotlight (z-80) drawing straight over the boot (z-70).
 */
test('the BIOS runs alone on a genuinely fresh device', async ({ page, consoleErrors }) => {
  void consoleErrors;
  // Nothing seeded but the unlock: no `booted`, no triggers, no coachmark.
  await page.addInitScript(() => {
    window.localStorage.setItem('unlockedAppIDs', JSON.stringify(['vinodex']));
  });
  await page.goto('/dex');

  // While the POST is up, nothing may cover it.
  await expect(page.getByText(/VINODEX BIOS/)).toBeVisible();
  await expect(page.getByRole('dialog', { name: /introduces himself/i })).toHaveCount(0);
  await expect(page.getByText(/TUTORIAL \d\/\d/)).toHaveCount(0);

  // And once it hands over, the first-run flow arrives.
  await expect(page.getByText(/VINODEX BIOS/)).toBeHidden({ timeout: 20_000 });
  await expect(page.getByRole('dialog', { name: /introduces himself/i })).toBeVisible({ timeout: 10_000 });
});

test('a returning untoured player is not spotlit over the BIOS', async ({ page, consoleErrors }) => {
  void consoleErrors;
  await page.addInitScript(() => {
    window.localStorage.setItem('unlockedAppIDs', JSON.stringify(['vinodex']));
    // Met the professor, never took the tour: the auto-start path.
    window.localStorage.setItem('firstTimeTriggersSeen', 'firstLaunch,firstLaunchNamed');
  });
  await page.goto('/dex');
  await expect(page.getByText(/VINODEX BIOS/)).toBeVisible();
  await expect(page.getByText(/TUTORIAL \d\/\d/)).toHaveCount(0);
  await expect(page.getByText(/VINODEX BIOS/)).toBeHidden({ timeout: 20_000 });
  // The tour takes over only after the device is handed to the player.
  await expect(page.getByText(/TUTORIAL \d\/\d/)).toBeVisible({ timeout: 10_000 });
});
