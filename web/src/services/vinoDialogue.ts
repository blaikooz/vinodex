/**
 * Professor Vino's voice — the lines, and the rules that keep him in
 * character. Ported from `vinodex-ios/Sources/VinodexCore/VinoDialogue.swift`
 * (0.8.9c) — v6#26 (dialogue half; the six drawn portraits ride the v6#2
 * ruling and render as chrome glyphs meanwhile).
 *
 * The copy is sommbot's reviewed set, byte-for-byte from the Swift bank.
 * **One web-side deferral on top of iOS's one** (`firstFlavorViewed`,
 * authored): `firstScan` waits for the label reader (v6#27) — its call site
 * does not exist here yet, and iOS's own rule is that a deferred line ships
 * with its key reserved, is checked like a live one, and turning it on is
 * deleting one string. (`firstInsight` was deferred the same way until the
 * v6#21 tail closed and `InsightSection` became its event site.)
 *
 * ASCII throughout: the bubble draws in the retro faces with partial Latin-1
 * coverage, and a curly apostrophe renders as a blank box.
 */

export type VinoExpression = 'neutral' | 'smiling' | 'goodjob' | 'raiseaglass' | 'surprised' | 'thinking';

export const VINO_EXPRESSIONS: VinoExpression[] = ['neutral', 'smiling', 'goodjob', 'raiseaglass', 'surprised', 'thinking'];

/** The boot chirp — its own field so the sentence never has to carry
 *  punctuation the font cannot draw. */
export type VinoChirp = 'boop' | 'whirr' | 'bzzt';

export const chirpText = (chirp: VinoChirp): string => {
  switch (chirp) {
    case 'boop':
      return 'BOOP.';
    case 'whirr':
      return '*whirr-BEEP!*';
    case 'bzzt':
      return 'bzzt-online.';
  }
};

// ---------------------------------------------------------------------------
// The name
// ---------------------------------------------------------------------------

/**
 * The player's name, and the substitution contract around it. The fallback is
 * `explorer`, lowercase, and that is load-bearing: `firstLaunch` asks "What
 * do I call you, explorer?", which establishes the word as his term of
 * address — a skipped name reads as deliberate. Every `{name}` in the set
 * sits in vocative position after a comma or colon, never sentence-initial,
 * and `problems()` fails the gate on any line that breaks that.
 *
 * The persisted key is the one the app already had — `userDisplayName`
 * (`profile.ts`) — because two names for one person is a drift surface, and
 * minting `vinoPlayerName` beside it would make him ask a player who already
 * answered.
 */
export const VINO_NAME_PLACEHOLDER = '{name}';
export const VINO_NAME_FALLBACK = 'explorer';
export const VINO_NAME_MAX_LENGTH = 14;

/** A stored name reduced to something the LCD can draw, or null. Trim first,
 *  then treat empty as skipped — whitespace-only must land on the fallback
 *  rather than render "Pleasure, .". */
export const cleanVinoName = (raw: string | null | undefined): string | null => {
  if (raw === null || raw === undefined) return null;
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;
  return trimmed.slice(0, VINO_NAME_MAX_LENGTH);
};

export const resolvedVinoName = (raw: string | null | undefined): string =>
  cleanVinoName(raw) ?? VINO_NAME_FALLBACK;

export const substituteVinoName = (line: string, name: string | null | undefined): string =>
  line.split(VINO_NAME_PLACEHOLDER).join(resolvedVinoName(name));

// ---------------------------------------------------------------------------
// Retired labels — terminology drift as a gate, not a review finding
// ---------------------------------------------------------------------------

/**
 * Player-facing words that used to be right and are not now. Matched on word
 * boundaries, case-insensitively — `ACCESS` must not fire on "accessible".
 * Stored raw values are a separate matter: `ACCESS` keeps spelling itself on
 * disk forever; what this forbids is a *sentence* using the word.
 */
export const RETIRED_TERMS: Array<{ term: string; replacement: string }> = [
  { term: 'ACCESS', replacement: 'SHOP' },
  { term: 'paper', replacement: 'exam' },
  { term: 'SCANNER', replacement: 'BLIND TASTING' },
  { term: 'IDENTIFY', replacement: 'BLIND TASTING' },
  { term: 'TASTING QUIZ', replacement: 'WINE EXAM' },
  { term: 'FILTER SEARCH', replacement: 'MASTER SEARCH' },
  { term: 'MINIGAMES', replacement: 'TOOLS' },
  { term: 'SAVED', replacement: 'USER' },
  { term: 'cartridge', replacement: 'pack' },
  { term: 'cartridges', replacement: 'packs' },
  { term: 'Label Scanner', replacement: 'LABEL SCAN' },
];

const isWordChar = (c: string): boolean => /[a-z0-9]/i.test(c);

/** Word-boundary, case-insensitive containment. */
export const containsRetiredTerm = (term: string, text: string): boolean => {
  const haystack = text.toLowerCase();
  const needle = term.toLowerCase();
  if (needle.length === 0 || haystack.length < needle.length) return false;
  for (let start = 0; start + needle.length <= haystack.length; start++) {
    if (haystack.slice(start, start + needle.length) !== needle) continue;
    const before = start > 0 ? haystack[start - 1]! : ' ';
    const afterIndex = start + needle.length;
    const after = afterIndex < haystack.length ? haystack[afterIndex]! : ' ';
    const leftOK = !(isWordChar(before) && isWordChar(needle[0]!));
    const rightOK = !(isWordChar(after) && isWordChar(needle[needle.length - 1]!));
    if (leftOK && rightOK) return true;
  }
  return false;
};

export const retiredTermProblems = (text: string, context: string): string[] =>
  RETIRED_TERMS.filter(entry => containsRetiredTerm(entry.term, text)).map(
    entry => `${context}: uses retired term "${entry.term}" (now ${entry.replacement}) - ${text}`,
  );

// ---------------------------------------------------------------------------
// The lines
// ---------------------------------------------------------------------------

export type FirstTimeTrigger =
  | 'firstLaunch'
  | 'firstLaunchNamed'
  | 'firstGrapeViewed'
  | 'firstRegionViewed'
  | 'firstStyleViewed'
  | 'firstFlavorViewed'
  | 'firstScan'
  | 'firstTried'
  | 'firstInsight'
  | 'firstGodforsaken'
  | 'firstDailyChallenge'
  | 'firstWineExam'
  | 'firstBlindTasting'
  | 'firstStamp'
  | 'firstCustomize'
  | 'firstShop'
  | 'firstPassport';

/** Raw values are storage — once shipped, never renamed. Named after the
 *  concept, never the current screen label, because the label has moved
 *  twice already (ACCESS→SHOP, the written exam). */
export const FIRST_TIME_TRIGGERS: FirstTimeTrigger[] = [
  'firstLaunch', 'firstLaunchNamed',
  'firstGrapeViewed', 'firstRegionViewed', 'firstStyleViewed', 'firstFlavorViewed',
  'firstScan', 'firstTried', 'firstInsight', 'firstGodforsaken',
  'firstDailyChallenge', 'firstWineExam', 'firstBlindTasting',
  'firstStamp', 'firstCustomize', 'firstShop', 'firstPassport',
];

export interface VinoLine {
  trigger: FirstTimeTrigger;
  /** <= 20 words, printable ASCII, exactly one `{name}` (the ask has none),
   *  never sentence-initial. */
  line: string;
  expression: VinoExpression;
  chirp?: VinoChirp;
  /** Carries the can't-drink/no-body gag — the field is what makes the
   *  bible's 1-in-4 cap enforceable. */
  gag?: boolean;
  /** Non-null names what the line is waiting for; `fireOnce` suppresses it
   *  without consuming the key. */
  deferredUntil?: string;
}

export const VINO_LINES: VinoLine[] = [
  // --- The two launch bubbles: the ask and the after-name.
  {
    trigger: 'firstLaunch',
    // The one bubble with no {name}, because it is the one asking for it.
    line: 'Professor Vino online - vintage intelligence, no taste buds. What do I call you, explorer?',
    expression: 'neutral',
    chirp: 'boop',
    // Gag 1 of 4. The character premise: without it he is a database.
    gag: true,
  },
  {
    trigger: 'firstLaunchNamed',
    // Fires on submit **or** on skip, with the fallback substituted: this
    // line carries the division of labour every later line assumes.
    line: 'Pleasure, {name}. You taste the world; I catalogue it. Together we fill the Vinodex.',
    expression: 'smiling',
  },

  // --- The four catalog categories.
  {
    trigger: 'firstGrapeViewed',
    line: 'A grape entry, {name}. Origin, body, tannin, lineage - the whole file. Mark it TRIED when you have.',
    expression: 'neutral',
  },
  {
    trigger: 'firstRegionViewed',
    line: 'A region, {name}: soil, climate, and law. Three things that decide what the grapes taste like.',
    expression: 'thinking',
  },
  {
    trigger: 'firstStyleViewed',
    line: 'A style, {name}. Not a grape and not a place - a way of making the wine.',
    expression: 'thinking',
  },
  {
    trigger: 'firstFlavorViewed',
    line: 'A tasting note, {name}. Every grape that shows it is one tap away. Learn the word first.',
    expression: 'thinking',
    // Authored on iOS: flavour INFO text is template-generated, so a line
    // saying "learn the word" writes a cheque Batch C has to cash.
    deferredUntil: 'flavour rework Batch C - flavour INFO text is not authored yet',
  },

  // --- The discovery loop.
  {
    trigger: 'firstScan',
    line: 'Feed me a label, {name}. I read wine beautifully. Drinking it remains outside my specification.',
    expression: 'neutral',
    // Gag 2 of 4 — the scanner is how he lives through the player.
    gag: true,
    // Web-side deferral: the label reader is v6#27, behind ruling v6#4.
    deferredUntil: 'the label reader (v6#27) - its call site does not exist here yet',
  },
  {
    trigger: 'firstTried',
    line: 'Marked TRIED, {name}. It joins your Passport tastings. Bring me another when you find one.',
    expression: 'goodjob',
  },
  {
    trigger: 'firstInsight',
    // INSIGHT in the shipped panel's own casing. Live since the v6#21 tail
    // closed — the panel exists and `InsightSection` is the event site.
    line: 'INSIGHT unlocked, {name}. The more you mark TRIED, the more of this I can show you.',
    expression: 'goodjob',
  },
  {
    trigger: 'firstGodforsaken',
    // GODFORSAKEN is a rarity band, not a single site — this is true of
    // every member.
    line: 'GODFORSAKEN, {name}. Almost nobody grows this one. I am almost emotional.',
    expression: 'surprised',
    chirp: 'whirr',
  },

  // --- The three tools that collide with a first-run card: the voice half
  // only, with the explaining left to the card that arrives first.
  {
    trigger: 'firstDailyChallenge',
    line: 'The Daily Challenge, {name}: five questions, the same for everybody, once a day.',
    expression: 'neutral',
  },
  {
    trigger: 'firstWineExam',
    line: 'Exam time, {name}. I ask, you answer. Fair warning: I grade like a French appellation board.',
    expression: 'neutral',
  },
  {
    trigger: 'firstBlindTasting',
    line: 'Blind Tasting, {name}: no label, just your palate. If I had a nose I would help.',
    expression: 'thinking',
    // Gag 3 of 4 — the only topically load-bearing one: blind tasting is
    // nose-work.
    gag: true,
  },

  // --- Milestones and chrome.
  {
    trigger: 'firstStamp',
    line: 'Stamp earned, {name}. It sticks to your Passport. Collect them all; I am absolutely not counting.',
    expression: 'goodjob',
  },
  {
    trigger: 'firstCustomize',
    line: "Customize away - new shell, new lights. Same genius inside. You're welcome, {name}.",
    expression: 'smiling',
  },
  {
    trigger: 'firstShop',
    line: 'The SHOP, {name}. Packs of grapes and regions you have not met. I recommend all of them.',
    expression: 'smiling',
  },
  {
    trigger: 'firstPassport',
    // Gag 4 of 4 — the envy variant, saved for a milestone screen.
    line: 'Your Passport, {name}: tastings, stamps, rank. Proof you went outside. I stayed here. Enviously.',
    expression: 'raiseaglass',
    gag: true,
  },
];

export const vinoLine = (trigger: FirstTimeTrigger): VinoLine | null =>
  VINO_LINES.find(l => l.trigger === trigger) ?? null;

export const renderedLine = (line: VinoLine, name: string | null | undefined): string =>
  substituteVinoName(line.line, name);

export const lineWordCount = (line: VinoLine): number =>
  line.line.split(/\s+/).filter(w => w.length > 0).length;

/** The bible's cap: a gag line for every four lines shipped. */
export const GAG_BUDGET_DIVISOR = 4;
export const MAX_WORDS = 20;

/** The first character outside printable ASCII, described. */
export const firstNonASCII = (text: string): string | null => {
  for (const ch of text) {
    const code = ch.codePointAt(0)!;
    if (code < 0x20 || code > 0x7e) {
      return `U+${code.toString(16).toUpperCase().padStart(4, '0')} (${ch})`;
    }
  }
  return null;
};

/**
 * Everything wrong with the copy, or an empty array — one function rather
 * than eight test methods, so the rules and the data are readable together.
 * Deferred lines are checked exactly like live ones: a line that will ship
 * one day should not be allowed to rot, which is the only thing that makes
 * deferral cheaper than deletion.
 */
export const vinoDialogueProblems = (): string[] => {
  const problems: string[] = [];

  const triggered = new Set(VINO_LINES.map(l => l.trigger));
  for (const trigger of FIRST_TIME_TRIGGERS) {
    if (!triggered.has(trigger)) problems.push(`FirstTimeTrigger.${trigger} has no line`);
  }
  if (triggered.size !== VINO_LINES.length) problems.push('two lines share a trigger');

  for (const entry of VINO_LINES) {
    const where = `VinoDialogue.${entry.trigger}`;

    const badLine = firstNonASCII(entry.line);
    if (badLine) problems.push(`${where}: line is not printable ASCII - found ${badLine}`);
    if (entry.chirp) {
      const badChirp = firstNonASCII(chirpText(entry.chirp));
      if (badChirp) problems.push(`${where}: chirp is not printable ASCII - found ${badChirp}`);
    }

    if (entry.line.trim().length === 0) problems.push(`${where}: line is empty`);
    if (lineWordCount(entry) > MAX_WORDS) {
      problems.push(`${where}: ${lineWordCount(entry)} words; the bubble takes ${MAX_WORDS}`);
    }

    // The name contract. The ask is the one named exemption — inferring it
    // from "has no placeholder" would let any future line drop the name
    // silently.
    const occurrences = entry.line.split(VINO_NAME_PLACEHOLDER).length - 1;
    if (entry.trigger === 'firstLaunch') {
      if (occurrences !== 0) problems.push(`${where}: the ask cannot use ${VINO_NAME_PLACEHOLDER} - it is what asks for it`);
    } else if (occurrences !== 1) {
      problems.push(`${where}: uses ${VINO_NAME_PLACEHOLDER} ${occurrences} times; every line but the ask uses it exactly once`);
    }

    if (entry.line.startsWith(VINO_NAME_PLACEHOLDER)) {
      problems.push(`${where}: starts with ${VINO_NAME_PLACEHOLDER}; the fallback "${VINO_NAME_FALLBACK}" is lowercase and would open a sentence`);
    }

    problems.push(...retiredTermProblems(entry.line, where));

    if (entry.deferredUntil !== undefined && entry.deferredUntil.trim().length === 0) {
      problems.push(`${where}: deferred with no reason`);
    }
  }

  const gags = VINO_LINES.filter(l => l.gag).length;
  if (gags * GAG_BUDGET_DIVISOR > VINO_LINES.length) {
    problems.push(
      `gag budget: ${gags} of ${VINO_LINES.length} lines carry the can't-drink gag; ` +
        `the cap is 1 in ${GAG_BUDGET_DIVISOR}, so ${VINO_LINES.length} lines allow ${Math.floor(VINO_LINES.length / GAG_BUDGET_DIVISOR)}`,
    );
  }

  const used = new Set(VINO_LINES.map(l => l.expression));
  for (const expression of VINO_EXPRESSIONS) {
    if (!used.has(expression)) problems.push(`VinoExpression.${expression} is drawn by no line`);
  }

  return problems;
};
