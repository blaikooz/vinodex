import {
  VinoExpression,
  VINO_NAME_PLACEHOLDER,
  firstNonASCII,
  retiredTermProblems,
  substituteVinoName,
} from './vinoDialogue';

/**
 * The guided spotlight walkthrough — ported from
 * `vinodex-ios/Sources/VinodexCore/Coachmark.swift` (0.8.9d, G1/G2) — v6#23.
 *
 * A coachmark is mostly a hole cut in a grey rectangle; what can be *wrong*
 * is whether the right action advances the right step, whether skipping
 * loses your place, whether an existing player is ambushed on the launch
 * after updating, and where a resumed run lands. Those all live here where a
 * test can see them; the overlay draws `current`, calls `report`, and
 * decides nothing.
 *
 * Storage keys are the iOS raw values (`coachmarkReached`,
 * `coachmarkOffered`, `coachmarkCompleted`).
 */

/**
 * What a step can put the spotlight on — a closed vocabulary rather than a
 * view identity. On the web the two ends agree via `data-coachmark`
 * attributes; a missing anchor is a legal state (the card still names the
 * control), not a failure.
 */
export type CoachmarkTarget = 'menuTile' | 'listingRow' | 'triedControl' | 'insightPanel' | 'passportButton';

export type CoachmarkAction = 'openedCategory' | 'openedEntry' | 'markedTried' | 'openedPassport' | 'acknowledged';

export interface CoachmarkStep {
  id: string;
  /** What the spotlight cuts out, or null for a step with nothing to point at. */
  target: CoachmarkTarget | null;
  advancesOn: CoachmarkAction;
  line: string;
  expression: VinoExpression;
  /**
   * Whether the sequence can be *restarted* here — an anchor's target is
   * reachable from the main menu without having navigated anywhere first.
   * Quitting at the entry step resumes at the menu step (two taps lost);
   * quitting at the passport step resumes exactly there.
   */
  isAnchor: boolean;
}

/** §G2's sequence, verbatim from `CoachmarkWalkthrough.steps`. */
export const COACHMARK_STEPS: CoachmarkStep[] = [
  {
    id: 'menu',
    target: 'menuTile',
    advancesOn: 'openedCategory',
    line: 'Start here, {name}. Four shelves; press GRAPES and we will go and find you a wine.',
    expression: 'smiling',
    isAnchor: true,
  },
  {
    id: 'listing',
    target: 'listingRow',
    advancesOn: 'openedEntry',
    line: 'Every grape I hold, {name}. Open one you have drunk, or one you like the look of.',
    expression: 'neutral',
    isAnchor: false,
  },
  {
    id: 'tried',
    target: 'triedControl',
    advancesOn: 'markedTried',
    line: 'This is the one that matters. Press TRIED, {name}, and I start paying attention.',
    expression: 'thinking',
    isAnchor: false,
  },
  {
    id: 'insight',
    target: 'insightPanel',
    advancesOn: 'acknowledged',
    line: 'There, {name}. INSIGHT reads your shelf back to you, and it deepens with every tasting.',
    expression: 'goodjob',
    isAnchor: false,
  },
  {
    id: 'passport',
    target: 'passportButton',
    advancesOn: 'openedPassport',
    line: 'Last one, {name}. Your Passport counts every tasting and hands out stamps for them.',
    expression: 'raiseaglass',
    // The chassis user button is on every screen, so a run resumed here has
    // its target under the spotlight immediately.
    isAnchor: true,
  },
  {
    id: 'done',
    target: null,
    advancesOn: 'acknowledged',
    line: 'That is the whole loop, {name}. Next bottle, hand me the label and I will read it.',
    expression: 'raiseaglass',
    isAnchor: false,
  },
];

export const renderedStep = (step: CoachmarkStep, name: string | null | undefined): string =>
  substituteVinoName(step.line, name);

/** The action a route arrival means, if any — iOS `CoachmarkAction.action(for:)`. */
export const coachmarkActionForArrival = (path: string): CoachmarkAction | null => {
  if (path === '/list/GRAPES') return 'openedCategory';
  if (path.startsWith('/detail/')) return 'openedEntry';
  if (path === '/passport') return 'openedPassport';
  return null;
};

/** Where a resumed run picks up: the last anchor at or before `reached`. */
export const resumeIndex = (reached: number): number => {
  const clamped = Math.min(Math.max(reached, 0), COACHMARK_STEPS.length - 1);
  for (let i = clamped; i >= 0; i--) {
    if (COACHMARK_STEPS[i]!.isAnchor) return i;
  }
  return 0;
};

/**
 * Everything wrong with the sequence, or empty — the copy rules are
 * `vinoDialogueProblems`'s, applied rather than inherited by accident, with
 * two named relaxations: no gag budget (a tutorial is not where the
 * character spends jokes) and at-most-one `{name}` (a step may be a pure
 * instruction). The sentence-initial ban is kept in full.
 */
export const coachmarkProblems = (): string[] => {
  const problems: string[] = [];
  const seen = new Set<string>();
  for (const step of COACHMARK_STEPS) {
    const where = `CoachmarkWalkthrough.${step.id}`;
    if (seen.has(step.id)) problems.push(`${where}: duplicate id`);
    seen.add(step.id);

    const bad = firstNonASCII(step.line);
    if (bad) problems.push(`${where}: line is not printable ASCII - found ${bad}`);
    const words = step.line.split(/\s+/).filter(w => w.length > 0).length;
    if (words > 20) problems.push(`${where}: ${words} words; the bubble takes 20`);
    const occurrences = step.line.split(VINO_NAME_PLACEHOLDER).length - 1;
    if (occurrences > 1) problems.push(`${where}: uses ${VINO_NAME_PLACEHOLDER} ${occurrences} times; at most one`);
    if (step.line.startsWith(VINO_NAME_PLACEHOLDER)) problems.push(`${where}: starts with ${VINO_NAME_PLACEHOLDER}`);
    problems.push(...retiredTermProblems(step.line, where));
  }
  const last = COACHMARK_STEPS[COACHMARK_STEPS.length - 1];
  if (last && last.advancesOn !== 'acknowledged') {
    problems.push(`the last step advances on ${last.advancesOn}; it can only be acknowledged`);
  }
  const first = COACHMARK_STEPS[0];
  if (first && !first.isAnchor) {
    problems.push('the first step is not an anchor, so a resumed run has nowhere to land');
  }
  return problems;
};

// ---------------------------------------------------------------------------
// The engine
// ---------------------------------------------------------------------------

export const COACHMARK_REACHED_KEY = 'coachmarkReached';
export const COACHMARK_OFFERED_KEY = 'coachmarkOffered';
export const COACHMARK_COMPLETED_KEY = 'coachmarkCompleted';

const ls = (): Storage | null => (typeof window === 'undefined' ? null : window.localStorage);

/** The step on screen, or null when the walkthrough is not running. Session
 *  state — only the three flags persist, exactly as on iOS. */
let index: number | null = null;

const subscribers = new Set<() => void>();
const notify = () => subscribers.forEach(fn => fn());
export const subscribeToCoachmarks = (fn: () => void): (() => void) => {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
};

const readInt = (key: string): number => {
  try {
    const n = Number(ls()?.getItem(key) ?? '0');
    return Number.isFinite(n) && n > 0 ? Math.trunc(n) : 0;
  } catch {
    return 0;
  }
};

const readFlag = (key: string): boolean => {
  try {
    return ls()?.getItem(key) === 'true';
  } catch {
    return false;
  }
};

export const coachmarkReached = (): number => readInt(COACHMARK_REACHED_KEY);
export const coachmarkOffered = (): boolean => readFlag(COACHMARK_OFFERED_KEY);
export const coachmarkComplete = (): boolean => readFlag(COACHMARK_COMPLETED_KEY);

export const coachmarkIsRunning = (): boolean => index !== null;

export const currentCoachmark = (): CoachmarkStep | null =>
  index !== null && index >= 0 && index < COACHMARK_STEPS.length ? COACHMARK_STEPS[index]! : null;

/** 1-based position for the progress readout, or null when idle. */
export const coachmarkPosition = (): number | null => (index === null ? null : index + 1);

/** Whether a fresh arrival should run this unasked — gated on never having
 *  been offered *and* on `seedCoachmarks` having had its say first. */
export const coachmarkShouldAutoStart = (): boolean => !coachmarkOffered();

const persist = (reached?: number): void => {
  try {
    if (reached !== undefined) ls()?.setItem(COACHMARK_REACHED_KEY, String(reached));
    ls()?.setItem(COACHMARK_OFFERED_KEY, 'true');
  } catch {
    /* ignore */
  }
};

/**
 * Suppress the auto-start for somebody who is plainly not a new player — the
 * first-run trap with a bigger blast radius, because what would fire is a
 * six-step spotlight taking over the screen. Idempotent and monotonic: it
 * only ever sets a flag, and only when the answer is yes, so a new player's
 * seed is genuinely a no-op rather than a recorded empty one (no seeded flag,
 * deliberately — the contrast with the trigger store is the point).
 */
export const seedCoachmarks = (hasHistory: boolean): void => {
  if (!hasHistory || coachmarkOffered()) return;
  persist();
  notify();
};

/** Begin, or pick up where a skipped run left off. A finished walkthrough
 *  restarts from the top — somebody who asks for it again wants the whole
 *  thing, not its last step. */
export const startCoachmarks = (): void => {
  index = coachmarkComplete() ? 0 : resumeIndex(coachmarkReached());
  persist();
  notify();
};

/** The player did something. Advances only if it is what this step was
 *  waiting for; anything else is ignored rather than skipped past. */
export const reportCoachmark = (action: CoachmarkAction): void => {
  const step = currentCoachmark();
  if (index === null || !step || step.advancesOn !== action) return;
  const next = index + 1;
  if (next >= COACHMARK_STEPS.length) {
    finishCoachmarks();
    return;
  }
  index = next;
  persist(Math.max(coachmarkReached(), next));
  notify();
};

/** Put it down. Keeps the high-water mark and does **not** complete — which
 *  is what makes "skippable" and "resumable" the same feature. */
export const skipCoachmarks = (): void => {
  index = null;
  persist();
  notify();
};

export const finishCoachmarks = (): void => {
  index = null;
  try {
    ls()?.setItem(COACHMARK_COMPLETED_KEY, 'true');
  } catch {
    /* ignore */
  }
  persist(COACHMARK_STEPS.length - 1);
  notify();
};

/** Back to a fresh install — a wipe that left this standing would open a
 *  fresh start with the walkthrough already spent. */
export const resetCoachmarks = (): void => {
  index = null;
  try {
    const storage = ls();
    storage?.removeItem(COACHMARK_REACHED_KEY);
    storage?.removeItem(COACHMARK_OFFERED_KEY);
    storage?.removeItem(COACHMARK_COMPLETED_KEY);
  } catch {
    /* ignore */
  }
  notify();
};
