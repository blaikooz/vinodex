import { describe, it, expect, beforeEach } from 'vitest';
import { dailySession, recordDaily, currentStreak, bestStreak, isTodayDone } from './dailyChallenge';

// Noon-based dates so the local-day boundary is never in play.
const at = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h);

// Mirrors DailyChallengeTests.swift.
describe('daily challenge paper', () => {
  it('the same day gets the same paper', () => {
    const morning = at(2026, 7, 30, 8);
    const evening = at(2026, 7, 30, 20);
    expect(dailySession(morning).seed).toBe(dailySession(evening).seed);
  });

  it('consecutive days get different papers', () => {
    expect(dailySession(at(2026, 7, 30)).seed).not.toBe(dailySession(at(2026, 7, 31)).seed);
  });

  it('is five questions, four to pass, mid tier', () => {
    const s = dailySession(at(2026, 7, 30));
    expect(s.length).toBe(5);
    expect(s.passMark).toBe(4);
    expect(s.tier).toBe('ENTHUSIAST');
    expect(s.index).toBe(0);
  });
});

// Mirrors StreakStoreTests.swift.
describe('daily streak', () => {
  beforeEach(() => localStorage.clear());

  it('a fresh store has no history', () => {
    expect(currentStreak()).toBe(0);
    expect(bestStreak()).toBe(0);
    expect(isTodayDone(100)).toBe(false);
  });

  it('passes chain on consecutive days and restart after a gap', () => {
    expect(recordDaily(true, 100)).toBe(1);
    expect(recordDaily(true, 101)).toBe(2);
    expect(recordDaily(true, 102)).toBe(3);
    expect(recordDaily(true, 105)).toBe(1); // two days missed
    expect(bestStreak()).toBe(3);
  });

  it('a fail consumes the day and zeroes the streak', () => {
    recordDaily(true, 100);
    recordDaily(false, 101);
    expect(currentStreak()).toBe(0);
    expect(isTodayDone(101)).toBe(true);
    expect(recordDaily(true, 102)).toBe(1);
  });

  it('the same day twice is a no-op', () => {
    recordDaily(true, 100);
    expect(recordDaily(true, 100)).toBe(1);
    expect(recordDaily(false, 100)).toBe(1);
    expect(currentStreak()).toBe(1);
  });

  it('pre-epoch day indices round-trip', () => {
    recordDaily(true, -3000);
    expect(recordDaily(true, -2999)).toBe(2);
    expect(currentStreak()).toBe(2);
  });

  it('state survives a reload (localStorage) and best is a high-water mark', () => {
    recordDaily(true, 200);
    recordDaily(true, 201);
    expect(currentStreak()).toBe(2);
    expect(bestStreak()).toBe(2);
    recordDaily(false, 202);
    expect(currentStreak()).toBe(0);
    expect(bestStreak()).toBe(2);
  });
});
