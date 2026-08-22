import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import EntryDetail from './EntryDetail';
import { getAllEntries } from '../src/services/wineData';
import type { WineEntry } from '@/shared/types';

/**
 * One render pin per entry category (W20).
 *
 * **Why this suite exists.** `EntryDetail.tsx` is 1,549 lines and branches
 * seven ways — grapes, regions, styles, flavours, continents, country gates,
 * and the STYLE-class special case — with separate header-tile code down each
 * branch. The e2e suite opened exactly one of them (a grape, reached by
 * clicking the first row of `/list/GRAPES`), so six branches of the app's
 * largest screen had never been rendered by anything. A `TypeError` on a
 * region's climate tile or a flavour's subclass chip would have shipped.
 *
 * **What is pinned, and why it is the section titles.** Not the copy, not the
 * layout, not the chip colours — the *ordered list of sections* each category
 * shows. That is the screen's structure rather than its styling, it is what a
 * reader of the page actually navigates by, and critically it is **the thing a
 * later decomposition of this file has to preserve**. `EntryDetail` is slated
 * to be split the way iOS split `EntryDetailScreen` into
 * `EntryDetailSections` and `EntryDetailRows`; a split that drops a section
 * from one category's branch is the obvious way for that work to go wrong,
 * and it is invisible to the type checker. These pins are what make that
 * refactor provable rather than hopeful.
 *
 * So the pins are deliberately **exact arrays, not `toContain`**. A section
 * that quietly disappears is exactly the failure mode; a containment check
 * would not see it.
 *
 * **The fixtures are real catalog entries**, not hand-built objects. A
 * synthetic entry proves the component renders something the test invented;
 * the point here is that it renders the data the app actually ships.
 */

const all = getAllEntries();

/** A real entry from a category, chosen by a predicate so the pick is stated. */
const pick = (label: string, predicate: (e: WineEntry) => boolean): WineEntry => {
  const found = all.find(predicate);
  if (!found) throw new Error(`no catalog entry matches "${label}" — fixture assumption broken`);
  return found;
};

/**
 * The section headings, in document order.
 *
 * Read off the ruled header `EntryDetail` already draws, rather than off a
 * test-only attribute: the marker exists, it is what makes a heading a
 * heading, and adding `data-testid` to production markup to observe something
 * the markup already states is a worse trade. Same selector shape as
 * `SettingsSectionPanel.test.tsx`.
 */
const sectionTitles = (): string[] =>
  // Selector moved with the stage-4 conversion (v0.4.3): the ruled header is
  // `SectionHeader` now, and its label is a real `<h2>` in the sans rather
  // than a `span.font-retro`. The pinned ARRAYS are unchanged — this is the
  // decomposition the header comment predicted, held to its own pins.
  Array.from(document.querySelectorAll('div.dex-section-rule > h2'))
    .map(el => el.textContent?.trim() ?? '')
    .filter(Boolean);

const renderEntry = (entry: WineEntry) => {
  render(
    <MemoryRouter>
      <EntryDetail
        entry={entry}
        allEntries={all}
        onBack={vi.fn()}
        onHome={vi.fn()}
        onSelectRelated={vi.fn()}
        onFilterByType={vi.fn()}
        onFilterByNote={vi.fn()}
        onFilterBySoil={vi.fn()}
        onFilterByOrigin={vi.fn()}
        onViewStates={vi.fn()}
        onLineage={vi.fn()}
      />
    </MemoryRouter>,
  );
};

describe('<EntryDetail /> renders every category', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  /**
   * The six categories, each with a named fixture and the sections it draws.
   *
   * Recorded from the current tree rather than invented — this is a
   * characterisation pin, and its value is that it moves loudly. When a
   * section is deliberately added or removed, update the array *and say so in
   * the commit*; never relax it to `toContain`.
   */
  const CASES: { label: string; entry: () => WineEntry; sections: string[] }[] = [
    {
      label: 'GRAPES',
      entry: () => pick('a grape', e => e.category === 'GRAPES'),
      sections: ['INFO', 'RARITY', 'CHARACTERISTICS', 'FLAVOR PROFILE', 'ALSO KNOWN AS', 'NOTABLE REGIONS'],
    },
    {
      label: 'REGIONS',
      entry: () => pick('a region', e => e.category === 'REGIONS'),
      sections: ['INFO', 'APPELLATION SYSTEM', 'APPELLATIONS', 'CLIMATE', 'SOIL COMPOSITION', 'NOTABLE GRAPES'],
    },
    {
      label: 'STYLES',
      entry: () => pick('a style', e => e.category === 'STYLES'),
      sections: ['INFO', 'NOTABLE GRAPES', 'KEY REGIONS'],
    },
    {
      label: 'FLAVORS',
      entry: () => pick('a flavour', e => e.category === 'FLAVORS'),
      sections: ['INFO', 'NOTABLE GRAPES'],
    },
    {
      label: 'CONTINENTS',
      entry: () => pick('a continent', e => e.category === 'CONTINENTS'),
      sections: ['INFO', 'COUNTRIES'],
    },
    {
      label: 'COUNTRY_GATE',
      entry: () => pick('a country gate', e => e.category === 'COUNTRY_GATE'),
      sections: ['INFO', 'MAIN GRAPES', 'APPELLATION SYSTEMS', 'KEY REGIONS'],
    },
  ];

  for (const c of CASES) {
    describe(c.label, () => {
      it('renders without throwing, and names the entry', async () => {
        const entry = c.entry();
        renderEntry(entry);
        // Rendering at all is most of the assertion for five of these six —
        // nothing had ever mounted them.
        // The name is rendered in its authored case; the ALL CAPS a user sees
        // is `text-transform` on the LCD wrapper, which jsdom does not fold
        // into `textContent`.
        await waitFor(() => expect(document.body.textContent).toContain(entry.name));
      });

      it('draws exactly the sections it is pinned to', async () => {
        renderEntry(c.entry());
        await waitFor(() => expect(sectionTitles().length).toBeGreaterThan(0));
        expect(sectionTitles()).toEqual(c.sections);
      });
    });
  }

  it('gives a grape its ALSO KNOWN AS section when it has synonyms', async () => {
    const withSynonyms = pick(
      'a grape with alternate names',
      e => e.category === 'GRAPES' && ((e as { grapeAlternateNames?: string[] }).grapeAlternateNames?.length ?? 0) > 0,
    );
    renderEntry(withSynonyms);
    await waitFor(() => expect(sectionTitles()).toContain('ALSO KNOWN AS'));
  });

  it('gives a region its climate readout when it declares one', async () => {
    const withClimate = pick('a region with a climate', e => e.category === 'REGIONS' && 'climate' in e && !!e.climate);
    renderEntry(withClimate);
    await waitFor(() => expect(document.body.textContent).toContain(withClimate.name));
    // The climate value reaches the page in some form; the exact tile is
    // layout and is deliberately not pinned.
    const climate = String((withClimate as { climate?: string }).climate ?? '').toUpperCase();
    expect(document.body.textContent?.toUpperCase()).toContain(climate);
  });
});
