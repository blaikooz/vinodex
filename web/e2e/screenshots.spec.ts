import { test, expect, Page } from '@playwright/test';

/**
 * The screenshot gate, in both screen modes.
 *
 * v6#19-geometry was declined for four passes on exactly this: the chassis
 * item's own approval names a screenshot gate in both modes, and there was
 * no way to run one. This is that gate. It is deliberately not a
 * pixel-diff baseline — the art is still moving — it captures the surfaces
 * a chassis change would break so a human can eyeball a change set, and it
 * asserts the frame is actually drawn rather than blank.
 *
 * DARK and LIGHT because the LCD's contrast is the thing skins are most
 * able to ruin, and the standing craft rule is contrast in *both* modes.
 */
const MODES: [string, string][] = [
  ['DARK', 'DARK'],
  ['LIGHT', 'LIGHT'],
];

const SURFACES: [string, string][] = [
  ['/dex', 'menu'],
  ['/minigames', 'tools'],
  ['/passport', 'passport'],
  ['/prof-vino', 'prof-vino'],
  ['/settings/CUSTOMIZE', 'customize'],
  ['/list/GRAPES', 'listing'],
];

const seed = async (page: Page, lcdMode: string) => {
  await page.addInitScript(mode => {
    window.localStorage.setItem('unlockedAppIDs', JSON.stringify(['vinodex']));
    window.sessionStorage.setItem('booted', '1');
    window.localStorage.setItem('firstTimeTriggersSeen', 'firstLaunch,firstLaunchNamed');
    window.localStorage.setItem('coachmarkOffered', 'true');
    window.localStorage.setItem('lcdMode', mode);
    // A shelf, so the passport and its rank card have something to draw.
    window.localStorage.setItem('triedEntryIDs', JSON.stringify(['G001', 'G002', 'G003', 'G004', 'G005', 'G006']));
  }, lcdMode);
};

for (const [modeName, mode] of MODES) {
  for (const [route, label] of SURFACES) {
    test(`${label} renders in ${modeName}`, async ({ page }, testInfo) => {
      await seed(page, mode);
      await page.goto(route);
      await page.waitForTimeout(900);

      // The frame is drawn: the chassis paints a non-zero box.
      const box = await page.locator('body').boundingBox();
      expect(box?.height ?? 0).toBeGreaterThan(200);

      const shot = await page.screenshot({ fullPage: false });
      await testInfo.attach(`${label}-${mode}`, { body: shot, contentType: 'image/png' });
      await page.screenshot({ path: `web/e2e/.shots/${label}-${mode}.png` });
    });
  }
}

/**
 * The new shells (v6#19-geometry). One capture each so a colour-table typo
 * is visible rather than merely compiling — the failure mode a token port
 * has, and the reason this item waited for the gate.
 */
const NEW_SKINS = ['PSVINO', 'GRIS_DE_GRIS', 'ORANGE_WINE', 'PET_NAT', 'WALDGLAS', 'HALLOWEEN', 'W64'];

for (const skin of NEW_SKINS) {
  test(`the ${skin} shell renders`, async ({ page }, testInfo) => {
    await page.addInitScript(s => {
      window.localStorage.setItem('unlockedAppIDs', JSON.stringify(['vinodex']));
      window.sessionStorage.setItem('booted', '1');
      window.localStorage.setItem('firstTimeTriggersSeen', 'firstLaunch,firstLaunchNamed');
      window.localStorage.setItem('coachmarkOffered', 'true');
      window.localStorage.setItem('chassisSkin', s);
    }, skin);
    await page.goto('/dex');
    await page.waitForTimeout(700);
    const shot = await page.screenshot();
    await testInfo.attach(`skin-${skin}`, { body: shot, contentType: 'image/png' });
    await page.screenshot({ path: `web/e2e/.shots/skin-${skin}.png` });
  });
}
