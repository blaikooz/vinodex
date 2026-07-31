import { WineEntry } from '@/shared/types';
import { dayIndex } from './dailyPick';

/**
 * The collection: three shelves — SAVED (reference), WANT TO TRY (wishlist) and
 * TRIED (history) — plus a star/note rating per tried entry.
 *
 * Ported from `vinodex-ios/Sources/VinodexCore/Bookmarks.swift`. Ids rather than
 * whole entries: the dataset is regenerated regularly, and storing copies would
 * leave a shelf showing stale text after a data change. An id that no longer
 * resolves is dropped on read, which is also how a removed entry cleans itself
 * up.
 *
 * Persistence keys match the iOS app's UserDefaults keys exactly
 * (`bookmarkedEntryIDs`, `wantToTryEntryIDs`, `triedEntryIDs`, `triedRatings`)
 * so the two apps could ever share a backup, and so the original single-shelf
 * saved list upgrades in place.
 *
 * Simpler than the Swift original in one way: that one carries a `SavedItem`
 * enum because countries/states are not entries in the iOS port. The web app
 * *does* ship COUNTRY_GATE entries, so a place is an entry like any other and
 * that distinction disappears. Only tastable entries (grapes, styles) are ever
 * put on WANT/TRIED — enforced by the UI, exactly as iOS does it.
 *
 * Unlike `screenState`, this genuinely persists: a shelf that emptied on
 * refresh would not be a shelf.
 */

export type Shelf = 'saved' | 'wantToTry' | 'tried';

export interface TriedRating {
  /** 1–5. */
  rating: number;
  /** One-line note; may be empty. */
  note: string;
  /** The `dayIndex` the rating was recorded, for the passport/streak later. */
  day: number;
}

const SHELF_KEY: Record<Shelf, string> = {
  saved: 'bookmarkedEntryIDs',
  wantToTry: 'wantToTryEntryIDs',
  tried: 'triedEntryIDs',
};
const RATINGS_KEY = 'triedRatings';

/** Bumped on every change so React views can re-read; see `useBookmarks`. */
let revision = 0;
const listeners = new Set<() => void>();

function emit(): void {
  revision += 1;
  listeners.forEach(fn => fn());
}

function readIds(key: string): string[] {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    // Anything that is not an array of strings is a corrupt or foreign value;
    // treat it as empty rather than letting it crash every render.
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is string => typeof v === 'string');
  } catch {
    return [];
  }
}

function writeIds(key: string, ids: string[]): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(ids));
  } catch {
    // Private-mode Safari and full quotas both throw. The in-memory list stays
    // correct for this session, which is the best available outcome.
  }
}

function readRatings(): Record<string, TriedRating> {
  try {
    const raw = window.localStorage.getItem(RATINGS_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const out: Record<string, TriedRating> = {};
    for (const [id, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (v && typeof v === 'object') {
        const r = v as Record<string, unknown>;
        if (typeof r.rating === 'number') {
          out[id] = {
            rating: r.rating,
            note: typeof r.note === 'string' ? r.note : '',
            day: typeof r.day === 'number' ? r.day : 0,
          };
        }
      }
    }
    return out;
  } catch {
    return {};
  }
}

function writeRatings(map: Record<string, TriedRating>): void {
  try {
    if (Object.keys(map).length === 0) {
      // Match iOS: an empty map removes the key rather than writing "{}".
      window.localStorage.removeItem(RATINGS_KEY);
    } else {
      window.localStorage.setItem(RATINGS_KEY, JSON.stringify(map));
    }
  } catch {
    /* see writeIds */
  }
}

// ---------------------------------------------------------------------------
// Shelf-generic API
// ---------------------------------------------------------------------------

export function shelfIds(shelf: Shelf): string[] {
  return readIds(SHELF_KEY[shelf]);
}

export function isOnShelf(shelf: Shelf, id: string): boolean {
  return readIds(SHELF_KEY[shelf]).includes(id);
}

export function shelfCount(shelf: Shelf): number {
  return readIds(SHELF_KEY[shelf]).length;
}

/**
 * Toggle an id on a shelf. @returns true if it is now on the shelf.
 * Coupling matches Bookmarks.swift: adding to TRIED removes it from WANT
 * (you cannot want what you've had); removing from TRIED drops any rating
 * (a score for something you now say you haven't drunk is noise).
 */
export function toggleShelf(shelf: Shelf, id: string): boolean {
  const key = SHELF_KEY[shelf];
  const ids = readIds(key);
  const index = ids.indexOf(id);
  if (index >= 0) {
    ids.splice(index, 1);
    writeIds(key, ids);
    if (shelf === 'tried') clearRatingInternal(id);
    emit();
    return false;
  }
  ids.unshift(id); // most-recent-first
  writeIds(key, ids);
  if (shelf === 'tried') {
    const wantKey = SHELF_KEY.wantToTry;
    const want = readIds(wantKey);
    const wi = want.indexOf(id);
    if (wi >= 0) {
      want.splice(wi, 1);
      writeIds(wantKey, want);
    }
  }
  emit();
  return true;
}

export function removeFromShelf(shelf: Shelf, id: string): void {
  const key = SHELF_KEY[shelf];
  const ids = readIds(key);
  const index = ids.indexOf(id);
  if (index < 0) return;
  ids.splice(index, 1);
  writeIds(key, ids);
  if (shelf === 'tried') clearRatingInternal(id);
  emit();
}

export function clearShelf(shelf: Shelf): void {
  if (readIds(SHELF_KEY[shelf]).length === 0 && !(shelf === 'tried' && hasAnyRating())) return;
  writeIds(SHELF_KEY[shelf], []);
  if (shelf === 'tried') writeRatings({});
  emit();
}

/** Shelf entries in shelf order, skipping ids the dataset no longer has. */
export function shelfEntries(shelf: Shelf, all: WineEntry[]): WineEntry[] {
  const byId = new Map(all.map(e => [e.id, e]));
  return readIds(SHELF_KEY[shelf])
    .map(id => byId.get(id))
    .filter((e): e is WineEntry => !!e);
}

/** Wipe every shelf and all ratings — the CLEAR SAVED DATA control. */
export function removeEverything(): void {
  writeIds(SHELF_KEY.saved, []);
  writeIds(SHELF_KEY.wantToTry, []);
  writeIds(SHELF_KEY.tried, []);
  writeRatings({});
  emit();
}

// ---------------------------------------------------------------------------
// Ratings
// ---------------------------------------------------------------------------

function hasAnyRating(): boolean {
  return Object.keys(readRatings()).length > 0;
}

function clearRatingInternal(id: string): void {
  const map = readRatings();
  if (!(id in map)) return;
  delete map[id];
  writeRatings(map);
}

export function getRating(id: string): TriedRating | undefined {
  return readRatings()[id];
}

/** Set (or clear, with null) the rating for a tried entry. */
export function setRating(id: string, rating: TriedRating | null): void {
  const map = readRatings();
  if (rating === null) {
    if (!(id in map)) return;
    delete map[id];
  } else {
    map[id] = rating;
  }
  writeRatings(map);
  emit();
}

/** Build a rating stamped with today's day index (matches iOS callers). */
export function makeRating(rating: number, note: string): TriedRating {
  return { rating, note, day: dayIndex() };
}

// ---------------------------------------------------------------------------
// Backward-compatible SAVE-shelf facade (unchanged call sites keep working)
// ---------------------------------------------------------------------------

export function bookmarkIds(): string[] {
  return shelfIds('saved');
}

export function isBookmarked(id: string): boolean {
  return isOnShelf('saved', id);
}

export function bookmarkCount(): number {
  return shelfCount('saved');
}

/** @returns true if the entry is now saved. Most recent first. */
export function toggleBookmark(id: string): boolean {
  return toggleShelf('saved', id);
}

export function removeBookmark(id: string): void {
  removeFromShelf('saved', id);
}

export function clearBookmarks(): void {
  clearShelf('saved');
}

/** Saved entries in save order, skipping ids the dataset no longer has. */
export function savedEntries(all: WineEntry[]): WineEntry[] {
  return shelfEntries('saved', all);
}

// A store outside React, subscribed to with `useSyncExternalStore`, so every
// shelf button and the collection screen stay in step without a context
// provider threaded through the whole tree.

export function subscribeToBookmarks(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

export function bookmarksRevision(): number {
  return revision;
}
