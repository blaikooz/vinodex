import React, { useEffect, useState } from 'react';
import { ClimateClass, EntryCategory, WineEntry } from '../types';
import { ChevronRight, Droplet, Heart, Sun, Cloud, Castle, Mountain, Triangle, Sparkles, Circle, Shield, Grape, Leaf, Flame, Zap, Globe, Cherry, Wine, Citrus, Flower2, Apple, Sprout, Gem, Trees, Wind, GlassWater, Droplets, Scale, Box, MapPin } from 'lucide-react';
import { getStylePalette } from '../stylePalette';
import { CLIMATE_CLASS_MAP } from '../data/climateClasses';
import { getFlagGradient } from '../data/flagGradients';
import { getFlagImage } from '../data/flagImages';
import { GRAPES } from '../data/grapes';
import { loadAllEntries } from '../src/services/wineData';

type FilterMode = 'REGION' | 'TYPE' | 'TASTING' | 'SOIL' | 'ORIGIN' | 'RARITY' | 'SYSTEM' | 'CLIMATE' | null;

interface EntryTileProps {
  entry: WineEntry;
  onPress: (entry: WineEntry) => void;
  index: number;
  onFilterByRarity?: (rarity: string) => void;
  onFilterByType?: (type: string, targetCategory?: EntryCategory) => void;
  onFilterByNote?: (note: string, targetCategory?: EntryCategory, mode?: FilterMode) => void;
  onFilterByOrigin?: (origin: string) => void;
  onFilterByClimate?: (climate: ClimateClass) => void;
}

// Generic icons for non-grape entries
const ICON_MAP: Record<string, React.ReactNode> = {
  droplet: <Droplet size={20} fill="currentColor" className="text-white opacity-90" />,
  heart: <Heart size={20} fill="currentColor" className="text-white opacity-90" />,
  sun: <Sun size={20} fill="currentColor" className="text-white opacity-90" />,
  cloud: <Cloud size={20} fill="currentColor" className="text-white opacity-90" />,
  castle: <Castle size={20} fill="currentColor" className="text-white opacity-90" />,
  mountain: <Mountain size={20} fill="currentColor" className="text-white opacity-90" />,
  triangle: <Triangle size={20} fill="currentColor" className="text-white opacity-90" />,
  sparkles: <Sparkles size={20} fill="currentColor" className="text-white opacity-90" />,
  circle: <Circle size={20} fill="currentColor" className="text-white opacity-90" />,
  shield: <Shield size={20} fill="currentColor" className="text-white opacity-90" />,
  leaf: <Leaf size={20} fill="currentColor" className="text-white opacity-90" />,
  flame: <Flame size={20} fill="currentColor" className="text-white opacity-90" />,
  zap: <Zap size={20} fill="currentColor" className="text-white opacity-90" />,
  flower: <Flower2 size={20} fill="currentColor" className="text-white opacity-90" />,
  fruit: <Apple size={20} fill="currentColor" className="text-white opacity-90" />,
  herb: <Sprout size={20} fill="currentColor" className="text-white opacity-90" />,
  spice: <Flame size={20} fill="currentColor" className="text-white opacity-90" />,
  mineral: <Gem size={20} fill="currentColor" className="text-white opacity-90" />,
  oak: <Trees size={20} fill="currentColor" className="text-white opacity-90" />,
  smoke: <Wind size={20} fill="currentColor" className="text-white opacity-90" />,
  citrus: <Citrus size={20} fill="currentColor" className="text-white opacity-90" />,
  honey: <Sparkles size={20} fill="currentColor" className="text-white opacity-90" />,
  tropical: <Sun size={20} fill="currentColor" className="text-white opacity-90" />,
  nut: <Triangle size={20} fill="currentColor" className="text-white opacity-90" />,
  stone: <Mountain size={20} fill="currentColor" className="text-white opacity-90" />,
  default: <Grape size={20} fill="currentColor" className="text-white opacity-90" />
};

const isLightColor = (hex: string) => {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) > 160;
};

const getClimateStyle = (climate?: ClimateClass) => {
  if (!climate) return null;
  const meta = CLIMATE_CLASS_MAP[climate];
  if (!meta) return null;
  return { backgroundColor: meta.colors.bg, borderColor: meta.colors.border, color: meta.colors.text };
};

const normalizeEntryKey = (value: string) =>
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

type FlavorSubclassColorMap = Map<string, string>;
let cachedFlavorSubclassColorMap: FlavorSubclassColorMap | null = null;
let flavorSubclassColorMapPromise: Promise<FlavorSubclassColorMap> | null = null;

const GRAPE_ICON_COLOR_BY_NAME = (() => {
  const map = new Map<string, string>();
  for (const grape of GRAPES) {
    const iconColor = grape.tastingProfile?.[0]?.color;
    if (!iconColor) continue;
    map.set(normalizeEntryKey(grape.name), iconColor);
    for (const synonym of grape.details.synonyms || []) {
      map.set(normalizeEntryKey(synonym), iconColor);
    }
  }
  return map;
})();

const getRegionMainGrapeIconColor = (entry: WineEntry) => {
  const notableGrapes = entry.details.notableGrapes || [];
  for (const grapeName of notableGrapes) {
    const color = GRAPE_ICON_COLOR_BY_NAME.get(normalizeEntryKey(grapeName));
    if (color) return color;
  }
  return undefined;
};

// Get grape icon color based on wine type and body - red grapes get red shades, white grapes get gold shades
const getGrapeIconColor = (wineType: string | undefined, body: string | undefined) => {
  const palette = getStylePalette(wineType);
  if (palette) return palette.primary;

  if (!wineType) return '#78716c';
  
  const type = wineType.toLowerCase();
  const bodyLevel = body?.toLowerCase() || 'medium';
  
  // Red wines - shades of red based on body
  if (type.includes('red') || type.includes('bold')) {
    if (bodyLevel.includes('light')) return '#DC143C'; // Crimson - lighter body
    if (bodyLevel.includes('full')) return '#4A0E0E'; // Deep burgundy - full body
    return '#8B0000'; // Dark red - medium body
  }
  
  // White wines - shades of yellow/gold based on body
  if (type.includes('white') || type.includes('aromatic')) {
    if (bodyLevel.includes('light')) return '#FAFAD2'; // Light goldenrod - lighter body
    if (bodyLevel.includes('full')) return '#B8860B'; // Dark goldenrod - full body
    return '#DAA520'; // Goldenrod - medium body
  }
  
  // Rosé wines - pink shades
  if (type.includes('rosé') || type.includes('rose')) {
    return '#DB7093'; // Pale violet red
  }
  
  // Sweet wines
  if (type.includes('sweet')) {
    return '#CD853F'; // Peru/amber
  }
  
  return '#78716c'; // Default stone color
};

// Get wine type text style for badge
const getWineTypeStyle = (wineType: string | undefined) => {
  const palette = getStylePalette(wineType);
  if (palette) {
    const textColor = isLightColor(palette.primary) ? palette.secondary : '#fff';
    return { bg: '', text: '', border: '', style: { backgroundColor: palette.primary, borderColor: palette.secondary, color: textColor } as React.CSSProperties };
  }

  if (!wineType) return { bg: 'bg-stone-600', text: 'text-stone-200', border: 'border-stone-500' };
  
  const type = wineType.toLowerCase();
  
  if (type.includes('red') || type.includes('bold')) {
    return { bg: 'bg-red-900', text: 'text-red-300', border: 'border-red-700' };
  }
  if (type.includes('white') || type.includes('aromatic')) {
    return { bg: 'bg-amber-800', text: 'text-amber-200', border: 'border-amber-600' };
  }
  if (type.includes('rosé') || type.includes('rose')) {
    return { bg: 'bg-pink-800', text: 'text-pink-200', border: 'border-pink-600' };
  }
  if (type.includes('sparkling')) {
    return { bg: 'bg-yellow-700', text: 'text-yellow-100', border: 'border-yellow-500' };
  }
  if (type.includes('sweet')) {
    return { bg: 'bg-orange-800', text: 'text-orange-200', border: 'border-orange-600' };
  }
  
  return { bg: 'bg-stone-600', text: 'text-stone-200', border: 'border-stone-500' };
};

// Get icon based on wine type
const getGrapeIcon = (entry: WineEntry): React.ReactNode => {
  const wineType = entry.wineType?.toLowerCase() || '';

  if (wineType.includes('full-bodied red') || wineType.includes('full bodied red')) {
    return <Wine size={20} fill="currentColor" className="text-white opacity-90" />;
  }
  if (wineType.includes('bright red')) {
    return <Sparkles size={20} fill="currentColor" className="text-white opacity-90" />;
  }
  if (wineType.includes('light-bodied red') || wineType.includes('light bodied red')) {
    return <GlassWater size={20} fill="currentColor" className="text-white opacity-90" />;
  }
  if (wineType.includes('dark red')) {
    return <Grape size={20} fill="currentColor" className="text-white opacity-90" />;
  }
  if (wineType.includes('medium-bodied red') || wineType.includes('medium bodied red')) {
    return <Scale size={20} className="text-white opacity-90" />;
  }
  if (wineType.includes('pink') || wineType.includes('rosé') || wineType.includes('rose')) {
    return <Droplets size={20} className="text-white opacity-90" />;
  }

  if (wineType.includes('light-bodied white') || wineType.includes('light bodied white')) {
    return <GlassWater size={20} fill="currentColor" className="text-white opacity-90" />;
  }
  if (wineType.includes('aromatic white')) {
    return <Wind size={20} className="text-white opacity-90" />;
  }
  if (wineType.includes('high-acid white') || wineType.includes('high acid white')) {
    return <Citrus size={20} fill="currentColor" className="text-white opacity-90" />;
  }
  if (wineType.includes('full-bodied white') || wineType.includes('full bodied white')) {
    return <Box size={20} className="text-white opacity-90" />;
  }
  if (wineType.includes('sweet white')) {
    return <Sun size={20} fill="currentColor" className="text-white opacity-90" />;
  }
  if (wineType.includes('medium-bodied white') || wineType.includes('medium bodied white')) {
    return <Circle size={20} fill="currentColor" className="text-white opacity-90" />;
  }

  return <Grape size={20} fill="currentColor" className="text-white opacity-90" />;
};

const getGrapeFlavorIcon = (entry: WineEntry, iconColor?: string, outlineColor?: string): React.ReactNode => {
  const note = entry.tastingProfile?.[0];
  const outlineFilter = outlineColor
    ? `drop-shadow(1px 0 0 ${outlineColor}) drop-shadow(-1px 0 0 ${outlineColor}) drop-shadow(0 1px 0 ${outlineColor}) drop-shadow(0 -1px 0 ${outlineColor})`
    : undefined;

  if (!note) {
    const fallback = getGrapeIcon(entry);
    return React.isValidElement(fallback)
      ? React.cloneElement(fallback as React.ReactElement, {
          style: {
            ...(fallback.props.style || {}),
            ...(iconColor ? { color: iconColor } : {}),
            ...(outlineFilter ? { filter: outlineFilter } : {}),
          },
        })
      : fallback;
  }
  const IconComp = ICON_MAP[note.icon] || ICON_MAP['default'];
  return React.isValidElement(IconComp)
    ? React.cloneElement(IconComp as React.ReactElement, {
        className: 'opacity-90',
        style: {
          color: iconColor || note.color,
          ...(outlineFilter ? { filter: outlineFilter } : {})
        },
      })
    : IconComp;
};

const getStyleClassType = (name: string, classification?: string) => {
  const normalized = name.toLowerCase();
  const classOverride = classification?.toUpperCase();

  if (classOverride === 'ORIGIN' || classOverride === 'METHOD' || classOverride === 'TYPE' || classOverride === 'BLEND') return classOverride;

  const originKeywords = ['champagne', 'port', 'sherry', 'prosecco', 'crémant', 'cremant', 'cru beaujolais', 'super tuscan'];
  const methodKeywords = ['sparkling', 'fortified', 'dessert', 'late harvest', 'ice wine', 'botrytis', 'pétillant', 'petillant', 'natural wine', 'orange wine'];
  const typeKeywords = ['full-bodied', 'full bodied', 'light-bodied', 'light bodied', 'medium-bodied', 'medium bodied', 'aromatic', 'white', 'red', 'rosé', 'rose', 'sweet white', 'sparkling wine'];

  if (originKeywords.some(k => normalized.includes(k))) return 'ORIGIN';
  if (typeKeywords.some(k => normalized.includes(k))) return 'TYPE';
  if (methodKeywords.some(k => normalized.includes(k))) return 'METHOD';
  return 'STYLE';
};

const getClassTypeStyle = (type: 'STYLE' | 'METHOD' | 'ORIGIN' | 'TYPE' | 'BLEND' | undefined) => {
  switch (type) {
    case 'STYLE': return { bg: 'bg-stone-900', text: 'text-green-200', border: 'border-green-500' };
    case 'METHOD': return { bg: 'bg-indigo-900', text: 'text-purple-100', border: 'border-purple-500' };
    case 'ORIGIN': return { bg: 'bg-amber-900', text: 'text-amber-100', border: 'border-amber-600' };
    case 'TYPE': return { bg: 'bg-slate-900', text: 'text-cyan-100', border: 'border-cyan-500' };
    case 'BLEND': return { bg: 'bg-violet-900', text: 'text-orange-100', border: 'border-orange-500' };
    default: return { bg: 'bg-stone-900', text: 'text-green-200', border: 'border-green-500' };
  }
};

const getColorType = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('orange')) return 'ORANGE';
  if (n.includes('rosé') || n.includes('rose')) return 'ROSÉ';
  if (n.includes('red')) return 'RED';
  if (n.includes('white')) return 'WHITE';
  return 'DUAL';
};

const getColorTypeStyle = (type?: string) => {
  switch (type) {
    case 'RED': return { bg: 'bg-[#4A0E0E]', text: 'text-rose-100', border: 'border-[#8B0000]' }; // full-bodied red palette
    case 'WHITE': return { bg: 'bg-[#FAFAD2]', text: 'text-amber-900', border: 'border-[#DAA520]' }; // light-bodied white palette
    case 'ROSÉ': return { bg: 'bg-pink-900', text: 'text-pink-100', border: 'border-pink-600' };
    case 'ORANGE': return { bg: 'bg-amber-950', text: 'text-amber-100', border: 'border-amber-600' };
    case 'DUAL': return { bg: 'bg-[#501237]', text: 'text-pink-100', border: 'border-[#f472b6]' };
    default: return { bg: 'bg-stone-700', text: 'text-stone-200', border: 'border-stone-500' };
  }
};

const getStyleColorTypeColor = (type?: string) => {
  switch (type) {
    case 'RED': return '#8B0000'; // full-bodied red inner icon
    case 'WHITE': return '#FAFAD2'; // light-bodied white inner icon
    case 'ROSÉ': return '#f9a8d4';
    case 'ORANGE': return '#fdba74';
    case 'DUAL': return '#f472b6'; // pink inner icon
    default: return '#e5e7eb';
  }
};

const getStyleClassBgColor = (entry: WineEntry) => {
  const classType = getStyleClassType(entry.name, entry.details.classification);
  switch (classType) {
    case 'METHOD': return '#312e81';
    case 'ORIGIN': return '#7c2d12';
    case 'TYPE': return '#0f172a';
    case 'STYLE': return '#064e3b';
    case 'BLEND': return '#1d1b47';
    default: return entry.color || '#78716c';
  }
};

// Style icon helpers - decide icon and background by class and color type
const getStyleIconByClass = (entry: WineEntry, colorType?: string): React.ReactNode => {
  const classType = getStyleClassType(entry.name, entry.details.classification);
  const iconColor = getStyleColorTypeColor(colorType);

  if (classType === 'METHOD') return <Sparkles size={20} fill="currentColor" style={{ color: iconColor }} />;
  if (classType === 'ORIGIN') return <MapPin size={20} style={{ color: iconColor }} />;
  if (classType === 'TYPE') return <Shield size={20} fill="currentColor" style={{ color: iconColor }} />;

  switch (getColorType(entry.name)) {
    case 'RED': return <Wine size={20} fill="currentColor" style={{ color: iconColor }} />;
    case 'WHITE': return <GlassWater size={20} fill="currentColor" style={{ color: iconColor }} />;
    case 'ROSÉ': return <Droplets size={20} style={{ color: iconColor }} />;
    case 'ORANGE': return <Sun size={20} fill="currentColor" style={{ color: iconColor }} />;
    default: return <Grape size={20} fill="currentColor" style={{ color: iconColor }} />;
  }
};

const getFlavorClassStyle = (cls?: string) => {
  switch ((cls || '').toUpperCase()) {
    case 'SWEET': return { bg: 'bg-amber-900', text: 'text-amber-100', border: 'border-amber-600' };
    case 'SOUR': return { bg: 'bg-lime-900', text: 'text-lime-100', border: 'border-lime-600' };
    case 'SALTY': return { bg: 'bg-sky-900', text: 'text-sky-100', border: 'border-sky-600' };
    case 'BITTER': return { bg: 'bg-purple-900', text: 'text-purple-100', border: 'border-purple-600' };
    case 'UMAMI': return { bg: 'bg-emerald-900', text: 'text-emerald-100', border: 'border-emerald-600' };
    default: return { bg: 'bg-stone-700', text: 'text-stone-200', border: 'border-stone-500' };
  }
};

const getFlavorSubclassStyle = (sub?: string) => {
  switch ((sub || '').toUpperCase()) {
    case 'CITRUS': return { bg: 'bg-orange-950', text: 'text-orange-50', border: 'border-orange-500' };
    case 'ORCHARD_FRUIT': return { bg: 'bg-lime-900', text: 'text-lime-100', border: 'border-lime-500' };
    case 'STONE_FRUIT': return { bg: 'bg-amber-900', text: 'text-amber-50', border: 'border-amber-500' };
    case 'TROPICAL': return { bg: 'bg-yellow-900', text: 'text-yellow-100', border: 'border-yellow-500' };
    case 'RED_FRUIT': return { bg: 'bg-red-950', text: 'text-red-100', border: 'border-red-600' };
    case 'DARK_FRUIT': return { bg: 'bg-purple-950', text: 'text-purple-100', border: 'border-purple-600' };
    case 'BERRY': return { bg: 'bg-rose-950', text: 'text-rose-100', border: 'border-rose-600' };
    case 'HERBAL': return { bg: 'bg-teal-900', text: 'text-teal-100', border: 'border-teal-500' };
    case 'VEGETAL': return { bg: 'bg-emerald-950', text: 'text-emerald-100', border: 'border-emerald-600' };
    case 'SPICE': return { bg: 'bg-amber-950', text: 'text-amber-100', border: 'border-amber-600' };
    case 'BAKING': return { bg: 'bg-orange-950', text: 'text-orange-100', border: 'border-orange-400' };
    case 'FLORAL': return { bg: 'bg-pink-950', text: 'text-pink-100', border: 'border-pink-500' };
    case 'EARTH': return { bg: 'bg-stone-900', text: 'text-stone-100', border: 'border-stone-500' };
    case 'WOOD': return { bg: 'bg-amber-950/80', text: 'text-amber-100', border: 'border-amber-700' };
    case 'MARINE': return { bg: 'bg-sky-950', text: 'text-sky-100', border: 'border-sky-600' };
    case 'WAX': return { bg: 'bg-amber-900', text: 'text-amber-100', border: 'border-amber-500' };
    case 'NUT': return { bg: 'bg-yellow-950', text: 'text-yellow-100', border: 'border-yellow-600' };
    default: return { bg: 'bg-stone-700', text: 'text-stone-200', border: 'border-stone-500' };
  }
};

const getFlavorSubclassColor = (sub?: string) => {
  switch ((sub || '').toUpperCase()) {
    case 'CITRUS': return '#f97316';
    case 'ORCHARD_FRUIT': return '#84cc16';
    case 'STONE_FRUIT': return '#fb923c';
    case 'TROPICAL': return '#eab308';
    case 'RED_FRUIT': return '#ef4444';
    case 'DARK_FRUIT': return '#8b5cf6';
    case 'BERRY': return '#e11d48';
    case 'HERBAL': return '#34d399';
    case 'VEGETAL': return '#22c55e';
    case 'SPICE': return '#d97706';
    case 'BAKING': return '#c08457';
    case 'FLORAL': return '#ec4899';
    case 'EARTH': return '#78716c';
    case 'WOOD': return '#8b5a2b';
    case 'MARINE': return '#0ea5e9';
    case 'WAX': return '#f59e0b';
    case 'NUT': return '#eab308';
    default: return '#e5e7eb';
  }
};

const loadFlavorSubclassColorMap = async (): Promise<FlavorSubclassColorMap> => {
  if (cachedFlavorSubclassColorMap) return cachedFlavorSubclassColorMap;
  if (flavorSubclassColorMapPromise) return flavorSubclassColorMapPromise;

  flavorSubclassColorMapPromise = loadAllEntries()
    .then((entries) => {
      const map: FlavorSubclassColorMap = new Map();
      for (const flavor of entries) {
        if (flavor.category !== 'FLAVORS') continue;
        const subclassColor = getFlavorSubclassColor(flavor.details.subclass);
        map.set(normalizeEntryKey(flavor.name), subclassColor);
        for (const synonym of flavor.details.synonyms || []) {
          map.set(normalizeEntryKey(synonym), subclassColor);
        }
      }
      cachedFlavorSubclassColorMap = map;
      return map;
    })
    .catch(() => new Map())
    .finally(() => {
      flavorSubclassColorMapPromise = null;
    });

  return flavorSubclassColorMapPromise;
};

const formatLabel = (label?: string) => {
  if (!label) return '';
  return label
    .toLowerCase()
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const formatLabelUpper = (label?: string) => {
  if (!label) return '';
  return label.replace(/_/g, ' ').toUpperCase();
};

const formatTitle = (value?: string) => {
  if (!value) return '';
  return value
    .split(/[\s_-]+/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const formatUpper = (value?: string) => {
  if (!value) return '';
  return value.replace(/_/g, ' ').toUpperCase();
};

// Get country color
const getCountryColor = (country: string) => {
  const colors: Record<string, { bg: string, text: string, border: string }> = {
    'France': { bg: 'bg-blue-900', text: 'text-blue-100', border: 'border-blue-600' },
    'Italy': { bg: 'bg-emerald-900', text: 'text-emerald-100', border: 'border-emerald-700' },
    'Spain': { bg: 'bg-red-900', text: 'text-red-100', border: 'border-red-700' },
    'USA': { bg: 'bg-indigo-900', text: 'text-indigo-100', border: 'border-indigo-700' },
    'Germany': { bg: 'bg-amber-900', text: 'text-amber-100', border: 'border-amber-700' },
    'Portugal': { bg: 'bg-green-900', text: 'text-green-100', border: 'border-green-700' },
    'Australia': { bg: 'bg-orange-900', text: 'text-orange-100', border: 'border-orange-700' },
    'New Zealand': { bg: 'bg-teal-900', text: 'text-teal-100', border: 'border-teal-700' },
    'Argentina': { bg: 'bg-sky-900', text: 'text-sky-100', border: 'border-sky-700' },
    'Chile': { bg: 'bg-rose-900', text: 'text-rose-100', border: 'border-rose-700' },
    'South Africa': { bg: 'bg-orange-800', text: 'text-orange-50', border: 'border-orange-600' },
    'Austria': { bg: 'bg-fuchsia-900', text: 'text-fuchsia-100', border: 'border-fuchsia-700' },
    'Greece': { bg: 'bg-cyan-900', text: 'text-cyan-100', border: 'border-cyan-700' },
    'Hungary': { bg: 'bg-lime-900', text: 'text-lime-100', border: 'border-lime-700' },
    'Canada': { bg: 'bg-red-800', text: 'text-red-50', border: 'border-red-600' },
    'China': { bg: 'bg-yellow-800', text: 'text-yellow-50', border: 'border-yellow-600' },
    'Japan': { bg: 'bg-rose-800', text: 'text-rose-50', border: 'border-rose-600' },
    'India': { bg: 'bg-amber-800', text: 'text-amber-50', border: 'border-amber-600' },
    'Georgia': { bg: 'bg-amber-900', text: 'text-amber-50', border: 'border-amber-600' },
    'Uruguay': { bg: 'bg-purple-900', text: 'text-purple-100', border: 'border-purple-700' },
    'Croatia': { bg: 'bg-blue-800', text: 'text-blue-50', border: 'border-blue-600' },
  };
  return colors[country] || { bg: 'bg-stone-700', text: 'text-stone-200', border: 'border-stone-500' };
};

const getCountryHex = (country?: string) => {
  const map: Record<string, { bg: string; border: string; text: string }> = {
    france: { bg: '#1f3f99', border: '#3b82f6', text: '#dbeafe' },
    italy: { bg: '#14532d', border: '#16a34a', text: '#bbf7d0' },
    spain: { bg: '#7f1d1d', border: '#ef4444', text: '#fecdd3' },
    usa: { bg: '#312e81', border: '#6366f1', text: '#e0e7ff' },
    germany: { bg: '#713f12', border: '#f59e0b', text: '#fef3c7' },
    portugal: { bg: '#065f46', border: '#10b981', text: '#d1fae5' },
    australia: { bg: '#7c2d12', border: '#f97316', text: '#ffedd5' },
    'new zealand': { bg: '#0f172a', border: '#14b8a6', text: '#99f6e4' },
    argentina: { bg: '#0ea5e9', border: '#38bdf8', text: '#ecfeff' },
    chile: { bg: '#7f1d1d', border: '#f97316', text: '#fee2e2' },
    'south africa': { bg: '#312e81', border: '#a21caf', text: '#e0e7ff' },
    austria: { bg: '#831843', border: '#f472b6', text: '#ffe4e6' },
    greece: { bg: '#0e7490', border: '#22d3ee', text: '#e0f2fe' },
    hungary: { bg: '#365314', border: '#84cc16', text: '#f7fee7' },
    canada: { bg: '#7f1d1d', border: '#ef4444', text: '#fee2e2' },
    china: { bg: '#854d0e', border: '#f59e0b', text: '#fffbeb' },
    japan: { bg: '#9f1239', border: '#f472b6', text: '#fff1f2' },
    india: { bg: '#713f12', border: '#f59e0b', text: '#fef3c7' },
    uruguay: { bg: '#312e81', border: '#8b5cf6', text: '#ede9fe' },
    croatia: { bg: '#1e293b', border: '#3b82f6', text: '#e0f2fe' },
  };
  if (!country) return { bg: '#374151', border: '#4b5563', text: '#e5e7eb' };
  const key = country.toLowerCase();
  return map[key] || { bg: '#374151', border: '#4b5563', text: '#e5e7eb' };
};

const getClassificationHex = (classification?: string) => {
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
  return map[key] || '#4b5563';
};

const getClassificationStyle = (classification?: string) => {
  const map: Record<string, { bg: string; text: string; border: string }> = {
    'AOC': { bg: 'bg-red-950', text: 'text-red-100', border: 'border-red-700' },
    'DOCG': { bg: 'bg-amber-950', text: 'text-amber-100', border: 'border-amber-700' },
    'DOC': { bg: 'bg-orange-950', text: 'text-orange-100', border: 'border-orange-700' },
    'DOCA': { bg: 'bg-yellow-950', text: 'text-yellow-100', border: 'border-yellow-700' },
    'AVA': { bg: 'bg-indigo-950', text: 'text-indigo-100', border: 'border-indigo-700' },
    'GI': { bg: 'bg-emerald-950', text: 'text-emerald-100', border: 'border-emerald-700' },
    'PDO': { bg: 'bg-purple-950', text: 'text-purple-100', border: 'border-purple-700' },
    'PGI': { bg: 'bg-teal-950', text: 'text-teal-100', border: 'border-teal-700' },
    'IGP': { bg: 'bg-lime-950', text: 'text-lime-100', border: 'border-lime-700' },
  };
  const key = classification?.toUpperCase() || '';
  return map[key] || { bg: 'bg-stone-700', text: 'text-stone-200', border: 'border-stone-500' };
};

const getIconInnerColor = (wineType?: string) => {
  const palette = getStylePalette(wineType);
  if (palette) return palette.secondary;

  const t = wineType?.toLowerCase() || '';
  if (t.includes('full-bodied red') || t.includes('full bodied red')) return '#5a0f18'; // Deep Garnet
  if (t.includes('bright red')) return '#dc143c'; // Crimson
  if (t.includes('light-bodied red') || t.includes('light bodied red')) return '#8b3f4c'; // Rosewood
  if (t.includes('dark red')) return '#70193d'; // Mulberry
  if (t.includes('medium-bodied red') || t.includes('medium bodied red')) return '#e96b6b'; // Coral Rose
  if (t.includes('pink') || t.includes('rosé') || t.includes('rose')) return '#f6b6c0'; // Blush
  if (t.includes('light-bodied white') || t.includes('light bodied white')) return '#d4e6a5'; // Pale Celery
  if (t.includes('aromatic white')) return '#daa520'; // Goldenrod
  if (t.includes('high-acid white') || t.includes('high acid white')) return '#f8f7f4'; // Chalk White
  if (t.includes('full-bodied white') || t.includes('full bodied white')) return '#f4a261'; // Apricot
  if (t.includes('sweet white')) return '#b5651d'; // Caramel
  if (t.includes('medium-bodied white') || t.includes('medium bodied white')) return '#d6bfa3'; // Warm Sand
  return '#ffffff';
};

const EntryTile: React.FC<EntryTileProps> = ({ entry, onPress, index, onFilterByRarity, onFilterByType, onFilterByNote, onFilterByOrigin, onFilterByClimate }) => {
  const isGrape = entry.category === 'GRAPES';
  const isRegion = entry.category === 'REGIONS';
  const isCountryGate = entry.category === 'COUNTRY_GATE';
  const isStyle = entry.category === 'STYLES';
  const isFlavor = entry.category === 'FLAVORS';
  const grapeCard = entry.grapeCard;
  const climateMeta = entry.climate ? CLIMATE_CLASS_MAP[entry.climate] : undefined;
  const countryColorsHex = isRegion ? getCountryHex(entry.details.origin) : null;
  const systemColor = isRegion ? getClassificationHex(entry.details.classification) : undefined;
  const climateOutline = isRegion ? (climateMeta?.colors.border || climateMeta?.colors.bg) : undefined;
  const regionIconColor = isRegion ? (getRegionMainGrapeIconColor(entry) || systemColor || '#e5e7eb') : undefined;
  const originLabel = entry.details.origin || '';
  const grapeOriginStyle = isGrape && originLabel ? getCountryColor(originLabel) : null;
  const [flavorSubclassColorMap, setFlavorSubclassColorMap] = useState<FlavorSubclassColorMap | null>(cachedFlavorSubclassColorMap);

  useEffect(() => {
    if (!isGrape || flavorSubclassColorMap) return;
    let active = true;
    loadFlavorSubclassColorMap()
      .then((map) => {
        if (active) setFlavorSubclassColorMap(map);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [isGrape, flavorSubclassColorMap]);
  
  // Get icon and color for grapes based on wine type
  const wineTypeStyle = isGrape ? getWineTypeStyle(grapeCard?.style || entry.wineType) : null;
  const grapeTypeColor = isGrape ? getGrapeIconColor(grapeCard?.style || entry.wineType, entry.details.body) : undefined;
  const firstGrapeFlavorNote = isGrape ? entry.tastingProfile?.[0] : undefined;
  const grapeFlavorIconColor = isGrape
    ? (firstGrapeFlavorNote?.note ? flavorSubclassColorMap?.get(normalizeEntryKey(firstGrapeFlavorNote.note)) : undefined) || firstGrapeFlavorNote?.color
    : undefined;
  const grapeIconOutlineColor = grapeTypeColor ? darkenHex(grapeTypeColor, 0.4) : undefined;
  const grapeIconElement = isGrape
    ? getGrapeFlavorIcon({ ...entry, wineType: grapeCard?.style || entry.wineType } as WineEntry, grapeFlavorIconColor, grapeIconOutlineColor)
    : null;
  const genericIcon = ICON_MAP[entry.icon || 'default'] || ICON_MAP['default'];
  const styleClassType = isStyle ? getStyleClassType(entry.name, entry.details.classification) : undefined;
  const styleColorType = isStyle ? getColorType(entry.name) : undefined;
  const styleIconElement = isStyle ? getStyleIconByClass(entry, styleColorType) : null;
  
  // Get country for regions
  const country = entry.details.origin || '';
  const countryStyle = isRegion ? getCountryColor(country) : null;
  const styleClassStyle = getClassTypeStyle(styleClassType as 'STYLE' | 'METHOD' | 'ORIGIN' | 'TYPE' | 'BLEND' | undefined);
  const styleColorStyle = getColorTypeStyle(styleColorType);
  const styleCountryStyle = entry.details.origin ? getCountryColor(entry.details.origin) : null;
  const flavorClassStyle = isFlavor ? getFlavorClassStyle(entry.details.classification) : null;
  const flavorSubclassStyle = isFlavor ? getFlavorSubclassStyle(entry.details.subclass) : null;
  const flavorSubclassColor = isFlavor ? getFlavorSubclassColor(entry.details.subclass) : undefined;
  const rarityValue = entry.rarity || (grapeCard?.rarityTier ? grapeCard.rarityTier.toUpperCase() : undefined);

  const getRarityStyle = (rarity: string) => {
    switch (rarity) {
      case 'COMMON': return 'bg-stone-600 text-stone-200 border-stone-500';
      case 'UNCOMMON': return 'bg-green-900 text-green-300 border-green-700';
      case 'RARE': return 'bg-blue-900 text-blue-300 border-blue-700';
      case 'NOBLE': return 'bg-purple-900 text-purple-200 border-purple-700';
      default: return 'bg-stone-600 text-stone-200 border-stone-500';
    }
  };

  // Determine icon background color - grapes use wine type/body color
  const getIconBgColor = () => {
    if (isGrape) {
      return grapeTypeColor || getGrapeIconColor(grapeCard?.style || entry.wineType, entry.details.body);
    }
    if (isStyle) {
      return getStyleClassBgColor(entry);
    }
    return entry.color || '#78716c';
  };

  const getIconStyle = () => {
    if (isCountryGate) {
      const origin = entry.details.origin || entry.name;
      const gradient = getFlagGradient(origin);
      const image = getFlagImage(origin);
      return {
        backgroundImage: image ? `url(${image})` : gradient,
        backgroundSize: image ? 'cover' : undefined,
        backgroundPosition: image ? 'center' : undefined,
        color: '#fff'
      } as React.CSSProperties;
    }
    if (isRegion && countryColorsHex) {
      const origin = entry.details.origin || entry.name;
      const gradient = getFlagGradient(origin);
      const image = getFlagImage(origin);
      return {
        backgroundImage: image ? `url(${image})` : gradient,
        backgroundSize: image ? 'cover' : undefined,
        backgroundPosition: image ? 'center' : undefined,
        boxShadow: climateOutline ? `0 0 0 2px ${climateOutline}` : undefined,
      } as React.CSSProperties;
    }
    if (isStyle && entry.details.origin && !isVariousOrigin(entry.details.origin)) {
      const gradient = getFlagGradient(entry.details.origin);
      const image = getFlagImage(entry.details.origin);
      if (image || gradient) {
        return {
          backgroundImage: image ? `url(${image})` : gradient,
          backgroundSize: image ? 'cover' : undefined,
          backgroundPosition: image ? 'center' : undefined,
        } as React.CSSProperties;
      }
    }
    if (isFlavor) {
      return {
        backgroundColor: getIconBgColor(),
        boxShadow: flavorSubclassColor ? `0 0 0 2px ${flavorSubclassColor}` : undefined
      } as React.CSSProperties;
    }
    return { backgroundColor: getIconBgColor() } as React.CSSProperties;
  };

  const renderedIcon = isCountryGate
    ? null
    : isGrape && React.isValidElement(grapeIconElement)
      ? grapeIconElement
      : isStyle && React.isValidElement(styleIconElement)
        ? styleIconElement
      : isRegion && React.isValidElement(genericIcon)
          ? React.cloneElement(genericIcon as React.ReactElement, {
              style: {
                color: regionIconColor || '#fff',
                filter: 'drop-shadow(1px 0 0 #000) drop-shadow(-1px 0 0 #000) drop-shadow(0 1px 0 #000) drop-shadow(0 -1px 0 #000)'
              }
            })
      : isFlavor && React.isValidElement(genericIcon)
        ? React.cloneElement(genericIcon as React.ReactElement, {
            style: {
              color: flavorSubclassColor,
              filter: flavorSubclassColor
                ? `drop-shadow(1px 0 0 ${flavorSubclassColor}) drop-shadow(-1px 0 0 ${flavorSubclassColor}) drop-shadow(0 1px 0 ${flavorSubclassColor}) drop-shadow(0 -1px 0 ${flavorSubclassColor})`
                : undefined
            }
          })
        : genericIcon;

  return (
    <button
      onClick={() => onPress(entry)}
      className="w-full bg-stone-900 border-2 border-stone-700 hover:border-green-500 rounded p-2 flex items-center gap-3 relative overflow-hidden group min-h-[4.5rem] transition-all active:translate-y-0.5"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Decorative Corner */}
      <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-stone-600 group-hover:border-green-400 transition-colors"></div>
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-stone-600 group-hover:border-green-400 transition-colors"></div>

      {/* Left: Large Icon Identifier */}
      <div 
        className="shrink-0 w-12 h-12 rounded-lg shadow-inner flex items-center justify-center border-2 border-black/20 self-start"
        style={getIconStyle()}
      >
        {renderedIcon}
      </div>
      
      {/* Middle: Title and Tags */}
      <div className="flex flex-col flex-1 min-w-0 justify-center h-full items-start py-1">
          {/* Title - Optimized for wrapping without truncation */}
          <h3 className="font-retro text-base text-white leading-tight group-hover:text-green-400 transition-colors w-full text-left mb-2 tracking-tight whitespace-normal break-words">
            {entry.name.toUpperCase()}
          </h3>

          {/* Tags Row - Different based on category */}
          <div className="flex flex-wrap gap-1.5 w-full items-center">
              {/* GRAPES: Show Type and Rarity */}
              {isGrape && (
                <>
                  {/* Wine Type Tag */}
                  {grapeCard?.style && wineTypeStyle && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onFilterByType?.(grapeCard.style, 'GRAPES'); }}
                      className={`px-1.5 py-0.5 text-[9px] font-mono border rounded-sm tracking-wide shrink-0 ${wineTypeStyle.bg} ${wineTypeStyle.text} ${wineTypeStyle.border}`}
                      style={wineTypeStyle.style}
                    >
                      {grapeCard.style.toUpperCase()}
                    </button>
                  )}
                  {/* Rarity Tag */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const rarity = rarityValue;
                      if (rarity) onFilterByRarity?.(rarity);
                    }}
                    className={`px-1.5 py-0.5 text-[9px] font-mono border rounded-sm tracking-wide shrink-0 ${getRarityStyle(rarityValue || 'COMMON')}`}
                    title="Rarity"
                  >
                    {formatTitle(rarityValue || 'COMMON')}
                  </button>
                </>
              )}

              {/* REGIONS: Show only Country */}
              {isRegion && countryStyle && (
                <>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); country && onFilterByOrigin?.(country); }}
                    className={`px-1.5 py-0.5 text-[9px] font-mono border rounded-sm tracking-wide shrink-0 ${countryStyle.bg} ${countryStyle.text} ${countryStyle.border}`}
                  >
                    {formatUpper(country)}
                  </button>
                  {entry.details.classification && (
                    (() => {
                      const clsStyle = getClassificationStyle(entry.details.classification);
                      return (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); onFilterByNote?.(entry.details.classification!, 'REGIONS', 'SYSTEM'); }}
                          className={`px-1.5 py-0.5 text-[9px] font-mono border rounded-sm tracking-wide shrink-0 ${clsStyle.bg} ${clsStyle.text} ${clsStyle.border}`}
                        >
                          {formatUpper(entry.details.classification)}
                        </button>
                      );
                    })()
                  )}
                  {climateMeta && getClimateStyle(entry.climate) && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); entry.climate && onFilterByClimate?.(entry.climate); }}
                      className="px-1.5 py-0.5 text-[9px] font-mono border rounded-sm tracking-wide shrink-0"
                      style={getClimateStyle(entry.climate) as React.CSSProperties}
                    >
                      {formatUpper(climateMeta.name)}
                    </button>
                  )}
                </>
              )}

              {/* COUNTRY GATE: Show classification tags */}
              {isCountryGate && (
                <>
                  {entry.tags.map((tag, i) => (
                    <span key={i} className="px-1.5 py-0.5 bg-stone-800 text-amber-200 border border-amber-600 text-[9px] font-mono rounded-sm tracking-wide shrink-0">
                      {formatTitle(tag)}
                    </span>
                  ))}
                </>
              )}

              {/* STYLES & FLAVORS: Show class chips */}
              {!isGrape && !isRegion && !isCountryGate && (
                <>
                  {isStyle && styleClassType && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onFilterByNote?.(styleClassType, 'STYLES', 'TASTING'); }}
                      className={`px-1.5 py-0.5 text-[9px] font-mono border rounded-sm tracking-wide shrink-0 ${styleClassStyle.bg} ${styleClassStyle.text} ${styleClassStyle.border}`}
                    >
                      {formatTitle(styleClassType)}
                    </button>
                  )}
                  {isStyle && styleColorType && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onFilterByType?.(styleColorType, 'STYLES'); }}
                      className={`px-1.5 py-0.5 text-[9px] font-mono border rounded-sm tracking-wide shrink-0 ${styleColorStyle.bg} ${styleColorStyle.text} ${styleColorStyle.border}`}
                    >
                      {formatTitle(styleColorType)}
                    </button>
                  )}
                  {isStyle && styleClassType === 'ORIGIN' && styleCountryStyle && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); entry.details.origin && onFilterByOrigin?.(entry.details.origin); }}
                      className={`px-1.5 py-0.5 text-[9px] font-mono border rounded-sm tracking-wide shrink-0 ${styleCountryStyle.bg} ${styleCountryStyle.text} ${styleCountryStyle.border}`}
                    >
                      {formatUpper(entry.details.origin || '')}
                    </button>
                  )}
                  {isFlavor && flavorClassStyle && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onFilterByNote?.(entry.details.classification || 'FLAVOR', 'FLAVORS', 'TASTING'); }}
                      className={`px-1.5 py-0.5 text-[9px] font-mono border rounded-sm tracking-wide shrink-0 ${flavorClassStyle.bg} ${flavorClassStyle.text} ${flavorClassStyle.border}`}
                    >
                      {formatLabelUpper(entry.details.classification || 'FLAVOR')}
                    </button>
                  )}
                  {isFlavor && flavorSubclassStyle && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onFilterByNote?.(entry.details.subclass || 'SUBCLASS', 'FLAVORS', 'TASTING'); }}
                      className={`px-1.5 py-0.5 text-[9px] font-mono border rounded-sm tracking-wide shrink-0 ${flavorSubclassStyle.bg} ${flavorSubclassStyle.text} ${flavorSubclassStyle.border}`}
                    >
                      {formatLabelUpper(entry.details.subclass || 'SUBCLASS')}
                    </button>
                  )}
                </>
              )}

              {/* Origin tag for grapes */}
              {isGrape && originLabel && grapeOriginStyle && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onFilterByOrigin?.(originLabel); }}
                  className={`px-1.5 py-0.5 text-[9px] font-mono border rounded-sm tracking-wide shrink-0 ${grapeOriginStyle.bg} ${grapeOriginStyle.text} ${grapeOriginStyle.border}`}
                >
                  {formatUpper(originLabel)}
                </button>
              )}
          </div>
     </div>

      {/* Right: Chevron */}
      <div className="shrink-0 text-stone-600 group-hover:text-white pl-2">
         <ChevronRight size={18} />
      </div>
    </button>
  );
};

export default EntryTile;
