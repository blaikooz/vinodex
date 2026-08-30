/**
 * Privacy-friendly analytics — Vercel Web Analytics, behind one gate (v0.6.1).
 *
 * ## What this is, and what it is not
 *
 * The app deploys on Vercel, and Vercel's analytics are the cookieless,
 * aggregate kind: no cookies, no cross-site identifiers, no PII, nothing
 * stored on the visitor's device. That is the only kind this app can carry —
 * the PRIVACY + TERMS page promises "no accounts, no cookies", and this
 * module is written so that page stays true. **Nothing user-authored is ever
 * sent**: event names are constants below, and the only property is a
 * `source` drawn from a closed set.
 *
 * ## The funnel
 *
 * Four live stages, matching the product's acquisition shape (see
 * `shareLink.ts`: the web is the top of the funnel). The bottom of the funnel
 * is **Substack** for now (v0.6.16): the iOS app is TestFlight-only, so the
 * conversion is a subscriber who will get the invite, not an App Store tap.
 *
 *   `landing-view`           — the site's front page is seen
 *   `open-app`               — the device boots: someone opened Vinodex
 *   `subscribe-nudge-click`  — the iOS-updates card's SHOW SIGN-UP FORM is
 *                              pressed: the visitor asked for the form
 *   `substack-tap`           — a link to the publication is followed
 *                              (`source` says which surface)
 *
 * One dormant stage, kept for the day the listing is live:
 *
 *   `store-tap`              — an App Store link is followed. Fires from the
 *                              install banner, which renders for nobody while
 *                              `APP_STORE_LISTING_IS_LIVE` is false.
 *
 * ## Why the gate is the host, not just the build mode
 *
 * `import.meta.env.PROD` is not enough: the Playwright suite runs against a
 * production build served by `vite preview` on 127.0.0.1, where the injected
 * script would 404 (`/_vercel/insights/` exists only on Vercel) and the
 * console-error fixture rightly fails the render gate on any 404. So the
 * gate is threefold — a production build, a non-local host, and not a
 * webdriver — and every entry point returns quietly when it is closed.
 * Dev, vitest (jsdom), preview and e2e are all no-ops by construction.
 */

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '[::1]']);

/** The closed set of event names — the funnel, and only the funnel. */
export type FunnelEvent = 'landing-view' | 'open-app' | 'subscribe-nudge-click' | 'substack-tap' | 'store-tap';

/** Where a Substack tap came from: the in-dex card, or the landing's link. */
export type SubstackTapSource = 'updates-card' | 'landing';

/** Where a store tap came from, for when there is more than one surface. */
export type StoreTapSource = 'install-banner';

/** The closed set of `source` values — nothing user-authored, ever. */
export type EventSource = SubstackTapSource | StoreTapSource;

/** True only where sending a beacon is both possible and wanted. */
export const analyticsEnabled = (): boolean => {
  if (typeof window === 'undefined') return false;
  if (!import.meta.env.PROD) return false;
  if (window.navigator.webdriver) return false;
  if (LOCAL_HOSTS.has(window.location.hostname)) return false;
  return true;
};

let injected = false;

/**
 * Mount the collector once, on real deployments only. Imported dynamically so
 * the disabled paths (dev, test, preview) never even load the module.
 */
export const initAnalytics = (): void => {
  if (!analyticsEnabled() || injected) return;
  injected = true;
  void import('@vercel/analytics')
    .then(({ inject }) => inject({ mode: 'production' }))
    .catch(() => {
      /* An ad blocker eating the script is the visitor's choice, not an error. */
    });
};

/** Record one funnel stage. A no-op everywhere `analyticsEnabled` says so. */
export const trackEvent = (name: FunnelEvent, props?: { source: EventSource }): void => {
  if (!analyticsEnabled()) return;
  void import('@vercel/analytics')
    .then(({ track }) => track(name, props))
    .catch(() => {
      /* Same: a blocked beacon must never surface as an app error. */
    });
};
