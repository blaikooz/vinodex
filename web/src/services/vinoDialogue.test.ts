import { beforeEach, describe, expect, it } from 'vitest';
import {
  FIRST_TIME_TRIGGERS,
  GAG_BUDGET_DIVISOR,
  VINO_LINES,
  VINO_NAME_FALLBACK,
  VINO_NAME_MAX_LENGTH,
  cleanVinoName,
  containsRetiredTerm,
  renderedLine,
  resolvedVinoName,
  substituteVinoName,
  vinoDialogueProblems,
  vinoLine,
} from './vinoDialogue';
import {
  fireOnce,
  hasFired,
  isVinoSilenced,
  resetTriggers,
  seedTriggers,
  seenTriggers,
  setVinoSilenced,
  triggersForArrival,
  TRIGGERS_SEEN_KEY,
} from './firstTimeTriggers';
import { getAllEntries } from './wineData';
import { isGrapeEntry } from '@/shared/types';

/**
 * Ported from `vinodex-ios/Tests/VinodexCoreTests/VinoDialogueTests.swift`
 * and the store cases of the FirstTimeTriggers coverage. The web bank
 * carries two extra deferrals (`firstScan` → v6#27, `firstInsight` → the
 * v6#21 tail) whose call sites do not exist here yet; the deferred-lines-
 * are-checked-like-live-ones rule covers them.
 */

describe('the dialogue bank', () => {
  it('the gate reports nothing wrong', () => {
    expect(vinoDialogueProblems()).toEqual([]);
  });

  it('seventeen triggers, seventeen lines, both ways', () => {
    expect(FIRST_TIME_TRIGGERS.length).toBe(17);
    expect(VINO_LINES.length).toBe(17);
    for (const trigger of FIRST_TIME_TRIGGERS) expect(vinoLine(trigger), trigger).toBeTruthy();
  });

  it('the gag budget holds at one in four', () => {
    const gags = VINO_LINES.filter(l => l.gag).length;
    expect(gags * GAG_BUDGET_DIVISOR).toBeLessThanOrEqual(VINO_LINES.length);
    expect(gags).toBe(4);
  });

  it('the ask is the one line with no name, and none opens with the placeholder', () => {
    for (const line of VINO_LINES) {
      const uses = line.line.includes('{name}');
      if (line.trigger === 'firstLaunch') expect(uses).toBe(false);
      else expect(uses, line.trigger).toBe(true);
      expect(line.line.startsWith('{name}')).toBe(false);
    }
  });

  it('the name substitutes cleanly, falls back lowercase, and caps at 14', () => {
    const line = vinoLine('firstLaunchNamed')!;
    expect(renderedLine(line, 'PAT')).toContain('Pleasure, PAT.');
    expect(renderedLine(line, '   ')).toContain(`Pleasure, ${VINO_NAME_FALLBACK}.`);
    expect(cleanVinoName('A'.repeat(40))!.length).toBe(VINO_NAME_MAX_LENGTH);
    expect(resolvedVinoName(null)).toBe(VINO_NAME_FALLBACK);
    expect(substituteVinoName('Hi, {name}.', undefined)).toBe('Hi, explorer.');
  });

  it('retired terms match on word boundaries only', () => {
    expect(containsRetiredTerm('ACCESS', 'the ACCESS panel')).toBe(true);
    expect(containsRetiredTerm('ACCESS', 'an accessible ramp')).toBe(false);
    expect(containsRetiredTerm('paper', 'the paperwork')).toBe(false);
    expect(containsRetiredTerm('TASTING QUIZ', 'the tasting quiz opens')).toBe(true);
  });
});

describe('the trigger store', () => {
  beforeEach(() => {
    localStorage.clear();
    resetTriggers();
  });

  it('a line fires once, marked on the way out', () => {
    expect(fireOnce('firstGrapeViewed')).toBeTruthy();
    expect(fireOnce('firstGrapeViewed')).toBe(null);
    expect(hasFired('firstGrapeViewed')).toBe(true);
  });

  it('a deferred line returns null without consuming the key', () => {
    expect(fireOnce('firstFlavorViewed')).toBe(null);
    expect(hasFired('firstFlavorViewed')).toBe(false);
    expect(fireOnce('firstScan')).toBe(null);
    expect(fireOnce('firstInsight')).toBe(null);
  });

  it('silence is a filter, not a consumption — a mute, not a wipe', () => {
    setVinoSilenced(true);
    expect(isVinoSilenced()).toBe(true);
    expect(fireOnce('firstPassport')).toBe(null);
    expect(hasFired('firstPassport')).toBe(false);
    setVinoSilenced(false);
    expect(fireOnce('firstPassport')).toBeTruthy();
  });

  it('unknown stored keys are dropped on read', () => {
    localStorage.setItem(TRIGGERS_SEEN_KEY, 'firstGrapeViewed,retiredTrigger,');
    const seen = seenTriggers();
    expect(seen.has('firstGrapeViewed')).toBe(true);
    expect(seen.size).toBe(1);
  });

  it('only the three history-derived triggers seed, and only once', () => {
    seedTriggers(3, true);
    expect(hasFired('firstTried')).toBe(true);
    expect(hasFired('firstInsight')).toBe(true);
    expect(hasFired('firstStamp')).toBe(true);
    expect(hasFired('firstGrapeViewed')).toBe(false);
    // A second seed with different answers is a no-op — once ever.
    resetTriggers();
    localStorage.setItem('firstTimeTriggersSeeded', 'true');
    seedTriggers(5, true);
    expect(hasFired('firstTried')).toBe(false);
  });

  it('a new install seeds to empty and gets every line', () => {
    seedTriggers(0, false);
    expect(seenTriggers().size).toBe(0);
    expect(fireOnce('firstTried')).toBeTruthy();
  });

  it('a Godforsaken grape as your first grape owes two lines, category first', () => {
    const all = getAllEntries();
    const godforsaken = all.find(e => isGrapeEntry(e) && e.rarity === 'GODFORSAKEN')!;
    expect(triggersForArrival(`/detail/${godforsaken.id}`, godforsaken)).toEqual([
      'firstGrapeViewed',
      'firstGodforsaken',
    ]);
  });

  it('the route arms name the concepts, whatever the routes are called', () => {
    expect(triggersForArrival('/scanner')).toEqual(['firstBlindTasting']);
    expect(triggersForArrival('/quiz')).toEqual(['firstWineExam']);
    expect(triggersForArrival('/daily-challenge')).toEqual(['firstDailyChallenge']);
    expect(triggersForArrival('/passport')).toEqual(['firstPassport']);
    expect(triggersForArrival('/settings/CUSTOMIZE')).toEqual(['firstCustomize']);
    expect(triggersForArrival('/settings/ACCESS')).toEqual(['firstShop']);
    expect(triggersForArrival('/moon-dial')).toEqual([]);
  });
});
