import { useSyncExternalStore } from 'react';
import { accessRevision, subscribeToAccess } from './access';

/** Re-renders the caller when the free-tier switch or any grant changes. */
export function useAccess(): number {
  return useSyncExternalStore(subscribeToAccess, accessRevision, accessRevision);
}
