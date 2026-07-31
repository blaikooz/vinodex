import { useSyncExternalStore } from 'react';
import { recentsRevision, subscribeToRecents } from './recentlyViewed';

/** Re-renders the caller whenever the recently-viewed trail changes. */
export function useRecentlyViewed(): number {
  return useSyncExternalStore(subscribeToRecents, recentsRevision, recentsRevision);
}
