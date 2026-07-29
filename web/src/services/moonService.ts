import { dayIndex } from './dailyPick';

/**
 * The biodynamic tasting calendar's four day types.
 *
 * Ported from `vinodex-ios/Sources/VinodexCore/MoonCalendar.swift`, which is now
 * the reference. It replaces a sidereal (Lahiri ayanamsa) implementation with an
 * ecliptic-node window and hourly sampling — considerably more astronomy, and
 * roughly 24° offset from this one, so the two apps regularly disagreed about
 * which sign the moon was in on the same evening. Matching iOS matters more here
 * than being closer to an ephemeris: the number this produces is a word on a
 * screen, and the two builds should print the same word.
 *
 * Growers following Maria Thun's calendar divide the month by which zodiac sign
 * the moon is passing through, and group those signs by classical element: fire
 * days are *fruit* days, air *flower*, water *leaf*, earth *root*. The wine
 * trade picked this up because several UK supermarkets and a good many
 * sommeliers schedule tastings by it — fruit and flower days are held to show a
 * wine at its best, leaf and root days at their dullest.
 *
 * Whether it is true is not this screen's problem. It is a real, widely used
 * calendar with a defined rule, which is what makes it worth computing rather
 * than inventing a "type of day" out of nothing.
 */
export type MoonDay = 'FRUIT' | 'FLOWER' | 'LEAF' | 'ROOT';

/** Declaration order, matching `MoonDay.allCases` — the dial's four ticks. */
export const MOON_DAYS: readonly MoonDay[] = ['FRUIT', 'FLOWER', 'LEAF', 'ROOT'] as const;

/** The classical element of the sign the moon is in. */
export function moonElement(day: MoonDay): string {
  switch (day) {
    case 'FRUIT': return 'FIRE';
    case 'FLOWER': return 'AIR';
    case 'LEAF': return 'WATER';
    case 'ROOT': return 'EARTH';
  }
}

/** Whether the calendar rates this a good day to taste. */
export function isGoodForDrinking(day: MoonDay): boolean {
  return day === 'FRUIT' || day === 'FLOWER';
}

/** The headline answer, which is the whole reason anyone opens this screen. */
export function moonVerdict(day: MoonDay): string {
  return isGoodForDrinking(day) ? 'GOOD DAY TO DRINK' : 'MAYBE NOT TODAY';
}

/** What the day is said to favour. */
export function moonSummary(day: MoonDay): string {
  switch (day) {
    case 'FRUIT':
      return 'Fruit days favour ripe, expressive wine. The classic day to open something you actually care about.';
    case 'FLOWER':
      return 'Flower days lift aromatics. Perfumed whites, and anything you drink mostly with your nose.';
    case 'LEAF':
      return 'Leaf days run watery and closed. Wine is said to show its dullest face.';
    case 'ROOT':
      return 'Root days push tannin and structure forward, and everything charming backward.';
  }
}

/** Reference epoch J2000.0 — 2000-01-01 12:00 UTC. */
const J2000_MS = 946_728_000 * 1000;

/**
 * The moon's mean ecliptic longitude in degrees, 0..<360.
 *
 * The standard low-precision formula: the moon advances ~13.176° a day from a
 * known position at J2000. It ignores the major perturbations, so it can sit a
 * few degrees off true longitude and land on a neighbouring sign near a
 * boundary. That is well inside the tolerance of a calendar whose own
 * practitioners disagree about boundaries — and the alternative is a full lunar
 * theory for a screen that prints one word.
 */
export function moonLongitude(date: Date = new Date()): number {
  const days = (date.getTime() - J2000_MS) / 86_400_000;
  const raw = (218.316 + 13.176396 * days) % 360;
  return raw < 0 ? raw + 360 : raw;
}

/**
 * The instant a whole calendar day is judged by.
 *
 * Local noon, **not** the moment of the call. The moon changes sign at an
 * arbitrary hour, so reading the live longitude made the screen flip from a leaf
 * day to a fruit day over lunch — and the quote with it. A day gets one type.
 * Noon rather than midnight because a sign entered at 03:00 governs the
 * overwhelming majority of that day, and midnight would file the whole day under
 * the sign it was leaving.
 */
function anchor(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);
}

const ZODIAC_NAMES = [
  'ARIES', 'TAURUS', 'GEMINI', 'CANCER', 'LEO', 'VIRGO',
  'LIBRA', 'SCORPIO', 'SAGITTARIUS', 'CAPRICORN', 'AQUARIUS', 'PISCES',
] as const;

/** Which of the twelve signs the moon is in for the given day, Aries = 0. */
export function zodiacIndex(date: Date = new Date()): number {
  return Math.min(Math.floor(moonLongitude(anchor(date)) / 30), 11);
}

/** The sign's name, shown as the readout under the day type. */
export function zodiacName(date: Date = new Date()): string {
  return ZODIAC_NAMES[zodiacIndex(date)]!;
}

/**
 * The day type.
 *
 * The elements cycle in a fixed order through the zodiac — fire, earth, air,
 * water, repeating — so the sign index modulo four *is* the element, with no
 * table needed.
 */
export function moonDay(date: Date = new Date()): MoonDay {
  switch (zodiacIndex(date) % 4) {
    case 0: return 'FRUIT';   // fire  — Aries, Leo, Sagittarius
    case 1: return 'ROOT';    // earth — Taurus, Virgo, Capricorn
    case 2: return 'FLOWER';  // air   — Gemini, Libra, Aquarius
    default: return 'LEAF';   // water — Cancer, Scorpio, Pisces
  }
}

const QUOTES: Record<MoonDay, string[]> = {
  FRUIT: [
    'Fruit day. The universe has signed off. Open the good bottle.',
    'Fruit day: even the sceptics pour a second glass.',
    'Fruit day. Blame the moon, not your judgement.',
    'Fruit day — the wine is showing off, and so should you.',
  ],
  FLOWER: [
    'Flower day. Aromatics are running the show. Something perfumed, please.',
    'Flower day: the bouquet does the talking tonight.',
    'Flower day — pour something that smells like a compliment.',
    'Flower day. Riesling has been waiting by the phone.',
  ],
  LEAF: [
    'Leaf day. The wine is sulking. Have a cup of tea and a think.',
    'Leaf day: technically drinkable, spiritually inadvisable.',
    'Leaf day — save the good bottle. It will not thank you today.',
    'Leaf day. Even the grapes are having an off one.',
  ],
  ROOT: [
    'Root day. Wine goes quiet and tannin does all the talking.',
    'Root day: the least romantic entry in the lunar calendar.',
    'Root day — a night for stew, not for Burgundy.',
    'Root day. Put the cork back in. Trust the moon.',
  ],
};

/**
 * A line about today, rotating so two consecutive fruit days do not read
 * identically. Deterministic from the date for the same reason the daily pick
 * is: reopening the app must not reshuffle it.
 */
export function moonQuote(date: Date = new Date()): string {
  const pool = QUOTES[moonDay(date)];
  if (pool.length === 0) return '';
  const i = dayIndex(date);
  return pool[((i % pool.length) + pool.length) % pool.length]!;
}
