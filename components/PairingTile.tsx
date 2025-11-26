import React from 'react';
import { ClimateClass, WineEntry } from '../types';
import { ChevronRight, Droplet, Heart, Sun, Cloud, Castle, Mountain, Triangle, Sparkles, Circle, Shield, Grape, Leaf, Flame, Zap, Globe, Cherry, Wine, Citrus, Flower2, Apple, Sprout, Gem, Trees, Wind, GlassWater, Droplets, Scale, Box } from 'lucide-react';
import { getStylePalette } from '../stylePalette';
import { CLIMATE_CLASS_MAP } from '../data/climateClasses';

interface EntryTileProps {
  entry: WineEntry;
  onPress: (entry: WineEntry) => void;
  index: number;
  onFilterByRarity?: (rarity: string) => void;
  onFilterByType?: (type: string) => void;
  onFilterByNote?: (note: string) => void;
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

const getGrapeFlavorIcon = (entry: WineEntry): React.ReactNode => {
  const note = entry.tastingProfile?.[0];
  if (!note) return getGrapeIcon(entry);
  const IconComp = ICON_MAP[note.icon] || ICON_MAP['default'];
  return React.isValidElement(IconComp)
    ? React.cloneElement(IconComp as React.ReactElement, {
        className: 'opacity-90',
        style: { color: note.color },
      })
    : IconComp;
};

const getStyleClassType = (name: string, classification?: string) => {
  const normalized = name.toLowerCase();
  const classOverride = classification?.toUpperCase();

  if (classOverride === 'ORIGIN' || classOverride === 'METHOD' || classOverride === 'TYPE') return classOverride;

  const originKeywords = ['champagne', 'port', 'sherry', 'prosecco', 'crémant', 'cremant', 'cru beaujolais', 'super tuscan'];
  const methodKeywords = ['sparkling', 'fortified', 'dessert', 'late harvest', 'ice wine', 'botrytis', 'pétillant', 'petillant', 'natural wine', 'orange wine'];
  const typeKeywords = ['full-bodied', 'full bodied', 'light-bodied', 'light bodied', 'medium-bodied', 'medium bodied', 'aromatic', 'white', 'red', 'rosé', 'rose', 'sweet white', 'sparkling wine'];

  if (originKeywords.some(k => normalized.includes(k))) return 'ORIGIN';
  if (typeKeywords.some(k => normalized.includes(k))) return 'TYPE';
  if (methodKeywords.some(k => normalized.includes(k))) return 'METHOD';
  return 'STYLE';
};

const getClassTypeStyle = (type: 'STYLE' | 'METHOD' | 'ORIGIN' | 'TYPE' | undefined) => {
  switch (type) {
    case 'STYLE': return { bg: 'bg-stone-900', text: 'text-green-200', border: 'border-green-500' };
    case 'METHOD': return { bg: 'bg-indigo-900', text: 'text-purple-100', border: 'border-purple-500' };
    case 'ORIGIN': return { bg: 'bg-amber-900', text: 'text-amber-100', border: 'border-amber-600' };
    case 'TYPE': return { bg: 'bg-slate-900', text: 'text-cyan-100', border: 'border-cyan-500' };
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
    case 'RED': return { bg: 'bg-red-950', text: 'text-red-200', border: 'border-red-600' };
    case 'WHITE': return { bg: 'bg-lime-900', text: 'text-lime-100', border: 'border-lime-600' };
    case 'ROSÉ': return { bg: 'bg-pink-900', text: 'text-pink-100', border: 'border-pink-600' };
    case 'ORANGE': return { bg: 'bg-amber-950', text: 'text-amber-100', border: 'border-amber-600' };
    case 'DUAL': return { bg: 'bg-cyan-950', text: 'text-cyan-100', border: 'border-cyan-600' };
    default: return { bg: 'bg-stone-700', text: 'text-stone-200', border: 'border-stone-500' };
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
    case 'VEGETAL': return { bg: 'bg-emerald-950', text: 'text-emerald-100', border: 'border-emerald-700' };
    case 'EARTH': return { bg: 'bg-stone-800', text: 'text-stone-100', border: 'border-stone-600' };
    case 'SPICE': return { bg: 'bg-amber-900', text: 'text-amber-100', border: 'border-amber-600' };
    case 'HERBAL': return { bg: 'bg-teal-900', text: 'text-teal-100', border: 'border-teal-600' };
    case 'MARINE': return { bg: 'bg-sky-900', text: 'text-sky-100', border: 'border-sky-600' };
    case 'CITRUS': return { bg: 'bg-amber-950', text: 'text-amber-100', border: 'border-amber-600' };
    case 'ORCHARD_FRUIT': return { bg: 'bg-lime-800', text: 'text-lime-50', border: 'border-lime-600' };
    case 'STONE_FRUIT': return { bg: 'bg-amber-900', text: 'text-amber-50', border: 'border-amber-600' };
    case 'TROPICAL': return { bg: 'bg-yellow-900', text: 'text-yellow-100', border: 'border-yellow-700' };
    case 'RED_FRUIT': return { bg: 'bg-red-900', text: 'text-red-100', border: 'border-red-600' };
    case 'DARK_FRUIT': return { bg: 'bg-purple-900', text: 'text-purple-100', border: 'border-purple-700' };
    case 'BAKING': return { bg: 'bg-orange-900', text: 'text-orange-100', border: 'border-orange-600' };
    case 'WAX': return { bg: 'bg-amber-950', text: 'text-amber-100', border: 'border-amber-700' };
    case 'NUT': return { bg: 'bg-amber-900', text: 'text-amber-100', border: 'border-amber-600' };
    case 'FLORAL': return { bg: 'bg-pink-900', text: 'text-pink-100', border: 'border-pink-600' };
    default: return { bg: 'bg-stone-700', text: 'text-stone-200', border: 'border-stone-500' };
  }
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
  
  // Get icon and color for grapes based on wine type
  const wineTypeStyle = isGrape ? getWineTypeStyle(grapeCard?.style || entry.wineType) : null;
  const grapeIconElement = isGrape ? getGrapeFlavorIcon({ ...entry, wineType: grapeCard?.style || entry.wineType } as WineEntry) : null;
  const genericIcon = ICON_MAP[entry.icon || 'default'] || ICON_MAP['default'];
  
  // Get country for regions
  const country = entry.details.origin || '';
  const countryStyle = isRegion ? getCountryColor(country) : null;
  const styleClassType = isStyle ? getStyleClassType(entry.name, entry.details.classification) : undefined;
  const styleColorType = isStyle ? getColorType(entry.name) : undefined;
  const styleClassStyle = getClassTypeStyle(styleClassType as 'STYLE' | 'METHOD' | 'ORIGIN' | 'TYPE' | undefined);
  const styleColorStyle = getColorTypeStyle(styleColorType);
  const styleCountryStyle = entry.details.origin ? getCountryColor(entry.details.origin) : null;
  const flavorClassStyle = isFlavor ? getFlavorClassStyle(entry.details.classification) : null;
  const flavorSubclassStyle = isFlavor ? getFlavorSubclassStyle(entry.details.subclass) : null;

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
      return getGrapeIconColor(grapeCard?.style || entry.wineType, entry.details.body);
    }
    return entry.color || '#78716c';
  };

  const getFlagBadge = (origin?: string) => {
    const map: Record<string, { colors: string }> = {
      france: { colors: 'linear-gradient(90deg,#1f3f99 33%,#ffffff 33%,#ffffff 66%,#c53030 66%)' },
      italy: { colors: 'linear-gradient(90deg,#1b9b4c 33%,#ffffff 33%,#ffffff 66%,#c53030 66%)' },
      spain: { colors: 'linear-gradient(#c53030 0 20%,#f6ad55 20% 80%,#c53030 80% 100%)' },
      portugal: { colors: 'linear-gradient(90deg,#046c4e 45%,#7f1d1d 45%)' },
      germany: { colors: 'linear-gradient(#0f172a 33%,#b91c1c 33% 66%,#f59e0b 66%)' },
      austria: { colors: 'linear-gradient(#c53030 33%,#ffffff 33% 66%,#c53030 66%)' },
      greece: { colors: 'linear-gradient(#2563eb 33%,#e2e8f0 33% 66%,#2563eb 66%)' },
      hungary: { colors: 'linear-gradient(#b91c1c 33%,#ffffff 33% 66%,#16a34a 66%)' },
      usa: { colors: 'linear-gradient(#1d4ed8 0 40%,#e11d48 40% 100%)' },
      canada: { colors: 'linear-gradient(#c53030 25%,#ffffff 25% 75%,#c53030 75%)' },
      argentina: { colors: 'linear-gradient(#38bdf8 33%,#e5e7eb 33% 66%,#38bdf8 66%)' },
      chile: { colors: 'linear-gradient(#1d4ed8 33%,#ffffff 33% 66%,#c53030 66%)' },
      'south africa': { colors: 'linear-gradient(90deg,#065f46 20%,#111827 20% 40%,#eab308 40% 50%,#e11d48 50% 70%,#1d4ed8 70%)' },
      australia: { colors: 'linear-gradient(#0f172a 50%,#e11d48 50%)' },
      'new zealand': { colors: 'linear-gradient(#0f172a 60%,#e11d48 60%)' },
      china: { colors: 'linear-gradient(#b91c1c 70%,#f59e0b 70%)' },
      japan: { colors: 'radial-gradient(circle at 50% 50%,#b91c1c 0 40%,#f8fafc 40%)' },
      india: { colors: 'linear-gradient(#f97316 33%,#ffffff 33% 66%,#16a34a 66%)' },
    };
    const key = origin ? Object.keys(map).find(k => origin.toLowerCase().includes(k)) : undefined;
    return key ? map[key] : { colors: 'linear-gradient(#374151,#111827)' };
  };

  const getIconStyle = () => {
    if (isCountryGate) {
      const badge = getFlagBadge(entry.details.origin || entry.name);
      return { backgroundImage: badge.colors, color: '#fff' } as React.CSSProperties;
    }
    return { backgroundColor: getIconBgColor() } as React.CSSProperties;
  };

  const renderedIcon = isCountryGate
    ? null
    : isGrape && React.isValidElement(grapeIconElement)
      ? grapeIconElement
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
                    <span
                      className={`px-1.5 py-0.5 text-[9px] font-mono border rounded-sm tracking-wide shrink-0 ${wineTypeStyle.bg} ${wineTypeStyle.text} ${wineTypeStyle.border}`}
                      style={wineTypeStyle.style}
                    >
                      {grapeCard.style.toUpperCase()}
                    </span>
                  )}
                  {/* Rarity Tag */}
                  <span 
                    className={`px-1.5 py-0.5 text-[9px] font-mono border rounded-sm tracking-wide shrink-0 ${getRarityStyle(entry.rarity)}`}
                    title="Rarity"
                  >
                    {formatTitle(entry.rarity || grapeCard?.rarityTier)}
                  </span>
                </>
              )}

              {/* REGIONS: Show only Country */}
              {isRegion && countryStyle && (
                <>
                  <span
                    className={`px-1.5 py-0.5 text-[9px] font-mono border rounded-sm tracking-wide shrink-0 ${countryStyle.bg} ${countryStyle.text} ${countryStyle.border}`}
                  >
                    {formatUpper(country)}
                  </span>
                  {entry.details.classification && (
                    (() => {
                      const clsStyle = getClassificationStyle(entry.details.classification);
                      return (
                        <span className={`px-1.5 py-0.5 text-[9px] font-mono border rounded-sm tracking-wide shrink-0 ${clsStyle.bg} ${clsStyle.text} ${clsStyle.border}`}>
                          {formatUpper(entry.details.classification)}
                        </span>
                      );
                    })()
                  )}
                  {climateMeta && getClimateStyle(entry.climate) && (
                    <span
                      className="px-1.5 py-0.5 text-[9px] font-mono border rounded-sm tracking-wide shrink-0"
                      style={getClimateStyle(entry.climate) as React.CSSProperties}
                    >
                      {formatUpper(climateMeta.name)}
                    </span>
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
                      onClick={() => onFilterByNote?.(styleClassType)}
                      className={`px-1.5 py-0.5 text-[9px] font-mono border rounded-sm tracking-wide shrink-0 ${styleClassStyle.bg} ${styleClassStyle.text} ${styleClassStyle.border}`}
                    >
                      {formatTitle(styleClassType)}
                    </button>
                  )}
                  {isStyle && styleColorType && (
                    <button
                      onClick={() => onFilterByType?.(styleColorType)}
                      className={`px-1.5 py-0.5 text-[9px] font-mono border rounded-sm tracking-wide shrink-0 ${styleColorStyle.bg} ${styleColorStyle.text} ${styleColorStyle.border}`}
                    >
                      {formatTitle(styleColorType)}
                    </button>
                  )}
                  {isStyle && styleClassType === 'ORIGIN' && styleCountryStyle && (
                    <button
                      onClick={() => entry.details.origin && onFilterByOrigin?.(entry.details.origin)}
                      className={`px-1.5 py-0.5 text-[9px] font-mono border rounded-sm tracking-wide shrink-0 ${styleCountryStyle.bg} ${styleCountryStyle.text} ${styleCountryStyle.border}`}
                    >
                      {formatUpper(entry.details.origin || '')}
                    </button>
                  )}
                  {isFlavor && flavorClassStyle && (
                    <button
                      onClick={() => onFilterByNote?.(entry.details.classification || 'FLAVOR')}
                      className={`px-1.5 py-0.5 text-[9px] font-mono border rounded-sm tracking-wide shrink-0 ${flavorClassStyle.bg} ${flavorClassStyle.text} ${flavorClassStyle.border}`}
                    >
                      {formatLabelUpper(entry.details.classification || 'FLAVOR')}
                    </button>
                  )}
                  {isFlavor && flavorSubclassStyle && (
                    <button
                      onClick={() => onFilterByNote?.(entry.details.subclass || 'SUBCLASS')}
                      className={`px-1.5 py-0.5 text-[9px] font-mono border rounded-sm tracking-wide shrink-0 ${flavorSubclassStyle.bg} ${flavorSubclassStyle.text} ${flavorSubclassStyle.border}`}
                    >
                      {formatLabelUpper(entry.details.subclass || 'SUBCLASS')}
                    </button>
                  )}
                </>
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
