import { useSyncExternalStore } from 'react';
import { subscribeToUnlocks, unlocksRevision } from './appUnlock';

/**
 * Re-renders the caller whenever an app is unlocked or re-locked.
 *
 * Same shape as `useBookmarks`: the store lives outside React so the unlock
 * screen can write to it without a provider in the tree, and this is the seam
 * that lets the OUR APPS shelf notice. Returns the revision counter, which
 * callers use only as a change signal — the actual state is read back through
 * `isAppUnlocked`.
 */
export function useAppUnlock(): number {
  return useSyncExternalStore(subscribeToUnlocks, unlocksRevision, unlocksRevision);
}
