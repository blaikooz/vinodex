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
// 0.6.1x, not 0.6.2: the firmware line owns 0.6.2 through 0.9.2, and the
// two-clocks test refuses any version the device already wore.
const CURRENT: WebRelease = {
  version: '0.6.15',
  date: '2026-08-28',
  headline: 'A CARD FOR EVERY PAGE',
  notes: [
    'Sharing a site page -- the studio, OUR WORK, WHO WE ARE, CONTACT US, PRIVACY + TERMS -- unfurls with that page\'s own title and description, the way an entry link already did.',
    'A sitemap lists every site page and every shareable entry; robots.txt points at it and keeps crawlers out of the app\'s own screens.',
    'Every prerendered page carries a canonical link and a large-image card.',
    'What the crawler is told is pinned to the route table: a site page that appears in one and not the other fails a test.',
  ],
};

/** The release before this one, promoted when 0.6.15 landed. */
const PREVIOUS_0_6_14: WebRelease = {
  version: '0.6.14',
  date: '2026-08-28',
  headline: 'A NEW HUE EVERY WALL',
  notes: [
    'The screensaver mark takes a new colour from the palette on every wall it hits, the way the phone does -- the LCD accent first, then red, amber, green, blue, cyan.',
    'The colour is read off the same clock as the position, so a bounce and its hue can never disagree.',
    'The mark is the wordmark itself, drawn as two hard-edged layers and tinted -- no more fixed red tile -- and it is sized from the LCD, so it fits the site chassis too.',
    'Under reduced motion it sits still in the accent, as before.',
  ],
};

/** The release before this one, promoted when 0.6.14 landed. */
const PREVIOUS_0_6_13: WebRelease = {
  version: '0.6.13',
  date: '2026-08-28',
  headline: 'THE SHELVES IN A ROW',
  notes: [
    'On a phone, SAVE, WANT and TRIED share one row under an entry name again; the hero was three rows of buttons.',
    'The passport gauges are square segment bars with a pixel edge, like the readout characteristics, not rounded pills.',
  ],
};

/** The release before this one, promoted when 0.6.13 landed. */
const PREVIOUS_0_6_12: WebRelease = {
  version: '0.6.12',
  date: '2026-08-28',
  headline: 'CHUNKY CORNERS',
  notes: [
    'The material inside the LCD is retro again: 8px corners instead of 16, a 2px pixel edge on every card and control, and a hard 2px offset under the soft shadow.',
    'Presses and screen changes are snappier -- the same spring, half the time.',
    'The scrollbars follow the screen mode; they were a fixed dark bar down a paper-white page.',
    'MASTER SEARCH gets the same terminal search well every other search has, with a clear button.',
    'The collection: press feedback on every control, and the remove button sits inside its card.',
    'The site tiles keep their labels on one line on a phone.',
  ],
};

/** The release before this one, promoted when 0.6.12 landed. */
const PREVIOUS_0_6_11: WebRelease = {
  version: '0.6.11',
  date: '2026-08-28',
  headline: 'ALL RETRO, ALWAYS',
  notes: [
    'The sans is gone. Every heading, label and control is Press Start 2P again, and every paragraph is VT323 -- the terminal face, a size up so it reads.',
    'Inter and its two font files leave the bundle; the type scale keeps its seven roles, and each role now carries its own face.',
    'A test pins it: a sans face, a preload, or a sans class anywhere in the app is a red test, not a taste call.',
    'The site reads the same way -- pixel headings, terminal prose -- including PRIVACY + TERMS, which was a legal page set entirely in 8-bit caps.',
  ],
};

/** The release before this one, promoted when 0.6.11 landed. */
const PREVIOUS_0_6_10: WebRelease = {
  version: '0.6.10',
  date: '2026-08-27',
  headline: 'THE SMALL PRINT, KEPT',
  notes: [
    'The Substack sign-up form now loads only when you tap for it: the updates card used to load the embed unbidden, cookies and all.',
    'PRIVACY + TERMS names that one opt-in exception in its own words, so every claim on the page is a fact of the code again.',
    'The TOOLS system tile wears the amber iOS retired its dark-ink look for in 0.6.4 -- the table cited a symbol iOS no longer has.',
  ],
};

/** The release before this one, promoted when 0.6.10 landed. */
const PREVIOUS_0_6_1: WebRelease = {
  version: '0.6.1',
  date: '2026-08-26',
  headline: 'COUNTING WITHOUT COOKIES',
  notes: [
    'The site counts its visitors now, the only way this app would: aggregate and cookieless, via the host.',
    'Four numbers and no more: saw the site, opened the app, pressed the nudge, tapped through to the store.',
    'No cookies, no identifiers, nothing stored on your device, nothing user-typed ever sent.',
    'PRIVACY + TERMS says all of this in its own words, updated in the same breath as the code.',
    'In development, tests and previews the whole thing is a no-op by construction.',
  ],
};

/** The release before this one, promoted when 0.6.1 landed. */
const PREVIOUS_0_6_0: WebRelease = {
  version: '0.6.0',
  date: '2026-08-26',
  headline: 'THE SMALL PRINT',
  notes: [
    'PRIVACY + TERMS is a real page now, linked from CONTACT US and living at /privacy.',
    'It says in plain language what the code does: everything you save lives in your browser, on your device.',
    'No accounts, no cookies, no third-party requests - the app ships its own data, art and fonts, which is why it works offline.',
    'The terms are as short as honesty allows: free, as-is, a field guide rather than advice, drink responsibly.',
    '/terms resolves to the same page, because store forms and people both guess that spelling.',
  ],
};

/** The release before this one, promoted when 0.6.0 landed. */
const PREVIOUS_0_5_0: WebRelease = {
  version: '0.5.0',
  date: '2026-08-26',
  headline: 'THE DEVICE WORKSHOP',
  notes: [
    'THE DEVICE WORKSHOP opens, behind SETTINGS: ten parts - shell, caps, orb, lamps, marquee, grille, screen, font - each yours to fit.',
    'The preview is the device you are holding: fit a violet orb and the real orb turns violet under your finger.',
    'Name a build and keep it - twelve garage slots, refit any with a tap - and REVERT restores the build you walked in with.',
    'The footer caps re-ink themselves to whatever colour you fit, the way every skin already moulded its own.',
    'The speaker grille is real hardware now, with its own colour and its own weave.',
    'The chassis sits closer to the phone: iOS button and icon art, drawn pixel glyphs on the menus, and the dial geometry trued up.',
    'The walkthrough reads as one guided run now, and can hand you to the live tour that points at the real buttons.',
    'On the site, the studio viewport reshapes around a wider device and the founders get real bios.',
    'Desktop scrolling inside the LCD is restored, and the menu and footer fill their band edge to edge.',
  ],
};

/** The release before this one, promoted when 0.5.0 landed. */
const PREVIOUS_0_4_4: WebRelease = {
  version: '0.4.4',
  date: '2026-08-22',
  headline: 'THE DEVICE MOVES',
  notes: [
    'Screens fade up on the LCD when you navigate, the way the phone crossfades. The chassis never moves.',
    'List rows arrive with a short stagger - ten rows, forty milliseconds apart, and no more than that.',
    'Every button presses with the same small spring, including the world map hotspots.',
    'Reduced motion parks all of it: screens and rows simply appear, opaque and in place.',
  ],
};

/** The release before this one, promoted when 0.4.4 landed. */
const PREVIOUS_0_4_3: WebRelease = {
  version: '0.4.3',
  date: '2026-08-22',
  headline: 'EVERY SCREEN, ONE VOICE',
  notes: [
    'The whole app reads in the clean sans now. The pixel face keeps the marquee, the boot and the wordmark.',
    'Every list row, tile and panel is a card: tinted surface, soft shadow, colour as the accent.',
    'The entry readout is rebuilt on the new language, and its hero title stops shouting.',
    'The settings tiles and the TOOLS shelf join the category colour table, readable in every screen mode.',
    'Exam and daily answers mark themselves in green and red washes that survive the pale screens.',
    'Search fields and the cheat console keep their terminal type on purpose. The radar and the globe stay instruments.',
    'Confirm dialogs share one card now, close on Escape, and land focus on the safe button.',
    'Dozens of colours that ignored your screen mode follow it. The category tags keep their own colours by design.',
  ],
};

/** The release before this one, promoted when 0.4.3 landed. */
const PREVIOUS_0_4_2: WebRelease = {
  version: '0.4.2',
  date: '2026-08-21',
  headline: 'THE PRODUCT SHOT',
  notes: [
    'On a desktop the device stands on a lit stage now: a soft glow behind it, a vignette, a floor.',
    'The light is the shell\'s own colour - CLASSIC warms the room red, NOCTURNE glows its pale green.',
    'The boot and the screensaver stand on the same stage, so the lights never jump on the way in or out.',
    'The shell goes matte: the wet corner sheen is gone, and the device casts a real grounded shadow.',
    'The buttons and the marquee bezel sit in the band instead of hovering over it on hard black drops.',
    'The breathing lamps calm down - lit, not alarmed - and reduced motion holds the same calm state.',
    'Every pale screen mode softens the background grid now, where before only LIGHT itself did.',
    'On a phone nothing moves: the stage is a desktop treatment, and the chassis geometry is untouched.',
  ],
};

/** Newest first. A new release is prepended by promoting `CURRENT`. */
const PREVIOUS: WebRelease[] = [
  PREVIOUS_0_6_14,
  PREVIOUS_0_6_13,
  PREVIOUS_0_6_12,
  PREVIOUS_0_6_11,
  PREVIOUS_0_6_10,
  PREVIOUS_0_6_1,
  PREVIOUS_0_6_0,
  PREVIOUS_0_5_0,
  PREVIOUS_0_4_4,
  PREVIOUS_0_4_3,
  PREVIOUS_0_4_2,
  {
    version: '0.4.1',
    date: '2026-08-21',
    headline: 'THE CELLAR AUDITED',
    notes: [
      'Cabernet Pfeffer stops being a mystery: the tag now says what the entry says - misnamed, and solved.',
      'Melon de Bourgogne and Picardan are scored as the neutral varieties the books describe.',
    ],
  },
  {
    version: '0.4.0',
    date: '2026-08-21',
    headline: 'A LANGUAGE OF ITS OWN',
    notes: [
      'The web and the phone now share their data and their ideas, and stop sharing a look.',
      'A real type scale, in a clean sans, for everything you read. The pixel face keeps the wordmark.',
      'The three typefaces ship with the app instead of being fetched from Google, so they work offline.',
      'Category colours are calmer, and each one now has a light-screen value as well as a dark one.',
      'Tiles are cards: a tinted surface, a soft shadow, and the colour as an accent rather than the fill.',
      'Every tile label reads in one line. WHO WE ARE and CONTACT US no longer break in half.',
      'Labels on the coloured tiles were below the readable contrast floor in every screen mode. Fixed.',
      'The company site follows your screen mode. On the pale modes its wordmark used to be invisible.',
      'Buttons answer a keyboard: a visible focus ring on every card, and a spring on every press.',
      'The SMALL and LARGE text setting reaches the new type, which the old sizes ignored.',
      'The menu dial and the front page are the first two screens on the new language. The rest follow.',
    ],
  },
  {
    version: '0.3.0',
    date: '2026-08-20',
    headline: 'THE SITE IS THE DOOR',
    notes: [
      'Horizon/Godot is the front door now. The DEX / WEBSITE fork is gone, and the site is what you land on.',
      'Vinodex is an app you open from inside it: OUR WORK, then VINODEX, then OPEN VINODEX.',
      'The power-on test runs every time you open the app, and never on the site.',
      'A shared entry link still opens straight onto the entry -- a link to a page is not an app launch.',
      'No access code. The keypad withheld nothing, and the tile opens the app on a press.',
      'On the site the device is always the red Vinodex CLASSIC shell, whatever skin you picked for the app.',
      'Your chosen skin is untouched by that, and is back on the device the moment you are in the dex.',
      'The wordmark under the screen reads HORIZON/GODOT on the site and VINODEX in the app.',
      'The site\'s marquee greets you with WELCOME on the front page and names the page everywhere else.',
      'The site has its own mark on the marquee now -- a sun on a horizon, instead of the app\'s wineglass.',
      'The screensaver stays in the app. The site does not go to sleep while you are reading it.',
      'Back from the dex menu returns to the site, and SYSTEM now offers EXIT TO SITE.',
      'Every old /website link still works, so nothing shared or bookmarked breaks.',
      'Professor Vino no longer sits on the buttons: you can press Home or SETTINGS while he is talking.',
      'The same fix reaches the walkthrough, which used to cover the very button its step was pointing at.',
    ],
  },
  {
    version: '0.2.2',
    date: '2026-08-20',
    headline: 'THE DESK AND THE VINES',
    notes: [
      'The device shrinks to fit a short window, so the buttons under the screen are always reachable.',
      'The quick-pin lamps shipped in 0.2.1 were below the fold on a common desktop window. They are not now.',
      'The power-on test boots on the device screen instead of across the whole browser window.',
      'The screensaver, the professor and his introduction all stay on the device at any window size.',
      'Grape stat bars mean something now: all 177 are written down rather than guessed from the description.',
      'COLOUR runs from teinturiers like Alicante Bouschet and Saperavi down to Poulsard, not one shade per red.',
      'AROMATICS runs from Muscat and Gewurztraminer down to Trebbiano, instead of near-full marks for everyone.',
      'White grapes no longer show phantom tannin. Only the Georgian amber varieties keep any, and they should.',
      'Cabernet Pfeffer is French, one unsourced parentage link is gone, and some descriptions read better.',
      'The render gate now checks a desktop and a short window as well as a phone.',
    ],
  },
  {
    version: '0.2.1',
    date: '2026-08-19',
    headline: 'THE LAMPS BECOME BUTTONS',
    notes: [
      'The two lamps over the marquee are buttons now -- press one to go where it points.',
      'Point them anywhere: right-click or hold a lamp to choose TOOLS, CUSTOMIZE, SETTINGS, DATA or ACCESS.',
      'Each lamp wears its destination as a word cut into the cap, and remembers it.',
      'The island orb and its lamp trio are a matched pair again -- same length, same height.',
      'The lamps on the screen housing are lit rather than printed, and throw light on the plastic.',
    ],
  },
  {
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
      'A BIOS power-on test, and a share funnel with real link previews.',
      'The device is drawn now: 22 chassis shells, marquee panels, passport stamps and skin stickers.',
      'The four footer buttons are drawn art, re-inked per shell -- so every skin has its own moulded caps.',
      'The chassis gains its keyed corner, seated lamps, a stadium orb, and NOCTURNE glows in the dark.',
      'Reduced motion is honoured everywhere, and the whole app is linted and render-tested on every change.',
      'CLEAR ALL SAVED DATA now clears the profile slots too.',
      'The SHOP stays out of scope, LABEL SCAN stays COMING SOON, and there are still no notifications.',
    ],
  },
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
