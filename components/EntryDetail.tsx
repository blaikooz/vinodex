import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Tag, MapPin, Activity, Droplet, Clock, Zap, BarChart3, Grape, Mountain, ChevronRight, List, Circle, Triangle, Leaf, Cloud, Sun, Sparkles, Flame, Shield, Castle, Globe, BookOpen, MapPinned, Flower2, Apple, Sprout, Gem, Trees, Wind, Citrus, GlassWater, Droplets, Scale, Box, Wine, Star, Crown } from 'lucide-react';
import DeviceLayout from './DeviceLayout';
import { ClimateClass, EntryCategory, WineEntry } from '../types';
import { CLIMATE_CLASS_MAP } from '../data/climateClasses';
import { getFlagGradient } from '../data/flagGradients';
import { getFlagImage } from '../data/flagImages';
import { loadAllEntries } from '../src/services/wineData';
import { getStylePalette } from '../stylePalette';
import { CONTAINER_SIZE_HEADER, HEADER_BORDER_CLASS, CONTAINER_SHADOW_CLASS, HEADER_BORDER, CONTAINER_SIZE_LIST, CONTAINER_BORDER_CLASS, CONTAINER_BORDER, ICON_SIZE_HEADER, ICON_SIZE_LINKED } from '../src/services/iconRendering';
import { createEntryVisualResolver, resolveEntryIconVisual } from '../src/services/entryIconVisuals';
import { categorizeFlavor, categorizeFlavorSubclass, FLAVOR_CLASS_COLORS } from '../constants';
import Chip from './Chip';
import { getCountryChipColors, getClassificationChipColors, getWineTypeChipColors, getRarityChipColors, getFlavorClassChipColors, getFlavorSubclassChipColors, SYSTEM_CHIP_COLOR, CLIMATE_CHIP_COLOR, APPELLATION_CHIP_COLORS, extractTagAbbrev } from '../src/services/chipColors';
import { getGrapeColorLabel, getGrapeBodyLabel, getGrapeColorChipColors, getGrapeBodyChipColors } from '../src/services/grapeDisplay';

type FilterMode = 'REGION' | 'TYPE' | 'TASTING' | 'SOIL' | 'ORIGIN' | 'RARITY' | 'SYSTEM' | 'CLIMATE' | null;

interface EntryDetailProps {
  entry: WineEntry;
  onBack: () => void;
  onHome: () => void;
  onSelectRelated: (entry: WineEntry) => void;
  onFilterByType: (type: string, targetCategory?: EntryCategory) => void;
  onFilterByNote: (note: string, targetCategory?: EntryCategory, mode?: FilterMode) => void;
  onFilterBySoil: (soil: string) => void;
  onFilterByOrigin: (origin: string) => void;
  onFilterByRarity?: (rarity: string) => void;
  onFilterByClimate?: (climate: ClimateClass) => void;
  onViewStates?: () => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  circle: <Circle size={16} fill="currentColor" className="text-current" />,
  triangle: <Triangle size={16} fill="currentColor" className="text-current" />,
  leaf: <Leaf size={16} fill="currentColor" className="text-current" />,
  cloud: <Cloud size={16} fill="currentColor" className="text-current" />,
  sun: <Sun size={16} fill="currentColor" className="text-current" />,
  mountain: <Mountain size={16} fill="currentColor" className="text-current" />,
  sparkles: <Sparkles size={16} fill="currentColor" className="text-current" />,
  flame: <Flame size={16} fill="currentColor" className="text-current" />,
  droplet: <Droplet size={16} fill="currentColor" className="text-current" />,
  shield: <Shield size={16} fill="currentColor" className="text-current" />,
  castle: <Castle size={16} fill="currentColor" className="text-current" />,
  zap: <Zap size={16} fill="currentColor" className="text-current" />,
  flower: <Flower2 size={16} fill="currentColor" className="text-current" />,
  fruit: <Apple size={16} fill="currentColor" className="text-current" />,
  herb: <Sprout size={16} fill="currentColor" className="text-current" />,
  spice: <Flame size={16} fill="currentColor" className="text-current" />,
  mineral: <Gem size={16} fill="currentColor" className="text-current" />,
  oak: <Trees size={16} fill="currentColor" className="text-current" />,
  smoke: <Wind size={16} fill="currentColor" className="text-current" />,
  stone: <Mountain size={16} fill="currentColor" className="text-current" />,
  tropical: <Citrus size={16} fill="currentColor" className="text-current" />,
  honey: <Sparkles size={16} fill="currentColor" className="text-current" />,
  nut: <Triangle size={16} fill="currentColor" className="text-current" />,
  default: <Circle size={16} fill="currentColor" className="text-current" />,
};

// Utility to normalize type class
function normalizeTypeClass(type?: string): string {
  if (!type) return '';
  // Remove body/color words and map to allowed classes
  let t = type.toLowerCase();
  t = t.replace(/(body|bodied|color|red|white|rose|rosé|orange)/g, '').replace(/\s+/g, ' ').trim();
  // Map to allowed classes
  if (/light/i.test(type)) return 'Light';
  if (/medium[- ]?full/i.test(type)) return 'Medium Full';
  if (/medium/i.test(type)) return 'Medium';
  if (/full/i.test(type)) return 'Full';
  if (/aromatic/i.test(type)) return 'Aromatic';
  if (/sweet/i.test(type)) return 'Sweet';
  return 'Medium'; // fallback
}

const EntryDetail: React.FC<EntryDetailProps> = ({ entry, onBack, onHome, onSelectRelated, onFilterByType, onFilterByNote, onFilterBySoil, onFilterByOrigin, onFilterByRarity, onFilterByClimate, onViewStates }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [allEntries, setAllEntries] = useState<WineEntry[]>([]);
  const entryVisualResolver = useMemo(() => createEntryVisualResolver({ entries: allEntries }), [allEntries]);

  useEffect(() => {
    let cancelled = false;
    loadAllEntries()
      .then((data) => {
        if (!cancelled) setAllEntries(data);
      })
      .catch((err) => {
        if (!cancelled) console.error('Failed to load wine entries', err);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Scroll to top whenever the entry changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [entry.id]);
  
  // Helper to normalize levels for stat bars
  const getLevelIndex = (val: string | undefined, levels: string[]) => {
      if (!val) return -1;
      return levels.findIndex(l => val.toLowerCase().includes(l.toLowerCase()));
  };

  const formatUpper = (value?: string) => {
    return value ? value.toUpperCase() : 'N/A';
  };

  const normalizeEntryKey = (value: string) =>
    value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();

  const matchesEntryKey = (entry: WineEntry, cleanName: string) => {
    if (normalizeEntryKey(entry.name) === cleanName) return true;
    return !!(entry.details.synonyms && entry.details.synonyms.some((s) => normalizeEntryKey(s) === cleanName));
  };

  // Helper to find related entry
  const getRelatedEntry = (name: string, preferredCategory?: EntryCategory) => {
    const cleanName = normalizeEntryKey(name);
    const exactInPreferred = preferredCategory
      ? allEntries.find((entry) => entry.category === preferredCategory && matchesEntryKey(entry, cleanName))
      : undefined;
    if (exactInPreferred) return exactInPreferred;

    const exactAny = allEntries.find((entry) => matchesEntryKey(entry, cleanName));
    if (exactAny) return exactAny;

    const fallbackPool = preferredCategory
      ? [...allEntries.filter((entry) => entry.category === preferredCategory), ...allEntries.filter((entry) => entry.category !== preferredCategory)]
      : allEntries;

    const cleanTokens = cleanName.split(' ').filter(Boolean);
    return fallbackPool.find((entry) => {
      const entryKey = normalizeEntryKey(entry.name);
      if (!entryKey) return false;

      const entryTokens = entryKey.split(' ').filter(Boolean);
      if (cleanTokens.length > 1 && entryTokens.length === 1) return false;
      return entryKey.includes(cleanName) || cleanName.includes(entryKey);
    });
  };

  const normalizeFlavorKey = (value: string) =>
    value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();

  const normalizeLabel = (value: string) =>
    value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  const isLightColor = (hex: string) => {
    const clean = hex.replace('#', '');
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) > 160;
  };

  const isVariousOrigin = (origin?: string) => (origin || '').trim().toLowerCase() === 'various';

  const getExactFlavorEntry = (name: string) => {
    const cleanName = normalizeFlavorKey(name);
    return allEntries.find((e) => {
      if (e.category !== 'FLAVORS') return false;
      if (normalizeFlavorKey(e.name) === cleanName) return true;
      return !!(e.details.synonyms && e.details.synonyms.some((s) => normalizeFlavorKey(s) === cleanName));
    });
  };

  const getExactGrapeEntry = (name: string) => {
    const cleanName = normalizeEntryKey(name);
    return allEntries.find((e) => {
      if (e.category !== 'GRAPES') return false;
      if (normalizeEntryKey(e.name) === cleanName) return true;
      return !!(e.details.synonyms && e.details.synonyms.some((s) => normalizeEntryKey(s) === cleanName));
    });
  };

  // Type Icon Selection
  const getTypeIcon = (typeStr: string = '', size: number = 28) => {
      const t = normalizeLabel(typeStr);
      if (t.includes('full-body red') || t.includes('full body red') || t.includes('full-bodied red') || t.includes('full bodied red')) return <Wine size={size} />;
      if (t.includes('bright red')) return <Sparkles size={size} />;
      if (t.includes('light-body red') || t.includes('light body red') || t.includes('light-bodied red') || t.includes('light bodied red')) return <GlassWater size={size} />;
      if (t.includes('dark red')) return <Grape size={size} />;
      if (t.includes('medium-body red') || t.includes('medium body red') || t.includes('medium-bodied red') || t.includes('medium bodied red')) return <Scale size={size} />;
      if (t.includes('pink') || t.includes('rose')) return <Droplets size={size} />;

      if (t.includes('light-body white') || t.includes('light body white') || t.includes('light-bodied white') || t.includes('light bodied white')) return <GlassWater size={size} />;
      if (t.includes('aromatic white')) return <Wind size={size} />;
      if (t.includes('high-acid white') || t.includes('high acid white')) return <Citrus size={size} />;
      if (t.includes('full-body white') || t.includes('full body white') || t.includes('full-bodied white') || t.includes('full bodied white')) return <Box size={size} />;
      if (t.includes('sweet white')) return <Sun size={size} />;
      if (t.includes('medium-body white') || t.includes('medium body white') || t.includes('medium-bodied white') || t.includes('medium bodied white')) return <Circle size={size} />;

      if (t.includes('sparkling')) return <Sparkles size={size} />;
      return <Grape size={size} />;
  };

  // Soil Mapping
  const getSoilIcon = (soil: string) => {
      const s = soil.toLowerCase();
      if (s.includes('volcanic')) return { icon: <Flame size={16} />, color: '#FF4500' };
      if (s.includes('clay')) return { icon: <Circle size={16} />, color: '#8B4513' };
      if (s.includes('sand')) return { icon: <Cloud size={16} />, color: '#F4A460' };
      if (s.includes('limestone') || s.includes('chalk')) return { icon: <Mountain size={16} />, color: '#E0E0E0' };
      if (s.includes('slate') || s.includes('schist')) return { icon: <Mountain size={16} />, color: '#708090' };
      if (s.includes('granite')) return { icon: <Mountain size={16} />, color: '#A9A9A9' };
      if (s.includes('gravel')) return { icon: <Circle size={16} />, color: '#696969' };
      return { icon: <Mountain size={16} />, color: '#8B4513' };
  };

  // Rarity style helper
  const getRarityStyle = (rarity: string | undefined) => {
    switch (rarity) {
      case 'COMMON': return 'bg-stone-600 text-stone-200 border-stone-500';
      case 'UNCOMMON': return 'bg-green-900 text-green-300 border-green-700';
      case 'RARE': return 'bg-blue-900 text-blue-300 border-blue-700';
      case 'NOBLE': return 'bg-purple-900 text-purple-200 border-purple-700';
      default: return 'bg-stone-600 text-stone-200 border-stone-500';
    }
  };

  const bodyLevels = ['Light', 'Light-Medium', 'Medium', 'Medium-Full', 'Full'];
  const acidLevels = ['Low', 'Medium', 'High', 'Very High'];
  const tanninLevels = ['None', 'Low', 'Low-Medium', 'Medium', 'High', 'Very High'];
  const grapeCard = entry.grapeCard;

  const getClassTypeColors = (type: 'STYLE' | 'METHOD' | 'ORIGIN' | 'TYPE' | 'BLEND' | undefined) => {
    switch (type) {
      case 'STYLE': return { bg: '#1f2937', border: '#22c55e', text: '#bbf7d0' };
      case 'METHOD': return { bg: '#312e81', border: '#a855f7', text: '#ede9fe' };
      case 'ORIGIN': return { bg: '#7c2d12', border: '#f59e0b', text: '#ffedd5' };
      case 'TYPE': return { bg: '#0f172a', border: '#38bdf8', text: '#e0f2fe' };
      case 'BLEND': return { bg: '#1c1343', border: '#f97316', text: '#fee2e2' };
      default: return { bg: '#1f2937', border: '#22c55e', text: '#bbf7d0' };
    }
  };

  const getColorTypeColors = (type?: string) => {
    switch (type) {
      case 'RED': return { bg: '#4A0E0E', border: '#8B0000', text: '#ffe4e6' }; // full-bodied red palette
      case 'WHITE': return { bg: '#FAFAD2', border: '#DAA520', text: '#2d1b00' }; // light-bodied white palette
      case 'ROSE': return { bg: '#4b1f2f', border: '#f9a8d4', text: '#ffe4e6' };
      case 'ORANGE': return { bg: '#4a2a0a', border: '#fb923c', text: '#ffedd5' };
      case 'DUAL': return { bg: '#4b0c2c', border: '#f472b6', text: '#ffe4f5' }; // pink palette
      default: return { bg: '#1f2937', border: '#22d3ee', text: '#cffafe' };
    }
  };

  // Logic checks
  const isGrapes = entry.category === 'GRAPES';
  const isRegion = entry.category === 'REGIONS';
  const isStyle = entry.category === 'STYLES';
  const isFlavor = entry.category === 'FLAVORS';
  const isContinent = entry.category === 'CONTINENTS';
  const isCountry = entry.category === 'COUNTRY_GATE' && entry.details.classification?.toUpperCase() === 'COUNTRY';
  const isState = entry.category === 'COUNTRY_GATE' && entry.details.classification?.toUpperCase() === 'STATE';
  const getStyleClassType = (name: string, classification?: string) => {
    const normalized = normalizeLabel(name);
    const classOverride = classification?.toUpperCase();

    if (classOverride === 'ORIGIN' || classOverride === 'METHOD' || classOverride === 'TYPE' || classOverride === 'BLEND') return classOverride;

    const originKeywords = ['champagne', 'port', 'sherry', 'prosecco', 'cremant', 'cru beaujolais', 'super tuscan'];
    const methodKeywords = ['sparkling', 'fortified', 'dessert', 'late harvest', 'ice wine', 'botrytis', 'petillant', 'natural wine', 'orange wine'];
    const typeKeywords = ['full-body', 'full body', 'full-bodied', 'full bodied', 'light-body', 'light body', 'light-bodied', 'light bodied', 'medium-body', 'medium body', 'medium-bodied', 'medium bodied', 'aromatic', 'white', 'red', 'rose', 'sweet white', 'sparkling wine'];

    if (originKeywords.some(k => normalized.includes(k))) return 'ORIGIN';
    if (typeKeywords.some(k => normalized.includes(k))) return 'TYPE';
    if (methodKeywords.some(k => normalized.includes(k))) return 'METHOD';
    return 'STYLE';
  };

  const styleClassType = isStyle ? getStyleClassType(entry.name, entry.details.classification) : undefined;
  const isMethodClass = styleClassType === 'METHOD';
  const isOriginClass = styleClassType === 'ORIGIN';
  const isTypeClass = styleClassType === 'TYPE';
  const isStyleClassType = styleClassType === 'STYLE';
  const isBlendClassType = styleClassType === 'BLEND';
  const classTypeColors = getClassTypeColors(styleClassType as 'STYLE' | 'METHOD' | 'ORIGIN' | 'TYPE' | 'BLEND' | undefined);
  const getColorType = (name: string) => {
    const n = normalizeLabel(name);
    if (n.includes('orange')) return 'ORANGE';
    if (n.includes('rose')) return 'ROSE';
    if (n.includes('red')) return 'RED';
    if (n.includes('white')) return 'WHITE';
    return 'DUAL';
  };
  const colorType = isStyle ? getColorType(entry.name) : undefined;
  const colorTypeColors = getColorTypeColors(colorType);

  // Classification Logic
  const isNoble = entry.details.classification === 'Noble Grape' || grapeCard?.rarityTier === 'noble';
  const displayClass = isGrapes ? (grapeCard?.rarityTier?.toUpperCase() || entry.rarity) : entry.details.classification || entry.rarity;

  // List Data Selection
  const listSectionTitle = isContinent ? 'COUNTRIES' : isCountry ? 'KEY REGIONS' : (isRegion ? 'NOTABLE GRAPES' : 'NOTABLE REGIONS');
  const listSectionData = isContinent ? entry.details.keyRegions : (isRegion ? entry.details.notableGrapes : (isGrapes ? grapeCard?.notableRegions : entry.details.keyRegions));
  const scanTitle = isGrapes ? 'GRAPE SCAN' : isRegion ? 'REGION SCAN' : isFlavor ? 'FLAVOR SCAN' : isContinent ? 'CONTINENT SCAN' : isCountry ? 'COUNTRY SCAN' : isState ? 'STATE SCAN' : 'STYLE SCAN';
  const regionSoils = isRegion
    ? (entry.details.soilType
        ? entry.details.soilType.split(',').map((soil) => soil.trim()).filter(Boolean).slice(0, 3)
        : (() => {
            switch (entry.climate) {
              case 'maritime':
                return ['Alluvial', 'Clay', 'Sand'];
              case 'continental':
                return ['Limestone', 'Loess', 'Gravel'];
              case 'cool':
                return ['Limestone', 'Slate', 'Alluvial'];
              case 'warm':
                return ['Alluvial', 'Sand', 'Clay'];
              case 'mediterranean':
                return ['Limestone', 'Clay', 'Gravel'];
              default:
                return ['Alluvial', 'Clay', 'Limestone'];
            }
          })())
    : [];

  const styleGrapes = isStyle ? (entry.details.notableGrapes || []) : [];
  const styleFlavorNotes = isStyle
    ? (entry.tastingProfile || entry.tags?.slice(0, 3).map(tag => ({ note: tag, icon: 'default' as const, color: classTypeColors.border }))) || []
    : [];
  const grapeFlavorNotes = (grapeCard?.tastingProfile || []).map(n => ({ note: n, icon: 'default' as const, color: '#16a34a' }));
  const flavorNotes = isStyle ? styleFlavorNotes : (entry.tastingProfile || grapeFlavorNotes);
  const matchedFlavorNotes = flavorNotes.filter((note) => !!getExactFlavorEntry(note.note));
  const grapeAlternateNames = isGrapes ? (grapeCard?.alternateNames || entry.details.synonyms || []) : [];
  const grapeNotableRegions = isGrapes ? (grapeCard?.notableRegions || entry.details.keyRegions || []) : [];
  const flavorTileContainerClass = isGrapes
    ? 'grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3 items-stretch'
    : 'grid grid-cols-1 gap-2 sm:grid-cols-2 items-stretch';

  const getFlavorTileVisual = (note: { note: string; icon: string; color: string }) => {
    const relatedFlavor = getExactFlavorEntry(note.note);
    if (relatedFlavor) {
      const flavorVisual = resolveEntryIconVisual(relatedFlavor, {
        size: 18,
        resolver: entryVisualResolver,
        includeRegionClimateOutline: true,
      });
      return {
        relatedFlavor,
        iconNode: flavorVisual.iconNode,
        borderColor: flavorVisual.iconColor || note.color,
        bgColor: relatedFlavor.color || '#0b0f19',
        label: relatedFlavor.name
      };
    }

    return {
      relatedFlavor,
      iconNode: buildIconNode('default', '#e5e7eb', 18),
      borderColor: '#475569',
      bgColor: '#0b0f19',
      label: note.note
    };
  };

  const getClassificationColors = getClassificationChipColors;

  const getClassificationFullName = (classification?: string) => {
    if (!classification) return 'N/A';
    const clean = classification.toLowerCase().replace(/[^a-z]/g, '');
    switch (clean) {
      case 'aoc': return "Appellation d'Origine Controlee";
      case 'docg': return "Denominazione di Origine Controllata e Garantita";
      case 'doc': return "Denominazione di Origine Controllata";
      case 'doca': return "Denominacion de Origen Calificada";
      case 'do': return "Denominacion de Origen";
      case 'ava': return 'American Viticultural Area';
      case 'gi': return 'Geographical Indication';
      case 'pdo': return 'Protected Designation of Origin';
      case 'pgi': return 'Protected Geographical Indication';
      case 'igp': return 'Indication Geographique Protegee';
      case 'dac': return 'Districtus Austriae Controllatus';
      case 'wo': return 'Wine of Origin';
      case 'dhc': return 'Districtus Hungaricus Controllatus';
      case 'pradikatswein': return 'Pradikatswein';
      default: return classification;
    }
  };

  const getTypeTileColors = (wineType?: string) => {
    const palette = getStylePalette(wineType);
    if (palette) {
      const textColor = isLightColor(palette.primary) ? palette.secondary : '#ffffff';
      return { bg: palette.primary, border: palette.secondary, text: textColor };
    }
    return getWineTypeChipColors(wineType);
  };

  const getRarityColors = getRarityChipColors;
  const buildIconNode = (iconKey: string, color?: string, size = 20): React.ReactNode => {
    const iconNode = ICON_MAP[iconKey] || ICON_MAP['default'];
    if (React.isValidElement(iconNode)) {
      const el = iconNode as React.ReactElement<any>;
      return React.cloneElement(el, {
        size,
        className: el.props.className,
        style: { ...(el.props.style || {}), ...(color ? { color } : {}) },
      });
    }
    return iconNode;
  };

  interface RenderLinkedTileOptions {
    useCountryFlag?: boolean;
    showRegionMetaTiles?: boolean;
    preferCountryGate?: boolean;
  }

  const renderLinkedTile = (label: string, idx: number, options?: RenderLinkedTileOptions) => {
    const relatedEntry = getRelatedEntry(label, options?.preferCountryGate ? 'COUNTRY_GATE' : undefined);
    const linkedVisual = resolveEntryIconVisual(relatedEntry, {
      size: ICON_SIZE_LINKED,
      resolver: entryVisualResolver,
      includeRegionClimateOutline: true,
    });
    const displayName = (relatedEntry?.name || label || 'UNKNOWN').toUpperCase();
    const isLinkable = !!relatedEntry;
    const classificationLabel = relatedEntry?.details.classification ? formatUpper(relatedEntry.details.classification) : undefined;
    const isRegionMeta = relatedEntry?.category === 'REGIONS' && options?.showRegionMetaTiles;
    const regionCountry = relatedEntry?.details.origin;
    const regionSystem = relatedEntry?.details.classification;
    const regionClimate = relatedEntry?.climate;
    const regionCountryColors = getCountryChipColors(regionCountry);
    const regionSystemColors = SYSTEM_CHIP_COLOR;
    const regionClimateColors = CLIMATE_CHIP_COLOR;
    const regionClimateName = regionClimate ? CLIMATE_CLASS_MAP[regionClimate]?.name : undefined;
    const linkedWineType = relatedEntry?.grapeCard?.style || relatedEntry?.wineType;
    const linkedTypeColors = getTypeTileColors(linkedWineType);
    const linkedRarity = relatedEntry?.rarity || (relatedEntry?.grapeCard?.rarityTier ? relatedEntry.grapeCard.rarityTier.toUpperCase() : undefined);
    const linkedRarityColors = getRarityColors(linkedRarity);
    const linkedOrigin = relatedEntry?.details.origin;
    const linkedOriginColors = getCountryChipColors(linkedOrigin);
    const showLinkedGrapeChips = relatedEntry?.category === 'GRAPES';
    const linkedGrapeColorLabel = showLinkedGrapeChips && relatedEntry ? getGrapeColorLabel(relatedEntry) : undefined;
    const linkedGrapeBodyLabel = showLinkedGrapeChips && relatedEntry ? getGrapeBodyLabel(relatedEntry) : undefined;

    return (
      <button
        key={idx}
        onClick={() => isLinkable && relatedEntry && onSelectRelated(relatedEntry)}
        disabled={!isLinkable}
        className={`w-full bg-stone-900 border-2 rounded p-3 flex items-center gap-3 relative overflow-hidden group transition-all text-left ${
          isLinkable ? 'border-stone-700 hover:border-green-500 hover:bg-stone-800 active:translate-y-0.5' : 'border-stone-800 opacity-70 cursor-default'
        }`}
      >
        <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-stone-600 group-hover:border-green-400 transition-colors"></div>
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-stone-600 group-hover:border-green-400 transition-colors"></div>

        <div
          className={`shrink-0 ${CONTAINER_SIZE_LIST} ${CONTAINER_BORDER_CLASS} ${CONTAINER_SHADOW_CLASS} flex items-center justify-center ${CONTAINER_BORDER} ${!isLinkable ? 'grayscale' : ''}`}
          style={linkedVisual.style}
        >
          {linkedVisual.iconNode}
        </div>

        <div className="flex-1 flex items-center gap-2 min-w-0">
          <div className="flex-1">
            <span className={`font-retro text-base leading-tight break-words whitespace-normal ${isLinkable ? 'text-white group-hover:text-green-400' : 'text-stone-500'}`}>
              {displayName}
            </span>
            {options?.useCountryFlag && classificationLabel && (
              <span className="text-[10px] tracking-widest uppercase text-stone-400 block">
                {classificationLabel}
              </span>
            )}
            {isRegionMeta && (
              <div className="mt-1 flex flex-wrap gap-1">
                {regionCountry && (
                  <Chip label={regionCountry} colorStyle={regionCountryColors} />
                )}
                {regionSystem && (
                  <Chip label={extractTagAbbrev(regionSystem)} colorStyle={regionSystemColors} />
                )}
                {regionClimate && regionClimateName && (
                  <Chip label={regionClimateName} colorStyle={regionClimateColors} />
                )}
              </div>
            )}
            {showLinkedGrapeChips && (
              <div className="mt-1 flex flex-wrap gap-1">
                {linkedGrapeColorLabel && (
                  <Chip label={formatUpper(linkedGrapeColorLabel)} colorStyle={getGrapeColorChipColors(linkedGrapeColorLabel)} />
                )}
                {linkedGrapeBodyLabel && (
                  <Chip label={formatUpper(linkedGrapeBodyLabel)} colorStyle={getGrapeBodyChipColors(linkedGrapeBodyLabel)} />
                )}
                {linkedOrigin && (
                  <Chip label={formatUpper(linkedOrigin)} colorStyle={linkedOriginColors} />
                )}
              </div>
            )}
          </div>
          {isLinkable && <ChevronRight size={16} className="text-stone-600 group-hover:text-green-500 shrink-0 ml-2" />}
        </div>
      </button>
    );
  };

  const getFlavorClassColors = (cls?: string) => {
    const key = cls?.toUpperCase();
    switch (key) {
      case 'SWEET': return { bg: '#451a03', border: '#b45309', text: '#fffbeb' };
      case 'SOUR': return { bg: '#052e16', border: '#16a34a', text: '#dcfce7' };
      case 'SALTY': return { bg: '#0c4a6e', border: '#0ea5e9', text: '#e0f2fe' };
      case 'BITTER': return { bg: '#312e81', border: '#6d28d9', text: '#ede9fe' };
      case 'UMAMI': return { bg: '#0f766e', border: '#0d9488', text: '#e0f2f1' };
      default: return { bg: '#1f2937', border: '#4b5563', text: '#e5e7eb' };
    }
  };

  const getFlavorSubclassColors = (sub?: string) => {
    const key = sub?.toUpperCase();
    switch (key) {
      case 'CITRUS': return { bg: '#9a3412', border: '#f97316', text: '#fff7ed' };
      case 'ORCHARD_FRUIT': return { bg: '#3f6212', border: '#84cc16', text: '#ecfccb' };
      case 'STONE_FRUIT': return { bg: '#b45309', border: '#fb923c', text: '#fff7ed' };
      case 'TROPICAL': return { bg: '#a16207', border: '#eab308', text: '#fef9c3' };
      case 'RED_FRUIT': return { bg: '#7f1d1d', border: '#ef4444', text: '#fee2e2' };
      case 'DARK_FRUIT': return { bg: '#581c87', border: '#8b5cf6', text: '#f3e8ff' };
      case 'BERRY': return { bg: '#701a3c', border: '#e11d48', text: '#ffe4e6' };
      case 'HERBAL': return { bg: '#065f46', border: '#34d399', text: '#d1fae5' };
      case 'VEGETAL': return { bg: '#14532d', border: '#22c55e', text: '#dcfce7' };
      case 'SPICE': return { bg: '#78350f', border: '#d97706', text: '#ffedd5' };
      case 'BAKING': return { bg: '#4b2e12', border: '#c08457', text: '#f6e7d0' };
      case 'FLORAL': return { bg: '#831843', border: '#ec4899', text: '#fce7f3' };
      case 'EARTH': return { bg: '#292524', border: '#78716c', text: '#f5f5f4' };
      case 'WOOD': return { bg: '#4b3621', border: '#8b5a2b', text: '#f3e8d2' };
      case 'MARINE': return { bg: '#0c4a6e', border: '#0ea5e9', text: '#e0f2fe' };
      case 'WAX': return { bg: '#713f12', border: '#f59e0b', text: '#fff7ed' };
      case 'NUT': return { bg: '#6b4e16', border: '#eab308', text: '#fef9c3' };
      default: return { bg: '#1f2937', border: '#4b5563', text: '#e5e7eb' };
    }
  };

  const getClimateColors = (climate?: ClimateClass) => {
    if (!climate) return { bg: '#0f172a', border: '#334155', text: '#e2e8f0' };
    const meta = CLIMATE_CLASS_MAP[climate];
    return meta ? meta.colors : { bg: '#0f172a', border: '#334155', text: '#e2e8f0' };
  };

  const getClimateIcon = (climate?: ClimateClass) => {
    switch (climate) {
      case 'maritime': return <Droplet size={20} />;
      case 'continental': return <Mountain size={20} />;
      case 'cool': return <Wind size={20} />;
      case 'warm': return <Sun size={20} />;
      case 'mediterranean': return <Sparkles size={20} />;
      default: return <Cloud size={20} />;
    }
  };

  // Header Tiles Logic - Updated to remove rarity from regions/styles, add rarity clickable for grapes
  const renderHeaderTiles = () => {
      // New 3-tile visual language
      const tileBase = "flex flex-col items-center justify-start pt-1 pb-1 w-full border-0 bg-transparent group relative";
      const tileRowStyle = "grid grid-cols-3 gap-3 px-2 py-1 mb-3";
      const labelStyle = "font-retro text-[10px] md:text-[11px] tracking-normal text-green-500 z-10 whitespace-nowrap leading-none w-full text-center mb-2";
      const chipStyle = "inline-flex items-center justify-center px-2 py-1 rounded border font-retro text-[8px] md:text-[9px] tracking-normal leading-tight uppercase z-10 text-center mt-2";
      const iconRowStyle = "h-10 flex items-center justify-center mb-1";
      const getTileRowClass = (tileCount: number) =>
        tileCount === 2 ? 'grid grid-cols-2 gap-2 px-1 mb-3' : tileRowStyle;
      
      if (isCountry) {
        return null;
      }

      if (isGrapes) {
          // Tile 1: Color Grape
          const headerTileIconSize = 32;
          const colorType = grapeCard?.type === 'red' ? 'RED' : 'WHITE';
          const colorTypeColors = getColorTypeColors(colorType);
          const colorIconNode = colorType === 'RED' ? <Wine size={headerTileIconSize} /> : <GlassWater size={headerTileIconSize} />;
          const countryStyle = getCountryChipColors(entry.details.origin);
          const normalizedOrigin = entry.details.origin ? entry.details.origin.toLowerCase().trim() : undefined;
          const countryFlagGradient = getFlagGradient(normalizedOrigin);
          const countryFlagImage = getFlagImage(normalizedOrigin);

          return (
              <div className={getTileRowClass(3)}>
                  {/* Tile 1: Color Grape */}
                  <div className={tileBase} style={{ backgroundColor: 'transparent', borderColor: 'transparent', color: '#22c55e' }}>
                      <span className={labelStyle}>COLOR</span>
                      <div className={iconRowStyle} style={{ color: colorTypeColors.bg }}>
                        {colorIconNode}
                      </div>
                      <span className={chipStyle} style={{ backgroundColor: colorTypeColors.bg, borderColor: colorTypeColors.border, color: colorTypeColors.text }}>
                        {colorType}
                      </span>
                  </div>

                  {/* Tile 2: Type (was rarity) */}
                  <button 
                    onClick={() => grapeCard?.style && onFilterByType?.(normalizeTypeClass(grapeCard.style), 'GRAPES')}
                    className={tileBase}
                    style={{ backgroundColor: 'transparent', borderColor: 'transparent', color: '#22c55e' }}
                  >
                      <span className={labelStyle}>TYPE</span>
                      <div className={iconRowStyle}>
                        <Grape size={headerTileIconSize} />
                      </div>
                      <span className={chipStyle} style={{ backgroundColor: '#222', borderColor: '#16a34a', color: '#bbf7d0' }}>
                        {normalizeTypeClass(grapeCard?.style)}
                      </span>
                  </button>

                  {/* Tile 3: Country */}
                  <button 
                    onClick={() => entry.details.origin && onFilterByOrigin(entry.details.origin)} 
                    className={tileBase}
                    style={{ backgroundColor: 'transparent', borderColor: 'transparent', color: '#22c55e' }}
                  >
                       <span className={labelStyle}>ORIGIN</span>
                       <div className={iconRowStyle}>
                         <div className="w-12 h-12 rounded border-2 border-white shadow-inner bg-stone-900 flex-shrink-0 overflow-hidden flex items-center justify-center">
                           {countryFlagImage ? (
                             <img
                                 src={countryFlagImage}
                                 alt={entry.details.origin}
                                 style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                 draggable={false}
                               />
                           ) : (
                             <span className="w-full h-full block" style={{ background: countryFlagGradient }} />
                           )}
                         </div>
                       </div>
                       <span className={chipStyle} style={{ backgroundColor: countryStyle.bg, borderColor: countryStyle.border, color: countryStyle.text }}>
                         {formatUpper(entry.details.origin)}
                       </span>
                  </button>
              </div>
          );
      } else if (isRegion) {
      const mainGrape = entry.details.notableGrapes?.[0] || 'N/A';
      const mainGrapeEntry = getRelatedEntry(mainGrape, 'GRAPES');
      const mainGrapeTypeColors = getTypeTileColors(mainGrapeEntry?.wineType);
      // Use the grape's hero image/icon and container, matching the grape detail header
      const mainGrapeVisual = mainGrapeEntry
        ? resolveEntryIconVisual(mainGrapeEntry, {
            size: ICON_SIZE_HEADER,
            resolver: entryVisualResolver,
            includeRegionClimateOutline: true,
          })
        : undefined;
      const mainGrapeIconNode = mainGrapeVisual?.iconNode;
      const mainGrapeIconStyle = mainGrapeVisual?.style;
      const countryStyle = getCountryChipColors(entry.details.origin);
      const climateMeta = entry.climate ? CLIMATE_CLASS_MAP[entry.climate] : undefined;
      const climateStyle = CLIMATE_CHIP_COLOR;
      const flagGradient = getFlagGradient(entry.details.origin);
      const flagImage = getFlagImage(entry.details.origin);
      
      return (
          <div className={getTileRowClass(3)}>
              {/* Tile 1: Main Grape */}
              <button 
                onClick={() => mainGrapeEntry && onSelectRelated(mainGrapeEntry)}
                disabled={!mainGrapeEntry}
                className={tileBase}
                style={{ backgroundColor: 'transparent', borderColor: 'transparent', color: '#22c55e' }}
              >
                   <span className={labelStyle}>KEY GRAPE</span>
                   <div
                     className={"w-12 h-12 rounded-lg border border-stone-700 shadow-inner flex items-center justify-center mb-1"}
                     style={mainGrapeIconStyle}
                   >
                     {/* Render the icon at 32px, centered */}
                     {mainGrapeEntry && resolveEntryIconVisual(mainGrapeEntry, {
                       size: 32,
                       resolver: entryVisualResolver,
                       includeRegionClimateOutline: true,
                     }).iconNode}
                   </div>
                   <span className={chipStyle} style={{ backgroundColor: mainGrapeTypeColors.bg, borderColor: mainGrapeTypeColors.border, color: mainGrapeTypeColors.text }}>
                     {formatUpper(mainGrape)}
                   </span>
              </button>

              {/* Tile 2: Climate */}
              <div
                className={`${tileBase} cursor-default`}
                style={{ backgroundColor: 'transparent', borderColor: 'transparent', color: '#22c55e' }}
              >
                   <span className={labelStyle}>CLIMATE</span>
                   <div className={iconRowStyle} style={{ color: climateStyle.border }}>
                     {React.isValidElement(getClimateIcon(entry.climate))
                       ? React.cloneElement(getClimateIcon(entry.climate) as React.ReactElement<any>, { size: 32 })
                       : getClimateIcon(entry.climate)}
                   </div>
                   <span className={chipStyle} style={{ backgroundColor: climateStyle.bg, borderColor: climateStyle.border, color: climateStyle.text }}>
                     {formatUpper(climateMeta?.name || 'N/A')}
                   </span>
              </div>

              {/* Tile 3: Country (right aligned via grid order) */}
              <button 
                onClick={() => entry.details.origin && onFilterByOrigin(entry.details.origin)} 
                className={tileBase}
                style={{ backgroundColor: 'transparent', borderColor: 'transparent', color: '#22c55e' }}
              >
                   <span className={labelStyle}>COUNTRY</span>
                   <div className={iconRowStyle}>
                     <div className="w-12 h-12 rounded border-2 border-white shadow-inner bg-stone-900 flex-shrink-0 overflow-hidden flex items-center justify-center">
                       {flagImage ? (
                         <img
                           src={flagImage}
                           alt={entry.details.origin}
                           style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                           draggable={false}
                         />
                       ) : (
                         <span className="w-full h-full block" style={{ background: flagGradient }} />
                       )}
                     </div>
                   </div>
                   <span className={chipStyle} style={{ backgroundColor: countryStyle.bg, borderColor: countryStyle.border, color: countryStyle.text }}>
                     {formatUpper(entry.details.origin)}
                   </span>
              </button>
              </div>
          );
      } else if (isStyle) {
          const classColors = getClassTypeColors(styleClassType as 'STYLE' | 'METHOD' | 'ORIGIN' | 'TYPE' | 'BLEND' | undefined);
          const flagGradient = getFlagGradient(entry.details.origin);
          const flagImage = getFlagImage(entry.details.origin);
          const styleClassIconNode = (() => {
            switch (styleClassType) {
              case 'BLEND': return <Scale size={32} />;
              case 'METHOD': return <Sparkles size={32} />;
              case 'ORIGIN': return <MapPin size={32} />;
              case 'TYPE': return <Shield size={32} />;
              case 'STYLE':
              default:
                return <Grape size={32} />;
            }
          })();

          const colorIconNode = (() => {
            switch (colorType) {
              case 'RED': return <Wine size={32} />;
              case 'WHITE': return <GlassWater size={32} />;
              case 'ROSE': return <Droplets size={32} />;
              case 'ORANGE': return <Sun size={32} />;
              case 'DUAL':
              default:
                return <Droplets size={32} />;
            }
          })();

          const colorTile = (
            <button
              key="color-type"
              onClick={() => colorType && onFilterByType(colorType, 'STYLES')}
              className={tileBase}
              style={{ backgroundColor: 'transparent', borderColor: 'transparent', color: '#22c55e' }}
            >
              <span className={labelStyle}>COLOR</span>
              <div className={iconRowStyle} style={{ color: colorTypeColors.bg }}>
                {colorIconNode}
              </div>
              <span className={chipStyle} style={{ backgroundColor: colorTypeColors.bg, borderColor: colorTypeColors.border, color: colorTypeColors.text }}>
                {colorType}
              </span>
            </button>
          );

          const classTile = (
            <button
              key="class"
              onClick={() => styleClassType && onFilterByNote(styleClassType, 'STYLES', 'TASTING')}
              className={tileBase}
              style={{ backgroundColor: 'transparent', borderColor: 'transparent', color: '#22c55e' }}
            >
              <span className={labelStyle}>CLASS</span>
              <div className={iconRowStyle} style={{ color: classColors.border }}>
                {styleClassIconNode}
              </div>
              <span className={chipStyle} style={{ backgroundColor: classColors.bg, borderColor: classColors.border, color: classColors.text }}>
                {styleClassType}
              </span>
            </button>
          );

          const originChipColors = entry.details.origin ? getCountryChipColors(entry.details.origin) : null;
          const originLabel = styleClassType === 'STYLE' || styleClassType === 'BLEND' ? 'ORIGIN' : 'COUNTRY';
          const originTile = entry.details.origin ? (
            <button
              key="origin"
              onClick={() => onFilterByOrigin(entry.details.origin!)}
              className={tileBase}
              style={{ backgroundColor: 'transparent', borderColor: 'transparent', color: '#22c55e' }}
            >
              <span className={labelStyle}>{originLabel}</span>
              <div className={iconRowStyle}>
                <span
                  className="w-12 h-8 rounded-sm border-2 border-white shadow-inner"
                  style={{
                    backgroundImage: flagImage ? `url(${flagImage})` : flagGradient,
                    backgroundSize: flagImage ? 'cover' : undefined,
                    backgroundPosition: flagImage ? 'center' : undefined
                  }}
                ></span>
              </div>
              <span className={chipStyle} style={{ backgroundColor: originChipColors?.bg, borderColor: originChipColors?.border, color: originChipColors?.text }}>
                {formatUpper(entry.details.origin)}
              </span>
            </button>
          ) : null;

          const tiles = [classTile, colorTile];
          if (originTile) tiles.push(originTile);

          return <div className={getTileRowClass(tiles.length)}>{tiles}</div>;
      } else if (isFlavor) {
        const flavorClass = entry.details.classification || 'FLAVOR';
        const flavorColors = getFlavorClassColors(flavorClass);
        const subclass = entry.details.subclass || 'SUBCLASS';
        const subclassColors = getFlavorSubclassColors(entry.details.subclass);
        const linkedGrapesCount = (entry.details.notableGrapes || []).length;
        const linkedGrapesColors = { bg: '#14532d', border: '#22c55e', text: '#dcfce7' };

        const flavorClassIconNode = (() => {
          switch (flavorClass.toUpperCase()) {
            case 'SWEET': return <Sparkles size={32} />;
            case 'SOUR': return <Citrus size={32} />;
            case 'SALTY': return <Droplets size={32} />;
            case 'BITTER': return <Leaf size={32} />;
            case 'UMAMI': return <Flame size={32} />;
            default: return <Circle size={32} />;
          }
        })();

        const subclassIconNode = buildIconNode(entry.icon || 'default', subclassColors.border, 32);

        return (
          <div className={getTileRowClass(3)}>
            <button
              className={tileBase}
              onClick={() => onFilterByNote(flavorClass, 'FLAVORS', 'TASTING')}
              style={{ backgroundColor: 'transparent', borderColor: 'transparent', color: '#22c55e' }}
            >
              <span className={labelStyle}>CLASS</span>
              <div className={iconRowStyle} style={{ color: flavorColors.border }}>
                {flavorClassIconNode}
              </div>
              <span className={chipStyle} style={{ backgroundColor: flavorColors.bg, borderColor: flavorColors.border, color: flavorColors.text }}>
                {flavorClass}
              </span>
            </button>
            <button
              className={tileBase}
              onClick={() => onFilterByNote(subclass, 'FLAVORS', 'TASTING')}
              style={{ backgroundColor: 'transparent', borderColor: 'transparent', color: '#22c55e' }}
            >
              <span className={labelStyle}>SUBCLASS</span>
              <div className={iconRowStyle} style={{ color: subclassColors.border }}>
                {subclassIconNode}
              </div>
              <span className={chipStyle} style={{ backgroundColor: subclassColors.bg, borderColor: subclassColors.border, color: subclassColors.text }}>
                {subclass.replace(/_/g, ' ')}
              </span>
            </button>
            <div className={`${tileBase} cursor-default`}>
              <span className={labelStyle}>GRAPES</span>
              <div className={iconRowStyle} style={{ color: linkedGrapesColors.border }}>
                <Grape size={32} />
              </div>
              <span className={chipStyle} style={{ backgroundColor: linkedGrapesColors.bg, borderColor: linkedGrapesColors.border, color: linkedGrapesColors.text }}>
                {linkedGrapesCount}
              </span>
            </div>
          </div>
        );
      }
      return null;
  };

  const headerTiles = renderHeaderTiles();

  return (
    <DeviceLayout
      title={scanTitle}
      onBack={onBack}
      showBack={true}
      onHome={onHome}
    >
      <div ref={scrollRef} className="h-full overflow-y-auto custom-scrollbar bg-black text-green-400 p-4 font-mono pb-20 text-[15px] md:text-base">
        
        {/* Header Area with Title - Updated for text wrapping */}
        <div className="w-full min-h-[6rem] border-b-4 border-green-800 bg-green-900/10 mb-4 relative overflow-hidden flex items-center justify-center shrink-0 p-4">
             <div className="absolute inset-0 grid grid-cols-8 grid-rows-4 opacity-20">
                {Array.from({ length: 32 }).map((_, i) => (
                    <div key={i} className="border border-green-900/50"></div>
                ))}
             </div>
             <div className="text-center z-10 w-full flex flex-col items-center px-2">
                {(() => {
                  const headerVisual = resolveEntryIconVisual(entry, {
                    size: ICON_SIZE_HEADER,
                    resolver: entryVisualResolver,
                    includeRegionClimateOutline: true,
                  });
                  // Hero: same width as before, height matches flag (h-8)
                  // Make hero icon bigger and perfectly square
                  return (
                    <div
                      className={`w-20 h-20 ${HEADER_BORDER_CLASS} border-2 ${isCountry || isState ? 'border-white' : 'border-black/30'} shadow-inner flex items-center justify-center mb-4 bg-stone-900`}
                      style={headerVisual.style}
                    >
                      {headerVisual.iconNode}
                    </div>
                  );
                })()}
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-retro text-white drop-shadow-[4px_4px_0px_rgba(0,100,0,0.8)] tracking-wide leading-tight break-words whitespace-normal uppercase w-full mt-4 mb-2" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                  {entry.name}
                </h1>
             </div>
        </div>

        {/* 3-Tile Header Row */}
        {headerTiles}
        {headerTiles ? <div className="w-full border-b-4 border-green-800 mb-4"></div> : null}

        {/* Info Section - Description at Top (skip for flavor entries) */}
        {!isFlavor && (
          <div className="mb-6">
              <div className="flex items-center gap-2 mb-2 border-b-2 border-green-800 pb-1">
                  <BookOpen size={18} className="text-green-500" />
                  <span className="font-retro text-xs md:text-sm tracking-widest text-green-500">INFO</span>
              </div>
              <div className="border-l-4 border-green-700 pl-4 py-3 bg-green-900/5">
                  <p className="text-lg md:text-xl leading-relaxed text-green-200 font-medium break-words whitespace-normal normal-case">
                      {grapeCard?.info || entry.description}
                  </p>
              </div>
          </div>
        )}

        {/* Search States Button - USA only */}
        {isCountry && entry.name === 'USA' && onViewStates && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2 border-b-2 border-green-800 pb-1">
              <MapPinned size={18} className="text-green-500" />
              <span className="font-retro text-xs md:text-sm tracking-widest text-green-500">STATES</span>
            </div>
            <button
              onClick={onViewStates}
              className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-stone-900 border-2 border-stone-700 hover:border-green-500 hover:bg-stone-800 rounded transition-all group"
            >
              <MapPinned size={20} className="text-green-500 group-hover:text-green-400" />
              <span className="font-retro text-base tracking-widest text-green-500 group-hover:text-green-400">SEARCH STATES</span>
            </button>
          </div>
        )}

        {/* Main Grapes Section - States */}
        {isState && entry.details.notableGrapes && entry.details.notableGrapes.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2 border-b-2 border-green-800 pb-1">
              <Leaf size={18} className="text-green-500" />
              <span className="font-retro text-xs md:text-sm tracking-widest text-green-500">MAIN GRAPES</span>
            </div>
            <div className="space-y-2">
              {entry.details.notableGrapes.slice(0, 3).map((grape, idx) => renderLinkedTile(grape, idx))}
            </div>
          </div>
        )}

        {/* Appellation Systems Section - States */}
        {isState && entry.tags && entry.tags.filter(t => t !== 'STATE').length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2 border-b-2 border-green-800 pb-1">
              <Shield size={18} className="text-green-500" />
              <span className="font-retro text-xs md:text-sm tracking-widest text-green-500">APPELLATION SYSTEMS</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {entry.tags.filter(t => t !== 'STATE').map((system, idx) => {
                const c = APPELLATION_CHIP_COLORS[idx % 3];
                return (
                  <span key={idx} className="px-4 py-2 rounded text-xl font-bold font-mono tracking-widest" style={{ backgroundColor: c.bg, border: `1px solid ${c.border}`, color: c.text }}>
                    {extractTagAbbrev(system)}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Key Regions Section - States */}
        {isState && entry.details.keyRegions && entry.details.keyRegions.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2 border-b-2 border-green-800 pb-1">
              <MapPin size={18} className="text-green-500" />
              <span className="font-retro text-xs md:text-sm tracking-widest text-green-500">KEY REGIONS</span>
            </div>
            <div className="space-y-2">
              {entry.details.keyRegions.slice(0, 6).map((item, idx) => renderLinkedTile(item, idx, { showRegionMetaTiles: true }))}
            </div>
          </div>
        )}

        {/* Main Grapes Section - Countries */}
        {isCountry && entry.details.notableGrapes && entry.details.notableGrapes.length > 0 && (
          <div className="mb-6">
              <div className="flex items-center gap-2 mb-2 border-b-2 border-green-800 pb-1">
                  <Leaf size={18} className="text-green-500" />
                  <span className="font-retro text-xs md:text-sm tracking-widest text-green-500">MAIN GRAPES</span>
              </div>
              <div className="space-y-2">
                {entry.details.notableGrapes.slice(0, 3).map((grape, idx) => renderLinkedTile(grape, idx))}
              </div>
          </div>
        )}

        {/* System Section - Appellation Systems for Countries */}
        {isCountry && entry.tags && entry.tags.length > 0 && (
          <div className="mb-6">
              <div className="flex items-center gap-2 mb-2 border-b-2 border-green-800 pb-1">
                  <Shield size={18} className="text-green-500" />
                  <span className="font-retro text-xs md:text-sm tracking-widest text-green-500">APPELLATION SYSTEMS</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {entry.tags.filter(tag => tag !== 'COUNTRY').map((system, idx) => {
                  const c = APPELLATION_CHIP_COLORS[idx % 3];
                  return (
                    <span key={idx} className="px-4 py-2 rounded text-xl font-bold font-mono tracking-widest" style={{ backgroundColor: c.bg, border: `1px solid ${c.border}`, color: c.text }}>
                      {extractTagAbbrev(system)}
                    </span>
                  );
                })}
              </div>
          </div>
        )}

        {/* Key Regions Section - Countries with Regions */}
        {isCountry && entry.details.keyRegions && entry.details.keyRegions.length > 0 && (
          <div className="mb-6">
              <div className="flex items-center gap-2 mb-2 border-b-2 border-green-800 pb-1">
                  <MapPin size={18} className="text-green-500" />
                  <span className="font-retro text-xs md:text-sm tracking-widest text-green-500">KEY REGIONS</span>
              </div>
              <div className="space-y-2">
                {entry.details.keyRegions.slice(0, 6).map((item, idx) => renderLinkedTile(item, idx, { showRegionMetaTiles: true }))}
              </div>
          </div>
        )}

        {/* Alternate Names Section - Grapes */}
        {isGrapes && (
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-3 border-b-2 border-green-800 pb-1">
                    <Tag size={18} className="text-green-500" />
                    <span className="font-retro text-xs md:text-sm tracking-widest text-green-500">ALTERNATE NAMES</span>
                </div>
                {grapeAlternateNames.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                      {grapeAlternateNames.map((name, i) => (
                          <span key={i} className="px-4 py-2 bg-stone-800 text-stone-200 border border-stone-600 text-xl font-bold font-mono rounded tracking-widest">
                              {name}
                          </span>
                      ))}
                  </div>
                ) : (
                  <div className="border border-stone-700 bg-stone-900/80 rounded p-3">
                    <p className="text-xl font-bold font-mono text-stone-300 tracking-widest">NO ALTERNATE NAMES LISTED.</p>
                  </div>
                )}
            </div>
        )}

        {/* Rarity Section - Grapes */}
        {isGrapes && (
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-3 border-b-2 border-green-800 pb-1">
                    <Star size={24} className="text-green-400" />
                    <span className="font-retro text-xs md:text-sm tracking-widest text-green-400">RARITY</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="flex-1 flex items-center px-6 py-3 rounded-full border-2 border-green-500 bg-green-950 text-2xl font-extrabold uppercase text-green-300 justify-between" style={{ fontSize: '2rem', letterSpacing: '0.1em' }}>
                    {displayClass}
                    <span className="ml-4 flex items-center">
                      {(() => {
                        const rarity = (entry.rarity || '').toUpperCase();
                        if (rarity === 'NOBLE') {
                          return <Crown size={40} className="text-yellow-400 ml-2" />;
                        }
                        const starCount = rarity === 'RARE' ? 3 : rarity === 'COMMON' ? 2 : rarity === 'UNCOMMON' ? 1 : 1;
                        return Array.from({ length: starCount }).map((_, i) => (
                          <Star key={i} size={36} className="text-yellow-400 ml-1" fill="#facc15" />
                        ));
                      })()}
                    </span>
                  </span>
                </div>
            </div>
        )}



        {/* Stats Section - Only for GRAPES */}
        {isGrapes && grapeCard && (
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-2 border-b-2 border-green-800 pb-1">
                    <Activity size={18} className="text-green-500" />
                    <span className="font-retro text-xs md:text-sm tracking-widest text-green-500">CHARACTERISTICS</span>
                </div>
                <div className="space-y-4 bg-stone-900 p-3 rounded border border-stone-800">
                    {([
                      { label: 'BODY', value: grapeCard.characteristics.body, color: 'bg-green-500' },
                      { label: 'ACID', value: grapeCard.characteristics.acid, color: 'bg-yellow-500' },
                      { label: 'TANNIN', value: grapeCard.characteristics.tannin, color: 'bg-red-500' },
                      { label: 'AROMATICS', value: grapeCard.characteristics.aromatics, color: 'bg-purple-400' },
                      { label: 'COLOR', value: grapeCard.characteristics.colorIntensity, color: 'bg-amber-500' },
                    ]).map(stat => (
                      <div className="flex items-center gap-3" key={stat.label}>
                          <span className="w-24 text-base font-bold text-white font-mono tracking-widest shrink-0">{stat.label}</span>
                          <div className="flex-1 h-2 bg-stone-800 flex gap-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                  <div key={i} className={`flex-1 ${i < stat.value ? stat.color : 'bg-transparent'} transition-all`}></div>
                              ))}
                          </div>
                      </div>
                    ))}
                </div>
            </div>
        )}

        {/* System Section - Regions */}
        {isRegion && entry.details.classification && (
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-2 border-b-2 border-green-800 pb-1">
                    <Shield size={18} className="text-green-500" />
                    <span className="font-retro text-xs md:text-sm tracking-widest text-green-500">APPELLATION SYSTEMS</span>
                </div>
                <div className="flex flex-wrap gap-2">
                    <span className="px-4 py-2 rounded text-xl font-bold font-mono tracking-widest" style={{ backgroundColor: SYSTEM_CHIP_COLOR.bg, border: `1px solid ${SYSTEM_CHIP_COLOR.border}`, color: SYSTEM_CHIP_COLOR.text }}>
                      {extractTagAbbrev(entry.details.classification || '')}
                    </span>
                </div>
            </div>
        )}

        {/* Appellations Section - Regions with appellations */}
        {isRegion && entry.details.appellations && entry.details.appellations.length > 0 && (
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-3 border-b-2 border-green-800 pb-1">
                    <MapPinned size={18} className="text-green-500" />
                    <span className="font-retro text-xs md:text-sm tracking-widest text-green-500">
                        {entry.name.includes('Beaujolais') ? 'CRUS OF BEAUJOLAIS' : 'APPELLATIONS'}
                    </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    {entry.details.appellations.map((appellation, i) => (
                        <div key={i} className="px-4 py-2 bg-stone-800 text-stone-200 border border-stone-600 text-xl font-bold font-mono rounded text-center tracking-widest">
                            {appellation}
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* Notable Grapes Section - Regions */}
        {isRegion && listSectionData && listSectionData.length > 0 && (
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-3 border-b-2 border-green-800 pb-1">
                   <List size={18} className="text-green-500" />
                   <span className="font-retro text-xs md:text-sm tracking-widest text-green-500">NOTABLE GRAPES</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                     {listSectionData.slice(0, 8).map((item, idx) => renderLinkedTile(item, idx))}
                </div>
            </div>
        )}

        {/* Notable Regions Section - Grapes */}
        {isGrapes && listSectionData && listSectionData.length > 0 && (
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-3 border-b-2 border-green-800 pb-1">
                   <MapPin size={18} className="text-green-500" />
                   <span className="font-retro text-xs md:text-sm tracking-widest text-green-500">NOTABLE REGIONS</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                     {listSectionData.slice(0, 8).map((item, idx) => renderLinkedTile(item, idx, { showRegionMetaTiles: true }))}
                </div>
            </div>
        )}

        {/* Countries Section - Continents */}
        {isContinent && listSectionData && listSectionData.length > 0 && (
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-3 border-b-2 border-green-800 pb-1">
                   <List size={18} className="text-green-500" />
                   <span className="font-retro text-xs md:text-sm tracking-widest text-green-500">{listSectionTitle}</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                   {listSectionData.map((item, idx) => renderLinkedTile(item, idx, { preferCountryGate: true }))}
                </div>
            </div>
        )}

        {/* Climate Section - Regions */}
        {isRegion && (
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-2 border-b-2 border-green-800 pb-1">
                    <Wind size={18} className="text-green-500" />
                    <span className="font-retro text-xs md:text-sm tracking-widest text-green-500">CLIMATE</span>
                </div>
                <div className="flex flex-wrap gap-2">
                    <span className="px-4 py-2 rounded text-xl font-bold font-mono tracking-widest" style={{ backgroundColor: CLIMATE_CHIP_COLOR.bg, border: `1px solid ${CLIMATE_CHIP_COLOR.border}`, color: CLIMATE_CHIP_COLOR.text }}>
                      {(entry.climate && CLIMATE_CLASS_MAP[entry.climate]?.name) || 'Unknown Climate'}
                    </span>
                </div>
            </div>
        )}

        {/* Soil Composition Section - Regions */}
        {isRegion && (
            <div className="mb-6">
                 <div className="flex items-center gap-2 mb-3 border-b-2 border-green-800 pb-1">
                   <Mountain size={18} className="text-green-500" />
                   <span className="font-retro text-xs md:text-sm tracking-widest text-green-500">SOIL COMPOSITION</span>
                 </div>
                 <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 items-stretch">
                    {regionSoils.map((soil, i) => {
                        const { icon, color } = getSoilIcon(soil);
                        return (
                            <button 
                                key={`${soil}-${i}`}
                                onClick={() => onFilterBySoil(soil)}
                                className="w-full flex flex-col items-center gap-3 p-3 bg-stone-900 border-2 border-stone-800 rounded-lg hover:border-green-500 hover:bg-stone-800 transition-all active:scale-95 group h-full"
                            >
                                <div 
                                  className="w-12 h-12 rounded-lg flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform border-2"
                                  style={{ backgroundColor: '#0b0f19', borderColor: color }}
                                >
                                  <span style={{ color }}>
                                    {icon}
                                  </span>
                                </div>
                                <span className="font-retro text-xs text-white uppercase text-center leading-tight group-hover:text-green-300">
                                  {soil}
                                </span>
                            </button>
                        );
                    })}
                 </div>
            </div>
        )}

        {/* Tasting Notes Section - List Tile (For Grapes only) */}
        {isGrapes && (
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-3 border-b-2 border-green-800 pb-1">
                    <Grape size={18} className="text-green-500" />
                    <span className="font-retro text-xs md:text-sm tracking-widest text-green-500">FLAVOR PROFILE</span>
                </div>
                {matchedFlavorNotes.length > 0 ? (
                  <div className="flex flex-col gap-2 w-full">
                    {matchedFlavorNotes.map((note, i) => {
                      // Get icon, color, and label
                      const { iconNode, borderColor, bgColor, label } = getFlavorTileVisual(note);
                      // Get class and type
                      const subclass = categorizeFlavorSubclass(label);
                      const flavorClass = categorizeFlavor(label, subclass);
                      const classColor = getFlavorClassChipColors(flavorClass);
                      const typeColor = getFlavorSubclassChipColors(subclass);
                      return (
                        <div
                          key={i}
                          className="w-full bg-stone-900 border-2 border-stone-700 rounded p-2 flex items-center gap-3 relative overflow-hidden min-h-[4.5rem]"
                        >
                          {/* Hero Icon */}
                          <div
                            className={`shrink-0 ${CONTAINER_SIZE_LIST} ${CONTAINER_BORDER_CLASS} ${CONTAINER_SHADOW_CLASS} flex items-center justify-center ${CONTAINER_BORDER}`}
                            style={{ backgroundColor: bgColor, borderColor }}
                          >
                            {iconNode}
                          </div>
                          {/* Name and Chips */}
                          <div className="flex flex-col flex-1 min-w-0 justify-center h-full items-start py-1">
                            <span className="font-retro text-base text-white leading-tight tracking-tight whitespace-normal break-words">
                              {label.toUpperCase()}
                            </span>
                            <div className="flex gap-1 mt-1">
                              <Chip label={flavorClass} colorStyle={classColor} />
                              <Chip label={subclass.replace(/_/g, ' ')} colorStyle={typeColor} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="border border-stone-700 bg-stone-900/80 rounded p-3">
                    <p className="text-sm text-stone-300">No flavor profile listed.</p>
                  </div>
                )}
            </div>
        )}

        {/* Method Class: Key Grapes */}
        {isStyle && isMethodClass && entry.details.notableGrapes && entry.details.notableGrapes.length > 0 && (
          <div className="mb-6">
              <div className="flex items-center gap-2 mb-3 border-b-2 border-green-800 pb-1">
                  <Grape size={18} className="text-green-500" />
                  <span className="font-retro text-xs md:text-sm tracking-widest text-green-500">KEY GRAPES</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                  {entry.details.notableGrapes.slice(0, 6).map((item, idx) => renderLinkedTile(item, idx))}
              </div>
          </div>
        )}

        {/* Notable Grapes Section - For Styles (Style class) */}
        {isStyle && isStyleClassType && styleGrapes.length > 0 && (
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-3 border-b-2 border-green-800 pb-1">
                    <Grape size={18} className="text-green-500" />
                    <span className="font-retro text-xs md:text-sm tracking-widest text-green-500">NOTABLE GRAPES</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                     {styleGrapes.slice(0, 6).map((item, idx) => renderLinkedTile(item, idx))}
                </div>
            </div>
        )}


        {/* Flavor entries: notable grapes */}
        {isFlavor && entry.details.notableGrapes && entry.details.notableGrapes.length > 0 && (
          <div className="mb-6">
              <div className="flex items-center gap-2 mb-3 border-b-2 border-green-800 pb-1">
                  <Grape size={18} className="text-green-500" />
                  <span className="font-retro text-xs md:text-sm tracking-widest text-green-500">NOTABLE GRAPES</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                   {entry.details.notableGrapes.slice(0, 8).map((item, idx) => renderLinkedTile(item, idx))}
              </div>
          </div>
        )}

        {/* Origin Class: Notable Grapes */}
        {isStyle && isOriginClass && entry.details.notableGrapes && entry.details.notableGrapes.length > 0 && (
          <div className="mb-6">
              <div className="flex items-center gap-2 mb-3 border-b-2 border-green-800 pb-1">
                  <Grape size={18} className="text-green-500" />
                  <span className="font-retro text-xs md:text-sm tracking-widest text-green-500">NOTABLE GRAPES</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                   {entry.details.notableGrapes.slice(0, 6).map((item, idx) => renderLinkedTile(item, idx))}
              </div>
          </div>
        )}

        {isStyle && isOriginClass && entry.details.keyRegions && entry.details.keyRegions.length > 0 && (
          <div className="mb-6">
              <div className="flex items-center gap-2 mb-3 border-b-2 border-green-800 pb-1">
                  <MapPin size={18} className="text-green-500" />
                  <span className="font-retro text-xs md:text-sm tracking-widest text-green-500">KEY REGIONS</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                   {entry.details.keyRegions.slice(0, 6).map((item, idx) => renderLinkedTile(item, idx, { showRegionMetaTiles: true }))}
              </div>
          </div>
        )}

        {/* Key Regions for Styles (skip Origin class) */}
        {isStyle && !isOriginClass && entry.details.keyRegions && entry.details.keyRegions.length > 0 && (
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-3 border-b-2 border-green-800 pb-1">
                    <MapPin size={18} className="text-green-500" />
                    <span className="font-retro text-xs md:text-sm tracking-widest text-green-500">KEY REGIONS</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                     {entry.details.keyRegions.slice(0, 6).map((item, idx) => renderLinkedTile(item, idx, { showRegionMetaTiles: true }))}
                </div>
            </div>
        )}

      </div>
    </DeviceLayout>
  );
};

export default EntryDetail;
