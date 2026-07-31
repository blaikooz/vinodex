import { describe, it, expect, beforeEach } from 'vitest';
import {
  shelfIds,
  isOnShelf,
  toggleShelf,
  removeFromShelf,
  clearShelf,
  getRating,
  setRating,
  makeRating,
  removeEverything,
  isBookmarked,
  toggleBookmark,
} from './bookmarks';

// Mirrors BookmarkTests.swift, extended for the 3-shelf + ratings model.
describe('bookmarks — saved shelf', () => {
  beforeEach(() => localStorage.clear());

  it('toggle adds then removes', () => {
    expect(isBookmarked('G001')).toBe(false);
    expect(toggleBookmark('G001')).toBe(true);
    expect(isBookmarked('G001')).toBe(true);
    expect(toggleBookmark('G001')).toBe(false);
    expect(isBookmarked('G001')).toBe(false);
  });

  it('newest saved comes first', () => {
    toggleBookmark('G001');
    toggleBookmark('G002');
    toggleBookmark('G003');
    expect(shelfIds('saved')).toEqual(['G003', 'G002', 'G001']);
  });

  it('survives a reload (localStorage)', () => {
    toggleBookmark('R001');
    toggleBookmark('S001');
    expect(shelfIds('saved')).toEqual(['S001', 'R001']);
  });
});

describe('bookmarks — shelves + coupling', () => {
  beforeEach(() => localStorage.clear());

  it('the three shelves are independent', () => {
    toggleShelf('saved', 'G001');
    toggleShelf('wantToTry', 'G002');
    toggleShelf('tried', 'G003');
    expect(isOnShelf('saved', 'G001')).toBe(true);
    expect(isOnShelf('wantToTry', 'G002')).toBe(true);
    expect(isOnShelf('tried', 'G003')).toBe(true);
    expect(isOnShelf('saved', 'G002')).toBe(false);
  });

  it('marking TRIED pulls the id off WANT', () => {
    toggleShelf('wantToTry', 'G001');
    expect(isOnShelf('wantToTry', 'G001')).toBe(true);
    toggleShelf('tried', 'G001');
    expect(isOnShelf('tried', 'G001')).toBe(true);
    expect(isOnShelf('wantToTry', 'G001')).toBe(false);
  });

  it('un-trying drops the rating', () => {
    toggleShelf('tried', 'G001');
    setRating('G001', makeRating(4, 'nice'));
    expect(getRating('G001')?.rating).toBe(4);
    toggleShelf('tried', 'G001'); // off
    expect(getRating('G001')).toBeUndefined();
  });

  it('removing from tried drops the rating; clearing tried wipes all ratings', () => {
    toggleShelf('tried', 'G001');
    toggleShelf('tried', 'G002');
    setRating('G001', makeRating(5, ''));
    setRating('G002', makeRating(3, 'ok'));
    removeFromShelf('tried', 'G001');
    expect(getRating('G001')).toBeUndefined();
    expect(getRating('G002')?.rating).toBe(3);
    clearShelf('tried');
    expect(getRating('G002')).toBeUndefined();
    expect(shelfIds('tried').length).toBe(0);
  });

  it('makeRating stamps a day index', () => {
    const r = makeRating(4, 'earthy');
    expect(r.rating).toBe(4);
    expect(r.note).toBe('earthy');
    expect(typeof r.day).toBe('number');
  });

  it('removeEverything wipes all shelves and ratings', () => {
    toggleShelf('saved', 'G001');
    toggleShelf('wantToTry', 'G002');
    toggleShelf('tried', 'G003');
    setRating('G003', makeRating(5, ''));
    removeEverything();
    expect(shelfIds('saved').length).toBe(0);
    expect(shelfIds('wantToTry').length).toBe(0);
    expect(shelfIds('tried').length).toBe(0);
    expect(getRating('G003')).toBeUndefined();
  });
});
