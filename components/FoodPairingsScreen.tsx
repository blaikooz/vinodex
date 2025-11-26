
import React, { useState, useMemo, useEffect } from "react";
import { Search, List, Map, Droplet, Grape, Mountain, MapPin, Star, Shield, Wind } from "lucide-react";
import EntryTile from "./PairingTile";
import DeviceLayout from "./DeviceLayout";
import { WINE_ENTRIES } from "../constants";
import { WineEntry, EntryCategory, ClimateClass } from "../types";
import { CLIMATE_CLASS_MAP, CLIMATE_CLASSES } from "../data/climateClasses";

interface EncyclopediaListProps {
  category: EntryCategory;
  filterMode: 'REGION' | 'TYPE' | 'TASTING' | 'SOIL' | 'ORIGIN' | 'RARITY' | 'SYSTEM' | 'CLIMATE' | null;
  filterValue: string | string[] | null;
  onSelect: (entry: WineEntry) => void;
  onBack: () => void;
  onHome: () => void;
  onFilterByRarity?: (rarity: string) => void;
  onFilterByType?: (type: string) => void;
  onFilterByNote?: (note: string) => void;
  onFilterByOrigin?: (origin: string) => void;
  onFilterByClimate?: (climate: ClimateClass) => void;
}

export default function EncyclopediaList({ category, filterMode, filterValue, onSelect, onBack, onHome, onFilterByRarity, onFilterByType, onFilterByNote, onFilterByOrigin, onFilterByClimate }: EncyclopediaListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [selectedFlavorClass, setSelectedFlavorClass] = useState<'SWEET' | 'SOUR' | 'SALTY' | 'BITTER' | 'UMAMI' | null>(null);
  const [selectedFlavorNote, setSelectedFlavorNote] = useState<string | null>(null);

  useEffect(() => {
    setSearchQuery("");
    if (category === 'MASTER_SEARCH') {
      setSelectedStyle(null);
      setSelectedFlavorClass(null);
      setSelectedFlavorNote(null);
    }
  }, [category]);

  const activeFilterMode = filterMode;
  const activeFilterValue = filterValue;
  const effectiveCategory = category === 'MASTER_SEARCH' ? 'GRAPES' : category;

  const categorizeFlavor = (note: string): 'SWEET' | 'SOUR' | 'SALTY' | 'BITTER' | 'UMAMI' => {
    const n = note.toLowerCase();
    const sweet = ['honey', 'vanilla', 'caramel', 'chocolate', 'sweet', 'jam', 'berry', 'plum', 'fruit', 'cand', 'mango', 'peach', 'apple', 'pear', 'tangerine'];
    const sour = ['lemon', 'lime', 'citrus', 'grapefruit', 'tart', 'acid', 'sour'];
    const salty = ['saline', 'salt', 'brine', 'sea', 'ocean'];
    const bitter = ['cocoa', 'coffee', 'espresso', 'pepper', 'spice', 'graphite', 'tannin', 'tar', 'herb'];
    if (sweet.some(k => n.includes(k))) return 'SWEET';
    if (sour.some(k => n.includes(k))) return 'SOUR';
    if (salty.some(k => n.includes(k))) return 'SALTY';
    if (bitter.some(k => n.includes(k))) return 'BITTER';
    return 'UMAMI';
  };

  const filteredEntries = useMemo(() => {
    if (category === 'COUNTRY_GATE') {
      const countries = Array.isArray(filterValue) ? filterValue as string[] : [];
      const countrySystems: Record<string, string[]> = {
        France: ['AOC', 'IGP'],
        Italy: ['DOC', 'DOCG', 'IGT'],
        Spain: ['DO', 'DOCa'],
        Germany: ['QbA', 'GG'],
        Portugal: ['DOC', 'VR'],
        Hungary: ['PDO', 'PGI'],
        Austria: ['DAC'],
        Greece: ['PDO', 'PGI'],
        USA: ['AVA'],
        Canada: ['VQA'],
        Argentina: ['DOC'],
        Chile: ['DO'],
        Uruguay: ['DO'],
        Australia: ['GI'],
        'New Zealand': ['GI'],
        'South Africa': ['WO'],
        China: ['GI'],
        Japan: ['GI'],
        India: ['GI'],
        Georgia: ['PDO'],
      };
      const countryEntries: WineEntry[] = countries.map((ct, idx) => ({
        id: `CT-${idx}`,
        name: ct,
        description: `Regions within ${ct}`,
        category: 'COUNTRY_GATE',
        tags: countrySystems[ct] || ['SYSTEM'],
        color: '#0ea5e9',
        icon: 'flag',
        details: { origin: ct }
      }));
      return countryEntries.filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    const result = WINE_ENTRIES.filter(e => {
        // 1. Category Check
        const matchesCategory = effectiveCategory === 'MASTER_SEARCH' ? true : e.category === effectiveCategory;

        // 2. Search Bar
        const matchesSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              e.description.toLowerCase().includes(searchQuery.toLowerCase());
        
        // 3. Active Filter Logic
        let matchesFilter = true;
        
        if (activeFilterMode === 'REGION' && Array.isArray(activeFilterValue)) {
             matchesFilter = (activeFilterValue as string[]).some(keyword => 
                (e.details.origin && e.details.origin.toLowerCase().includes(keyword.toLowerCase())) ||
                e.tags.some(t => t.toLowerCase().includes(keyword.toLowerCase())) ||
                e.name.toLowerCase().includes(keyword.toLowerCase())
             );
        } else if (activeFilterMode === 'TYPE' && typeof activeFilterValue === 'string') {
             matchesFilter = !!(e.grapeCard?.style || e.wineType) && (e.grapeCard?.style || e.wineType)!.toLowerCase() === activeFilterValue.toLowerCase();
        } else if (activeFilterMode === 'TASTING' && typeof activeFilterValue === 'string') {
             matchesFilter = (!!e.tastingProfile && e.tastingProfile.some(n => n.note.toLowerCase() === activeFilterValue.toLowerCase()))
              || (!!e.details.classification && e.details.classification.toLowerCase() === activeFilterValue.toLowerCase());
        } else if (activeFilterMode === 'SOIL' && typeof activeFilterValue === 'string') {
             matchesFilter = !!e.details.soilType && e.details.soilType.toLowerCase().includes(activeFilterValue.toLowerCase());
        } else if (activeFilterMode === 'ORIGIN' && typeof activeFilterValue === 'string') {
             matchesFilter = (!!e.details.origin && e.details.origin.toLowerCase().includes(activeFilterValue.toLowerCase())) ||
                             e.tags.some(t => t.toLowerCase().includes(activeFilterValue.toLowerCase()));
        } else if (activeFilterMode === 'SYSTEM' && typeof activeFilterValue === 'string') {
             matchesFilter = !!e.details.classification && e.details.classification.toLowerCase() === activeFilterValue.toLowerCase();
        } else if (activeFilterMode === 'RARITY' && typeof activeFilterValue === 'string') {
             matchesFilter = (e.rarity || e.grapeCard?.rarityTier?.toUpperCase()) === activeFilterValue;
        } else if (activeFilterMode === 'CLIMATE' && typeof activeFilterValue === 'string') {
             matchesFilter = !!e.climate && e.climate.toLowerCase() === activeFilterValue.toLowerCase();
        }

        // Deductive filter for MASTER_SEARCH (grape hunt)
        if (category === 'MASTER_SEARCH') {
          if (e.category !== 'GRAPES') return false;
          if (selectedStyle) {
            const styleVal = e.grapeCard?.style || e.wineType || '';
            if (styleVal.toLowerCase() !== selectedStyle.toLowerCase()) return false;
          }
          if (selectedFlavorClass) {
            const notes = e.tastingProfile || [];
            const hasClass = notes.some(n => categorizeFlavor(n.note) === selectedFlavorClass);
            if (!hasClass) return false;
          }
          if (selectedFlavorNote) {
            const notes = e.tastingProfile || [];
            const hasNote = notes.some(n => n.note.toLowerCase() === selectedFlavorNote.toLowerCase());
            if (!hasNote) return false;
          }
        }

        return matchesCategory && matchesSearch && matchesFilter;
    });

    return result.sort((a, b) => a.name.localeCompare(b.name));
  }, [category, effectiveCategory, searchQuery, activeFilterMode, activeFilterValue, filterValue, selectedStyle, selectedFlavorClass, selectedFlavorNote]);

  const getTitle = () => {
      if (category === 'MASTER_SEARCH') return 'DEDUCTIVE SCAN';
      if (activeFilterMode === 'REGION') return category === 'COUNTRY_GATE' ? "AREA SCAN" : "SECTOR SCAN";
      if (activeFilterMode === 'TYPE') return "STYLE SCAN";
      if (activeFilterMode === 'TASTING') return "FLAVOR SCAN";
      if (activeFilterMode === 'SOIL') return "GEOLOGY SCAN";
      if (activeFilterMode === 'ORIGIN') return "REGION SCAN";
      if (activeFilterMode === 'CLIMATE') return "CLIMATE SCAN";
      if (activeFilterMode === 'SYSTEM') return "SYSTEM SCAN";
      
      switch(effectiveCategory) {
          case 'GRAPES': return 'VARIETIES';
          case 'REGIONS': return 'REGIONS';
          case 'STYLES': return 'STYLES';
          case 'COUNTRY_GATE': return 'COUNTRIES';
          case 'FLAVORS': return 'FLAVORS';
          default: return 'DATABASE';
      }
  }

  const getFilterIcon = () => {
      if (activeFilterMode === 'REGION') return <Map size={14} className="text-green-500" />;
      if (activeFilterMode === 'TYPE') return <Grape size={14} className="text-purple-500" />;
      if (activeFilterMode === 'TASTING') return <Droplet size={14} className="text-blue-500" />;
      if (activeFilterMode === 'SOIL') return <Mountain size={14} className="text-orange-500" />;
      if (activeFilterMode === 'ORIGIN') return <MapPin size={14} className="text-red-500" />;
      if (activeFilterMode === 'RARITY') return <Star size={14} className="text-yellow-500" />;
      if (activeFilterMode === 'SYSTEM') return <Shield size={14} className="text-amber-500" />;
      if (activeFilterMode === 'CLIMATE') return <Wind size={14} className="text-sky-400" />;
      return null;
  }

  const getFilterText = () => {
      const val = typeof activeFilterValue === 'string' ? activeFilterValue.toUpperCase() : 'SELECTION';
      if (activeFilterMode === 'REGION') return "FILTER: REGIONAL SECTOR";
      if (activeFilterMode === 'TYPE') return `FILTER: ${val}`;
      if (activeFilterMode === 'TASTING') return `FILTER: ${val}`;
      if (activeFilterMode === 'SOIL') return `FILTER: ${val}`;
      if (activeFilterMode === 'ORIGIN') return `FILTER: REGION ${val}`;
      if (activeFilterMode === 'RARITY') return `FILTER: ${val} RARITY`;
      if (activeFilterMode === 'SYSTEM') return `FILTER: ${val} SYSTEM`;
      if (activeFilterMode === 'CLIMATE') {
        const label = typeof activeFilterValue === 'string' ? CLIMATE_CLASS_MAP[activeFilterValue as ClimateClass]?.name || val : val;
        return `FILTER: ${label} CLIMATE`;
      }
      return "";
  }

  return (
    <DeviceLayout
      title={getTitle()}
      subtitle={category === 'MASTER_SEARCH' ? "STEP BY STEP" : "LIST MODE"}
      onBack={onBack}
      showBack={true}
      onHome={onHome}
    >
      {category === 'MASTER_SEARCH' ? (
        <div className="flex flex-col h-full bg-stone-900">
          <div className="p-4 border-b border-stone-700 space-y-4">
            <div>
              <p className="text-stone-200 font-mono text-xs mb-2 tracking-wide">1) STYLE CLASS</p>
              <div className="grid grid-cols-2 gap-2">
                {WINE_ENTRIES.filter(e => e.category === 'STYLES')
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map(style => {
                    const isActive = selectedStyle === style.name;
                    return (
                      <button
                        key={style.id}
                        onClick={() => { setSelectedStyle(style.name); }}
                        className={`p-2 rounded border text-left text-white font-mono text-sm tracking-wide transition-all ${isActive ? 'border-yellow-400 bg-stone-800' : 'border-stone-700 bg-stone-900 hover:border-green-500'}`}
                      >
                        {style.name}
                      </button>
                    );
                  })}
              </div>
            </div>

            <div>
              <p className="text-stone-200 font-mono text-xs mb-2 tracking-wide">2) FLAVOR CLASS</p>
              <div className="grid grid-cols-5 gap-2">
                {(['SWEET', 'SOUR', 'SALTY', 'BITTER', 'UMAMI'] as const).map(cls => {
                  const isActive = selectedFlavorClass === cls;
                  const base = cls === 'SWEET' ? 'bg-amber-800' :
                               cls === 'SOUR' ? 'bg-lime-800' :
                               cls === 'SALTY' ? 'bg-sky-800' :
                               cls === 'BITTER' ? 'bg-purple-800' : 'bg-emerald-800';
                  return (
                    <button
                      key={cls}
                      onClick={() => { setSelectedFlavorClass(cls); setSelectedFlavorNote(null); }}
                      className={`p-2 rounded border text-center text-xs font-bold tracking-widest ${base} ${isActive ? 'border-yellow-300' : 'border-stone-700 hover:border-green-500'} text-white`}
                    >
                      {cls}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-stone-200 font-mono text-xs mb-2 tracking-wide">3) FLAVOR NOTE</p>
              <div className="grid grid-cols-3 gap-2">
                {WINE_ENTRIES.filter(e => e.category === 'FLAVORS' && (!selectedFlavorClass || (e.details.classification || '').toUpperCase() === selectedFlavorClass))
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map(note => {
                    const isActive = selectedFlavorNote === note.name;
                    return (
                      <button
                        key={note.id}
                        onClick={() => setSelectedFlavorNote(note.name)}
                        className={`p-2 rounded border text-left text-white font-mono text-sm tracking-wide transition-all ${isActive ? 'border-yellow-400 bg-stone-800' : 'border-stone-700 bg-stone-900 hover:border-green-500'}`}
                      >
                        {note.name}
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 bg-stone-950 relative">
               <div 
                  className="absolute inset-0 opacity-10 pointer-events-none" 
                  style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '10px 10px' }} 
               />

              {filteredEntries.length === 0 ? (
                   <div className="text-center py-20 opacity-50 flex flex-col items-center">
                      <List size={48} className="text-red-500 mb-4" />
                      <p className="text-red-500 font-retro text-xs">NO DATA FOUND</p>
                   </div>
              ) : (
                  <div className="flex flex-col gap-2 relative z-10 pb-4">
                      {filteredEntries.map((entry, index) => (
                          <EntryTile 
                              key={entry.id} 
                              entry={entry} 
                              onPress={onSelect}
                              index={index}
                              onFilterByRarity={onFilterByRarity}
                              onFilterByType={onFilterByType}
                              onFilterByNote={onFilterByNote}
                              onFilterByOrigin={onFilterByOrigin}
                              onFilterByClimate={onFilterByClimate}
                          />
                          ))}
                  </div>
              )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-full bg-stone-900">
          
          {/* Filter Indicator */}
          {filterMode && (
               <div className="bg-stone-800 border-b border-stone-700 p-2 flex items-center gap-2 animate-in slide-in-from-top-2 shadow-inner">
                  {getFilterIcon()}
                  <span className="text-xs font-mono text-stone-300 font-bold">{getFilterText()}</span>
               </div>
          )}

          {/* Search Bar - Retro Box */}
          <div className="p-4 bg-stone-800 border-b-2 border-stone-700 shrink-0">
            <div className="flex flex-row items-center bg-black border-2 border-stone-600 px-2 py-2 shadow-inner">
              <Search size={16} className="text-green-500 animate-pulse shrink-0" />
              <input
                type="text"
                autoFocus={false}
                className="flex-1 text-lg text-green-500 ml-3 outline-none bg-transparent placeholder-green-900 font-mono uppercase w-full"
                placeholder={
                  category === 'MASTER_SEARCH'
                    ? "SCAN RESULTS..."
                    : category === 'REGIONS'
                    ? "SEARCH REGIONS..."
                    : category === 'FLAVORS'
                    ? "SEARCH FLAVORS..."
                    : "INPUT QUERY..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="w-2 h-4 bg-green-500 animate-blink shrink-0 ml-2"></div>
            </div>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 bg-stone-950 relative">
               {/* Background Grid */}
               <div 
                  className="absolute inset-0 opacity-10 pointer-events-none" 
                  style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '10px 10px' }} 
               />

              {filteredEntries.length === 0 ? (
                   <div className="text-center py-20 opacity-50 flex flex-col items-center">
                      <List size={48} className="text-red-500 mb-4" />
                      <p className="text-red-500 font-retro text-xs">NO DATA FOUND</p>
                   </div>
              ) : (
                  <div className="flex flex-col gap-2 relative z-10 pb-4">
                      {filteredEntries.map((entry, index) => (
                          <EntryTile 
                              key={entry.id} 
                              entry={entry} 
                              onPress={onSelect}
                              index={index}
                              onFilterByRarity={onFilterByRarity}
                              onFilterByClimate={onFilterByClimate}
                          />
                          ))}
                  </div>
              )}
          </div>
        </div>
      )}
    </DeviceLayout>
  );
}
