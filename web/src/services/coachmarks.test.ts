import { beforeEach, describe, expect, it } from 'vitest';
import {
  COACHMARK_STEPS,
  coachmarkActionForArrival,
  coachmarkComplete,
  coachmarkIsRunning,
  coachmarkPosition,
  coachmarkProblems,
  coachmarkReached,
  coachmarkShouldAutoStart,
  currentCoachmark,
  finishCoachmarks,
  renderedStep,
  reportCoachmark,
  resetCoachmarks,
  resumeIndex,
  seedCoachmarks,
  skipCoachmarks,
  startCoachmarks,
} from './coachmarks';
import { resetVinoForTests, setSuspended, isSuspendedOtherThan, currentVinoLine, presentVinoLine } from './vinoPresenter';
import { vinoLine } from './vinoDialogue';

/** Ported from the engine/sequence cases of `Coachmark.swift`'s coverage. */
describe('the walkthrough sequence', () => {
  it('the gate reports nothing wrong', () => {
    expect(coachmarkProblems()).toEqual([]);
  });

  it('six steps: menu, listing, tried, insight, passport, done', () => {
    expect(COACHMARK_STEPS.map(s => s.id)).toEqual(['menu', 'listing', 'tried', 'insight', 'passport', 'done']);
  });

  it('a resumed run lands on the last anchor at or before its high-water mark', () => {
    expect(resumeIndex(0)).toBe(0);
    expect(resumeIndex(2)).toBe(0); // quitting at the entry step loses two taps
    expect(resumeIndex(4)).toBe(4); // quitting at the passport step resumes exactly there
    expect(resumeIndex(5)).toBe(4);
    expect(resumeIndex(-3)).toBe(0);
    expect(resumeIndex(99)).toBe(4);
  });

  it('steps render with the name, fallback included', () => {
    expect(renderedStep(COACHMARK_STEPS[0]!, 'PAT')).toContain('Start here, PAT.');
    expect(renderedStep(COACHMARK_STEPS[0]!, null)).toContain('Start here, explorer.');
  });

  it('route arrivals map to the three route actions', () => {
    expect(coachmarkActionForArrival('/list/GRAPES')).toBe('openedCategory');
    expect(coachmarkActionForArrival('/list/STYLES')).toBe(null);
    expect(coachmarkActionForArrival('/detail/G001')).toBe('openedEntry');
    expect(coachmarkActionForArrival('/passport')).toBe('openedPassport');
    expect(coachmarkActionForArrival('/saved')).toBe('openedPassport');
    expect(coachmarkActionForArrival('/dex')).toBe(null);
  });
});

describe('the engine', () => {
  beforeEach(() => {
    localStorage.clear();
    resetCoachmarks();
  });

  it('advances only on the action a step is waiting for', () => {
    startCoachmarks();
    expect(coachmarkPosition()).toBe(1);
    reportCoachmark('markedTried'); // ignored, not skipped past
    expect(coachmarkPosition()).toBe(1);
    reportCoachmark('openedCategory');
    expect(coachmarkPosition()).toBe(2);
    reportCoachmark('openedEntry');
    reportCoachmark('markedTried');
    reportCoachmark('acknowledged'); // insight
    reportCoachmark('openedPassport');
    expect(currentCoachmark()?.id).toBe('done');
    reportCoachmark('acknowledged');
    expect(coachmarkIsRunning()).toBe(false);
    expect(coachmarkComplete()).toBe(true);
  });

  it('skipping keeps the high-water mark and does not complete', () => {
    startCoachmarks();
    reportCoachmark('openedCategory');
    reportCoachmark('openedEntry');
    expect(coachmarkReached()).toBe(2);
    skipCoachmarks();
    expect(coachmarkIsRunning()).toBe(false);
    expect(coachmarkComplete()).toBe(false);
    // Resuming lands on the anchor before the mark.
    startCoachmarks();
    expect(coachmarkPosition()).toBe(1);
  });

  it('a finished walkthrough restarts from the top', () => {
    startCoachmarks();
    finishCoachmarks();
    expect(coachmarkComplete()).toBe(true);
    startCoachmarks();
    expect(coachmarkPosition()).toBe(1);
  });

  it('seeding suppresses the auto-start for a player with history, monotonically', () => {
    expect(coachmarkShouldAutoStart()).toBe(true);
    seedCoachmarks(false); // a genuinely new install writes nothing at all
    expect(coachmarkShouldAutoStart()).toBe(true);
    seedCoachmarks(true);
    expect(coachmarkShouldAutoStart()).toBe(false);
    // Idempotent — running it every launch is free.
    seedCoachmarks(true);
    expect(coachmarkShouldAutoStart()).toBe(false);
  });

  it('starting counts as being offered', () => {
    startCoachmarks();
    skipCoachmarks();
    expect(coachmarkShouldAutoStart()).toBe(false);
  });
});

describe('the suspension seam', () => {
  beforeEach(() => resetVinoForTests());

  it('a suspended queue shows nothing but keeps the line', () => {
    presentVinoLine(vinoLine('firstPassport')!);
    expect(currentVinoLine()).toBeTruthy();
    setSuspended(true, 'coachmark');
    expect(currentVinoLine()).toBe(null);
    setSuspended(false, 'coachmark');
    expect(currentVinoLine()?.trigger).toBe('firstPassport');
  });

  it('the spotlight reads the same set from the other end', () => {
    setSuspended(true, 'coachmark');
    expect(isSuspendedOtherThan('coachmark')).toBe(false);
    setSuspended(true, 'ratingPrompt');
    expect(isSuspendedOtherThan('coachmark')).toBe(true);
    setSuspended(false, 'ratingPrompt');
    expect(isSuspendedOtherThan('coachmark')).toBe(false);
  });
});
