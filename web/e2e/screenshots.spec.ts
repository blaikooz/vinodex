import { test, expect, seedDevice } from './fixtures';
import {
  CHASSIS_SKINS,
  ChassisSkinId,
  FOOTER_CAP_KINDS,
  SKIN_LIGHTS,
  footerCap,
  lampInk,
} from '../src/services/theme';

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
 * The lamps, per skin — the group the gate did not cover.
 *
 * The cap gate above exists because a colour-table port's real failure is "a
 * typo that compiles, and only a comparison against the table can see it".
 * That was exactly as true of the lamps and nothing checked them: the trio,
 * the two marquee pills and the derived ink all reach the page as custom
 * properties, and a renamed token un-paints them in silence because CSS
 * resolves a missing `var()` to nothing.
 *
 * Three things are asserted, and each has its own failure mode:
 *
 * 1. **The trio matches `SKIN_LIGHTS`** — the typo case.
 * 2. **`--chassis-lampN-ink` is a real colour and is darker than its edge** —
 *    the derivation case. `lampInk` returning its input unchanged would leave
 *    the legend the same colour as the rim it is cut beside, which is the
 *    printed-on-the-cap reading iOS 0.7.5's A1 removed.
 * 3. **The two lamp buttons carry their pins' names** — the case where the
 *    chassis paints correctly and the control means nothing.
 */
const lampTokens = (page: import('@playwright/test').Page) =>
  page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    const out: Record<string, string> = {};
    for (const n of [1, 2, 3]) {
      for (const stop of ['', '-edge', '-ink']) {
        out[`lamp${n}${stop}`] = root.getPropertyValue(`--chassis-lamp${n}${stop}`).trim();
      }
    }
    return out;
  });

/** Relative luminance, for "the ink is a further stop down from the edge". */
const lum = (hex: string): number => {
  const m = /^#([0-9a-fA-F]{6})$/.exec(hex);
  if (!m) return 1;
  const n = parseInt(m[1]!, 16);
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
};

for (const skin of ALL_SKINS) {
  test(`the ${skin} lamps are painted by the skin`, async ({ page, consoleErrors }, testInfo) => {
    void consoleErrors;
    await seedDevice(page, { chassisSkin: skin });
    await page.goto('/dex');
    await page.waitForTimeout(600);

    const tokens = await lampTokens(page);
    const lamps = SKIN_LIGHTS[skin].lamps;
    for (const [i, [fill, edge]] of lamps.entries()) {
      const n = i + 1;
      expect(tokens[`lamp${n}`], `${skin}/lamp${n} did not reach the page`).toBe(fill);
      expect(tokens[`lamp${n}-edge`], `${skin}/lamp${n} edge`).toBe(edge);
      // Derived rather than authored, so this checks the derivation and not a
      // second copy of the table.
      expect(tokens[`lamp${n}-ink`], `${skin}/lamp${n} ink`).toBe(lampInk(edge));
      expect(
        lum(tokens[`lamp${n}-ink`]!),
        `${skin}/lamp${n}: the ink is not a stop below its own rim`,
      ).toBeLessThan(lum(edge) + 0.001);
    }

    // The two marquee lamps are the OUTER two of the trio, and they are
    // controls: each is announced as the pin it currently holds.
    const buttons = page.locator('.lamp-hit');
    await expect(buttons).toHaveCount(2);
    expect(await buttons.evaluateAll(ns => ns.map(n => n.getAttribute('aria-label'))))
      .toEqual(['TOOLS', 'CUSTOMIZE']);

    const strip = page.locator('.island-strip').first();
    await expect(strip).toBeVisible();
    await testInfo.attach(`island-${skin}`, {
      body: await strip.screenshot(),
      contentType: 'image/png',
    });
    await strip.screenshot({ path: `web/e2e/.shots/island-${skin}.png` });
  });
}

/**
 * The island's two derivations, measured in a real browser.
 *
 * iOS spent four batches tuning the orb against the trio, then stated the rules
 * so the next refinement would be one line: the orb is as LONG as the whole
 * trio (0.7.9, A1) and as TALL as one lamp (0.8.0, C1). A stylesheet can state
 * both and a layout can still not honour them — a `calc()` against the wrong
 * custom property resolves to nothing and collapses in silence — so the check
 * is on the boxes the browser actually laid out.
 */
test('the orb is the trio long and one lamp tall', async ({ page, consoleErrors }) => {
  void consoleErrors;
  await seedDevice(page, { chassisSkin: 'CLASSIC' });
  await page.goto('/dex');
  await page.waitForTimeout(600);

  const m = await page.evaluate(() => {
    const box = (el: Element) => {
      const b = el.getBoundingClientRect();
      return { w: +b.width.toFixed(2), h: +b.height.toFixed(2), l: b.left, r: b.right };
    };
    const orb = document.querySelector('.island-orb.recessed-lamp')!;
    const lamps = [...document.querySelectorAll('.island-lamp')];
    return { orb: box(orb), lamps: lamps.map(box) };
  });

  expect(m.lamps).toHaveLength(3);
  // A1. The trio's span is the first lamp's left edge to the third's right.
  expect(m.orb.w, 'A1: the orb is not the length of the trio')
    .toBeCloseTo(m.lamps[2]!.r - m.lamps[0]!.l, 1);
  // C1. An identity function on purpose, so a preview cannot agree by accident.
  expect(m.orb.h, 'C1: the orb is not one lamp tall').toBeCloseTo(m.lamps[0]!.h, 1);
  // And the trio is square, which is what makes "one lamp tall" also mean
  // "one lamp wide" and the two clusters a matched pair.
  for (const l of m.lamps) expect(l.w).toBeCloseTo(l.h, 1);
});

// The 'no two shells wear the same band' assertion used to sit here. It
// touches no browser -- it calls footerCap() and compares strings -- and was
// costing a Chromium launch on the slowest gate in the repo to do it (L10).
// It lives in footerCap.test.ts now, where it runs in milliseconds. What
// stays here is everything that genuinely needs a page: the resolved custom
// properties, read off :root in a real browser.
