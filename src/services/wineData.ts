import { WineEntry } from '../../types';

let cachedEntries: WineEntry[] | null = null;
let inFlight: Promise<WineEntry[]> | null = null;

/**
 * Load all wine entries from the generated JSON file. Results are cached in-memory
 * for the lifetime of the session to avoid refetching across components.
 */
export async function loadAllEntries(): Promise<WineEntry[]> {
  if (cachedEntries) return cachedEntries;
  if (inFlight) return inFlight;

  inFlight = (async () => {
    const res = await fetch('/wine-entries.json');
    if (!res.ok) {
      throw new Error(`Failed to load wine entries (${res.status})`);
    }
    const data = (await res.json()) as WineEntry[];
    cachedEntries = data;
    return data;
  })().finally(() => {
    inFlight = null;
  });

  return inFlight;
}
