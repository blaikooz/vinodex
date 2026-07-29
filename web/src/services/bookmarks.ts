import { WineEntry } from '@/shared/types';

/**
 * Saved entries, persisted as a list of entry ids.
 *
 * Ported from `vinodex-ios/Sources/VinodexCore/Bookmarks.swift`. Ids rather
 * than whole entries: the dataset is regenerated regularly, and storing copies
 * would leave the saved list showing stale text after a data change. An id that
 * no longer resolves is dropped on read, which is also how a removed entry
 * cleans itself up.
 *
 * Simpler than the Swift original in one way. That one carries a `SavedItem`
 * enum because countries and states are not entries in the iOS port — the
 * COUNTRY_GATE data is not shipped there, so places round-trip through prefixed
 * synthetic ids. The web app *does* have COUNTRY_GATE entries, so a country is
 * an entry like any other and the whole distinction disappears.
 *
 * Unlike `screenState`, this genuinely persists: a saved list that emptied on
 * refresh would not be a saved list.
 */

const STORAGE_KEY = 'bookmarkedEntryIDs';

/** Bumped on every change so React views can re-read; see `useBookmarks`. */
let revision = 0;
const listeners = new Set<() => void>();

function read(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
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

function write(ids: string[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Private-mode Safari and full quotas both throw. The in-memory list stays
    // correct for this session, which is the best available outcome.
  }
  revision += 1;
  listeners.forEach(fn => fn());
}

export function bookmarkIds(): string[] {
  return read();
}

export function isBookmarked(id: string): boolean {
  return read().includes(id);
}

export function bookmarkCount(): number {
  return read().length;
}

/** @returns true if the entry is now saved. Most recent first. */
export function toggleBookmark(id: string): boolean {
  const ids = read();
  const index = ids.indexOf(id);
  if (index >= 0) {
    ids.splice(index, 1);
    write(ids);
    return false;
  }
  ids.unshift(id);
  write(ids);
  return true;
}

export function removeBookmark(id: string): void {
  const ids = read();
  const index = ids.indexOf(id);
  if (index < 0) return;
  ids.splice(index, 1);
  write(ids);
}

export function clearBookmarks(): void {
  if (read().length === 0) return;
  write([]);
}

/** Saved entries in save order, skipping ids the dataset no longer has. */
export function savedEntries(all: WineEntry[]): WineEntry[] {
  const byId = new Map(all.map(e => [e.id, e]));
  return read()
    .map(id => byId.get(id))
    .filter((e): e is WineEntry => !!e);
}

// A store outside React, subscribed to with `useSyncExternalStore`, so every
// save button and the saved list stay in step without a context provider
// threaded through the whole tree.

export function subscribeToBookmarks(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

export function bookmarksRevision(): number {
  return revision;
}
