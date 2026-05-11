import React, { useMemo } from 'react';
import { ClimateClass, EntryCategory, WineEntry } from '../types';
import { ChevronRight } from 'lucide-react';
import { getStylePalette } from '../stylePalette';
import { CLIMATE_CLASS_MAP } from '../data/climateClasses';
import { WINE_ENTRIES } from '../constants';
import { CONTAINER_SIZE_LIST, CONTAINER_BORDER_CLASS, CONTAINER_SHADOW_CLASS, CONTAINER_BORDER, ICON_SIZE_LIST } from '../src/services/iconRendering';
import { createEntryVisualResolver, resolveEntryIconVisual } from '../src/services/entryIconVisuals';
import Chip from './Chip';
import { getGrapeColorLabel, getGrapeBodyLabel, getGrapeColorChipColors, getGrapeBodyChipColors } from '../src/services/grapeDisplay';
import {
  getCountryChipColors,
  getClassificationChipColors,
  getRarityChipColors,
  getColorTypeChipColors,
  getStyleClassChipColors,
  getFlavorClassChipColors,
  getFlavorSubclassChipColors,
  SYSTEM_CHIP_COLOR,
  CLIMATE_CHIP_COLOR,
  APPELLATION_CHIP_COLORS,
  extractTagAbbrev,
} from '../src/services/chipColors';
import { getColorType, getStyleClassType } from '../src/services/entryUtils';
import { isLightColor } from '../src/services/colorUtils';

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

const getClimateStyle = (climate?: ClimateClass) => {
  if (!climate) return null;
  const meta = CLIMATE_CLASS_MAP[climate];
  if (!meta) return null;
  return { backgroundColor: meta.colors.bg, borderColor: meta.colors.border, color: meta.colors.text };
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

const getColorTypeStyle = (type?: string) => {
  switch (type) {
    case 'RED': return { bg: 'bg-[#4A0E0E]', text: 'text-rose-100', border: 'border-[#8B0000]' }; // full-bodied red palette
    case 'WHITE': return { bg: 'bg-[#FAFAD2]', text: 'text-amber-900', border: 'border-[#DAA520]' }; // light-bodied white palette
    case 'ROSÉ':
    case 'ROSE': return { bg: 'bg-pink-900', text: 'text-pink-100', border: 'border-pink-600' };
    case 'ORANGE': return { bg: 'bg-amber-950', text: 'text-amber-100', border: 'border-amber-600' };
    case 'DUAL': return { bg: 'bg-[#501237]', text: 'text-pink-100', border: 'border-[#f472b6]' };
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

const EntryTile: React.FC<EntryTileProps> = ({ entry, onPress, index, onFilterByRarity, onFilterByType, onFilterByNote, onFilterByOrigin, onFilterByClimate }) => {
  const isGrape = entry.category === 'GRAPES';
  const isRegion = entry.category === 'REGIONS';
  const isCountryGate = entry.category === 'COUNTRY_GATE';
  const isStyle = entry.category === 'STYLES';
  const isFlavor = entry.category === 'FLAVORS';
  const isContinent = entry.category === 'CONTINENTS';
  const grapeCard = entry.grapeCard;
  const climateMeta = entry.climate ? CLIMATE_CLASS_MAP[entry.climate] : undefined;
  const originLabel = entry.details.origin || '';
  const country = entry.details.origin || '';

  const styleClassType = isStyle ? getStyleClassType(entry.name, entry.details.classification) : undefined;
  const styleColorType = isStyle ? getColorType(entry.name) : undefined;

  // Shared hex color styles (consistent with EntryDetail scan chips)
  const grapeOriginColors = isGrape && originLabel ? getCountryChipColors(originLabel) : null;
  const countryColors = isRegion ? getCountryChipColors(country) : null;
  const styleClassColors = getStyleClassChipColors(styleClassType);
  const styleColorColors = getColorTypeChipColors(styleColorType);
  const styleCountryColors = entry.details.origin ? getCountryChipColors(entry.details.origin) : null;
  const flavorClassColors = isFlavor ? getFlavorClassChipColors(entry.details.classification) : null;
  const flavorSubclassColors = isFlavor ? getFlavorSubclassChipColors(entry.details.subclass) : null;
  const rarityValue = entry.rarity || (grapeCard?.rarityTier ? grapeCard.rarityTier.toUpperCase() : undefined);
  const rarityColors = rarityValue ? getRarityChipColors(rarityValue) : null;

  const styleClassLabel = formatTitle(styleClassType);
  const styleColorLabel = formatTitle(styleColorType);
  const styleCountryLabel = formatUpper(entry.details.origin || '');
  const flavorClassLabel = formatLabelUpper(entry.details.classification || '');
  const flavorSubclassLabel = formatLabelUpper(entry.details.subclass || '');
  const grapeOriginLabel = formatUpper(originLabel);

  const entryVisualResolver = useMemo(() => createEntryVisualResolver({ entries: WINE_ENTRIES }), []);
  const entryVisual = resolveEntryIconVisual(entry, {
    size: ICON_SIZE_LIST,
    resolver: entryVisualResolver,
    includeRegionClimateOutline: true,
  });

  const getRarityStyle = (rarity: string) => {
    switch (rarity) {
      case 'COMMON': return 'bg-stone-600 text-stone-200 border-stone-500';
      case 'UNCOMMON': return 'bg-green-900 text-green-300 border-green-700';
      case 'RARE': return 'bg-blue-900 text-blue-300 border-blue-700';
      case 'NOBLE': return 'bg-purple-900 text-purple-200 border-purple-700';
      default: return 'bg-stone-600 text-stone-200 border-stone-500';
    }
  };

  const renderedIcon = entryVisual.iconNode;

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
        className={`shrink-0 ${CONTAINER_SIZE_LIST} ${CONTAINER_BORDER_CLASS} ${CONTAINER_SHADOW_CLASS} flex items-center justify-center ${CONTAINER_BORDER} self-start`}
        style={isCountryGate ? { ...entryVisual.style, borderColor: '#ffffff', borderWidth: 2, overflow: 'hidden' } : entryVisual.style}
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
              {/* GRAPES: color (RED/WHITE) + body class */}
              {isGrape && (() => {
                const colorLabel = getGrapeColorLabel(entry);
                const bodyLabel = getGrapeBodyLabel(entry);
                return (
                  <>
                    <Chip
                      label={colorLabel}
                      colorStyle={getGrapeColorChipColors(colorLabel)}
                    />
                    <Chip
                      label={bodyLabel}
                      colorStyle={getGrapeBodyChipColors(bodyLabel)}
                    />
                  </>
                );
              })()}

              {/* REGIONS: Show only Country */}
              {isRegion && countryColors && (
                <>
                  <Chip
                    label={formatUpper(country)}
                    colorStyle={countryColors}
                  />
                  {entry.details.classification && (
                    <Chip
                      label={formatUpper(entry.details.classification)}
                      colorStyle={SYSTEM_CHIP_COLOR}
                    />
                  )}
                  {climateMeta && (
                    <Chip
                      label={formatUpper(climateMeta.name)}
                      colorStyle={climateMeta.colors}
                    />
                  )}
                </>
              )}

              {/* COUNTRY GATE: classification tags */}
              {isCountryGate && (
                <>
                  {entry.tags.filter(tag => tag !== 'COUNTRY').map((tag, i) => (
                    <Chip key={i} label={extractTagAbbrev(tag)} colorStyle={APPELLATION_CHIP_COLORS[i % 3]} />
                  ))}
                </>
              )}

              {/* CONTINENTS: continent label */}
              {isContinent && (
                <Chip label="CONTINENT" colorStyle={{ bg: '#0f2027', border: '#0891b2', text: '#7dd3fc' }} />
              )}

              {/* STYLES & FLAVORS: Show class chips */}
              {!isGrape && !isRegion && !isCountryGate && (
                <>
                  {isStyle && styleClassType && (
                    <Chip
                      label={styleClassLabel}
                      colorStyle={styleClassColors}
                    />
                  )}
                  {isStyle && styleColorType && (
                    <Chip
                      label={styleColorLabel}
                      colorStyle={styleColorColors}
                    />
                  )}
                  {isStyle && entry.details.origin && entry.details.origin.toLowerCase() !== 'various' && styleCountryColors && (
                    <Chip
                      label={styleCountryLabel}
                      colorStyle={styleCountryColors}
                    />
                  )}
                  {isFlavor && flavorClassColors && (
                    <Chip
                      label={flavorClassLabel}
                      colorStyle={flavorClassColors}
                    />
                  )}
                  {isFlavor && flavorSubclassColors && (
                    <Chip
                      label={flavorSubclassLabel}
                      colorStyle={flavorSubclassColors}
                    />
                  )}
                </>
              )}

              {/* Origin tag for grapes */}
              {isGrape && originLabel && grapeOriginColors && (
                <Chip
                  label={grapeOriginLabel}
                  colorStyle={grapeOriginColors}
                />
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
