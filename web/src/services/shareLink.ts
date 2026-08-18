/**
 * The acquisition funnel's plumbing: the web app is the top of the funnel — the
 * link you send someone so they can play instantly in a browser — and every
 * shareable surface points at a canonical entry URL here.
 *
 * iOS and web share the same entry ids (G001 / R001 / S001 / FLAVOR-* / CONT_*),
 * and the web serves them at `/detail/:id`, so a card shared from the iOS app
 * that targets `${SHARE_BASE}/detail/<id>` lands on the matching web entry with
 * no mapping table. Keep `SHARE_BASE` in step with the production domain.
 */

/** Canonical production origin for shared links (no trailing slash). */
export const SHARE_BASE = 'https://vinodex.vercel.app';

/**
 * App Store listing the install nudge points at. Placeholder until the listing
 * is live — swap the id (and set `SMART_APP_BANNER_ID` in index.html) when it is.
 * TODO(Harrison): real App Store URL / id.
 */
export const APP_STORE_URL = 'https://apps.apple.com/app/vinodex/id0000000000';

/** The path for an entry — the same route the web router already handles. */
export function entryPath(id: string): string {
  return `/detail/${id}`;
}

/** The full canonical share URL for an entry. */
export function entryShareUrl(id: string): string {
  return `${SHARE_BASE}${entryPath(id)}`;
}

/**
 * Share an entry from the web: the native share sheet where available (mobile),
 * a clipboard copy otherwise. Returns how it resolved so the caller can show a
 * "link copied" confirmation.
 */
export async function shareEntry(id: string, name: string): Promise<'shared' | 'copied' | 'failed'> {
  const url = entryShareUrl(id);
  const title = `${name} — Vinodex`;
  try {
    const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
    if (typeof nav.share === 'function') {
      await nav.share({ title, text: `${name} on Vinodex`, url });
      return 'shared';
    }
  } catch {
    // A user cancelling the share sheet throws — fall through to clipboard so a
    // deliberate cancel does not read as a failure the caller must surface.
    return 'failed';
  }
  try {
    await navigator.clipboard.writeText(url);
    return 'copied';
  } catch {
    return 'failed';
  }
}

/**
 * True when the app is running as an installed PWA / standalone rather than in a
 * browser tab — used to hide the "get the app" nudge for people who are already
 * running it standalone.
 */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const mm = window.matchMedia?.('(display-mode: standalone)').matches;
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  return Boolean(mm || iosStandalone);
}
