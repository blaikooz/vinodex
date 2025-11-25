
import React, { useState } from 'react';
import MainMenu from './components/MainMenu';
import EncyclopediaList from './components/FoodPairingsScreen';
import EntryDetail from './components/PairingDetail';
import RegionMapScreen from './components/RegionMapScreen';
import { WineEntry, EntryCategory } from './types';

type Screen = 'HOME' | 'LIST' | 'DETAIL' | 'REGION_MAP';
type FilterMode = 'REGION' | 'TYPE' | 'TASTING' | 'SOIL' | 'ORIGIN' | 'RARITY' | null;

interface AppState {
  screen: Screen;
  category: EntryCategory;
  entry: WineEntry | null;
  filterMode: FilterMode;
  filterValue: string | string[] | null;
}

const INITIAL_STATE: AppState = {
  screen: 'HOME',
  category: 'GRAPES',
  entry: null,
  filterMode: null,
  filterValue: null
};

const App: React.FC = () => {
  // Use a stack for history
  const [history, setHistory] = useState<AppState[]>([INITIAL_STATE]);
  
  const currentState = history[history.length - 1];

  // Helper to push new state
  const pushState = (newState: Partial<AppState>) => {
      setHistory(prev => [...prev, { ...prev[prev.length - 1], ...newState }]);
  };

  // Helper to replace current state (for simple tab switches if needed, though mostly we push)
  const replaceState = (newState: Partial<AppState>) => {
      setHistory(prev => [...prev.slice(0, -1), { ...prev[prev.length - 1], ...newState }]);
  };

  const handleBack = () => {
    if (history.length > 1) {
        setHistory(prev => prev.slice(0, -1));
    } else {
        // If at root, maybe reset to clean home?
        setHistory([INITIAL_STATE]);
    }
  };

  const handleHome = () => {
    setHistory([INITIAL_STATE]);
  };

  // Navigation Handlers
  const handleNavigateToCategory = (category: EntryCategory) => {
    if (category === 'REGIONS') {
        pushState({ screen: 'REGION_MAP', category, filterMode: null, filterValue: null });
    } else {
        pushState({ screen: 'LIST', category, filterMode: null, filterValue: null });
    }
  };

  const handleSelectEntry = (entry: WineEntry) => {
    pushState({ screen: 'DETAIL', entry });
  };

  // --- Deep Linking Handlers ---

  // 1. Region Map Selection
  const handleContinentSelect = (continent: string) => {
      let keywords: string[] = [];
      switch(continent) {
          case 'EUROPE': 
            keywords = ['France', 'Italy', 'Spain', 'Germany', 'Portugal', 'Hungary', 'Austria', 'Greece', 'Bordeaux', 'Tuscany', 'Burgundy', 'Rhône', 'Rioja', 'Piedmont', 'Champagne', 'Alsace', 'Beaujolais', 'Provence', 'Chablis', 'Sauternes', 'Douro', 'Priorat', 'Rias Baixas', 'Jerez', 'Puglia', 'Sicily', 'Tokaj']; 
            break;
          case 'NORTH_AMERICA': 
            keywords = ['USA', 'Canada', 'Napa', 'Sonoma', 'Washington', 'Willamette', 'California', 'Oregon', 'New York']; 
            break;
          case 'SOUTH_AMERICA': 
            keywords = ['Argentina', 'Chile', 'Mendoza', 'Maipo', 'Casablanca', 'Colchagua', 'Salta']; 
            break;
          case 'OCEANIA': 
            keywords = ['Australia', 'New Zealand', 'Marlborough', 'Barossa', 'Coonawarra', 'Margaret River', 'Tasmania']; 
            break;
          case 'AFRICA': 
            keywords = ['South Africa', 'Stellenbosch', 'Swartland']; 
            break;
          default:
            keywords = [];
      }
      
      pushState({ screen: 'LIST', category: 'REGIONS', filterMode: 'REGION', filterValue: keywords });
  };

  // 2. Manual Search
  const handleManualSearch = () => {
      pushState({ screen: 'LIST', category: 'MASTER_SEARCH', filterMode: null, filterValue: null });
  };

  // 3. Filter by Wine Type (from Detail Screen)
  const handleFilterByType = (type: string) => {
      pushState({ screen: 'LIST', category: 'GRAPES', filterMode: 'TYPE', filterValue: type });
  };

  // 4. Filter by Tasting Note (from Detail Screen)
  const handleFilterByNote = (note: string) => {
      pushState({ screen: 'LIST', category: 'GRAPES', filterMode: 'TASTING', filterValue: note });
  };

  // 5. Filter by Soil Type
  const handleFilterBySoil = (soil: string) => {
      pushState({ screen: 'LIST', category: 'REGIONS', filterMode: 'SOIL', filterValue: soil });
  };

  // 6. Filter by Origin
  const handleFilterByOrigin = (origin: string) => {
      // Often origins are countries or broad regions. We might want to search Master or Grapes/Regions depending on context.
      // Usually "Origin" on a Grape card implies where it is from, so we might look for regions or other grapes from there.
      // Let's use MASTER_SEARCH or just filter REGIONS? 
      // User said "cross link location tiles to filter for locations".
      pushState({ screen: 'LIST', category: 'MASTER_SEARCH', filterMode: 'ORIGIN', filterValue: origin });
  };

  // 7. Filter by Rarity
  const handleFilterByRarity = (rarity: string) => {
      pushState({ screen: 'LIST', category: 'MASTER_SEARCH', filterMode: 'RARITY', filterValue: rarity });
  };

  return (
    <div className="antialiased text-gray-900 bg-gray-900 min-h-screen">
      {currentState.screen === 'HOME' && (
        <MainMenu onNavigate={handleNavigateToCategory} />
      )}
      
      {currentState.screen === 'REGION_MAP' && (
        <RegionMapScreen 
            onSelectContinent={handleContinentSelect}
            onSearch={handleManualSearch}
            onBack={handleBack}
            onHome={handleHome}
        />
      )}
      
      {currentState.screen === 'LIST' && (
        <EncyclopediaList 
          category={currentState.category}
          filterMode={currentState.filterMode}
          filterValue={currentState.filterValue}
          onSelect={handleSelectEntry} 
          onBack={handleBack}
          onHome={handleHome}
          onFilterByRarity={handleFilterByRarity}
        />
      )}

      {currentState.screen === 'DETAIL' && currentState.entry && (
        <EntryDetail 
          entry={currentState.entry}
          onBack={handleBack}
          onHome={handleHome}
          onSelectRelated={handleSelectEntry}
          onFilterByType={handleFilterByType}
          onFilterByNote={handleFilterByNote}
          onFilterBySoil={handleFilterBySoil}
          onFilterByOrigin={handleFilterByOrigin}
          onFilterByRarity={handleFilterByRarity}
        />
      )}
    </div>
  );
};

export default App;
