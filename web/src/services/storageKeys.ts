/**
 * Every key this app persists, and what a wipe does to it (W25).
 *
 * Ported in spirit from `vinodex-ios/Sources/VinodexCore/SavedData.swift`'s
 * `SavedDataKey`, and for the reason that type's own comment gives: the web
 * had a **hand-kept literal array** in `SettingsPanel.tsx` and it had drifted
 * exactly the way iOS's had before AUDIT M35 caught it. Thirty-six key
 * constants existed across the services; `WIPE_KEYS` named twenty-seven.
 *
 * The two that mattered were the **profile slots**: `userProfilesIndex` and
 * the five `userProfileSlot-N` blobs were on no list at all, so CLEAR ALL
 * SAVED DATA left five complete snapshots of the erased device sitting in
 * localStorage — every shelf, every rating, the display name — and the
 * PROFILES panel went on offering to load them. That is the failure this
 * registry exists to make impossible, and it is now a ruling: **a wipe wipes
 * the profiles too.**
 *
 * ## The rule, stated once
 *
 * **Everything the device remembers about *you* goes. What stays is only what
 * is not about you at all.**
 *
 * That wording is v0.3.0's (v8#3). It used to read "the one thing that stays
 * is the grant that let you through the door", and the grant was
 * `unlockedAppIDs`. **There is no door any more** — the access code is gone,
 * the site hands the app over on a button press, and a key recording a
 * permission nothing asks for is not a `keep` with a stale note, it is a key
 * with nothing to record. It is deleted rather than re-justified. The one
 * survivors are the two spent browser prompts, `installNudgeDismissed` and
 * `iosUpdatesPromptSeen`; both are facts about this *browser*, not the player.
 *
 * That settles the inconsistency the audit flagged: `textScale`, `uiScale`
 * and `chassisSkin` were wiped while `hapticsEnabled` and `soundsEnabled`
 * were not, which is not a rule, it is two people's guesses. iOS wipes all
 * five — every one of them is a `SavedDataKey` case and `wipeAll` is built on
 * "no key survives a wipe" — so the web follows, and the preferences go with
 * the rest.
 *
 * ## Why a registry rather than a longer array
 *
 * `storageKeys.test.ts` walks the source for every `localStorage` key the app
 * actually touches and fails if one is not listed here. So a new key is a
 * failing test in one place, rather than a value that quietly survives a wipe
 * and is discovered by somebody who thought they had erased it.
 */

/** What CLEAR ALL SAVED DATA does to a key. */
export type KeyDisposition = 'wipe' | 'keep';

export interface StorageKeySpec {
  key: string;
  disposition: KeyDisposition;
  /** Why — required on `keep`, and worth having on the rest. */
  note: string;
}

/** How many profile slots exist. Mirrors `userProfiles.MAX_PROFILES`. */
export const PROFILE_SLOT_COUNT = 5;

/** The slot blob key. Mirrors `userProfiles.slotKey`. */
export const profileSlotKey = (slot: number): string => `userProfileSlot-${slot}`;

export const STORAGE_KEYS: readonly StorageKeySpec[] = [
  // --- Shelves and ratings. Also cleared by `removeEverything()`, which
  // notifies subscribers; listed anyway so this registry is a complete
  // statement rather than a supplement to one.
  { key: 'bookmarkedEntryIDs', disposition: 'wipe', note: 'SAVED shelf' },
  { key: 'wantToTryEntryIDs', disposition: 'wipe', note: 'WANT TO TRY shelf' },
  { key: 'triedEntryIDs', disposition: 'wipe', note: 'TRIED shelf' },
  { key: 'triedRatings', disposition: 'wipe', note: 'per-entry ratings' },
  { key: 'triedEntryDays', disposition: 'wipe', note: 'when each entry joined TRIED' },

  // --- Trail
  { key: 'recentlyViewedEntryIDs', disposition: 'wipe', note: 'the 20-entry trail' },

  // --- Progress
  { key: 'quizTierUnlocked', disposition: 'wipe', note: 'highest daily-quiz tier' },
  { key: 'dailyStreak', disposition: 'wipe', note: 'current challenge streak' },
  { key: 'dailyLastDay', disposition: 'wipe', note: 'last challenge day' },
  { key: 'dailyBestStreak', disposition: 'wipe', note: 'best challenge streak' },
  { key: 'revealCursor', disposition: 'wipe', note: 'daily pick cursor' },
  { key: 'examResults', disposition: 'wipe', note: 'wine exam history' },
  {
    key: 'examBestPassStreak',
    disposition: 'wipe',
    note: 'exam pass streak — an un-reset history would leave a fresh start claiming a hundred papers of statistics',
  },

  // --- Entitlements
  { key: 'grantedEntitlements', disposition: 'wipe', note: 'unlocked entry tiers' },
  {
    key: 'starterOnly',
    disposition: 'wipe',
    note: "starter-tier flag. Note the key differs from iOS's `starterTierOnly`; recorded in IOS-PARITY-v6 rather than renamed, because a rename resets stored state",
  },

  // --- Identity
  { key: 'userDisplayName', disposition: 'wipe', note: 'the name the professor uses' },
  { key: 'avatarImage', disposition: 'wipe', note: 'profile photo' },

  // --- Preferences. Wiped, per the rule above: iOS carries all five as
  // SavedDataKey cases and wipes them, and half-wiping a preference set is
  // the inconsistency this registry was written to settle.
  { key: 'chassisSkin', disposition: 'wipe', note: 'chassis colourway' },
  { key: 'lcdMode', disposition: 'wipe', note: 'screen mode' },
  { key: 'textScale', disposition: 'wipe', note: 'text size' },
  { key: 'uiScale', disposition: 'wipe', note: 'chassis furniture size' },
  { key: 'hapticsEnabled', disposition: 'wipe', note: 'haptics preference' },
  { key: 'soundsEnabled', disposition: 'wipe', note: 'tap-sound preference' },
  // --- The Device Workshop (v0.5.0). The eight part axes share iOS's exact
  // key spellings (`DeviceAxis.storageKey`); empty is stored as absence, so
  // a stock device carries none of them. Wiped with the preferences — iOS
  // wipes every SavedDataKey and a half-wiped device build would be neither
  // stock nor the build the player made.
  { key: 'devicePartButtons', disposition: 'wipe', note: 'workshop: footer buttons colour' },
  { key: 'devicePartOrb', disposition: 'wipe', note: 'workshop: orb colour' },
  { key: 'devicePartHeaderLamps', disposition: 'wipe', note: 'workshop: island lamp trio colour' },
  { key: 'devicePartMarquee', disposition: 'wipe', note: 'workshop: marquee phosphor colour' },
  { key: 'devicePartMarqueeLamps', disposition: 'wipe', note: 'workshop: marquee pill-lamp colour' },
  { key: 'devicePartGrille', disposition: 'wipe', note: 'workshop: grille colour' },
  { key: 'devicePartGrilleShape', disposition: 'wipe', note: 'workshop: grille pattern' },
  { key: 'devicePartFont', disposition: 'wipe', note: 'workshop: screen ink colour' },
  { key: 'customDevices', disposition: 'wipe', note: 'workshop: the saved builds, iOS CustomDeviceStore.storageKey' },
  {
    key: 'backPlateStampOffsets',
    disposition: 'wipe',
    note:
      'where each back-plate stamp has been dragged to, iOS '
      + 'StampLayoutStore.storageKey verbatim -- a map of stamp id to pixel '
      + 'offset from its issued slot; absence means the plate\'s own spot.',
  },
  {
    key: 'marqueeQuickPins',
    disposition: 'wipe',
    note:
      'where the two marquee lamp buttons point. iOS carries it as a '
      + 'UserDefaults key under this exact spelling (QuickPinStore.storageKey); '
      + 'wiped with the rest of the preferences, and a wiped device decodes '
      + "'' back to the shipped TOOLS/CUSTOMIZE pair rather than to two dark "
      + 'lamps.',
  },
  {
    key: 'keepAwakeEnabled',
    disposition: 'wipe',
    note:
      'keep-the-screen-awake preference. Written on restore by savedDataArchive '
      + 'and never by anything else, which is why it was missed: the drift scan '
      + 'saw a put() call rather than a setItem with a literal. iOS carries it '
      + 'as a SavedDataKey case and its allCases loop removes it, so leaving it '
      + 'behind broke parity as well as the rule this registry states.',
  },

  // --- One-shot ledgers. Every one of these would, if it survived, open a
  // fresh start with its celebration already spent — on the single run where
  // earning it again is the whole point.
  { key: 'passportSeenBadges', disposition: 'wipe', note: 'stamp announce ledger' },
  { key: 'passportSeenBadgesSeeded', disposition: 'wipe', note: 'stamp ledger seeded flag' },
  { key: 'passportSeenTierRank', disposition: 'wipe', note: 'rank announce ledger' },
  { key: 'passportSeenTierSeeded', disposition: 'wipe', note: 'rank ledger seeded flag' },
  { key: 'firstTimeTriggersSeen', disposition: 'wipe', note: "the professor's memory" },
  {
    key: 'firstTimeTriggersSeeded',
    disposition: 'wipe',
    note: 'trigger seeded flag — without it a wiped device declines to re-seed and every later seed is a no-op',
  },
  { key: 'vinoSilenced', disposition: 'wipe', note: 'professor silenced' },
  { key: 'coachmarkReached', disposition: 'wipe', note: 'walkthrough progress' },
  { key: 'coachmarkOffered', disposition: 'wipe', note: 'walkthrough offered' },
  { key: 'coachmarkCompleted', disposition: 'wipe', note: 'walkthrough completed' },
  { key: 'toolIntrosSeen', disposition: 'wipe', note: 'which tools have shown their first-open card (v10#5)' },
  { key: 'dailyMarks', disposition: 'wipe', note: "today's daily-challenge marks, for the result string (v10#3)" },

  // --- Profiles. THE W25 defect: neither of these was on any list, so a wipe
  // left five complete snapshots of the erased device behind.
  { key: 'userProfilesIndex', disposition: 'wipe', note: 'the profile slot index' },
  ...Array.from({ length: PROFILE_SLOT_COUNT }, (_, i) => ({
    key: profileSlotKey(i + 1),
    disposition: 'wipe' as const,
    note: `profile slot ${i + 1} — a full snapshot of a device, wiped with it`,
  })),

  // --- Kept: spent browser prompts, not user data at all.
  //
  // `unlockedAppIDs` used to sit here, keeping the grant that let you through
  // the portal door. The door is gone (v8#3), so the key records nothing and
  // is not registered at all — neither wiped nor kept. Anything still in a
  // returning visitor's localStorage under that name is simply inert; it is
  // not read, and a wipe leaving it is the same non-event as a wipe leaving
  // any other site's data.
  {
    key: 'installNudgeDismissed',
    disposition: 'keep',
    note: 'the "add to home screen" banner has been dismissed. A browser-chrome preference about this *browser*, not a record of anything the player did; re-nagging someone who just erased their data would be the wrong reading of a reset.',
  },
  {
    key: 'iosUpdatesPromptSeen',
    disposition: 'keep',
    note: 'the optional iOS-updates invitation has already appeared in this browser. It records a spent browser prompt, not wine data or player progress.',
  },
] as const;

/** Keys a wipe removes. */
export const WIPE_KEYS: readonly string[] = STORAGE_KEYS
  .filter(s => s.disposition === 'wipe')
  .map(s => s.key);

/** Keys a wipe deliberately leaves, each with its stated reason. */
export const KEEP_KEYS: readonly StorageKeySpec[] = STORAGE_KEYS.filter(s => s.disposition === 'keep');

/**
 * Session-storage keys. Not part of the wipe contract — session storage dies
 * with the tab, so there is nothing for a reset to promise about it — but
 * registered so the drift test can tell "known and out of scope" from
 * "somebody added a key and told nobody".
 *
 * **There are none, as of v0.3.0.** The single entry was `booted`, the flag
 * that made the BIOS a once-per-session event. The BIOS is not a session fact
 * any more — it runs every time you open the app (v8#2, `appRoutes.ts`) — so
 * there is nothing left to remember. The list stays rather than the concept
 * being deleted: a session key added later still has to be declared, and the
 * drift scan still has somewhere to check it against.
 *
 * The in-flight exam paper, quiz session and chip filter look like session
 * storage from their call sites (`ssQuery`), and are not: `screenState.ts` is
 * a module-level `Map`, deliberately, so a cold load starts clean and a scroll
 * handler never triggers a render. Nothing to register and nothing to wipe.
 */
export const SESSION_KEYS: readonly StorageKeySpec[] = [] as const;

/** Every registered key, local and session. */
export const ALL_REGISTERED_KEYS: readonly string[] = [
  ...STORAGE_KEYS.map(s => s.key),
  ...SESSION_KEYS.map(s => s.key),
];
