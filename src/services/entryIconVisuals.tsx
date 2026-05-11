import React from 'react';
import { Globe } from 'lucide-react';
import { Icon } from '@iconify/react';
import { getLucideIcon } from './lucideIconMap';
import type { GrapeEntry, StyleEntry, WineEntry } from '../../types';
import { CLIMATE_CLASS_MAP } from '../../data/climateClasses';
import { getFlagGradient } from '../../data/flagGradients';
import { getFlagImage } from '../../data/flagImages';
import { getStylePalette } from '../../stylePalette';
import FlavorIcon from '../../components/FlavorIcon';
import {
  findEntryByName,
  getStyleClassType,
  getStyleColorType,
  isVariousOrigin,
  normalizeLabel,
} from './entryUtils';
import {
  darkenHex,
  getFlavorSubclassIconColor,
  getRegionClassificationIconColor,
} from './colorUtils';

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

const iconifyMaskUrl = (iconName: string) =>
	`url(https://api.iconify.design/${iconName.replace(':', '/')}.svg)`;

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

			const countryShapeIcon = COUNTRY_SHAPE_ICON_MAP[normalizeCountryKey(origin)];
			const useShapedFlag = !!countryShapeIcon && (!!flagImage || !!flagGradient);

			let regionIconNode: React.ReactNode;
			if (useShapedFlag) {
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
					boxShadow: climateOutline ? `0 0 0 2px ${climateOutline}` : undefined,
				},
				iconNode: regionIconNode,
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
		const continentIconName: Record<string, string> = {
			CONT_AFRICA: 'game-icons:earth-africa-europe',
			CONT_EUROPE: 'game-icons:earth-africa-europe',
			CONT_ASIA: 'game-icons:earth-asia-oceania',
			CONT_OCEANIA: 'game-icons:earth-asia-oceania',
			CONT_NORTH_AMERICA: 'game-icons:earth-america',
			CONT_SOUTH_AMERICA: 'game-icons:earth-america',
		};
		const iconifyName = continentIconName[entry.id];
		const continentSize = Math.round(size * 1.6);
		return {
			style: { backgroundColor: '#ffffff' },
			iconNode: iconifyName ? (
				<Icon icon={iconifyName} width={continentSize} height={continentSize} style={{ color: iconColor }} />
			) : (
				<Globe size={continentSize} className="opacity-90" fill="none" stroke={iconColor} strokeWidth={2.6} />
			),
			iconColor,
		};
	}

	// Final exhaustive case: FLAVORS
	const iconColor = getFlavorSubclassIconColor(entry.details.subclass);
	const flavorSize = Math.round(size * 1.3);
	return {
		style: {
			backgroundColor: entry.color || '#444',
			boxShadow: `0 0 0 2px ${iconColor}`,
		},
		iconNode: (
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
