import { WineEntry } from '@/shared/types';

/**
 * The "scent trail" — a short, most-recent-first list of the entries you last
 * opened, shown on the collection screen. Ported from
 * `vinodex-ios/Sources/VinodexCore/RecentlyViewed.swift`.
 *
 * Ids, not entries (self-cleans on read like the shelves). A trail, so each id
 * appears once: recording an id already present moves it to the front rather
 * than duplicating it. Capped, newest-first, persisted.
 */

const STORAGE_KEY = 'recentlyViewedEntryIDs';
const CAPACITY = 20;

let revision = 0;
const listeners = new Set<() => void>();

function read(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
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
    /* private-mode / quota — session stays correct */
  }
  revision += 1;
  listeners.forEach(fn => fn());
}

/**
 * Record an open. If it's already at the front this is a no-op (so returning to
 * a screen that re-fires this on every visit doesn't churn observers); else it
 * moves to the front and the list is trimmed to the cap.
 */
export function recordRecentlyViewed(id: string): void {
  const ids = read();
  if (ids[0] === id) return;
  const existing = ids.indexOf(id);
  if (existing >= 0) ids.splice(existing, 1);
  ids.unshift(id);
  if (ids.length > CAPACITY) ids.length = CAPACITY;
  write(ids);
}

/** Recent entries, newest first, skipping ids the dataset no longer has. */
export function recentEntries(all: WineEntry[]): WineEntry[] {
  const byId = new Map(all.map(e => [e.id, e]));
  return read()
    .map(id => byId.get(id))
    .filter((e): e is WineEntry => !!e);
}

export function recentsIsEmpty(): boolean {
  return read().length === 0;
}

export function clearRecentlyViewed(): void {
  if (read().length === 0) return;
  write([]);
}

export function subscribeToRecents(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

export function recentsRevision(): number {
  return revision;
}
