import React, { useEffect, useRef, useState } from 'react';
import { Tag, MapPin, Activity, Droplet, Clock, Zap, BarChart3, Grape, Mountain, ChevronRight, List, Circle, Triangle, Leaf, Cloud, Sun, Sparkles, Flame, Shield, Castle, Globe, BookOpen, MapPinned, Flower2, Apple, Sprout, Gem, Trees, Wind, Citrus, GlassWater, Droplets, Scale, Box, Wine, Star, Crown } from 'lucide-react';
import DeviceLayout from './DeviceLayout';
import { ClimateClass, EntryCategory, WineEntry } from '../types';
import { CLIMATE_CLASS_MAP } from '../data/climateClasses';
import { getFlagGradient } from '../data/flagGradients';
import { getFlagImage } from '../data/flagImages';
import { loadAllEntries } from '../src/services/wineData';
import { getStylePalette } from '../stylePalette';

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

const EntryDetail: React.FC<EntryDetailProps> = ({ entry, onBack, onHome, onSelectRelated, onFilterByType, onFilterByNote, onFilterBySoil, onFilterByOrigin, onFilterByRarity, onFilterByClimate }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [allEntries, setAllEntries] = useState<WineEntry[]>([]);

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

  // Helper to find related entry
  const getRelatedEntry = (name: string) => {
    const cleanName = name.toLowerCase().trim();
    return allEntries.find(e => {
        const entryName = e.name.toLowerCase();
        
        // 1. Direct Name Match
        if (entryName === cleanName) return true;

        // 2. Contains match (careful with short names, but generally ok here)
        if (entryName.includes(cleanName) || cleanName.includes(entryName)) return true;

        // 3. Synonym Match
        if (e.details.synonyms && e.details.synonyms.some(s => s.toLowerCase() === cleanName)) {
            return true;
        }
        
        return false;
    });
  }

  const normalizeFlavorKey = (value: string) =>
    value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();

  const normalizeEntryKey = (value: string) =>
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
      if (t.includes('full-bodied red') || t.includes('full bodied red')) return <Wine size={size} className="text-red-200" />;
      if (t.includes('bright red')) return <Sparkles size={size} className="text-pink-200" />;
      if (t.includes('light-bodied red') || t.includes('light bodied red')) return <GlassWater size={size} className="text-rose-200" />;
      if (t.includes('dark red')) return <Grape size={size} className="text-red-300" />;
      if (t.includes('medium-bodied red') || t.includes('medium bodied red')) return <Scale size={size} className="text-pink-300" />;
      if (t.includes('pink') || t.includes('rose')) return <Droplets size={size} className="text-pink-200" />;

      if (t.includes('light-bodied white') || t.includes('light bodied white')) return <GlassWater size={size} className="text-emerald-100" />;
      if (t.includes('aromatic white')) return <Wind size={size} className="text-amber-200" />;
      if (t.includes('high-acid white') || t.includes('high acid white')) return <Citrus size={size} className="text-slate-100" />;
      if (t.includes('full-bodied white') || t.includes('full bodied white')) return <Box size={size} className="text-orange-200" />;
      if (t.includes('sweet white')) return <Sun size={size} className="text-amber-300" />;
      if (t.includes('medium-bodied white') || t.includes('medium bodied white')) return <Circle size={size} className="text-amber-200" />;

      if (t.includes('sparkling')) return <Sparkles size={size} className="text-cyan-200" />;
      return <Grape size={size} className="text-stone-300" />;
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
  const getStyleClassType = (name: string, classification?: string) => {
    const normalized = normalizeLabel(name);
    const classOverride = classification?.toUpperCase();

    if (classOverride === 'ORIGIN' || classOverride === 'METHOD' || classOverride === 'TYPE' || classOverride === 'BLEND') return classOverride;

    const originKeywords = ['champagne', 'port', 'sherry', 'prosecco', 'cremant', 'cru beaujolais', 'super tuscan'];
    const methodKeywords = ['sparkling', 'fortified', 'dessert', 'late harvest', 'ice wine', 'botrytis', 'petillant', 'natural wine', 'orange wine'];
    const typeKeywords = ['full-bodied', 'full bodied', 'light-bodied', 'light bodied', 'medium-bodied', 'medium bodied', 'aromatic', 'white', 'red', 'rose', 'sweet white', 'sparkling wine'];

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
  const listSectionTitle = isRegion ? 'NOTABLE GRAPES' : 'NOTABLE REGIONS';
  const listSectionData = isRegion ? entry.details.notableGrapes : (isGrapes ? grapeCard?.notableRegions : entry.details.keyRegions);
  const scanTitle = isGrapes ? 'GRAPE SCAN' : isRegion ? 'REGION SCAN' : isFlavor ? 'FLAVOR SCAN' : 'STYLE SCAN';
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
      const { icon, color: iconColor } = getEntryIconDisplay(relatedFlavor);
      const iconNode = React.isValidElement(icon)
        ? React.cloneElement(icon as React.ReactElement, {
            size: 18,
            className: icon.props.className,
            style: { ...(icon.props.style || {}), ...(iconColor ? { color: iconColor } : {}) }
          })
        : icon;
      return {
        relatedFlavor,
        iconNode,
        borderColor: iconColor || note.color,
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

  const getCountryChipColors = (country?: string) => {
    const map: Record<string, { bg: string; border: string; text: string }> = {
      france: { bg: '#0f172a', border: '#1d4ed8', text: '#dbeafe' },
      italy: { bg: '#052e16', border: '#16a34a', text: '#bbf7d0' },
      spain: { bg: '#450a0a', border: '#dc2626', text: '#fecdd3' },
      usa: { bg: '#1e1b4b', border: '#4338ca', text: '#c7d2fe' },
      germany: { bg: '#422006', border: '#d97706', text: '#fde68a' },
      portugal: { bg: '#064e3b', border: '#10b981', text: '#d1fae5' },
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
    const key = country ? country.toLowerCase() : '';
    return map[key] || { bg: '#0b0f19', border: '#374151', text: '#e5e7eb' };
  };

  const getClassificationColors = (classification?: string) => {
    const map: Record<string, { bg: string; border: string; text: string }> = {
      aoc: { bg: '#3f1d2e', border: '#f43f5e', text: '#ffe4e6' },
      docg: { bg: '#422006', border: '#f59e0b', text: '#fef3c7' },
      doc: { bg: '#451a03', border: '#ea580c', text: '#ffedd5' },
      doca: { bg: '#713f12', border: '#fcd34d', text: '#fef3c7' },
      ava: { bg: '#1e1b4b', border: '#6366f1', text: '#e0e7ff' },
      gi: { bg: '#064e3b', border: '#22c55e', text: '#d1fae5' },
      pdo: { bg: '#312e81', border: '#a855f7', text: '#ede9fe' },
      pgi: { bg: '#0f172a', border: '#14b8a6', text: '#ccfbf1' },
      igp: { bg: '#1a2e05', border: '#84cc16', text: '#ecfccb' },
    };
    const key = classification ? classification.toLowerCase() : '';
    return map[key] || { bg: '#1f2937', border: '#4b5563', text: '#e5e7eb' };
  };

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

  const getRegionCountryIconBg = (country?: string) => {
    const map: Record<string, string> = {
      france: '#1f3f99',
      italy: '#14532d',
      spain: '#7f1d1d',
      usa: '#312e81',
      germany: '#713f12',
      portugal: '#065f46',
      australia: '#7c2d12',
      'new zealand': '#0f172a',
      argentina: '#0ea5e9',
      chile: '#7f1d1d',
      'south africa': '#312e81',
      austria: '#831843',
      greece: '#0e7490',
      hungary: '#365314',
      canada: '#7f1d1d',
      china: '#854d0e',
      japan: '#9f1239',
      india: '#713f12',
      uruguay: '#312e81',
      croatia: '#1e293b',
    };
    if (!country) return '#374151';
    return map[country.toLowerCase()] || '#374151';
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

  const getRegionMainGrapeIconColor = (regionEntry?: WineEntry) => {
    const notableGrapes = regionEntry?.details?.notableGrapes || [];
    for (const grapeName of notableGrapes) {
      const grape = getExactGrapeEntry(grapeName);
      const color = grape?.tastingProfile?.[0]?.color;
      if (color) return color;
    }
    return undefined;
  };

  const getTypeTileColors = (wineType?: string) => {
    const t = wineType?.toLowerCase() || '';
    if (t.includes('full-bodied red') || t.includes('full bodied red')) return { bg: '#2b0a0e', border: '#5a0f18', text: '#f8fafc' };
    if (t.includes('bright red')) return { bg: '#5b0f1f', border: '#dc143c', text: '#ffe4e6' };
    if (t.includes('light-bodied red') || t.includes('light bodied red')) return { bg: '#4f1f28', border: '#8b3f4c', text: '#fee2e2' };
    if (t.includes('dark red')) return { bg: '#3f1024', border: '#70193d', text: '#fde2e4' };
    if (t.includes('medium-bodied red') || t.includes('medium bodied red')) return { bg: '#5e2b30', border: '#e96b6b', text: '#fff1f2' };
    if (normalizeLabel(t).includes('pink') || normalizeLabel(t).includes('rose')) return { bg: '#5b2c36', border: '#f6b6c0', text: '#fff7f9' };

    if (t.includes('light-bodied white') || t.includes('light bodied white')) return { bg: '#334155', border: '#94a3b8', text: '#f8fafc' };
    if (t.includes('aromatic white')) return { bg: '#3f2e1a', border: '#daa520', text: '#fff4ce' };
    if (t.includes('high-acid white') || t.includes('high acid white')) return { bg: '#1f2937', border: '#e5e7eb', text: '#f8fafc' };
    if (t.includes('full-bodied white') || t.includes('full bodied white')) return { bg: '#3b2315', border: '#f4a261', text: '#ffe8d3' };
    if (t.includes('sweet white')) return { bg: '#3a2412', border: '#b5651d', text: '#fce9d8' };
    if (t.includes('medium-bodied white') || t.includes('medium bodied white')) return { bg: '#2f261b', border: '#d6bfa3', text: '#f7f1e8' };
    return { bg: '#1f2937', border: '#4b5563', text: '#e5e7eb' };
  };

  const getRarityColors = (rarity?: string) => {
    switch (rarity) {
      case 'COMMON': return { bg: '#3f3f46', border: '#52525b', text: '#e4e4e7' };
      case 'UNCOMMON': return { bg: '#064e3b', border: '#16a34a', text: '#d1fae5' };
      case 'RARE': return { bg: '#111827', border: '#2563eb', text: '#dbeafe' };
      case 'NOBLE': return { bg: '#3b0764', border: '#9333ea', text: '#f3e8ff' };
      default: return { bg: '#3f3f46', border: '#52525b', text: '#e4e4e7' };
    }
  };
  const getGrapeColorIcon = (related?: WineEntry) => {
    const t = related?.wineType?.toLowerCase() || '';
    const normalizedType = normalizeLabel(t);
    const isWhite = normalizedType.includes('white') || normalizedType.includes('rose');
    if (isWhite) return <Droplet size={24} fill="#FACC15" className="text-amber-300" />;
    return <Droplet size={24} fill="#DC143C" className="text-red-400" />;
  };

  // Icon helpers aligned with EntryTile
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
    if (normalizeLabel(type).includes('rose')) return '#DB7093';
    if (type.includes('sweet')) return '#CD853F';
    return '#78716c';
  };

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

  const getGrapeIcon = (grape?: WineEntry): React.ReactNode => {
    const wineType = grape?.wineType?.toLowerCase() || '';
    if (wineType.includes('full-bodied red') || wineType.includes('full bodied red')) return <Wine size={20} fill="currentColor" className="text-white opacity-90" />;
    if (wineType.includes('bright red')) return <Sparkles size={20} fill="currentColor" className="text-white opacity-90" />;
    if (wineType.includes('light-bodied red') || wineType.includes('light bodied red')) return <GlassWater size={20} fill="currentColor" className="text-white opacity-90" />;
    if (wineType.includes('dark red')) return <Grape size={20} fill="currentColor" className="text-white opacity-90" />;
    if (wineType.includes('medium-bodied red') || wineType.includes('medium bodied red')) return <Scale size={20} className="text-white opacity-90" />;
    if (normalizeLabel(wineType).includes('pink') || normalizeLabel(wineType).includes('rose')) return <Droplets size={20} className="text-white opacity-90" />;
    if (wineType.includes('light-bodied white') || wineType.includes('light bodied white')) return <GlassWater size={20} fill="currentColor" className="text-white opacity-90" />;
    if (wineType.includes('aromatic white')) return <Wind size={20} className="text-white opacity-90" />;
    if (wineType.includes('high-acid white') || wineType.includes('high acid white')) return <Citrus size={20} fill="currentColor" className="text-white opacity-90" />;
    if (wineType.includes('full-bodied white') || wineType.includes('full bodied white')) return <Box size={20} className="text-white opacity-90" />;
    if (wineType.includes('sweet white')) return <Sun size={20} fill="currentColor" className="text-white opacity-90" />;
    if (wineType.includes('medium-bodied white') || wineType.includes('medium bodied white')) return <Circle size={20} fill="currentColor" className="text-white opacity-90" />;
    return <Grape size={20} fill="currentColor" className="text-white opacity-90" />;
  };

  const getGrapeFlavorIcon = (grape?: WineEntry): React.ReactNode => {
    const note = grape?.tastingProfile?.[0];
    if (!note) return getGrapeIcon(grape);
    const IconComp = ICON_MAP[note.icon] || ICON_MAP['default'];
    return React.isValidElement(IconComp)
      ? React.cloneElement(IconComp as React.ReactElement, {
          className: 'opacity-90',
          style: { color: note.color },
        })
      : IconComp;
  };

  const buildIconNode = (iconKey: string, color?: string, size = 20): React.ReactNode => {
    const iconNode = ICON_MAP[iconKey] || ICON_MAP['default'];
    if (React.isValidElement(iconNode)) {
      return React.cloneElement(iconNode as React.ReactElement, {
        size,
        className: iconNode.props.className,
        style: { ...(iconNode.props.style || {}), ...(color ? { color } : {}) },
      });
    }
    return iconNode;
  };

  const addIconOutline = (iconNode: React.ReactNode, outlineColor?: string): React.ReactNode => {
    if (!React.isValidElement(iconNode)) return iconNode;
    const color = outlineColor || '#e5e7eb';
    return React.cloneElement(iconNode as React.ReactElement, {
      style: {
        ...(iconNode.props.style || {}),
        filter: `drop-shadow(1px 0 0 ${color}) drop-shadow(-1px 0 0 ${color}) drop-shadow(0 1px 0 ${color}) drop-shadow(0 -1px 0 ${color})`
      }
    });
  };

  const getStyleColorTypeColor = (type?: string) => {
    switch (type) {
      case 'RED': return '#8B0000'; // full-bodied red inner icon
      case 'WHITE': return '#FAFAD2'; // light-bodied white inner icon
      case 'ROSE': return '#f9a8d4';
      case 'ORANGE': return '#fdba74';
      case 'DUAL': return '#f472b6'; // pink inner icon
      default: return '#e5e7eb';
    }
  };

  const getStyleClassBg = (styleEntry?: WineEntry) => {
    const classType = styleEntry ? getStyleClassType(styleEntry.name, styleEntry.details.classification) : undefined;
    switch (classType) {
      case 'METHOD': return '#312e81';
      case 'ORIGIN': return '#7c2d12';
      case 'TYPE': return '#0f172a';
      case 'STYLE': return '#064e3b';
      case 'BLEND': return '#1d1b47';
      default: return styleEntry?.color || '#78716c';
    }
  };

  const getStyleIconShape = (styleEntry?: WineEntry, colorTypeColor?: string): React.ReactNode => {
    const classType = styleEntry ? getStyleClassType(styleEntry.name, styleEntry.details.classification) : undefined;
    const colorType = styleEntry ? getColorType(styleEntry.name) : undefined;
    const iconColor = colorTypeColor || getStyleColorTypeColor(colorType);

    if (classType === 'METHOD') return <Sparkles size={20} fill="currentColor" style={{ color: iconColor }} />;
    if (classType === 'ORIGIN') return <MapPin size={20} style={{ color: iconColor }} />;
    if (classType === 'TYPE') return <Shield size={20} fill="currentColor" style={{ color: iconColor }} />;

    switch (colorType) {
      case 'RED': return <Wine size={20} fill="currentColor" style={{ color: iconColor }} />;
      case 'WHITE': return <GlassWater size={20} fill="currentColor" style={{ color: iconColor }} />;
      case 'ROSE': return <Droplets size={20} style={{ color: iconColor }} />;
      case 'ORANGE': return <Sun size={20} fill="currentColor" style={{ color: iconColor }} />;
      default: return <Grape size={20} fill="currentColor" style={{ color: iconColor }} />;
    }
  };

  const getStyleIconBg = (styleEntry?: WineEntry) => {
    return getStyleClassBg(styleEntry);
  };

  const getFlavorSubclassIconColor = (sub?: string) => {
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

  const getGrapePrimaryFlavorVisual = (grapeEntry: WineEntry) => {
    const primaryNote = grapeEntry.tastingProfile?.[0];
    const typeColor = getGrapeIconColor(grapeEntry.grapeCard?.style || grapeEntry.wineType, grapeEntry.details.body);
    const iconOutline = darkenHex(typeColor, 0.4);
    const relatedFlavor = primaryNote?.note ? getExactFlavorEntry(primaryNote.note) : undefined;
    const iconColor = relatedFlavor
      ? getFlavorSubclassIconColor(relatedFlavor.details.subclass)
      : primaryNote?.color;
    const iconKey = primaryNote?.icon || grapeEntry.icon || 'default';
    return {
      icon: addIconOutline(buildIconNode(iconKey, iconColor), iconOutline),
      bg: typeColor,
      color: iconColor
    };
  };

  interface EntryIconDisplay {
    icon: React.ReactNode;
    bg: string;
    color?: string;
    outline?: string;
    flagGradient?: string;
    flagImage?: string;
  }

  const getEntryIconDisplay = (relatedEntry?: WineEntry): EntryIconDisplay => {
    if (!relatedEntry) {
      return { icon: ICON_MAP['default'], bg: '#444', color: undefined, outline: undefined };
    }
    if (relatedEntry.category === 'GRAPES') {
      const grapeVisual = getGrapePrimaryFlavorVisual(relatedEntry);
      return {
        icon: grapeVisual.icon,
        bg: grapeVisual.bg,
        color: grapeVisual.color,
        outline: undefined
      };
    }
    if (relatedEntry.category === 'REGIONS') {
      const climateColors = relatedEntry.climate ? CLIMATE_CLASS_MAP[relatedEntry.climate]?.colors : undefined;
      const iconColor = getRegionMainGrapeIconColor(relatedEntry) || getRegionClassificationIconColor(relatedEntry.details.classification);
      const outline = climateColors?.border || climateColors?.bg;
      return {
        icon: React.isValidElement(ICON_MAP[relatedEntry.icon || 'default'])
          ? React.cloneElement(ICON_MAP[relatedEntry.icon || 'default'] as React.ReactElement, {
              style: {
                color: iconColor,
                filter: 'drop-shadow(1px 0 0 #000) drop-shadow(-1px 0 0 #000) drop-shadow(0 1px 0 #000) drop-shadow(0 -1px 0 #000)'
              }
            })
          : ICON_MAP[relatedEntry.icon || 'default'] || ICON_MAP['default'],
        bg: getRegionCountryIconBg(relatedEntry.details.origin),
        color: iconColor,
        outline,
        flagGradient: getFlagGradient(relatedEntry.details.origin),
        flagImage: getFlagImage(relatedEntry.details.origin)
      };
    }
    if (relatedEntry.category === 'STYLES') {
      const colorTypeColor = getStyleColorTypeColor(getColorType(relatedEntry.name));
      const useFlagVisual = !isVariousOrigin(relatedEntry.details.origin);
      return {
        icon: getStyleIconShape(relatedEntry, colorTypeColor),
        bg: getStyleIconBg(relatedEntry),
        color: colorTypeColor,
        outline: undefined,
        flagGradient: useFlagVisual ? getFlagGradient(relatedEntry.details.origin) : undefined,
        flagImage: useFlagVisual ? getFlagImage(relatedEntry.details.origin) : undefined
      };
    }
    if (relatedEntry.category === 'FLAVORS') {
      const iconColor = getFlavorSubclassIconColor(relatedEntry.details.subclass);
      const iconKey = relatedEntry.icon || 'default';
      return {
        icon: addIconOutline(buildIconNode(iconKey, iconColor), iconColor),
        bg: relatedEntry.color || '#444',
        color: iconColor,
        outline: iconColor
      };
    }
    const iconKey = relatedEntry.icon || 'default';
    return { icon: buildIconNode(iconKey), bg: relatedEntry.color || '#444', color: undefined, outline: undefined };
  };

  interface RenderLinkedTileOptions {
    useCountryFlag?: boolean;
    showRegionMetaTiles?: boolean;
  }

  const renderLinkedTile = (label: string, idx: number, options?: RenderLinkedTileOptions) => {
    const relatedEntry = getRelatedEntry(label);
    const { icon, bg, color: iconColor, outline, flagGradient, flagImage } = getEntryIconDisplay(relatedEntry);
    const displayName = (relatedEntry?.name || label || 'UNKNOWN').toUpperCase();
    const isLinkable = !!relatedEntry;
    const classificationLabel = relatedEntry?.details.classification ? formatUpper(relatedEntry.details.classification) : undefined;
    const iconNode = React.isValidElement(icon)
      ? React.cloneElement(icon as React.ReactElement, {
          size: 20,
          className: icon.props.className,
          style: { ...(icon.props.style || {}), ...(iconColor ? { color: iconColor } : {}) }
        })
      : icon;
    const showFlag = (relatedEntry?.category === 'REGIONS' || (relatedEntry?.category === 'STYLES' && !isVariousOrigin(relatedEntry.details.origin))) && Boolean(flagImage || flagGradient);
    const isRegionMeta = relatedEntry?.category === 'REGIONS' && options?.showRegionMetaTiles;
    const regionCountry = relatedEntry?.details.origin;
    const regionSystem = relatedEntry?.details.classification;
    const regionClimate = relatedEntry?.climate;
    const regionCountryColors = getCountryChipColors(regionCountry);
    const regionSystemColors = getClassificationColors(regionSystem);
    const regionClimateColors = getClimateColors(regionClimate);
    const regionClimateName = regionClimate ? CLIMATE_CLASS_MAP[regionClimate]?.name : undefined;

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
          className={`shrink-0 w-12 h-12 rounded-lg shadow-inner flex items-center justify-center border-2 border-black/20 ${!isLinkable ? 'grayscale' : ''}`}
          style={{
            backgroundColor: showFlag ? undefined : bg,
            backgroundImage: showFlag ? (flagImage ? `url(${flagImage})` : flagGradient) : undefined,
            backgroundSize: showFlag && flagImage ? 'cover' : undefined,
            backgroundPosition: showFlag && flagImage ? 'center' : undefined,
            boxShadow: outline ? `0 0 0 2px ${outline}` : undefined
          }}
        >
          {iconNode}
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
                  <span
                    className="inline-flex items-center px-1.5 py-0.5 rounded border text-[9px] font-bold uppercase"
                    style={{ backgroundColor: regionCountryColors.bg, borderColor: regionCountryColors.border, color: regionCountryColors.text }}
                  >
                    {regionCountry}
                  </span>
                )}
                {regionSystem && (
                  <span
                    className="inline-flex items-center px-1.5 py-0.5 rounded border text-[9px] font-bold uppercase"
                    style={{ backgroundColor: regionSystemColors.bg, borderColor: regionSystemColors.border, color: regionSystemColors.text }}
                  >
                    {regionSystem}
                  </span>
                )}
                {regionClimate && regionClimateName && (
                  <span
                    className="inline-flex items-center px-1.5 py-0.5 rounded border text-[9px] font-bold uppercase"
                    style={{ backgroundColor: regionClimateColors.bg, borderColor: regionClimateColors.border, color: regionClimateColors.text }}
                  >
                    {regionClimateName}
                  </span>
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
      // Common Tile Styles
      const tileBase = "flex flex-col items-center justify-center p-3 bg-stone-900 border-2 border-stone-700 rounded h-24 w-full hover:border-green-500 hover:bg-stone-800 transition-all active:scale-95 group relative overflow-hidden";
      const labelStyle = "text-xs font-bold text-stone-500 uppercase tracking-widest mb-2 group-hover:text-green-500 z-10";
      const valueStyle = "text-sm font-bold text-white text-center leading-tight uppercase z-10 break-words w-full";
      
      if (isGrapes) {
          const typeColors = getTypeTileColors(entry.wineType);
          const typeEntry = entry.wineType ? getRelatedEntry(entry.wineType) : undefined;
          const { icon: typeIconNode, color: typeIconColor } = getEntryIconDisplay(typeEntry);
          const rarityColors = getRarityColors(entry.rarity);
          const countryStyle = getCountryChipColors(entry.details.origin);
          const countryFlagGradient = getFlagGradient(entry.details.origin);
          const countryFlagImage = getFlagImage(entry.details.origin);

          const rarityIcon = (() => {
            const rarity = (entry.rarity || '').toUpperCase();
            if (rarity === 'NOBLE') {
              return <Crown size={22} className="mt-2" color={rarityColors.text} />;
            }
            const starCount = rarity === 'RARE' ? 3 : rarity === 'COMMON' ? 2 : rarity === 'UNCOMMON' ? 1 : 1;
            return (
              <div className="mt-2 flex items-center gap-0.5">
                {Array.from({ length: starCount }).map((_, i) => (
                  <Star key={i} size={14} color={rarityColors.text} fill={rarityColors.text} />
                ))}
              </div>
            );
          })();

          return (
              <div className="grid grid-cols-3 gap-2 mb-6 px-1">
                  {/* Tile 1: Type */}
                  <button 
                    onClick={() => typeEntry ? onSelectRelated(typeEntry) : entry.wineType && onFilterByType(entry.wineType)}
                    className={tileBase}
                    style={{ backgroundColor: typeColors.bg, borderColor: typeColors.border, color: typeColors.text }}
                  >
                      <span className={`${labelStyle} text-white`}>TYPE</span>
                      <div className="flex flex-col items-center gap-1">
                          {React.isValidElement(typeIconNode)
                            ? React.cloneElement(typeIconNode as React.ReactElement, {
                                size: 20,
                                className: typeIconNode.props.className,
                                style: { ...(typeIconNode.props.style || {}), ...(typeIconColor ? { color: typeIconColor } : {}) }
                              })
                            : getTypeIcon(entry.wineType)}
                          <span className="text-sm leading-none font-bold uppercase" style={{ color: typeColors.text }}>
                            {formatUpper(entry.wineType?.split(' ')[0])}
                          </span>
                      </div>
                  </button>

                  {/* Tile 2: Rarity - Clickable */}
                  <button 
                    onClick={() => entry.rarity && onFilterByRarity?.(entry.rarity)}
                    className={tileBase}
                    style={{ backgroundColor: rarityColors.bg, borderColor: rarityColors.border, color: rarityColors.text }}
                  >
                       <span className={`${labelStyle} text-white`}>RARITY</span>
                       <span 
                         className="text-sm font-bold px-1.5 py-0.5 rounded border"
                        style={{ backgroundColor: 'transparent', borderColor: rarityColors.border, color: rarityColors.text }}
                       >
                         {displayClass}
                       </span>
                       {rarityIcon}
                  </button>

                  {/* Tile 3: Country */}
                  <button 
                    onClick={() => entry.details.origin && onFilterByOrigin(entry.details.origin)} 
                    className={tileBase}
                    style={{ backgroundColor: countryStyle.bg, borderColor: countryStyle.border, color: countryStyle.text }}
                  >
                       <span className={`${labelStyle} text-white`}>ORIGIN</span>
                       <div className="flex items-center gap-2 mb-1">
                         <span 
                          className="w-8 h-5 rounded-sm border border-stone-700 shadow-inner" 
                           style={{
                             backgroundImage: countryFlagImage ? `url(${countryFlagImage})` : countryFlagGradient,
                             backgroundSize: countryFlagImage ? 'cover' : undefined,
                             backgroundPosition: countryFlagImage ? 'center' : undefined
                           }}
                         ></span>
                       </div>
                       <span className="text-[12px] leading-tight font-bold text-center uppercase" style={{ color: countryStyle.text }}>
                         {formatUpper(entry.details.origin)}
                       </span>
                  </button>
              </div>
          );
      } else if (isRegion) {
      const mainGrape = entry.details.notableGrapes?.[0] || 'N/A';
      const mainGrapeEntry = getRelatedEntry(mainGrape);
      const mainGrapeTypeColors = getTypeTileColors(mainGrapeEntry?.wineType);
      const { icon: mainGrapeIconNode, color: mainGrapeIconColor } = getEntryIconDisplay(mainGrapeEntry);
      const countryStyle = getCountryChipColors(entry.details.origin);
      const climateMeta = entry.climate ? CLIMATE_CLASS_MAP[entry.climate] : undefined;
      const climateStyle = getClimateColors(entry.climate);
      const flagGradient = getFlagGradient(entry.details.origin);
      const flagImage = getFlagImage(entry.details.origin);
      
      return (
          <div className="grid grid-cols-3 gap-2 mb-6 px-1">
              {/* Tile 1: Main Grape */}
              <button 
                onClick={() => mainGrapeEntry && onSelectRelated(mainGrapeEntry)}
                disabled={!mainGrapeEntry}
                className={tileBase}
                style={{ backgroundColor: mainGrapeTypeColors.bg, borderColor: mainGrapeTypeColors.border, color: mainGrapeTypeColors.text }}
              >
                   <span className={labelStyle}>MAIN GRAPE</span>
                   <div className="mb-1" style={{ color: mainGrapeIconColor || mainGrapeTypeColors.text }}>
                     {React.isValidElement(mainGrapeIconNode)
                       ? React.cloneElement(mainGrapeIconNode as React.ReactElement, {
                           size: 20,
                           className: mainGrapeIconNode.props.className,
                           style: { ...(mainGrapeIconNode.props.style || {}), ...(mainGrapeIconColor ? { color: mainGrapeIconColor } : {}) }
                         })
                       : mainGrapeIconNode}
                   </div>
                   <span className="text-xs leading-none text-center font-bold uppercase" style={{ color: mainGrapeTypeColors.text }}>
                     {formatUpper(mainGrape)}
                   </span>
              </button>

              {/* Tile 2: Climate */}
              <div
                className={`${tileBase} cursor-default`}
                style={{ backgroundColor: climateStyle.bg, borderColor: climateStyle.border, color: climateStyle.text }}
              >
                   <span className={labelStyle}>CLIMATE</span>
                   <div className="mb-1" style={{ color: climateStyle.text }}>
                     {getClimateIcon(entry.climate)}
                   </div>
                   <span className="text-sm leading-none font-bold text-center" style={{ color: climateStyle.text }}>
                     {formatUpper(climateMeta?.name || 'N/A')}
                   </span>
              </div>

              {/* Tile 3: Country (right aligned via grid order) */}
              <button 
                onClick={() => entry.details.origin && onFilterByOrigin(entry.details.origin)} 
                className={tileBase}
                style={{ backgroundColor: countryStyle.bg, borderColor: countryStyle.border, color: countryStyle.text }}
              >
                   <span className={labelStyle}>COUNTRY</span>
                   <div className="flex items-center gap-2 mb-1">
                       <span 
                        className="w-8 h-5 rounded-sm border border-stone-700 shadow-inner" 
                       style={{
                         backgroundImage: flagImage ? `url(${flagImage})` : flagGradient,
                         backgroundSize: flagImage ? 'cover' : undefined,
                         backgroundPosition: flagImage ? 'center' : undefined
                       }}
                     ></span>
                   </div>
                   <span className="text-sm leading-none font-bold uppercase" style={{ color: countryStyle.text }}>
                     {formatUpper(entry.details.origin)}
                   </span>
              </button>
              </div>
          );
      } else if (isStyle) {
          const classColors = getClassTypeColors(styleClassType as 'STYLE' | 'METHOD' | 'ORIGIN' | 'TYPE' | 'BLEND' | undefined);
          const flagGradient = getFlagGradient(entry.details.origin);
          const flagImage = getFlagImage(entry.details.origin);
          const colorTile = (
            <button
              key="color-type"
              onClick={() => colorType && onFilterByType(colorType, 'STYLES')}
              className={`${tileBase} hover:border-green-500 hover:bg-stone-800`}
              style={{ backgroundColor: colorTypeColors.bg, borderColor: colorTypeColors.border, color: colorTypeColors.text }}
            >
              <span className={labelStyle}>COLOR</span>
              <span className="text-sm font-bold px-2 py-1 rounded border" style={{ borderColor: colorTypeColors.border, color: colorTypeColors.text }}>
                {colorType}
              </span>
            </button>
          );

          const classTile = (
            <button
              key="class"
              onClick={() => styleClassType && onFilterByNote(styleClassType, 'STYLES', 'TASTING')}
              className={`${tileBase} hover:border-green-500 hover:bg-stone-800`}
              style={{ backgroundColor: classColors.bg, borderColor: classColors.border, color: classColors.text }}
            >
              <span className={labelStyle}>CLASS</span>
              <span className="text-sm font-bold px-2 py-1 rounded border" style={{ borderColor: classColors.border, color: classColors.text }}>
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
              style={{ backgroundColor: originChipColors?.bg, borderColor: originChipColors?.border, color: originChipColors?.text }}
            >
              <span className={labelStyle}>{originLabel}</span>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="w-8 h-5 rounded-sm border border-stone-700 shadow-inner"
                  style={{
                    backgroundImage: flagImage ? `url(${flagImage})` : flagGradient,
                    backgroundSize: flagImage ? 'cover' : undefined,
                    backgroundPosition: flagImage ? 'center' : undefined
                  }}
                ></span>
              </div>
              <span className="text-xs leading-none font-bold text-center uppercase">
                {formatUpper(entry.details.origin)}
              </span>
            </button>
          ) : null;

          const tiles = [classTile, colorTile];
          if (originTile) tiles.push(originTile);

          const gridClass = tiles.length === 3 ? 'grid-cols-3 md:grid-cols-3' : 'grid-cols-2 md:grid-cols-2';

          return (
              <div className={`grid ${gridClass} gap-2 mb-6 px-1`}>
                {tiles}
              </div>
          );
      } else if (isFlavor) {
        const flavorClass = entry.details.classification || 'FLAVOR';
        const flavorColors = getFlavorClassColors(flavorClass);
        const subclass = entry.details.subclass || 'SUBCLASS';
        const subclassColors = getFlavorSubclassColors(entry.details.subclass);
        return (
          <div className="grid grid-cols-3 gap-2 mb-6 px-1">
            <button
              className={`${tileBase} hover:border-green-500 hover:bg-stone-800`}
              onClick={() => onFilterByNote(flavorClass, 'FLAVORS', 'TASTING')}
              style={{ backgroundColor: flavorColors.bg, borderColor: flavorColors.border, color: flavorColors.text }}
            >
              <span className={`${labelStyle} text-white`}>CLASS</span>
              <span className="text-sm font-bold px-2 py-1 rounded border" style={{ borderColor: flavorColors.border, color: flavorColors.text }}>
                {flavorClass}
              </span>
            </button>
            <button
              className={`${tileBase} hover:border-green-500 hover:bg-stone-800`}
              onClick={() => onFilterByNote(subclass, 'FLAVORS', 'TASTING')}
              style={{ backgroundColor: subclassColors.bg, borderColor: subclassColors.border, color: subclassColors.text }}
            >
              <span className={`${labelStyle} text-white`}>SUBCLASS</span>
              <span className="text-sm font-bold px-2 py-1 rounded border text-center leading-tight" style={{ borderColor: subclassColors.border, color: subclassColors.text }}>
                {subclass.replace(/_/g, ' ')}
              </span>
            </button>
            <div className={`${tileBase} cursor-default`} style={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#e2e8f0' }}>
              <span className={`${labelStyle} text-white`}>linked grapes</span>
              <span className="text-sm font-bold px-2 py-1 rounded border border-stone-700 text-stone-100">
                {(entry.details.notableGrapes || []).length}
              </span>
            </div>
          </div>
        );
      }
      return null;
  };

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
                  const { icon, bg, color: iconColor, outline, flagGradient, flagImage } = getEntryIconDisplay(entry);
                  const iconNode = React.isValidElement(icon)
                    ? React.cloneElement(icon as React.ReactElement, {
                        size: 28,
                        className: icon.props.className,
                        style: { ...(icon.props.style || {}), ...(iconColor ? { color: iconColor } : {}) }
                      })
                    : icon;
                  const showHeaderFlag = (isRegion || (isStyle && !isVariousOrigin(entry.details.origin))) && Boolean(flagImage || flagGradient);
                  return (
                    <div
                      className="w-14 h-14 rounded-xl mb-3 flex items-center justify-center border-2 border-black/30 shadow-inner"
                      style={{
                        backgroundColor: showHeaderFlag ? undefined : bg,
                        backgroundImage: showHeaderFlag ? (flagImage ? `url(${flagImage})` : flagGradient) : undefined,
                        backgroundSize: showHeaderFlag && flagImage ? 'cover' : undefined,
                        backgroundPosition: showHeaderFlag && flagImage ? 'center' : undefined,
                        boxShadow: outline ? `0 0 0 2px ${outline}` : undefined
                      }}
                    >
                      {iconNode}
                    </div>
                  );
                })()}
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-retro text-white drop-shadow-[4px_4px_0px_rgba(0,100,0,0.8)] tracking-wide leading-tight break-words whitespace-normal uppercase w-full" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                    {entry.name}
                </h1>
             </div>
        </div>

        {/* 3-Tile Header Row */}
        {renderHeaderTiles()}

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
                          <span key={i} className="px-3 py-1.5 bg-stone-800 text-stone-200 border border-stone-600 text-sm font-bold font-mono rounded">
                              {name}
                          </span>
                      ))}
                  </div>
                ) : (
                  <div className="border border-stone-700 bg-stone-900/80 rounded p-3">
                    <p className="text-sm text-stone-300">No alternate names listed.</p>
                  </div>
                )}
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
                          <span className="w-20 text-xs font-bold text-stone-500 shrink-0">{stat.label}</span>
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
                <div className="flex items-center gap-2 mb-3 border-b-2 border-green-800 pb-1">
                    <Shield size={18} className="text-green-500" />
                    <span className="font-retro text-xs md:text-sm tracking-widest text-green-500">SYSTEM</span>
                </div>
                <div className="bg-stone-900 border border-stone-800 rounded p-3 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="px-2 py-1 rounded border text-xs font-bold uppercase"
                          style={(() => {
                            const style = getClassificationColors(entry.details.classification);
                            return { backgroundColor: style.bg, borderColor: style.border, color: style.text };
                          })()}
                        >
                          {entry.details.classification}
                        </span>
                        <span className="text-lg font-bold text-white leading-tight">{getClassificationFullName(entry.details.classification)}</span>
                    </div>
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
                        <div key={i} className="px-3 py-2 bg-stone-800 text-stone-200 border border-stone-600 text-sm font-bold font-mono rounded text-center">
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

        {/* Climate Section - Regions */}
        {isRegion && (
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-3 border-b-2 border-green-800 pb-1">
                    <Wind size={18} className="text-green-500" />
                    <span className="font-retro text-xs md:text-sm tracking-widest text-green-500">CLIMATE</span>
                </div>
                <div className="bg-stone-900 border border-stone-800 rounded p-3 space-y-2">
                    <div className="flex items-center gap-2">
                        <span
                          className="px-2 py-1 rounded border text-xs font-bold uppercase"
                          style={{ backgroundColor: getClimateColors(entry.climate).bg, borderColor: getClimateColors(entry.climate).border, color: getClimateColors(entry.climate).text }}
                        >
                          {(entry.climate && CLIMATE_CLASS_MAP[entry.climate]?.name) || 'Unknown Climate'}
                        </span>
                    </div>
                    <p className="text-sm text-stone-300 leading-relaxed normal-case">
                        {entry.climateDescription || (entry.climate && CLIMATE_CLASS_MAP[entry.climate]?.description) || 'Climate details not available for this region.'}
                    </p>
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

        {/* Tasting Notes Section - Clickable (For Grapes & Styles) */}
        {(isGrapes || isStyle) && (
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-3 border-b-2 border-green-800 pb-1">
                    <Grape size={18} className="text-green-500" />
                    <span className="font-retro text-xs md:text-sm tracking-widest text-green-500">FLAVOR PROFILE</span>
                </div>
                {matchedFlavorNotes.length > 0 ? (
                  <div className={flavorTileContainerClass}>
                      {matchedFlavorNotes.map((note, i) => {
                          const { relatedFlavor, iconNode, borderColor, bgColor, label } = getFlavorTileVisual(note);
                          return (
                          <button 
                              key={i} 
                              onClick={() => relatedFlavor ? onSelectRelated(relatedFlavor) : onFilterByNote(label, 'FLAVORS', 'TASTING')}
                              className={`w-full bg-stone-900 border-2 rounded p-3 flex flex-col items-center justify-center gap-2 relative overflow-hidden group transition-all text-center min-h-[7rem] ${
                                relatedFlavor ? 'border-stone-700 hover:border-green-500 hover:bg-stone-800 active:translate-y-0.5' : 'border-stone-800 opacity-70 cursor-default'
                              }`}
                              disabled={!relatedFlavor}
                          >
                              <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-stone-600 group-hover:border-green-400 transition-colors"></div>
                              <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-stone-600 group-hover:border-green-400 transition-colors"></div>
                              <div 
                                  className="shrink-0 w-12 h-12 rounded-lg flex items-center justify-center shadow-inner border-2 border-black/20"
                                  style={{ backgroundColor: bgColor, borderColor }}
                              >
                                  {iconNode}
                              </div>
                              <span className="font-retro text-sm text-white uppercase leading-tight break-words group-hover:text-green-300 max-w-full">
                                {label}
                              </span>
                          </button>
                      )})}
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

        {/* Dynamic List Section - Notable Regions (for Grapes) */}
        {isGrapes && (
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-3 border-b-2 border-green-800 pb-1">
                   <List size={18} className="text-green-500" />
                   <span className="font-retro text-xs md:text-sm tracking-widest text-green-500">NOTABLE REGIONS</span>
                </div>
                {grapeNotableRegions.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2">
                       {grapeNotableRegions.slice(0, 8).map((item, idx) => renderLinkedTile(item, idx))}
                  </div>
                ) : (
                  <div className="border border-stone-700 bg-stone-900/80 rounded p-3">
                    <p className="text-sm text-stone-300">No notable regions listed.</p>
                  </div>
                )}
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
