import { test, expect, enterDex, seedDevice } from './fixtures';

test.describe('iOS button-art shelves', () => {
  test.use({ viewport: { width: 420, height: 900 } });

  test.beforeEach(async ({ page }) => {
    await seedDevice(page);
  });

  for (const screen of [
    {
      route: '/minigames',
      grid: 'tools',
      labels: ['BLIND TASTING', 'LABEL SCAN', 'WINE EXAM', 'DAILY CHALLENGE', 'PROF. VINO', 'MOON DIAL'],
      art: ['blindtasting', 'labelscanner', 'wineexam', 'dailychallenge', 'vino-neutral', 'moondial'],
    },
    {
      route: '/settings',
      grid: 'system',
      labels: ['TOOLS', 'CUSTOMIZE', 'SETTINGS', 'DATA', 'SHOP', 'FIRMWARE'],
      art: ['tools', 'customize', 'settings', 'data', 'shop', 'firmware'],
    },
  ] as const) {
    test(`${screen.grid} is a tall 2-by-3 shelf using the canonical pixel drawings`, async ({ page, consoleErrors }) => {
      void consoleErrors;
      await enterDex(page, screen.route);
      await page.waitForTimeout(400);

      const shelf = page.locator(`[data-ios-grid="${screen.grid}"]`);
      const tiles = shelf.locator('.ios-grid-tile');
      await expect(tiles).toHaveCount(6);
      await expect(tiles).toHaveText(screen.labels.map(label => new RegExp(label)));
      await expect(shelf.locator('svg')).toHaveCount(0);

      expect(await shelf.locator('[data-button-art]').evaluateAll(nodes =>
        nodes.map(node => node.getAttribute('data-button-art')),
      )).toEqual(screen.art);
      expect(await shelf.locator('img').evaluateAll(images => images.map(image => {
        const img = image as HTMLImageElement;
        return { complete: img.complete, width: img.naturalWidth, height: img.naturalHeight };
      }))).toEqual(screen.art.map(() => expect.objectContaining({
        complete: true,
        width: expect.any(Number),
        height: expect.any(Number),
      })));
      for (const image of await shelf.locator('img').evaluateAll(images => images.map(node => {
        const img = node as HTMLImageElement;
        return { width: img.naturalWidth, height: img.naturalHeight };
      }))) {
        expect(image.width, 'a ButtonArt image completed without decoded pixels').toBeGreaterThan(0);
        expect(image.height, 'a ButtonArt image completed without decoded pixels').toBeGreaterThan(0);
      }

      if (screen.grid === 'tools') {
        const labelScan = page.getByRole('button', { name: /LABEL SCAN/ });
        await expect(labelScan).toBeDisabled();
        const descriptionId = await labelScan.getAttribute('aria-describedby');
        expect(descriptionId, 'the unavailable tool has no accessible explanation').toBeTruthy();
        await expect(page.locator(`[id="${descriptionId}"]`)).toHaveText('Coming soon — not built yet.');
      }

      const geometry = await tiles.evaluateAll(nodes => nodes.map(node => {
        const rect = node.getBoundingClientRect();
        const style = getComputedStyle(node);
        return {
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: rect.width,
          height: rect.height,
          background: style.backgroundColor,
          texture: getComputedStyle(node, '::before').backgroundImage,
        };
      }));

      expect(new Set(geometry.map(tile => tile.x)).size).toBe(2);
      expect(new Set(geometry.map(tile => tile.y)).size).toBe(3);
      expect(new Set(geometry.map(tile => tile.background)).size).toBe(6);
      for (const tile of geometry) {
        expect(tile.height, 'phone tiles should retain the taller iOS proportion').toBeGreaterThan(tile.width);
        expect(tile.texture, 'the iOS scan texture disappeared').not.toBe('none');
      }
    });
  }
});
