import { test, expect, enterDex, seedDevice } from './fixtures';
import type { Page } from '@playwright/test';

/**
 * The keyboard can see where it is (v9#m3).
 *
 * **Why this exists, specifically.** The v0.4.0 card primitive gives every
 * control a `:focus-visible` ring, and the dial's four quadrants are clipped
 * to a concave shape with `mask-image`. A mask clips to the border box and a
 * `box-shadow` without `inset` is painted *outside* it — so the ring on all
 * four quadrants of the main menu was masked away entirely. Nothing in the
 * repo could see that: typecheck is silent, the screenshot gate photographs a
 * page nobody has tabbed into, and a mouse user never asks for a focus ring.
 *
 * So the assertion is the one that would have caught it. Not "the CSS declares
 * a ring" — the CSS did declare a ring — but **"the resolved `box-shadow`
 * changes when the control is reached by Tab, and on a clipped control it is
 * drawn inside."**
 *
 * **Two things this had to learn the hard way, both worth keeping.**
 *
 * 1. **Tab, not `.focus()`.** `:focus-visible` is a statement about *how*
 *    focus arrived. Chromium does not implement `FocusOptions.focusVisible`,
 *    so a programmatic focus leaves a button in plain `:focus` and the ring
 *    never applies — the first draft of this file focused elements directly,
 *    measured the resting shadow, and reported a missing ring on controls
 *    that have one.
 * 2. **The ring transitions in.** `.dex-pressable` animates `box-shadow` over
 *    `--motion-settle` (361 ms), so a `getComputedStyle` immediately after the
 *    key press reads the *start* of that transition — which is, by
 *    definition, indistinguishable from no ring at all. Every read below waits
 *    for it to land.
 */

/** Comfortably past `--motion-settle` (361 ms). */
const SETTLED = 500;

interface Ring {
  label: string;
  resting: string;
  focused: string;
  clipped: boolean;
}

const describeFocused = (page: Page) =>
  page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el || !el.classList.contains('dex-pressable')) return null;
    return {
      label: (el.textContent || el.getAttribute('aria-label') || '?').trim().slice(0, 24),
      clipped: el.classList.contains('dex-focus-inset'),
      shadow: getComputedStyle(el).boxShadow,
      focusVisible: el.matches(':focus-visible'),
    };
  });

/**
 * Tab through the page and, for every card control reached, record its resting
 * shadow and its settled focused shadow.
 *
 * Resting is collected up front, from every control while none is focused,
 * keyed by label — reading it afterwards would mean tabbing away and waiting
 * out the transition a second time per control.
 */
const walkFocusRings = async (page: Page, steps: number): Promise<Ring[]> => {
  const resting = await page.evaluate(() => {
    const out: Record<string, string> = {};
    for (const el of document.querySelectorAll<HTMLElement>('button.dex-pressable')) {
      const label = (el.textContent || el.getAttribute('aria-label') || '?').trim().slice(0, 24);
      out[label] = getComputedStyle(el).boxShadow;
    }
    return out;
  });

  const seen = new Map<string, Ring>();
  for (let i = 0; i < steps; i += 1) {
    await page.keyboard.press('Tab');
    const arrived = await describeFocused(page);
    if (!arrived || seen.has(arrived.label)) continue;
    await page.waitForTimeout(SETTLED);
    const settled = await describeFocused(page);
    if (!settled) continue;
    expect(settled.focusVisible, `"${settled.label}" was tabbed to but is not :focus-visible`).toBe(true);
    seen.set(settled.label, {
      label: settled.label,
      resting: resting[settled.label] ?? '',
      focused: settled.shadow,
      clipped: settled.clipped,
    });
  }
  return [...seen.values()];
};

const assertRings = (rows: Ring[], where: string) => {
  expect(rows.length, `${where} has no card controls reachable by Tab at all`).toBeGreaterThan(0);
  for (const r of rows) {
    expect(r.focused, `${where}: "${r.label}" shows no focus ring`).not.toBe('none');
    expect(
      r.focused,
      `${where}: "${r.label}" looks identical focused and unfocused`,
    ).not.toBe(r.resting);
    if (r.clipped) {
      // The defect, pinned. An outer ring on a masked element is painted
      // outside the border box the mask clips to, and vanishes.
      expect(
        r.focused,
        `${where}: "${r.label}" is clipped to its own shape, so its ring must be `
        + 'drawn inside or the mask removes it',
      ).toContain('inset');
    }
  }
};

test('every card on the front page shows a keyboard focus ring', async ({ page, consoleErrors }) => {
  void consoleErrors;
  await seedDevice(page);
  await page.goto('/');
  await page.waitForTimeout(600);

  const rows = await walkFocusRings(page, 8);
  assertRings(rows, 'the landing');
  // All four tiles, so this cannot pass on the strength of one of them.
  expect(rows.length, 'the landing no longer has four card controls').toBe(4);
});

test('every dial quadrant shows a keyboard focus ring despite its mask', async ({ page, consoleErrors }) => {
  void consoleErrors;
  await seedDevice(page);
  await enterDex(page, '/dex');
  await page.waitForTimeout(600);

  const rows = await walkFocusRings(page, 10);
  assertRings(rows, 'the dex menu');
  // And the four quadrants really are the clipped case, so this cannot pass by
  // the dial quietly losing its scoop.
  expect(
    rows.filter(r => r.clipped).length,
    'the dial no longer has four clipped quadrants — has the scoop mask gone?',
  ).toBe(4);
});
