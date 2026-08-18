/**
 * Where to write, and what the message arrives titled — ported from
 * `vinodex-ios/Sources/VinodexCore/SupportContact.swift` (0.8.91, F1), v6#25.
 *
 * In a service rather than the screen so the address is testable: one that is
 * subtly wrong — a typo, a stray space, a percent-encoding that turns the
 * subject into part of the recipient — fails silently into somebody else's
 * inbox.
 *
 * **The address is a placeholder and is marked as one** (iOS §F1 says so in
 * as many words), and since W26 it is a placeholder in exactly one place —
 * `brand.ts`.
 *
 * It was in two, with two different domains: this module said
 * `hello@vinodex.com` and `WebsitePortal.tsx`'s CONTACT US page said
 * `hello@vinodex.app`. Both were rendered to real users as live `mailto:`
 * links, neither domain is registered, and mail to either goes nowhere while
 * telling the sender nothing.
 *
 * **Which domain is not decided there either.** That is a business decision.
 * It is registered in `releaseBlockers.ts` so it cannot ship unnoticed.
 */
import { CONTACT_ADDRESS } from './brand';

/**
 * The recipient.
 *
 * Re-exported from `brand.ts` rather than declared here (W26). The address is
 * the studio's, not the dex's, and the portal's CONTACT US page prints it
 * too — so it lives where both products may read it without the portal
 * importing a dex service, which the separation rule forbids.
 *
 * The name stays `SUPPORT_ADDRESS` at this module's call sites because that
 * is what it means here; there is still exactly one string.
 */
export const SUPPORT_ADDRESS = CONTACT_ADDRESS;

/**
 * The one paragraph the screen shows. Says what will and will not help,
 * because a support page that only says "get in touch" collects messages
 * nobody can act on. It does not promise a response time, which is the other
 * thing these pages do and cannot keep.
 */
export const SUPPORT_BLURB =
  'Found something broken, or thought of something the device should do? ' +
  'Write in. Say which screen you were on and what you expected — that is ' +
  'usually the whole bug report. The app version travels with the message.';

/**
 * The subject line, carrying the version. The first question anyone answering
 * this mail asks is which build it came from; a version the user has to be
 * asked for is a version half of them get wrong.
 */
export const supportSubject = (version: string): string => `Vinodex ${version}`;

/** The `mailto:` URL, percent-encoded — a subject with a space is the common case. */
export const supportMailtoURL = (version: string): string =>
  `mailto:${SUPPORT_ADDRESS}?subject=${encodeURIComponent(supportSubject(version))}`;
