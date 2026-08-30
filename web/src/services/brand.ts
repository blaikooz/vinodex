/**
 * Facts about the company, readable by both products.
 *
 * ## Why this is not in `supportContact.ts`
 *
 * W26 consolidated two contact addresses onto one constant, and the obvious
 * home looked like `supportContact.ts` — which is where the in-app SUPPORT
 * screen already read one. That would have made the **company site import a
 * dex service**, and the standing rule in this repo is that it may not: the
 * site and `/dex...` are two products sharing one chassis and nothing else.
 * The rule exists so a dex refactor cannot break the company site and site
 * copy cannot leak into a dex screen. It survives v0.3.0's rework unchanged:
 * the site being the landing rather than one fork of a splash changes which
 * one a visitor meets first, not what either may import.
 *
 * The address is genuinely neither product's. It belongs to the studio, and
 * the site's CONTACT US page and the dex's SUPPORT screen are two places
 * the studio's address is printed. That is what this module is: the small set
 * of brand-level facts both sides may read, kept deliberately tiny so it does
 * not become a back door for the coupling the rule forbids.
 *
 * **What may go in here:** a fact about the company that is true regardless
 * of which product is on screen. **What may not:** anything that is about the
 * encyclopedia, about the site's navigation, or about either one's state.
 */

/**
 * Where to write — the portal's CONTACT US page and the dex's SUPPORT screen.
 *
 * Before W26 there were two of these on two different domains:
 * `hello@vinodex.app` on the portal and `hello@vinodex.com` in the support
 * service. Both were rendered as live `mailto:` links, neither domain is
 * registered, and mail to either goes nowhere while telling the sender
 * nothing.
 *
 * The studio now uses its Vinodex Substack reply address. This file guarantees
 * the site and the in-app SUPPORT screen continue to read one shared value.
 */
export const CONTACT_ADDRESS = 'vinodex@substack.com';

/**
 * The Vinodex publication on Substack — where iOS launch news goes, and the
 * bottom of the web funnel while the app is TestFlight-only (v0.6.16).
 *
 * Here rather than in `iosUpdatesPrompt.ts` because the landing links to it
 * too, and the site may not import a dex service. Substack owns the form,
 * the consent, the confirmation and the subscriber data; both products only
 * link out to it.
 */
export const VINODEX_SUBSTACK_URL = 'https://vinodex.substack.com/';
