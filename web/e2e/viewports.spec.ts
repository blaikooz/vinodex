import { test, expect, seedDevice } from './fixtures';
import type { Page } from '@playwright/test';

/**
 * The viewport gate (v7#D7).
 *
 * **Why it exists.** v0.2.2 shipped two desktop-only faults that every gate in
 * the repo was structurally incapable of seeing:
 *
 * - the BIOS drew `fixed inset-0` to the *viewport*, so on a 1280px window its
 *   dotted POST leaders ran the full width, left aligned, beside a centred
 *   522px chassis (v7#D1);
 * - the chassis was a flat `md:h-[850px]`, so on an ~800px-tall window the
 *   entire footer band — the caps, the marquee and the v0.2.1 quick-pin lamps —
 *   sat below the fold with `overflow-hidden` above it, unreachable (v7#D2).
 *
 * Both were invisible because the suite ran at exactly one viewport, 420x900,
 * where the browser window and the device are the same rectangle. That is the
 * one shape in which this whole class of bug cannot occur.
 *
 * **It asserts, it does not just photograph.** A screenshot nobody diffs would
 * have caught neither: the 850px chassis produced a perfectly handsome picture
 * of a device whose bottom 50px were missing, and nothing in the suite knew.
 * So the two things that actually failed are the two things checked — nothing
 * painted outside the window, and every chassis control is on screen and
 * clickable. The shots are attached as evidence, not as the test.
 */

/** Mobile (the suite's standing size), desktop, and a short desktop window. */
const SIZES: [string, number, number][] = [
  ['mobile', 420, 900],
  ['desktop', 1280, 800],
  ['short', 1280, 700],
];

/**
 * Elements the design deliberately draws wider than the box that clips them.
 *
 * The marquee is the standing example and an explicit non-bug: `terminal-
 * marquee` is `whitespace-nowrap` and scrolls, so it is *supposed* to overhang
 * — its parent clips it. Excluding it by class, plus anything inside it, keeps
 * that intent legible instead of quietly loosening the whole assertion.
 */
const OVERHANG_BY_DESIGN = '.terminal-marquee';

/**
 * Every element painting outside the window, marquee run excepted.
 *
 * Run on `/dex` and only on `/dex`. Every other screen puts a scrolling list
 * inside the LCD, where content below the fold is the *point* — a 16,000px
 * grape list reports two thousand "strays" and means nothing by it. The menu
 * is the one surface whose whole content fits, which is what makes anything
 * outside the window on it a real fault rather than a scroll position.
 */
const paintedOutside = (page: Page, allow: string) =>
  page.evaluate(sel => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const out: string[] = [];
    for (const el of Array.from(document.querySelectorAll('body *'))) {
      if (el.closest(sel)) continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      // A half-pixel of slack: sub-pixel layout rounds, and a 0.5px lip is not
      // a bug anybody can see. 50px of missing footer is.
      if (r.top < -0.5 || r.left < -0.5 || r.bottom > vh + 0.5 || r.right > vw + 0.5) {
        const cls = typeof el.className === 'string' ? el.className.slice(0, 70) : '';
        out.push(`${el.tagName}.${cls} [${Math.round(r.left)},${Math.round(r.top)} → ${Math.round(r.right)},${Math.round(r.bottom)}]`);
      }
    }
    return out;
  }, allow);

for (const [name, width, height] of SIZES) {
  test.describe(`${name} ${width}x${height}`, () => {
    test.use({ viewport: { width, height } });

    test('the device fits the window', async ({ page, consoleErrors }, testInfo) => {
      void consoleErrors;
      await seedDevice(page);
      await page.goto('/dex');
      await page.waitForTimeout(900);

      const shot = await page.screenshot();
      await testInfo.attach(`chassis-${name}`, { body: shot, contentType: 'image/png' });
      await page.screenshot({ path: `web/e2e/.shots/viewport-${name}.png` });

      const frame = await page.evaluate(() => {
        const el = document.querySelector('[style*="preserve-3d"]');
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { top: r.top, bottom: r.bottom, height: r.height, width: r.width, vh: window.innerHeight };
      });
      expect(frame, 'no device frame found').not.toBeNull();
      // The whole point of the cap: the chassis ends inside the window.
      expect(frame!.top, 'chassis starts above the window').toBeGreaterThanOrEqual(-0.5);
      expect(frame!.bottom, 'chassis runs past the bottom of the window').toBeLessThanOrEqual(frame!.vh + 0.5);

      const strays = await paintedOutside(page, OVERHANG_BY_DESIGN);
      expect(strays, `painted outside the window:\n${strays.join('\n')}`).toEqual([]);
    });

    /**
     * The footer band is the feature that went missing (v0.2.1's quick pins
     * among it), so it is checked by use rather than by geometry: the SETTINGS
     * cap is the lowest control on the chassis, and a click on it has to
     * navigate. A cap below the fold cannot be clicked, and Playwright's
     * actionability check says so rather than silently passing.
     */
    test('the footer band is on screen and clickable', async ({ page, consoleErrors }) => {
      void consoleErrors;
      await seedDevice(page);
      await page.goto('/dex');
      await page.waitForTimeout(900);

      const vh = (await page.evaluate(() => window.innerHeight)) as number;
      for (const label of ['Back', 'Home', 'Collection', 'Settings']) {
        const cap = page.getByRole('button', { name: label, exact: true }).first();
        const box = await cap.boundingBox();
        expect(box, `${label} cap has no box`).not.toBeNull();
        expect(box!.y + box!.height, `${label} cap is below the fold`).toBeLessThanOrEqual(vh + 0.5);
      }

      // The marquee band's two quick-pin lamps: the v0.2.1 feature that was
      // invisible at this size. Both are real buttons; both must be reachable.
      // Selected by the shared hint they point at rather than by name — a
      // lamp's accessible name is whatever pin it currently carries.
      const lamps = page.locator('button[aria-describedby="lamp-hint"]');
      const lampCount = await lamps.count();
      expect(lampCount, 'no quick-pin lamps found').toBeGreaterThan(0);
      for (let i = 0; i < lampCount; i += 1) {
        const box = await lamps.nth(i).boundingBox();
        expect(box, `lamp ${i} has no box`).not.toBeNull();
        expect(box!.y + box!.height, `lamp ${i} is below the fold`).toBeLessThanOrEqual(vh + 0.5);
      }

      // And the lowest cap actually works from here.
      await page.getByRole('button', { name: 'Settings', exact: true }).first().click();
      await expect(page).toHaveURL(/\/settings/);
    });

    /**
     * The BIOS, at each size (v7#D1).
     *
     * Not seeded past the boot, unlike everything else in the suite — this is
     * the one test that watches the POST render, and it checks the thing that
     * was wrong: the leader lines were as wide as the browser. They must be as
     * wide as the device.
     */
    test('the BIOS boots inside the device', async ({ page, consoleErrors }, testInfo) => {
      void consoleErrors;
      await page.addInitScript(() => {
        window.localStorage.setItem('unlockedAppIDs', JSON.stringify(['vinodex']));
        window.localStorage.setItem('firstTimeTriggersSeen', 'firstLaunch,firstLaunchNamed');
        window.localStorage.setItem('coachmarkOffered', 'true');
      });
      await page.goto('/dex');

      const post = page.getByText(/VINODEX BIOS/);
      await expect(post).toBeVisible();

      // Measured before the screenshots, not after: the POST resolves into the
      // identity splash at 1750ms and two full-page captures at 1280px cost
      // more than that, so photographing first raced the boot and found no
      // POST left to measure.

      const geom = await page.evaluate(() => {
        // Deepest match, not first: every ancestor also "contains" the text,
        // and the outermost one is the viewport-wide layer — measuring that
        // would assert the bug was fine. Document order puts ancestors first,
        // so the last candidate is the line itself.
        const cands = Array.from(document.querySelectorAll('div')).filter(d =>
          /VINODEX BIOS/.test(d.textContent ?? ''),
        );
        const line = cands[cands.length - 1];
        const box = line?.closest('div[class*="md:w-[522px]"]');
        return {
          vw: window.innerWidth,
          post: line ? line.getBoundingClientRect().width : -1,
          box: box ? box.getBoundingClientRect().width : -1,
        };
      });
      const shot = await page.screenshot();
      await testInfo.attach(`bios-${name}`, { body: shot, contentType: 'image/png' });
      await page.screenshot({ path: `web/e2e/.shots/viewport-bios-${name}.png` });

      expect(geom.box, 'the BIOS is not inside a device-frame box').toBeGreaterThan(0);
      // On desktop the device is 522px in a 1280px window: the POST must be
      // the narrow one. On mobile the two coincide, which is why this bug
      // survived — so the assertion that holds at every size is that the POST
      // never exceeds the device.
      expect(geom.post, 'the BIOS is wider than the device').toBeLessThanOrEqual(geom.box + 0.5);
      if (geom.vw > 600) {
        expect(geom.box, 'the device frame is not the 522px column on desktop').toBeLessThan(geom.vw * 0.6);
      }

      // It still hands the device over, at every size.
      await expect(post).toBeHidden({ timeout: 20_000 });
    });
  });
}
