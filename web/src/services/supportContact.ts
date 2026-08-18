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
 * as many words). It is a `const` here and nowhere else, so replacing it is
 * one edit rather than a grep.
 */

/** The recipient. Temporary — see the module note. */
export const SUPPORT_ADDRESS = 'hello@vinodex.com';

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
