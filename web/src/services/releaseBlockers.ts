/**
 * Placeholders that must not ship, in one place, with a test that counts them
 * (W26).
 *
 * ## The failure this prevents
 *
 * A placeholder is only safe while somebody remembers it is a placeholder.
 * This repo had two live examples pulling in opposite directions:
 *
 * - **The App Store id** was handled well. `shareLink.ts` carries
 *   `APP_STORE_LISTING_IS_LIVE`, the install banner gates on it, and a
 *   prominent GET APP button pointing at a dead listing therefore cannot
 *   appear. The placeholder is *load-bearing* — the code reads it and
 *   behaves.
 * - **The contact address** was handled badly, and twice. `WebsitePortal.tsx`
 *   invited people to write to `hello@vinodex.app`; `supportContact.ts`
 *   invited them to write to `hello@vinodex.com`. Two addresses, two domains,
 *   neither registered, both rendered to real users as a live `mailto:`. Mail
 *   sent to either goes nowhere and the sender is told nothing.
 *
 * The difference is not care, it is *mechanism*: one placeholder was
 * observable in code and the other was a string in a template.
 *
 * ## What this module is
 *
 * The registry that makes every placeholder observable. `releaseBlockers.test.ts`
 * asserts the list matches what is actually still unresolved, so:
 *
 *   - resolving one and forgetting to delete its entry fails the gate, and
 *   - shipping while one is outstanding is at least a thing somebody has to
 *     look at, rather than a thing nobody knows.
 *
 * It deliberately does **not** fail the build outright. A blocker that breaks
 * `npm test` on every developer machine for weeks gets silenced, and a
 * silenced check is worse than none. It fails only if the list and reality
 * disagree.
 *
 * ## The contact domain is NOT decided here
 *
 * One constant, one address, so replacing it is one edit. Which domain the
 * product actually uses is a business decision and is not made in this file;
 * `CONTACT_ADDRESS` carries whichever placeholder is current and this entry
 * says out loud that it is unresolved.
 */

export interface ReleaseBlocker {
  id: string;
  /** What is still a placeholder. */
  what: string;
  /** Where the single constant lives. */
  where: string;
  /** What has to happen, in one line. */
  resolution: string;
}

export const RELEASE_BLOCKERS: readonly ReleaseBlocker[] = [
  {
    id: 'contact-address',
    what: 'The contact/support email address is a placeholder on an unregistered domain.',
    where: 'web/src/services/supportContact.ts — CONTACT_ADDRESS',
    resolution:
      'Decide the domain (vinodex.app and vinodex.com were both in the tree, neither owned), '
      + 'register it, point MX at a real inbox, and replace the one constant.',
  },
  {
    id: 'app-store-id',
    what: 'The App Store listing id is a placeholder.',
    where: 'web/src/services/shareLink.ts — APP_STORE_URL',
    resolution:
      'Paste the real id, and set SMART_APP_BANNER_ID in index.html. '
      + 'APP_STORE_LISTING_IS_LIVE flips on its own and the install banner returns.',
  },
] as const;

/** Whether anything is still outstanding. */
export const hasOpenReleaseBlockers = (): boolean => RELEASE_BLOCKERS.length > 0;
