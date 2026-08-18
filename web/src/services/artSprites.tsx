import React from 'react';
import iconManifest from '../data/iconManifest.json';
import { normalizeLabel } from '@/shared/services/entryUtils';
import type { GrapeEntry } from '@/shared/types';

/**
 * The 0.5.4–0.6.x pixel-art "portrait" system, ported from Swift.
 *
 * iOS resolves three entry variants (grape / style / flavor) to a hand-drawn
 * pixel-art PNG that REPLACES the tinted vector glyph — the art carries its own
 * colours and outline, so no tint or outline filter is applied (see
 * EntryVisual.swift lines 29–32). The colored well behind it is kept.
 *
 * The stem tables (`flavorArt` / `styleArt` / `grapeArt`) are consumed verbatim
 * from the generated icon manifest, the same objects iOS ships in icons.json.
 * Only the grape KEY derivation is real logic; it ports GrapeArt.key(for:).
 */

const FLAVOR_ART = (iconManifest as { flavorArt?: Record<string, string> }).flavorArt ?? {};
const STYLE_ART = (iconManifest as { styleArt?: Record<string, string> }).styleArt ?? {};
const GRAPE_ART = (iconManifest as { grapeArt?: Record<string, string> }).grapeArt ?? {};

/** `Light`/`Light-Medium` → light; `Medium-Full`/`Full` → full; else medium. */
const grapeDepth = (bodyClass: string): 'light' | 'medium' | 'full' => {
	switch (bodyClass) {
		case 'Light':
		case 'Light-Medium':
			return 'light';
		case 'Medium-Full':
		case 'Full':
			return 'full';
		default:
			return 'medium';
	}
};

/** Pink for the gris family (name-driven); amber for orange/skin-contact (style-driven). */
const grapeBlend = (name: string, style: string, wineType?: string): 'none' | 'pink' | 'amber' => {
	const n = normalizeLabel(name);
	if (n.includes('gris') || n.includes('grigio') || n.includes('gewurztraminer')) return 'pink';
	const s = normalizeLabel(`${style} ${wineType ?? ''}`);
	if (s.includes('orange') || s.includes('amber') || s.includes('skin contact')) return 'amber';
	return 'none';
};

/** Port of `GrapeArt.key(for:)` — `<green|red|gold>-<depth>-<blend>`. */
export const grapeArtKey = (grape: GrapeEntry): string => {
	let color: string;
	if (grape.grapeType === 'white') {
		const s = normalizeLabel(`${grape.grapeStyle} ${grape.wineType ?? ''}`);
		color = s.includes('sweet') ? 'gold' : 'green';
	} else {
		color = 'red';
	}
	return `${color}-${grapeDepth(grape.grapeBodyClass)}-${grapeBlend(grape.name, grape.grapeStyle, grape.wineType)}`;
};

// The grape sprites actually on disk (web/public/art/grape). The manifest maps
// each key to a `-rare` base; where a rarity-specific variant exists we swap the
// suffix so the leaf reads the tier. UNCOMMON/GODFORSAKEN have no baked variant,
// so they keep the base bunch (the detail rarity emblem still signals the tier).
const GRAPE_SPRITES = new Set([
  'gold-full-rare', 'gold-light-rare', 'gold-medium-rare',
  'green-amber-common', 'green-amber-noble', 'green-amber-rare', 'green-common',
  'green-full-common', 'green-full-noble', 'green-full-rare', 'green-light-noble',
  'green-light-rare', 'green-medium-common', 'green-medium-noble', 'green-medium-rare',
  'green-pink-light-common', 'green-pink-light-rare', 'green-pink-rare',
  'red-amber-medium-common', 'red-amber-medium-noble', 'red-amber-medium-rare',
  'red-full-common', 'red-full-noble', 'red-full-rare', 'red-light-common',
  'red-light-noble', 'red-light-rare', 'red-medium-common', 'red-medium-noble',
  'red-medium-rare', 'red-pink-common', 'red-pink-noble', 'red-pink-rare',
]);

export const resolveGrapeArtStem = (grape: GrapeEntry): string | undefined => {
  const base = GRAPE_ART[grapeArtKey(grape)];
  if (!base) return undefined;
  const rarity = String(grape.rarity ?? '').toLowerCase();
  if (rarity && rarity !== 'rare') {
    const variant = base.replace(/-rare$/, `-${rarity}`);
    if (GRAPE_SPRITES.has(variant)) return variant;
  }
  return base;
};
export const resolveStyleArtStem = (name: string): string | undefined => STYLE_ART[normalizeLabel(name)];
export const resolveFlavorArtStem = (name: string): string | undefined => FLAVOR_ART[normalizeLabel(name)];

/**
 * A full-colour pixel-art node. Unlike the glyph path this is a plain <img>:
 * no mask, no tint, no outline filter — the art is already finished.
 * Grapes pick a rarity-specific bunch where one is baked (see
 * resolveGrapeArtStem); UNCOMMON/GODFORSAKEN fall back to the base sprite.
 */
export const artSprite = (dir: 'flavor' | 'style' | 'grape', stem: string, size: number): React.ReactNode => (
	<img
		src={`/art/${dir}/${stem}.png`}
		alt=""
		width={size}
		height={size}
		draggable={false}
		style={{
			width: size,
			height: size,
			objectFit: 'contain',
			imageRendering: 'pixelated',
			display: 'block',
		}}
	/>
);
