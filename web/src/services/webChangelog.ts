/**
 * The web app's own release history — an authored changelog the version is
 * tied to.
 *
 * ## Why this exists
 *
 * `APP_VERSION` was `0.1.0`, tagged 2026-07-29, and by the time anyone
 * checked, the tree was **102 commits past it**. Nothing was internally
 * inconsistent — `appVersion.test.ts` already holds the three spellings
 * (`APP_VERSION`, `package.json`, the display form) equal, and it did its job
 * perfectly. The gap was that nothing tied the number to *reality*: a version
 * can only go stale silently if bumping it costs nothing and not bumping it
 * costs nothing either.
 *
 * So the web borrows the discipline iOS already has. `shared/data/firmware.ts`
 * is where iOS's version lives, because a release there is an authored entry
 * somebody had to write; `AppVersion.swift` reads it rather than restating it.
 * `webChangelog.test.ts` enforces the same contract here: **the current
 * `APP_VERSION` must have an entry in this file.** The version cannot move
 * without someone saying what changed.
 *
 * ## This is NOT the device firmware, and must not become it
 *
 * `shared/data/firmware.ts` is the **device's** firmware line. It is shared
 * with iOS, it is what the BIOS POST and the FIRMWARE HISTORY panel print,
 * and its numbers are the phone's. This file is the **web shell's** own
 * release line. The two are deliberately separate and on different clocks — a
 * Vercel push is live in a minute, an App Store build waits on review — which
 * is the whole reason the web stopped mirroring iOS's version at the repo
 * split.
 *
 * `FirmwareHistoryScreen` draws the device line and says so. Nothing in this
 * file may be drawn there, and nothing there may be read from here.
 *
 * ## Shape
 *
 * `CURRENT` plus `PREVIOUS`, newest first, ALL-CAPS headline, terse notes —
 * iOS's shape, so the two repos' release discipline reads the same to anyone
 * moving between them. Web's own three-part semver, because `package.json`,
 * the `v<version>` git tag and the nameplate have to be one spelling.
 *
 * ## Bumping
 *
 * One edit to `APP_VERSION`, one new entry here, one `v<version>` git tag.
 * The tag is the real record, exactly as it is on the iOS side.
 */

export interface WebRelease {
  /** Three dot-separated integers, matching `APP_VERSION`'s scheme. */
  version: string;
  /** ISO `YYYY-MM-DD`. */
  date: string;
  /** ASCII, uppercase, <= 24 characters. */
  headline: string;
  /** One line each, in reading order. ASCII, sentence case. */
  notes: string[];
}

/**
 * The release this source tree produces.
 *
 * Named rather than indexed out of the array below, for the reason
 * `shared/data/firmware.ts` gives: this repo compiles under
 * `noUncheckedIndexedAccess`, where `RELEASES[0]` is possibly-undefined and
 * the whole one-source-of-truth arrangement would hang off a non-null
 * assertion. It also gives the thing you edit a name.
 */
const CURRENT: WebRelease = {
  version: '0.2.0',
  date: '2026-08-18',
  headline: 'THE PARITY PUSH',
  notes: [
    'WINE EXAM on the shared question bank, with tiers, a pass streak and a paper that survives a trip Back.',
    'FIRMWARE HISTORY, TOOLS, YOU MIGHT LIKE, SUPPORT and the cheat console are all real screens now.',
    'BLIND TASTING and MASTER SEARCH: the scanner walks a deduction, the orb opens a twelve-facet filter.',
    'GRAPE LINEAGE: walk a grape back through its parents, and open any of them.',
    'PASSPORT ranks and stamps, announced once each, at the moment you earn them.',
    'Professor Vino arrives -- six expressions, a bank of first-time lines, and a guided walkthrough.',
    'SAVE and RESTORE everything: shelves, ratings, streaks and settings, as one file you keep.',
    'Five profile slots, a demo attract loop, a screensaver, and an INSIGHT panel on the entry readout.',
    'A BIOS power-on test, a share funnel with real link previews, and an install banner.',
    'The device is drawn now: 22 chassis shells, marquee panels, passport stamps and skin stickers.',
    'The four footer buttons are drawn art, re-inked per shell -- so every skin has its own moulded caps.',
    'The chassis gains its keyed corner, seated lamps, a stadium orb, and NOCTURNE glows in the dark.',
    'Reduced motion is honoured everywhere, and the whole app is linted and render-tested on every change.',
    'CLEAR ALL SAVED DATA now clears the profile slots too.',
    'The SHOP stays out of scope, LABEL SCAN stays COMING SOON, and there are still no notifications.',
  ],
};

/** Newest first. A new release is prepended by promoting `CURRENT`. */
const PREVIOUS: WebRelease[] = [
  {
    version: '0.1.0',
    date: '2026-07-29',
    headline: 'FIRST WEB RELEASE',
    notes: [
      'The web app counts on its own line: three-part semver, its own tag, no longer mirroring the phone.',
      'The encyclopedia, the scanner, the daily challenge and the saved shelves, in the retro chassis.',
      'The company portal shares the chassis and hides the in-app controls.',
    ],
  },
];

export const WEB_RELEASES: WebRelease[] = [CURRENT, ...PREVIOUS];

/**
 * The authored version, read off `CURRENT` rather than declared again.
 *
 * `appVersion.ts` stays the constant the app imports — it is what every UI
 * surface already reads and moving that would be churn for its own sake — and
 * `webChangelog.test.ts` holds the two equal. Two spellings with a test
 * between them, rather than one spelling and a circular import.
 */
export const CHANGELOG_VERSION = CURRENT.version;

/** The entry for a version, or undefined. */
export const releaseFor = (version: string): WebRelease | undefined =>
  WEB_RELEASES.find(r => r.version === version);
