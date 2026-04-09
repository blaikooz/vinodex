import { WineEntry } from '../../types';

const SUPABASE_TABLE = 'wine_entries';
const PAGE_SIZE = 1000;

const requiredStringFields: Array<keyof Pick<WineEntry, 'id' | 'name' | 'description' | 'category' | 'color'>> = [
  'id',
  'name',
  'description',
  'category',
  'color',
];

function isWineEntry(value: unknown): value is WineEntry {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<WineEntry>;

  if (!requiredStringFields.every((field) => typeof candidate[field] === 'string')) {
    return false;
  }

  if (!Array.isArray(candidate.tags) || !candidate.tags.every((tag) => typeof tag === 'string')) {
    return false;
  }

  return !!candidate.details && typeof candidate.details === 'object';
}

function getSupabaseConfig() {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim();
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
  const dataSource = import.meta.env.VITE_DATA_SOURCE?.trim().toLowerCase();
  const forceLocalData = import.meta.env.VITE_FORCE_LOCAL_DATA?.trim().toLowerCase();
  const clientKey = publishableKey || anonKey;
  const localModeForced = forceLocalData !== 'false';
  const useSupabase = !localModeForced && dataSource === 'supabase' && !!url && !!clientKey;

  return { url, clientKey, anonKey, publishableKey, dataSource, useSupabase, localModeForced };
}

async function fetchSupabasePage(
  url: string,
  clientKey: string,
  page: number,
): Promise<WineEntry[]> {
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const endpoint = new URL(`${url}/rest/v1/${SUPABASE_TABLE}`);

  endpoint.searchParams.set('select', 'id,name,description,category,tags,color,icon,tileCallback,iconCallback,wineType,tastingProfile,climate,climateDescription,details,rarity,grapeCard');
  endpoint.searchParams.set('order', 'name.asc');

  const response = await fetch(endpoint.toString(), {
    headers: {
      apikey: clientKey,
      Authorization: `Bearer ${clientKey}`,
      Range: `${from}-${to}`,
      Prefer: 'count=exact',
    },
  });

  if (!response.ok) {
    throw new Error(`Supabase request failed (${response.status})`);
  }

  const payload = (await response.json()) as unknown;
  if (!Array.isArray(payload)) {
    throw new Error('Supabase returned an unexpected payload.');
  }

  const invalidRow = payload.find((entry) => !isWineEntry(entry));
  if (invalidRow) {
    throw new Error('Supabase returned a row that does not match the WineEntry shape.');
  }

  return payload;
}

export function isSupabaseEnabled() {
  return getSupabaseConfig().useSupabase;
}

export async function loadAllEntriesFromSupabase(): Promise<WineEntry[]> {
  const { url, clientKey, useSupabase } = getSupabaseConfig();

  if (!useSupabase || !url || !clientKey) {
    throw new Error('Supabase is not configured.');
  }

  const entries: WineEntry[] = [];

  for (let page = 0; ; page += 1) {
    const pageEntries = await fetchSupabasePage(url, clientKey, page);
    entries.push(...pageEntries);

    if (pageEntries.length < PAGE_SIZE) {
      break;
    }
  }

  return entries;
}
