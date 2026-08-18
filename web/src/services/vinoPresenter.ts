import { WineEntry } from '@/shared/types';
import { FirstTimeTrigger, VinoLine } from './vinoDialogue';
import { fireOnce, triggersForArrival } from './firstTimeTriggers';

/**
 * Professor Vino's bubble queue — ported from the `VinoPresenter` half of
 * `vinodex-ios/Sources/VinodexCore/FirstTimeTriggers.swift` (0.8.9c, D1) —
 * v6#26.
 *
 * One arrival really can owe two lines (the Godforsaken-grape-as-first-grape
 * case), so lines queue, dedupe per trigger, and show one at a time.
 *
 * **`suspensions` is the modal collision, solved.** While anything owns the
 * screen — a first-run card, the stamp celebration, the rating prompt, the
 * coachmark spotlight — the presenter holds its queue and shows nothing; the
 * line is not dropped and not re-fired, it waits and lands as the modal
 * leaves. A set of reasons rather than a boolean, because there is more than
 * one host and two writers to one boolean is a race. The coachmark spotlight
 * both writes the set (Vino cannot remark over his own tutorial) and reads
 * it from the other end (`isSuspendedOtherThan`) so its own barrier stands
 * down for prompts raised inside the screen it covers.
 *
 * On merge, the pending bundle's `VinodexBoot` host should claim
 * `setSuspended(true, 'boot')` while it runs — recorded in the ledger.
 */

let queue: VinoLine[] = [];
const suspensions = new Set<string>();

const subscribers = new Set<() => void>();
const notify = () => subscribers.forEach(fn => fn());
export const subscribeToVino = (fn: () => void): (() => void) => {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
};

export const isSuspended = (): boolean => suspensions.size > 0;

/** "Is anybody talking apart from me" — the same set read from the other end. */
export const isSuspendedOtherThan = (reason: string): boolean =>
  [...suspensions].some(r => r !== reason);

/** Declare (or withdraw) one host's claim. Idempotent, callable per render. */
export const setSuspended = (suspended: boolean, reason: string): void => {
  const had = suspensions.has(reason);
  if (suspended === had) return;
  if (suspended) suspensions.add(reason);
  else suspensions.delete(reason);
  notify();
};

/** The bubble to draw, or null. */
export const currentVinoLine = (): VinoLine | null => (isSuspended() ? null : queue[0] ?? null);

/** Whether anything is waiting, regardless of suspension — "nothing to say"
 *  vs "not now". */
export const vinoQueueIsEmpty = (): boolean => queue.length === 0;

/** Enqueue. Idempotent per trigger — a bubble shown twice is the failure
 *  this whole module is named after. */
export const presentVinoLine = (line: VinoLine): void => {
  if (queue.some(l => l.trigger === line.trigger)) return;
  queue = [...queue, line];
  notify();
};

/** Fire and enqueue in one call — the shape the instrumentation sites use. */
export const fireVino = (trigger: FirstTimeTrigger): void => {
  const line = fireOnce(trigger);
  if (line) presentVinoLine(line);
};

/** Every line a route arrival owes, in order. */
export const fireVinoForArrival = (path: string, entry?: WineEntry | null): void => {
  for (const trigger of triggersForArrival(path, entry)) fireVino(trigger);
};

/** Tap to dismiss. Advances to the next waiting line, if any. */
export const dismissVino = (): void => {
  if (queue.length === 0) return;
  queue = queue.slice(1);
  notify();
};

/** Drop everything waiting — what a host calls when the player navigates
 *  away from the screen a line was about. */
export const clearVino = (): void => {
  if (queue.length === 0) return;
  queue = [];
  notify();
};

/** Test hook. */
export const resetVinoForTests = (): void => {
  queue = [];
  suspensions.clear();
};
