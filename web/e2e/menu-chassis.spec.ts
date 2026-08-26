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

    // These are illustrated/pixel menu marks, not generic line icons. Four
    // categories can reuse the art already mirrored from iOS; Search may use
    // a dedicated menu asset because the current bundle has no magnifier.
    const iconByControl = [
      ['GRAPES', 'grapes'],
      ['REGIONS', 'regions'],
      ['STYLES', 'styles'],
      ['FLAVORS', 'flavors'],
      ['Search', 'search'],
    ] as const;
    for (const [name, iconName] of iconByControl) {
      const control = page.getByRole('button', { name, exact: true });
      await expect(control.locator(`[data-menu-icon="${iconName}"]`),
        `${name} is missing its illustrated menu icon`).toHaveCount(1);
      await expect(control.locator('svg[class*="lucide-"]'),
        `${name} fell back to a generic Lucide icon`).toHaveCount(0);
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

  test('the four tiles curve around the search hub with a real channel', async ({ page, consoleErrors }) => {
    void consoleErrors;
    const geometry = await page.evaluate(() => {
      const search = document.querySelector<HTMLElement>('.main-menu-search')!;
      const tiles = Array.from(document.querySelectorAll<HTMLElement>('.main-menu-tile'));
      const searchBox = search.getBoundingClientRect();
      const center = {
        x: searchBox.left + searchBox.width / 2,
        y: searchBox.top + searchBox.height / 2,
      };
      const radius = searchBox.width / 2;
      const diagonal = Math.SQRT1_2;
      const directions = [
        [-diagonal, -diagonal],
        [diagonal, -diagonal],
        [-diagonal, diagonal],
        [diagonal, diagonal],
      ];

      return tiles.map((tile, index) => {
        const [dx = 0, dy = 0] = directions[index] ?? [];
        const at = (distance: number) => document.elementFromPoint(
          center.x + dx * distance,
          center.y + dy * distance,
        ) as HTMLElement | null;
        const channelHit = at(radius + 5);
        const tileHit = at(radius + 24);
        const clipId = getComputedStyle(tile).clipPath;
        const pathId = clipId.match(/#([^"')]+)/)?.[1] ?? '';
        const path = pathId ? document.querySelector<SVGPathElement>(`#${CSS.escape(pathId)} path`) : null;
        return {
          channelIsTile: channelHit?.closest('.main-menu-tile') === tile,
          channelIsSearch: channelHit?.closest('.main-menu-search') === search,
          outerIsTile: tileHit?.closest('.main-menu-tile') === tile,
          clipPath: clipId,
          arcCount: (path?.getAttribute('d')?.match(/\bA\b/g) ?? []).length,
          labelSize: Number.parseFloat(getComputedStyle(tile.querySelector('span:nth-of-type(2)')!).fontSize),
        };
      });
    });

    expect(geometry).toHaveLength(4);
    for (const tile of geometry) {
      expect(tile.clipPath, 'a category tile has no responsive scoop path').toMatch(/^url\(/);
      expect(tile.arcCount, 'the scoop lost its rounded corners or tangent fillets').toBeGreaterThanOrEqual(6);
      expect(tile.channelIsTile, 'a tile paints into the channel around Search').toBe(false);
      expect(tile.channelIsSearch, 'the channel sample still lands on Search').toBe(false);
      expect(tile.outerIsTile, 'the scoop cuts too deeply into its tile').toBe(true);
      expect(tile.labelSize, 'a category title stayed at the old small size').toBeGreaterThanOrEqual(14);
    }
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

  test('the footer has one large cap face per control', async ({ page, consoleErrors }) => {
    void consoleErrors;
    const caps = ['Back', 'Collection', 'Home', 'Settings'] as const;

    for (const name of caps) {
      const button = page.getByRole('button', { name, exact: true }).first();
      const face = button.locator('img[src^="/art/caps/"]');
      await expect(face, `${name} has no rendered cap face`).toHaveCount(1);

      const material = await button.evaluate(node => {
        const style = getComputedStyle(node);
        const rect = node.getBoundingClientRect();
        return {
          width: rect.width,
          height: rect.height,
          backgroundImage: style.backgroundImage,
          borderTopWidth: style.borderTopWidth,
        };
      });
      expect(material.width, `${name} is smaller than the 4rem chassis control`).toBeGreaterThanOrEqual(63.5);
      expect(material.height, `${name} is smaller than the 4rem chassis control`).toBeGreaterThanOrEqual(63.5);
      expect(material.backgroundImage, `${name} paints a CSS cap underneath its complete PNG cap`).toBe('none');
      expect(material.borderTopWidth, `${name} paints a second rim underneath its complete PNG cap`).toBe('0px');
    }
  });

  test('the marquee uses one static dark-on-green route panel', async ({ page, consoleErrors }) => {
    void consoleErrors;
    const run = page.locator('.terminal-marquee');
    const glass = run.locator('..');

    await expect(run).toBeVisible();
    const panel = await glass.evaluate(node => {
      const style = getComputedStyle(node);
      const parse = (value: string) => (value.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
      const run = node.firstElementChild as HTMLElement;
      const glyph = run.querySelector('img') as HTMLElement;
      const title = run.querySelector('span:last-child') as HTMLElement;
      return {
        background: parse(style.backgroundColor),
        backgroundImage: style.backgroundImage,
        animationName: getComputedStyle(run).animationName,
        glyphHeight: glyph.getBoundingClientRect().height,
        titleSize: Number.parseFloat(getComputedStyle(title).fontSize),
      };
    });
    const [red = 0, green = 0, blue = 0] = panel.background;
    expect(green, 'marquee panel is not green-led').toBeGreaterThan(red);
    expect(green, 'marquee panel is not green-led').toBeGreaterThan(blue);
    expect(panel.backgroundImage, 'marquee panel has no LCD grid/scan texture').not.toBe('none');
    expect(panel.animationName, 'the route title still scrolls/repeats').toBe('none');
    expect(panel.glyphHeight, 'the marquee glyph stayed at its old small size').toBeGreaterThanOrEqual(41);
    expect(panel.titleSize, 'the marquee title stayed at its old small size').toBeGreaterThanOrEqual(22);

    const text = (await run.textContent()) ?? '';
    const title = text.trim();
    expect(title, 'the marquee repeats its route title').not.toMatch(/^(.+)\1$/);
    await expect(run.locator('img')).toHaveCount(1);
  });
});
