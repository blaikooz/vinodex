import { Entitlement } from './access';

/**
 * The unlock-code table, ported from
 * `vinodex-ios/Sources/VinodexCore/CheatCodes.swift` (0.7.3, A4) — v6#29.
 *
 * **Every code here does something today.** The iOS table's own rule: a cheat
 * console cannot survive a code that is documented, accepted, reported as
 * unlocked, and changes nothing. iOS carries five; the web ships the three
 * whose effects exist here. MAINFRAME (verbose boot) arrives with the BIOS
 * boot (v6#24) and GARAGISTE (device workshop) with v6#35 — each added when
 * the thing it unlocks is, exactly as iOS added theirs.
 *
 * **They grant real entitlements, not a separate "cheats" flag** — an unlock
 * here and an unlock in the ACCESS panel are the same question asked of the
 * same store.
 */
export interface CheatCode {
  /** What you type. Uppercase A–Z in the table; matching is forgiving. */
  code: string;
  grants: Entitlement;
  /** The console's success line. Short — printed in the retro face. */
  reveal: string;
}

export const CHEAT_CODES: CheatCode[] = [
  { code: 'CELLARDOOR', grants: { kind: 'skins' }, reveal: 'ALL CHASSIS SKINS' },
  { code: 'PHOSPHOR', grants: { kind: 'lightMode' }, reveal: 'ALL SCREEN MODES' },
  { code: 'GRANDCRU', grants: { kind: 'pro' }, reveal: 'EVERYTHING UNLOCKED' },
];

/**
 * Letters and digits only, uppercased. Not `normalizeLabel`: that one folds
 * diacritics and collapses whitespace, the right normalisation for `Château`
 * and the wrong one for a password-shaped string where a space is simply
 * noise.
 */
export const normalizeCode = (value: string): string =>
  value.toUpperCase().replace(/[^A-Z0-9]/g, '');

/**
 * The code a typed string is, if any. **Forgiving on purpose** — a phone
 * keyboard adds autocapitalisation and stray spaces, and rejecting
 * `cellar door ` when CELLARDOOR was clearly meant makes the console feel
 * broken rather than strict. What is *not* forgiven is a wrong word: there is
 * no fuzzy matching, because "did you mean" on a secret is not a secret.
 */
export const matchCheatCode = (typed: string): CheatCode | null => {
  const key = normalizeCode(typed);
  if (!key) return null;
  return CHEAT_CODES.find(c => normalizeCode(c.code) === key) ?? null;
};
