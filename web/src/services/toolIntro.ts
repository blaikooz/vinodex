/**
 * What a tool is, said once, the first time you open it — v10#5 (v0.6.27),
 * ported from `vinodex-ios/Sources/VinodexCore/ToolIntro.swift` (0.8.8 D1).
 *
 * ## The gap
 *
 * The TOOLS shelf is six two-word tiles. BLIND TASTING, WINE EXAM, DAILY
 * CHALLENGE, PROF. VINO and MOON DIAL are names, not explanations, and until
 * this release nothing in the app said what any of them *did* before you
 * were inside it. Opening MOON DIAL cold shows a dial and a date and no
 * statement of what a biodynamic drinking day is.
 *
 * ## Ids are storage
 *
 * `id` is written to `localStorage` by the store below (`toolIntrosSeen`, a
 * comma-joined set, unknown ids dropped on read — the same shape as
 * `firstTimeTriggersSeen`), so it is a stored vocabulary: **rename the
 * `title`, never the `id`.** A seventh tool appends an id and is a strict
 * superset. The ids are iOS's, so a future shared ledger reads either.
 *
 * ## The roster is here, and that is the point
 *
 * `MinigamesScreen` draws the tiles from its own table and this file names
 * the same six; `toolIntro.test.ts` holds the two together so they cannot
 * drift within a release of each other, which is what happened on iOS.
 */
import type { ToolId } from '../../components/MinigamesScreen';

export interface ToolIntro {
  /** Persisted; iOS's ids. */
  id: 'blindTasting' | 'labelScan' | 'wineExam' | 'dailyChallenge' | 'profVino' | 'moonDial';
  /** The shelf tile's id on the web, so the roster can be held to the shelf. */
  tool: ToolId;
  /** The route the tool opens on; the host raises the card on arrival. */
  route: string;
  /** The shelf tile's own words. */
  title: string;
  /** One line: what this is. */
  tagline: string;
  /** How it works, and what it costs you if it costs anything. */
  body: string;
  /** The same drawing the shelf tile wears. */
  art: string;
  /** The tile's face colour, so the card is recognisably the tile you tapped. */
  faceHex: string;
}

export const TOOL_INTROS: readonly ToolIntro[] = [
  {
    id: 'blindTasting', tool: 'scanner', route: '/scanner', title: 'BLIND TASTING', art: '/art/button/blindtasting.png', faceHex: '#22C55E',
    tagline: 'Work out what is in the glass in front of you.',
    body: 'Answer what you can see and taste — colour, body, where you think it is from, the flavours you can pick out — and the dex narrows the catalog down to what fits. Skip any step you are unsure of; fewer answers just means a longer list.',
  },
  {
    id: 'labelScan', tool: 'labelReader', route: '/label-scan', title: 'LABEL SCAN', art: '/art/button/labelscanner.png', faceHex: '#3B82F6',
    tagline: 'Point the camera at a bottle.',
    body: 'The label is read on the device — nothing is sent anywhere — and matched against the catalog. It finds grapes, regions and appellations, and will infer a grape from a region that is known for one. Good light and a straight-on shot help most.',
  },
  {
    id: 'wineExam', tool: 'wineExam', route: '/quiz', title: 'WINE EXAM', art: '/art/button/wineexam.png', faceHex: '#A855F7',
    tagline: 'The written exam, in three tiers.',
    body: 'Hundreds of authored questions across sixteen subjects, with an explanation on every answer whether you got it right or not. Pass a tier to unlock the next one. Nothing here is generated — these are questions somebody wrote.',
  },
  {
    id: 'dailyChallenge', tool: 'dailyChallenge', route: '/daily-challenge', title: 'DAILY CHALLENGE', art: '/art/button/dailychallenge.png', faceHex: '#EF4444',
    tagline: 'Five questions. One sitting a day.',
    body: 'The same five for everybody, cut fresh each day from the catalog. Four right passes it and keeps your streak; the streak is the only thing this one is really for. Come back tomorrow for the next.',
  },
  {
    id: 'profVino', tool: 'profVino', route: '/prof-vino', title: 'PROF. VINO', art: '/art/vino/vino-neutral.png', faceHex: '#EAB308',
    tagline: 'The resident professor, and his page.',
    body: 'Who Professor Vino is and everything he does — his faces, the switch that quiets him, and his ledger of what he has already told you.',
  },
  {
    id: 'moonDial', tool: 'moonDial', route: '/moon-dial', title: 'MOON DIAL', art: '/art/button/moondial.png', faceHex: '#0891B2',
    tagline: 'What kind of day the biodynamic calendar says it is.',
    body: 'Fruit, flower, leaf or root, worked out from where the moon is. Growers who follow the calendar taste on fruit and flower days and leave the wine alone on the others. Nothing to answer here — it is a readout.',
  },
];

export const toolIntroForRoute = (path: string): ToolIntro | undefined =>
  TOOL_INTROS.find(t => path === t.route || path.startsWith(`${t.route}/`));

// --- The seen store -------------------------------------------------------

export const TOOL_INTROS_SEEN_KEY = 'toolIntrosSeen';

const ls = (): Storage | null => (typeof window === 'undefined' ? null : window.localStorage);
const subscribers = new Set<() => void>();
const notify = (): void => subscribers.forEach(fn => fn());
export const subscribeToToolIntros = (fn: () => void): (() => void) => {
  subscribers.add(fn);
  return () => {
    subscribers.delete(fn);
  };
};

const KNOWN = new Set<string>(TOOL_INTROS.map(t => t.id));

/** Seen ids, unknown ones dropped (WHAT'S THAT…?'s old id, say). */
export const seenToolIntros = (): Set<string> => {
  try {
    const raw = ls()?.getItem(TOOL_INTROS_SEEN_KEY) ?? '';
    return new Set(raw.split(',').filter(id => id.length > 0 && KNOWN.has(id)));
  } catch {
    return new Set();
  }
};

const persist = (seen: Set<string>): void => {
  try {
    if (seen.size === 0) ls()?.removeItem(TOOL_INTROS_SEEN_KEY);
    else ls()?.setItem(TOOL_INTROS_SEEN_KEY, [...seen].sort().join(','));
  } catch {
    /* ignore */
  }
  notify();
};

export const hasSeenToolIntro = (id: ToolIntro['id']): boolean => seenToolIntros().has(id);

/** The card to raise on this route, or null when there is none or it is spent. */
export const pendingToolIntro = (path: string): ToolIntro | null => {
  const intro = toolIntroForRoute(path);
  return intro && !hasSeenToolIntro(intro.id) ? intro : null;
};

export const markToolIntroSeen = (id: ToolIntro['id']): void => {
  const seen = seenToolIntros();
  if (seen.has(id)) return;
  seen.add(id);
  persist(seen);
};

/**
 * The returning player's answer, and the reason there is no seed flag: the
 * app has no record of which tools anybody has used, so rather than guess
 * and suppress, it asks once and takes an answer for all six.
 */
export const markAllToolIntrosSeen = (): void => persist(new Set(KNOWN));

export const resetToolIntros = (): void => persist(new Set());
