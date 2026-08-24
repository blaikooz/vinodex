import { test, expect, enterDex, seedDevice } from './fixtures';

const assertFounderEndpoint = async (
  page: import('@playwright/test').Page,
) => {
  const scroller = page.getByRole('region', { name: 'WHO WE ARE content' });
  await expect(scroller).toBeVisible();
  await scroller.evaluate(el => { el.scrollTop = el.scrollHeight; });

  const endpoint = await scroller.evaluate(el => {
    const last = el.lastElementChild;
    if (!last) return null;
    const viewport = el.getBoundingClientRect();
    const contentEnd = last.getBoundingClientRect();
    return {
      scrollTop: el.scrollTop,
      maxScrollTop: el.scrollHeight - el.clientHeight,
      viewportBottom: viewport.bottom,
      contentBottom: contentEnd.bottom,
    };
  });
  expect(endpoint, 'the founder page has no final content node').not.toBeNull();
  expect(endpoint!.scrollTop).toBeCloseTo(endpoint!.maxScrollTop, 0);
  expect(
    endpoint!.viewportBottom - endpoint!.contentBottom,
    'the final founder line touches or disappears under the LCD clip',
  ).toBeGreaterThanOrEqual(20);

  const bezelTop = await page.locator('.bezel-wordmark').evaluate(el =>
    el.closest('div.shrink-0')!.getBoundingClientRect().top,
  );
  expect(endpoint!.viewportBottom, 'founder content extends beneath the bezel')
    .toBeLessThanOrEqual(bezelTop);

  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  expect(await page.evaluate(() => window.scrollY), 'the founder route unlocks document scrolling')
    .toBe(0);
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow))
    .toBe('hidden');
};

/**
 * The chassis is the page. Long content belongs to the LCD and must never turn
 * the browser document into a second, competing scroll surface around it.
 *
 * This is intentionally a browser test rather than a source assertion:
 * `overflow-hidden` on App's first child looks persuasive in JSX but does not
 * lock `html`/`body`, and browser wheel routing is exactly where that mistake
 * becomes visible.
 */
test.describe('scroll containment', () => {
  test.use({ viewport: { width: 1280, height: 700 } });

  const assertInternalScroll = async (
    page: import('@playwright/test').Page,
    scroller: import('@playwright/test').Locator,
  ) => {
    await expect(scroller).toBeVisible();
    const before = await scroller.evaluate(el => ({
      top: el.scrollTop,
      height: el.clientHeight,
      content: el.scrollHeight,
      overflowY: getComputedStyle(el).overflowY,
      touchAction: getComputedStyle(el).touchAction,
      overscrollY: getComputedStyle(el).overscrollBehaviorY,
    }));
    expect(before.content, 'the fixture is not long enough to prove LCD scrolling')
      .toBeGreaterThan(before.height);
    expect(before.top).toBe(0);
    expect(before.overflowY).toBe('auto');
    expect(before.touchAction).toContain('pan-y');
    expect(before.overscrollY).toBe('contain');

    const box = await scroller.boundingBox();
    expect(box, 'the LCD scroll surface has no layout box').not.toBeNull();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.mouse.wheel(0, 700);
    await expect.poll(() => scroller.evaluate(el => el.scrollTop)).toBeGreaterThan(0);
    expect(await page.evaluate(() => window.scrollY), 'wheel input escaped the LCD').toBe(0);
  };

  test('locks the document while a long LCD screen remains scrollable', async ({ page, consoleErrors }) => {
    void consoleErrors;
    await seedDevice(page);
    await enterDex(page, '/list/GRAPES');

    const lcdScroller = page.locator('.lcd-themed .custom-scrollbar').first();
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    await assertInternalScroll(page, lcdScroller);

    // A document lock is a layout invariant, not just fortunate wheel routing.
    // If the page has overflow, this programmatic move exposes it directly.
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    expect(await page.evaluate(() => window.scrollY), 'the browser document can still scroll')
      .toBe(0);
  });

  test('the long founder profile scrolls inside the website LCD', async ({ page, consoleErrors }) => {
    void consoleErrors;
    await seedDevice(page);
    await page.goto('/who-we-are');

    await assertInternalScroll(
      page,
      page.getByRole('region', { name: 'WHO WE ARE content' }),
    );
    await assertFounderEndpoint(page);
  });

  test('search, detail, and settings screens keep working scroll regions', async ({ page, consoleErrors }) => {
    void consoleErrors;
    await seedDevice(page);

    for (const route of ['/chip-filter', '/detail/G001', '/settings/SETTINGS']) {
      await enterDex(page, route);
      const scroller = page.locator('.lcd-themed .overflow-y-auto').first();
      await assertInternalScroll(page, scroller);
    }
  });
});

test.describe('mobile founder scroll endpoint', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('keeps the complete final line above the bezel without document scrolling', async ({ page, consoleErrors }) => {
    void consoleErrors;
    await seedDevice(page);
    await page.goto('/who-we-are');

    await assertFounderEndpoint(page);
  });
});
