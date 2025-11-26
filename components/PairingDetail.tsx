import React, { useEffect, useRef } from 'react';
import { Tag, MapPin, Activity, Droplet, Clock, Zap, BarChart3, Grape, Mountain, ChevronRight, List, Circle, Triangle, Leaf, Cloud, Sun, Sparkles, Flame, Shield, Castle, Globe, BookOpen, MapPinned, Flower2, Apple, Sprout, Gem, Trees, Wind, Citrus, GlassWater, Droplets, Scale, Box, Wine, Star } from 'lucide-react';
import DeviceLayout from './DeviceLayout';
import { WineEntry } from '../types';
import { WINE_ENTRIES } from '../constants';

interface EntryDetailProps {
  entry: WineEntry;
  onBack: () => void;
  onHome: () => void;
  onSelectRelated: (entry: WineEntry) => void;
  onFilterByType: (type: string) => void;
  onFilterByNote: (note: string) => void;
  onFilterBySoil: (soil: string) => void;
  onFilterByOrigin: (origin: string) => void;
  onFilterByRarity?: (rarity: string) => void;
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

const EntryDetail: React.FC<EntryDetailProps> = ({ entry, onBack, onHome, onSelectRelated, onFilterByType, onFilterByNote, onFilterBySoil, onFilterByOrigin, onFilterByRarity }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

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

  // Helper to find related entry
  const getRelatedEntry = (name: string) => {
    const cleanName = name.toLowerCase().trim();
    return WINE_ENTRIES.find(e => {
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

  // Type Icon Selection
  const getTypeIcon = (typeStr: string = '', size: number = 28) => {
      const t = typeStr.toLowerCase();
      if (t.includes('full-bodied red') || t.includes('full bodied red')) return <Wine size={size} className="text-red-200" />;
      if (t.includes('bright red')) return <Sparkles size={size} className="text-pink-200" />;
      if (t.includes('light-bodied red') || t.includes('light bodied red')) return <GlassWater size={size} className="text-rose-200" />;
      if (t.includes('dark red')) return <Grape size={size} className="text-red-300" />;
      if (t.includes('medium-bodied red') || t.includes('medium bodied red')) return <Scale size={size} className="text-pink-300" />;
      if (t.includes('pink') || t.includes('rosé') || t.includes('rose')) return <Droplets size={size} className="text-pink-200" />;

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

  const getClassTypeColors = (type: 'STYLE' | 'METHOD' | 'ORIGIN' | 'TYPE' | undefined) => {
    switch (type) {
      case 'STYLE': return { bg: '#1f2937', border: '#22c55e', text: '#bbf7d0' };
      case 'METHOD': return { bg: '#312e81', border: '#a855f7', text: '#ede9fe' };
      case 'ORIGIN': return { bg: '#7c2d12', border: '#f59e0b', text: '#ffedd5' };
      case 'TYPE': return { bg: '#0f172a', border: '#38bdf8', text: '#e0f2fe' };
      default: return { bg: '#1f2937', border: '#22c55e', text: '#bbf7d0' };
    }
  };

  const getColorTypeColors = (type?: string) => {
    switch (type) {
      case 'RED': return { bg: '#3f0d1a', border: '#b91c1c', text: '#fecdd3' };
      case 'WHITE': return { bg: '#1f2f1c', border: '#a3e635', text: '#d9f99d' };
      case 'ROSÉ': return { bg: '#4b1f2f', border: '#f9a8d4', text: '#ffe4e6' };
      case 'ORANGE': return { bg: '#4a2a0a', border: '#fb923c', text: '#ffedd5' };
      case 'DUAL': return { bg: '#1f2937', border: '#22d3ee', text: '#cffafe' };
      default: return { bg: '#1f2937', border: '#22d3ee', text: '#cffafe' };
    }
  };

  // Logic checks
  const isGrapes = entry.category === 'GRAPES';
  const isRegion = entry.category === 'REGIONS';
  const isStyle = entry.category === 'STYLES';
  const isFlavor = entry.category === 'FLAVORS';
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

  const styleClassType = isStyle ? getStyleClassType(entry.name, entry.details.classification) : undefined;
  const isMethodClass = styleClassType === 'METHOD';
  const isOriginClass = styleClassType === 'ORIGIN';
  const isTypeClass = styleClassType === 'TYPE';
  const isStyleClassType = styleClassType === 'STYLE';
  const classTypeColors = getClassTypeColors(styleClassType as 'STYLE' | 'METHOD' | 'ORIGIN' | 'TYPE' | undefined);
  const getColorType = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('orange')) return 'ORANGE';
    if (n.includes('rosé') || n.includes('rose')) return 'ROSÉ';
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

  const styleGrapes = isStyle
    ? WINE_ENTRIES.filter(e => e.category === 'GRAPES' && e.grapeCard?.style?.toLowerCase() === entry.name.toLowerCase())
    : [];
  const styleFlavorNotes = isStyle
    ? (entry.tastingProfile || entry.tags?.slice(0, 3).map(tag => ({ note: tag, icon: 'default' as const, color: classTypeColors.border }))) || []
    : [];
  const grapeFlavorNotes = (grapeCard?.tastingProfile || []).map(n => ({ note: n, icon: 'default' as const, color: '#16a34a' }));
  const flavorNotes = isStyle ? styleFlavorNotes : (entry.tastingProfile || grapeFlavorNotes);

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

  const getTypeTileColors = (wineType?: string) => {
    const t = wineType?.toLowerCase() || '';
    if (t.includes('full-bodied red') || t.includes('full bodied red')) return { bg: '#2b0a0e', border: '#5a0f18', text: '#f8fafc' };
    if (t.includes('bright red')) return { bg: '#5b0f1f', border: '#dc143c', text: '#ffe4e6' };
    if (t.includes('light-bodied red') || t.includes('light bodied red')) return { bg: '#4f1f28', border: '#8b3f4c', text: '#fee2e2' };
    if (t.includes('dark red')) return { bg: '#3f1024', border: '#70193d', text: '#fde2e4' };
    if (t.includes('medium-bodied red') || t.includes('medium bodied red')) return { bg: '#5e2b30', border: '#e96b6b', text: '#fff1f2' };
    if (t.includes('pink') || t.includes('rosé') || t.includes('rose')) return { bg: '#5b2c36', border: '#f6b6c0', text: '#fff7f9' };

    if (t.includes('light-bodied white') || t.includes('light bodied white')) return { bg: '#1f2f1c', border: '#d4e6a5', text: '#e8f5c8' };
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
    const isWhite = t.includes('white') || t.includes('rosé') || t.includes('rose');
    if (isWhite) return <Droplet size={24} fill="#FACC15" className="text-amber-300" />;
    return <Droplet size={24} fill="#DC143C" className="text-red-400" />;
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

  // Header Tiles Logic - Updated to remove rarity from regions/styles, add rarity clickable for grapes
  const renderHeaderTiles = () => {
      // Common Tile Styles
      const tileBase = "flex flex-col items-center justify-center p-3 bg-stone-900 border-2 border-stone-700 rounded h-24 w-full hover:border-green-500 hover:bg-stone-800 transition-all active:scale-95 group relative overflow-hidden";
      const labelStyle = "text-xs font-bold text-stone-500 uppercase tracking-widest mb-2 group-hover:text-green-500 z-10";
      const valueStyle = "text-sm font-bold text-white text-center leading-tight uppercase z-10 break-words w-full";
      
      if (isGrapes) {
          const typeColors = getTypeTileColors(entry.wineType);
          const rarityColors = getRarityColors(entry.rarity);
          const countryStyle = getCountryChipColors(entry.details.origin);
          const countryFlag = getFlagBadge(entry.details.origin);

          return (
              <div className="grid grid-cols-3 gap-2 mb-6 px-1">
                  {/* Tile 1: Type */}
                  <button 
                    onClick={() => entry.wineType && onFilterByType(entry.wineType)}
                    className={tileBase}
                    style={{ backgroundColor: typeColors.bg, borderColor: typeColors.border, color: typeColors.text }}
                  >
                      <span className={labelStyle}>TYPE</span>
                      <div className="flex flex-col items-center gap-1">
                          {getTypeIcon(entry.wineType)}
                          <span className="text-sm leading-none font-bold" style={{ color: typeColors.text }}>{entry.wineType?.split(' ')[0]}</span>
                      </div>
                  </button>

                  {/* Tile 2: Rarity - Clickable */}
                  <button 
                    onClick={() => entry.rarity && onFilterByRarity?.(entry.rarity)}
                    className={tileBase}
                    style={{ backgroundColor: rarityColors.bg, borderColor: rarityColors.border, color: rarityColors.text }}
                  >
                       <span className={labelStyle}>RARITY</span>
                       <span 
                         className="text-sm font-bold px-1.5 py-0.5 rounded border"
                        style={{ backgroundColor: 'transparent', borderColor: rarityColors.border, color: rarityColors.text }}
                       >
                         {displayClass}
                       </span>
                       <Star size={22} className="mt-2" color={rarityColors.text} />
                  </button>

                  {/* Tile 3: Country */}
                  <button 
                    onClick={() => entry.details.origin && onFilterByOrigin(entry.details.origin)} 
                    className={tileBase}
                    style={{ backgroundColor: countryStyle.bg, borderColor: countryStyle.border, color: countryStyle.text }}
                  >
                       <span className={labelStyle}>COUNTRY</span>
                       <div className="flex items-center gap-2 mb-1">
                         <span 
                           className="w-8 h-5 rounded-sm border border-stone-700 shadow-inner" 
                           style={{ backgroundImage: countryFlag.colors }}
                         ></span>
                       </div>
                       <span className="text-[12px] leading-tight font-bold text-center" style={{ color: countryStyle.text }}>{entry.details.origin || 'N/A'}</span>
                  </button>
              </div>
          );
      } else if (isRegion) {
      const mainGrape = entry.details.notableGrapes?.[0] || 'N/A';
      const mainGrapeEntry = getRelatedEntry(mainGrape);
      const countryStyle = getCountryChipColors(entry.details.origin);
      const systemStyle = getClassificationColors(entry.details.classification);
      const flagBadge = getFlagBadge(entry.details.origin);
      
      return (
          <div className="grid grid-cols-3 gap-2 mb-6 px-1">
              {/* Tile 1: Country */}
              <button 
                onClick={() => entry.details.origin && onFilterByOrigin(entry.details.origin)} 
                className={tileBase}
                style={{ backgroundColor: countryStyle.bg, borderColor: countryStyle.border, color: countryStyle.text }}
              >
                   <span className={labelStyle}>COUNTRY</span>
                   <div className="flex items-center gap-2 mb-1">
                     <span 
                       className="w-8 h-5 rounded-sm border border-stone-700 shadow-inner" 
                       style={{ backgroundImage: flagBadge.colors }}
                     ></span>
                   </div>
                   <span className="text-sm leading-none font-bold" style={{ color: countryStyle.text }}>{entry.details.origin}</span>
              </button>

              {/* Tile 2: Classification */}
              <div 
                className={`${tileBase} cursor-default`}
                style={{ backgroundColor: systemStyle.bg, borderColor: systemStyle.border, color: systemStyle.text }}
              >
                   <span className={labelStyle}>SYSTEM</span>
                   <Shield size={20} className="mb-1" />
                   <span className="text-sm leading-none font-bold" style={{ color: systemStyle.text }}>{entry.details.classification || 'N/A'}</span>
              </div>

                  {/* Tile 3: Main Grape */}
                  <button 
                    onClick={() => mainGrapeEntry && onSelectRelated(mainGrapeEntry)}
                    disabled={!mainGrapeEntry}
                    className={tileBase}
                  >
                       <span className={labelStyle}>MAIN GRAPE</span>
                       <div className="mb-1">
                         {getGrapeColorIcon(mainGrapeEntry)}
                       </div>
                       <span className="text-xs leading-none text-white font-bold">{mainGrape}</span>
                  </button>
              </div>
          );
      } else if (isStyle) {
          const classColors = getClassTypeColors(styleClassType as 'STYLE' | 'METHOD' | 'ORIGIN' | 'TYPE' | undefined);
          const flagBadge = getFlagBadge(entry.details.origin);
          const colorTile = (
            <div
              key="color-type"
              className={`${tileBase} cursor-default`}
              style={{ backgroundColor: colorTypeColors.bg, borderColor: colorTypeColors.border, color: colorTypeColors.text }}
            >
              <span className={labelStyle}>COLOR</span>
              <span className="text-sm font-bold px-2 py-1 rounded border" style={{ borderColor: colorTypeColors.border, color: colorTypeColors.text }}>
                {colorType}
              </span>
            </div>
          );

          const classTile = (
            <div
              key="class"
              className={`${tileBase} cursor-default`}
              style={{ backgroundColor: classColors.bg, borderColor: classColors.border, color: classColors.text }}
            >
              <span className={labelStyle}>CLASS</span>
              <span className="text-sm font-bold px-2 py-1 rounded border" style={{ borderColor: classColors.border, color: classColors.text }}>
                {styleClassType}
              </span>
            </div>
          );

          const originChipColors = entry.details.origin ? getCountryChipColors(entry.details.origin) : null;
          const originTile = entry.details.origin ? (
            <button
              key="origin"
              onClick={() => onFilterByOrigin(entry.details.origin!)}
              className={tileBase}
              style={{ backgroundColor: originChipColors?.bg, borderColor: originChipColors?.border, color: originChipColors?.text }}
            >
              <span className={labelStyle}>COUNTRY</span>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="w-8 h-5 rounded-sm border border-stone-700 shadow-inner"
                  style={{ backgroundImage: flagBadge.colors }}
                ></span>
              </div>
              <span className="text-xs leading-none font-bold text-center">{entry.details.origin}</span>
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
        return (
          <div className="grid grid-cols-2 gap-2 mb-6 px-1">
            <div
              className={`${tileBase} cursor-default`}
              style={{ backgroundColor: flavorColors.bg, borderColor: flavorColors.border, color: flavorColors.text }}
            >
              <span className={labelStyle}>CLASS</span>
              <span className="text-sm font-bold px-2 py-1 rounded border" style={{ borderColor: flavorColors.border, color: flavorColors.text }}>
                {flavorClass}
              </span>
            </div>
            <div className={`${tileBase} cursor-default`} style={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#e2e8f0' }}>
              <span className={labelStyle}>GRAPES</span>
              <span className="text-sm font-bold px-2 py-1 rounded border border-stone-700 text-stone-100">
                {(entry.details.notableGrapes || []).length} linked
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
                  <span className="font-bold text-base tracking-widest text-green-500">INFO</span>
              </div>
              <div className="border-l-4 border-green-700 pl-4 py-3 bg-green-900/5">
                  <p className="text-lg md:text-xl leading-relaxed text-green-200 font-medium break-words whitespace-normal">
                      {grapeCard?.info || entry.description}
                  </p>
              </div>
          </div>
        )}

        {/* Alternate Names Section - Only for Grapes with Synonyms */}
        {isGrapes && grapeCard?.alternateNames && grapeCard.alternateNames.length > 0 && (
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-3 border-b-2 border-green-800 pb-1">
                    <Tag size={18} className="text-green-500" />
                    <span className="font-bold text-base tracking-widest text-green-500">ALTERNATE NAMES</span>
                </div>
                <div className="flex flex-wrap gap-2">
                    {grapeCard.alternateNames.map((name, i) => (
                        <span key={i} className="px-3 py-1.5 bg-stone-800 text-stone-200 border border-stone-600 text-sm font-bold font-mono rounded">
                            {name}
                        </span>
                    ))}
                </div>
            </div>
        )}

        {/* Stats Section - Only for GRAPES */}
        {isGrapes && grapeCard && (
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-2 border-b-2 border-green-800 pb-1">
                    <Activity size={18} className="text-green-500" />
                    <span className="font-bold text-base tracking-widest text-green-500">CHARACTERISTICS</span>
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

        {/* Appellations Section - Only for Regions with appellations */}
        {isRegion && entry.details.appellations && entry.details.appellations.length > 0 && (
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-3 border-b-2 border-green-800 pb-1">
                    <MapPinned size={18} className="text-green-500" />
                    <span className="font-bold text-base tracking-widest text-green-500">
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

        {/* Soil Types Section - Only for Regions */}
        {isRegion && entry.details.soilType && (
            <div className="mb-6">
                 <div className="text-sm font-bold text-stone-500 mb-2 uppercase tracking-wider">SOIL COMPOSITION</div>
                 <div className="flex gap-2">
                    {entry.details.soilType.split(',').slice(0, 3).map((soil, i) => {
                        const cleanSoil = soil.trim();
                        const { icon, color } = getSoilIcon(cleanSoil);
                        return (
                            <button 
                                key={i}
                                onClick={() => onFilterBySoil(cleanSoil)}
                                className="flex-1 bg-stone-900 border border-stone-700 p-2 rounded flex flex-col items-center justify-center hover:border-green-500 hover:bg-stone-800 transition-all active:scale-95 group h-20"
                            >
                                <div className="mb-1 transition-transform group-hover:scale-110" style={{ color: color }}>
                                    {icon}
                                </div>
                                <span className="text-xs text-stone-300 font-bold text-center leading-none uppercase group-hover:text-white">{cleanSoil}</span>
                            </button>
                        )
                    })}
                 </div>
            </div>
        )}
            
        {/* Tasting Notes Section - Clickable (For Grapes & Styles) */}
        {(isGrapes || isStyle) && flavorNotes.length > 0 && (
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-3 border-b-2 border-green-800 pb-1">
                    <Grape size={18} className="text-green-500" />
                    <span className="font-bold text-base tracking-widest text-green-500">FLAVOR PROFILE</span>
                </div>
                <div className="flex justify-between gap-2">
                    {flavorNotes.map((note, i) => (
                        <button 
                            key={i} 
                            onClick={() => onFilterByNote(note.note)}
                            className="flex-1 flex flex-col items-center gap-2 p-3 bg-stone-900 border-2 border-stone-800 rounded-lg hover:border-green-500 hover:bg-stone-800 transition-all active:scale-95 group"
                        >
                            <div 
                                className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"
                                style={{ backgroundColor: note.color, color: '#fff' }}
                            >
                                {ICON_MAP[note.icon] || ICON_MAP['circle']}
                            </div>
                            <span className="text-xs font-bold text-stone-300 uppercase text-center leading-tight group-hover:text-green-300">{note.note}</span>
                        </button>
                    ))}
                </div>
            </div>
        )}

        {/* Method Class: Key Grapes */}
        {isStyle && isMethodClass && entry.details.notableGrapes && entry.details.notableGrapes.length > 0 && (
          <div className="mb-6">
              <div className="flex items-center gap-2 mb-3 border-b-2 border-green-800 pb-1">
                  <Grape size={18} className="text-green-500" />
                  <span className="font-bold text-base tracking-widest text-green-500">KEY GRAPES</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                  {entry.details.notableGrapes.slice(0, 6).map((item, idx) => {
                      const relatedEntry = getRelatedEntry(item);
                      const isLinkable = !!relatedEntry;
                      const IconComp = relatedEntry ? (ICON_MAP[relatedEntry.icon || 'default'] || ICON_MAP['default']) : ICON_MAP['default'];
                      return (
                          <button
                              key={idx}
                              onClick={() => isLinkable && onSelectRelated(relatedEntry)}
                              disabled={!isLinkable}
                              className={`w-full text-left p-2 border font-mono text-base flex items-center gap-3 transition-all rounded relative overflow-hidden group ${
                                  isLinkable 
                                  ? 'bg-stone-900 border-stone-700 hover:border-green-500 hover:bg-stone-800 cursor-pointer active:translate-y-0.5' 
                                  : 'bg-stone-900/30 border-stone-800 text-stone-500 cursor-default opacity-70'
                              }`}
                          >
                              <div 
                                  className={`w-8 h-8 rounded flex items-center justify-center shadow-inner border border-black/20 shrink-0 ${!isLinkable ? 'grayscale' : ''}`}
                                  style={{ backgroundColor: relatedEntry ? relatedEntry.color : '#444' }}
                              >
                                  <div className="text-white opacity-90 scale-75">
                                      {IconComp}
                                  </div>
                              </div>
                              <div className="flex-1 flex justify-between items-center min-w-0">
                                  <span className={`break-words whitespace-normal font-bold ${isLinkable ? 'text-stone-200 group-hover:text-green-400' : 'text-stone-500'}`}>
                                      {item}
                                  </span>
                                  {isLinkable && <ChevronRight size={14} className="text-stone-600 group-hover:text-green-500 shrink-0 ml-2" />}
                              </div>
                          </button>
                      )
                  })}
              </div>
          </div>
        )}

        {/* Notable Grapes Section - For Styles (Style class) */}
        {isStyle && isStyleClassType && styleGrapes.length > 0 && (
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-3 border-b-2 border-green-800 pb-1">
                    <Grape size={18} className="text-green-500" />
                    <span className="font-bold text-base tracking-widest text-green-500">NOTABLE GRAPES</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                     {styleGrapes.slice(0, 6).map((relatedEntry, idx) => {
                         const isLinkable = !!relatedEntry;
                         const IconComp = relatedEntry ? (ICON_MAP[relatedEntry.icon || 'default'] || ICON_MAP['default']) : ICON_MAP['default'];
                         
                         return (
                             <button
                                 key={idx}
                                 onClick={() => isLinkable && onSelectRelated(relatedEntry)}
                                 disabled={!isLinkable}
                                 className={`w-full text-left p-2 border font-mono text-base flex items-center gap-3 transition-all rounded relative overflow-hidden group ${
                                     isLinkable 
                                     ? 'bg-stone-900 border-stone-700 hover:border-green-500 hover:bg-stone-800 cursor-pointer active:translate-y-0.5' 
                                     : 'bg-stone-900/30 border-stone-800 text-stone-500 cursor-default opacity-70'
                                 }`}
                             >
                                {/* Mini Icon Box */}
                                <div 
                                    className={`w-8 h-8 rounded flex items-center justify-center shadow-inner border border-black/20 shrink-0 ${!isLinkable ? 'grayscale' : ''}`}
                                    style={{ backgroundColor: relatedEntry ? relatedEntry.color : '#444' }}
                                >
                                    <div className="text-white opacity-90 scale-75">
                                        {IconComp}
                                    </div>
                                </div>
                                
                                {/* Text */}
                                <div className="flex-1 flex justify-between items-center min-w-0">
                                    <span className={`break-words whitespace-normal font-bold ${isLinkable ? 'text-stone-200 group-hover:text-green-400' : 'text-stone-500'}`}>
                                        {relatedEntry.name}
                                    </span>
                                    {isLinkable && <ChevronRight size={14} className="text-stone-600 group-hover:text-green-500 shrink-0 ml-2" />}
                                </div>
                             </button>
                         )
                     })}
                </div>
            </div>
        )}

        {/* Dynamic List Section - Notable Regions (for Grapes) or Notable Grapes (for Regions) */}
        {(isGrapes || isRegion) && listSectionData && listSectionData.length > 0 && (
            <div className="mb-6">
                 <div className="flex items-center gap-2 mb-3 border-b-2 border-green-800 pb-1">
                    <List size={18} className="text-green-500" />
                    <span className="font-bold text-base tracking-widest text-green-500">{listSectionTitle}</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                     {listSectionData.slice(0, 8).map((item, idx) => {
                         const relatedEntry = getRelatedEntry(item);
                         const isLinkable = !!relatedEntry;
                         const IconComp = relatedEntry ? (ICON_MAP[relatedEntry.icon || 'default'] || ICON_MAP['default']) : ICON_MAP['default'];
                         
                         return (
                             <button
                                 key={idx}
                                 onClick={() => isLinkable && onSelectRelated(relatedEntry)}
                                 disabled={!isLinkable}
                                 className={`w-full text-left p-2 border font-mono text-base flex items-center gap-3 transition-all rounded relative overflow-hidden group ${
                                     isLinkable 
                                     ? 'bg-stone-900 border-stone-700 hover:border-green-500 hover:bg-stone-800 cursor-pointer active:translate-y-0.5' 
                                     : 'bg-stone-900/30 border-stone-800 text-stone-500 cursor-default opacity-70'
                                 }`}
                             >
                                {/* Mini Icon Box */}
                                <div 
                                    className={`w-8 h-8 rounded flex items-center justify-center shadow-inner border border-black/20 shrink-0 ${!isLinkable ? 'grayscale' : ''}`}
                                    style={{ backgroundColor: relatedEntry ? relatedEntry.color : '#444' }}
                                >
                                    <div className="text-white opacity-90 scale-75">
                                        {IconComp}
                                    </div>
                                </div>
                                
                                {/* Text */}
                                <div className="flex-1 flex justify-between items-center min-w-0">
                                    <span className={`break-words whitespace-normal font-bold ${isLinkable ? 'text-stone-200 group-hover:text-green-400' : 'text-stone-500'}`}>
                                        {item}
                                    </span>
                                    {isLinkable && <ChevronRight size={14} className="text-stone-600 group-hover:text-green-500 shrink-0 ml-2" />}
                                </div>
                             </button>
                         )
                     })}
                </div>
            </div>
        )}

        {/* Flavor entries: notable grapes */}
        {isFlavor && entry.details.notableGrapes && entry.details.notableGrapes.length > 0 && (
          <div className="mb-6">
              <div className="flex items-center gap-2 mb-3 border-b-2 border-green-800 pb-1">
                  <Grape size={18} className="text-green-500" />
                  <span className="font-bold text-base tracking-widest text-green-500">NOTABLE GRAPES</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                   {entry.details.notableGrapes.slice(0, 8).map((item, idx) => {
                       const relatedEntry = getRelatedEntry(item);
                       const isLinkable = !!relatedEntry;
                       const IconComp = relatedEntry ? (ICON_MAP[relatedEntry.icon || 'default'] || ICON_MAP['default']) : ICON_MAP['default'];
                       
                       return (
                           <button
                               key={idx}
                               onClick={() => isLinkable && onSelectRelated(relatedEntry)}
                               disabled={!isLinkable}
                               className={`w-full text-left p-2 border font-mono text-base flex items-center gap-3 transition-all rounded relative overflow-hidden group ${
                                   isLinkable 
                                   ? 'bg-stone-900 border-stone-700 hover:border-green-500 hover:bg-stone-800 cursor-pointer active:translate-y-0.5' 
                                   : 'bg-stone-900/30 border-stone-800 text-stone-500 cursor-default opacity-70'
                               }`}
                           >
                              <div 
                                  className={`w-8 h-8 rounded flex items-center justify-center shadow-inner border border-black/20 shrink-0 ${!isLinkable ? 'grayscale' : ''}`}
                                  style={{ backgroundColor: relatedEntry ? relatedEntry.color : '#444' }}
                              >
                                  <div className="text-white opacity-90 scale-75">
                                      {IconComp}
                                  </div>
                              </div>
                              <div className="flex-1 flex justify-between items-center min-w-0">
                                  <span className={`break-words whitespace-normal font-bold ${isLinkable ? 'text-stone-200 group-hover:text-green-400' : 'text-stone-500'}`}>
                                      {item}
                                  </span>
                                  {isLinkable && <ChevronRight size={14} className="text-stone-600 group-hover:text-green-500 shrink-0 ml-2" />}
                              </div>
                           </button>
                       )
                   })}
              </div>
          </div>
        )}

        {/* Origin Class: Notable Grapes */}
        {isStyle && isOriginClass && entry.details.notableGrapes && entry.details.notableGrapes.length > 0 && (
          <div className="mb-6">
              <div className="flex items-center gap-2 mb-3 border-b-2 border-green-800 pb-1">
                  <Grape size={18} className="text-green-500" />
                  <span className="font-bold text-base tracking-widest text-green-500">NOTABLE GRAPES</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                   {entry.details.notableGrapes.slice(0, 6).map((item, idx) => {
                       const relatedEntry = getRelatedEntry(item);
                       const isLinkable = !!relatedEntry;
                       const IconComp = relatedEntry ? (ICON_MAP[relatedEntry.icon || 'default'] || ICON_MAP['default']) : ICON_MAP['default'];
                       
                       return (
                           <button
                               key={idx}
                               onClick={() => isLinkable && onSelectRelated(relatedEntry)}
                               disabled={!isLinkable}
                               className={`w-full text-left p-2 border font-mono text-base flex items-center gap-3 transition-all rounded relative overflow-hidden group ${
                                   isLinkable 
                                   ? 'bg-stone-900 border-stone-700 hover:border-green-500 hover:bg-stone-800 cursor-pointer active:translate-y-0.5' 
                                   : 'bg-stone-900/30 border-stone-800 text-stone-500 cursor-default opacity-70'
                               }`}
                           >
                              <div 
                                  className={`w-8 h-8 rounded flex items-center justify-center shadow-inner border border-black/20 shrink-0 ${!isLinkable ? 'grayscale' : ''}`}
                                  style={{ backgroundColor: relatedEntry ? relatedEntry.color : '#444' }}
                              >
                                  <div className="text-white opacity-90 scale-75">
                                      {IconComp}
                                  </div>
                              </div>
                              <div className="flex-1 flex justify-between items-center min-w-0">
                                  <span className={`break-words whitespace-normal font-bold ${isLinkable ? 'text-stone-200 group-hover:text-green-400' : 'text-stone-500'}`}>
                                      {item}
                                  </span>
                                  {isLinkable && <ChevronRight size={14} className="text-stone-600 group-hover:text-green-500 shrink-0 ml-2" />}
                              </div>
                           </button>
                       )
                   })}
              </div>
          </div>
        )}

        {/* Key Regions for Styles (skip Origin class) */}
        {isStyle && !isOriginClass && entry.details.keyRegions && entry.details.keyRegions.length > 0 && (
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-3 border-b-2 border-green-800 pb-1">
                    <MapPin size={18} className="text-green-500" />
                    <span className="font-bold text-base tracking-widest text-green-500">KEY REGIONS</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                     {entry.details.keyRegions.slice(0, 6).map((item, idx) => {
                         const relatedEntry = getRelatedEntry(item);
                         const isLinkable = !!relatedEntry;
                         const IconComp = relatedEntry ? (ICON_MAP[relatedEntry.icon || 'default'] || ICON_MAP['default']) : ICON_MAP['default'];
                         
                         return (
                             <button
                                 key={idx}
                                 onClick={() => isLinkable && onSelectRelated(relatedEntry)}
                                 disabled={!isLinkable}
                                 className={`w-full text-left p-2 border font-mono text-base flex items-center gap-3 transition-all rounded relative overflow-hidden group ${
                                     isLinkable 
                                     ? 'bg-stone-900 border-stone-700 hover:border-green-500 hover:bg-stone-800 cursor-pointer active:translate-y-0.5' 
                                     : 'bg-stone-900/30 border-stone-800 text-stone-500 cursor-default opacity-70'
                                 }`}
                             >
                                <div 
                                    className={`w-8 h-8 rounded flex items-center justify-center shadow-inner border border-black/20 shrink-0 ${!isLinkable ? 'grayscale' : ''}`}
                                    style={{ backgroundColor: relatedEntry ? relatedEntry.color : '#444' }}
                                >
                                    <div className="text-white opacity-90 scale-75">
                                        {IconComp}
                                    </div>
                                </div>
                                <div className="flex-1 flex justify-between items-center min-w-0">
                                    <span className={`break-words whitespace-normal font-bold ${isLinkable ? 'text-stone-200 group-hover:text-green-400' : 'text-stone-500'}`}>
                                        {item}
                                    </span>
                                    {isLinkable && <ChevronRight size={14} className="text-stone-600 group-hover:text-green-500 shrink-0 ml-2" />}
                                </div>
                             </button>
                         )
                     })}
                </div>
            </div>
        )}

      </div>
    </DeviceLayout>
  );
};

export default EntryDetail;
