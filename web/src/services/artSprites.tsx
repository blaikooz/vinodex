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

export const resolveGrapeArtStem = (grape: GrapeEntry): string | undefined => GRAPE_ART[grapeArtKey(grape)];
export const resolveStyleArtStem = (name: string): string | undefined => STYLE_ART[normalizeLabel(name)];
export const resolveFlavorArtStem = (name: string): string | undefined => FLAVOR_ART[normalizeLabel(name)];

/**
 * A full-colour pixel-art node. Unlike the glyph path this is a plain <img>:
 * no mask, no tint, no outline filter — the art is already finished.
 * NOTE (deferred, Phase A follow-up): grapes render their base `-rare` bunch;
 * the per-rarity leaf recolour (GrapeSpriteLoader.swift) is not yet ported, so
 * leaf colour does not vary by tier. The detail screen's rarity emblem still
 * signals the tier, so this is cosmetic-only.
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
