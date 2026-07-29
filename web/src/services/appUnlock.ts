/**
 * The website's app gate — the code that hands an app over from OUR APPS.
 *
 * Deliberately not `access.ts`. That one is the in-dex paywall harness and
 * models *which bundles someone owns*; this models *whether the website will
 * open the app at all*. They never consult each other, and unlocking here
 * grants no entitlements — a freshly unlocked Vinodex is exactly as open as it
 * was before, because the paywall switch still defaults off.
 *
 * The code lives in the client, so this is a doorman rather than a lock:
 * anyone who reads the bundle finds `0000`. That is the intent at this stage.
 * The gate is there to make the app feel handed over rather than stumbled
 * into, and a code that actually withheld something would need a server to
 * check it against.
 *
 * Persisted, for the same reason `bookmarks` is: a gate that reopened on every
 * refresh reads as a bug rather than as security. SETTINGS → DATA can re-lock.
 */

export type AppId = 'vinodex';

const STORAGE_KEY = 'unlockedAppIDs';

/**
 * Keyed by app rather than one global flag, so the second app on the shelf
 * gets its own gate without this file changing shape.
 */
const UNLOCK_CODES: Record<AppId, string> = {
  vinodex: '0000',
};

/** Drives the input's `maxLength` and the filled/empty pip row. */
export const UNLOCK_CODE_LENGTH = 4;

let revision = 0;
const listeners = new Set<() => void>();

function read(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    // Anything that is not an array of strings is corrupt or foreign; treat it
    // as "nothing unlocked" rather than letting it throw on every render.
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
    // Private-mode Safari and full quotas both throw. The in-memory result
    // stays correct for this session, which is the best available outcome.
  }
  revision += 1;
  listeners.forEach(fn => fn());
}

export function unlockedAppIds(): string[] {
  return read();
}

export function isAppUnlocked(id: AppId): boolean {
  return read().includes(id);
}

/** Every app the shelf can gate, whether or not it is unlocked yet. */
export function hasUnlockCode(id: string): id is AppId {
  return Object.prototype.hasOwnProperty.call(UNLOCK_CODES, id);
}

/**
 * @returns true if the code was right — and only then is anything written.
 *
 * Whitespace is trimmed because a pasted code often carries a trailing space,
 * and rejecting that would look like the right code being refused.
 */
export function unlockApp(id: AppId, code: string): boolean {
  if (code.trim() !== UNLOCK_CODES[id]) return false;
  const ids = read();
  if (!ids.includes(id)) {
    ids.push(id);
    write(ids);
  }
  return true;
}

export function lockApp(id: AppId): void {
  const ids = read();
  const index = ids.indexOf(id);
  if (index < 0) return;
  ids.splice(index, 1);
  write(ids);
}

export function clearUnlocks(): void {
  if (read().length === 0) return;
  write([]);
}

// A store outside React, subscribed to with `useSyncExternalStore`, so the
// shelf and the unlock screen stay in step without a context provider threaded
// through the tree — the same seam `bookmarks` uses.

export function subscribeToUnlocks(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

export function unlocksRevision(): number {
  return revision;
}
