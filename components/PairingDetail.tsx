import React, { useEffect, useRef } from 'react';
import { Tag, MapPin, Activity, Droplet, Clock, Zap, BarChart3, Grape, Mountain, ChevronRight, List, Circle, Triangle, Leaf, Cloud, Sun, Sparkles, Flame, Shield, Castle, Globe, Star, BookOpen, MapPinned } from 'lucide-react';
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
  const getTypeIcon = (typeStr: string = '') => {
      const t = typeStr.toLowerCase();
      if (t.includes('red')) return <Droplet size={24} fill="#DC143C" className="text-red-600" />;
      if (t.includes('white')) return <Droplet size={24} fill="#FACC15" className="text-yellow-400" />;
      if (t.includes('sparkling')) return <Sparkles size={24} fill="#E0FFFF" className="text-cyan-200" />;
      if (t.includes('rose') || t.includes('rosé')) return <Droplet size={24} fill="#FF69B4" className="text-pink-400" />;
      if (t.includes('sweet') || t.includes('dessert')) return <Sun size={24} fill="#FFA500" className="text-orange-400" />;
      return <Grape size={24} fill="#808080" className="text-stone-400" />;
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
      case 'LEGENDARY': return 'bg-yellow-900 text-yellow-300 border-yellow-700';
      default: return 'bg-stone-600 text-stone-200 border-stone-500';
    }
  };

  const bodyLevels = ['Light', 'Light-Medium', 'Medium', 'Medium-Full', 'Full'];
  const acidLevels = ['Low', 'Medium', 'High', 'Very High'];
  const tanninLevels = ['None', 'Low', 'Low-Medium', 'Medium', 'High', 'Very High'];

  // Logic checks
  const isGrapes = entry.category === 'GRAPES';
  const isRegion = entry.category === 'REGIONS';
  const isStyle = entry.category === 'STYLES';

  // Classification Logic
  const isNoble = entry.details.classification === 'Noble Grape';
  const displayClass = isNoble ? 'NOBLE GRAPE' : entry.rarity;

  // List Data Selection
  const listSectionTitle = isRegion ? 'NOTABLE GRAPES' : 'NOTABLE REGIONS';
  const listSectionData = isRegion ? entry.details.notableGrapes : entry.details.keyRegions;

  // Header Tiles Logic - Updated to remove rarity from regions/styles, add rarity clickable for grapes
  const renderHeaderTiles = () => {
      // Common Tile Styles
      const tileBase = "flex flex-col items-center justify-center p-2 bg-stone-900 border-2 border-stone-700 rounded h-20 w-full hover:border-green-500 hover:bg-stone-800 transition-all active:scale-95 group relative overflow-hidden";
      const labelStyle = "text-[9px] font-bold text-stone-500 uppercase tracking-widest mb-1 group-hover:text-green-500 z-10";
      const valueStyle = "text-xs font-bold text-white text-center leading-tight uppercase z-10 break-words w-full";
      
      if (isGrapes) {
          return (
              <div className="grid grid-cols-3 gap-2 mb-6 px-1">
                  {/* Tile 1: Type */}
                  <button onClick={() => entry.wineType && onFilterByType(entry.wineType)} className={tileBase}>
                      <span className={labelStyle}>TYPE</span>
                      <div className="flex flex-col items-center gap-1">
                          {getTypeIcon(entry.wineType)}
                          <span className="text-[10px] leading-none text-white font-bold">{entry.wineType?.split(' ')[0]}</span>
                      </div>
                  </button>

                  {/* Tile 2: Rarity - Clickable */}
                  <button 
                    onClick={() => entry.rarity && onFilterByRarity?.(entry.rarity)}
                    className={tileBase}
                    title="Click to filter by rarity"
                  >
                       <span className={labelStyle}>RARITY</span>
                       <Star size={20} className={`mb-1 ${isNoble ? 'text-purple-400' : 'text-green-400'}`} />
                       <span className={`text-[10px] font-bold px-1 py-0.5 rounded border ${getRarityStyle(entry.rarity)}`}>{displayClass}</span>
                  </button>

                  {/* Tile 3: Origin */}
                  <button onClick={() => entry.details.origin && onFilterByOrigin(entry.details.origin)} className={tileBase}>
                       <span className={labelStyle}>ORIGIN</span>
                       <Globe size={24} className="text-blue-400 mb-1" />
                       <span className="text-[10px] leading-none text-white font-bold">{entry.details.origin || 'N/A'}</span>
                  </button>
              </div>
          );
      } else if (isRegion) {
          const mainGrape = entry.details.notableGrapes?.[0] || 'N/A';
          const mainGrapeEntry = getRelatedEntry(mainGrape);
          
          return (
              <div className="grid grid-cols-3 gap-2 mb-6 px-1">
                  {/* Tile 1: Country */}
                  <button onClick={() => entry.details.origin && onFilterByOrigin(entry.details.origin)} className={tileBase}>
                       <span className={labelStyle}>COUNTRY</span>
                       <Globe size={24} className="text-blue-400 mb-1" />
                       <span className="text-[10px] leading-none text-white font-bold">{entry.details.origin}</span>
                  </button>

                  {/* Tile 2: Classification */}
                  <div className={`${tileBase} cursor-default`}>
                       <span className={labelStyle}>SYSTEM</span>
                       <Shield size={20} className="text-amber-400 mb-1" />
                       <span className="text-[10px] leading-none text-white font-bold">{entry.details.classification || 'N/A'}</span>
                  </div>

                  {/* Tile 3: Main Grape */}
                  <button 
                    onClick={() => mainGrapeEntry && onSelectRelated(mainGrapeEntry)}
                    disabled={!mainGrapeEntry}
                    className={tileBase}
                  >
                       <span className={labelStyle}>MAIN GRAPE</span>
                       <Grape size={24} className="text-purple-400 mb-1" />
                       <span className="text-[10px] leading-none text-white font-bold">{mainGrape}</span>
                  </button>
              </div>
          );
      } else if (isStyle) {
          // Styles: Show Body and Acidity instead of rarity
          return (
              <div className="grid grid-cols-3 gap-2 mb-6 px-1">
                  {/* Tile 1: Body */}
                  <div className={`${tileBase} cursor-default`}>
                       <span className={labelStyle}>BODY</span>
                       <BarChart3 size={20} className="text-green-400 mb-1" />
                       <span className="text-[10px] leading-none text-white font-bold">{entry.details.body || 'N/A'}</span>
                  </div>

                  {/* Tile 2 & 3: Tasting Profiles if available, else key regions */}
                  {entry.tastingProfile?.slice(0, 2).map((note, idx) => (
                      <button 
                        key={idx} 
                        onClick={() => onFilterByNote(note.note)}
                        className={tileBase}
                      >
                           <span className={labelStyle}>NOTE {idx + 1}</span>
                           <div className="text-white mb-1" style={{ color: note.color }}>
                               {ICON_MAP[note.icon]}
                           </div>
                           <span className="text-[10px] leading-none text-white font-bold">{note.note}</span>
                      </button>
                  ))}
              </div>
          );
      }
      return null;
  };

  return (
    <DeviceLayout
      title={entry.id}
      subtitle="ANALYSIS"
      onBack={onBack}
      showBack={true}
      onHome={onHome}
    >
      <div ref={scrollRef} className="h-full overflow-y-auto custom-scrollbar bg-black text-green-400 p-4 font-mono pb-20">
        
        {/* Header Area with Title - Updated for text wrapping */}
        <div className="w-full min-h-[6rem] border-b-4 border-green-800 bg-green-900/10 mb-4 relative overflow-hidden flex items-center justify-center shrink-0 p-4">
             <div className="absolute inset-0 grid grid-cols-8 grid-rows-4 opacity-20">
                {Array.from({ length: 32 }).map((_, i) => (
                    <div key={i} className="border border-green-900/50"></div>
                ))}
             </div>
             <div className="text-center z-10 w-full flex flex-col items-center px-2">
                <h1 className="text-xl md:text-2xl lg:text-3xl font-retro text-white drop-shadow-[4px_4px_0px_rgba(0,100,0,0.8)] tracking-wide leading-tight break-words whitespace-normal uppercase w-full" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                    {entry.name}
                </h1>
                {entry.wineType && isGrapes && (
                  <p className="text-green-500 font-bold text-xs tracking-widest mt-1 bg-black/50 px-2 uppercase">{entry.wineType}</p>
                )}
             </div>
        </div>

        {/* Info Section - Description at Top */}
        <div className="mb-6">
            <div className="flex items-center gap-2 mb-2 border-b-2 border-green-800 pb-1">
                <BookOpen size={18} className="text-green-500" />
                <span className="font-bold text-sm tracking-widest text-green-500">INFO</span>
            </div>
            <div className="border-l-4 border-green-700 pl-4 py-2 bg-green-900/5">
                <p className="text-sm md:text-base leading-relaxed text-green-300 font-medium break-words whitespace-normal">
                    {entry.description}
                </p>
            </div>
        </div>

        {/* 3-Tile Header Row */}
        {renderHeaderTiles()}

        {/* Alternate Names Section - Only for Grapes with Synonyms */}
        {isGrapes && entry.details.synonyms && entry.details.synonyms.length > 0 && (
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-3 border-b-2 border-green-800 pb-1">
                    <Tag size={18} className="text-green-500" />
                    <span className="font-bold text-sm tracking-widest text-green-500">ALTERNATE NAMES</span>
                </div>
                <div className="flex flex-wrap gap-2">
                    {entry.details.synonyms.map((name, i) => (
                        <span key={i} className="px-3 py-1.5 bg-stone-800 text-stone-200 border border-stone-600 text-xs font-bold font-mono rounded">
                            {name}
                        </span>
                    ))}
                </div>
            </div>
        )}

        {/* Stats Section - Only for GRAPES */}
        {isGrapes && (
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-2 border-b-2 border-green-800 pb-1">
                    <Activity size={18} className="text-green-500" />
                    <span className="font-bold text-sm tracking-widest text-green-500">CHARACTERISTICS</span>
                </div>
                <div className="space-y-4 bg-stone-900 p-3 rounded border border-stone-800">
                    {/* Body */}
                    <div className="flex items-center gap-3">
                        <span className="w-16 text-[10px] font-bold text-stone-500 shrink-0">BODY</span>
                        <div className="flex-1 h-2 bg-stone-800 flex gap-0.5">
                            {bodyLevels.map((lvl, i) => {
                                const currentLevel = getLevelIndex(entry.details.body, bodyLevels) >= i;
                                return (
                                    <div key={i} className={`flex-1 ${currentLevel ? 'bg-green-500' : 'bg-transparent'} transition-all`}></div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Acidity */}
                    <div className="flex items-center gap-3">
                        <span className="w-16 text-[10px] font-bold text-stone-500 shrink-0">ACIDITY</span>
                        <div className="flex-1 h-2 bg-stone-800 flex gap-0.5">
                            {acidLevels.map((lvl, i) => {
                                const currentLevel = getLevelIndex(entry.details.acidity, acidLevels) >= i;
                                return (
                                    <div key={i} className={`flex-1 ${currentLevel ? 'bg-yellow-500' : 'bg-transparent'} opacity-90 transition-all`}></div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Tannin */}
                    {entry.details.tannin && (
                    <div className="flex items-center gap-3">
                        <span className="w-16 text-[10px] font-bold text-stone-500 shrink-0">TANNIN</span>
                        <div className="flex-1 h-2 bg-stone-800 flex gap-0.5">
                            {tanninLevels.map((lvl, i) => {
                                const currentLevel = getLevelIndex(entry.details.tannin, tanninLevels) >= i;
                                return (
                                    <div key={i} className={`flex-1 ${currentLevel ? 'bg-red-500' : 'bg-transparent'} opacity-90 transition-all`}></div>
                                )
                            })}
                        </div>
                    </div>
                    )}
                </div>
            </div>
        )}

        {/* Appellations Section - Only for Regions with appellations */}
        {isRegion && entry.details.appellations && entry.details.appellations.length > 0 && (
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-3 border-b-2 border-green-800 pb-1">
                    <MapPinned size={18} className="text-green-500" />
                    <span className="font-bold text-sm tracking-widest text-green-500">
                        {entry.name.includes('Beaujolais') ? 'CRUS OF BEAUJOLAIS' : 'APPELLATIONS'}
                    </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    {entry.details.appellations.map((appellation, i) => (
                        <div key={i} className="px-3 py-2 bg-stone-800 text-stone-200 border border-stone-600 text-xs font-bold font-mono rounded text-center">
                            {appellation}
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* Soil Types Section - Only for Regions */}
        {isRegion && entry.details.soilType && (
            <div className="mb-6">
                 <div className="text-[10px] font-bold text-stone-500 mb-2 uppercase tracking-wider">SOIL COMPOSITION</div>
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
                                <span className="text-[10px] text-stone-300 font-bold text-center leading-none uppercase group-hover:text-white">{cleanSoil}</span>
                            </button>
                        )
                    })}
                 </div>
            </div>
        )}
            
        {/* Tasting Notes Section - Clickable (For Grapes & Styles) */}
        {(isGrapes || isStyle) && entry.tastingProfile && (
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-3 border-b-2 border-green-800 pb-1">
                    <Grape size={18} className="text-green-500" />
                    <span className="font-bold text-sm tracking-widest text-green-500">TASTING PROFILE</span>
                </div>
                <div className="flex justify-between gap-2">
                    {entry.tastingProfile.map((note, i) => (
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
                            <span className="text-[10px] font-bold text-stone-300 uppercase text-center leading-tight group-hover:text-green-300">{note.note}</span>
                        </button>
                    ))}
                </div>
            </div>
        )}

        {/* Notable Grapes Section - For Styles */}
        {isStyle && entry.details.notableGrapes && entry.details.notableGrapes.length > 0 && (
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-3 border-b-2 border-green-800 pb-1">
                    <Grape size={18} className="text-green-500" />
                    <span className="font-bold text-sm tracking-widest text-green-500">NOTABLE GRAPES</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                     {entry.details.notableGrapes.slice(0, 6).map((item, idx) => {
                         const relatedEntry = getRelatedEntry(item);
                         const isLinkable = !!relatedEntry;
                         const IconComp = relatedEntry ? (ICON_MAP[relatedEntry.icon || 'default'] || ICON_MAP['default']) : <Circle size={16} />;
                         
                         return (
                             <button
                                 key={idx}
                                 onClick={() => isLinkable && onSelectRelated(relatedEntry)}
                                 disabled={!isLinkable}
                                 className={`w-full text-left p-2 border font-mono text-sm flex items-center gap-3 transition-all rounded relative overflow-hidden group ${
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

        {/* Dynamic List Section - Notable Regions (for Grapes) or Notable Grapes (for Regions) */}
        {(isGrapes || isRegion) && listSectionData && listSectionData.length > 0 && (
            <div className="mb-6">
                 <div className="flex items-center gap-2 mb-3 border-b-2 border-green-800 pb-1">
                    <List size={18} className="text-green-500" />
                    <span className="font-bold text-sm tracking-widest text-green-500">{listSectionTitle}</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                     {listSectionData.slice(0, 8).map((item, idx) => {
                         const relatedEntry = getRelatedEntry(item);
                         const isLinkable = !!relatedEntry;
                         const IconComp = relatedEntry ? (ICON_MAP[relatedEntry.icon || 'default'] || ICON_MAP['default']) : <Circle size={16} />;
                         
                         return (
                             <button
                                 key={idx}
                                 onClick={() => isLinkable && onSelectRelated(relatedEntry)}
                                 disabled={!isLinkable}
                                 className={`w-full text-left p-2 border font-mono text-sm flex items-center gap-3 transition-all rounded relative overflow-hidden group ${
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

        {/* Key Regions for Styles */}
        {isStyle && entry.details.keyRegions && entry.details.keyRegions.length > 0 && (
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-3 border-b-2 border-green-800 pb-1">
                    <MapPin size={18} className="text-green-500" />
                    <span className="font-bold text-sm tracking-widest text-green-500">KEY REGIONS</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                     {entry.details.keyRegions.slice(0, 6).map((item, idx) => {
                         const relatedEntry = getRelatedEntry(item);
                         const isLinkable = !!relatedEntry;
                         const IconComp = relatedEntry ? (ICON_MAP[relatedEntry.icon || 'default'] || ICON_MAP['default']) : <Circle size={16} />;
                         
                         return (
                             <button
                                 key={idx}
                                 onClick={() => isLinkable && onSelectRelated(relatedEntry)}
                                 disabled={!isLinkable}
                                 className={`w-full text-left p-2 border font-mono text-sm flex items-center gap-3 transition-all rounded relative overflow-hidden group ${
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
