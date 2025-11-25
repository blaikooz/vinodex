import React from 'react';
import { WineEntry } from '../types';
import { ChevronRight, Droplet, Heart, Sun, Cloud, Castle, Mountain, Triangle, Sparkles, Circle, Shield, Grape, Leaf, Flame, Zap, Globe, Cherry, Wine, Citrus, Coffee } from 'lucide-react';

interface EntryTileProps {
  entry: WineEntry;
  onPress: (entry: WineEntry) => void;
  index: number;
  onFilterByRarity?: (rarity: string) => void;
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
  default: <Grape size={20} fill="currentColor" className="text-white opacity-90" />
};

// Get grape icon color based on wine type and body - red grapes get red shades, white grapes get gold shades
const getGrapeIconColor = (wineType: string | undefined, body: string | undefined) => {
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

// Get icon based on grape characteristics (tasting profile or wine type)
const getGrapeIcon = (entry: WineEntry): React.ReactNode => {
  const wineType = entry.wineType?.toLowerCase() || '';
  const tastingNotes = entry.tastingProfile?.map(t => t.note.toLowerCase()) || [];
  
  // Check tasting profile first for unique icons
  if (tastingNotes.some(n => n.includes('cherry') || n.includes('berry') || n.includes('fruit'))) {
    return <Cherry size={20} fill="currentColor" className="text-white opacity-90" />;
  }
  if (tastingNotes.some(n => n.includes('citrus') || n.includes('lime') || n.includes('lemon'))) {
    return <Citrus size={20} fill="currentColor" className="text-white opacity-90" />;
  }
  if (tastingNotes.some(n => n.includes('earth') || n.includes('mineral') || n.includes('soil'))) {
    return <Mountain size={20} fill="currentColor" className="text-white opacity-90" />;
  }
  if (tastingNotes.some(n => n.includes('floral') || n.includes('rose') || n.includes('violet'))) {
    return <Sparkles size={20} fill="currentColor" className="text-white opacity-90" />;
  }
  if (tastingNotes.some(n => n.includes('spice') || n.includes('pepper') || n.includes('smoke'))) {
    return <Flame size={20} fill="currentColor" className="text-white opacity-90" />;
  }
  if (tastingNotes.some(n => n.includes('herb') || n.includes('grass') || n.includes('leaf'))) {
    return <Leaf size={20} fill="currentColor" className="text-white opacity-90" />;
  }
  
  // Fallback based on wine type
  if (wineType.includes('red')) {
    return <Wine size={20} fill="currentColor" className="text-white opacity-90" />;
  }
  if (wineType.includes('white')) {
    return <Droplet size={20} fill="currentColor" className="text-white opacity-90" />;
  }
  
  return <Grape size={20} fill="currentColor" className="text-white opacity-90" />;
};

// Get country color
const getCountryColor = (country: string) => {
  const colors: Record<string, { bg: string, text: string, border: string }> = {
    'France': { bg: 'bg-blue-900', text: 'text-blue-200', border: 'border-blue-700' },
    'Italy': { bg: 'bg-green-900', text: 'text-green-200', border: 'border-green-700' },
    'Spain': { bg: 'bg-red-900', text: 'text-red-200', border: 'border-red-700' },
    'USA': { bg: 'bg-indigo-900', text: 'text-indigo-200', border: 'border-indigo-700' },
    'Germany': { bg: 'bg-yellow-900', text: 'text-yellow-200', border: 'border-yellow-700' },
    'Portugal': { bg: 'bg-emerald-900', text: 'text-emerald-200', border: 'border-emerald-700' },
    'Australia': { bg: 'bg-amber-900', text: 'text-amber-200', border: 'border-amber-700' },
    'New Zealand': { bg: 'bg-teal-900', text: 'text-teal-200', border: 'border-teal-700' },
    'Argentina': { bg: 'bg-sky-900', text: 'text-sky-200', border: 'border-sky-700' },
    'Chile': { bg: 'bg-rose-900', text: 'text-rose-200', border: 'border-rose-700' },
    'South Africa': { bg: 'bg-orange-900', text: 'text-orange-200', border: 'border-orange-700' },
    'Austria': { bg: 'bg-fuchsia-900', text: 'text-fuchsia-200', border: 'border-fuchsia-700' },
    'Greece': { bg: 'bg-cyan-900', text: 'text-cyan-200', border: 'border-cyan-700' },
    'Hungary': { bg: 'bg-lime-900', text: 'text-lime-200', border: 'border-lime-700' },
    'Canada': { bg: 'bg-red-800', text: 'text-red-100', border: 'border-red-600' },
  };
  return colors[country] || { bg: 'bg-stone-700', text: 'text-stone-200', border: 'border-stone-500' };
};

const EntryTile: React.FC<EntryTileProps> = ({ entry, onPress, index, onFilterByRarity }) => {
  const isGrape = entry.category === 'GRAPES';
  const isRegion = entry.category === 'REGIONS';
  
  // Get icon and color for grapes based on wine type
  const wineTypeStyle = isGrape ? getWineTypeStyle(entry.wineType) : null;
  const grapeIcon = isGrape ? getGrapeIcon(entry) : null;
  const genericIcon = ICON_MAP[entry.icon || 'default'] || ICON_MAP['default'];
  
  // Get country for regions
  const country = entry.details.origin || '';
  const countryStyle = isRegion ? getCountryColor(country) : null;

  const getRarityStyle = (rarity: string) => {
    switch (rarity) {
      case 'COMMON': return 'bg-stone-600 text-stone-200 border-stone-500';
      case 'UNCOMMON': return 'bg-green-900 text-green-300 border-green-700';
      case 'RARE': return 'bg-blue-900 text-blue-300 border-blue-700';
      case 'LEGENDARY': return 'bg-yellow-900 text-yellow-300 border-yellow-700';
      default: return 'bg-stone-600 text-stone-200 border-stone-500';
    }
  };

  const handleRarityClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onFilterByRarity) {
      onFilterByRarity(entry.rarity);
    }
  };

  // Determine icon background color - grapes use wine type/body color
  const getIconBgColor = () => {
    if (isGrape) {
      return getGrapeIconColor(entry.wineType, entry.details.body);
    }
    return entry.color || '#78716c';
  };

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
        style={{ backgroundColor: getIconBgColor() }}
      >
        {isGrape ? grapeIcon : genericIcon}
      </div>
      
      {/* Middle: Title and Tags */}
      <div className="flex flex-col flex-1 min-w-0 justify-center h-full items-start py-1">
          {/* Title - Optimized for wrapping without truncation */}
          <h3 className="font-retro text-sm text-white leading-tight group-hover:text-green-400 transition-colors w-full text-left mb-2 tracking-tight whitespace-normal break-words">
            {entry.name.toUpperCase()}
          </h3>

          {/* Tags Row - Different based on category */}
          <div className="flex flex-wrap gap-1.5 w-full items-center">
              {/* GRAPES: Show Type and Rarity */}
              {isGrape && (
                <>
                  {/* Wine Type Tag */}
                  {entry.wineType && wineTypeStyle && (
                    <span className={`px-1.5 py-0.5 text-[9px] font-mono border rounded-sm tracking-wide shrink-0 ${wineTypeStyle.bg} ${wineTypeStyle.text} ${wineTypeStyle.border}`}>
                      {entry.wineType.toUpperCase()}
                    </span>
                  )}
                  {/* Rarity Tag - Clickable */}
                  <span 
                    className={`px-1.5 py-0.5 text-[9px] font-mono border rounded-sm tracking-wide shrink-0 cursor-pointer hover:brightness-125 transition-all ${getRarityStyle(entry.rarity)}`}
                    onClick={handleRarityClick}
                    title="Click to filter by rarity"
                  >
                    {entry.rarity}
                  </span>
                </>
              )}

              {/* REGIONS: Show only Country */}
              {isRegion && countryStyle && (
                <span className={`px-1.5 py-0.5 text-[9px] font-mono border rounded-sm tracking-wide shrink-0 ${countryStyle.bg} ${countryStyle.text} ${countryStyle.border}`}>
                  {country.toUpperCase()}
                </span>
              )}

              {/* STYLES: Show only Tags (no rarity) */}
              {!isGrape && !isRegion && (
                <>
                  {entry.tags.slice(0, 2).map((tag, i) => (
                    <span key={i} className="px-1.5 py-0.5 bg-stone-800 text-stone-400 border border-stone-600 text-[9px] font-mono rounded-sm tracking-wide shrink-0">
                      {tag.toUpperCase()}
                    </span>
                  ))}
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
