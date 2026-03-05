import React, { useEffect, useMemo, useState } from "react";
import { Search, List, Map, Droplet, Grape, Mountain, MapPin, Star, Shield, Wind, AlertCircle } from "lucide-react";
import EntryTile from "./PairingTile";
import DeviceLayout from "./DeviceLayout";
import { WineEntry, EntryCategory, ClimateClass } from "../types";
import { CLIMATE_CLASS_MAP } from "../data/climateClasses";
import { loadAllEntries } from "../src/services/wineData";

interface EncyclopediaListProps {
  category: EntryCategory;
  filterMode: 'REGION' | 'TYPE' | 'TASTING' | 'SOIL' | 'ORIGIN' | 'STATE' | 'RARITY' | 'SYSTEM' | 'CLIMATE' | null;
  filterValue: string | string[] | null;
  onSelect: (entry: WineEntry) => void;
  onBack: () => void;
  onHome: () => void;
  onFilterByRarity?: (rarity: string) => void;
  onFilterByType?: (type: string, targetCategory?: EntryCategory) => void;
  onFilterByNote?: (note: string, targetCategory?: EntryCategory, mode?: EncyclopediaListProps['filterMode']) => void;
  onFilterByOrigin?: (origin: string) => void;
  onFilterByClimate?: (climate: ClimateClass) => void;
}

export default function EncyclopediaList({ category, filterMode, filterValue, onSelect, onBack, onHome, onFilterByRarity, onFilterByType, onFilterByNote, onFilterByOrigin, onFilterByClimate }: EncyclopediaListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [entries, setEntries] = useState<WineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchEntries = () => {
    setLoading(true);
    setLoadError(null);
    loadAllEntries()
      .then((data) => setEntries(data))
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Failed to load entries'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const activeFilterMode = filterMode;
  const activeFilterValue = filterValue;
  const isMasterSearch = category === 'MASTER_SEARCH';
  const effectiveCategory = isMasterSearch ? 'GRAPES' : category;
  const showTopSearchBar = effectiveCategory === 'GRAPES' || effectiveCategory === 'STYLES' || effectiveCategory === 'FLAVORS';

  useEffect(() => {
    setSearchQuery("");
  }, [category]);

  const getStyleColorType = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('orange')) return 'ORANGE';
    if (n.includes('rosé') || n.includes('rose')) return 'ROSÉ';
    if (n.includes('red')) return 'RED';
    if (n.includes('white')) return 'WHITE';
    return 'DUAL';
  };

  const usaRegionStateMap: Record<string, string> = {
    'Napa Valley': 'California',
    'Sonoma': 'California',
    'Paso Robles': 'California',
    'Santa Barbara': 'California',
    'Lodi': 'California',
    'Willamette Valley': 'Oregon',
    'Walla Walla': 'Washington',
    'Finger Lakes': 'New York',
  };

  const filteredEntries = useMemo(() => {
    if (category === 'COUNTRY_GATE') {
      const items = Array.isArray(filterValue) ? filterValue as string[] : [];
      if (filterMode === 'STATE') {
        const stateEntries: WineEntry[] = items.map((state, idx) => ({
          id: `ST-${idx}`,
          name: state,
          description: `Wine regions within ${state}`,
          category: 'COUNTRY_GATE',
          tags: ['STATE'],
          color: '#0ea5e9',
          icon: 'flag',
          details: { origin: state, classification: 'STATE' }
        }));
        return stateEntries;
      }
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
      const countryEntries: WineEntry[] = items.map((ct, idx) => ({
        id: `CT-${idx}`,
        name: ct,
        description: `Regions within ${ct}`,
        category: 'COUNTRY_GATE',
        tags: countrySystems[ct] || ['SYSTEM'],
        color: '#0ea5e9',
        icon: 'flag',
        details: { origin: ct }
      }));
      return countryEntries;
    }

    const allowedCategories = isMasterSearch ? ['GRAPES', 'REGIONS', 'STYLES'] : [effectiveCategory];
    const result = entries.filter(e => {
        // 1. Category Check
        const matchesCategory = allowedCategories.includes(e.category);

        // 2. Search Bar
        const matchesSearch = !showTopSearchBar ||
          e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
             const typeMatch = !!(e.grapeCard?.style || e.wineType) && (e.grapeCard?.style || e.wineType)!.toLowerCase() === activeFilterValue.toLowerCase();
             const styleColorMatch = effectiveCategory === 'STYLES' && getStyleColorType(e.name).toLowerCase() === activeFilterValue.toLowerCase();
             matchesFilter = typeMatch || styleColorMatch;
        } else if (activeFilterMode === 'TASTING' && typeof activeFilterValue === 'string') {
             matchesFilter = (!!e.tastingProfile && e.tastingProfile.some(n => n.note.toLowerCase() === activeFilterValue.toLowerCase()))
              || (!!e.details.classification && e.details.classification.toLowerCase() === activeFilterValue.toLowerCase());
        } else if (activeFilterMode === 'SOIL' && typeof activeFilterValue === 'string') {
             matchesFilter = !!e.details.soilType && e.details.soilType.toLowerCase().includes(activeFilterValue.toLowerCase());
        } else if (activeFilterMode === 'ORIGIN' && typeof activeFilterValue === 'string') {
             matchesFilter = (!!e.details.origin && e.details.origin.toLowerCase().includes(activeFilterValue.toLowerCase())) ||
                             e.tags.some(t => t.toLowerCase().includes(activeFilterValue.toLowerCase()));
        } else if (activeFilterMode === 'STATE' && typeof activeFilterValue === 'string') {
             matchesFilter =
               (e.details.origin || '').toUpperCase() === 'USA' &&
               usaRegionStateMap[e.name] === activeFilterValue;
        } else if (activeFilterMode === 'SYSTEM' && typeof activeFilterValue === 'string') {
             matchesFilter = !!e.details.classification && e.details.classification.toLowerCase() === activeFilterValue.toLowerCase();
        } else if (activeFilterMode === 'RARITY' && typeof activeFilterValue === 'string') {
             matchesFilter = (e.rarity || e.grapeCard?.rarityTier?.toUpperCase()) === activeFilterValue;
        } else if (activeFilterMode === 'CLIMATE' && typeof activeFilterValue === 'string') {
             matchesFilter = !!e.climate && e.climate.toLowerCase() === activeFilterValue.toLowerCase();
        }

        return matchesCategory && matchesSearch && matchesFilter;
    });

    return result.sort((a, b) => a.name.localeCompare(b.name));
  }, [category, effectiveCategory, showTopSearchBar, searchQuery, activeFilterMode, activeFilterValue, filterValue, entries]);

  const getTitle = () => {
      if (category === 'MASTER_SEARCH') return 'SEARCH';
      if (activeFilterMode === 'REGION') return category === 'COUNTRY_GATE' ? "AREA SCAN" : "SECTOR SCAN";
      if (activeFilterMode === 'TYPE') return "STYLE SCAN";
      if (activeFilterMode === 'TASTING') return "FLAVOR SCAN";
      if (activeFilterMode === 'SOIL') return "GEOLOGY SCAN";
      if (activeFilterMode === 'ORIGIN') return "REGION SCAN";
      if (activeFilterMode === 'STATE') return "STATE SCAN";
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
  };

  const getFilterIcon = () => {
      if (activeFilterMode === 'REGION') return <Map size={14} className="text-green-500" />;
      if (activeFilterMode === 'TYPE') return <Grape size={14} className="text-purple-500" />;
      if (activeFilterMode === 'TASTING') return <Droplet size={14} className="text-blue-500" />;
      if (activeFilterMode === 'SOIL') return <Mountain size={14} className="text-orange-500" />;
      if (activeFilterMode === 'ORIGIN') return <MapPin size={14} className="text-red-500" />;
      if (activeFilterMode === 'STATE') return <MapPin size={14} className="text-cyan-400" />;
      if (activeFilterMode === 'RARITY') return <Star size={14} className="text-yellow-500" />;
      if (activeFilterMode === 'SYSTEM') return <Shield size={14} className="text-amber-500" />;
      if (activeFilterMode === 'CLIMATE') return <Wind size={14} className="text-sky-400" />;
      return null;
  };

  const getFilterText = () => {
      const val = typeof activeFilterValue === 'string' ? activeFilterValue.toUpperCase() : 'SELECTION';
      if (activeFilterMode === 'REGION') return "FILTER: REGIONAL SECTOR";
      if (activeFilterMode === 'TYPE') return `FILTER: ${val}`;
      if (activeFilterMode === 'TASTING') return `FILTER: ${val}`;
      if (activeFilterMode === 'SOIL') return `FILTER: ${val}`;
      if (activeFilterMode === 'ORIGIN') return `FILTER: REGION ${val}`;
      if (activeFilterMode === 'STATE') return `FILTER: STATE ${val}`;
      if (activeFilterMode === 'RARITY') return `FILTER: ${val} RARITY`;
      if (activeFilterMode === 'SYSTEM') return `FILTER: ${val} SYSTEM`;
      if (activeFilterMode === 'CLIMATE') {
        const label = typeof activeFilterValue === 'string' ? CLIMATE_CLASS_MAP[activeFilterValue as ClimateClass]?.name || val : val;
        return `FILTER: ${label} CLIMATE`;
      }
      return "";
  };

  const showFilterIndicator = !isMasterSearch && !!filterMode;

  return (
    <DeviceLayout
      title={getTitle()}
      subtitle={isMasterSearch ? "SEARCH MODE" : "LIST MODE"}
      onBack={onBack}
      showBack={true}
      centerHeaderText={true}
      onHome={onHome}
    >
      {loadError && (
        <div className="p-3 text-sm text-red-200 bg-red-950 border border-red-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-red-400" />
            <span>Failed to load entries: {loadError}</span>
          </div>
          <button onClick={fetchEntries} className="underline text-red-100">Retry</button>
        </div>
      )}

      <div className="flex flex-col h-full bg-stone-900">
        {showFilterIndicator && (
          <div className="bg-stone-800 border-b border-stone-700 p-2 flex items-center gap-2 animate-in slide-in-from-top-2 shadow-inner">
            {getFilterIcon()}
            <span className="text-xs font-mono text-stone-300 font-bold">{getFilterText()}</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 bg-stone-950 relative">
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '10px 10px' }}
          />

          {showTopSearchBar && (
            <div className="relative z-10 mb-3">
              <div className="flex flex-row items-center justify-between h-12 bg-black border-2 border-stone-600 px-3 shadow-inner rounded-full">
                <Search size={18} className="text-green-500 animate-pulse shrink-0" />
                <input
                  type="text"
                  autoFocus={false}
                  className="flex-1 text-base text-green-500 ml-3 outline-none bg-transparent placeholder-green-900 font-mono uppercase h-full"
                  placeholder="INPUT SEARCH..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="w-2 h-4 bg-green-500 animate-blink shrink-0 ml-2"></div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-20 opacity-70 flex flex-col items-center">
              <List size={48} className="text-stone-500 mb-4" />
              <p className="text-stone-400 font-retro text-xs">LOADING...</p>
            </div>
          ) : filteredEntries.length === 0 ? (
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
                  onFilterByType={onFilterByType}
                  onFilterByNote={onFilterByNote}
                  onFilterByOrigin={onFilterByOrigin}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </DeviceLayout>
  );
}
