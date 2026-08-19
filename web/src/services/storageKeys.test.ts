import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  ALL_REGISTERED_KEYS,
  KEEP_KEYS,
  PROFILE_SLOT_COUNT,
  SESSION_KEYS,
  STORAGE_KEYS,
  WIPE_KEYS,
  profileSlotKey,
} from './storageKeys';
import { MAX_PROFILES } from './userProfiles';

/**
 * The registry cannot drift (W25).
 *
 * A registry that has to be kept in step by hand is the thing it replaced.
 * `SettingsPanel.tsx` carried a literal array of 27 keys while 36 key
 * constants existed across the services, and the gap was invisible because
 * nothing compared the two — which is precisely how the five profile slots
 * came to survive a wipe that promised to erase everything.
 *
 * So this suite **reads the source**. It walks every non-test file under
 * `web/` for the keys the app actually hands to `localStorage`, resolving
 * one-hop constants and the `Record` maps two stores use, and fails if a key
 * it finds is not registered. Adding a key without a disposition is now a red
 * test in one place, naming the key and the file.
 *
 * The alternative — asserting a hardcoded count — was rejected for the
 * obvious reason: it would have passed on the pre-fix tree, since 27 was a
 * perfectly consistent number for the list to have.
 */

const WEB_ROOT = path.resolve(__dirname, '../..');

const sourceFiles = (dir: string, out: string[] = []): string[] => {
  for (const name of fs.readdirSync(dir)) {
    if (name === 'node_modules' || name === 'e2e' || name.startsWith('.')) continue;
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) sourceFiles(full, out);
    else if (/\.tsx?$/.test(name) && !name.includes('.test.')) out.push(full);
  }
  return out;
};

/**
 * Keys handed to `localStorage`, per file.
 *
 * Three shapes are resolved, which is every shape this codebase uses:
 *
 *   localStorage.getItem('literal')
 *   const NAME_KEY = 'literal';  ... localStorage.getItem(NAME_KEY)
 *   const MAP: Record<..> = { a: 'literal', .. }; .. getItem(MAP[x])
 *
 * A fourth — a key computed at the call site — would show up as an
 * unresolved identifier, and the test reports those rather than ignoring
 * them, so a new indirection is loud rather than silently uncovered.
 */
const localKeysIn = (src: string): { keys: Set<string>; unresolved: Set<string> } => {
  const consts = new Map<string, string>();
  for (const m of src.matchAll(/const\s+([A-Za-z_$][\w$]*)\s*=\s*'([^']+)'/g)) {
    consts.set(m[1]!, m[2]!);
  }
  // The two `Record<..., string>` key maps (bookmarks' SHELF_KEY is the live
  // one). Every string value inside such a literal counts as a key.
  const mapValues = new Set<string>();
  for (const m of src.matchAll(/const\s+[A-Za-z_$][\w$]*_KEY[A-Za-z_$]*\s*:\s*Record<[^>]*>\s*=\s*\{([^}]*)\}/g)) {
    for (const v of m[1]!.matchAll(/'([^']+)'/g)) mapValues.add(v[1]!);
  }

  const keys = new Set<string>(mapValues);
  const unresolved = new Set<string>();
  for (const m of src.matchAll(/localStorage\s*\.\s*(?:get|set|remove)Item\(\s*([^,)]+)/g)) {
    const arg = m[1]!.trim();
    const lit = arg.match(/^'([^']+)'$/);
    if (lit) { keys.add(lit[1]!); continue; }
    const ident = arg.match(/^([A-Za-z_$][\w$]*)$/);
    if (ident) {
      const resolved = consts.get(ident[1]!);
      if (resolved) keys.add(resolved);
      // A bare parameter named `key`/`k`/`storageKey` is a helper taking the
      // key from its caller.
      //
      // **This whitelist was a hole and `keepAwakeEnabled` fell through it.**
      // The premise was "the caller's own literal is found by one of the
      // branches above", which holds only when the caller writes
      // `setItem('literal')`. `savedDataArchive.ts` calls
      // `put('field', 'storageKey', value)` and `put`'s body is
      // `storage.setItem(storageKey, value)` — so the scan saw a whitelisted
      // identifier here and never saw the literal anywhere, and a real key
      // survived CLEAR ALL SAVED DATA. `putKeysIn` below closes it.
      else if (!/^(key|k|storageKey|name)$/.test(ident[1]!)) unresolved.add(ident[1]!);
      continue;
    }
    // A `Record` lookup — the values were harvested above.
    if (/^[A-Za-z_$][\w$]*\[/.test(arg)) continue;
    // A template literal: the profile slot key, which is registered
    // explicitly for all five slots.
    if (arg.startsWith('`')) continue;
    unresolved.add(arg);
  }
  return { keys, unresolved };
};

/**
 * Storage keys passed as the second argument to `put(...)`.
 *
 * The exact shape that defeated `localKeysIn`: an indirection whose literal
 * never reaches a `setItem` call site. Kept narrow on purpose — this matches
 * `put(` specifically rather than trying to trace every helper in the repo,
 * because a general call-graph walk in a test is a second program to get
 * wrong. If a third indirection appears, the `unresolved` check above will
 * report it and it gets its own extractor, exactly like this one.
 */
const putKeysIn = (src: string): Set<string> => {
  const keys = new Set<string>();
  for (const m of src.matchAll(/[^\w$.]put\(\s*'[^']*'\s*,\s*'([^']+)'/g)) keys.add(m[1]!);
  return keys;
};

describe('the storage-key registry', () => {
  const files = sourceFiles(WEB_ROOT);

  it('finds a non-trivial number of source files to scan', () => {
    // Guards the guard: a broken walk would make every assertion below pass
    // by finding nothing at all.
    expect(files.length).toBeGreaterThan(40);
  });

  it('registers every localStorage key the app touches', () => {
    const registered = new Set(ALL_REGISTERED_KEYS);
    const missing: string[] = [];
    for (const file of files) {
      const src = fs.readFileSync(file, 'utf8');
      // The registry itself lists every key by definition.
      if (file.endsWith('storageKeys.ts')) continue;
      const found = new Set([...localKeysIn(src).keys, ...putKeysIn(src)]);
      for (const key of found) {
        if (!registered.has(key)) missing.push(`${key}  (${path.relative(WEB_ROOT, file)})`);
      }
    }
    expect(missing, `unregistered storage keys:\n${missing.join('\n')}`).toEqual([]);
  });

  it('resolves every localStorage call site', () => {
    const unresolved: string[] = [];
    for (const file of files) {
      if (file.endsWith('storageKeys.ts')) continue;
      const src = fs.readFileSync(file, 'utf8');
      for (const u of localKeysIn(src).unresolved) {
        unresolved.push(`${u}  (${path.relative(WEB_ROOT, file)})`);
      }
    }
    // A new indirection is not necessarily wrong, but it is a hole in the
    // check above and has to be taught to this test rather than ignored.
    expect(unresolved, `unresolvable localStorage keys:\n${unresolved.join('\n')}`).toEqual([]);
  });

  it('gives every key exactly one disposition, and no duplicates', () => {
    const seen = new Set<string>();
    for (const spec of [...STORAGE_KEYS, ...SESSION_KEYS]) {
      expect(seen.has(spec.key), `duplicate registration: ${spec.key}`).toBe(false);
      seen.add(spec.key);
      expect(['wipe', 'keep']).toContain(spec.disposition);
    }
  });

  it('requires a stated reason on every key it keeps', () => {
    for (const spec of KEEP_KEYS) {
      expect(spec.note.length, `${spec.key} is kept without a reason`).toBeGreaterThan(40);
    }
  });

  it('keeps exactly the two keys the rule allows', () => {
    // The rule: everything the device remembers about you goes; what stays is
    // the grant that let you in, and one browser-chrome preference. Any third
    // `keep` is a decision, not an edit, and should fail here first.
    expect(KEEP_KEYS.map(s => s.key).sort()).toEqual(['installNudgeDismissed', 'unlockedAppIDs']);
  });

  it('wipes the profile index and every slot — the W25 defect', () => {
    expect(WIPE_KEYS).toContain('userProfilesIndex');
    for (let slot = 1; slot <= PROFILE_SLOT_COUNT; slot += 1) {
      expect(WIPE_KEYS, `slot ${slot} survives a wipe`).toContain(profileSlotKey(slot));
    }
  });

  it('agrees with userProfiles about how many slots there are', () => {
    // Two constants naming the same fact is the shape that produced this bug;
    // holding them equal is the cheapest available fix short of one import.
    expect(PROFILE_SLOT_COUNT).toBe(MAX_PROFILES);
  });

  it('wipes the whole preference set rather than half of it', () => {
    // The inconsistency the audit flagged: three of these were wiped and two
    // were not, which is not a rule. iOS wipes all five.
    for (const k of ['chassisSkin', 'lcdMode', 'textScale', 'uiScale', 'hapticsEnabled', 'soundsEnabled']) {
      expect(WIPE_KEYS, `${k} survives a wipe`).toContain(k);
    }
  });
});
