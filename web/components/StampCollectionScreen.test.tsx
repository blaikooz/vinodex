import { cleanup, fireEvent, render, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { buildWineEntries } from '@/shared/constants';
import { STAMP_CATALOG } from '../src/services/stampCatalog';
import StampCollectionScreen from './StampCollectionScreen';

/** The album (v10#2): every stamp, earned or not; the story on tap. */
afterEach(cleanup);
beforeEach(() => window.localStorage.clear());

const entries = buildWineEntries();
const noop = () => undefined;
const mount = () =>
  render(
    <MemoryRouter>
      <StampCollectionScreen allEntries={entries} onBack={noop} onHome={noop} />
    </MemoryRouter>,
  );

describe('the stamp collection', () => {
  it('shows the whole series on a fresh device, all unearned, with what each would take', () => {
    const view = mount();
    const tiles = view.container.querySelectorAll('[data-stamp]');
    expect(tiles.length).toBe(STAMP_CATALOG.length);
    expect(view.container.querySelectorAll('[data-stamp-earned="true"]').length).toBe(0);
    expect(view.container.querySelector('[data-stamps-issued]')?.textContent).toContain(`0 of ${STAMP_CATALOG.length} issued`);
    // An unearned tile carries the badge's blurb, not the denomination.
    const first = within(tiles[0] as HTMLElement);
    expect(first.getByText('FIRST SIP')).toBeTruthy();
    expect(first.getByText(/Mark your first grape/)).toBeTruthy();
    expect(first.queryByText('1¢')).toBeNull();
  });

  it('marks an earned stamp with its ink and denomination', () => {
    // One tasting earns FIRST SIP. The tried shelf is a plain id list under
    // the shelf's storage key (`bookmarks.ts` SHELF_KEY).
    window.localStorage.setItem('triedEntryIDs', JSON.stringify(['G001']));
    const view = mount();
    const earned = view.container.querySelectorAll('[data-stamp-earned="true"]');
    expect(earned.length).toBe(1);
    expect(earned[0]!.getAttribute('data-stamp')).toBe('firstSip');
    expect(within(earned[0] as HTMLElement).getByText('1¢')).toBeTruthy();
    expect(view.container.querySelector('[data-stamps-issued]')?.textContent).toContain('1 of');
  });

  it('opens a stamp\'s story on tap and closes it', () => {
    const view = mount();
    fireEvent.click(view.container.querySelector('[data-stamp="sommelier"]')!);
    const dialog = view.getByRole('dialog', { name: 'SOMMELIER story' });
    expect(within(dialog).getByText(/defers to your judgement/)).toBeTruthy();
    expect(within(dialog).getByText('50¢')).toBeTruthy();
    fireEvent.click(within(dialog).getByRole('button', { name: 'CLOSE' }));
    expect(view.queryByRole('dialog', { name: 'SOMMELIER story' })).toBeNull();
  });
});
