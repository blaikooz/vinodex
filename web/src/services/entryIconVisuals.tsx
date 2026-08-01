import React from 'react';
import { Globe } from 'lucide-react';
import { Icon } from '../components/LocalIcon';
import { getLucideIcon } from './lucideIconMap';
import iconManifest from '../data/iconManifest.json';
import type { GrapeEntry, StyleEntry, WineEntry } from '@/shared/types';
import { CLIMATE_CLASS_MAP } from '@/shared/data/climateClasses';
import { getFlagGradient } from '@/shared/data/flagGradients';
import { getFlagImage } from '../../data/flagImages';
import { getStylePalette } from '@/shared/stylePalette';
import FlavorIcon from '../../components/FlavorIcon';
import {
  findEntryByName,
  getStyleClassType,
  getStyleColorType,
  isVariousOrigin,
  normalizeLabel,
} from '@/shared/services/entryUtils';
import {
  darkenHex,
  getFlavorSubclassIconColor,
  getRegionClassificationIconColor,
} from '@/shared/services/colorUtils';
import {
  artSprite,
  resolveFlavorArtStem,
  resolveGrapeArtStem,
  resolveStyleArtStem,
} from './artSprites';

export interface EntryVisualResolver {
	entries: WineEntry[];
}

export interface ResolveEntryIconVisualOptions {
	size?: number;
	resolver?: EntryVisualResolver;
	includeRegionClimateOutline?: boolean;
	/**
	 * COUNTRY_GATE entries render as a plain rectangular flag in list rows, but
	 * the detail hero shows the drawn country/state outline instead. Callers on
	 * the detail screen set this; list tiles leave it false.
	 */
	countryOutlineHero?: boolean;
}

export interface EntryIconVisual {
	style: React.CSSProperties;
	iconNode: React.ReactNode;
	iconColor?: string;
}

const BLACK_ICON_OUTLINE_FILTER =
	'drop-shadow(0.5px 0 0 #000) drop-shadow(-0.5px 0 0 #000) drop-shadow(0 0.5px 0 #000) drop-shadow(0 -0.5px 0 #000) drop-shadow(0.5px 0.5px 0 #000) drop-shadow(-0.5px 0.5px 0 #000) drop-shadow(0.5px -0.5px 0 #000) drop-shadow(-0.5px -0.5px 0 #000)';

interface SvgIconProps {
	style?: React.CSSProperties;
	fill?: string;
	stroke?: string;
	strokeWidth?: number;
}

const applyFilledIconTreatment = (iconNode: React.ReactNode): React.ReactNode => {
	if (!React.isValidElement<SvgIconProps>(iconNode)) return iconNode;
	const existingStyle = iconNode.props.style || {};
	const existingFilter = typeof existingStyle.filter === 'string' ? `${existingStyle.filter} ` : '';

	return React.cloneElement(iconNode, {
		fill: iconNode.props.fill ?? 'currentColor',
		stroke: iconNode.props.stroke ?? '#000000',
		strokeWidth: iconNode.props.strokeWidth ?? 0.7,
		style: {
			...existingStyle,
			filter: `${existingFilter}${BLACK_ICON_OUTLINE_FILTER}`.trim(),
		},
	});
};

const OLYMPIC_CONTINENT_COLORS: Record<string, string> = {
	CONT_NORTH_AMERICA: '#E11D48',
	CONT_EUROPE: '#2563EB',
	CONT_SOUTH_AMERICA: '#A855F7',
	CONT_AFRICA: '#000000',
	CONT_OCEANIA: '#16A34A',
	CONT_ASIA: '#FACC15',
};

const buildIconNode = (iconKey: string, size: number, color = '#ffffff'): React.ReactNode => {
	const LucideIconComponent = getLucideIcon(iconKey);
	const iconNode = (
		<LucideIconComponent
			size={size}
			className="text-white opacity-90"
			style={{ color }}
		/>
	);
	return applyFilledIconTreatment(iconNode);
};

const addOutline = (iconNode: React.ReactNode, _outlineColor: string): React.ReactNode => {
	if (!React.isValidElement<SvgIconProps>(iconNode)) return iconNode;
	return React.cloneElement(iconNode, {
		style: {
			...(iconNode.props.style || {}),
			filter: BLACK_ICON_OUTLINE_FILTER,
		},
	});
};

const addRegionOutline = (iconNode: React.ReactNode): React.ReactNode => {
	if (!React.isValidElement<SvgIconProps>(iconNode)) return iconNode;
	return React.cloneElement(iconNode, {
		style: {
			...(iconNode.props.style || {}),
			filter: BLACK_ICON_OUTLINE_FILTER,
		},
	});
};

const getGrapeIconColor = (wineType: string | undefined, body: string | undefined) => {
	const palette = getStylePalette(wineType);
	if (palette) return palette.primary;

	if (!wineType) return '#78716c';

	const type = wineType.toLowerCase();
	const bodyLevel = body?.toLowerCase() || 'medium';

	if (type.includes('red') || type.includes('bold')) {
		if (bodyLevel.includes('light')) return '#DC143C';
		if (bodyLevel.includes('full')) return '#4A0E0E';
		return '#8B0000';
	}

	if (type.includes('white') || type.includes('aromatic')) {
		if (bodyLevel.includes('light')) return '#FAFAD2';
		if (bodyLevel.includes('full')) return '#B8860B';
		return '#DAA520';
	}

	if (type.includes('rose') || type.includes('rosé')) return '#DB7093';
	if (type.includes('sweet')) return '#CD853F';
	return '#78716c';
};

const getStyleClassBg = (styleEntry?: StyleEntry) => {
	const classType = styleEntry ? getStyleClassType(styleEntry.name, styleEntry.details.classification) : undefined;
	switch (classType) {
		case 'METHOD':
			return '#312e81';
		case 'ORIGIN':
			return '#7c2d12';
		case 'TYPE':
			return '#0f172a';
		case 'STYLE':
			return '#064e3b';
		case 'BLEND':
			return '#1d1b47';
		default:
			return styleEntry?.color || '#78716c';
	}
};

const getStyleColorTypeColor = (type?: string) => {
	switch (type) {
		case 'RED':
			return '#dc2626';
		case 'WHITE':
			return '#ffffff';
		case 'ROSE':
			return '#ec4899';
		case 'ORANGE':
			return '#f97316';
		case 'DUAL':
			return '#3b82f6';
		default:
			return '#e5e7eb';
	}
};

const STYLE_ICON_MAP: Record<string, string> = {
	'flame': 'game-icons:flame',
	'droplet': 'game-icons:droplet',
	'sun': 'game-icons:sun',
	'sparkles': 'game-icons:sparkles',
	'circle': 'game-icons:circle',
	'shield': 'game-icons:shield',
	'leaf': 'game-icons:leaf',
	'mountain': 'game-icons:mountain',
	'triangle': 'game-icons:triangle',
	'heart': 'game-icons:heart',
	'zap': 'game-icons:zap',
	'flower': 'game-icons:flower',
	'fruit': 'game-icons:apple',
	'herb': 'game-icons:herb',
	'spice': 'game-icons:spices',
	'mineral': 'game-icons:gem',
	'oak': 'game-icons:oak',
	'smoke': 'game-icons:smoke',
	'stone': 'game-icons:stone',
	'tropical': 'game-icons:banana',
	'flag': 'game-icons:flag',
	'honey': 'game-icons:honeycomb',
	'nut': 'game-icons:almond',
	'default': 'game-icons:question-mark',
};

const COUNTRY_SHAPE_ICON_MAP: Record<string, string> = {
	france: 'game-icons:france',
	australia: 'game-icons:australia',
	hungary: 'game-icons:hungary',
	italy: 'game-icons:italia',
	japan: 'game-icons:japan',
	portugal: 'game-icons:portugal',
	'south africa': 'game-icons:south-africa',
	spain: 'game-icons:spain',
	switzerland: 'game-icons:switzerland',
};

const normalizeCountryKey = (origin: string) => normalizeLabel(origin).trim();

// Full-colour ClassArt country/state outlines (v0.5.7 `art:outline-*`), keyed
// by normalized place name. iOS draws these as the region/country icon; the web
// prefers them over the shaped-flag mask (which only covered a handful).
const OUTLINE_ART_KEYS = [
	'france', 'germany', 'italy', 'greece', 'portugal', 'spain', 'hungary', 'austria',
	'croatia', 'california', 'oregon', 'washington', 'new york', 'georgia', 'switzerland',
	'romania', 'south africa', 'morocco', 'usa', 'canada', 'argentina', 'chile', 'uruguay',
	'new zealand', 'australia', 'japan', 'china', 'india',
];
const OUTLINE_ART: Record<string, string> = Object.fromEntries(
	OUTLINE_ART_KEYS.map(k => [k, `outline-${k.replace(/ /g, '-')}`]),
);
const outlineStemFor = (name?: string): string | undefined =>
	name ? OUTLINE_ART[normalizeCountryKey(name)] : undefined;
const outlineNode = (
	stem: string,
	size: number,
	mapPosition?: { x: number; y: number },
): React.ReactNode => {
	// ~0.78 of the well (iOS `EntryVisual.iconScale`), so a flag well shows as a
	// ring around the shape rather than being fully covered. The image keeps its
	// natural aspect (max-box + auto), letterboxed inside the box.
	const box = Math.round(size * 1.33);
	const img = (
		<img
			src={`/art/class/${stem}.png`}
			alt=""
			draggable={false}
			style={{
				maxWidth: box,
				maxHeight: box,
				width: 'auto',
				height: 'auto',
				display: 'block',
				imageRendering: 'pixelated',
			}}
		/>
	);
	if (!mapPosition) {
		// Centre the fitted image in a box-sized square so list/hero wells stay
		// consistent whether or not a dot is drawn.
		return (
			<span style={{ display: 'inline-flex', width: box, height: box, alignItems: 'center', justifyContent: 'center' }}>
				{img}
			</span>
		);
	}
	// The red location dot (iOS `dottedOutline`). The wrapper shrink-wraps the
	// fitted image (inline-block, line-height 0), so the authored 0–1 hint —
	// a fraction of the outline PNG, snapped to land (see regions.ts) — maps to
	// the image itself, not a letterboxed square.
	const dotSize = Math.max(4, Math.round(size * 0.19));
	return (
		<span style={{ position: 'relative', display: 'inline-block', lineHeight: 0 }}>
			{img}
			<span
				style={{
					position: 'absolute',
					left: `${mapPosition.x * 100}%`,
					top: `${mapPosition.y * 100}%`,
					width: dotSize,
					height: dotSize,
					marginLeft: -dotSize / 2,
					marginTop: -dotSize / 2,
					borderRadius: '9999px',
					backgroundColor: '#ef4444',
					border: `${Math.max(1, Math.round(dotSize * 0.11))}px solid rgba(0,0,0,0.7)`,
					boxSizing: 'border-box',
					pointerEvents: 'none',
				}}
			/>
		</span>
	);
};

const OFFLINE_ICONS = new Set((iconManifest as { unique: string[] }).unique);

// Shaped flags (France, Italy, ...) mask a background image through an icon
// silhouette. Prefer the same locally bundled PNG LocalIcon renders glyphs
// from; only reach for the live Iconify API for a key outside that set.
const iconifyMaskUrl = (iconName: string) =>
	OFFLINE_ICONS.has(iconName)
		? `url(/icons/${iconName.replace(':', '--')}@3x.png)`
		: `url(https://api.iconify.design/${iconName.replace(':', '/')}.svg)`;

const renderShapedFlag = (background: string, iconName: string): React.ReactNode => {
	const maskUrl = iconifyMaskUrl(iconName);
	const flagBackgroundStyle: React.CSSProperties = {
		background,
		backgroundSize: 'cover',
		backgroundPosition: 'center',
	};
	return (
		<span className="relative w-full h-full block">
			<span
				className="absolute inset-0 block"
				style={{ ...flagBackgroundStyle, opacity: 0.25, filter: 'blur(2px)' }}
			/>
			<span
				className="absolute inset-0 block"
				style={{
					...flagBackgroundStyle,
					WebkitMaskImage: maskUrl,
					maskImage: maskUrl,
					WebkitMaskSize: 'contain',
					maskSize: 'contain',
					WebkitMaskRepeat: 'no-repeat',
					maskRepeat: 'no-repeat',
					WebkitMaskPosition: 'center',
					maskPosition: 'center',
				}}
			/>
		</span>
	);
};

const STYLE_CLASS_ICON_MAP: Record<string, string> = {
	TYPE: 'game-icons:holy-grail',
	BLEND: 'game-icons:pouring-chalice',
	ORIGIN: 'game-icons:atlas',
	METHOD: 'game-icons:cellar-barrels',
};

const getStyleIconShape = (styleEntry: StyleEntry, colorTypeColor: string, size: number): React.ReactNode => {
	const classType = getStyleClassType(styleEntry.name, styleEntry.details.classification);
	const classIcon = classType ? STYLE_CLASS_ICON_MAP[classType] : undefined;

	const iconKey = styleEntry.icon || 'default';
	const iconName = classIcon || STYLE_ICON_MAP[iconKey] || `game-icons:${iconKey}`;

	return (
		<Icon
			icon={iconName}
			width={size}
			height={size}
			style={{ color: colorTypeColor }}
		/>
	);
};

const getGrapePrimaryFlavorVisual = (
	grape: GrapeEntry,
	entries: WineEntry[],
	size: number
): { iconNode: React.ReactNode; bg: string; color: string } => {
	const primary = grape.tastingProfile?.[0];
	const typeBg = getGrapeIconColor(grape.grapeStyle || grape.grapeCard?.style || grape.wineType, grape.grapeBodyClass || grape.details.body);
	const outline = darkenHex(typeBg, 0.4);
	const relatedFlavor = primary?.note ? findEntryByName(entries, primary.note, 'FLAVORS') : undefined;
	const iconColor = relatedFlavor ? getFlavorSubclassIconColor(relatedFlavor.details.subclass) : primary?.color || '#e5e7eb';

	let iconNode: React.ReactNode;
	if (relatedFlavor) {
		iconNode = addOutline(
			<FlavorIcon
				name={relatedFlavor.name}
				flavor={relatedFlavor.details.subclass || ''}
				className=""
				style={{
					width: size,
					height: size,
					color: iconColor,
				}}
			/>,
			outline
		);
	} else {
		const key = primary?.icon || grape.icon || 'default';
		iconNode = addOutline(buildIconNode(key, size, iconColor), outline);
	}

	return { iconNode, bg: typeBg, color: iconColor };
};

export const createEntryVisualResolver = ({ entries }: { entries: WineEntry[] }): EntryVisualResolver => {
	return { entries };
};

export const resolveEntryIconVisual = (
	entry: WineEntry | undefined,
	options: ResolveEntryIconVisualOptions = {}
): EntryIconVisual => {
	const size = options.size ?? 20;
	const entries = options.resolver?.entries || [];
	const includeRegionClimateOutline = options.includeRegionClimateOutline ?? true;
	const countryOutlineHero = options.countryOutlineHero ?? false;

	if (!entry) {
		return {
			style: { backgroundColor: '#444' },
			iconNode: buildIconNode('default', size, '#ffffff'),
			iconColor: '#ffffff',
		};
	}

	if (entry.category === 'GRAPES') {
		const visual = getGrapePrimaryFlavorVisual(entry, entries, size);
		// Pixel-art bunch portrait replaces the primary-note glyph when the
		// grape resolves to one (the common case at 0.6.x scale); the flavour
		// glyph stays the fallback for anything unillustrated.
		const grapeStem = resolveGrapeArtStem(entry);
		return {
			style: { backgroundColor: visual.bg },
			iconNode: grapeStem ? artSprite('grape', grapeStem, Math.round(size * 1.5)) : visual.iconNode,
			iconColor: visual.color,
		};
	}

	if (entry.category === 'REGIONS') {
		const origin = entry.details.origin || entry.name;
		const flagImage = getFlagImage(origin);
		const flagGradient = getFlagGradient(origin);
		const climateOutline = includeRegionClimateOutline && entry.climate
			? CLIMATE_CLASS_MAP[entry.climate]?.colors.border || CLIMATE_CLASS_MAP[entry.climate]?.colors.bg
			: undefined;

		let iconColor = getRegionClassificationIconColor(entry.details.classification);
		const mainGrape = entry.details.notableGrapes?.[0];
		if (mainGrape) {
			const grape = findEntryByName(entries, mainGrape, 'GRAPES');
			if (grape) {
				iconColor = getGrapePrimaryFlavorVisual(grape, entries, size).color;
			}
		}

			// Prefer the drawn outline art — state outline for US regions, else
			// the country's (matches EntryVisual.swift).
			const outlineStem = outlineStemFor((entry.details as { state?: string }).state) ?? outlineStemFor(origin);
			const countryShapeIcon = COUNTRY_SHAPE_ICON_MAP[normalizeCountryKey(origin)];
			const useShapedFlag = !!countryShapeIcon && (!!flagImage || !!flagGradient);

			let regionIconNode: React.ReactNode;
			// iOS `regionVisual`: the well is the country flag, with the drawn
			// outline art (transparent around the country silhouette) sitting on
			// top — so the shape reads in its own colours while the flag shows
			// through the transparent margins. The region's `mapPosition` places
			// the red location dot on the outline.
			let wellStyle: React.CSSProperties = {};
			if (outlineStem) {
				const mapPosition = (entry.details as { mapPosition?: { x: number; y: number } }).mapPosition;
				regionIconNode = outlineNode(outlineStem, size, mapPosition);
				if (flagImage) {
					wellStyle = { backgroundImage: `url(${flagImage})`, backgroundSize: 'cover', backgroundPosition: 'center' };
				} else if (flagGradient) {
					wellStyle = { background: flagGradient as string };
				} else {
					wellStyle = { backgroundColor: '#ffffff' };
				}
			} else if (useShapedFlag) {
				const background = flagImage ? `url(${flagImage})` : (flagGradient as string);
				regionIconNode = renderShapedFlag(background, countryShapeIcon);
			} else if (flagImage) {
				regionIconNode = (
					<img
						src={flagImage}
						alt={origin}
						style={{ width: '100%', height: '100%', objectFit: 'fill', display: 'block', borderRadius: '9999px', border: '2px solid #fff' }}
						draggable={false}
					/>
				);
			} else if (flagGradient) {
				regionIconNode = (
					<span className="w-full h-full block" style={{ background: flagGradient, borderRadius: '9999px', border: '2px solid #fff' }} />
				);
			} else {
				regionIconNode = addRegionOutline(buildIconNode(entry.icon || 'default', size, iconColor));
			}

			return {
				style: {
					...wellStyle,
					boxShadow: climateOutline ? `0 0 0 2px ${climateOutline}` : undefined,
				},
				iconNode: regionIconNode,
				iconColor,
			};
	}

	if (entry.category === 'COUNTRY_GATE') {
		const isUsState = entry.details.classification?.toUpperCase() === 'STATE';
		const origin = isUsState ? entry.name : (entry.details.origin || entry.name);
		const outlineStem = outlineStemFor(origin);
		// Only the detail hero draws the outline; list rows stay a flat
		// rectangular flag (per the country list treatment).
		if (outlineStem && countryOutlineHero) {
			const mapPosition = (entry.details as { mapPosition?: { x: number; y: number } }).mapPosition;
			return { style: { backgroundColor: '#ffffff', overflow: 'hidden' }, iconNode: outlineNode(outlineStem, size, mapPosition), iconColor: '#ffffff' };
		}
		const flagImage = getFlagImage(origin, { preferUsState: isUsState });
		const flagGradient = getFlagGradient(origin);
        return {
            style: {
                overflow: 'hidden',
            },
            iconNode: flagImage ? (
                <img
                    src={flagImage}
                    alt={origin}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    draggable={false}
                />
            ) : flagGradient ? (
                <span className="w-full h-full block" style={{ background: flagGradient }} />
            ) : null,
            iconColor: '#ffffff',
        };
	}

	if (entry.category === 'STYLES') {
		const origin = entry.details.origin;
		const useFlag = !!origin && !isVariousOrigin(origin) && (!!getFlagImage(origin) || !!getFlagGradient(origin));
		const colorType = getStyleColorType(entry.name);
		const iconColor = getStyleColorTypeColor(colorType);
		// Pixel-art style portrait replaces the shaped glyph when one exists;
		// the art carries its own outline, so no addOutline() in that case.
		const styleStem = resolveStyleArtStem(entry.name);
		const iconNode = styleStem
			? artSprite('style', styleStem, Math.round(size * 1.5))
			: addOutline(getStyleIconShape(entry, iconColor, size), '#000000');

		if (useFlag) {
			const flagImage = getFlagImage(origin);
			const flagGradient = getFlagGradient(origin);
			return {
				style: {
					backgroundImage: flagImage ? `url(${flagImage})` : flagGradient,
					backgroundSize: flagImage ? 'cover' : undefined,
					backgroundPosition: flagImage ? 'center' : undefined,
					borderColor: '#ffffff',
				},
				iconNode,
				iconColor,
			};
		}

		return {
			style: { backgroundColor: getStyleClassBg(entry), borderColor: '#ffffff' },
			iconNode,
			iconColor,
		};
	}

	if (entry.category === 'CONTINENTS') {
		const iconColor = OLYMPIC_CONTINENT_COLORS[entry.id] || entry.color || '#444';
		// Full-colour ClassArt globes (v0.5.7 `art:` ids), one per continent.
		const globeStem: Record<string, string> = {
			CONT_AFRICA: 'globe-africa',
			CONT_EUROPE: 'globe-europe',
			CONT_ASIA: 'globe-asia',
			CONT_OCEANIA: 'globe-oceania',
			CONT_NORTH_AMERICA: 'globe-north-america',
			CONT_SOUTH_AMERICA: 'globe-south-america',
		};
		const stem = globeStem[entry.id];
		// Globes render near full-bleed (iconScale ~0.9 on iOS).
		const continentSize = Math.round(size * 1.9);
		return {
			style: { backgroundColor: '#ffffff' },
			iconNode: stem ? (
				<Icon icon={`art:${stem}`} width={continentSize} height={continentSize} />
			) : (
				<Globe size={continentSize} className="opacity-90" fill="none" stroke={iconColor} strokeWidth={2.6} />
			),
			iconColor,
		};
	}

	// Final exhaustive case: FLAVORS
	const iconColor = getFlavorSubclassIconColor(entry.details.subclass);
	const flavorSize = Math.round(size * 1.3);
	// Pixel-art flavour portrait replaces the tinted glyph when one exists; the
	// art is full-colour and self-outlined, so no tint or outline filter.
	const flavorStem = resolveFlavorArtStem(entry.name);
	return {
		style: {
			backgroundColor: entry.color || '#444',
			boxShadow: `0 0 0 2px ${iconColor}`,
		},
		iconNode: flavorStem ? (
			artSprite('flavor', flavorStem, flavorSize)
		) : (
			<FlavorIcon
				name={entry.name}
				flavor={entry.details.subclass || ''}
				className=""
				style={{
					width: flavorSize,
					height: flavorSize,
					color: iconColor,
					filter: BLACK_ICON_OUTLINE_FILTER,
				}}
			/>
		),
		iconColor,
	};
};
