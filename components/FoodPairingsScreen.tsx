
import React, { useState, useMemo } from "react";
import { Search, List, Map, Droplet, Grape, Mountain, MapPin, Star } from "lucide-react";
import EntryTile from "./PairingTile";
import DeviceLayout from "./DeviceLayout";
import { WINE_ENTRIES } from "../constants";
import { WineEntry, EntryCategory } from "../types";

interface EncyclopediaListProps {
  category: EntryCategory;
  filterMode: 'REGION' | 'TYPE' | 'TASTING' | 'SOIL' | 'ORIGIN' | 'RARITY' | null;
  filterValue: string | string[] | null;
  onSelect: (entry: WineEntry) => void;
  onBack: () => void;
  onHome: () => void;
  onFilterByRarity?: (rarity: string) => void;
}

export default function EncyclopediaList({ category, filterMode, filterValue, onSelect, onBack, onHome, onFilterByRarity }: EncyclopediaListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredEntries = useMemo(() => {
    return WINE_ENTRIES.filter(e => {
        // 1. Category Check
        const matchesCategory = category === 'MASTER_SEARCH' ? true : e.category === category;

        // 2. Search Bar
        const matchesSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              e.description.toLowerCase().includes(searchQuery.toLowerCase());
        
        // 3. Active Filter Logic
        let matchesFilter = true;
        
        if (filterMode === 'REGION' && Array.isArray(filterValue)) {
             matchesFilter = filterValue.some(keyword => 
                (e.details.origin && e.details.origin.toLowerCase().includes(keyword.toLowerCase())) ||
                e.tags.some(t => t.toLowerCase().includes(keyword.toLowerCase())) ||
                e.name.toLowerCase().includes(keyword.toLowerCase())
             );
        } else if (filterMode === 'TYPE' && typeof filterValue === 'string') {
             matchesFilter = !!e.wineType && e.wineType.toLowerCase() === filterValue.toLowerCase();
        } else if (filterMode === 'TASTING' && typeof filterValue === 'string') {
             matchesFilter = !!e.tastingProfile && e.tastingProfile.some(n => n.note.toLowerCase() === filterValue.toLowerCase());
        } else if (filterMode === 'SOIL' && typeof filterValue === 'string') {
             matchesFilter = !!e.details.soilType && e.details.soilType.toLowerCase().includes(filterValue.toLowerCase());
        } else if (filterMode === 'ORIGIN' && typeof filterValue === 'string') {
             // Broad check for origin or tags
             matchesFilter = (!!e.details.origin && e.details.origin.toLowerCase().includes(filterValue.toLowerCase())) ||
                             e.tags.some(t => t.toLowerCase() === filterValue.toLowerCase());
        } else if (filterMode === 'RARITY' && typeof filterValue === 'string') {
             matchesFilter = e.rarity === filterValue;
        }

        return matchesCategory && matchesSearch && matchesFilter;
    });
  }, [category, searchQuery, filterMode, filterValue]);

  const getTitle = () => {
      if (filterMode === 'REGION') return "SECTOR SCAN";
      if (filterMode === 'TYPE') return "STYLE SCAN";
      if (filterMode === 'TASTING') return "FLAVOR SCAN";
      if (filterMode === 'SOIL') return "GEOLOGY SCAN";
      if (filterMode === 'ORIGIN') return "ORIGIN SCAN";
      
      switch(category) {
          case 'GRAPES': return 'VARIETIES';
          case 'REGIONS': return 'REGIONS';
          case 'STYLES': return 'STYLES';
          case 'MASTER_SEARCH': return 'MASTER SEARCH';
          default: return 'DATABASE';
      }
  }

  const getFilterIcon = () => {
      if (filterMode === 'REGION') return <Map size={14} className="text-green-500" />;
      if (filterMode === 'TYPE') return <Grape size={14} className="text-purple-500" />;
      if (filterMode === 'TASTING') return <Droplet size={14} className="text-blue-500" />;
      if (filterMode === 'SOIL') return <Mountain size={14} className="text-orange-500" />;
      if (filterMode === 'ORIGIN') return <MapPin size={14} className="text-red-500" />;
      if (filterMode === 'RARITY') return <Star size={14} className="text-yellow-500" />;
      return null;
  }

  const getFilterText = () => {
      const val = typeof filterValue === 'string' ? filterValue.toUpperCase() : 'SELECTION';
      if (filterMode === 'REGION') return "FILTER: REGIONAL SECTOR";
      if (filterMode === 'TYPE') return `FILTER: ${val}`;
      if (filterMode === 'TASTING') return `FILTER: ${val}`;
      if (filterMode === 'SOIL') return `FILTER: ${val}`;
      if (filterMode === 'ORIGIN') return `FILTER: ${val}`;
      if (filterMode === 'RARITY') return `FILTER: ${val} RARITY`;
      return "";
  }

  return (
    <DeviceLayout
      title={getTitle()}
      subtitle={category === 'MASTER_SEARCH' ? "GLOBAL INDEX" : "LIST MODE"}
      onBack={onBack}
      showBack={true}
      onHome={onHome}
    >
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
              placeholder={category === 'MASTER_SEARCH' ? "SEARCH DATABASE..." : "INPUT QUERY..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="w-2 h-4 bg-green-500 animate-blink shrink-0"></div>
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
                        />
                    ))}
                </div>
            )}
        </div>
      </div>
    </DeviceLayout>
  );
}
