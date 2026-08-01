import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  bookmarkCount,
  bookmarkIds,
  clearBookmarks,
  isBookmarked,
  removeBookmark,
  savedEntries,
  subscribeToBookmarks,
  toggleBookmark,
} from './bookmarks';
import { getAllEntries } from './wineData';

/**
 * Ported from `vinodex-ios/Tests/VinodexCoreTests/BookmarkTests.swift`.
 *
 * The Swift suite gives each test its own `UserDefaults(suiteName:)`; here a
 * `localStorage.clear()` per test does the same job, because the module holds
 * no cache of its own and re-reads storage on every call.
 *
 * The Swift cases covering `SavedItem` — the country/state prefixes, the
 * `storageID` round trip, `saved(in:)` versus `entries(in:)` — have no
 * counterpart and are deliberately not ported: the web app ships COUNTRY_GATE
 * entries, so a country is an entry like any other and the whole distinction is
 * absent. `bookmarks.ts` records that difference in its header.
 */
describe('bookmarks', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('toggle adds then removes', () => {
    expect(bookmarkCount()).toBe(0);

    expect(toggleBookmark('G001')).toBe(true);
    expect(isBookmarked('G001')).toBe(true);
    expect(bookmarkCount()).toBe(1);

    expect(toggleBookmark('G001')).toBe(false);
    expect(isBookmarked('G001')).toBe(false);
    expect(bookmarkCount()).toBe(0);
  });

  it('newest saved comes first', () => {
    toggleBookmark('G001');
    toggleBookmark('G002');
    toggleBookmark('G003');
    expect(bookmarkIds()).toEqual(['G003', 'G002', 'G001']);
  });

  it('survives a reload from the same storage', () => {
    toggleBookmark('R001');
    toggleBookmark('S001');
    // A cold load re-reads the same key; nothing is memoised in the module.
    expect(bookmarkIds()).toEqual(['S001', 'R001']);
  });

  it('removeBookmark drops one without disturbing the rest', () => {
    toggleBookmark('G001');
    toggleBookmark('G002');
    toggleBookmark('G003');
    removeBookmark('G002');
    expect(bookmarkIds()).toEqual(['G003', 'G001']);
  });

  it('removing something absent is a no-op', () => {
    toggleBookmark('G001');
    removeBookmark('NOPE');
    expect(bookmarkIds()).toEqual(['G001']);
  });

  it('clear empties the store', () => {
    toggleBookmark('G001');
    toggleBookmark('G002');
    clearBookmarks();
    expect(bookmarkCount()).toBe(0);
  });

  /**
   * Bookmarks store ids, so a regenerated dataset that drops an entry must not
   * leave a dead row behind — the Swift `skipsUnknownIDs` case.
   */
  it('ids the dataset no longer has are skipped', () => {
    const all = getAllEntries();
    const real = all.find(e => e.category === 'GRAPES');
    expect(real).toBeDefined();

    toggleBookmark('NOT_A_REAL_ID');
    toggleBookmark(real!.id);

    const resolved = savedEntries(all);
    expect(resolved).toHaveLength(1);
    expect(resolved[0]?.id).toBe(real!.id);
  });

  it('resolves saved entries newest first', () => {
    const all = getAllEntries();
    const grapes = all.filter(e => e.category === 'GRAPES').slice(0, 2);
    expect(grapes).toHaveLength(2);

    toggleBookmark(grapes[0]!.id);
    toggleBookmark(grapes[1]!.id);

    expect(savedEntries(all).map(e => e.id)).toEqual([grapes[1]!.id, grapes[0]!.id]);
  });

  it('a store of only stale ids resolves to nothing', () => {
    toggleBookmark('NOT_REAL');
    expect(savedEntries(getAllEntries())).toEqual([]);
  });

  /** A corrupt or foreign value must read as empty, not throw on every render. */
  it.each([
    ['not json at all', '{{{'],
    ['a JSON object', '{"G001":true}'],
    ['a bare string', '"G001"'],
  ])('treats %s as an empty list', (_label, raw) => {
    window.localStorage.setItem('bookmarkedEntryIDs', raw);
    expect(() => bookmarkIds()).not.toThrow();
    expect(bookmarkIds()).toEqual([]);
  });

  it('keeps only the string members of a mixed array', () => {
    window.localStorage.setItem('bookmarkedEntryIDs', '[1, null, "G001"]');
    expect(bookmarkIds()).toEqual(['G001']);
  });

  it('notifies subscribers on change and stops after unsubscribe', () => {
    const seen = vi.fn();
    const unsubscribe = subscribeToBookmarks(seen);

    toggleBookmark('G001');
    expect(seen).toHaveBeenCalledTimes(1);

    toggleBookmark('G001');
    expect(seen).toHaveBeenCalledTimes(2);

    unsubscribe();
    toggleBookmark('G002');
    expect(seen).toHaveBeenCalledTimes(2);
  });

  it('does not notify when clearing an already-empty store', () => {
    const seen = vi.fn();
    subscribeToBookmarks(seen);
    clearBookmarks();
    expect(seen).not.toHaveBeenCalled();
  });
});
