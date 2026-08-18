import { beforeEach, describe, expect, it } from 'vitest';
import { CHEAT_CODES, matchCheatCode, normalizeCode } from './cheatCodes';
import { entitlementId, grantedIds, isGranted, toggleEntitlement } from './access';

/**
 * Ported from the code-table cases of the iOS cheat suite. The web table is
 * the three codes whose effects exist here — MAINFRAME and GARAGISTE arrive
 * with the boot screen (v6#24) and the workshop (v6#35), per the table's own
 * "every code does something today" rule.
 */
describe('cheat codes', () => {
  beforeEach(() => localStorage.clear());

  it('every code is distinct after normalisation', () => {
    const keys = CHEAT_CODES.map(c => normalizeCode(c.code));
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('matching forgives case, whitespace and punctuation', () => {
    expect(matchCheatCode('cellar door ')?.code).toBe('CELLARDOOR');
    expect(matchCheatCode('cellar-door')?.code).toBe('CELLARDOOR');
    expect(matchCheatCode('  Grandcru')?.code).toBe('GRANDCRU');
  });

  it('a wrong word is a wrong word — no fuzzy matching', () => {
    expect(matchCheatCode('CELLARDOR')).toBe(null);
    expect(matchCheatCode('')).toBe(null);
    expect(matchCheatCode(' - ')).toBe(null);
  });

  it('codes grant through the one access store', () => {
    const code = matchCheatCode('PHOSPHOR')!;
    expect(isGranted(code.grants)).toBe(false);
    if (!isGranted(code.grants)) toggleEntitlement(code.grants);
    expect(isGranted(code.grants)).toBe(true);
    expect(grantedIds()).toContain(entitlementId(code.grants));
  });
});
