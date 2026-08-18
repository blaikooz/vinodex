
import React, { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Home, CircleUser, Settings, Wine, Bookmark, Leaf, Map as MapIcon, Sparkles, Search, ScanLine, Globe, GraduationCap, Calendar, BookOpen, SlidersHorizontal, Wrench, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  applyActivity,
  applyTimedOut,
  currentScript,
  scriptTextAfter,
  stageTimeout,
  subscribeToMarquee,
} from '../src/services/marqueeScript';
import { IDLE_ACTIVITY_EVENTS } from '../src/services/screensaver';

/**
 * The marquee's per-route glyph, stamped between the banner's repetitions —
 * iOS `DexRoute.marqueeSymbol` / `MarqueeBanner.symbol`. The web has only the
 * screen `title` for context, so the fixed-title screens map to their iOS
 * glyph and everything else (entry readouts, ad-hoc titles) falls back to the
 * wineglass, the app's own mark.
 */
/**
 * The drawn marquee panel per route, mirrored from iOS by
 * `sync-shared.ps1`'s web art leg (v6#2 ruling). iOS keys these off
 * `DexRoute.marqueeArtStem`; the web has only the screen title, so the map is
 * title-keyed and any title without a panel falls through to the lucide
 * glyph below rather than drawing nothing.
 */
export const MARQUEE_ART: Record<string, string> = {
  'VINODEX': 'marquee-menu',
  'SYSTEM': 'marquee-system',
  'SAVED': 'marquee-user',
  'COLLECTION': 'marquee-user',
  'GRAPES': 'marquee-grapescan',
  // The listing titles the app actually uses, which are not the category
  // names (found by the screenshot gate: VARIETIES was falling back).
  'VARIETIES': 'marquee-grapescan',
  'DATABASE': 'marquee-encyclopedia',
  'WORLD SEARCH': 'marquee-globescan',
  'REGIONS': 'marquee-regions',
  'COUNTRIES': 'marquee-countryscan',
  'STYLES': 'marquee-stylescan',
  'FLAVORS': 'marquee-flavorscan',
  'CONTINENTS': 'marquee-continentscan',
  'GLOBE': 'marquee-globescan',
  'GLOBE SCAN': 'marquee-globescan',
  'MASTER SEARCH': 'marquee-mastersearch',
  'SEARCH': 'marquee-mastersearch',
  'BLIND TASTING': 'marquee-blindtasting',
  'SCANNER': 'marquee-blindtasting',
  'TOOLS': 'marquee-tools',
  'FILTER': 'marquee-filtersearch',
  'WINE EXAM': 'marquee-wineexam',
  'DAILY CHALLENGE': 'marquee-dailychallenge',
  'PASSPORT': 'marquee-passport',
  'MOON DIAL': 'marquee-moondial',
  'ENCYCLOPEDIA': 'marquee-encyclopedia',
  'FIRMWARE': 'marquee-firmware',
  'CHEAT CODES': 'marquee-cheatcodes',
  'LINEAGE': 'marquee-lineage',
  'STAMPS': 'marquee-stamps',
  'TUTORIAL': 'marquee-tutorial',
  'CUSTOMIZE': 'marquee-customize',
  'DATA': 'marquee-data',
  'DEV': 'marquee-dev',
  'ACCESS': 'marquee-shop',
  // The filter-mode scan titles the listing sets, and the remaining screens.
  // Every stem below exists on disk; `marqueeArt.test.ts` holds the map and
  // the directory to each other in both directions.
  'SECTOR SCAN': 'marquee-regions',
  'AREA SCAN': 'marquee-countryscan',
  'STYLE SCAN': 'marquee-stylescan',
  'FLAVOR SCAN': 'marquee-flavorscan',
  'GEOLOGY SCAN': 'marquee-soilscan',
  'REGION SCAN': 'marquee-regions',
  'STATE SCAN': 'marquee-countryscan',
  'CLIMATE SCAN': 'marquee-soilscan',
  'SYSTEM SCAN': 'marquee-system',
  'WORLD SCAN': 'marquee-globescan',
  'SECTOR SELECT': 'marquee-continentscan',
  'TACTILE VIEW': 'marquee-globescan',
  'BIODYNAMIC SCAN': 'marquee-moondial',
  'PROF. VINO': 'marquee-vinodex',
  'SUPPORT': 'marquee-notifications',
  'YOU MIGHT LIKE': 'marquee-encyclopedia',
  'DEMO MODE': 'marquee-demo',
  'PROFILES': 'marquee-user',
  'HAPTICS': 'marquee-haptics',
  'HEALTH': 'marquee-dev',
  'SETTINGS': 'marquee-settings',
};

const marqueeGlyph = (title: string, size: number): React.ReactNode => {
  const t = title.toUpperCase();
  const stem = MARQUEE_ART[t];
  if (stem) {
    return (
      <img
        src={`/art/marquee/${stem}.png`}
        alt=""
        aria-hidden="true"
        draggable={false}
        style={{ height: size, width: 'auto', objectFit: 'contain', imageRendering: 'pixelated', display: 'block', flexShrink: 0 }}
      />
    );
  }
  const props = { size, className: 'text-green-500 shrink-0', 'aria-hidden': true } as const;
  switch (t) {
    case 'VINODEX': return <Wine {...props} />;
    case 'SYSTEM': return <Settings {...props} />;
    case 'SAVED':
    case 'COLLECTION': return <Bookmark {...props} />;
    case 'GRAPES': return <Leaf {...props} />;
    case 'REGIONS':
    case 'COUNTRIES': return <MapIcon {...props} />;
    case 'STYLES': return <Wine {...props} />;
    case 'FLAVORS': return <Sparkles {...props} />;
    case 'CONTINENTS':
    case 'GLOBE': return <Globe {...props} />;
    case 'SEARCH': return <Search {...props} />;
    case 'SCANNER': return <ScanLine {...props} />;
    case 'TOOLS':
    case 'MINIGAMES': return <Wrench {...props} />;
    case 'FILTER': return <SlidersHorizontal {...props} />;
    case 'WSET QUIZ':
    case 'QUIZ': return <GraduationCap {...props} />;
    case 'DAILY CHALLENGE': return <Calendar {...props} />;
    case 'PASSPORT': return <BookOpen {...props} />;
    case 'MOON DIAL': return <Moon {...props} />;
    default: return <Wine {...props} />;
  }
};

interface DeviceLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  onBack?: () => void;
  showBack?: boolean;
  onHome?: () => void;
  hideHeader?: boolean;
  centerHeaderText?: boolean;
  footerCenter?: React.ReactNode;
  isFlipped?: boolean;
  backFace?: React.ReactNode;
  onTitleTap?: () => void;
  /**
   * SAVED and SETTINGS sit on the chassis itself, matching iOS `DeviceChassis`,
   * so they are reachable from every screen without each one wiring them up.
   * The splash turns them off — there is no app behind it yet.
   */
  showSystemButtons?: boolean;
  /**
   * Shows the VINODEX wordmark in the island's right slot, where the settings
   * cog otherwise sits. Splash only: iOS dropped the wordmark from the chassis
   * because a logo reads as decoration next to real controls, and that
   * reasoning holds everywhere the cog is present — but the splash has no cog
   * and no app behind it yet, so the wordmark is the only thing naming the
   * product on the first screen anyone sees.
   */
  showWordmark?: boolean;
}

const DeviceLayout: React.FC<DeviceLayoutProps> = ({
  children,
  title,
  subtitle: _subtitle,
  onBack,
  showBack = false,
  onHome,
  hideHeader = false,
  centerHeaderText: _centerHeaderText = false,
  footerCenter,
  isFlipped = false,
  backFace,
  onTitleTap,
  showSystemButtons = true,
  // The top wordmark is retired (iOS v0.6.9): the device's one wordmark is now
  // moulded into the bottom strip of the screen housing, so the splash gets it
  // there like every other screen. Prop kept for call-site compatibility.
  showWordmark: _showWordmark = false,
}) => {
  const navigate = useNavigate();

  const [orbHeld, setOrbHeld] = useState(false);
  const holdTimer = useRef<number | null>(null);

  const cancelOrbHold = useCallback(() => {
    if (holdTimer.current !== null) {
      window.clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
    setOrbHeld(false);
  }, []);

  const beginOrbHold = useCallback(() => {
    setOrbHeld(true);
    holdTimer.current = window.setTimeout(() => {
      holdTimer.current = null;
      setOrbHeld(false);
      onTitleTap?.();
    }, 1000);
  }, [onTitleTap]);

  // A pointer released outside the orb still has to clear the timer, or the
  // device flips a beat after the user has given up and looked away.
  useEffect(() => cancelOrbHold, [cancelOrbHold]);

  // The wordmark is gone from the island (a cog took its place), so the only
  // place the app still names itself is the footer marquee.
  const isMainScreen = title === 'VINODEX';

  // The marquee script (v6#20): the forever-loop of toasts this panel used to
  // carry is exactly what iOS 0.7.1 retired — the device greets once, settles
  // into naming the screen, and only toasts when ignored. The script runs on
  // the main screen only; every other screen's panel is its own title.
  const script = useSyncExternalStore(subscribeToMarquee, currentScript, currentScript);
  const [cheersElapsed, setCheersElapsed] = useState(0);
  useEffect(() => {
    if (!isMainScreen) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let rotate: ReturnType<typeof setInterval> | null = null;

    const arm = () => {
      if (timer) clearTimeout(timer);
      if (rotate) {
        clearInterval(rotate);
        rotate = null;
      }
      setCheersElapsed(0);
      const pending = stageTimeout(currentScript().stage);
      if (pending) {
        timer = setTimeout(() => {
          applyTimedOut();
          arm();
        }, pending.after * 1000);
      } else {
        // CHEERS!: the word is a pure function of how long this idle period
        // has run — nothing accumulates, so a dropped frame cannot strand it.
        const periodStart = Date.now();
        rotate = setInterval(() => setCheersElapsed((Date.now() - periodStart) / 1000), 1000);
      }
    };

    // Activity restarts whichever dwell the resting stage is waiting out,
    // even when the stage itself does not move. The event list is the one
    // shared idle reckoning (review L4) — the screensaver reads the same
    // list, because two clocks counting the same silence differently is what
    // the A4 fold retired.
    const activity = () => {
      applyActivity();
      arm();
    };
    IDLE_ACTIVITY_EVENTS.forEach(e => window.addEventListener(e, activity, { capture: true, passive: true }));
    arm();
    return () => {
      if (timer) clearTimeout(timer);
      if (rotate) clearInterval(rotate);
      IDLE_ACTIVITY_EVENTS.forEach(e => window.removeEventListener(e, activity, { capture: true }));
      // Deliberately no `applyLeftMainScreen()` here (review L3): teardown is
      // not navigation — StrictMode's dev double-invoke and any same-route
      // remount would consume the once-per-launch WELCOME! before it ever
      // painted. The App's route watcher applies the transition when the
      // path actually leaves the main screen.
    };
  }, [isMainScreen]);

  const footerTitle = isMainScreen ? scriptTextAfter(script, cheersElapsed) : title;
  const backEnabled = showBack && !!onBack;
  // One size: the marquee never says VINODEX any more (the script replaced
  // the wordmark loop), so the old big-wordmark branch was dead (review I3).
  const footerTitleSize = 'text-[1.55rem] md:text-[1.8rem]';
  const defaultFooterDisplay = (
    <div className="w-full max-w-[16.5rem] min-w-0 rounded-[1.1rem] bg-black px-[0.35rem] py-[0.3rem] border border-white/75 shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_3px_0_rgba(120,120,120,0.95)]">
      <div className="flex items-center min-h-[4.1rem] overflow-hidden bg-black rounded-[0.9rem] px-1 shadow-[inset_0_0_18px_rgba(34,197,94,0.16)]">
        <div className="terminal-marquee whitespace-nowrap flex items-center">
          <span
            className={`inline-block font-retro ${footerTitleSize} italic tracking-[-0.08em] transform -skew-x-12 leading-none text-green-500 pr-6`}
            style={{ textShadow: '1px 1px 0px rgba(8, 32, 16, 0.65)' }}
          >
            {footerTitle}
          </span>
          <span className="pr-6 flex items-center">{marqueeGlyph(title, 22)}</span>
          <span
            aria-hidden="true"
            className={`inline-block font-retro ${footerTitleSize} italic tracking-[-0.08em] transform -skew-x-12 leading-none text-green-500 pr-6`}
            style={{ textShadow: '1px 1px 0px rgba(8, 32, 16, 0.65)' }}
          >
            {footerTitle}
          </span>
          <span aria-hidden="true" className="pr-6 flex items-center">{marqueeGlyph(title, 22)}</span>
        </div>
      </div>
    </div>
  );
  // The header title sizing that used to live here went with the wordmark —
  // the island carries no text now, only the orb, the lights and the cog.

  // Taller than the old single-row band: the footer now stacks two controls in
  // each side well (iOS v0.6.9 button band), so it reserves room for a pair.
  const footerHeight = '8.5rem';
  const footerBottomPad = 'max(0.5rem, env(safe-area-inset-bottom))';

  return (
    <div
      className="flex justify-center items-center min-h-screen bg-neutral-900 p-0 md:p-4 font-mono h-screen md:h-auto overflow-hidden rounded-[2rem]"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
        perspective: '2000px',
      }}
    >
      {/* 3D flip container — wraps both faces of the device */}
      <div
        className="relative w-full h-full md:h-[850px] md:w-[522px]"
        style={{
          transformStyle: 'preserve-3d',
          transition: 'transform 700ms cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* Front face — full device chassis */}
        <div
          className="absolute inset-0 w-full h-full"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            pointerEvents: isFlipped ? 'none' : 'auto',
          }}
        >
          {/* Device chassis. The moulding colour is the active ChassisSkin —
              see theme.ts; the LCD inside it never changes with the skin. */}
          <div
            className="w-full h-full md:rounded-[2.5rem] md:shadow-[0_20px_50px_rgba(0,0,0,0.35)] overflow-hidden relative border-[3px] ring-1 ring-white/10 shadow-[inset_-10px_-10px_30px_rgba(0,0,0,0.2)]"
            style={{
              backgroundColor: 'var(--chassis-body)',
              backgroundImage: 'var(--chassis-pattern, none)',
              backgroundSize: '96px 96px',
              borderColor: 'var(--chassis-panel-edge)',
            }}
          >
            <div className="flex h-full flex-col">
        
        {/*
          The notch-level island strip (iOS v0.6.9 `islandFlank`): the orb sits
          in the left corner, the three skin-tinted status lamps in the right
          corner. The top branding is gone — the settings cog moved into the
          footer button band, and the VINODEX wordmark moved to the bottom strip
          of the screen housing (see `bottomVents`), so one device carries one
          wordmark and it names the product on every screen.
        */}
        {!hideHeader && (
          <div className="shrink-0 flex items-start justify-between px-5 pt-2.5 pb-1">
            {/*
              Hold the orb to flip the device — a deliberate easter egg. The orb
              depresses under the finger so the feedback arrives before the flip.
              Its bead and glow are the skin's own (iOS `skin.orb` / `.orbGlow`).
            */}
            <div className="relative shrink-0">
              <span
                aria-hidden="true"
                className="chassis-glow absolute left-1/2 top-1/2 w-16 h-16 md:w-20 md:h-20 rounded-full pointer-events-none"
                style={{ backgroundColor: 'var(--chassis-orb-glow)', filter: 'blur(9px)', '--glow-period': '5.3s' } as React.CSSProperties}
              />
              <button
                type="button"
                aria-label={onTitleTap ? 'Hold to flip device' : undefined}
                aria-hidden={onTitleTap ? undefined : true}
                onPointerDown={onTitleTap ? beginOrbHold : undefined}
                onPointerUp={onTitleTap ? cancelOrbHold : undefined}
                onPointerLeave={onTitleTap ? cancelOrbHold : undefined}
                onPointerCancel={onTitleTap ? cancelOrbHold : undefined}
                disabled={!onTitleTap}
                className={`relative w-11 h-11 md:w-14 md:h-14 rounded-full border-[3px] border-white shadow-[0_4px_8px_rgba(0,0,0,0.5)] p-0 transition-transform duration-100 ${
                  orbHeld ? 'scale-[0.88] brightness-75' : ''
                } ${onTitleTap ? 'cursor-pointer' : 'cursor-default'}`}
                style={{ backgroundColor: 'var(--chassis-orb)' }}
              >
                <span className="absolute top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white rounded-full opacity-80 blur-[1px]"></span>
              </button>
            </div>

            {/* The three skin-tinted lamps, trailing-aligned in the right corner. */}
            <div className="flex flex-row gap-2 items-center pt-1.5" aria-hidden="true">
              {[1, 2, 3].map((n, i) => (
                <span
                  key={n}
                  className="relative w-2.5 h-2.5 md:w-3 md:h-3 rounded-full border"
                  style={{ backgroundColor: `var(--chassis-lamp${n})`, borderColor: `var(--chassis-lamp${n}-edge)` }}
                >
                  <span
                    className="chassis-glow absolute left-1/2 top-1/2 w-3.5 h-3.5 md:w-4 md:h-4 rounded-full pointer-events-none"
                    style={{ backgroundColor: `var(--chassis-lamp${n})`, filter: 'blur(4px)', '--glow-period': `${[6.1, 7.4, 4.8][i]}s` } as React.CSSProperties}
                  />
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Screen Container */}
        <div
          className="flex-1 min-h-0"
          style={{ paddingBottom: `calc(${footerHeight} + ${footerBottomPad})` }}
        >
          <div
            className="h-full flex flex-col relative m-2 mt-0 rounded-[2rem] border-l-[6px] border-r-[6px] border-b-[6px] border-t-0 shadow-inner"
            style={{ backgroundColor: 'var(--chassis-panel)', borderColor: 'var(--chassis-panel-edge)' }}
          >

          {/* Decorative vents in white bezel - center only */}
          <div className="relative flex items-center justify-center px-4 h-6 opacity-50 shrink-0">
            <div className="flex gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 border border-red-800 shadow-[0_0_6px_rgba(239,68,68,0.8)]"></span>
              <span className="w-2 h-2 rounded-full bg-red-500 border border-red-800 shadow-[0_0_6px_rgba(239,68,68,0.8)]"></span>
            </div>
          </div>
          
          {/* Inner Screen Bezel */}
          <div className="flex-1 min-h-0 bg-stone-800 rounded-[1.75rem] relative flex flex-col overflow-hidden mx-3">
            
            {/* Main LCD Content. `isolation:isolate` keeps the monochrome
                multiply overlay from bleeding onto the chassis behind it. */}
            <div
              className="flex-1 min-h-0 relative w-full overflow-hidden flex flex-col"
              style={{ backgroundColor: 'var(--lcd-screen)', isolation: 'isolate' }}
            >
              {/* Scanlines Overlay */}
              <div className="absolute inset-0 z-10 scanlines opacity-20 pointer-events-none"></div>

              {/* Content. `lcd-themed` scopes the screen-mode palette remap to
                  the LCD — see index.css; the chassis must not follow it. */}
              <div className="lcd-themed relative z-0 h-full w-full overflow-hidden flex flex-col uppercase">
                {children}
              </div>

              {/* Monochrome phosphor tint: grayscale lives on `.lcd-themed`;
                  this multiplies the tint over the whole LCD. Transparent in
                  colour modes, so a harmless no-op there. */}
              <div
                className="absolute inset-0 z-20 pointer-events-none"
                style={{ backgroundColor: 'var(--mono-tint, transparent)', mixBlendMode: 'multiply' }}
              />
            </div>

          </div>

          {/* Bottom strip (iOS v0.6.7+ `bottomVents`): the lone red lamp, the
              stretched VINODEX wordmark — the device's one wordmark, moulded
              into the strip in the grille's own colour — and the grille slats. */}
          <div className="shrink-0 relative flex items-center gap-3 px-4 h-7">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 border border-red-800 shadow-[0_0_6px_rgba(239,68,68,0.8)] shrink-0"></span>
            <div className="flex-1 min-w-0 flex justify-center overflow-hidden">
              <span
                aria-hidden="true"
                className="font-retro leading-none select-none whitespace-nowrap"
                style={{
                  color: 'var(--chassis-grill)',
                  opacity: 0.85,
                  fontSize: 'clamp(0.65rem, 3vw, 1rem)',
                  letterSpacing: '0.12em',
                  transform: 'scaleX(1.3)',
                  display: 'inline-block',
                }}
              >
                VINODEX
              </span>
            </div>
            <div className="flex flex-col gap-0.5 opacity-50 shrink-0">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="w-14 h-0.5 rounded-full" style={{ backgroundColor: 'var(--chassis-grill)' }}></div>
              ))}
            </div>
          </div>

        </div>
        </div>
        </div>

        {/* Footer — the button band (iOS v0.6.9): two vertical bundles in milled
            capsule wells — Back over Saved on the left, Home over Settings on the
            right — flanking the marquee panel and its two indicator lamps. `zoom`
            scales the whole furniture with the UI-size axis. */}
        <footer
          className="absolute inset-x-0 bottom-0 px-2 pt-1 flex items-start justify-between gap-2"
          style={{
            backgroundColor: 'var(--chassis-footer)',
            paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))',
            zoom: 'var(--ui-scale, 1)' as unknown as number,
          }}
        >
          {/* Left well: Back (top) over Saved (bottom). */}
          <div
            className="flex flex-col items-center gap-1.5 rounded-full p-1.5 -translate-y-1 shrink-0"
            style={{ backgroundColor: 'rgba(0,0,0,0.2)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.35), inset 0 -1px 0 rgba(255,255,255,0.14)' }}
          >
            <button
              type="button"
              onClick={backEnabled ? onBack : undefined}
              disabled={!backEnabled}
              aria-label="Back"
              className={`relative w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-b from-stone-700 to-stone-950 border-[3px] border-stone-400 shadow-[inset_0_3px_6px_rgba(255,255,255,0.15),0_6px_10px_rgba(0,0,0,0.5)] transition-transform focus:outline-none active:scale-[0.95] ${backEnabled ? 'hover:scale-[1.02]' : 'opacity-35 cursor-default'}`}
            >
              <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <svg viewBox="0 0 24 24" className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 5L7 12l8 7" />
                </svg>
              </span>
            </button>
            {showSystemButtons && (
              <button
                type="button"
                onClick={() => navigate('/saved')}
                aria-label="Saved entries"
                data-coachmark="passportButton"
                className="relative w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-b from-stone-700 to-stone-950 border-[3px] border-stone-400 shadow-[inset_0_3px_6px_rgba(255,255,255,0.15),0_6px_10px_rgba(0,0,0,0.5)] transition-transform active:scale-[0.95] hover:scale-[1.02]"
              >
                <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <CircleUser className="w-7 h-7 text-white" strokeWidth={2} />
                </span>
              </button>
            )}
          </div>

          {/* Centre: two indicator lamps over the marquee, matched to its width. */}
          <div className="flex-1 min-w-0 flex flex-col items-center gap-1 -translate-y-0.5">
            <div className="w-full max-w-[16.5rem] flex gap-1.5 px-0.5" aria-hidden="true">
              <span className="flex-1 h-1.5 rounded-full bg-red-500 border border-red-800"></span>
              <span className="flex-1 h-1.5 rounded-full border" style={{ backgroundColor: '#2AB5FF', borderColor: '#0B6FA8' }}></span>
            </div>
            {footerCenter ? (
              <div className="flex items-center justify-center w-full">{footerCenter}</div>
            ) : (
              defaultFooterDisplay
            )}
          </div>

          {/* Right well: Home (top) over Settings (bottom). */}
          <div
            className="flex flex-col items-center gap-1.5 rounded-full p-1.5 -translate-y-1 shrink-0"
            style={{ backgroundColor: 'rgba(0,0,0,0.2)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.35), inset 0 -1px 0 rgba(255,255,255,0.14)' }}
          >
            <button
              type="button"
              onClick={onHome ? () => onHome() : undefined}
              disabled={!onHome}
              aria-label="Home"
              className={`relative w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-b from-amber-200 to-amber-500 border-[3px] border-amber-700 shadow-[inset_0_3px_5px_rgba(255,255,255,0.55),0_6px_10px_rgba(0,0,0,0.45)] overflow-hidden transition-transform active:scale-[0.95] ${onHome ? '' : 'opacity-35 cursor-default'}`}
            >
              <span className="absolute inset-0 bg-gradient-to-br from-white/35 via-transparent to-black/25 pointer-events-none"></span>
              <span className="absolute inset-[2px] rounded-full bg-gradient-to-b from-amber-100 to-amber-400 border border-amber-500 flex items-center justify-center shadow-inner">
                <Home size={28} className="text-amber-900" />
              </span>
            </button>
            {showSystemButtons && (
              <button
                type="button"
                onClick={() => navigate('/settings')}
                aria-label="Settings"
                className="relative w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center border-[3px] transition-transform active:scale-[0.95] hover:scale-[1.02] shadow-[0_6px_10px_rgba(0,0,0,0.45)]"
                style={{ background: 'linear-gradient(to bottom, #44403c, #1c1917)', borderColor: '#a8a29e' }}
              >
                <Settings className="w-[50%] h-[50%]" style={{ color: '#e8ebee', filter: 'drop-shadow(0 1px 0 rgba(0,0,0,0.5))' }} />
              </button>
            )}
          </div>
        </footer>
          </div>
        </div>
        {/* Back face — steel plate, only rendered when backFace provided */}
        {backFace && (
          <div
            className="absolute inset-0 w-full h-full"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              pointerEvents: isFlipped ? 'auto' : 'none',
            }}
          >
            {backFace}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeviceLayout;
