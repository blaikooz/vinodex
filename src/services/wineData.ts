import { WineEntry } from '../../types';
import { WINE_ENTRIES } from '../../constants';
import { isSupabaseEnabled, loadAllEntriesFromSupabase } from './supabaseWineData';

let cachedEntries: WineEntry[] | null = null;
let inFlight: Promise<WineEntry[]> | null = null;

/**
 * Load all wine entries from the generated dataset. Results are cached in-memory
 * for the lifetime of the session to avoid refetching across components.
 */
export async function loadAllEntries(): Promise<WineEntry[]> {
  if (cachedEntries) return cachedEntries;
  if (inFlight) return inFlight;

  inFlight = (async () => {
    if (isSupabaseEnabled()) {
      try {
        const remoteEntries = await loadAllEntriesFromSupabase();
        const mergedById = new Map<string, WineEntry>();

        remoteEntries.forEach((entry) => mergedById.set(entry.id, entry));
        WINE_ENTRIES.forEach((entry) => {
          if (!mergedById.has(entry.id)) {
            mergedById.set(entry.id, entry);
          }
        });

        const mergedEntries = Array.from(mergedById.values());
        cachedEntries = mergedEntries;
        return mergedEntries;
      } catch (error) {
        console.warn('Supabase load failed, falling back to local dataset.', error);
      }
    }

    cachedEntries = WINE_ENTRIES;
    return WINE_ENTRIES;
  })().finally(() => {
    inFlight = null;
  });

  return inFlight;
}
