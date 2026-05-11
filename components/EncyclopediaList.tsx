import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, List, Map, Droplet, Grape, Mountain, MapPin, Star, Shield, Wind } from "lucide-react";
import EntryTile from "./EntryTile";
import DeviceLayout from "./DeviceLayout";
import { WineEntry, EntryCategory, ClimateClass } from "../types";
import { CLIMATE_CLASS_MAP } from "../data/climateClasses";
import { getGrapeBodyFilterValue, getGrapeColorLabel, getGrapeBodyLabel } from "../src/services/grapeDisplay";
import { getAllEntries } from "../src/services/wineData";
import { getColorType, normalizeLabel } from "../src/services/entryUtils";

interface EncyclopediaListProps {
  category: EntryCategory;
  filterMode: 'REGION' | 'TYPE' | 'TASTING' | 'SOIL' | 'ORIGIN' | 'STATE' | 'RARITY' | 'SYSTEM' | 'CLIMATE' | null;
  filterValue: string | string[] | null;
  initialSearchQuery?: string;
  onSelect: (entry: WineEntry) => void;
  onBack: () => void;
  onHome: () => void;
  onFilterByRarity?: (rarity: string) => void;
  onFilterByType?: (type: string, targetCategory?: EntryCategory) => void;
  onFilterByNote?: (note: string, targetCategory?: EntryCategory, mode?: EncyclopediaListProps['filterMode']) => void;
  onFilterByOrigin?: (origin: string) => void;
  onFilterByClimate?: (climate: ClimateClass) => void;
}

export default function EncyclopediaList({ category, filterMode, filterValue, initialSearchQuery, onSelect, onBack, onHome, onFilterByRarity, onFilterByType, onFilterByNote, onFilterByOrigin, onFilterByClimate }: EncyclopediaListProps) {
  const allowedUsStates = ['California', 'New York', 'Oregon', 'Virginia', 'Washington'];
  const [searchQuery, setSearchQuery] = useState("");
  const entries = useMemo(() => getAllEntries(), []);
  const SEARCH_INPUT_START_OFFSET = 16;
  const [cursorOffset, setCursorOffset] = useState(SEARCH_INPUT_START_OFFSET);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchMeasureRef = useRef<HTMLSpanElement>(null);

  const activeFilterMode = filterMode;
  const activeFilterValue = filterValue;
  const isMasterSearch = category === 'MASTER_SEARCH';
  const isWorldSearch = category === 'WORLD_SEARCH';
  const effectiveCategory = isMasterSearch ? 'GRAPES' : category;
  const showTopSearchBar = isMasterSearch || isWorldSearch || effectiveCategory === 'GRAPES' || effectiveCategory === 'STYLES' || effectiveCategory === 'FLAVORS';

  useEffect(() => {
    setSearchQuery(initialSearchQuery || '');
  }, [category, initialSearchQuery]);

  const updateSearchCursorOffset = useCallback(() => {
    const inputEl = searchInputRef.current;
    const measureEl = searchMeasureRef.current;
    if (!inputEl || !measureEl) return;

    const caretIndex = inputEl.selectionStart ?? inputEl.value.length;
    measureEl.textContent = inputEl.value.slice(0, caretIndex);

    const measuredWidth = measureEl.getBoundingClientRect().width;
    const maxOffset = Math.max(SEARCH_INPUT_START_OFFSET, inputEl.clientWidth - 8);
    setCursorOffset(Math.min(measuredWidth + SEARCH_INPUT_START_OFFSET, maxOffset));
  }, [SEARCH_INPUT_START_OFFSET]);

  useEffect(() => {
    updateSearchCursorOffset();
  }, [searchQuery, updateSearchCursorOffset]);

  useEffect(() => {
    const handleResize = () => updateSearchCursorOffset();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateSearchCursorOffset]);

  const normalizeTerm = (value: string) =>
    normalizeLabel(value)
      .replace(/[_\-/(),.;]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const matchesWholeTerm = (candidate: string, term: string) => {
    const normalizedCandidate = normalizeTerm(candidate);
    const normalizedTerm = normalizeTerm(term);
    if (!normalizedCandidate || !normalizedTerm) return false;
    if (normalizedCandidate === normalizedTerm) return true;
    return ` ${normalizedCandidate} `.includes(` ${normalizedTerm} `);
  };

  const matchesGrapeTypeFilter = (entry: WineEntry, filter: string) => {
    if (entry.category !== 'GRAPES') return false;

    const normalizedFilter = normalizeLabel(filter);
    const legacyType = normalizeLabel(entry.grapeStyle || entry.grapeCard?.style || entry.wineType || '');
    if (legacyType && legacyType === normalizedFilter) return true;

    const grapeColor = normalizeLabel(getGrapeColorLabel(entry));
    if (grapeColor === normalizedFilter) return true;

    const grapeBodyFilter = normalizeLabel(
      getGrapeBodyFilterValue(getGrapeBodyLabel(entry), getGrapeColorLabel(entry))
    );
    return grapeBodyFilter === normalizedFilter;
  };

  const filteredEntries = useMemo(() => {
    if (category === 'COUNTRY_GATE') {
      const items = Array.isArray(filterValue) ? filterValue as string[] : [];
      if (filterMode === 'STATE') {
        return entries
          .filter((entry) => entry.category === 'COUNTRY_GATE'
            && entry.details.classification?.toUpperCase() === 'STATE'
            && items.includes(entry.name))
          .sort((a, b) => a.name.localeCompare(b.name));
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

    const allowedCategories = isMasterSearch
      ? ['GRAPES', 'REGIONS', 'STYLES', 'FLAVORS', 'COUNTRY_GATE', 'CONTINENTS']
      : isWorldSearch
        ? ['REGIONS', 'COUNTRY_GATE', 'CONTINENTS']
        : [effectiveCategory];
    const result = entries.filter(e => {
        // 1. Category Check
        const matchesCategory = allowedCategories.includes(e.category)
          && !(e.category === 'COUNTRY_GATE'
            && e.details.classification?.toUpperCase() === 'STATE'
            && !allowedUsStates.includes(e.name));

        // 2. Search Bar
        const matchesSearch = !showTopSearchBar ||
          e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (e.details.origin || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (e.details.state || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (e.details.classification || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (e.details.keyRegions || []).some((region) => region.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (e.details.synonyms || []).some((synonym) => synonym.toLowerCase().includes(searchQuery.toLowerCase())) ||
          e.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

        // 3. Active Filter Logic
        let matchesFilter = true;
        
        if (activeFilterMode === 'REGION' && Array.isArray(activeFilterValue)) {
             matchesFilter = (activeFilterValue as string[]).some(keyword => 
                (e.details.origin && e.details.origin.toLowerCase().includes(keyword.toLowerCase())) ||
                e.tags.some(t => t.toLowerCase().includes(keyword.toLowerCase())) ||
                e.name.toLowerCase().includes(keyword.toLowerCase())
             );
        } else if (activeFilterMode === 'TYPE' && typeof activeFilterValue === 'string') {
             const typeMatch = matchesGrapeTypeFilter(e, activeFilterValue)
              || (!!(e.grapeStyle || e.grapeCard?.style || e.wineType) && normalizeLabel((e.grapeStyle || e.grapeCard?.style || e.wineType)!) === normalizeLabel(activeFilterValue));
             const styleColorMatch = effectiveCategory === 'STYLES' && normalizeLabel(getColorType(e.name)) === normalizeLabel(activeFilterValue);
             matchesFilter = typeMatch || styleColorMatch;
        } else if (activeFilterMode === 'TASTING' && typeof activeFilterValue === 'string') {
             matchesFilter = (!!e.tastingProfile && e.tastingProfile.some(n => n.note.toLowerCase() === activeFilterValue.toLowerCase()))
              || (!!e.details.classification && e.details.classification.toLowerCase() === activeFilterValue.toLowerCase());
        } else if (activeFilterMode === 'SOIL' && typeof activeFilterValue === 'string') {
             matchesFilter = !!e.details.soilType && e.details.soilType.toLowerCase().includes(activeFilterValue.toLowerCase());
        } else if (activeFilterMode === 'ORIGIN' && typeof activeFilterValue === 'string') {
             matchesFilter = (!!e.details.origin && matchesWholeTerm(e.details.origin, activeFilterValue)) ||
                    e.tags.some(t => matchesWholeTerm(t, activeFilterValue));
        } else if (activeFilterMode === 'STATE' && typeof activeFilterValue === 'string') {
             matchesFilter =
               (e.details.origin || '').toUpperCase() === 'USA' &&
           e.details.state === activeFilterValue;
        } else if (activeFilterMode === 'SYSTEM' && typeof activeFilterValue === 'string') {
             matchesFilter = !!e.details.classification && e.details.classification.toLowerCase() === activeFilterValue.toLowerCase();
        } else if (activeFilterMode === 'RARITY' && typeof activeFilterValue === 'string') {
             matchesFilter = (e.rarity || e.grapeRarityTier?.toUpperCase() || e.grapeCard?.rarityTier?.toUpperCase()) === activeFilterValue;
        } else if (activeFilterMode === 'CLIMATE' && typeof activeFilterValue === 'string') {
             matchesFilter = !!e.climate && e.climate.toLowerCase() === activeFilterValue.toLowerCase();
        }

        return matchesCategory && matchesSearch && matchesFilter;
    });

    return result.sort((a, b) => a.name.localeCompare(b.name));
  }, [category, effectiveCategory, showTopSearchBar, searchQuery, activeFilterMode, activeFilterValue, filterValue, entries]);

  const getTitle = () => {
      if (category === 'MASTER_SEARCH') return 'MASTER SEARCH';
      if (category === 'WORLD_SEARCH') return 'WORLD SEARCH';
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
      if (activeFilterMode === 'REGION') return <Map size={24} className="text-green-500" />;
      if (activeFilterMode === 'TYPE') return <Grape size={24} className="text-purple-500" />;
      if (activeFilterMode === 'TASTING') return <Droplet size={24} className="text-blue-500" />;
      if (activeFilterMode === 'SOIL') return <Mountain size={24} className="text-orange-500" />;
      if (activeFilterMode === 'ORIGIN') return <MapPin size={24} className="text-red-500" />;
      if (activeFilterMode === 'STATE') return <MapPin size={24} className="text-cyan-400" />;
      if (activeFilterMode === 'RARITY') return <Star size={24} className="text-yellow-500" />;
      if (activeFilterMode === 'SYSTEM') return <Shield size={24} className="text-amber-500" />;
      if (activeFilterMode === 'CLIMATE') return <Wind size={24} className="text-sky-400" />;
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
      subtitle={isMasterSearch ? "MASTER SEARCH MODE" : isWorldSearch ? "PLACE SEARCH MODE" : "LIST MODE"}
      onBack={onBack}
      showBack={true}
      centerHeaderText={true}
      onHome={onHome}
    >
      <div className="flex flex-col h-full min-h-0 bg-stone-900">
        {showFilterIndicator && (
          <div className="bg-stone-800 border-b border-stone-700 px-4 py-3 flex items-center gap-3 animate-in slide-in-from-top-2 shadow-inner">
            <span className="[&>svg]:!w-6 [&>svg]:!h-6">{getFilterIcon()}</span>
            <span className="text-base font-mono text-stone-200 font-bold tracking-widest">{getFilterText()}</span>
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
                <Search size={22} className="text-green-500 animate-pulse shrink-0" />
                <div className="relative flex-1 h-full ml-2">
                  <span
                    ref={searchMeasureRef}
                    aria-hidden="true"
                    className="absolute left-0 top-1/2 -translate-y-1/2 invisible whitespace-pre text-2xl leading-none font-mono font-bold uppercase"
                  />
                  <input
                    ref={searchInputRef}
                    type="text"
                    autoFocus={false}
                    className="w-full text-2xl leading-none font-bold text-green-500 outline-none bg-transparent placeholder-green-900 placeholder:font-bold font-mono uppercase h-full pl-4"
                    placeholder="INPUT SEARCH..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                    }}
                    onClick={updateSearchCursorOffset}
                    onKeyUp={updateSearchCursorOffset}
                    onSelect={updateSearchCursorOffset}
                  />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-2 h-6 bg-green-500 animate-blink pointer-events-none"
                    style={{ left: `${cursorOffset}px` }}
                  ></div>
                </div>
              </div>
            </div>
          )}

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
