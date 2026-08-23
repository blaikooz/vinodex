import { test, expect, enterDex, seedDevice } from './fixtures';

test.describe('main menu chassis fit', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test.beforeEach(async ({ page }) => {
    await seedDevice(page);
    await enterDex(page, '/dex');
    await page.waitForTimeout(600);
  });

  test('the five iOS-parity controls fill the LCD with their liveries', async ({ page, consoleErrors }) => {
    void consoleErrors;
    const dial = page.locator('.main-menu-dial');
    const tiles = page.locator('.main-menu-tile');
    const search = page.locator('.main-menu-search');

    await expect(dial).toBeVisible();
    await expect(tiles).toHaveCount(4);
    await expect(search).toHaveCount(1);

    const fit = await page.evaluate(() => {
      const lcd = document.querySelector('.lcd-themed')!.getBoundingClientRect();
      const dial = document.querySelector('.main-menu-dial')!.getBoundingClientRect();
      return {
        width: dial.width / lcd.width,
        height: dial.height / lcd.height,
      };
    });
    expect(fit.width, 'the menu leaves too much LCD width unused').toBeGreaterThanOrEqual(0.9);
    expect(fit.height, 'the menu leaves too much LCD height unused').toBeGreaterThanOrEqual(0.9);

    // These are the same five symbols named by iOS MainMenuScreen: the
    // nine-dot grid, globe, wine glass, leaf and magnifying glass.
    const iconByControl = [
      ['GRAPES', 'lucide-grip'],
      ['REGIONS', 'lucide-globe'],
      ['STYLES', 'lucide-wine'],
      ['FLAVORS', 'lucide-leaf'],
      ['Search', 'lucide-search'],
    ] as const;
    for (const [name, iconClass] of iconByControl) {
      await expect(page.getByRole('button', { name, exact: true }).locator(`svg.${iconClass}`),
        `${name} is not using its iOS-parity icon`).toHaveCount(1);
    }

    const fills = await page.locator('.main-menu-tile, .main-menu-search').evaluateAll(nodes =>
      nodes.map(node => getComputedStyle(node).backgroundColor),
    );
    expect(fills).toHaveLength(5);
    for (const fill of fills) {
      expect(fill, 'a main-menu control has no resolved color fill')
        .not.toMatch(/^(transparent|rgba\([^)]*,\s*0\))$/i);
    }
    expect(new Set(fills).size, 'the five livery controls collapsed to the same fill')
      .toBe(5);
  });

  test('the marquee and quick-pin row use the footer center column', async ({ page, consoleErrors }) => {
    void consoleErrors;
    await expect(page.locator('footer')).toBeVisible();
    await expect(page.locator('.band-pills')).toBeVisible();
    await expect(page.locator('.terminal-marquee')).toBeVisible();

    const widths = await page.evaluate(() => {
      const pills = document.querySelector('.band-pills')!;
      const center = pills.parentElement!;
      // The moving marquee is intentionally wider than its clip. Its outer
      // bezel is two ancestors up and is the surface that should fill space.
      const marqueeBezel = document.querySelector('.terminal-marquee')!.parentElement!.parentElement!;
      return {
        center: center.getBoundingClientRect().width,
        pills: pills.getBoundingClientRect().width,
        marquee: marqueeBezel.getBoundingClientRect().width,
      };
    });
    expect(widths.pills / widths.center, 'quick-pin buttons do not fill their footer column')
      .toBeGreaterThanOrEqual(0.95);
    expect(widths.marquee / widths.center, 'marquee leaves an empty gutter in its footer column')
      .toBeGreaterThanOrEqual(0.95);
  });
});
