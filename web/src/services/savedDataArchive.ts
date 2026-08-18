import { TriedRating } from './bookmarks';
import { dayIndex } from './dailyPick';
import { APP_VERSION } from './appVersion';

/**
 * A copy of everything this device holds, as one file the user owns — ported
 * from `vinodex-ios/Sources/VinodexCore/SavedDataArchive.swift` (v6#31).
 *
 * The archive **field names are the iOS `Codable` keys, byte for byte** —
 * persisted vocabulary is shared vocabulary, and this file is the one format
 * the two apps could ever trade. The underlying localStorage keys match the
 * iOS `SavedDataKey` raw values already (verified at port time; the one
 * divergence, web `starterOnly` vs iOS `starterTierOnly`, is confined to the
 * never-imported field).
 *
 * **Forward-compat parsing is the rule** (review note R-#31): a reader that
 * meets an unknown key ignores it, and a missing key defaults rather than
 * fails — which is what makes adding a field free, and is the web analogue of
 * the iOS `decodeIfPresent` rule that near-missed three times over there.
 */
export interface SavedDataArchive {
  format: number;
  app: string;
  /** Informational, never enforced — an archive from a newer build is readable. */
  appVersion: string;
  /** `dayIndex()` at export, so a restore can say how old it is. */
  exportedDay: number;

  savedShelf: string[];
  wantToTryShelf: string[];
  triedShelf: string[];
  triedRatings: Record<string, TriedRating>;
  recentlyViewed: string[];
  quizTierUnlocked: string | null;
  dailyStreak: number;
  dailyBestStreak: number;
  /** Optional on purpose: "never played" and "played on the epoch" must not collapse into 0. */
  dailyLastDay: number | null;
  revealCursor: number;
  /** Recorded so the archive is complete. **Not restored** — see `applyArchive`. */
  starterTierOnly: boolean;
  grantedEntitlements: string[];
  displayName: string | null;
  textScale: string | null;
  uiScale: string | null;
  lcdMode: string | null;
  chassisSkin: string | null;
  hapticsEnabled: boolean | null;
  soundsEnabled: boolean | null;
  keepAwakeEnabled: boolean | null;
  /** Base64 JPEG, matching iOS `Data` encoding — inline so the file is whole. */
  avatarJPEG: string | null;
}

/** Bumped when a field's *meaning* changes, not when one is added. */
export const CURRENT_FORMAT = 1;
/** What this app writes. */
export const APP_TAG = 'vinodex-web';
/**
 * What this app reads. The iOS tag is accepted deliberately: the payload
 * vocabulary is identical, and refusing a file the same product wrote on the
 * other platform would be the archive failing at the one job that justifies
 * its shared field names. (iOS currently accepts only its own tag — a web
 * archive does not restore over there; noted in the ledger.)
 */
export const ACCEPTED_TAGS = ['vinodex-web', 'vinodex-ios'];

export type ArchiveRefusal =
  | { kind: 'notOurArchive'; app: string }
  | { kind: 'unreadableFormat'; format: number }
  | { kind: 'notJSON' };

export type DecodeResult = { ok: true; archive: SavedDataArchive } | { ok: false; refusal: ArchiveRefusal };

const str = (v: unknown): string | null => (typeof v === 'string' ? v : null);
const num = (v: unknown, fallback: number): number => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);
const optNum = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const optBool = (v: unknown): boolean | null => (typeof v === 'boolean' ? v : null);
const strArray = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);

/** Checks the two header fields before any of the payload is trusted. */
export const decodeArchive = (json: string): DecodeResult => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { ok: false, refusal: { kind: 'notJSON' } };
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, refusal: { kind: 'notJSON' } };
  }
  const raw = parsed as Record<string, unknown>;
  const app = str(raw.app) ?? '';
  if (!ACCEPTED_TAGS.includes(app)) return { ok: false, refusal: { kind: 'notOurArchive', app } };
  const format = num(raw.format, 0);
  if (format > CURRENT_FORMAT) return { ok: false, refusal: { kind: 'unreadableFormat', format } };

  const ratings: Record<string, TriedRating> = {};
  if (raw.triedRatings && typeof raw.triedRatings === 'object' && !Array.isArray(raw.triedRatings)) {
    for (const [id, r] of Object.entries(raw.triedRatings as Record<string, unknown>)) {
      if (r && typeof r === 'object' && typeof (r as TriedRating).rating === 'number') {
        ratings[id] = r as TriedRating;
      }
    }
  }

  // Missing keys default, unknown keys are simply never read.
  return {
    ok: true,
    archive: {
      format,
      app,
      appVersion: str(raw.appVersion) ?? '',
      exportedDay: num(raw.exportedDay, 0),
      savedShelf: strArray(raw.savedShelf),
      wantToTryShelf: strArray(raw.wantToTryShelf),
      triedShelf: strArray(raw.triedShelf),
      triedRatings: ratings,
      recentlyViewed: strArray(raw.recentlyViewed),
      quizTierUnlocked: str(raw.quizTierUnlocked),
      dailyStreak: num(raw.dailyStreak, 0),
      dailyBestStreak: num(raw.dailyBestStreak, 0),
      dailyLastDay: optNum(raw.dailyLastDay),
      revealCursor: num(raw.revealCursor, 0),
      starterTierOnly: raw.starterTierOnly === true,
      grantedEntitlements: strArray(raw.grantedEntitlements),
      displayName: str(raw.displayName),
      textScale: str(raw.textScale),
      uiScale: str(raw.uiScale),
      lcdMode: str(raw.lcdMode),
      chassisSkin: str(raw.chassisSkin),
      hapticsEnabled: optBool(raw.hapticsEnabled),
      soundsEnabled: optBool(raw.soundsEnabled),
      keepAwakeEnabled: optBool(raw.keepAwakeEnabled),
      avatarJPEG: str(raw.avatarJPEG),
    },
  };
};

/** Sorted keys, so two exports of the same state are the same bytes. */
export const encodeArchive = (archive: SavedDataArchive): string => {
  const sorted = Object.fromEntries(
    Object.entries(archive).sort(([a], [b]) => (a < b ? -1 : 1)),
  );
  return JSON.stringify(sorted, null, 2);
};

export const suggestedFilename = (archive: SavedDataArchive): string =>
  `vinodex-backup-${archive.appVersion}-${archive.exportedDay}.json`;

// ---------------------------------------------------------------------------
// The archiver — reads and writes against localStorage
// ---------------------------------------------------------------------------

const ls = (): Storage | null => (typeof window === 'undefined' ? null : window.localStorage);

const readJSONArray = (key: string): string[] => {
  try {
    const raw = ls()?.getItem(key);
    if (!raw) return [];
    return strArray(JSON.parse(raw));
  } catch {
    return [];
  }
};

const readInt = (key: string): number => {
  try {
    const raw = ls()?.getItem(key);
    const n = raw === null || raw === undefined ? NaN : Number(raw);
    return Number.isFinite(n) ? Math.trunc(n) : 0;
  } catch {
    return 0;
  }
};

const readOptInt = (key: string): number | null => {
  try {
    const raw = ls()?.getItem(key);
    if (raw === null || raw === undefined) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? Math.trunc(n) : null;
  } catch {
    return null;
  }
};

const readStr = (key: string): string | null => {
  try {
    return ls()?.getItem(key) ?? null;
  } catch {
    return null;
  }
};

/**
 * Absent is a real state for the toggles — `hapticsEnabled` defaults on when
 * missing and `soundsEnabled` defaults off, so reading them as plain booleans
 * would export "off, off" for a device that has never opened settings.
 */
const readOptBool = (key: string): boolean | null => {
  const raw = readStr(key);
  if (raw === null) return null;
  if (raw === 'true' || raw === '1') return true;
  if (raw === 'false' || raw === '0') return false;
  return null;
};

const JPEG_PREFIX = 'data:image/jpeg;base64,';

/** Everything the device holds right now, as one value. */
export const exportArchive = (day: number = dayIndex()): SavedDataArchive => {
  const ratings: Record<string, TriedRating> = {};
  try {
    const raw = ls()?.getItem('triedRatings');
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        for (const [id, r] of Object.entries(parsed as Record<string, unknown>)) {
          if (r && typeof r === 'object') ratings[id] = r as TriedRating;
        }
      }
    }
  } catch {
    /* corrupt ratings degrade to none */
  }

  const avatar = readStr('avatarImage');

  return {
    format: CURRENT_FORMAT,
    app: APP_TAG,
    appVersion: APP_VERSION,
    exportedDay: day,
    savedShelf: readJSONArray('bookmarkedEntryIDs'),
    wantToTryShelf: readJSONArray('wantToTryEntryIDs'),
    triedShelf: readJSONArray('triedEntryIDs'),
    triedRatings: ratings,
    recentlyViewed: readJSONArray('recentlyViewedEntryIDs'),
    quizTierUnlocked: readStr('quizTierUnlocked'),
    dailyStreak: readInt('dailyStreak'),
    dailyBestStreak: readInt('dailyBestStreak'),
    dailyLastDay: readOptInt('dailyLastDay'),
    revealCursor: readInt('revealCursor'),
    // Recorded under the iOS archive field name; the web's own key differs
    // (`starterOnly`) but this field is export-only either way.
    starterTierOnly: readStr('starterOnly') === 'true',
    grantedEntitlements: readJSONArray('grantedEntitlements'),
    displayName: readStr('userDisplayName'),
    textScale: readStr('textScale'),
    uiScale: readStr('uiScale'),
    lcdMode: readStr('lcdMode'),
    chassisSkin: readStr('chassisSkin'),
    hapticsEnabled: readOptBool('hapticsEnabled'),
    soundsEnabled: readOptBool('soundsEnabled'),
    keepAwakeEnabled: readOptBool('keepAwakeEnabled'),
    // The web avatar is a data URL; the archive field is base64 JPEG (iOS
    // `Data`). Non-JPEG avatars are simply not exported.
    avatarJPEG: avatar?.startsWith(JPEG_PREFIX) ? avatar.slice(JPEG_PREFIX.length) : null,
  };
};

/** The keys `applyArchive` reports on — the archive vocabulary, not storage keys. */
export type AppliedKey =
  | 'savedShelf' | 'wantToTryShelf' | 'triedShelf' | 'triedRatings' | 'recentlyViewed'
  | 'quizTierUnlocked' | 'dailyStreak' | 'dailyBestStreak' | 'dailyLastDay' | 'revealCursor'
  | 'displayName' | 'textScale' | 'uiScale' | 'lcdMode' | 'chassisSkin'
  | 'hapticsEnabled' | 'soundsEnabled' | 'keepAwakeEnabled' | 'avatarJPEG';

/**
 * Writes the archive back. Returns the keys actually written, so the caller
 * can report "restored 14 of 19" rather than a silent success.
 *
 * A null optional **removes** its key rather than writing a zero value —
 * absent is what means "off" for sounds and "on" for haptics.
 *
 * The one deliberate asymmetry, kept from iOS: `starterTierOnly` and
 * `grantedEntitlements` are exported but never imported. Purchases come from
 * a store, never from a file the user can edit — an importable entitlement
 * list is a free unlock for anyone with a text editor. (The web tier is
 * un-gated today, but the seam stays honest so an archive is portable.)
 *
 * Callers should reload after applying, so every external store re-reads.
 */
export const applyArchive = (archive: SavedDataArchive): AppliedKey[] => {
  const storage = ls();
  if (!storage) return [];
  const written: AppliedKey[] = [];

  const put = (key: AppliedKey, storageKey: string, value: string | null) => {
    try {
      if (value === null) storage.removeItem(storageKey);
      else {
        storage.setItem(storageKey, value);
        written.push(key);
      }
    } catch {
      /* quota or privacy mode — skip */
    }
  };

  put('savedShelf', 'bookmarkedEntryIDs', JSON.stringify(archive.savedShelf));
  put('wantToTryShelf', 'wantToTryEntryIDs', JSON.stringify(archive.wantToTryShelf));
  put('triedShelf', 'triedEntryIDs', JSON.stringify(archive.triedShelf));
  put('triedRatings', 'triedRatings', JSON.stringify(archive.triedRatings));
  put('recentlyViewed', 'recentlyViewedEntryIDs', JSON.stringify(archive.recentlyViewed));
  put('quizTierUnlocked', 'quizTierUnlocked', archive.quizTierUnlocked);
  put('dailyStreak', 'dailyStreak', String(archive.dailyStreak));
  put('dailyBestStreak', 'dailyBestStreak', String(archive.dailyBestStreak));
  put('dailyLastDay', 'dailyLastDay', archive.dailyLastDay === null ? null : String(archive.dailyLastDay));
  put('revealCursor', 'revealCursor', String(archive.revealCursor));
  put('displayName', 'userDisplayName', archive.displayName);
  put('textScale', 'textScale', archive.textScale);
  put('uiScale', 'uiScale', archive.uiScale);
  put('lcdMode', 'lcdMode', archive.lcdMode);
  put('chassisSkin', 'chassisSkin', archive.chassisSkin);
  put('hapticsEnabled', 'hapticsEnabled', archive.hapticsEnabled === null ? null : String(archive.hapticsEnabled));
  put('soundsEnabled', 'soundsEnabled', archive.soundsEnabled === null ? null : String(archive.soundsEnabled));
  put('keepAwakeEnabled', 'keepAwakeEnabled', archive.keepAwakeEnabled === null ? null : String(archive.keepAwakeEnabled));
  put('avatarJPEG', 'avatarImage', archive.avatarJPEG === null ? null : JPEG_PREFIX + archive.avatarJPEG);

  return written;
};
