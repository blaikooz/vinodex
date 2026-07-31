import { describe, it, expect, beforeEach } from 'vitest';
import { buildWineEntries } from '@/shared/constants';
import type { WineEntry } from '@/shared/types';
import { recordRecentlyViewed, recentEntries, recentsIsEmpty, clearRecentlyViewed } from './recentlyViewed';

const all = buildWineEntries() as WineEntry[];
const KEY = 'recentlyViewedEntryIDs';
const rawIds = (): string[] => JSON.parse(localStorage.getItem(KEY) ?? '[]');

// Mirrors RecentlyViewedTests.swift.
describe('recently viewed', () => {
  beforeEach(() => localStorage.clear());

  it('newest visit comes first', () => {
    recordRecentlyViewed('G001');
    recordRecentlyViewed('R001');
    recordRecentlyViewed('S001');
    expect(rawIds()).toEqual(['S001', 'R001', 'G001']);
  });

  it('a repeat visit moves to the front instead of duplicating', () => {
    recordRecentlyViewed('G001');
    recordRecentlyViewed('R001');
    recordRecentlyViewed('G001');
    expect(rawIds()).toEqual(['G001', 'R001']);
  });

  it('re-recording the front id is a no-op', () => {
    recordRecentlyViewed('G001');
    recordRecentlyViewed('G001');
    expect(rawIds()).toEqual(['G001']);
  });

  it('the trail is capped at 20, newest survive', () => {
    for (let i = 0; i < 25; i++) recordRecentlyViewed(`E${i}`);
    const ids = rawIds();
    expect(ids.length).toBe(20);
    expect(ids[0]).toBe('E24');
    expect(ids).not.toContain('E0');
  });

  it('ids the dataset no longer has are skipped when resolving', () => {
    const real = all.find(e => e.category === 'GRAPES')!;
    recordRecentlyViewed('NOT_A_REAL_ID');
    recordRecentlyViewed(real.id);
    expect(recentEntries(all).map(e => e.id)).toEqual([real.id]);
  });

  it('clear empties the trail and the stored key', () => {
    recordRecentlyViewed('G001');
    clearRecentlyViewed();
    expect(recentsIsEmpty()).toBe(true);
    expect(rawIds()).toEqual([]);
  });
});
