
import React, { Suspense, lazy, useEffect, useMemo } from 'react';
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
import SplashScreen from './components/SplashScreen';
import { PortalHome, OurAppsList, UnlockVinodex, WhoWeAre, ContactUs } from './components/WebsitePortal';
import EncyclopediaList from './components/EncyclopediaList';
import EntryDetail from './components/EntryDetail';
import RegionMapScreen from './components/RegionMapScreen';
import DeviceLayout from './components/DeviceLayout';
import { WineEntry, EntryCategory } from '@/shared/types';
import { getAllEntries } from './src/services/wineData';
import { clear as clearScreenState } from './src/services/screenState';
import { SETTINGS_SECTIONS, SettingsSectionId } from './components/SettingsPanel';
import { installGlobalTapSound } from './src/services/sound';

const RetroGlobeScreen = lazy(() => import('./components/RetroGlobeScreen'));
const MoonDialScreen = lazy(() => import('./components/MoonDialScreen'));
const MinigamesScreen = lazy(() => import('./components/MinigamesScreen'));
const DailyGrapeScreen = lazy(() => import('./components/DailyGrapeScreen'));
const ScannerScreen = lazy(() => import('./components/ScannerScreen'));
const ChipFilterScreen = lazy(() => import('./components/ChipFilterScreen'));
const TastingQuizScreen = lazy(() => import('./components/TastingQuizScreen'));
const PassportScreen = lazy(() => import('./components/PassportScreen'));
const WalkthroughScreen = lazy(() => import('./components/WalkthroughScreen'));
const BookmarksScreen = lazy(() => import('./components/BookmarksScreen'));
const SettingsGrid = lazy(() => import('./components/SettingsPanel'));
const SettingsSectionPanel = lazy(() =>
  import('./components/SettingsPanel').then(m => ({ default: m.SettingsSectionPanel })),
);

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

/**
 * Suspense fallback for the lazily loaded screens. The chassis stays put and
 * only the LCD shows the spinner, so a load does not flash the device away —
 * same shape as the hand-rolled fallbacks the globe and moon dial already used.
 */
const ScreenLoading: React.FC<{ label: string; onBack: () => void; onHome: () => void }> = ({
  label,
  onBack,
  onHome,
}) => (
  <DeviceLayout title={label.replace('LOADING ', '').replace('...', '')} subtitle="" showBack={true} onBack={onBack} onHome={onHome} centerHeaderText={true}>
    <div className="flex-1 bg-black flex flex-col items-center justify-center gap-4">
      <div className="w-16 h-16 rounded-full border-2 border-green-400 border-t-transparent animate-spin" />
      <span className="font-retro text-green-300 tracking-widest text-sm">{label}</span>
    </div>
  </DeviceLayout>
);

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const allEntries = useMemo(() => getAllEntries(), []);

  // Opt-in SFX: one global listener rides a tap onto every button click.
  useEffect(() => { installGlobalTapSound(); }, []);

  // Home is an in-app control, so it lands on the dex menu — never the splash.
  // The splash is where a fresh visit starts, not a screen to bounce back to.
  //
  // Home is also the reset: it drops every stored scroll position, so
  // re-entering a country from the menu opens at the top. Back deliberately
  // does not clear — restoring on Back is the point — and the splash does not
  // clear on the way in or out either.
  const handleHome = () => {
    clearScreenState();
    navigate('/dex');
  };

  // `location.key === 'default'` means there is no history to pop — a deep link
  // opened cold. Back then falls back to the dex menu for the same reason Home
  // does: the user is inside the app, and dropping them on the splash would
  // make them click DEX to get back to where Back should have taken them.
  const handleBack = () => {
    if (location.key === 'default') navigate('/dex');
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
      // REGIONS opens the globe, matching iOS — the 2D region map is no longer
      // the way in. `/region-map` keeps its route for existing links.
      navigate('/retro-globe');
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

  const ListRoute: React.FC = () => {
    const { category } = useParams<{ category: string }>();
    const [searchParams] = useSearchParams();
    // An unknown category is a stale in-app link, so it falls back to the dex
    // menu rather than the splash — see the catch-all route for the difference.
    if (!category || !KNOWN_CATEGORIES.has(category as EntryCategory)) {
      return <Navigate to="/dex" replace />;
    }
    const mode = (searchParams.get('filterMode') as FilterMode) ?? null;
    const values = searchParams.getAll('filterValue');
    const firstValue = values[0];
    const filterValue: string | string[] | null =
      values.length === 0 || firstValue === undefined ? null : values.length === 1 ? firstValue : values;
    return (
      <EncyclopediaList
        category={category as EntryCategory}
        filterMode={mode}
        filterValue={filterValue}
        initialSearchQuery={searchParams.get('q') ?? ''}
        onSelect={handleSelectEntry}
        onBack={handleBack}
        onHome={handleHome}
      />
    );
  };

  const SettingsSectionRoute: React.FC = () => {
    const { section } = useParams<{ section: string }>();
    const known = SETTINGS_SECTIONS.some(s => s.id === section);
    if (!known) return <Navigate to="/settings" replace />;
    return (
      <Suspense fallback={<ScreenLoading label="LOADING..." onBack={handleBack} onHome={handleHome} />}>
        <SettingsSectionPanel
          section={section as SettingsSectionId}
          allEntries={allEntries}
          onBack={handleBack}
          onHome={handleHome}
        />
      </Suspense>
    );
  };

  const DetailRoute: React.FC = () => {
    const { entryId } = useParams<{ entryId: string }>();
    const entry = useMemo(
      () => allEntries.find(e => e.id === entryId),
      [entryId],
    );
    if (!entry) return <Navigate to="/dex" replace />;
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
      />
    );
  };

  return (
    <div className="antialiased text-gray-900 bg-gray-900 min-h-screen overflow-hidden">
      <Routes>
        {/*
          "/" is the splash: a fresh visit forks between the dex and the
          coming-soon website. The dex menu, which used to live here, is at
          "/dex" — a real route, so browser Back from it reaches the splash.
        */}
        <Route
          path="/"
          element={
            <SplashScreen
              onEnterDex={() => navigate('/dex')}
              onEnterWebsite={() => navigate('/website')}
            />
          }
        />

        {/* The WEBSITE fork — the company portal. Mirrors the dex's look; its
            screens hide the in-app chassis buttons and offer Back instead. */}
        <Route
          path="/website"
          element={
            <PortalHome
              onBack={handleBack}
              onOpenApps={() => navigate('/website/apps')}
              onWhoWeAre={() => navigate('/website/who-we-are')}
              onContactUs={() => navigate('/website/contact')}
              onData={() => navigate('/settings/DATA')}
            />
          }
        />
        <Route
          path="/website/apps"
          element={<OurAppsList onBack={handleBack} onSelectVinodex={() => navigate('/website/unlock')} />}
        />
        <Route
          path="/website/unlock"
          element={<UnlockVinodex onBack={handleBack} onUnlocked={() => navigate('/dex')} />}
        />
        <Route path="/website/who-we-are" element={<WhoWeAre onBack={handleBack} />} />
        <Route path="/website/contact" element={<ContactUs onBack={handleBack} />} />

        <Route
          path="/dex"
          element={
            <MainMenu onNavigate={handleNavigateToCategory} />
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
        {/* Ported from the iOS app — see MinigamesScreen. The moon dial keeps
            its own top-level path so existing links still work; the hub simply
            links to it. */}
        <Route
          path="/minigames"
          element={
            <Suspense fallback={<ScreenLoading label="LOADING TOOLS..." onBack={handleBack} onHome={handleHome} />}>
              <MinigamesScreen
                onScanner={() => navigate('/scanner')}
                onChipFilter={() => navigate('/chip-filter')}
                onQuiz={() => navigate('/quiz')}
                onDailyChallenge={() => navigate('/daily-challenge')}
                onDailyGrape={() => navigate('/daily')}
                onMoonDial={() => navigate('/moon-dial')}
                onBack={handleBack}
                onHome={handleHome}
              />
            </Suspense>
          }
        />
        <Route
          path="/chip-filter"
          element={
            <Suspense fallback={<ScreenLoading label="LOADING FILTER..." onBack={handleBack} onHome={handleHome} />}>
              <ChipFilterScreen
                allEntries={allEntries}
                onSelect={handleSelectEntry}
                onSelectCountry={name => navigate(buildListUrl('REGIONS', 'ORIGIN', name))}
                onBack={handleBack}
                onHome={handleHome}
              />
            </Suspense>
          }
        />
        <Route
          path="/quiz"
          element={
            <Suspense fallback={<ScreenLoading label="LOADING EXAM..." onBack={handleBack} onHome={handleHome} />}>
              <TastingQuizScreen mode="practice" allEntries={allEntries} onOpen={handleSelectEntry} onBack={handleBack} onHome={handleHome} />
            </Suspense>
          }
        />
        <Route
          path="/daily-challenge"
          element={
            <Suspense fallback={<ScreenLoading label="LOADING CHALLENGE..." onBack={handleBack} onHome={handleHome} />}>
              <TastingQuizScreen mode="daily" allEntries={allEntries} onOpen={handleSelectEntry} onBack={handleBack} onHome={handleHome} />
            </Suspense>
          }
        />
        <Route
          path="/passport"
          element={
            <Suspense fallback={<ScreenLoading label="LOADING PASSPORT..." onBack={handleBack} onHome={handleHome} />}>
              <PassportScreen allEntries={allEntries} onBack={handleBack} onHome={handleHome} />
            </Suspense>
          }
        />
        <Route
          path="/walkthrough"
          element={
            <Suspense fallback={<ScreenLoading label="LOADING TUTORIAL..." onBack={handleBack} onHome={handleHome} />}>
              <WalkthroughScreen onBack={handleBack} onHome={handleHome} />
            </Suspense>
          }
        />
        <Route
          path="/daily"
          element={
            <Suspense fallback={<ScreenLoading label="LOADING REVEAL..." onBack={handleBack} onHome={handleHome} />}>
              <DailyGrapeScreen
                allEntries={allEntries}
                onOpen={handleSelectEntry}
                onBack={handleBack}
                onHome={handleHome}
              />
            </Suspense>
          }
        />
        <Route
          path="/scanner"
          element={
            <Suspense fallback={<ScreenLoading label="LOADING SCANNER..." onBack={handleBack} onHome={handleHome} />}>
              <ScannerScreen
                allEntries={allEntries}
                onOpen={handleSelectEntry}
                onBack={handleBack}
                onHome={handleHome}
              />
            </Suspense>
          }
        />
        <Route
          path="/saved"
          element={
            <Suspense fallback={<ScreenLoading label="LOADING SAVED..." onBack={handleBack} onHome={handleHome} />}>
              <BookmarksScreen
                allEntries={allEntries}
                onSelect={handleSelectEntry}
                onPassport={() => navigate('/passport')}
                onBack={handleBack}
                onHome={handleHome}
              />
            </Suspense>
          }
        />
        <Route
          path="/settings"
          element={
            <Suspense fallback={<ScreenLoading label="LOADING SYSTEM..." onBack={handleBack} onHome={handleHome} />}>
              <SettingsGrid
                onSection={id => navigate(`/settings/${id}`)}
                onMinigames={() => navigate('/minigames')}
                onWalkthrough={() => navigate('/walkthrough')}
                // Leaving the app clears screen state for the same reason Home
                // does — re-entering the dex should not resume mid-page.
                onExitToSplash={() => {
                  clearScreenState();
                  navigate('/');
                }}
                onBack={handleBack}
                onHome={handleHome}
              />
            </Suspense>
          }
        />
        <Route path="/settings/:section" element={<SettingsSectionRoute />} />
        <Route path="/list/:category" element={<ListRoute />} />
        <Route path="/detail/:entryId" element={<DetailRoute />} />
        {/* A URL that matches nothing is an outside arrival, so it lands on the
            splash — unlike the in-app fallbacks above, which go to "/dex". */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

export default App;
