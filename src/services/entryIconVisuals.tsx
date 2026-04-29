import React from 'react';
import {
	Apple,
	Castle,
	Circle,
	Citrus,
	Cloud,
	Droplet,
	Flame,
	Flower2,
	Gem,
	Globe,
	Grape,
	Heart,
	Leaf,
	Mountain,
	Shield,
	Sparkles,
	Sprout,
	Sun,
	Trees,
	Triangle,
	Wind,
	Zap,
} from 'lucide-react';
import type { WineEntry } from '../../types';
import { CLIMATE_CLASS_MAP } from '../../data/climateClasses';
import { getFlagGradient } from '../../data/flagGradients';
import { getFlagImage } from '../../data/flagImages';
import { getStylePalette } from '../../stylePalette';

export interface EntryVisualResolver {
	entries: WineEntry[];
}

export interface ResolveEntryIconVisualOptions {
	size?: number;
	resolver?: EntryVisualResolver;
	includeRegionClimateOutline?: boolean;
}

export interface EntryIconVisual {
	style: React.CSSProperties;
	iconNode: React.ReactNode;
	iconColor?: string;
}

const BLACK_ICON_OUTLINE_FILTER =
	'drop-shadow(0.5px 0 0 #000) drop-shadow(-0.5px 0 0 #000) drop-shadow(0 0.5px 0 #000) drop-shadow(0 -0.5px 0 #000) drop-shadow(0.5px 0.5px 0 #000) drop-shadow(-0.5px 0.5px 0 #000) drop-shadow(0.5px -0.5px 0 #000) drop-shadow(-0.5px -0.5px 0 #000)';

const applyFilledIconTreatment = (iconNode: React.ReactNode): React.ReactNode => {
	if (!React.isValidElement(iconNode)) return iconNode;
	const existingStyle = (iconNode.props.style || {}) as React.CSSProperties;
	const existingFilter = typeof existingStyle.filter === 'string' ? `${existingStyle.filter} ` : '';

	return React.cloneElement(iconNode as React.ReactElement, {
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
	CONT_AFRICA: '#FFFFFF',
	CONT_OCEANIA: '#16A34A',
	CONT_ASIA: '#FACC15',
};

const buildIconNode = (iconKey: string, size: number, color = '#ffffff'): React.ReactNode => {
	const common = { size, className: 'text-white opacity-90', style: { color } as React.CSSProperties };
	let iconNode: React.ReactNode;

	switch (iconKey) {
		case 'droplet':
			iconNode = <Droplet {...common} />;
			break;
		case 'heart':
			iconNode = <Heart {...common} />;
			break;
		case 'sun':
			iconNode = <Sun {...common} />;
			break;
		case 'cloud':
			iconNode = <Cloud {...common} />;
			break;
		case 'castle':
			iconNode = <Castle {...common} />;
			break;
		case 'mountain':
			iconNode = <Mountain {...common} />;
			break;
		case 'triangle':
			iconNode = <Triangle {...common} />;
			break;
		case 'sparkles':
			iconNode = <Sparkles {...common} />;
			break;
		case 'circle':
			iconNode = <Circle {...common} />;
			break;
		case 'shield':
			iconNode = <Shield {...common} />;
			break;
		case 'leaf':
			iconNode = <Leaf {...common} />;
			break;
		case 'flame':
			iconNode = <Flame {...common} />;
			break;
		case 'zap':
			iconNode = <Zap {...common} />;
			break;
		case 'flower':
			iconNode = <Flower2 {...common} />;
			break;
		case 'fruit':
			iconNode = <Apple {...common} />;
			break;
		case 'herb':
			iconNode = <Sprout {...common} />;
			break;
		case 'spice':
			iconNode = <Flame {...common} />;
			break;
		case 'mineral':
			iconNode = <Gem {...common} />;
			break;
		case 'oak':
			iconNode = <Trees {...common} />;
			break;
		case 'smoke':
			iconNode = <Wind {...common} />;
			break;
		case 'stone':
			iconNode = <Mountain {...common} />;
			break;
		case 'tropical':
			iconNode = <Citrus {...common} />;
			break;
		case 'honey':
			iconNode = <Sparkles {...common} />;
			break;
		case 'nut':
			iconNode = <Triangle {...common} />;
			break;
		case 'globe':
			iconNode = <Globe {...common} />;
			break;
		default:
			iconNode = <Grape {...common} />;
			break;
	}

	return applyFilledIconTreatment(iconNode);
};

const normalizeKey = (value: string) =>
	value
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-z0-9]+/g, ' ')
		.trim();

const isVariousOrigin = (origin?: string) => (origin || '').trim().toLowerCase() === 'various';

const darkenHex = (hex: string, amount = 0.35) => {
	const clean = hex.replace('#', '');
	if (clean.length !== 6) return hex;
	const toChannel = (start: number) => {
		const channel = parseInt(clean.substring(start, start + 2), 16);
		const darkened = Math.max(0, Math.min(255, Math.round(channel * (1 - amount))));
		return darkened.toString(16).padStart(2, '0');
	};
	return `#${toChannel(0)}${toChannel(2)}${toChannel(4)}`;
};

const addOutline = (iconNode: React.ReactNode, _outlineColor: string): React.ReactNode => {
	if (!React.isValidElement(iconNode)) return iconNode;
	return React.cloneElement(iconNode as React.ReactElement, {
		style: {
			...(iconNode.props.style || {}),
			filter: BLACK_ICON_OUTLINE_FILTER,
		},
	});
};

const addRegionOutline = (iconNode: React.ReactNode): React.ReactNode => {
	if (!React.isValidElement(iconNode)) return iconNode;
	return React.cloneElement(iconNode as React.ReactElement, {
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

const getStyleClassType = (name: string, classification?: string) => {
	const normalized = normalizeKey(name);
	const classOverride = classification?.toUpperCase();

	if (classOverride === 'ORIGIN' || classOverride === 'METHOD' || classOverride === 'TYPE' || classOverride === 'BLEND') {
		return classOverride;
	}

	const originKeywords = ['champagne', 'port', 'sherry', 'prosecco', 'cremant', 'cru beaujolais', 'super tuscan'];
	const methodKeywords = ['sparkling', 'fortified', 'dessert', 'late harvest', 'ice wine', 'botrytis', 'petillant', 'natural wine', 'orange wine'];
	const typeKeywords = ['full-bodied', 'full bodied', 'light-bodied', 'light bodied', 'medium-bodied', 'medium bodied', 'aromatic', 'white', 'red', 'rose', 'sweet white', 'sparkling wine'];

	if (originKeywords.some((k) => normalized.includes(k))) return 'ORIGIN';
	if (typeKeywords.some((k) => normalized.includes(k))) return 'TYPE';
	if (methodKeywords.some((k) => normalized.includes(k))) return 'METHOD';
	return 'STYLE';
};

const getStyleColorType = (name: string) => {
	const n = normalizeKey(name);
	if (n.includes('orange')) return 'ORANGE';
	if (n.includes('rose')) return 'ROSE';
	if (n.includes('red')) return 'RED';
	if (n.includes('white')) return 'WHITE';
	return 'DUAL';
};

const getStyleClassBg = (styleEntry?: WineEntry) => {
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
			return '#8B0000';
		case 'WHITE':
			return '#FAFAD2';
		case 'ROSE':
			return '#f9a8d4';
		case 'ORANGE':
			return '#fdba74';
		case 'DUAL':
			return '#f472b6';
		default:
			return '#e5e7eb';
	}
};

const getStyleIconShape = (styleEntry: WineEntry, colorTypeColor: string, size: number): React.ReactNode => {
	const classType = getStyleClassType(styleEntry.name, styleEntry.details.classification);
	const style = { color: colorTypeColor } as React.CSSProperties;

	if (classType === 'METHOD') return <Sparkles size={size} fill="currentColor" style={style} />;
	if (classType === 'ORIGIN') return <Shield size={size} fill="currentColor" style={style} />;
	if (classType === 'TYPE') return <Shield size={size} fill="currentColor" style={style} />;

	const colorType = getStyleColorType(styleEntry.name);
	switch (colorType) {
		case 'RED':
			return <Sun size={size} fill="currentColor" style={style} />;
		case 'WHITE':
			return <Droplet size={size} fill="currentColor" style={style} />;
		case 'ROSE':
			return <Droplet size={size} fill="currentColor" style={style} />;
		case 'ORANGE':
			return <Sun size={size} fill="currentColor" style={style} />;
		default:
			return <Grape size={size} fill="currentColor" style={style} />;
	}
};

const getFlavorSubclassIconColor = (sub?: string) => {
	switch ((sub || '').toUpperCase()) {
		case 'CITRUS':
			return '#f97316';
		case 'ORCHARD_FRUIT':
			return '#84cc16';
		case 'STONE_FRUIT':
			return '#fb923c';
		case 'TROPICAL':
			return '#eab308';
		case 'RED_FRUIT':
			return '#ef4444';
		case 'DARK_FRUIT':
			return '#8b5cf6';
		case 'BERRY':
			return '#e11d48';
		case 'HERBAL':
			return '#34d399';
		case 'VEGETAL':
			return '#22c55e';
		case 'SPICE':
			return '#d97706';
		case 'BAKING':
			return '#c08457';
		case 'FLORAL':
			return '#ec4899';
		case 'EARTH':
			return '#78716c';
		case 'WOOD':
			return '#8b5a2b';
		case 'MARINE':
			return '#0ea5e9';
		case 'WAX':
			return '#f59e0b';
		case 'NUT':
			return '#eab308';
		default:
			return '#e5e7eb';
	}
};

const getRegionClassificationIconColor = (classification?: string) => {
	const map: Record<string, string> = {
		aoc: '#f43f5e',
		docg: '#f59e0b',
		doc: '#ea580c',
		doca: '#fcd34d',
		ava: '#6366f1',
		gi: '#22c55e',
		pdo: '#a855f7',
		pgi: '#14b8a6',
		igp: '#84cc16',
	};
	const key = classification ? classification.toLowerCase() : '';
	return map[key] || '#e5e7eb';
};

const findEntryByName = (entries: WineEntry[], name: string, category?: WineEntry['category']) => {
	const clean = normalizeKey(name);
	return entries.find((entry) => {
		if (category && entry.category !== category) return false;
		if (normalizeKey(entry.name) === clean) return true;
		if (entry.details.synonyms?.some((s) => normalizeKey(s) === clean)) return true;
		return false;
	});
};

const getGrapePrimaryFlavorVisual = (
	grape: WineEntry,
	entries: WineEntry[],
	size: number
): { iconNode: React.ReactNode; bg: string; color: string } => {
	const primary = grape.tastingProfile?.[0];
	const typeBg = getGrapeIconColor(grape.grapeStyle || grape.grapeCard?.style || grape.wineType, grape.grapeBodyClass || grape.details.body);
	const outline = darkenHex(typeBg, 0.4);
	const relatedFlavor = primary?.note ? findEntryByName(entries, primary.note, 'FLAVORS') : undefined;
	const iconColor = relatedFlavor ? getFlavorSubclassIconColor(relatedFlavor.details.subclass) : primary?.color || '#e5e7eb';
	const key = primary?.icon || grape.icon || 'default';
	const iconNode = addOutline(buildIconNode(key, size, iconColor), outline);
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

	if (!entry) {
		return {
			style: { backgroundColor: '#444' },
			iconNode: buildIconNode('default', size, '#ffffff'),
			iconColor: '#ffffff',
		};
	}

	if (entry.category === 'GRAPES') {
		const visual = getGrapePrimaryFlavorVisual(entry, entries, size);
		return {
			style: { backgroundColor: visual.bg },
			iconNode: visual.iconNode,
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

			return {
				style: {
					boxShadow: climateOutline ? `0 0 0 2px ${climateOutline}` : undefined,
				},
				iconNode: flagImage ? (
					<img
						src={flagImage}
						alt={origin}
						style={{ width: '100%', height: '100%', objectFit: 'fill', display: 'block', borderRadius: '9999px', border: '2px solid #fff' }}
						draggable={false}
					/>
				) : (
					addRegionOutline(buildIconNode(entry.icon || 'default', size, iconColor))
				),
				iconColor,
			};
	}

	if (entry.category === 'COUNTRY_GATE') {
		const isUsState = entry.details.classification?.toUpperCase() === 'STATE';
		const origin = isUsState ? entry.name : (entry.details.origin || entry.name);
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
		const iconNode = addOutline(getStyleIconShape(entry, iconColor, size), '#000000');

		if (useFlag) {
			const flagImage = getFlagImage(origin);
			const flagGradient = getFlagGradient(origin);
			return {
				style: {
					backgroundImage: flagImage ? `url(${flagImage})` : flagGradient,
					backgroundSize: flagImage ? 'cover' : undefined,
					backgroundPosition: flagImage ? 'center' : undefined,
				},
				iconNode,
				iconColor,
			};
		}

		return {
			style: { backgroundColor: getStyleClassBg(entry) },
			iconNode,
			iconColor,
		};
	}

	if (entry.category === 'CONTINENTS') {
		const bgColor = OLYMPIC_CONTINENT_COLORS[entry.id] || entry.color || '#444';
		const iconColor = entry.id === 'CONT_AFRICA' ? '#000000' : '#ffffff';
		return {
			style: { backgroundColor: bgColor },
			iconNode: <Globe size={size} className="opacity-90" fill="none" stroke={iconColor} strokeWidth={2.6} />,
			iconColor,
		};
	}

	if (entry.category === 'FLAVORS') {
		const iconColor = getFlavorSubclassIconColor(entry.details.subclass);
		return {
			style: {
				backgroundColor: entry.color || '#444',
				boxShadow: `0 0 0 2px ${iconColor}`,
			},
			iconNode: addOutline(buildIconNode(entry.icon || 'default', size, iconColor), iconColor),
			iconColor,
		};
	}

	return {
		style: { backgroundColor: entry.color || '#444' },
		iconNode: buildIconNode(entry.icon || 'default', size, '#ffffff'),
		iconColor: '#ffffff',
	};
};
