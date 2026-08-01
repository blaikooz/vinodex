import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearUnlocks,
  hasUnlockCode,
  isAppUnlocked,
  lockApp,
  subscribeToUnlocks,
  unlockApp,
  unlockedAppIds,
  UNLOCK_CODE_LENGTH,
} from './appUnlock';

const STORAGE_KEY = 'unlockedAppIDs';

describe('appUnlock', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('starts locked', () => {
    expect(isAppUnlocked('vinodex')).toBe(false);
    expect(unlockedAppIds()).toEqual([]);
  });

  it('accepts the right code and remembers it', () => {
    expect(unlockApp('vinodex', '0000')).toBe(true);
    expect(isAppUnlocked('vinodex')).toBe(true);
  });

  it('rejects a wrong code and writes nothing', () => {
    expect(unlockApp('vinodex', '1234')).toBe(false);
    expect(isAppUnlocked('vinodex')).toBe(false);
    // The absence of the key, not just an empty list: a rejected attempt must
    // leave no trace that a later read could misinterpret.
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('rejects a right-length wrong code and a prefix of the real one', () => {
    expect(unlockApp('vinodex', '0001')).toBe(false);
    expect(unlockApp('vinodex', '000')).toBe(false);
    expect(unlockApp('vinodex', '00000')).toBe(false);
    expect(unlockApp('vinodex', '')).toBe(false);
    expect(isAppUnlocked('vinodex')).toBe(false);
  });

  /** A pasted code usually arrives with a trailing newline or space. */
  it('tolerates surrounding whitespace', () => {
    expect(unlockApp('vinodex', '  0000\n')).toBe(true);
    expect(isAppUnlocked('vinodex')).toBe(true);
  });

  it('survives a reload from the same storage', () => {
    unlockApp('vinodex', '0000');
    const raw = window.localStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    // Re-reading is what a fresh page load does; the module holds no cache.
    expect(JSON.parse(raw as string)).toEqual(['vinodex']);
    expect(isAppUnlocked('vinodex')).toBe(true);
  });

  it('does not duplicate an id when unlocked twice', () => {
    unlockApp('vinodex', '0000');
    unlockApp('vinodex', '0000');
    expect(unlockedAppIds()).toEqual(['vinodex']);
  });

  it('re-locks', () => {
    unlockApp('vinodex', '0000');
    lockApp('vinodex');
    expect(isAppUnlocked('vinodex')).toBe(false);
    // And the code still works afterwards — re-locking is not a permanent burn.
    expect(unlockApp('vinodex', '0000')).toBe(true);
  });

  it('clears every unlock', () => {
    unlockApp('vinodex', '0000');
    clearUnlocks();
    expect(unlockedAppIds()).toEqual([]);
  });

  /**
   * The guard that matters most: a foreign or corrupt value must read as
   * "nothing unlocked" rather than throwing on every render.
   */
  it.each([
    ['not json at all', '{{{'],
    ['a JSON object', '{"vinodex":true}'],
    ['a JSON string', '"vinodex"'],
    ['a mixed array', '[1, null, "vinodex"]'],
  ])('treats %s as no unlocks (or filters it)', (_label, raw) => {
    window.localStorage.setItem(STORAGE_KEY, raw);
    expect(() => unlockedAppIds()).not.toThrow();
    expect(() => isAppUnlocked('vinodex')).not.toThrow();
  });

  it('keeps only the string members of a mixed array', () => {
    window.localStorage.setItem(STORAGE_KEY, '[1, null, "vinodex"]');
    expect(unlockedAppIds()).toEqual(['vinodex']);
  });

  it('notifies subscribers on unlock and on re-lock', () => {
    const seen = vi.fn();
    const unsubscribe = subscribeToUnlocks(seen);

    unlockApp('vinodex', '0000');
    expect(seen).toHaveBeenCalledTimes(1);

    // A rejected code changes nothing, so it must not wake the views.
    unlockApp('vinodex', 'nope');
    expect(seen).toHaveBeenCalledTimes(1);

    // Nor does unlocking something already unlocked.
    unlockApp('vinodex', '0000');
    expect(seen).toHaveBeenCalledTimes(1);

    lockApp('vinodex');
    expect(seen).toHaveBeenCalledTimes(2);

    unsubscribe();
    unlockApp('vinodex', '0000');
    expect(seen).toHaveBeenCalledTimes(2);
  });

  it('does not notify when clearing an already-empty store', () => {
    const seen = vi.fn();
    subscribeToUnlocks(seen);
    clearUnlocks();
    expect(seen).not.toHaveBeenCalled();
  });

  it('knows which ids it gates', () => {
    expect(hasUnlockCode('vinodex')).toBe(true);
    expect(hasUnlockCode('not-an-app')).toBe(false);
  });

  /** The pip row and the input length are driven off this. */
  it('states a code length matching the real code', () => {
    expect(UNLOCK_CODE_LENGTH).toBe(4);
  });
});
