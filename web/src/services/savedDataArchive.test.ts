import { beforeEach, describe, expect, it } from 'vitest';
import {
  ACCEPTED_TAGS,
  APP_TAG,
  CURRENT_FORMAT,
  applyArchive,
  decodeArchive,
  encodeArchive,
  exportArchive,
  suggestedFilename,
} from './savedDataArchive';

/**
 * Ported from `vinodex-ios/Tests/VinodexCoreTests/SavedDataArchiveTests.swift`.
 * The two registry cases (`the registry holds every key exactly once`, `every
 * Core storage constant derives from the registry`) have no counterpart — the
 * web has no `SavedDataKey` enum; the storage-key spellings are pinned by the
 * round-trip below instead.
 */

const populate = () => {
  localStorage.setItem('bookmarkedEntryIDs', JSON.stringify(['G001', 'R002']));
  localStorage.setItem('wantToTryEntryIDs', JSON.stringify(['S003']));
  localStorage.setItem('triedEntryIDs', JSON.stringify(['G004']));
  localStorage.setItem('triedRatings', JSON.stringify({ G004: { rating: 4, note: 'good', day: 12 } }));
  localStorage.setItem('recentlyViewedEntryIDs', JSON.stringify(['G001']));
  localStorage.setItem('quizTierUnlocked', 'ENTHUSIAST');
  localStorage.setItem('dailyStreak', '3');
  localStorage.setItem('dailyBestStreak', '9');
  localStorage.setItem('dailyLastDay', '0');
  localStorage.setItem('revealCursor', '17');
  localStorage.setItem('starterOnly', 'true');
  localStorage.setItem('grantedEntitlements', JSON.stringify(['pro']));
  localStorage.setItem('userDisplayName', 'PAT');
  localStorage.setItem('textScale', 'LARGE');
  localStorage.setItem('lcdMode', 'LIGHT');
  localStorage.setItem('chassisSkin', 'BURGUNDY');
  localStorage.setItem('soundsEnabled', 'true');
  // hapticsEnabled deliberately untouched — absent is a real state.
};

describe('saved-data archive', () => {
  beforeEach(() => localStorage.clear());

  it('a populated device round-trips through the archive', () => {
    populate();
    const archive = exportArchive(42);
    expect(archive.app).toBe(APP_TAG);
    expect(archive.format).toBe(CURRENT_FORMAT);
    expect(archive.savedShelf).toEqual(['G001', 'R002']);
    expect(archive.triedRatings.G004?.rating).toBe(4);
    expect(archive.quizTierUnlocked).toBe('ENTHUSIAST');
    expect(archive.dailyStreak).toBe(3);
    expect(archive.starterTierOnly).toBe(true);
    expect(archive.grantedEntitlements).toEqual(['pro']);

    localStorage.clear();
    applyArchive(archive);
    const again = exportArchive(42);
    // Entitlements are the deliberate asymmetry — everything else survives.
    expect({ ...again, starterTierOnly: true, grantedEntitlements: ['pro'] }).toEqual(archive);
  });

  it('the encoding is deterministic — two exports of one state are one string', () => {
    populate();
    expect(encodeArchive(exportArchive(1))).toBe(encodeArchive(exportArchive(1)));
  });

  it('a nil last-day survives as nil, and day zero survives as zero', () => {
    populate();
    localStorage.removeItem('dailyLastDay');
    expect(exportArchive(1).dailyLastDay).toBe(null);
    localStorage.setItem('dailyLastDay', '0');
    const archive = exportArchive(1);
    expect(archive.dailyLastDay).toBe(0);
    localStorage.clear();
    applyArchive(archive);
    expect(localStorage.getItem('dailyLastDay')).toBe('0');
    applyArchive({ ...archive, dailyLastDay: null });
    expect(localStorage.getItem('dailyLastDay')).toBe(null);
  });

  it('untouched tri-state settings stay absent rather than becoming false', () => {
    populate();
    const archive = exportArchive(1);
    expect(archive.hapticsEnabled).toBe(null);
    expect(archive.soundsEnabled).toBe(true);
    localStorage.clear();
    applyArchive(archive);
    expect(localStorage.getItem('hapticsEnabled')).toBe(null);
    expect(localStorage.getItem('soundsEnabled')).toBe('true');
  });

  it('entitlements are exported but never imported', () => {
    populate();
    const archive = exportArchive(1);
    localStorage.clear();
    const written = applyArchive(archive);
    expect(localStorage.getItem('grantedEntitlements')).toBe(null);
    expect(localStorage.getItem('starterOnly')).toBe(null);
    expect(written).not.toContain('grantedEntitlements');
  });

  it('a foreign or future archive is refused by name', () => {
    const base = exportArchive(1);
    const foreign = decodeArchive(JSON.stringify({ ...base, app: 'somebody-else' }));
    expect(foreign.ok).toBe(false);
    if (!foreign.ok) expect(foreign.refusal).toEqual({ kind: 'notOurArchive', app: 'somebody-else' });

    const future = decodeArchive(JSON.stringify({ ...base, format: CURRENT_FORMAT + 1 }));
    expect(future.ok).toBe(false);
    if (!future.ok) expect(future.refusal).toEqual({ kind: 'unreadableFormat', format: CURRENT_FORMAT + 1 });

    expect(decodeArchive('{not json').ok).toBe(false);
  });

  it('a missing format is refused — the headers are not forgiven (L1)', () => {
    const raw = JSON.parse(encodeArchive(exportArchive(1))) as Record<string, unknown>;
    delete raw.format;
    expect(decodeArchive(JSON.stringify(raw)).ok).toBe(false);
  });

  it('a rating with stranger keys is rebuilt clean (L2)', () => {
    const raw = JSON.parse(encodeArchive(exportArchive(1))) as { triedRatings: Record<string, unknown> };
    raw.triedRatings = { G001: { rating: 3, note: 'ok', day: 7, smuggled: 'x' } };
    const result = decodeArchive(JSON.stringify(raw));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.archive.triedRatings.G001).toEqual({ rating: 3, note: 'ok', day: 7 });
  });

  it('an iOS archive is accepted — the vocabulary is shared', () => {
    expect(ACCEPTED_TAGS).toContain('vinodex-ios');
    const result = decodeArchive(JSON.stringify({ ...exportArchive(1), app: 'vinodex-ios' }));
    expect(result.ok).toBe(true);
  });

  it('an unknown field is ignored and a missing optional decodes', () => {
    populate();
    const raw = JSON.parse(encodeArchive(exportArchive(9))) as Record<string, unknown>;
    raw.futureField = { anything: true };
    delete raw.displayName;
    delete raw.dailyLastDay;
    const result = decodeArchive(JSON.stringify(raw));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.archive.displayName).toBe(null);
      expect(result.archive.dailyLastDay).toBe(null);
      expect(result.archive.savedShelf).toEqual(['G001', 'R002']);
    }
  });

  it('the filename names the version and the day', () => {
    const archive = exportArchive(123);
    expect(suggestedFilename(archive)).toBe(`vinodex-backup-${archive.appVersion}-123.json`);
  });
});
