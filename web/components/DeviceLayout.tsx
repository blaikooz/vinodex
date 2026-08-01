
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Home, CircleUser, Settings, Wine, Bookmark, Leaf, Map as MapIcon, Sparkles, Search, ScanLine, Globe, GraduationCap, Calendar, BookOpen, SlidersHorizontal, Wrench, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * The marquee's per-route glyph, stamped between the banner's repetitions —
 * iOS `DexRoute.marqueeSymbol` / `MarqueeBanner.symbol`. The web has only the
 * screen `title` for context, so the fixed-title screens map to their iOS
 * glyph and everything else (entry readouts, ad-hoc titles) falls back to the
 * wineglass, the app's own mark.
 */
const marqueeGlyph = (title: string, size: number): React.ReactNode => {
  const t = title.toUpperCase();
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
    case 'DAILY':
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
  showWordmark = false,
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
  const footerTitle = isMainScreen
    ? 'CHEERS! - SANTE! - SALUTE! - PROST! - KANPAI!'
    : title;
  const backEnabled = showBack && !!onBack;
  const footerTitleSize = footerTitle === 'VINODEX'
    ? 'text-[2rem] md:text-[2.3rem]'
    : 'text-[1.55rem] md:text-[1.8rem]';
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

  const footerHeight = '6.5rem';
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
          The island strip. No wordmark: iOS replaced the pixel-V logo with a
          settings cog, because a logo looks like branding and so reads as
          decoration — nobody expects it to be tappable. A cog states what it
          does. Orb and status lights sit left, cog pinned right above Home.
        */}
        {!hideHeader && (
          <div className="shrink-0 flex items-center px-4 pr-5 py-2.5 justify-between">
            <div className="flex flex-row items-center gap-3">
              {/*
                Hold the orb to flip the device. A hidden gesture on a
                decorative-looking part is a poor primary affordance, but this
                one is a deliberate easter egg — the orb depresses under the
                finger so the feedback arrives before the flip does. One second:
                long enough not to fire on a tap, short enough that someone who
                knows the gesture does not assume it has broken.
              */}
              <button
                type="button"
                /* Labelled even when inert, and hidden from the tree when it is:
                   a nameless button is the exact fault H10 covers, and this one
                   is decorative on every screen that gives it no flip handler. */
                aria-label={onTitleTap ? 'Hold to flip device' : undefined}
                aria-hidden={onTitleTap ? undefined : true}
                onPointerDown={onTitleTap ? beginOrbHold : undefined}
                onPointerUp={onTitleTap ? cancelOrbHold : undefined}
                onPointerLeave={onTitleTap ? cancelOrbHold : undefined}
                onPointerCancel={onTitleTap ? cancelOrbHold : undefined}
                disabled={!onTitleTap}
                /* Same diameter as the footer controls and the cog: on iOS
                   every button on the chassis is one size (`footerControl`). */
                className={`w-16 h-16 md:w-20 md:h-20 rounded-full bg-cyan-300 border-[3px] border-white relative overflow-hidden shrink-0 shadow-[0_4px_8px_rgba(0,0,0,0.5)] lcd-pulse p-0 transition-transform duration-100 ${
                  orbHeld ? 'scale-90 brightness-75' : ''
                } ${onTitleTap ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <span className="absolute top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full opacity-80 blur-[1px]"></span>
              </button>

              <div className="flex flex-row gap-2 items-center" aria-hidden="true">
                {/* 17% of the control size, sized off the orb so the pair stays
                    proportional — `let dot = max(control * 0.17, 8)`. */}
                <div className="w-3 h-3 md:w-3.5 md:h-3.5 rounded-full bg-red-600 border border-red-800 dot-pulse-red"></div>
                <div className="w-3 h-3 md:w-3.5 md:h-3.5 rounded-full bg-yellow-400 border border-yellow-600 dot-pulse-yellow"></div>
                <div className="w-3 h-3 md:w-3.5 md:h-3.5 rounded-full bg-green-500 border border-green-700 dot-pulse-green"></div>
              </div>
            </div>

            {showWordmark && (
              <h1
                className="font-retro text-[2.1rem] md:text-[2.9rem] italic tracking-tighter transform -skew-x-12 whitespace-nowrap leading-tight drop-shadow-md"
                style={{
                  color: 'var(--chassis-on-body)',
                  textShadow: '2px 2px 0px var(--chassis-on-body-shadow)',
                }}
              >
                VINODEX
              </h1>
            )}

            {showSystemButtons && (
              // Brushed silver, same diameter family as the footer controls, so
              // every button on the chassis reads as one set.
              <button
                onClick={() => navigate('/settings')}
                aria-label="Settings"
                className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center shrink-0 border-[3px] active:scale-90 transition-transform shadow-[0_2px_4px_rgba(0,0,0,0.45)]"
                style={{
                  background: 'linear-gradient(to bottom, #44403c, #1c1917)',
                  borderColor: '#a8a29e',
                }}
              >
                {/* 52% of the button, as `settingsButton(size:)` does. */}
                <Settings
                  className="w-[52%] h-[52%]"
                  style={{ color: '#e8ebee', filter: 'drop-shadow(0 1px 0 rgba(0,0,0,0.5))' }}
                />
              </button>
            )}
          </div>
        )}

        {/* Front nameplate — an engraved brushed-metal "VINODEX" plate on a
            chassis bump above the LCD, on every screen (iOS `titleBump`). The
            splash already carries the skew wordmark in the island, so it is
            suppressed there to avoid naming the product twice. */}
        {!hideHeader && !showWordmark && (
          <div className="shrink-0 flex justify-center -mt-1 mb-1" aria-hidden="true">
            <div
              className="rounded-[4px] px-5 py-1 border"
              style={{
                background: 'linear-gradient(135deg, #cdcfd2 0%, #9ea1a5 55%, #b8babd 100%)',
                borderColor: '#5f6368',
                boxShadow: '0 1px 2px rgba(0,0,0,0.25)',
              }}
            >
              <span
                className="font-retro text-[0.7rem] md:text-[0.8rem] leading-none block"
                style={{
                  color: '#3a3d42',
                  letterSpacing: '0.35em',
                  textShadow: '0 1px 0 rgba(255,255,255,0.5), 0 -1px 0 rgba(0,0,0,0.45)',
                }}
              >
                VINODEX
              </span>
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

          {/* Bottom vents / grill */}
          <div className="shrink-0 relative flex items-center justify-end px-4 h-6">
            <div className="absolute left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-red-500 border border-red-800 shadow-[0_0_6px_rgba(239,68,68,0.8)]"></div>
            <div className="flex flex-col gap-0.5 opacity-50">
              <div className="w-16 h-0.5 rounded-full" style={{ backgroundColor: 'var(--chassis-grill)' }}></div>
              <div className="w-16 h-0.5 rounded-full" style={{ backgroundColor: 'var(--chassis-grill)' }}></div>
              <div className="w-16 h-0.5 rounded-full" style={{ backgroundColor: 'var(--chassis-grill)' }}></div>
            </div>
          </div>

        </div>
        </div>
        </div>

        {/* Footer controls. `zoom` scales the whole control furniture (buttons +
            marquee) with the UI-size axis, independent of LCD text scale. */}
        <footer
          className="absolute inset-x-0 bottom-0 px-3 pt-1 grid grid-cols-[auto_1fr_auto] items-center gap-2"
          style={{
            backgroundColor: 'var(--chassis-footer)',
            paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))',
            zoom: 'var(--ui-scale, 1)' as unknown as number,
          }}
        >
          {/*
            Back where there is somewhere to go; otherwise the slot earns its
            keep as the way into saved entries, rather than sitting there as a
            greyed-out stub. Straight from iOS `ChassisButton.Kind`.
          */}
          <div className="flex justify-start">
            {(backEnabled || showSystemButtons) && (
              <button
                type="button"
                onClick={backEnabled ? onBack : () => navigate('/saved')}
                /* "Saved entries", not "Saved": the slot shows a person glyph
                   when Back has nowhere to go, and the shorter label left a
                   screen reader with no idea what it opened. (audit H10) */
                aria-label={backEnabled ? 'Back' : 'Saved entries'}
                className="relative -translate-y-1 w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-b from-stone-700 to-stone-950 border-[3px] border-stone-400 shadow-[inset_0_3px_6px_rgba(255,255,255,0.15),0_8px_12px_rgba(0,0,0,0.6)] transition-transform focus:outline-none hover:scale-[1.02] active:translate-x-[1px] active:scale-[0.98]"
              >
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  {backEnabled ? (
                    <svg viewBox="0 0 24 24" className="w-10 h-10 text-white" fill="none" stroke="currentColor" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 5L7 12l8 7" />
                    </svg>
                  ) : (
                    /* Back has nowhere to go, so the slot earns its keep as the
                       way into saved entries — iOS ChassisButton.Kind.bookmarks.
                       Suppressed on the splash, which has no app behind it. */
                    <CircleUser className="w-9 h-9 text-white" strokeWidth={2} />
                  )}
                </div>
              </button>
            )}
          </div>

          <div className="flex justify-center items-center px-1 self-center -translate-y-0.5 min-w-0">
            {footerCenter ? (
              <div className="flex items-center justify-center w-full">
                {footerCenter}
              </div>
            ) : (
              <div className="flex items-center justify-center w-full">
                {defaultFooterDisplay}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            {onHome && (
              <button
                onClick={onHome}
                className="relative -translate-y-1 w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-b from-amber-200 to-amber-500 border-[3px] border-amber-700 shadow-[inset_0_3px_5px_rgba(255,255,255,0.55),0_8px_12px_rgba(0,0,0,0.45)] active:scale-[0.98] active:shadow-[inset_0_4px_7px_rgba(0,0,0,0.45)] overflow-hidden transition-transform"
                aria-label="Home"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/35 via-transparent to-black/25 pointer-events-none"></div>
                <div className="absolute inset-[2px] rounded-full bg-gradient-to-b from-amber-100 to-amber-400 border border-amber-500 flex items-center justify-center shadow-inner">
                  <Home size={36} className="text-amber-900 font-bold" />
                </div>
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
