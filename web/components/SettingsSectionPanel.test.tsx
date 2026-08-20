import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SettingsSectionPanel } from './SettingsPanel';
import { getAllEntries } from '../src/services/wineData';

/**
 * The three settings panels nothing had ever rendered (W20), and the growth
 * chart that survived W4.
 *
 * **Why these three.** SETTINGS is ~300 lines of toggles and pickers and is
 * the panel a user visits most; DATA draws a chart from a milestone table;
 * ACCESS is the tier readout. None of the three had been rendered by anything
 * — not a unit test, not the e2e suite — so a throw on mount in any of them
 * would have shipped.
 *
 * **The GrowthWave note.** `W4` deleted `DataWave.tsx`, an orphaned duplicate
 * that nothing rendered but which carried the only test of that chart.
 * `SettingsPanel`'s private `GrowthWave` is an independent second
 * implementation and is the one that actually draws — so deleting the orphan
 * removed the tests of code nobody ran and left the code everybody runs
 * untested. Adopting `DataWave` instead would have been a visible change to
 * the DATA panel, so it was not done; this covers the survivor instead.
 *
 * `GrowthWave` is private to its module, and deliberately not exported for a
 * test: the panel is the unit a user meets, and reaching past it to the
 * private component would pin the implementation rather than the behaviour.
 */

/**
 * The panel's `Section` headings, in document order.
 *
 * Read off the shape `Section` draws rather than off a `data-testid`: the
 * marker is already there — a title span inside the ruled header div — and
 * adding a test-only attribute to production markup to observe something the
 * markup already states is a worse trade.
 *
 * The selector is the *ruled header*, not the class on the span alone: four
 * sections contain a row whose label matches the section's own name
 * (HAPTICS, SOUNDS, SUPPORT, CHEAT CODES), and a looser query counts each
 * twice.
 */
const sectionTitles = (): string[] =>
  Array.from(document.querySelectorAll('div.border-b-2 > span.font-retro'))
    .map(el => el.textContent?.trim() ?? '')
    .filter(Boolean);

const renderSection = (section: Parameters<typeof SettingsSectionPanel>[0]['section']) => {
  const onBack = vi.fn();
  const onHome = vi.fn();
  render(
    <MemoryRouter>
      <SettingsSectionPanel
        section={section}
        allEntries={getAllEntries()}
        onBack={onBack}
        onHome={onHome}
      />
    </MemoryRouter>,
  );
  return { onBack, onHome };
};

describe('<SettingsSectionPanel />', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('DATA', () => {
    it('renders the catalog total and the growth chart', async () => {
      renderSection('DATA');
      const total = getAllEntries().length;

      // The headline count, drawn from the live catalog rather than a literal.
      await waitFor(() => expect(screen.getAllByText(String(total)).length).toBeGreaterThan(0));

      // GrowthWave: an <svg> with the area path, the line path and one dot per
      // milestone. Six milestones are passed, so six dots.
      const svg = document.querySelector('svg[viewBox="0 0 300 88"]');
      expect(svg).toBeTruthy();
      expect(svg!.querySelectorAll('circle').length).toBe(6);
      expect(svg!.querySelectorAll('path').length).toBe(2);
    });

    it('runs the counter up to the real total under reduced motion', async () => {
      // Reduced motion takes the chart straight to t=1, so the counter reads
      // the total rather than a frame of the sweep. This is the branch a
      // deterministic test can assert on; the animated branch is a
      // requestAnimationFrame loop that jsdom does not drive.
      window.matchMedia = ((q: string) => ({
        matches: q.includes('prefers-reduced-motion'),
        media: q,
        onchange: null,
        addListener: () => {}, removeListener: () => {},
        addEventListener: () => {}, removeEventListener: () => {},
        dispatchEvent: () => false,
      })) as unknown as typeof window.matchMedia;

      renderSection('DATA');
      const total = getAllEntries().length;
      const svg = await waitFor(() => {
        const el = document.querySelector('svg[viewBox="0 0 300 88"]');
        if (!el) throw new Error('chart not drawn');
        return el;
      });
      // The counter sits in the same wrapper as the chart.
      const wrapper = svg.parentElement!;
      await waitFor(() => {
        expect(within(wrapper as HTMLElement).getByText(String(total))).toBeTruthy();
      });
    });
  });

  describe('SETTINGS', () => {
    // ~300 lines, the panel a user visits most, and nothing had ever mounted
    // it. The section order is the pin: it is what a decomposition of this
    // 697-line switch would have to preserve, and it is the surface a
    // reordering would move without any type or build noticing.
    const SETTINGS_ORDER = [
      'TEXT SIZE', 'UI SIZE', 'HAPTICS', 'SOUNDS', 'TUTORIAL', 'SUPPORT',
      'CHEAT CODES', 'DEMO MODE', 'PROFILES', 'STORED DATA', 'DEVELOPER',
    ];

    it('renders its sections in order', async () => {
      renderSection('SETTINGS');
      await waitFor(() => expect(sectionTitles()).toContain('TEXT SIZE'));
      const titles = sectionTitles();
      for (const t of SETTINGS_ORDER) expect(titles).toContain(t);
      // Order, not just presence.
      const seen = titles.filter(t => SETTINGS_ORDER.includes(t));
      expect(seen).toEqual(SETTINGS_ORDER);
    });

    it('offers real controls', async () => {
      renderSection('SETTINGS');
      await waitFor(() => expect(screen.getAllByRole('button').length).toBeGreaterThan(5));
    });
  });

  describe('ACCESS', () => {
    it('renders the tier section, and no longer a website gate', async () => {
      // **The pin narrowed with the panel (v8#3).** It used to demand *both*
      // WEBSITE ACCESS and FREE TIER. The access code is gone — the site hands
      // the app over on a button press — so the first section was deleted, and
      // this asserts its absence rather than dropping the mention: a WEBSITE
      // ACCESS heading reappearing would mean the door came back without the
      // ruling being revisited, which is exactly the change worth catching.
      renderSection('ACCESS');
      await waitFor(() => expect(sectionTitles()).toContain('FREE TIER'));
      expect(sectionTitles()).not.toContain('WEBSITE ACCESS');
      expect(screen.queryByRole('button', { name: /RE-LOCK/i })).toBeNull();
    });
  });
});
