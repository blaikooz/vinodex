import { useEffect, useState } from 'react';
import type { WineEntry } from '@/shared/types';
import { loadAllEntries, peekEntries } from './wineData';

/** Idle prefetch delay on the site, so opening Vinodex from it is instant. */
const SITE_PREFETCH_MS = 2500;

/**
 * The catalogue as React state: `null` until its chunk has arrived, then the
 * canonicalized entries for good (v0.6.31, Phase 6 LCP).
 *
 * `wanted` is "a dex route is showing": the load starts at once. On the
 * studio site nothing needs an entry, so the site's first paint never waits
 * for the tables -- they prefetch a couple of seconds later, in the idle time
 * a visitor spends reading, so the BIOS boot into Vinodex finds them ready.
 */
export function useCatalogue(wanted: boolean): WineEntry[] | null {
  const [entries, setEntries] = useState<WineEntry[] | null>(() => peekEntries());
  useEffect(() => {
    if (entries) return;
    let alive = true;
    const load = () => {
      void loadAllEntries().then(list => {
        if (alive) setEntries(list);
      });
    };
    if (wanted) {
      load();
      return () => {
        alive = false;
      };
    }
    const timer = window.setTimeout(load, SITE_PREFETCH_MS);
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [entries, wanted]);
  return entries;
}
