import { test, expect, enterDex, seedDevice } from './fixtures';

/**
 * The design-change evidence: the core screens, photographed at the two
 * sizes the modernization plan names as its guardrail (phone first, then
 * desktop), in both screen modes.
 *
 * `screenshots.spec.ts` is the *skin* gate — it reads `:root` and proves the
 * chassis painted its own colours. This file is the other half of "verify
 * visually every step": the six screens the UI-MODERNIZATION-PLAN's stage 4
 * names (EntryTile via the listing, EncyclopediaList, EntryDetail, Passport,
 * ChipFilter, Bookmarks) plus the two front doors, at 390x844 and 1280x800.
 * Each file under `web/e2e/.shots/design-*` is what a before/after comparison
 * is made from; the assertions are the same "the LCD actually took the mode"
 * check the skin gate makes, so a blank white page cannot pass as a picture.
 *
 * The collection is seeded with three shelves and a rating so it photographs
 * a populated screen rather than three empty states.
 */
const SIZES: [string, number, number][] = [
  ['phone', 390, 844],
  ['desktop', 1280, 800],
];

const MODES: [string, string][] = [
  ['DARK', 'DARK'],
  ['LIGHT', 'LIGHT'],
];

const SCREENS: [string, string][] = [
  ['/', 'landing'],
  ['/privacy', 'privacy'],
  ['/who-we-are', 'who-we-are'],
  ['/dex', 'menu'],
  ['/list/GRAPES', 'listing'],
  ['/detail/G001', 'detail'],
  ['/passport', 'passport'],
  ['/chip-filter', 'chip-filter'],
  ['/saved', 'collection'],
];

for (const [sizeName, width, height] of SIZES) {
  test.describe(sizeName, () => {
    test.use({ viewport: { width, height } });

    for (const [modeName, mode] of MODES) {
      for (const [route, label] of SCREENS) {
        test(`${label} at ${sizeName} in ${modeName}`, async ({ page, consoleErrors }, testInfo) => {
          void consoleErrors;
          await seedDevice(page, {
            lcdMode: mode,
            bookmarkedEntryIDs: JSON.stringify(['G001', 'G002', 'R001']),
            wantToTryEntryIDs: JSON.stringify(['G003']),
            triedEntryIDs: JSON.stringify(['G001', 'G004', 'S001']),
            triedRatings: JSON.stringify({ G001: { rating: 4, note: 'Bright and moreish.', day: 20300 } }),
          });
          await enterDex(page, route);
          await page.waitForTimeout(900);
          // The professor's bubble sits over the reading text on the detail
          // and passport screens; a design shot is of the screen, not of him.
          const bubble = page.getByText('TAP TO DISMISS');
          if (await bubble.count()) {
            await bubble.first().click();
            await page.waitForTimeout(400);
          }

          const lcdPage = await page.evaluate(() =>
            getComputedStyle(document.documentElement).getPropertyValue('--lcd-page').trim(),
          );
          expect(lcdPage, 'the screen mode did not reach the LCD').not.toBe('');

          const name = `design-${label}-${sizeName}-${mode}`;
          const shot = await page.screenshot({ fullPage: false });
          await testInfo.attach(name, { body: shot, contentType: 'image/png' });
          await page.screenshot({ path: `web/e2e/.shots/${name}.png` });
        });
      }
    }
  });
}
