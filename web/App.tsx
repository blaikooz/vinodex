
import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
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
import { NotFound, PortalHome, OurAppsList, ProjectSplash, WhoWeAre, ContactUs, PrivacyAndTerms, getProject } from './components/WebsitePortal';
import EncyclopediaList from './components/EncyclopediaList';
import EntryDetail from './components/EntryDetail';
import RegionMapScreen from './components/RegionMapScreen';
import DeviceLayout from './components/DeviceLayout';
import InstallBanner from './components/InstallBanner';
import { VinodexBootProvider } from './components/VinodexBoot';
import { WineEntry, EntryCategory } from '@/shared/types';
import { useCatalogue } from './src/services/useCatalogue';
import { clear as clearScreenState } from './src/services/screenState';
import { SETTINGS_SECTIONS, SettingsSectionId } from './src/services/settingsSections';
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
import { ScreensaverProvider } from './components/ScreensaverOverlay';
import { bootDecision, browserTitle, isDexPath, isSitePath } from './src/services/appRoutes';
import { trackEvent } from './src/services/analytics';
import { variantTag } from './src/services/experiment';
import { IosUpdatesPromptProvider } from './components/IosUpdatesPrompt';

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
const DeviceWorkshopScreen = lazy(() => import('./components/DeviceWorkshopScreen'));
const GrapeLineageScreen = lazy(() => import('./components/GrapeLineageScreen'));
const ProfVinoScreen = lazy(() => import('./components/ProfVinoScreen'));
const PassportScreen = lazy(() => import('./components/PassportScreen'));
const StampCollectionScreen = lazy(() => import('./components/StampCollectionScreen'));
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


/*
 * ---------------------------------------------------------------------------
 * The routed leaf components (W1)
 * ---------------------------------------------------------------------------
 *
 * **These live at module scope, and that is load-bearing.** All five were
 * declared inside `App`'s render body. A component declared there is a new
 * function identity on every render, and React compares element types by
 * identity — so a new identity is a *different component*, and React unmounts
 * the old subtree and mounts a fresh one. The markup is identical either way,
 * which is why five gates and a render smoke suite never saw it.
 *
 * What made it a bug rather than waste: `App` subscribes to the professor's
 * queue, so any line he speaks re-renders `App`. `EntryDetail`'s TRIED handler
 * fires `firstTried` (and `firstStamp` when a badge is earned) and then calls
 * `setCelebrations(queue)` in the same click. React batches those, so the
 * render the professor causes is the render that threw `EntryDetail` away —
 * taking the celebration queue with it. The first passport stamp a player ever
 * earns is the loudest case, and it is the one nobody could reproduce.
 *
 * They take as props exactly the handlers they used to close over. Passing a
 * fresh arrow on each render is fine and is not the same defect: a changed
 * *prop* re-renders a component, a changed *type* replaces it.
 *
 * `web/App.routes.test.tsx` pins the property directly, and
 * `react-hooks/static-components` — which found this on the linter's first run
 * — keeps every future route component honest.
 */

interface RouteChrome {
  onBack: () => void;
  onHome: () => void;
}

/** `/list/:category`. An unknown category is a stale in-app link, so it falls
 *  back to the dex menu rather than to the company site — see the catch-all
 *  route for the difference. */
const ListRoute: React.FC<RouteChrome & { onSelect: (entry: WineEntry) => void }> = ({
  onSelect,
  onBack,
  onHome,
}) => {
  const { category } = useParams<{ category: string }>();
  const [searchParams] = useSearchParams();
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
      onSelect={onSelect}
      onBack={onBack}
      onHome={onHome}
    />
  );
};

/** `/settings/:section`. */
const SettingsSectionRoute: React.FC<RouteChrome & { allEntries: WineEntry[] }> = ({
  allEntries,
  onBack,
  onHome,
}) => {
  const { section } = useParams<{ section: string }>();
  const known = SETTINGS_SECTIONS.some(s => s.id === section);
  if (!known) return <Navigate to="/settings" replace />;
  return (
    <Suspense fallback={<ScreenLoading label="LOADING..." onBack={onBack} onHome={onHome} />}>
      <SettingsSectionPanel
        section={section as SettingsSectionId}
        allEntries={allEntries}
        onBack={onBack}
        onHome={onHome}
      />
    </Suspense>
  );
};

/** `/lineage/:entryId` — grapes only; anything else is a stale link. */
const LineageRoute: React.FC<RouteChrome & {
  allEntries: WineEntry[];
  onFocus: (entry: WineEntry) => void;
  onOpenEntry: (entry: WineEntry) => void;
}> = ({ allEntries, onFocus, onOpenEntry, onBack, onHome }) => {
  const { entryId } = useParams<{ entryId: string }>();
  const entry = allEntries.find(e => e.id === entryId);
  if (!entry || entry.category !== 'GRAPES') return <Navigate to="/dex" replace />;
  return (
    <Suspense fallback={<ScreenLoading label="LOADING LINEAGE..." onBack={onBack} onHome={onHome} />}>
      <GrapeLineageScreen
        entry={entry}
        allEntries={allEntries}
        onFocus={onFocus}
        onOpenEntry={onOpenEntry}
        onBack={onBack}
        onHome={onHome}
      />
    </Suspense>
  );
};

/** `/detail/:entryId` — the entry readout. */
const DetailRoute: React.FC<RouteChrome & {
  allEntries: WineEntry[];
  onSelectRelated: (entry: WineEntry) => void;
  onFilterByType: (type: string, targetCategory?: EntryCategory) => void;
  onFilterByNote: (note: string, targetCategory?: EntryCategory) => void;
  onFilterBySoil: (soil: string) => void;
  onFilterByOrigin: (origin: string) => void;
  onViewStates: () => void;
  onLineage: (entry: WineEntry) => void;
}> = ({
  allEntries,
  onSelectRelated,
  onFilterByType,
  onFilterByNote,
  onFilterBySoil,
  onFilterByOrigin,
  onViewStates,
  onLineage,
  onBack,
  onHome,
}) => {
  const { entryId } = useParams<{ entryId: string }>();
  // `allEntries` is in the deps now that it is a prop rather than a closure
  // capture. It is `getAllEntries()`, which is module-cached and therefore
  // referentially stable, so this costs nothing and stops the memo lying.
  const entry = useMemo(
    () => allEntries.find(e => e.id === entryId),
    [allEntries, entryId],
  );
  if (!entry) return <Navigate to="/dex" replace />;
  return (
    <EntryDetail
      entry={entry}
      allEntries={allEntries}
      onBack={onBack}
      onHome={onHome}
      onSelectRelated={onSelectRelated}
      onFilterByType={onFilterByType}
      onFilterByNote={onFilterByNote}
      onFilterBySoil={onFilterBySoil}
      onFilterByOrigin={onFilterByOrigin}
      onViewStates={onViewStates}
      onLineage={onLineage}
    />
  );
};

/** `/project/:id` — the in-app splash for one of the studio's projects. An
 *  unknown id is a stale link, so it falls back to the OUR WORK list rather
 *  than to the site's front page. */
const ProjectRoute: React.FC<RouteChrome & { onOpenApp: () => void }> = ({ onBack, onHome, onOpenApp }) => {
  const { id } = useParams<{ id: string }>();
  const project = getProject(id);
  if (!project) return <Navigate to="/apps" replace />;
  return <ProjectSplash project={project} onBack={onBack} onHome={onHome} onOpenApp={onOpenApp} />;
};

/**
 * The v0.2.x `/website/*` URLs, kept alive (v8#1).
 *
 * The portal moved up to `/`, and **nothing already linked, bookmarked or
 * shared may break** — so every old spelling still resolves, by redirect,
 * to wherever its screen went. `:id` is carried across rather than dropped,
 * which a flat `<Navigate to="/apps">` would have done silently.
 *
 * `replace` on all of them: a redirect that pushed would put the dead URL in
 * the history, so Back would bounce off it forever.
 */
const LegacyProjectRedirect: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/project/${id ?? ''}`} replace />;
};


/** A referentially stable empty catalogue for the site side of the fork. */
const NO_ENTRIES: WineEntry[] = [];

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // The catalogue is its own chunk (v0.6.31): `null` until it lands, and the
  // dex routes below are held back until then. The site never waits for it.
  const onDexPath = isDexPath(location.pathname);
  const catalogue = useCatalogue(onDexPath);
  const allEntries = catalogue ?? NO_ENTRIES;

  useEffect(() => {
    document.title = browserTitle(location.pathname);
  }, [location.pathname]);

  /*
   * The BIOS boot (v8#2).
   *
   * **The premise inverted in v0.3.0.** It used to be a once-per-browser-
   * session event keyed on a `sessionStorage 'booted'` flag, fired on arrival
   * and suppressed for `/detail/` and `/website`. That made sense while `/`
   * was a fork: booting was something that happened to you when you showed up.
   *
   * Now the site is the landing and Vinodex is an app you open from inside it,
   * so the boot is not about the session at all — **it is what happens when you
   * open the app**. Every entry into the dex boots; nothing on the site ever
   * does; navigation inside the dex never re-boots. Two trips in and out in one
   * page-load boot twice, which is the point. The flag is gone, not defaulted:
   * there is no longer a fact for it to remember.
   *
   * `bootDecision` holds the whole rule, including the one deep-link
   * exception and its reasoning — see `appRoutes.ts`.
   */
  const [booting, setBooting] = useState(() => bootDecision(null, location.pathname));
  // The path the last decision was made against. `null` until the first effect
  // runs, which is how the mount case tells itself apart from a navigation —
  // and why StrictMode's double-invoke cannot fire a second boot: the second
  // pass sees `from === to`, and a dex-to-dex move never boots.
  const bootFrom = useRef<string | null>(null);
  useEffect(() => {
    const from = bootFrom.current;
    bootFrom.current = location.pathname;
    // The mount decision was made in `useState` above, with `from = null`.
    if (from === null || from === location.pathname) return;
    const boots = bootDecision(from, location.pathname);
    // Moving around inside the dex never re-boots and never cancels one.
    if (!boots && isDexPath(location.pathname)) return;
    // Entering the dex boots; and the inverse (v0.6.19): a boot belongs to
    // the dex, so leaving it cancels one still running. Without the second
    // half, Back or Home pressed during the POST carried `booting` onto the
    // site, and the BIOS -- which `bootDecision` says never plays there --
    // sat on the studio's front page until somebody tapped it away.
    setBooting(boots);
  }, [location.pathname]);
  const finishBoot = useCallback(() => setBooting(false), []);
  // While the boot screen owns the device, the professor holds his tongue —
  // the same suspension seam the in-screen prompts claim.
  useEffect(() => { setSuspended(booting, 'boot'); }, [booting]);

  // The funnel's two app-side stages (v0.6.1), riding facts the app already
  // computes rather than re-deriving them: the landing is `/` (the site IS the
  // landing, v8#1), and "someone opened Vinodex" is precisely what `booting`
  // going true means — `bootDecision` already answers cold launches, site->dex
  // crossings and the share-page exception, so no second classifier here.
  // Both are no-ops outside real deployments; see `analytics.ts`.
  useEffect(() => {
    // Exposure carries the drawn copy variant (v0.6.51), so substack-tap
    // per landing-view can be read per wording.
    if (location.pathname === '/') trackEvent('landing-view', { variant: variantTag('landing-nudge') });
  }, [location.pathname]);
  useEffect(() => {
    if (booting) trackEvent('open-app');
  }, [booting]);

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
  //
  // **Dex only (v8#5).** A screensaver is the device idling, and on the site
  // the device is a thing on a desk that a visitor is reading *around* — a
  // bouncing mark taking over the studio's front page after a minute is the
  // app's behaviour appearing on a page that is not the app. It is also the
  // exact class of leak the separation rule exists to stop, arriving through
  // the shared chassis rather than through an import.
  //
  // The marquee's idle clock is the other half of the unified reckoning
  // (v0.2.0, review L4) and needs nothing here: `useMarqueeScript` arms its
  // timers only on the main menu, so it has never run on the site, and the
  // site's panel is now a constant (v8#8) rather than a script.
  const [saverUp, setSaverUp] = React.useState(false);
  const inDex = isDexPath(location.pathname);
  useEffect(() => {
    if (demoActive || !inDex || booting) {
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
  }, [booting, demoActive, inDex]);

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
    // A shared entry link arrives before the catalogue chunk (v0.6.31). The
    // arrival owes its grape line, so it waits for the tables rather than
    // firing with no entry -- the LCD is a spinner until then anyway, and the
    // bookkeeping below runs once, when the screen is really there.
    if (path.startsWith('/detail/') && !catalogue) return;
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
    // `!booting` as well: the BIOS owns the device while it runs, and both
    // of these draw above it (z-80/z-85 against the boot's z-70). Without it a
    // genuinely fresh visitor meets the name prompt with the POST hidden
    // behind it, and a returning-but-untoured player gets the spotlight
    // painted over the boot. The presenter is already suspended under 'boot';
    // this is the same rule for the two hosts that do not read that seam.
    if (
      path === '/dex' &&
      !booting &&
      coachmarkShouldAutoStart() &&
      vinoQueueIsEmpty() &&
      (hasFired('firstLaunch') || isVinoSilenced())
    ) {
      startCoachmarks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, introDone, vinoIdle, booting, catalogue]);

  const showIntroCard =
    location.pathname === '/dex' && !booting && !hasFired('firstLaunch') && !isVinoSilenced() && !introDone && !demoActive;

  // Home is an in-app control, so it lands on the dex menu — never the site.
  // The site is what the app sits on top of, not a screen to bounce back to.
  //
  // Home is also the reset: it drops every stored scroll position, so
  // re-entering a country from the menu opens at the top. Back deliberately
  // does not clear — restoring on Back is the point — and leaving the app for
  // the site does clear, for the same reason Home does (`handleExitToSite`).
  const handleHome = () => {
    clearScreenState();
    navigate('/dex');
  };

  /**
   * Back, and the fallback that has to know which product it is in (v8#12).
   *
   * `location.key === 'default'` means there is no history to pop — a URL
   * opened cold. Back then falls back to a fixed destination, and **which one
   * depends on which product the screen belongs to.**
   *
   * **The release blocker this closes.** The fallback was a flat
   * `navigate('/dex')`, carried unchanged out of v0.2.x with a comment that
   * said "the user is inside the app". That premise stopped being true the
   * moment `/` became the company site: this handler is wired to five *site*
   * routes, so on the release whose whole thesis is "Vinodex is something you
   * open from inside the site", pressing Back on the front page **launched the
   * encyclopedia, BIOS and all**. Worse than a cold-start edge: React Router
   * keeps `key === 'default'` on the initial history entry, so popping back
   * onto `/` restores the cold branch — there was no sequence in which Back on
   * the landing did anything else.
   *
   * It is the one behaviour the rework did not route through `appRoutes.ts`,
   * which is exactly why it slipped: every other site/dex difference in this
   * release asks the classifier, and this one remembered instead. It asks now.
   *
   * `replace` on the fallback: there is nothing to pop, so this is a move *up*
   * rather than back, and leaving the abandoned URL in the history would let
   * the browser's own Back drop the visitor straight into the screen they just
   * left.
   */
  const handleBack = () => {
    if (location.key !== 'default') {
      navigate(-1);
      return;
    }
    navigate(isSitePath(location.pathname) ? '/' : '/dex', { replace: true });
  };

  /**
   * Out of the app, onto the site underneath it (v8#9).
   *
   * The menu's Back cap and SYSTEM's EXIT TO SITE are the same act and share
   * this handler. **A fixed destination rather than `navigate(-1)`**, and that
   * is the ruling read literally: "backing out past the menu returns to the
   * website". A history pop would land wherever you happened to come from, so
   * `/passport` → Home → Back would go *back into* `/passport` — the menu's
   * Back would sometimes leave the app and sometimes re-enter it, depending on
   * a history the player cannot see. One destination, always.
   *
   * Clears screen state for the same reason Home does: re-entering the dex
   * should not resume mid-page.
   */
  const handleExitToSite = () => {
    clearScreenState();
    navigate('/');
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

  // The five route components used to be declared here, inside the render
  // body. They are at module scope now (W1) — see the note above
  // `ListRoute`. Nothing else moved; each takes as props exactly the
  // handlers it used to close over.

  return (
    <div
      className="antialiased text-gray-900 bg-gray-900 min-h-dvh overflow-hidden"
      style={{ paddingTop: 'var(--install-banner-h, 0px)' }}
    >
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
      <ScreensaverProvider active={saverUp && inDex && !booting} onDismiss={() => setSaverUp(false)}>
        <VinodexBootProvider active={booting} entries={allEntries.length} onDone={finishBoot}>
          <IosUpdatesPromptProvider
            key={isDexPath(location.pathname) ? 'dex' : 'site'}
            active={isDexPath(location.pathname) && !booting && !saverUp && !demoActive}
          >
            <Routes>
        {/*
          "/" is the company site, and the site is the landing experience
          (v8#1). There is no DEX / WEBSITE fork any more: Horizon/Godot is what
          a visitor arrives at, and Vinodex is an app they open from inside it
          — OUR WORK → VINODEX → BIOS → the dex. The chassis carries all of it,
          so the site reads as the studio's device sitting on the desk and
          opening the app boots it.

          Every portal screen hides the in-app chassis buttons
          (`showSystemButtons={false}`) and offers Back instead.
        */}
        <Route
          path="/"
          element={
            <PortalHome
              onHome={() => navigate('/')}
              onOpenApps={() => navigate('/apps')}
              onOpenApp={() => navigate('/dex')}
              onWhoWeAre={() => navigate('/who-we-are')}
              onContactUs={() => navigate('/contact')}
            />
          }
        />
        <Route
          path="/apps"
          element={
            <OurAppsList
              onBack={handleBack}
              onHome={() => navigate('/')}
              onSelectProject={id => navigate(`/project/${id}`)}
            />
          }
        />
        <Route
          path="/project/:id"
          element={
            <ProjectRoute
              onBack={handleBack}
              onHome={() => navigate('/')}
              // No keypad in front of it any more (v8#3): OPEN VINODEX is the
              // door, and the device boots on the other side of it.
              onOpenApp={() => navigate('/dex')}
            />
          }
        />
        <Route path="/who-we-are" element={<WhoWeAre onBack={handleBack} onHome={() => navigate('/')} />} />
        <Route
          path="/contact"
          element={<ContactUs onBack={handleBack} onHome={() => navigate('/')} onPrivacy={() => navigate('/privacy')} />}
        />
        {/* The legal page (v0.6.0): the App Store's privacy-policy URL, and the
            small print for anyone who asks. `/terms` is the other name people
            and store forms guess, so it resolves rather than 404ing — both are
            site paths, so neither ever boots the device. */}
        <Route path="/privacy" element={<PrivacyAndTerms onBack={handleBack} onHome={() => navigate('/')} />} />
        <Route path="/terms" element={<Navigate to="/privacy" replace />} />

        {/* The v0.2.x spellings. Redirects, so nothing shared or bookmarked
            breaks — see `LegacyProjectRedirect`. `/website/unlock` was the
            access-code door; the door is gone, and the link's whole purpose was
            to get into the app, so it goes there. */}
        <Route path="/website" element={<Navigate to="/" replace />} />
        <Route path="/website/apps" element={<Navigate to="/apps" replace />} />
        <Route path="/website/project/:id" element={<LegacyProjectRedirect />} />
        <Route path="/website/who-we-are" element={<Navigate to="/who-we-are" replace />} />
        <Route path="/website/contact" element={<Navigate to="/contact" replace />} />
        <Route path="/website/unlock" element={<Navigate to="/dex" replace />} />

        {/* Every dex route waits for the catalogue chunk (v0.6.31). On a cold
            arrival the BIOS boot is running in front of this anyway; the one
            route that skips the boot, a shared entry link, shows the LCD's
            spinner for the beat the tables take to arrive. Site paths never
            reach here: their routes are above, and the site's 404 is below. */}
        {!catalogue && onDexPath && (
          <Route path="*" element={<ScreenLoading label="LOADING..." onBack={handleBack} onHome={handleHome} />} />
        )}
        {catalogue && (
          <>
        <Route
          path="/dex"
          element={
            <MainMenu onNavigate={handleNavigateToCategory} onExit={handleExitToSite} />
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
                onStamps={() => navigate('/passport/stamps')}
                onBack={handleBack}
                onHome={handleHome}
              />
            </Suspense>
          }
        />
        {/* The stamp series as a collection (v10#2). Under /passport so the
            prefix list already owns it: it boots, skins and sleeps as a dex
            screen without a new entry in DEX_PREFIXES. */}
        <Route
          path="/passport/stamps"
          element={
            <Suspense fallback={<ScreenLoading label="LOADING STAMPS..." onBack={handleBack} onHome={handleHome} />}>
              <StampCollectionScreen allEntries={allEntries} onBack={handleBack} onHome={handleHome} />
            </Suspense>
          }
        />
        <Route
          path="/walkthrough"
          element={
            <Suspense fallback={<ScreenLoading label="LOADING TUTORIAL..." onBack={handleBack} onHome={handleHome} />}>
              <WalkthroughScreen
                onBack={handleBack}
                onHome={handleHome}
                onGuidedRun={() => {
                  startCoachmarks();
                  handleHome();
                }}
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
                onFirmware={() => navigate('/firmware')}
                onExitToSite={handleExitToSite}
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
        <Route
          path="/workshop"
          element={
            <Suspense fallback={<ScreenLoading label="LOADING WORKSHOP..." onBack={handleBack} onHome={handleHome} />}>
              <DeviceWorkshopScreen onBack={handleBack} onHome={handleHome} />
            </Suspense>
          }
        />
        <Route
          path="/lineage/:entryId"
          element={
            <LineageRoute
              allEntries={allEntries}
              onFocus={e => navigate(`/lineage/${e.id}`)}
              onOpenEntry={e => navigate(`/detail/${e.id}`)}
              onBack={handleBack}
              onHome={handleHome}
            />
          }
        />
        <Route
          path="/prof-vino"
          element={
            <Suspense fallback={<ScreenLoading label="LOADING PROFESSOR..." onBack={handleBack} onHome={handleHome} />}>
              <ProfVinoScreen onBack={handleBack} onHome={handleHome} />
            </Suspense>
          }
        />
        <Route
          path="/settings/:section"
          element={
            <SettingsSectionRoute allEntries={allEntries} onBack={handleBack} onHome={handleHome} />
          }
        />
        <Route
          path="/list/:category"
          element={<ListRoute onSelect={handleSelectEntry} onBack={handleBack} onHome={handleHome} />}
        />
        <Route
          path="/detail/:entryId"
          element={
            <DetailRoute
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
          }
        />
          </>
        )}
        {/* A URL that matches nothing is an outside arrival, so it lands on the
            company site — unlike the in-app fallbacks above, which go to
            "/dex". Nothing boots on the way through: an unknown path is in
            neither product's list, so `bootDecision` declines it (v8#2). */}
        <Route
          path="*"
          element={<NotFound path={location.pathname} onHome={() => navigate('/')} onOpenApp={() => navigate('/dex')} />}
        />
            </Routes>
          </IosUpdatesPromptProvider>
        </VinodexBootProvider>
      </ScreensaverProvider>
    </div>
  );
};

export default App;
