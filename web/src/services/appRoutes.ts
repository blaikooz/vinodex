/**
 * Which product a URL belongs to, and when the device boots.
 *
 * ## The model (v0.3.0)
 *
 * There is no fork any more. **The company site IS the landing experience, and
 * Vinodex is an app you open from inside it.** `/` is Horizon/Godot; the dex
 * lives at `/dex` and its own routes, and you reach it through OUR WORK →
 * VINODEX. The chassis is shared throughout — on the site it is the studio's
 * device sitting on the desk, and opening Vinodex boots it.
 *
 * That makes "which side of the line is this path on" a real question that
 * five separate behaviours now ask: the BIOS (boots on the app, never on the
 * site), the chassis skin (always CLASSIC on the site, the player's choice in
 * the dex), the screensaver (dex only), the bezel wordmark, and the marquee.
 * Asking it five times in five components is how those five drift apart, so it
 * is asked once, here, by two pure functions a test can enumerate.
 *
 * ## Why the lists are positive rather than "anything that is not the site"
 *
 * The catch-all route sends an unknown URL to `/`. Under a negative rule
 * (`isDex = !isSite`) a typo'd URL is a dex path, so a visitor who mistyped
 * would get a 3.4-second power-on test and then be dropped on the studio home
 * — a boot for a screen they never reached. Both sides are named, `routes.test`
 * holds this file against `App.tsx`'s actual route table, and a path in
 * neither list is simply "unknown", which is the honest answer.
 */

/** Site paths with no children. `/website` and its subtree are the v0.2.x
 *  spellings, kept routable as redirects — nothing shared may break. */
export const SITE_EXACT: readonly string[] = ['/', '/apps', '/who-we-are', '/contact'];

/** Site path *prefixes*: a segment root that owns everything under it. */
export const SITE_PREFIXES: readonly string[] = ['/project', '/website'];

/**
 * Every route the encyclopedia owns, as segment roots.
 *
 * Held against `App.tsx` by `appRoutes.test.ts`, so a new dex screen that
 * forgets to appear here fails a test rather than silently launching without a
 * boot, wearing the site's CLASSIC shell.
 */
export const DEX_PREFIXES: readonly string[] = [
  '/dex',
  '/detail',
  '/list',
  '/lineage',
  '/settings',
  '/saved',
  '/passport',
  '/recommendations',
  '/minigames',
  '/moon-dial',
  '/region-map',
  '/retro-globe',
  '/chip-filter',
  '/quiz',
  '/daily-challenge',
  '/walkthrough',
  '/scanner',
  '/support',
  '/cheats',
  '/firmware',
  '/prof-vino',
];

/**
 * The app's share surface.
 *
 * `scripts/prerender-og.ts` writes 440 static `dist/detail/<id>/index.html`
 * pages, each with its own `<title>`, canonical link and unfurl card, for
 * exactly these URLs. They exist so a stranger who taps a shared link lands on
 * the entry — which is why a cold arrival here is a page view rather than an
 * app launch. See `bootDecision`.
 */
export const SHARE_PREFIX = '/detail';

/** `prefix`, or anything under it — never a mere string prefix, so `/dexter`
 *  is not `/dex` and `/settings-old` is not `/settings`. */
const owns = (prefix: string, path: string): boolean =>
  path === prefix || path.startsWith(`${prefix}/`);

/** The company site: `/`, its pages, and the legacy `/website` spellings. */
export const isSitePath = (path: string): boolean =>
  SITE_EXACT.includes(path) || SITE_PREFIXES.some(p => owns(p, path));

/** The encyclopedia app. */
export const isDexPath = (path: string): boolean => DEX_PREFIXES.some(p => owns(p, path));

/** A shared entry page. */
export const isSharePath = (path: string): boolean => owns(SHARE_PREFIX, path);

/**
 * Does arriving at `to` from `from` boot the device?
 *
 * **The ruling: the BIOS plays every time you enter the dex, and never on the
 * website.** Boot is no longer a once-per-session event that happens on
 * arrival — it is what happens when you *open the app*, so the question is not
 * "have you booted before" but "did you just cross into the app".
 *
 * @param from the previous path, or `null` for a cold load (nothing before it)
 * @param to   the path being arrived at
 *
 * Three cases:
 *
 * 1. **`to` is not a dex path** — the site, or an unknown URL on its way to the
 *    catch-all. Never boots.
 * 2. **Cold load onto a dex path** — a launch: a typed URL, a bookmark, the
 *    installed PWA's `start_url`. Boots. *Except* `/detail/:id`, below.
 * 3. **Warm navigation** — boots only when `from` was outside the app, which
 *    is to say on the site. Moving around inside the dex never re-boots.
 *
 * ### The deep-link exception, and why it is only this one route
 *
 * A cold arrival at `/detail/:id` does **not** boot. That visitor followed a
 * link to a *page* — one of the 440 prerendered share cards — and did not open
 * anything; putting a power-on test in front of the thing they clicked is an
 * interstitial, and it is the one route in the app where an arrival is
 * reliably from outside. Every other dex URL is either typed, bookmarked, or
 * the PWA's own launch target, and all three of those are somebody opening
 * Vinodex.
 *
 * Once they are there they are *in* the device, so nothing power-cycles under
 * them mid-browse — a related grape, a filter chip, Home to the menu are all
 * in-app navigation. If they back out past the menu to the site and come in
 * again, that is a genuine open and it boots.
 *
 * The considered alternative was to treat a share page as *not yet* inside the
 * app, so that the visitor's first step into the menu booted. It was rejected:
 * it makes the device power-cycle in the middle of a browse (the filter chips
 * on `EntryDetail` navigate to `/list/*`), which is the surprising behaviour,
 * and it needs a third state to express. The cost of the rule as written is
 * that a deep-link visitor may not see the BIOS at all in that session —
 * accepted, because the BIOS is a launch ceremony and they did not launch.
 */
export const bootDecision = (from: string | null, to: string): boolean => {
  if (!isDexPath(to)) return false;
  if (from === null) return !isSharePath(to);
  return !isDexPath(from);
};

/**
 * What the marquee panel reads on the site.
 *
 * The dex's script — WELCOME! once per launch, MENU at rest, the nine-toast
 * rotation after 60 s — is a *dex* behaviour, driven by `marqueeScript.ts` and
 * armed only on the main menu. The site does not run it and does not want a
 * second clock: the panel simply says WELCOME.
 *
 * Exported rather than inlined so `marqueeTitles.test.ts` can hold it to the
 * same rule as every other title the app puts on that panel.
 */
export const SITE_MARQUEE_TITLE = 'WELCOME';
