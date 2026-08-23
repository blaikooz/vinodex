import { test, expect, enterDex, seedDevice } from './fixtures';

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

  test('locks the document while a long LCD screen remains scrollable', async ({ page, consoleErrors }) => {
    void consoleErrors;
    await seedDevice(page);
    await enterDex(page, '/list/GRAPES');

    const lcdScroller = page.locator('.lcd-themed .custom-scrollbar').first();
    await expect(lcdScroller).toBeVisible();

    const before = await lcdScroller.evaluate(el => ({
      top: el.scrollTop,
      height: el.clientHeight,
      content: el.scrollHeight,
    }));
    expect(before.content, 'the fixture is not long enough to prove LCD scrolling')
      .toBeGreaterThan(before.height);
    expect(before.top).toBe(0);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);

    const box = await lcdScroller.boundingBox();
    expect(box, 'the LCD scroll surface has no layout box').not.toBeNull();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.mouse.wheel(0, 700);

    await expect.poll(() => lcdScroller.evaluate(el => el.scrollTop))
      .toBeGreaterThan(0);
    expect(await page.evaluate(() => window.scrollY), 'wheel input escaped the LCD')
      .toBe(0);

    // A document lock is a layout invariant, not just fortunate wheel routing.
    // If the page has overflow, this programmatic move exposes it directly.
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    expect(await page.evaluate(() => window.scrollY), 'the browser document can still scroll')
      .toBe(0);
  });
});
