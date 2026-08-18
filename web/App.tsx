
import React, { Suspense, lazy, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
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
import { PortalHome, OurAppsList, ProjectSplash, UnlockVinodex, WhoWeAre, ContactUs, getProject } from './components/WebsitePortal';
import EncyclopediaList from './components/EncyclopediaList';
import EntryDetail from './components/EntryDetail';
import RegionMapScreen from './components/RegionMapScreen';
import DeviceLayout from './components/DeviceLayout';
import InstallBanner from './components/InstallBanner';
import VinodexBoot from './components/VinodexBoot';
import { WineEntry, EntryCategory } from '@/shared/types';
import { getAllEntries } from './src/services/wineData';
import { clear as clearScreenState } from './src/services/screenState';
import { SETTINGS_SECTIONS, SettingsSectionId } from './components/SettingsPanel';
import { installGlobalTapSound } from './src/services/sound';
import { installGlobalHaptics } from './src/services/haptics';
import { demoStopAt, isDemoActive, stopDemo, subscribeToDemo } from './src/services/demoMode';
import { applyLeftMainScreen } from './src/services/marqueeScript';
import { clearVino, fireVinoForArrival, setSuspended, subscribeToVino, vinoQueueIsEmpty } from './src/services/vinoPresenter';
import { hasFired, isVinoSilenced, seedTriggers } from './src/services/firstTimeTriggers';
import { seenBadges } from './src/services/passportProgress';
import { computePassport } from './src/services/passport';
import { shelfIds, bookmarkCount } from './src/services/bookmarks';
import { bestStreak } from './src/services/dailyChallenge';
import { highestUnlocked } from './src/services/quiz';
import {
  coachmarkActionForArrival,
  coachmarkShouldAutoStart,
  reportCoachmark,
  seedCoachmarks,
  startCoachmarks,
} from './src/services/coachmarks';
import VinoBubble from './components/VinoBubble';
import VinoIntroCard from './components/VinoIntroCard';
import CoachmarkOverlay from './components/CoachmarkOverlay';
import { IDLE_ACTIVITY_EVENTS, IDLE_SCREENSAVER_SECONDS } from './src/services/screensaver';
import ScreensaverOverlay from './components/ScreensaverOverlay';

const RetroGlobeScreen = lazy(() => import('./components/RetroGlobeScreen'));
const MoonDialScreen = lazy(() => import('./components/MoonDialScreen'));
const MinigamesScreen = lazy(() => import('./components/MinigamesScreen'));
const ScannerScreen = lazy(() => import('./components/ScannerScreen'));
const ChipFilterScreen = lazy(() => import('./components/ChipFilterScreen'));
const TastingQuizScreen = lazy(() => import('./components/TastingQuizScreen'));
const WineExamScreen = lazy(() => import('./components/WineExamScreen'));
const FirmwareHistoryScreen = lazy(() => import('./components/FirmwareHistoryScreen'));
const RecommendationsScreen = lazy(() => import('./components/RecommendationsScreen'));
const SupportScreen = lazy(() => import('./components/SupportScreen'));
const CheatConsoleScreen = lazy(() => import('./components/CheatConsoleScreen'));
const GrapeLineageScreen = lazy(() => import('./components/GrapeLineageScreen'));
const ProfVinoScreen = lazy(() => import('./components/ProfVinoScreen'));
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
const ScreenLoading: React.FC<{ label: string; subtitle?: string; onBack: () => void; onHome: () => void }> = ({
  label,
  subtitle = '',
  onBack,
  onHome,
}) => (
  <DeviceLayout title={label.replace('LOADING ', '').replace('...', '')} subtitle={subtitle} showBack={true} onBack={onBack} onHome={onHome} centerHeaderText={true}>
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

  // The BIOS boot: once per browser session, and skipped on a deep-link arrival
  // (/detail, /website) so a shared-link visitor plays instantly. Any tap or the
  // auto-advance clears it.
  const [booting, setBooting] = useState(() => {
    try {
      const p = window.location.pathname;
      const fresh = !window.sessionStorage.getItem('booted');
      return fresh && !p.startsWith('/detail/') && !p.startsWith('/website');
    } catch {
      return false;
    }
  });
  const finishBoot = () => {
    try { window.sessionStorage.setItem('booted', '1'); } catch { /* ignore */ }
    setBooting(false);
  };
  // While the boot screen owns the device, the professor holds his tongue —
  // the same suspension seam the in-screen prompts claim.
  useEffect(() => { setSuspended(booting, 'boot'); }, [booting]);

  // One global listener each rides a tap sound (opt-in) and a haptic
  // (default on) onto every button click.
  useEffect(() => { installGlobalTapSound(); installGlobalHaptics(); }, []);

  // The attract loop (v6#30): while DEMO MODE is on, walk the tour's stops on
  // their own dwells; the first human touch ends it where it stands — a demo
  // that fights the person who just picked the device up has failed at the
  // one moment it exists for.
  const demoActive = useSyncExternalStore(subscribeToDemo, isDemoActive, () => false);
  const demoCounter = useRef(0);
  useEffect(() => {
    if (!demoActive) return;
    // Every START DEMO leads with the four spec-named stops (review I5) —
    // a second run in one session must not resume mid-tour.
    demoCounter.current = 0;
    let timer: ReturnType<typeof setTimeout>;
    const step = () => {
      const stop = demoStopAt(demoCounter.current);
      demoCounter.current += 1;
      navigate(stop.path);
      timer = setTimeout(step, stop.dwell * 1000);
    };
    const interrupt = () => stopDemo();
    window.addEventListener('pointerdown', interrupt, true);
    window.addEventListener('keydown', interrupt, true);
    step();
    return () => {
      clearTimeout(timer);
      window.removeEventListener('pointerdown', interrupt, true);
      window.removeEventListener('keydown', interrupt, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demoActive]);

  // The screensaver (v6#33): one authored threshold (60 s, iOS 0.8.0 H).
  // Any activity resets the clock; raising it while the demo loop runs would
  // kill the attract loop's point, so the demo suppresses it.
  const [saverUp, setSaverUp] = React.useState(false);
  useEffect(() => {
    if (demoActive) {
      setSaverUp(false);
      return;
    }
    let last = Date.now();
    const activity = () => {
      last = Date.now();
      setSaverUp(false);
    };
    const events = IDLE_ACTIVITY_EVENTS;
    events.forEach(e => window.addEventListener(e, activity, { capture: true, passive: true }));
    const poll = setInterval(() => {
      if (Date.now() - last >= IDLE_SCREENSAVER_SECONDS * 1000) setSaverUp(true);
    }, 1000);
    return () => {
      events.forEach(e => window.removeEventListener(e, activity, { capture: true }));
      clearInterval(poll);
    };
  }, [demoActive]);

  // Professor Vino + the coachmarks (v6#23/#26). Seed both ledgers once per
  // launch — the three history-derived triggers for an existing shelf, and
  // the walkthrough's auto-start for anyone who is plainly not new. Counts
  // are catalog-resolved (review M4).
  const [introDone, setIntroDone] = React.useState(false);
  // A change signal for the effect below: when his last bubble is dismissed
  // the walkthrough becomes startable.
  const vinoIdle = useSyncExternalStore(subscribeToVino, vinoQueueIsEmpty, () => true);
  useEffect(() => {
    const passport = computePassport(shelfIds('tried'), allEntries, bestStreak(), highestUnlocked());
    seedTriggers(passport.triedTotal, seenBadges().size > 0);
    seedCoachmarks(passport.triedTotal > 0 || bookmarkCount() > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The route watcher: leaving the main screen parks the marquee script
  // (review L3 — teardown is not navigation, this is), a navigation drops any
  // bubble about the screen just left, and an arrival owes its first-time
  // lines and its coachmark action.
  const prevPath = useRef(location.pathname);
  useEffect(() => {
    const path = location.pathname;
    if (prevPath.current === '/dex' && path !== '/dex') applyLeftMainScreen();
    if (prevPath.current !== path) clearVino();
    prevPath.current = path;

    const entry = path.startsWith('/detail/')
      ? allEntries.find(e => e.id === path.slice('/detail/'.length)) ?? null
      : null;
    fireVinoForArrival(path, entry);
    const action = coachmarkActionForArrival(path);
    if (action) reportCoachmark(action);

    // The walkthrough's own auto-start: once, on the main menu, after the
    // intro card has had its turn (iOS runs it after the BIOS; the pending
    // bundle's boot host slots ahead of both via the suspension seam).
    // Deliberately gated on his queue being empty as well. The intro card
    // queues the after-name line on its way out, and the spotlight suspends
    // the queue while it runs — so auto-starting here would hold "Pleasure,
    // {name}." behind the whole tutorial. The line is the one that tells the
    // player what he is *for*, and every later line assumes it. Caught by the
    // first-run smoke test, which is what the smoke test is for.
    if (
      path === '/dex' &&
      coachmarkShouldAutoStart() &&
      vinoQueueIsEmpty() &&
      (hasFired('firstLaunch') || isVinoSilenced())
    ) {
      startCoachmarks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, introDone, vinoIdle]);

  const showIntroCard =
    location.pathname === '/dex' && !hasFired('firstLaunch') && !isVinoSilenced() && !introDone && !demoActive;

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
    } else if (category === 'MASTER_SEARCH') {
      // The orb opens MASTER SEARCH, which *is* the chip-filter screen —
      // iOS 0.7.0 (I1) retired the plain master-search list into it
      // (`MainMenuScreen.swift:415` → `.chipFilter`). `/list/MASTER_SEARCH`
      // stays routable for existing links (v6#11).
      navigate('/chip-filter');
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

  const LineageRoute: React.FC = () => {
    const { entryId } = useParams<{ entryId: string }>();
    const entry = allEntries.find(e => e.id === entryId);
    if (!entry || entry.category !== 'GRAPES') return <Navigate to="/dex" replace />;
    return (
      <Suspense fallback={<ScreenLoading label="LOADING LINEAGE..." onBack={handleBack} onHome={handleHome} />}>
        <GrapeLineageScreen
          entry={entry}
          allEntries={allEntries}
          onFocus={e => navigate(`/lineage/${e.id}`)}
          onOpenEntry={e => navigate(`/detail/${e.id}`)}
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
        onLineage={e => navigate(`/lineage/${e.id}`)}
      />
    );
  };

  // The in-app splash for a Substack project. An unknown id is a stale link, so
  // it falls back to the OUR WORK list rather than the top-level splash.
  const ProjectRoute: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const project = getProject(id);
    if (!project) return <Navigate to="/website/apps" replace />;
    return <ProjectSplash project={project} onBack={handleBack} onHome={() => navigate('/website')} onUnlock={() => navigate('/website/unlock')} />;
  };

  return (
    <div className="antialiased text-gray-900 bg-gray-900 min-h-screen overflow-hidden">
      {saverUp && <ScreensaverOverlay onDismiss={() => setSaverUp(false)} />}
      {showIntroCard && (
        <VinoIntroCard
          onDone={() => {
            setIntroDone(true);
            // Not started here: his after-name line is queued at this exact
            // moment, and the route effect starts the tour once it is read.
          }}
        />
      )}
      <CoachmarkOverlay />
      <VinoBubble />
      <InstallBanner />
      {booting && <VinodexBoot entries={allEntries.length} onDone={finishBoot} />}
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
              onHome={() => navigate('/website')}
              onOpenApps={() => navigate('/website/apps')}
              onWhoWeAre={() => navigate('/website/who-we-are')}
              onContactUs={() => navigate('/website/contact')}
              onData={() => navigate('/settings/DATA')}
            />
          }
        />
        <Route
          path="/website/apps"
          element={
            <OurAppsList
              onBack={handleBack}
              onHome={() => navigate('/website')}
              onSelectProject={id => navigate(`/website/project/${id}`)}
            />
          }
        />
        <Route path="/website/project/:id" element={<ProjectRoute />} />
        <Route
          path="/website/unlock"
          element={<UnlockVinodex onBack={handleBack} onHome={() => navigate('/website')} onUnlocked={() => navigate('/dex')} />}
        />
        <Route path="/website/who-we-are" element={<WhoWeAre onBack={handleBack} onHome={() => navigate('/website')} />} />
        <Route path="/website/contact" element={<ContactUs onBack={handleBack} onHome={() => navigate('/website')} />} />

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
              fallback={<ScreenLoading label="LOADING MOON DIAL..." subtitle="BIODYNAMIC SCAN" onBack={handleBack} onHome={handleHome} />}
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
              fallback={<ScreenLoading label="LOADING GLOBE SCAN..." subtitle="TACTILE VIEW" onBack={handleBack} onHome={handleHome} />}
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
                onProfVino={() => navigate('/prof-vino')}
                onQuiz={() => navigate('/quiz')}
                onDailyChallenge={() => navigate('/daily-challenge')}
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
        {/* The WINE EXAM runs on the shared 420-question bank (v6#8); the
            daily challenge keeps the generated quiz — a daily must never
            contradict an entry, and a generated question can't. */}
        <Route
          path="/quiz"
          element={
            <Suspense fallback={<ScreenLoading label="LOADING EXAM..." onBack={handleBack} onHome={handleHome} />}>
              <WineExamScreen onBack={handleBack} onHome={handleHome} />
            </Suspense>
          }
        />
        <Route
          path="/daily-challenge"
          element={
            <Suspense fallback={<ScreenLoading label="LOADING CHALLENGE..." onBack={handleBack} onHome={handleHome} />}>
              <TastingQuizScreen allEntries={allEntries} onOpen={handleSelectEntry} onBack={handleBack} onHome={handleHome} />
            </Suspense>
          }
        />
        <Route
          path="/passport"
          element={
            <Suspense fallback={<ScreenLoading label="LOADING PASSPORT..." onBack={handleBack} onHome={handleHome} />}>
              <PassportScreen
                allEntries={allEntries}
                onSelect={handleSelectEntry}
                onShowAllRecommendations={() => navigate('/recommendations')}
                onBack={handleBack}
                onHome={handleHome}
              />
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
                onFirmware={() => navigate('/firmware')}
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
        <Route
          path="/recommendations"
          element={
            <Suspense fallback={<ScreenLoading label="LOADING PICKS..." onBack={handleBack} onHome={handleHome} />}>
              <RecommendationsScreen allEntries={allEntries} onSelect={handleSelectEntry} onBack={handleBack} onHome={handleHome} />
            </Suspense>
          }
        />
        <Route
          path="/support"
          element={
            <Suspense fallback={<ScreenLoading label="LOADING SUPPORT..." onBack={handleBack} onHome={handleHome} />}>
              <SupportScreen onBack={handleBack} onHome={handleHome} />
            </Suspense>
          }
        />
        <Route
          path="/cheats"
          element={
            <Suspense fallback={<ScreenLoading label="LOADING CONSOLE..." onBack={handleBack} onHome={handleHome} />}>
              <CheatConsoleScreen onBack={handleBack} onHome={handleHome} />
            </Suspense>
          }
        />
        <Route
          path="/firmware"
          element={
            <Suspense fallback={<ScreenLoading label="LOADING FIRMWARE..." onBack={handleBack} onHome={handleHome} />}>
              <FirmwareHistoryScreen onBack={handleBack} onHome={handleHome} />
            </Suspense>
          }
        />
        <Route path="/lineage/:entryId" element={<LineageRoute />} />
        <Route
          path="/prof-vino"
          element={
            <Suspense fallback={<ScreenLoading label="LOADING PROFESSOR..." onBack={handleBack} onHome={handleHome} />}>
              <ProfVinoScreen onBack={handleBack} onHome={handleHome} />
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
