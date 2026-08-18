/**
 * Named snapshots of the whole saved state — up to five of them. Ported from
 * `vinodex-ios/Sources/VinodexCore/UserProfiles.swift` (0.8.92, item 5) —
 * v6#32.
 *
 * **What a profile is.** Everything the app persists lives in localStorage
 * under the app's origin: shelves, ratings, streaks, exam history, skin,
 * screen mode, the lot. A profile is that domain, filtered to the app's own
 * keys and written to a slot. SAVE captures the current domain; LOAD replaces
 * it with a slot's snapshot and the caller reloads into it.
 *
 * **Why snapshots and not a keyed namespace** — iOS's reasoning holds here
 * verbatim: prefixing every storage key with a profile id would touch every
 * store and every raw-key read; a snapshot leaves every store byte-for-byte
 * on the keys it has always used, and deleting the feature would leave no
 * trace in any store.
 *
 * **The store's own keys live outside the domain it snapshots** — if the
 * index lived inside, every profile would carry a copy of the profile table
 * and loading one would rewrite it. On iOS "outside" is a file in Application
 * Support; here it is the `userProfile*` prefix, excluded by the filter. The
 * web's one advantage over `UserDefaults`: the origin is ours alone, so there
 * are no system-planted keys to blacklist.
 *
 * **The built-in rows.** FRESH is not a slot: it is a virtual row whose
 * snapshot is empty — loading it is a fresh install, every time. HORIZON is
 * slot 1, seeded once when no index exists at all; an empty index that *does*
 * exist means the user deleted their profiles, and re-seeding would resurrect
 * what they removed.
 */

export const MAX_PROFILES = 5;

/** The virtual fresh-install row's display name — not a name a slot may take. */
export const FRESH_PROFILE_NAME = 'FRESH';

const INDEX_KEY = 'userProfilesIndex';
const slotKey = (slot: number) => `userProfileSlot-${slot}`;

export interface Profile {
  /** 1…MAX_PROFILES. */
  slot: number;
  name: string;
  /** Epoch ms of the last SAVE; null until the first one lands — a seeded
   *  profile exists in the index before it has a snapshot, and loading it is
   *  a fresh start until it is saved into. */
  savedAt: number | null;
}

const subscribers = new Set<() => void>();
const notify = () => subscribers.forEach(fn => fn());
export const subscribeToProfiles = (fn: () => void): (() => void) => {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
};

const ls = (): Storage | null => (typeof window === 'undefined' ? null : window.localStorage);

/**
 * Whether a storage key is the app's own saved state. The store's own keys
 * are the only strangers in this origin.
 */
export const isAppStateKey = (key: string): boolean => !key.startsWith('userProfile');

/** The current domain, filtered — what SAVE captures. */
export const currentSnapshot = (): Record<string, string> => {
  const storage = ls();
  const out: Record<string, string> = {};
  if (!storage) return out;
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key === null || !isAppStateKey(key)) continue;
    const value = storage.getItem(key);
    if (value !== null) out[key] = value;
  }
  return out;
};

const readIndex = (): Profile[] => {
  try {
    const raw = ls()?.getItem(INDEX_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Out-of-range or duplicate slots cannot arise from this code, but the
    // index is user-editable storage; dropping strangers is the same
    // self-clean the bookmark store applies to dead entry ids.
    const seen = new Set<number>();
    return parsed
      .filter((p): p is Profile => {
        if (!p || typeof p !== 'object') return false;
        const { slot, name } = p as Profile;
        if (typeof slot !== 'number' || typeof name !== 'string') return false;
        if (slot < 1 || slot > MAX_PROFILES || seen.has(slot)) return false;
        seen.add(slot);
        return true;
      })
      .map(p => ({ slot: p.slot, name: p.name, savedAt: typeof p.savedAt === 'number' ? p.savedAt : null }))
      .sort((a, b) => a.slot - b.slot);
  } catch {
    return [];
  }
};

const writeIndex = (profiles: Profile[]): void => {
  try {
    ls()?.setItem(INDEX_KEY, JSON.stringify(profiles));
  } catch {
    /* ignore */
  }
  notify();
};

/**
 * HORIZON, seeded once — only when the index does not exist at all. Called on
 * first read, so the store needs no init hook.
 */
const seedIfNeeded = (): void => {
  const storage = ls();
  if (!storage) return;
  if (storage.getItem(INDEX_KEY) !== null) return;
  writeIndex([{ slot: 1, name: 'HORIZON', savedAt: null }]);
};

export const profiles = (): Profile[] => {
  seedIfNeeded();
  return readIndex();
};

export const profileInSlot = (slot: number): Profile | null =>
  profiles().find(p => p.slot === slot) ?? null;

/** Every slot number, occupied or not, for the SAVE list. */
export const allSlots = (): number[] => Array.from({ length: MAX_PROFILES }, (_, i) => i + 1);

/**
 * Capture the current domain into a slot. `name` applies to a new slot (or a
 * rename); an occupied slot keeps its name when omitted. Returns false on an
 * out-of-range slot — reported, not swallowed.
 */
export const saveProfile = (slot: number, name?: string): boolean => {
  if (slot < 1 || slot > MAX_PROFILES) return false;
  const storage = ls();
  if (!storage) return false;
  try {
    storage.setItem(slotKey(slot), JSON.stringify(currentSnapshot()));
  } catch {
    return false;
  }
  const resolvedName = name ?? profileInSlot(slot)?.name ?? `PROFILE ${slot}`;
  const next = profiles().filter(p => p.slot !== slot);
  next.push({ slot, name: resolvedName, savedAt: Date.now() });
  writeIndex(next.sort((a, b) => a.slot - b.slot));
  return true;
};

/**
 * A slot's snapshot, or null when it has never been saved into — the caller
 * treats null as "fresh install", which is exactly what a seeded but
 * never-saved HORIZON should load as.
 */
export const snapshotOfSlot = (slot: number): Record<string, string> | null => {
  if (!profileInSlot(slot)) return null;
  try {
    const raw = ls()?.getItem(slotKey(slot));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof v === 'string' && isAppStateKey(k)) out[k] = v;
    }
    return out;
  } catch {
    return null;
  }
};

/** Remove every app-state key — the destructive half of any load. */
const clearAppState = (): void => {
  const storage = ls();
  if (!storage) return;
  const doomed: string[] = [];
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key !== null && isAppStateKey(key)) doomed.push(key);
  }
  for (const key of doomed) storage.removeItem(key);
};

/**
 * Replace the current domain with a slot's snapshot (or with nothing, for
 * FRESH / a never-saved slot). **The caller must reload afterwards** so every
 * external store re-reads — the web analogue of iOS's relaunch-into-it.
 */
export const loadProfile = (slot: number | 'fresh'): void => {
  const snapshot = slot === 'fresh' ? null : snapshotOfSlot(slot);
  clearAppState();
  if (snapshot) {
    const storage = ls();
    for (const [k, v] of Object.entries(snapshot)) {
      try {
        storage?.setItem(k, v);
      } catch {
        /* quota — partial load is still reported by the reload */
      }
    }
  }
  notify();
};
