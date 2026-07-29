import { useSyncExternalStore } from 'react';
import { bookmarksRevision, subscribeToBookmarks } from './bookmarks';

/**
 * Re-renders the caller whenever the saved list changes.
 *
 * The bookmark store lives outside React so a save button anywhere can write to
 * it without a context provider threaded through the tree; this is the seam
 * that lets views notice. `useSyncExternalStore` rather than a `useState`
 * mirror, so two save buttons for the same entry can never disagree.
 *
 * Returns the revision counter — callers use it only as a change signal and
 * read the actual list through the store's own functions.
 */
export function useBookmarks(): number {
  return useSyncExternalStore(subscribeToBookmarks, bookmarksRevision, bookmarksRevision);
}
