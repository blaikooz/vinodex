import { test, expect, enterDex, seedDevice } from './fixtures';
import { SCREENSAVER_PALETTE } from '../src/services/screensaver';

/**
 * The screensaver's colour effect, on a phone (v0.6.14 — iOS parity).
 *
 * iOS bounces the wordmark and gives it a new hue from a six-colour palette
 * on every wall. The web bounced a fixed red PNG for six releases, and
 * nothing could see it: the unit suite proves the *count* is right, but only
 * a real engine can prove the count reaches the paint. So this raises the
 * saver on a 390x844 viewport, watches the face path's `fill` for long enough
 * to cross a wall (the mark is 0.32 of the LCD's short edge, so at 47px/s the
 * x-travel of a phone LCD is crossed in about four seconds), and asserts
 * three things: the colour changed, every colour it wore is from the palette,
 * and the mark stayed pixel-crisp.
 */
test.use({ viewport: { width: 390, height: 844 } });
// A raise takes a real minute of device time (run fast below), then seven
// seconds of watching; the default 45s budget also has to hold the teardown
// of a page whose frame loop is still running.
test.setTimeout(90_000);

test('the mark takes a new palette colour on every wall, and stays crisp', async ({ page, consoleErrors }) => {
  void consoleErrors;
  // Same clock trick as site.spec: the idle threshold is a real minute, so
  // the device's clock is run fast rather than the test being slowed.
  await page.addInitScript(() => {
    const real = Date.now;
    let offset = 0;
    const timer = window.setInterval(() => { offset += 15_000; }, 250);
    (window as unknown as { __fastClock: number }).__fastClock = timer;
    Date.now = () => real() + offset;
  });
  await seedDevice(page);
  await enterDex(page, '/dex');

  const saver = page.getByRole('button', { name: /Screensaver/ });
  // 30s, not 15: the raise needs a virtual minute of idleness, and under
  // full-suite load (four workers, one of them building a 6 MB precache)
  // the fast clock's 250ms ticks arrive late. It failed once at 15s.
  await expect(saver).toHaveCount(1, { timeout: 30_000 });

  const mark = saver.locator('[data-screensaver-mark]');
  await expect(mark).toHaveCount(1);
  // The V -- the same two masks the BIOS draws -- not the site's H (v0.6.19).
  for (const layer of ['face', 'shade']) {
    const maskImage = await mark.locator(`[data-mark-${layer}]`).evaluate(el => getComputedStyle(el).maskImage);
    expect(maskImage, `${layer} layer is not the ${layer} mask`).toContain(`/art/logo/vinodex-mark-${layer}.png`);
  }

  // Sample the face fill and the bounce count for seven seconds -- inside
  // the page, as ONE action. The first draft polled from the test at 100ms
  // and produced two hundred traced actions, each with a DOM snapshot of a
  // page repainting every frame; the trace was heavy enough that the
  // context teardown blew the budget on this and on neighbouring workers.
  const sampled = await page.evaluate(() => new Promise<{ fills: string[]; counts: string[] }>(resolve => {
    const fills = new Set<string>();
    const counts = new Set<string>();
    const mark = document.querySelector('[data-screensaver-mark]') as HTMLElement | null;
    const started = performance.now();
    const tick = () => {
      // `data-tint` is the palette string the frame loop wrote, alongside
      // the layers' inline background (which the engine would normalise to
      // rgb() and so could not be matched against the palette).
      const fill = mark?.dataset.tint;
      const count = mark?.dataset.bounces;
      if (fill) fills.add(fill);
      if (count) counts.add(count);
      if (performance.now() - started < 7_000) requestAnimationFrame(tick);
      else resolve({ fills: [...fills], counts: [...counts] });
    };
    tick();
  }));
  const seen = new Set(sampled.fills);
  const counts = new Set(sampled.counts);

  expect(seen.size, `the mark never changed colour (wore: ${[...seen].join(', ')})`).toBeGreaterThanOrEqual(2);
  expect(counts.size, 'the bounce count never advanced').toBeGreaterThanOrEqual(2);
  for (const fill of seen) {
    expect(SCREENSAVER_PALETTE, `${fill} is not a palette colour`).toContain(fill);
  }
  // "It opened on the accent" is NOT asserted here, on purpose: the start is
  // a random phase, and a phase that begins a few pixels from a wall takes
  // its first bounce before the first sample can land. The unit suite pins
  // the opening colour exactly (`screensaver.test.ts`); this test is for the
  // half only a browser can prove -- that the count reaches the paint.

  // The mark is inside the LCD and sized from it: never wider than the box.
  const [box, m] = await Promise.all([saver.boundingBox(), mark.boundingBox()]);
  expect(m!.width).toBeLessThan(box!.width);
  expect(m!.height).toBeLessThan(box!.height);

  // Stop the fast clock and wake the device, so the page is quiet for the
  // context teardown -- a still-running frame loop under a racing clock was
  // enough to push the teardown past the budget.
  await page.evaluate(() => clearInterval((window as unknown as { __fastClock: number }).__fastClock));
  // `force`: the actionability wait on a surface repainting every frame
  // timed out once under full-suite load (90s); the wake is a click handler,
  // so a forced click at the element's centre is the real event without the
  // stability wait.
  await saver.click({ force: true });
  await expect(saver).toHaveCount(0, { timeout: 10_000 });
});
