import { useSyncExternalStore } from 'react';
import { profileRevision, subscribeToProfile } from './profile';

/** Re-renders the caller whenever the display name or avatar changes. */
export function useProfile(): number {
  return useSyncExternalStore(subscribeToProfile, profileRevision, profileRevision);
}
