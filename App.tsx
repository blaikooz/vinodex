
import React, { Suspense, lazy, useMemo } from 'react';
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import MainMenu from './components/MainMenu';
import EncyclopediaList from './components/EncyclopediaList';
import EntryDetail from './components/EntryDetail';
import RegionMapScreen from './components/RegionMapScreen';
import DeviceLayout from './components/DeviceLayout';
import { WineEntry, EntryCategory, ClimateClass } from './types';
import { getAllEntries } from './src/services/wineData';

const RetroGlobeScreen = lazy(() => import('./components/RetroGlobeScreen'));
const MoonDialScreen = lazy(() => import('./components/MoonDialScreen'));

type FilterMode = 'REGION' | 'TYPE' | 'TASTING' | 'SOIL' | 'ORIGIN' | 'STATE' | 'RARITY' | 'SYSTEM' | 'CLIMATE' | null;

const USA_STATES = ['California', 'New York', 'Oregon', 'Virginia', 'Washington'];

const KNOWN_CATEGORIES: ReadonlySet<EntryCategory> = new Set<EntryCategory>([
  'GRAPES',
  'REGIONS',
  'STYLES',
  'FLAVORS',
  'MASTER_SEARCH',
  'WORLD_SEARCH',
  'COUNTRY_GATE',
  'CONTINENTS',
  'RETRO_GLOBE',
]);

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const allEntries = useMemo(() => getAllEntries(), []);

  const handleHome = () => navigate('/');

  const handleBack = () => {
    if (location.key === 'default') navigate('/');
    else navigate(-1);
  };

  const buildListUrl = (
    category: EntryCategory,
    mode?: FilterMode,
    value?: string | string[] | null,
  ): string => {
    const params = new URLSearchParams();
    if (mode) params.set('filterMode', mode);
    if (value != null) {
      const arr = Array.isArray(value) ? value : [value];
      arr.forEach(v => params.append('filterValue', v));
    }
    const qs = params.toString();
    return `/list/${category}${qs ? `?${qs}` : ''}`;
  };

  const handleNavigateToCategory = (category: EntryCategory) => {
    if (category === 'REGIONS') {
      navigate('/region-map');
    } else if (category === 'RETRO_GLOBE') {
      navigate('/retro-globe');
    } else {
      navigate(`/list/${category}`);
    }
  };

  const handleSelectEntry = (entry: WineEntry) => {
    if (entry.category === 'COUNTRY_GATE') {
      const classification = (entry.details.classification || '').toUpperCase();
      const hasCountryDetail =
        !!entry.details.keyRegions && entry.details.keyRegions.length > 0 && !!entry.description;
      if (classification === 'STATE') {
        if (hasCountryDetail) {
          navigate(`/detail/${entry.id}`);
          return;
        }
        navigate(buildListUrl('REGIONS', 'STATE', entry.name));
        return;
      }

      if (hasCountryDetail) {
        navigate(`/detail/${entry.id}`);
        return;
      }

      if (entry.name.toUpperCase() === 'USA') {
        navigate(buildListUrl('COUNTRY_GATE', 'STATE', USA_STATES));
        return;
      }
      navigate(buildListUrl('REGIONS', 'ORIGIN', entry.name));
      return;
    }
    navigate(`/detail/${entry.id}`);
  };

  const handleContinentSelect = (continent: string) => {
    navigate(`/detail/CONT_${continent}`);
  };

  const handleManualSearch = () => {
    navigate('/list/WORLD_SEARCH');
  };

  const handleFilterByType = (type: string, targetCategory: EntryCategory = 'GRAPES') => {
    navigate(buildListUrl(targetCategory, 'TYPE', type));
  };

  const handleFilterByNote = (
    note: string,
    targetCategory: EntryCategory = 'FLAVORS',
    mode: FilterMode = 'TASTING',
  ) => {
    navigate(buildListUrl(targetCategory, mode, note));
  };

  const handleFilterBySoil = (soil: string) => {
    navigate(buildListUrl('REGIONS', 'SOIL', soil));
  };

  const handleFilterByOrigin = (origin: string) => {
    navigate(buildListUrl('REGIONS', 'ORIGIN', origin));
  };

  const handleViewStates = () => {
    navigate(buildListUrl('COUNTRY_GATE', 'STATE', USA_STATES));
  };

  const handleFilterByRarity = (rarity: string) => {
    if (rarity.toUpperCase() === 'NOBLE') {
      navigate('/detail/S029');
      return;
    }
    navigate(buildListUrl('GRAPES', 'RARITY', rarity));
  };

  const handleFilterByClimate = (climate: ClimateClass) => {
    navigate(buildListUrl('REGIONS', 'CLIMATE', climate));
  };

  const ListRoute: React.FC = () => {
    const { category } = useParams<{ category: string }>();
    const [searchParams] = useSearchParams();
    if (!category || !KNOWN_CATEGORIES.has(category as EntryCategory)) {
      return <Navigate to="/" replace />;
    }
    const mode = (searchParams.get('filterMode') as FilterMode) ?? null;
    const values = searchParams.getAll('filterValue');
    const filterValue: string | string[] | null =
      values.length === 0 ? null : values.length === 1 ? values[0] : values;
    return (
      <EncyclopediaList
        category={category as EntryCategory}
        filterMode={mode}
        filterValue={filterValue}
        initialSearchQuery={searchParams.get('q') ?? ''}
        onSelect={handleSelectEntry}
        onBack={handleBack}
        onHome={handleHome}
        onFilterByRarity={handleFilterByRarity}
        onFilterByType={handleFilterByType}
        onFilterByNote={handleFilterByNote}
        onFilterByOrigin={handleFilterByOrigin}
        onFilterByClimate={handleFilterByClimate}
      />
    );
  };

  const DetailRoute: React.FC = () => {
    const { entryId } = useParams<{ entryId: string }>();
    const entry = useMemo(
      () => allEntries.find(e => e.id === entryId),
      [entryId],
    );
    if (!entry) return <Navigate to="/" replace />;
    return (
      <EntryDetail
        entry={entry}
        allEntries={allEntries}
        onBack={handleBack}
        onHome={handleHome}
        onSelectRelated={handleSelectEntry}
        onFilterByType={handleFilterByType}
        onFilterByNote={handleFilterByNote}
        onFilterBySoil={handleFilterBySoil}
        onFilterByOrigin={handleFilterByOrigin}
        onViewStates={handleViewStates}
        onFilterByRarity={handleFilterByRarity}
        onFilterByClimate={handleFilterByClimate}
      />
    );
  };

  return (
    <div className="antialiased text-gray-900 bg-gray-900 min-h-screen overflow-hidden">
      <Routes>
        <Route
          path="/"
          element={
            <MainMenu
              onNavigate={handleNavigateToCategory}
              onOpenMoonDial={() => navigate('/moon-dial')}
            />
          }
        />
        <Route
          path="/moon-dial"
          element={
            <Suspense
              fallback={
                <DeviceLayout
                  title="MOON DIAL"
                  subtitle="BIODYNAMIC SCAN"
                  showBack={true}
                  onBack={handleBack}
                  onHome={handleHome}
                  centerHeaderText={true}
                >
                  <div className="flex-1 bg-black flex flex-col items-center justify-center gap-4">
                    <div className="w-16 h-16 rounded-full border-2 border-green-400 border-t-transparent animate-spin" />
                    <span className="font-retro text-green-300 tracking-widest text-sm">LOADING MOON DIAL...</span>
                  </div>
                </DeviceLayout>
              }
            >
              <MoonDialScreen onBack={handleBack} onHome={handleHome} />
            </Suspense>
          }
        />
        <Route
          path="/region-map"
          element={
            <RegionMapScreen
              onSelectContinent={handleContinentSelect}
              onSearch={handleManualSearch}
              onBack={handleBack}
              onHome={handleHome}
            />
          }
        />
        <Route
          path="/retro-globe"
          element={
            <Suspense
              fallback={
                <DeviceLayout
                  title="GLOBE SCAN"
                  subtitle="TACTILE VIEW"
                  showBack={true}
                  onBack={handleBack}
                  onHome={handleHome}
                  centerHeaderText={true}
                >
                  <div className="flex-1 bg-black flex flex-col items-center justify-center gap-4">
                    <div className="w-16 h-16 rounded-full border-2 border-green-400 border-t-transparent animate-spin" />
                    <span className="font-retro text-green-300 tracking-widest text-sm">LOADING GLOBE SCAN...</span>
                  </div>
                </DeviceLayout>
              }
            >
              <RetroGlobeScreen
                onBack={handleBack}
                onHome={handleHome}
                onSelectContinent={handleContinentSelect}
                onWorldSearch={handleManualSearch}
              />
            </Suspense>
          }
        />
        <Route path="/list/:category" element={<ListRoute />} />
        <Route path="/detail/:entryId" element={<DetailRoute />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

export default App;
