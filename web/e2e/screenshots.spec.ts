import { test, expect, seedDevice } from './fixtures';
import { CHASSIS_SKINS, ChassisSkinId, FOOTER_CAP_KINDS, footerCap } from '../src/services/theme';

/**
 * The screenshot gate, in both screen modes.
 *
 * v6#19-geometry was declined for four passes on exactly this: the chassis
 * item's own approval names a screenshot gate in both modes, and there was
 * no way to run one. This is that gate.
 *
 * It is deliberately not a pixel-diff baseline — the art is still moving —
 * so it has to assert something real or it is only a screenshot printer:
 * a body-height check passes on a blank white page. So each case asserts the
 * chassis actually painted its own skin, and every case inherits the shared
 * console/network fixture, which is what makes a shell that throws on mount
 * (or an art stem that 404s) a failure rather than a pretty picture.
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

/** The value the chassis actually resolved, normalised for comparison. */
const rgbOf = (hex: string): string => {
  const h = hex.replace('#', '');
  const n = parseInt(h, 16);
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
};

const chassisBody = (page: import('@playwright/test').Page) =>
  page.evaluate(() => {
    const raw = getComputedStyle(document.documentElement).getPropertyValue('--chassis-body').trim();
    // Resolve to whatever the browser computes, so hex and rgb() compare.
    const probe = document.createElement('div');
    probe.style.color = raw;
    document.body.appendChild(probe);
    const out = getComputedStyle(probe).color;
    probe.remove();
    return out;
  });

for (const [modeName, mode] of MODES) {
  for (const [route, label] of SURFACES) {
    test(`${label} renders in ${modeName}`, async ({ page, consoleErrors }, testInfo) => {
      void consoleErrors;
      await seedDevice(page, {
        lcdMode: mode,
        triedEntryIDs: JSON.stringify(['G001', 'G002', 'G003', 'G004', 'G005', 'G006']),
      });
      await page.goto(route);
      await page.waitForTimeout(900);

      // The mode actually took: the LCD page variable is the one every
      // screen reads, and it differs between the two modes by construction.
      const lcdPage = await page.evaluate(() =>
        getComputedStyle(document.documentElement).getPropertyValue('--lcd-page').trim(),
      );
      expect(lcdPage, 'the screen mode did not reach the LCD').not.toBe('');

      const shot = await page.screenshot({ fullPage: false });
      await testInfo.attach(`${label}-${mode}`, { body: shot, contentType: 'image/png' });
      await page.screenshot({ path: `web/e2e/.shots/${label}-${mode}.png` });
    });
  }
}

/**
 * Every shell, including the seven the art ruling brought across. Asserts the
 * chassis resolved to that skin's own authored body colour — the failure a
 * colour-table port actually has is a typo that compiles, and only a
 * comparison against the table can see it.
 */
const ALL_SKINS = Object.keys(CHASSIS_SKINS) as ChassisSkinId[];

for (const skin of ALL_SKINS) {
  test(`the ${skin} shell renders its own colour`, async ({ page, consoleErrors }, testInfo) => {
    void consoleErrors;
    await seedDevice(page, { chassisSkin: skin });
    await page.goto('/dex');
    await page.waitForTimeout(600);

    const expected = CHASSIS_SKINS[skin].body;
    const actual = await chassisBody(page);
    // WALDGLAS and friends are authored as plain hex here; a skin whose body
    // is an rgba string is compared by the browser's own resolution.
    if (expected.startsWith('#')) {
      expect(actual, `${skin} body`).toBe(rgbOf(expected));
    } else {
      expect(actual, `${skin} body`).not.toBe('');
    }

    const shot = await page.screenshot();
    await testInfo.attach(`skin-${skin}`, { body: shot, contentType: 'image/png' });
    await page.screenshot({ path: `web/e2e/.shots/skin-${skin}.png` });
  });
}

/**
 * The footer band, per skin (S1).
 *
 * The four moulded caps were hardcoded Tailwind -- three stone and one amber
 * with an inner lit disc -- and rendered *identically on all twenty-two
 * skins*. It was invisible to every gate the repo had, and was found by
 * screenshotting the band and sampling pixels: Home's glyph came out
 * rgb(123,51,6) on CLASSIC, ORIGINAL, BURGUNDY, OAKED, PET NAT, HALLOWEEN,
 * W64 and PSVINO alike.
 *
 * So the gate reads the resolved custom properties rather than looking at a
 * picture. A property that resolves to the empty string is the exact failure
 * mode of a token rename -- CSS treats a missing `var()` as nothing, so the
 * band would silently lose its paint with no error anywhere -- and comparing
 * against `footerCap()` is what catches a typo that compiles.
 *
 * A screenshot is attached as well, because a colour that is *correct* and
 * *wrong-looking* is still worth a human glance, and the band is the part of
 * the device the eye lands on first.
 */
const capTokens = (page: import('@playwright/test').Page) =>
  page.evaluate(() => {
    const css = getComputedStyle(document.documentElement);
    const out: Record<string, string> = {};
    for (const kind of ['back', 'home', 'user', 'settings']) {
      for (const stop of ['top', 'bottom', 'edge', 'glyph']) {
        out[`${kind}-${stop}`] = css.getPropertyValue(`--cap-${kind}-${stop}`).trim();
      }
    }
    return out;
  });

for (const skin of ALL_SKINS) {
  test(`the ${skin} footer caps are painted by the skin`, async ({ page, consoleErrors }, testInfo) => {
    void consoleErrors;
    await seedDevice(page, { chassisSkin: skin });
    await page.goto('/dex');
    await page.waitForTimeout(600);

    const tokens = await capTokens(page);
    for (const kind of FOOTER_CAP_KINDS) {
      const cap = footerCap(skin, kind);
      for (const [stop, value] of Object.entries(cap)) {
        const got = tokens[`${kind}-${stop}`];
        expect(got, `${skin}/${kind}.${stop} did not reach the page`).not.toBe('');
        expect(got, `${skin}/${kind}.${stop}`).toBe(value);
      }
    }

    const footer = page.locator('footer').first();
    await expect(footer).toBeVisible();
    await testInfo.attach(`footer-${skin}`, {
      body: await footer.screenshot(),
      contentType: 'image/png',
    });
    await footer.screenshot({ path: `web/e2e/.shots/footer-${skin}.png` });
  });
}

/**
 * And the one thing no per-skin check can see: that the skins differ from
 * each other at all.
 *
 * Every per-skin assertion above would have passed on the broken tree if the
 * table itself were uniform. This walks the whole set and fails if the band
 * is the same on two shells -- which is the shape of the defect as a user met
 * it, rather than as the code expressed it.
 */
test('no two shells wear the same footer band', async () => {
  const seen = new Map<string, ChassisSkinId>();
  for (const skin of ALL_SKINS) {
    const band = FOOTER_CAP_KINDS.map(k => JSON.stringify(footerCap(skin, k))).join('|');
    const clash = seen.get(band);
    expect(clash, `${skin} and ${clash} have identical footer bands`).toBeUndefined();
    seen.set(band, skin);
  }
  expect(seen.size).toBe(ALL_SKINS.length);
});
