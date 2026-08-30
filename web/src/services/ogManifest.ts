import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import type { WineEntry } from '@/shared/types';
import { isGrapeEntry } from '@/shared/types';
import { SHAREABLE_CATEGORIES } from './siteIndex';
import { resolveFlavorArtStem, resolveGrapeArtStem, resolveStyleArtStem } from './artSprites';
import { outlineStemFor } from './outlineArt';

/**
 * What each share card is made of (v0.6.24, Phase 4 "per-entry OG cards").
 *
 * The cards are baked by `scripts/bake-og-cards.py` from the manifest this
 * module writes, and committed -- the same arrangement as the footer caps:
 * Python and Pillow exist on a maintainer's machine, not on the CI runner or
 * on Vercel, so the bake is a human step and `ogCards.test.ts` is what keeps
 * it honest. The one fact that must not drift is *which art an entry shows*,
 * so that is resolved here with the same functions the tiles use
 * (`artSprites`, `outlineArt`) rather than re-derived in Python.
 *
 * Node-only (it reads `index.css`); never imported by the app.
 */

export interface OgCardSpec {
  id: string;
  name: string;
  category: string;
  /** The category's livery, for the card ground. */
  livery: { solid: string; deep: string };
  /** A public path to the entry's art, or the category's menu icon. */
  art: string;
  /** Whether `art` is finished pixel art (scale ×N, nearest) or a mask icon. */
  artKind: 'sprite' | 'outline' | 'menu';
  /** The first sentence or so, for the card's one line of prose. */
  blurb: string;
}

const CATEGORY_LIVERY: Record<string, string> = {
  GRAPES: 'violet',
  REGIONS: 'green',
  STYLES: 'orange',
  FLAVORS: 'emerald',
};

const MENU_ICON: Record<string, string> = {
  GRAPES: '/art/button/grapes.png',
  REGIONS: '/art/button/regions.png',
  STYLES: '/art/button/styles.png',
  FLAVORS: '/art/button/flavors.png',
};

/** The livery hexes, read from the stylesheet so a retune cannot leave the cards behind. */
export const liveryHexes = (css: string): Record<string, { solid: string; deep: string }> => {
  const out: Record<string, { solid: string; deep: string }> = {};
  for (const [, name, hex] of css.matchAll(/--livery-([a-z]+):\s*(#[0-9a-fA-F]{6})/g)) out[name!] = { solid: hex!, deep: hex! };
  for (const [, name, hex] of css.matchAll(/--livery-([a-z]+)-deep:\s*(#[0-9a-fA-F]{6})/g)) if (out[name!]) out[name!]!.deep = hex!;
  return out;
};

const firstSentence = (text: string): string => {
  const clean = (text || '').replace(/\s+/g, ' ').trim();
  const m = clean.match(/^(.{20,160}?[.!?])(\s|$)/);
  return (m ? m[1]! : clean.slice(0, 140)).trim();
};

export const artFor = (entry: WineEntry): { art: string; artKind: OgCardSpec['artKind'] } => {
  if (isGrapeEntry(entry)) {
    const stem = resolveGrapeArtStem(entry);
    if (stem) return { art: `/art/grape/${stem}.png`, artKind: 'sprite' };
  } else if (entry.category === 'STYLES') {
    const stem = resolveStyleArtStem(entry.name);
    if (stem) return { art: `/art/style/${stem}.png`, artKind: 'sprite' };
  } else if (entry.category === 'FLAVORS') {
    const stem = resolveFlavorArtStem(entry.name);
    if (stem) return { art: `/art/flavor/${stem}.png`, artKind: 'sprite' };
  } else if (entry.category === 'REGIONS') {
    const details = entry.details as { origin?: string; state?: string };
    const stem = outlineStemFor(details.state) ?? outlineStemFor(details.origin || entry.name);
    if (stem) return { art: `/art/class/${stem}.png`, artKind: 'outline' };
  }
  return { art: MENU_ICON[entry.category] ?? MENU_ICON.GRAPES!, artKind: 'menu' };
};

export const buildOgManifest = (entries: WineEntry[], css: string): OgCardSpec[] => {
  const liveries = liveryHexes(css);
  return entries
    .filter(e => SHAREABLE_CATEGORIES.has(e.category))
    .map(e => {
      const livery = liveries[CATEGORY_LIVERY[e.category] ?? 'violet']!;
      return { id: e.id, name: e.name, category: e.category, livery, ...artFor(e), blurb: firstSentence(e.description) };
    });
};

/** A digest of everything a card's pixels depend on; the bake records it, the test recomputes it. */
export const ogManifestDigest = (specs: OgCardSpec[]): string =>
  createHash('sha256').update(JSON.stringify(specs)).digest('hex');

export const readIndexCss = (root: string): string => readFileSync(`${root}/web/index.css`, 'utf8');
