
import React, { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Home, CircleUser, Settings, Wine, Bookmark, Leaf, Map as MapIcon, Sparkles, Search, ScanLine, Globe, GraduationCap, Calendar, BookOpen, SlidersHorizontal, Wrench, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { ChassisSkinId, FooterCapKind } from '../src/services/theme';
import { useTheme } from '../src/services/useTheme';
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


/**
 * One moulded footer cap, painted by the skin (S1).
 *
 * **The web had iOS's Home fork frozen in Tailwind.** Back, User and Settings
 * were hardcoded `from-stone-700 to-stone-950 border-stone-400`; Home was
 * hardcoded `from-amber-200 to-amber-500 border-amber-700` *plus an inner lit
 * disc* -- and all four rendered identically on every one of the twenty-two
 * skins. Measured before the change: the Home face and glyph came out
 * `rgb(123,51,6)` on CLASSIC, ORIGINAL, BURGUNDY, OAKED, PET NAT, HALLOWEEN,
 * W64 and PSVINO alike.
 *
 * That inner disc is the exact thing iOS deleted in 0.8.98. Its argument is
 * worth restating rather than just following, because it is what makes this a
 * four-line function instead of a switch: a lit Home is a cap that happens to
 * be *bright*, not a control drawn by a second rule. Once the colour comes
 * from the skin, there is nothing left for a `.home` branch to do -- and the
 * history iOS records is that a branch which exists eventually disagrees with
 * its neighbours. Three consecutive iOS releases of cap fixes each "missed
 * the home button" for precisely that reason.
 *
 * So there is one function, no kind parameter beyond which token set to read,
 * and the four call sites differ only in their glyph and their action.
 */
const capStyle = (kind: FooterCapKind): React.CSSProperties => ({
  backgroundImage: `linear-gradient(to bottom, var(--cap-${kind}-top), var(--cap-${kind}-bottom))`,
  borderColor: `var(--cap-${kind}-edge)`,
  color: `var(--cap-${kind}-glyph)`,
});

/**
 * The shared geometry and press of a moulded cap.
 *
 * `active:scale-[0.88]` and the brightness drop are iOS's `ChassisPress`, not
 * its `DexPressStyle` (S8). iOS keeps the two apart deliberately: on-screen
 * things press at 0.96, moulded parts of the shell press deeper and lose the
 * light on the face. The orb already used these numbers and the four caps did
 * not, which is the asymmetry this closes.
 */
const CAP_CLASS =
  'relative w-12 h-12 md:w-14 md:h-14 rounded-full border-[3px] '
  + 'shadow-[inset_0_3px_6px_rgba(255,255,255,0.15),0_6px_10px_rgba(0,0,0,0.5)] '
  + 'flex items-center justify-center '
  + 'transition-[transform,filter] duration-100 '
  + 'active:scale-[0.88] active:brightness-90 '
  + 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 '
  + 'focus-visible:ring-offset-[color:var(--chassis-footer)]';


/**
 * The drawn cap for one control on the active skin, or null.
 *
 * `art/caps/{SKIN}-{kind}.png`, baked by `scripts/bake-footer-caps.py` from
 * the four source sprites `sync-shared.ps1` mirrors out of iOS. 22 skins x 4
 * caps = 88 files, 608 KB, none over ~12 KB, runtime-cached rather than
 * precached like the rest of the art.
 *
 * **Null is a real answer, and the fallback is the whole control.** This is
 * `ChassisButton.drawnCap`'s rule and it is worth keeping: the CSS circle
 * underneath is not a placeholder, it is the button, correctly coloured by
 * the same tokens. So an unbaked skin, a failed request or a browser with
 * images off degrades to the S1 gradient rather than to a hole. iOS states it
 * as "the conversion can be partial without any control being blank", which
 * is the only defence against an art loader returning nil in silence.
 */
const capArt = (skin: ChassisSkinId | null, kind: FooterCapKind): string | null =>
  skin ? `/art/caps/${skin}-${kind}.png` : null;

/**
 * One moulded cap: the drawn sprite over the coloured circle that is its own
 * fallback.
 *
 * `onError` clears the sprite rather than leaving a broken image, so the
 * circle below shows through — the failure is invisible to the player and
 * loud to the render gate, which fails on any 4xx.
 */
const CapFace: React.FC<{ kind: FooterCapKind; skin: ChassisSkinId | null }> = ({ kind, skin }) => {
  const [failed, setFailed] = useState(false);
  const src = capArt(skin, kind);
  useEffect(() => { setFailed(false); }, [src]);
  if (!src || failed) return null;
  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      draggable={false}
      onError={() => setFailed(true)}
      className="absolute inset-[-3px] w-[calc(100%+6px)] h-[calc(100%+6px)] pointer-events-none select-none"
      // Inset by the border width and sized past it: the sprite is a whole
      // moulded cap including its own rim, so it replaces the CSS border
      // rather than sitting inside it. Drawn smooth, not pixelated -- these
      // are a rendered circle downscaled, not pixel art on a grid, which is
      // the same exception iOS carves out with `.interpolation(.high)`.
      style={{ imageRendering: 'auto', objectFit: 'contain' }}
    />
  );
};

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
  // The active shell, for the drawn caps. `useTheme` is the same external
  // store the rest of the chassis reads, so a skin change repaints the band
  // without a reload.
  const theme = useTheme();

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
            {/*
              The orb: a stadium the length of the lamp trio, seated in the
              deck (S3).

              It was a 44px circle with a thick white bezel and a specular
              dot -- a bead standing proud. iOS's `RecessedLamp` note argues
              at length why the orb was deliberately NOT given the lamps'
              treatment (seating a part meant to catch the light inverts its
              lighting), and then records why that argument stopped applying:
              since 0.7.9 the orb is the length of the whole trio and exactly
              a lamp's height, in the same row, at the same distance from the
              eye. Two parts that alike, lit two different ways, read as one
              of them being wrong.

              The width is derived, not authored -- three lamps and the two
              gaps between them, which is iOS's own rule stated once so a
              mockup can obey it too. The height is the short axis and drives
              every measurement in `.recessed-lamp`.
            */}
            <div className="relative shrink-0">
              <span
                aria-hidden="true"
                className="chassis-glow absolute left-1/2 top-1/2 w-20 h-10 md:w-24 md:h-12 rounded-full pointer-events-none"
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
                className={`recessed-lamp relative w-[4.6rem] h-[0.9rem] md:w-[5.4rem] md:h-[1.05rem] rounded-full p-0 transition-transform duration-100 ${
                  orbHeld ? 'scale-[0.88] brightness-75' : ''
                } ${onTitleTap ? 'cursor-pointer' : 'cursor-default'} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80`}
                style={{
                  backgroundColor: 'var(--chassis-orb)',
                  border: '1px solid var(--chassis-orb-glow)',
                  // The short axis drives the recess: `.recessed-lamp` is a
                  // set of fractions, so one class is correct on a 10px vent
                  // dot and on this.
                  '--lamp-size': '0.95rem',
                } as React.CSSProperties}
              >
                <span className="lamp-bead" aria-hidden="true" />
              </button>
            </div>

            {/* The three skin-tinted lamps, trailing-aligned in the right corner. */}
            {/* The status trio, seated (S3). Same recess as every other lamp
                on the device -- see `.recessed-lamp`. */}
            <div className="flex flex-row gap-2 items-center pt-1.5" aria-hidden="true">
              {[1, 2, 3].map((n, i) => (
                <span
                  key={n}
                  className="recessed-lamp relative w-2.5 h-2.5 md:w-3 md:h-3 rounded-full"
                  style={{
                    backgroundColor: `var(--chassis-lamp${n})`,
                    border: `1px solid var(--chassis-lamp${n}-edge)`,
                    '--lamp-size': '0.75rem',
                  } as React.CSSProperties}
                >
                  <span className="lamp-bead" />
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
          {/*
            The screen housing, with its keyed corner (S4) and NOCTURNE's
            charge (S2).

            The bottom-left is cut diagonally rather than rounded -- the way a
            moulded part is keyed so it seats only one way round, and the one
            asymmetry in an otherwise mirror-symmetric chassis. It is what
            makes the device read as a manufactured object rather than a drawn
            rectangle, and the web had a plain rounded box.

            `--chassis-rim-glow` was written by `applyTheme` and read by
            nothing, so NOCTURNE's glow-in-the-dark halo did not render at
            all. Two stacked shadows -- a tight one and a wide one -- which is
            what reads as phosphor rather than as a drop shadow. It resolves
            to `transparent` on the other twenty-one shells, so it costs them
            nothing.
          */}
          <div
            className="chamfered-panel h-full flex flex-col relative m-2 mt-0 border-l-[6px] border-r-[6px] border-b-[6px] border-t-0 shadow-inner"
            style={{
              backgroundColor: 'var(--chassis-panel)',
              borderColor: 'var(--chassis-panel-edge)',
              boxShadow:
                '0 0 6px var(--chassis-rim-glow, transparent), 0 0 16px var(--chassis-rim-glow, transparent)',
            }}
          >

          {/* Decorative vents in white bezel - center only */}
          {/* The two housing lamps. Fixed red on every shell, matching iOS's
              `ventDot` -- these are the chassis's plain power/link
              indicators, not a skin surface. Seated like the rest (S3). */}
          <div className="relative flex items-center justify-center px-4 h-6 opacity-50 shrink-0">
            <div className="flex gap-2">
              {[0, 1].map(i => (
                <span
                  key={i}
                  className="recessed-lamp w-2 h-2 rounded-full bg-red-500"
                  style={{ border: '1px solid #991b1b', '--lamp-size': '0.5rem' } as React.CSSProperties}
                />
              ))}
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
            <span
              className="recessed-lamp w-2.5 h-2.5 rounded-full bg-red-500 shrink-0"
              style={{ border: '1px solid #991b1b', '--lamp-size': '0.625rem' } as React.CSSProperties}
            />
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
              className={`${CAP_CLASS} ${backEnabled ? 'hover:scale-[1.02]' : 'opacity-35 cursor-default'}`}
              style={capStyle('back')}
            >
              {/* The drawn cap, with the coloured circle behind it as its own
                  fallback. `currentColor` on the glyph so that fallback is
                  legible on the pale skins, where a hardcoded white was not. */}
              <CapFace kind="back" skin={theme.skin} />
              {!capArt(theme.skin, 'back') && (
                <svg viewBox="0 0 24 24" className="w-8 h-8 pointer-events-none" fill="none" stroke="currentColor" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M15 5L7 12l8 7" />
                </svg>
              )}
            </button>
            {showSystemButtons && (
              <button
                type="button"
                onClick={() => navigate('/saved')}
                // "Saved entries", unchanged. iOS renamed its equivalent to
                // "User" in 0.8.5 (A1) on the grounds that the page holds
                // three shelves and the label named one of them -- which is
                // true here too, since /saved is titled COLLECTION. But the
                // web's COLLECTION naming is a documented deliberate
                // deviation, so the right web label is neither iOS's word nor
                // this one, and picking it is a naming decision rather than a
                // colour-model port. Left alone; `MoonDialScreen.test.tsx`
                // caught the accidental rename, which is the test working.
                aria-label="Saved entries"
                data-coachmark="passportButton"
                className={`${CAP_CLASS} hover:scale-[1.02]`}
                style={capStyle('user')}
              >
                <CapFace kind="user" skin={theme.skin} />
                {!capArt(theme.skin, 'user') && (
                  <CircleUser className="w-7 h-7 pointer-events-none" strokeWidth={2} aria-hidden="true" />
                )}
              </button>
            )}
          </div>

          {/* Centre: two indicator lamps over the marquee, matched to its width. */}
          <div className="flex-1 min-w-0 flex flex-col items-center gap-1 -translate-y-0.5">
            {/*
              The marquee's two indicator lamps, skin-tinted (S7a).

              They were a hardcoded Tailwind red and a hardcoded #2AB5FF on
              all twenty-two shells. iOS 0.7.1's A7 reversed exactly that
              decision, and its reasoning transfers whole: the original rule
              was "fixed red and blue, because these are the same bulbs as the
              vent lamp and the skin's colours are already spoken for", and
              two things were wrong with it. It was not true of the whole
              device -- HALLOWEEN, VINHO VERDE and CHAMPAGNE repaint the trio,
              the orb, the marquee ground and the letters, and then ran a
              Tailwind red and a Tailwind blue across the middle of all of it.
              And "already spoken for" treats a skin's lamp colours as a
              scarce resource; they are a palette.

              The OUTER two of the trio, not the first two: `statusLights` is
              ordered light-to-deep on most skins, so [0] and [2] are the
              widest pair the shell offers and the two lamps stay
              distinguishable rather than being one colour twice. On
              CHRISTMAS, whose trio is three identical holly berries, they
              come out identical -- which is that skin working, not this rule
              failing.

              Still decoration here, deliberately. iOS 0.7.2 made them buttons
              and 0.7.6 made them reassignable quick-pins with a press-and-
              hold; that is a hidden gesture with no hover affordance on a
              pointer device and wants its own decision, so the colour half
              lands and the behaviour half does not.
            */}
            <div className="w-full max-w-[16.5rem] flex gap-1.5 px-0.5" aria-hidden="true">
              {[1, 3].map(n => (
                <span
                  key={n}
                  className="recessed-lamp flex-1 h-1.5 rounded-full"
                  style={{
                    backgroundColor: `var(--chassis-lamp${n})`,
                    border: `1px solid var(--chassis-lamp${n}-edge)`,
                    '--lamp-size': '0.375rem',
                  } as React.CSSProperties}
                />
              ))}
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
            {/* No inner lit disc, and no amber (S1). It was the web twin of
                the `ChassisAccent`-lit disc iOS deleted in 0.8.98: a second
                drawing rule for one of four identical controls, and the
                reason three releases of cap fixes each missed this button.
                Home is a cap like its neighbours now, and a livery that wants
                it to look powered says so in the colour. */}
            <button
              type="button"
              onClick={onHome ? () => onHome() : undefined}
              disabled={!onHome}
              aria-label="Home"
              className={`${CAP_CLASS} ${onHome ? 'hover:scale-[1.02]' : 'opacity-35 cursor-default'}`}
              style={capStyle('home')}
            >
              <CapFace kind="home" skin={theme.skin} />
              {!capArt(theme.skin, 'home') && (
                <Home size={28} className="pointer-events-none" aria-hidden="true" />
              )}
            </button>
            {showSystemButtons && (
              <button
                type="button"
                onClick={() => navigate('/settings')}
                aria-label="Settings"
                className={`${CAP_CLASS} hover:scale-[1.02]`}
                style={capStyle('settings')}
              >
                <CapFace kind="settings" skin={theme.skin} />
                {!capArt(theme.skin, 'settings') && (
                  <Settings
                    className="w-[50%] h-[50%] pointer-events-none"
                    aria-hidden="true"
                    style={{ filter: 'drop-shadow(0 1px 0 rgba(0,0,0,0.5))' }}
                  />
                )}
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
