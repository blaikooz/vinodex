import { describe, expect, it } from 'vitest';
import {
  CHEERS_DWELL_SECONDS,
  IDLE_CHEERS_SECONDS,
  MARQUEE_CHEERS,
  MarqueeStage,
  cheersToast,
  cheersSteps,
  leftMainScreen,
  newScript,
  noteActivity,
  scriptText,
  scriptTextAfter,
  stageText,
  stageTimeout,
  timedOut,
} from './marqueeScript';
import { IDLE_SCREENSAVER_SECONDS } from './screensaver';

/** Ported from `vinodex-ios/Tests/VinodexCoreTests/MarqueeScriptTests.swift`. */
describe('marquee script', () => {
  const STAGES: MarqueeStage[] = ['welcome', 'menu', 'cheers'];

  it('every marquee string is ASCII, uppercase, and 14 characters or fewer', () => {
    const all = [...STAGES.map(stageText), ...MARQUEE_CHEERS];
    for (const text of all) {
      expect(text.length, `"${text}" too long`).toBeLessThanOrEqual(14);
      expect(text, `"${text}" not uppercase`).toBe(text.toUpperCase());
      expect(/^[\x20-\x7e]+$/.test(text), `"${text}" not ASCII`).toBe(true);
    }
  });

  it('the script opens on WELCOME!, beats to MENU, and idles to a toast', () => {
    let s = newScript();
    expect(scriptText(s)).toBe('WELCOME!');
    expect(stageTimeout('welcome')!.then).toBe('menu');
    s = timedOut(s).script;
    expect(s.stage).toBe('menu');
    expect(scriptText(s)).toBe('MENU');
    expect(stageTimeout('menu')).toEqual({ after: IDLE_CHEERS_SECONDS, then: 'cheers' });
    s = timedOut(s).script;
    expect(s.stage).toBe('cheers');
    expect(scriptText(s)).toBe('CHEERS!');
    // CHEERS! is a resting state nothing but an interaction leaves.
    expect(timedOut(s).moved).toBe(false);
  });

  it('the greeting shows once per launch — activity consumes it unread', () => {
    const s = newScript();
    const { script: after, moved } = noteActivity(s);
    expect(moved).toBe(true);
    expect(after.stage).toBe('menu');
    expect(after.greeted).toBe(true);
  });

  it('activity on a resting MENU reports unmoved — no re-dissolve per tap', () => {
    const s = { ...newScript(), stage: 'menu' as const, greeted: true };
    expect(noteActivity(s).moved).toBe(false);
  });

  it('the rotation advances on leaving CHEERS!, never on arriving', () => {
    let s = newScript();
    s = timedOut(s).script; // menu
    s = timedOut(s).script; // cheers
    expect(s.idleCount).toBe(0);
    expect(scriptText(s)).toBe('CHEERS!');
    s = noteActivity(s).script; // period over
    expect(s.idleCount).toBe(1);
    s = timedOut(s).script; // idle again
    expect(scriptText(s)).toBe('SANTE!');
    // Leaving the main screen ends the period too.
    s = leftMainScreen(s);
    expect(s.idleCount).toBe(2);
  });

  it('a long idle walks the languages within one period (0.8.1, I2)', () => {
    let s = newScript();
    s = timedOut(s).script;
    s = timedOut(s).script; // cheers, idleCount 0
    expect(scriptTextAfter(s, 0)).toBe('CHEERS!');
    expect(scriptTextAfter(s, CHEERS_DWELL_SECONDS)).toBe('SANTE!');
    expect(scriptTextAfter(s, CHEERS_DWELL_SECONDS * 3)).toBe('CIN CIN!');
    // idleCount still sets where the period starts.
    const later = { ...s, idleCount: 1 };
    expect(scriptTextAfter(later, 0)).toBe('SANTE!');
    // Off .cheers the text does not rotate — MENU is a statement, not a toast.
    const menu = { ...s, stage: 'menu' as const };
    expect(scriptTextAfter(menu, 500)).toBe('MENU');
  });

  it('the toast index wraps forever and floors at zero', () => {
    expect(cheersToast(MARQUEE_CHEERS.length)).toBe('CHEERS!');
    expect(cheersToast(-3)).toBe('CHEERS!');
    expect(cheersSteps(-5)).toBe(0);
    expect(cheersSteps(CHEERS_DWELL_SECONDS * 2.5)).toBe(2);
  });

  it('the greeting is due on the one shared idle threshold — the A4 fold', () => {
    expect(IDLE_CHEERS_SECONDS).toBe(IDLE_SCREENSAVER_SECONDS);
  });
});
