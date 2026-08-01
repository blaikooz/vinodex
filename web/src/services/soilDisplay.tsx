import React from 'react';
import type { ClimateClass } from '@/shared/types';
import { Icon } from '../components/LocalIcon';
import iconManifest from '../data/iconManifest.json';

/**
 * Soil glyphs, resolved from the generated icon manifest rather than from a
 * list hand-maintained here.
 *
 * `iconManifest.json` is a direct copy of iOS's generated `icons.json`, and it
 * has carried `soilIcons`, `soilKeywords`, `climateSoilFallback` and
 * `defaultSoils` all along — this file simply was not reading any of them. It
 * kept its own seven keywords (volcanic, clay, sand, limestone/chalk,
 * slate/schist, granite, gravel) against the manifest's fifteen, so six terms
 * in the dataset fell through to the default mountain: **Alluvial, Laterite,
 * Loess, basalt, red loam and shale**.
 *
 * That is precisely the bug `CoverageTests.soilsResolve` was written for — its
 * comment reads "six terms were silently doing exactly that". iOS fixed it by
 * generating the table; the fix never crossed back, so the web had been
 * drawing a generic brown mountain for every alluvial and loess region since.
 *
 * Reading the manifest also means the keyword *order* comes from the generator,
 * which is load-bearing: matching is first-substring-wins, so "clay" must be
 * tried before "loam" or "clay loam" resolves as loam, and "sand" before
 * "limestone" so "sandstone" reaches sand.
 */

interface SoilIconEntry {
  icon: string;
  color: string;
}

const MANIFEST = iconManifest as {
  soilIcons: Record<string, SoilIconEntry>;
  soilKeywords: string[];
  climateSoilFallback: Record<string, string[]>;
  defaultSoils: string[];
};

const SOIL_ICONS = MANIFEST.soilIcons;
const SOIL_KEYWORDS = MANIFEST.soilKeywords;

const DEFAULT_SOIL: SoilIconEntry = SOIL_ICONS.default ?? {
  icon: 'lucide:mountain',
  color: '#8B4513',
};

export interface SoilIconVisual {
  icon: React.ReactNode;
  color: string;
}

/** The keyword a soil name resolves to, or null when nothing matches. */
export const soilKeywordFor = (soil: string): string | null => {
  const s = soil.toLowerCase();
  return SOIL_KEYWORDS.find(keyword => s.includes(keyword)) ?? null;
};

/**
 * Whether a soil name has a glyph of its own rather than falling through.
 *
 * Exposed so a test can assert the dataset never reaches the default — the
 * default renders perfectly well, which is exactly why nobody noticed.
 */
export const soilResolves = (soil: string): boolean => soilKeywordFor(soil) !== null;

export const getSoilIcon = (soil: string, size: number = 24): SoilIconVisual => {
  const keyword = soilKeywordFor(soil);
  const visual = (keyword && SOIL_ICONS[keyword]) || DEFAULT_SOIL;
  // The drawn ClassArt sprite, not `visual.icon` (0.6.5 merge). The colour and
  // the keyword ordering come from the manifest — those are generated and
  // correct — but its `icon` field does not: `web/src/data/iconManifest.json`
  // is a stale copy of iOS's `icons.json` and still names the pre-0.5.7 Iconify
  // glyphs (`game-icons:volcano`), which iOS replaced with `art:soil-*` sprites.
  // The parity line worked around that by hard-coding the stems; this keeps its
  // sprites while taking the generator's fifteen keywords and their
  // first-substring-wins order, which is the half the hard-coded list got wrong.
  // Re-copying the manifest from iOS would let this read `visual.icon` again.
  const stem = keyword ?? 'default';
  return {
    icon: <Icon icon={`art:soil-${stem}`} width={size} height={size} />,
    color: visual.color,
  };
};

/**
 * The soils a region shows. Regions without an explicit soil type fall back to
 * a climate-keyed triplet rather than showing nothing. Order is significant for
 * display, and both tables come from the manifest.
 */
export const getSoilsForRegion = (soilType?: string, climate?: ClimateClass): string[] => {
  if (soilType) {
    return soilType.split(',').map(s => s.trim()).filter(Boolean).slice(0, 3);
  }
  if (climate && MANIFEST.climateSoilFallback[climate]) {
    return MANIFEST.climateSoilFallback[climate]!;
  }
  return MANIFEST.defaultSoils;
};
