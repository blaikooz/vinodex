import { test, expect, enterDex, seedDevice } from './fixtures';

test.describe('tutorial handoff', () => {
  test.use({ viewport: { width: 420, height: 900 } });

  test('walks from the accessible offer through the map into the live guide', async ({ page, consoleErrors }) => {
    void consoleErrors;
    await seedDevice(page);
    await enterDex(page, '/settings/SETTINGS');

    await page.getByRole('button', { name: /TUTORIAL/ }).click();
    const offer = page.getByRole('dialog', { name: 'TAKE THE TOUR?' });
    await expect(offer).toBeVisible();
    await expect(offer.getByRole('button', { name: 'YES' })).toBeFocused();

    // YES is the last control and NOT NOW is the first: prove both ends of
    // the modal loop rather than only checking that focus happened to enter.
    await page.keyboard.press('Tab');
    await expect(offer.getByRole('button', { name: 'NOT NOW' })).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(offer.getByRole('button', { name: 'YES' })).toBeFocused();
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(/\/walkthrough$/);
    const progress = page.getByRole('progressbar', { name: 'Tour progress' });
    await expect(progress).toHaveAttribute('aria-valuemax', '12');
    await expect(progress).toHaveAttribute('aria-valuenow', '1');

    for (let step = 2; step <= 12; step += 1) {
      await page.getByRole('button', { name: 'NEXT', exact: true }).click();
      await expect(progress).toHaveAttribute('aria-valuenow', String(step));
    }

    await expect(page.getByText("THAT'S IT.")).toBeVisible();
    await page.getByRole('button', { name: 'SHOW ME', exact: true }).click();
    await expect(page).toHaveURL(/\/dex$/);
    await expect(page.getByText('TUTORIAL 1/6')).toBeVisible();
    await expect(page.locator('[data-coachmark="menuTile"]')).toBeVisible();

    // Complete the live half too. This pins the web-specific COLLECTION
    // (`/saved`) route as satisfying the Passport step; without that mapping
    // the guide visibly stalled at 5/6 even though its engine unit test passed.
    await page.getByRole('button', { name: 'GRAPES' }).click();
    await expect(page.getByRole('dialog', { name: 'Tutorial step 2 of 6' })).toBeVisible();
    await page.locator('[data-coachmark="listingRow"] button').first().click();
    await expect(page.getByRole('dialog', { name: 'Tutorial step 3 of 6' })).toBeVisible();
    await page.locator('[data-coachmark="triedControl"]').click();

    // A genuinely new shelf can earn several cards before the optional
    // rating prompt. The coachmark deliberately waits behind both overlays.
    for (let i = 0; i < 4; i += 1) {
      const nice = page.getByRole('button', { name: 'NICE' });
      if (await nice.count() === 0) break;
      await nice.first().click();
    }
    const rating = page.getByRole('dialog').filter({ hasText: 'HOW WAS IT?' });
    if (await rating.count()) {
      await rating.getByRole('button', { name: 'SKIP', exact: true }).click();
    }

    await expect(page.getByRole('dialog', { name: 'Tutorial step 4 of 6' })).toBeVisible();
    await page.getByRole('button', { name: 'CONTINUE' }).click();
    await expect(page.getByRole('dialog', { name: 'Tutorial step 5 of 6' })).toBeVisible();
    await page.getByRole('button', { name: 'Collection' }).click();
    await expect(page.getByRole('dialog', { name: 'Tutorial step 6 of 6' })).toBeVisible();
    await page.getByRole('button', { name: 'CONTINUE' }).click();
    await expect(page.getByRole('dialog', { name: /Tutorial step/ })).toHaveCount(0);
  });
});
