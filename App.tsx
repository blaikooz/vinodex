
import React, { useState } from 'react';
import MainMenu from './components/MainMenu';
import EncyclopediaList from './components/FoodPairingsScreen';
import EntryDetail from './components/PairingDetail';
import RegionMapScreen from './components/RegionMapScreen';
import { WineEntry, EntryCategory, ClimateClass } from './types';
import { WINE_ENTRIES } from './constants';

type Screen = 'HOME' | 'LIST' | 'DETAIL' | 'REGION_MAP';
type FilterMode = 'REGION' | 'TYPE' | 'TASTING' | 'SOIL' | 'ORIGIN' | 'STATE' | 'RARITY' | 'SYSTEM' | 'CLIMATE' | null;

interface AppState {
  screen: Screen;
  category: EntryCategory;
  entry: WineEntry | null;
  filterMode: FilterMode;
  filterValue: string | string[] | null;
  initialSearchQuery?: string;
}

const INITIAL_STATE: AppState = {
  screen: 'HOME',
  category: 'GRAPES',
  entry: null,
  filterMode: null,
  filterValue: null,
  initialSearchQuery: ''
};

const USA_STATES = ['New York', 'California', 'Oregon', 'Washington'];

const App: React.FC = () => {
  // Use a stack for history
  const [history, setHistory] = useState<AppState[]>([INITIAL_STATE]);
  
  const currentState = history[history.length - 1];

  // Helper to push new state
  const pushState = (newState: Partial<AppState>) => {
      setHistory(prev => [...prev, { ...prev[prev.length - 1], initialSearchQuery: '', ...newState }]);
  };

  // Helper to replace current state (for simple tab switches if needed, though mostly we push)
  const replaceState = (newState: Partial<AppState>) => {
      setHistory(prev => [...prev.slice(0, -1), { ...prev[prev.length - 1], initialSearchQuery: '', ...newState }]);
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
    if (entry.category === 'COUNTRY_GATE') {
      const classification = (entry.details.classification || '').toUpperCase();
      if (classification === 'STATE') {
        pushState({ screen: 'LIST', category: 'REGIONS', filterMode: 'STATE', filterValue: entry.name, entry: null });
        return;
      }

      const hasCountryDetail = entry.details.keyRegions && entry.details.keyRegions.length > 0 && entry.description;
      if (hasCountryDetail && classification !== 'STATE') {
        pushState({ screen: 'DETAIL', entry });
        return;
      }

      if (entry.name.toUpperCase() === 'USA') {
        pushState({ screen: 'LIST', category: 'COUNTRY_GATE', filterMode: 'STATE', filterValue: USA_STATES, entry: null });
        return;
      }
      pushState({ screen: 'LIST', category: 'REGIONS', filterMode: 'ORIGIN', filterValue: entry.name, entry: null });
      return;
    }
    pushState({ screen: 'DETAIL', entry });
  };

  // --- Deep Linking Handlers ---

  // 1. Region Map Selection
  const handleContinentSelect = (continent: string) => {
      const continentEntry = WINE_ENTRIES.find(entry => entry.id === `CONT_${continent}`);
      if (continentEntry) {
          pushState({ screen: 'DETAIL', entry: continentEntry });
      }
  };

  // 2. Manual Search
  const handleManualSearch = () => {
      pushState({
        screen: 'LIST',
        category: 'WORLD_SEARCH',
        filterMode: null,
        filterValue: null,
        initialSearchQuery: '',
      });
  };

  // 3. Filter by Wine Type (from Detail Screen)
  const handleFilterByType = (type: string, targetCategory: EntryCategory = 'GRAPES') => {
      pushState({ screen: 'LIST', category: targetCategory, filterMode: 'TYPE', filterValue: type });
  };

  // 4. Filter by Tasting Note (from Detail Screen)
  const handleFilterByNote = (
    note: string,
    targetCategory: EntryCategory = 'FLAVORS',
    mode: FilterMode = 'TASTING'
  ) => {
      pushState({ screen: 'LIST', category: targetCategory, filterMode: mode, filterValue: note });
  };

  // 5. Filter by Soil Type
  const handleFilterBySoil = (soil: string) => {
      pushState({ screen: 'LIST', category: 'REGIONS', filterMode: 'SOIL', filterValue: soil });
  };

  // 6. Filter by Origin
  const handleFilterByOrigin = (origin: string) => {
      // Route origin filters to regions list so we don't trigger the deductive scan screen.
      pushState({ screen: 'LIST', category: 'REGIONS', filterMode: 'ORIGIN', filterValue: origin });
  };

  // 7. Filter by Rarity
  const handleFilterByRarity = (rarity: string) => {
      const isNoble = rarity.toUpperCase() === 'NOBLE';
      if (isNoble) {
          const nobleEntry = WINE_ENTRIES.find(entry => entry.id === 'S029');
          if (nobleEntry) {
              pushState({ screen: 'DETAIL', entry: nobleEntry });
              return;
          }
      }
      // Keep rarity filtering within grapes to avoid redirecting into deductive scan.
      pushState({ screen: 'LIST', category: 'GRAPES', filterMode: 'RARITY', filterValue: rarity });
  };

  // 8. Filter by Climate
  const handleFilterByClimate = (climate: ClimateClass) => {
      pushState({ screen: 'LIST', category: 'REGIONS', filterMode: 'CLIMATE', filterValue: climate });
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
          onFilterByType={handleFilterByType}
          onFilterByNote={handleFilterByNote}
          onFilterByOrigin={handleFilterByOrigin}
          onFilterByClimate={handleFilterByClimate}
          initialSearchQuery={currentState.initialSearchQuery}
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
          onFilterByClimate={handleFilterByClimate}
        />
      )}
    </div>
  );
};

export default App;
