
import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import ChassisIsland from './ChassisIsland';
import DeviceFooter from './DeviceFooter';
import MarqueeLampChooser from './MarqueeLampChooser';
import { IosUpdatesPromptOverlay } from './IosUpdatesPrompt';
import { VinodexBootOverlay } from './VinodexBoot';
import { isOnline, subscribeOnline } from '../src/services/online';
import { subscribeChassisFlip } from '../src/services/chassisFlip';
import { ToolIntroHost } from './ToolIntroCard';
import { ScreensaverOverlay } from './ScreensaverOverlay';
import { DEVICE_FOOTER_BOTTOM_PAD, DEVICE_FOOTER_RESERVATION, DEVICE_FRAME_BOX, DEVICE_FRAME_STAGE } from '../src/services/deviceFrame';
import { isSitePath } from '../src/services/appRoutes';
import { CHASSIS_SKINS, SITE_SKIN, grilleShape, skinCssVars } from '../src/services/theme';
import ChassisGrille from './ChassisGrille';
import ChassisInternals from './ChassisInternals';
// Lazy: the plate reads the passport (and so the catalogue) on mount, and
// the chassis must not carry those modules for the one screen in fifty that
// gets turned over. It is only mounted after the first flip anyway.
const DeviceBackPanel = lazy(() => import('./DeviceBackPanel'));
import { useTheme } from '../src/services/useTheme';

interface DeviceLayoutProps {
  children: React.ReactNode;
  title: string;
  /** Paint the studio's chassis regardless of the path — for the NOT FOUND
   *  screen, whose URL is by definition in neither product's list (v0.6.20). */
  site?: boolean;
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
   * Every company-site screen turns them off — they are in-app controls, and
   * the site is not the app.
   */
  showSystemButtons?: boolean;
}


const DeviceLayout: React.FC<DeviceLayoutProps> = ({
  children,
  title,
  site,
  subtitle: _subtitle,
  onBack,
  showBack = false,
  onHome,
  hideHeader = false,
  centerHeaderText: _centerHeaderText = false,
  footerCenter,
  isFlipped: isFlippedProp = false,
  backFace: backFaceProp,
  onTitleTap: onTitleTapProp,
  showSystemButtons = true,
  // `showWordmark` used to sit here, dead since iOS v0.6.9 retired the island
  // wordmark and kept only as call-site compatibility for the splash. The
  // splash is gone with the fork (v8#1) and it was that prop's only caller, so
  // the prop is gone with it rather than left as a switch that does nothing.
}) => {
  // Which lamp is being pointed, or null. State lives here rather than in the
  // band because the chooser is drawn in the LCD and the button that raises it
  // is on the chassis — iOS holds `lampBeingAssigned` at exactly this level for
  // exactly this reason.
  const [lampSlot, setLampSlot] = useState<number | null>(null);

  /*
   * Which product is drawing the device right now (v8#4, #7, #8).
   *
   * **Read from the route rather than taken as a prop, deliberately.** Three
   * separate things about the shell differ between the company site and the
   * app — the skin, the bezel wordmark and the marquee panel — and a prop for
   * each is three chances for a new site screen to forget one and render as a
   * half-dex. The route already knows, `appRoutes.ts` already answers, and the
   * answer cannot be got wrong at a call site that does not exist.
   *
   * `showSystemButtons` stays a prop: it predates this, every site screen
   * already passes it, and it is the flag `DeviceFooter`'s separation tests are
   * written against.
   */
  const { pathname } = useLocation();
  const onSite = site ?? isSitePath(pathname);
  // The one network fact the LCD shows (v0.6.21): a pill while the browser
  // says it is offline. Server-side and in jsdom it reads as online.
  const online = React.useSyncExternalStore(subscribeOnline, isOnline, () => true);

  // The player's own shell, so the dex repaints when they pick a new one.
  const theme = useTheme();
  const skin = onSite ? SITE_SKIN : theme.skin;
  const translucent = !!CHASSIS_SKINS[skin].translucent;

  // The orb hold flips the device on every dex screen (v0.6.30), matching
  // iOS `DeviceChassis`, which owns the flip itself. A screen that passes its
  // own `backFace` stays in control; the rest get the steel plate for free.
  // The plate is only mounted after the first flip — it reads the passport
  // on mount, and most screens are never turned over.
  const [selfFlipped, setSelfFlipped] = useState(false);
  const [everFlipped, setEverFlipped] = useState(false);
  const controlled = backFaceProp !== undefined;
  const isFlipped = controlled ? isFlippedProp : selfFlipped;
  const onTitleTap = controlled
    ? onTitleTapProp
    : onSite
      ? undefined
      : () => {
          setEverFlipped(true);
          setSelfFlipped(true);
        };
  // SETTINGS > ABOUT > TURN THE DEVICE OVER, for people who were never going
  // to guess the orb (iOS AUDIT M21). Only the uncontrolled layout answers:
  // a screen that owns its flip owns all the ways into it.
  useEffect(() => {
    if (controlled || onSite) return;
    return subscribeChassisFlip(() => {
      setEverFlipped(true);
      setSelfFlipped(true);
    });
  }, [controlled, onSite]);
  const backFace = controlled
    ? backFaceProp
    : everFlipped && !onSite
      ? (
          <Suspense fallback={null}>
            <DeviceBackPanel onReturn={() => setSelfFlipped(false)} />
          </Suspense>
        )
      : undefined;
  // Nothing on the site, where the tokens are shadowed on the stage below;
  // nothing in the dex either, where `:root` already carries the same values.
  // Recomputed only when the shell changes.
  const skinVars = useMemo(() => (onSite ? skinCssVars(SITE_SKIN) : undefined), [onSite]);

  /**
   * Everything that is not the chooser, while the chooser is up (W-1).
   *
   * `aria-modal="true"` is a **claim about the surroundings**, not a styling
   * hint: it tells assistive technology that everything outside the dialog is
   * inert. The chooser's scrim only covers the LCD, so before this the claim
   * was false in a way a pointer could prove — with the chooser open you could
   * still click the SETTINGS cap and navigate away, or press the other lamp.
   * A screen reader was being told one thing while the device did another.
   *
   * Making it true beats withdrawing it: `inert` removes the subtree from hit
   * testing, from focus and from the accessibility tree in one attribute, so
   * the three surfaces outside the card — the island, the band, and the LCD
   * content behind the scrim — now behave the way the dialog says they do.
   * React 19 takes it as a boolean prop.
   */
  const behindChooser = lampSlot !== null;

  // Taller than the old single-row band: the footer stacks two controls in
  // each side well (iOS v0.6.9 button band), so it reserves room for a pair.
  //
  // The band is zoomed by the UI furniture setting, so the screen reserves its
  // resolved painted height rather than only the unscaled base measurement.
  const footerReservation = DEVICE_FOOTER_RESERVATION;
  const footerBottomPad = DEVICE_FOOTER_BOTTOM_PAD;

  return (
    // `device-stage` (index.css) is the desktop backdrop — key light,
    // vignette, floor sheen, all as background layers so nothing can sit in
    // front of the frame or catch a click. Below `md` it is the flat
    // neutral-900 it replaced. The corner rounding comes off at `md`: a
    // stage is not a card, and the 2rem clip was showing the page background
    // through the window's corners.
    <div
      className={`${DEVICE_FRAME_STAGE} min-h-screen device-stage font-mono h-screen md:h-auto overflow-hidden rounded-[2rem] md:rounded-none`}
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
        perspective: '2000px',
        // The site's CLASSIC override (v8#4). Custom properties inherit, so
        // declaring them here shadows `:root` for this subtree and for nothing
        // else — the stored skin is never written to, and survives untouched.
        ...skinVars,
      }}
    >
      {/* 3D flip container — wraps both faces of the device */}
      <div
        className={`relative ${DEVICE_FRAME_BOX} ${onSite ? 'site-device-frame' : ''}`}
        style={{
          transformStyle: 'preserve-3d',
          transition: 'transform 700ms cubic-bezier(0.4, 0, 0.2, 1)',
          // Keep the live LCD out of a 3D compositor layer until the user
          // actually flips the chassis. Chromium can drop wheel scrolling on
          // nested overflow regions inside an identity 3D transform at the
          // desktop breakpoint, even though touch scrolling still works.
          transform: isFlipped ? 'rotateY(180deg)' : 'none',
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
              see theme.ts; the LCD inside it never changes with the skin.

              **Matte, not gloss (stage 3, v9#s1).** The shell used to carry a
              `-10px -10px 30px` diagonal inset — a corner sheen that read as
              wet plastic — and, above `md`, a single hard drop shadow that
              REPLACED it: two `shadow-*` utilities on one element resolve to
              one `box-shadow`, and the responsive one wins, so the desktop
              shell had no inset finish at all. Both faces now wear the same
              matte treatment — a hairline of light on the top edge and a soft
              falloff at the bottom, which is what a moulded part looks like
              under one light from above. The desktop adds a layered ground
              shadow (a tight contact layer plus a wide ambient one, the
              elevation language's shape rather than a single hard drop) so
              the device sits on the stage instead of floating in front of
              it. */}
          <div
            className="w-full h-full md:rounded-[2.5rem] overflow-hidden relative border-[3px] ring-1 ring-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.10),inset_0_-14px_28px_rgba(0,0,0,0.16)] md:shadow-[0_28px_56px_-16px_rgba(0,0,0,0.55),0_10px_20px_-10px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.10),inset_0_-14px_28px_rgba(0,0,0,0.16)]"
            style={{
              // A clear shell is a tinted window onto the board beneath it
              // (v0.6.30, iOS `DeviceChassis.frontFace`): the ground goes on
              // the moulding, the internals sit on it, and the body colour
              // — an rgba for every translucent skin — is laid over both.
              backgroundColor: translucent ? '#14161A' : 'var(--chassis-body)',
              backgroundImage: translucent ? undefined : 'var(--chassis-pattern, none)',
              backgroundSize: '96px 96px',
              borderColor: 'var(--chassis-panel-edge)',
            }}
            data-translucent-shell={translucent ? 'on' : undefined}
          >
            {translucent && (
              <>
                <ChassisInternals />
                <div
                  className="absolute inset-0 pointer-events-none"
                  aria-hidden="true"
                  style={{
                    backgroundColor: 'var(--chassis-body)',
                    backgroundImage: 'var(--chassis-pattern, none)',
                    backgroundSize: '96px 96px',
                  }}
                />
              </>
            )}
            <div className="relative flex h-full flex-col">
        
        {/* The studio site gives its full chassis face to the LCD. Vinodex
            keeps the island hardware and its established portrait geometry. */}
        {!hideHeader && !onSite && <ChassisIsland onTitleTap={onTitleTap} inert={behindChooser} />}

        {/* Screen Container */}
        <div
          className={`device-screen-space flex-1 min-h-0 ${onSite ? 'site-device-screen-space' : ''}`}
          style={{ paddingBottom: onSite ? footerBottomPad : footerReservation }}
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
            className="chamfered-panel h-full flex flex-col relative m-2 mt-0"
            style={{
              '--panel-fill': 'var(--chassis-panel)',
              '--panel-edge': 'var(--chassis-panel-edge)',
              boxShadow:
                '0 0 6px var(--chassis-rim-glow, transparent), 0 0 16px var(--chassis-rim-glow, transparent)',
            } as React.CSSProperties}
          >

          {/* The two housing lamps. Fixed red on every shell, matching iOS's
              `ventDot` -- these are the chassis's plain power/link indicators,
              not a skin surface, which is why they are the one group the
              twenty-two-shell table does not reach.

              **A6 reached them last (three fixes, one finding).** The web had
              them at 0.5rem against iOS's `ventDot` (0.65rem), with no halo at
              all, under a blanket `opacity-50` on the container. iOS draws a
              full-strength `Dex.red500` with a red halo at 80%, and its own
              note says why: "the red halo stays -- a lamp that is lit throws
              light on the plastic around it". Half-opacity plus no halo is
              exactly the printed-dot reading A6 exists to undo.

              The halo is 55% here against iOS's 80% (stage 3, v9#s3 — and §0
              is what lets the number differ): at 80% the pair read as warning
              lights rather than idle power indicators. Calmed, not deleted,
              so A6's "lit, not printed" reading survives; size and colour
              are untouched. */}
          <div className="relative flex items-center justify-center px-4 h-6 shrink-0">
            <div className="flex gap-2">
              {[0, 1].map(i => (
                <span
                  key={i}
                  className="recessed-lamp w-[0.65rem] h-[0.65rem] rounded-full bg-red-500"
                  style={{
                    border: '1px solid #991b1b',
                    '--lamp-size': '0.65rem',
                    '--lamp-halo': 'rgba(239,68,68,0.55)',
                  } as React.CSSProperties}
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
                  the LCD — see index.css; the chassis must not follow it.
                  `screen-enter` (stage 5, v0.4.4) is the screen transition:
                  each screen renders its own DeviceLayout, so navigation
                  remounts this node and the incoming content crossfades in
                  over the LCD page — the `DexMotion.crossfade` idea, expressed
                  as a mount animation because the outgoing screen has already
                  unmounted. The chassis around it never moves. */}
              <div
                className={`lcd-themed screen-enter relative z-0 h-full w-full overflow-hidden flex flex-col uppercase ${onSite ? 'site-pixel-copy' : ''}`}
                inert={behindChooser}
              >
                {onSite && showBack && onBack && (
                  <nav
                    aria-label="Screen navigation"
                    className="site-lcd-nav grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-[var(--surface-line)] bg-[var(--surface-raised)] px-3 py-2"
                  >
                    <button
                      type="button"
                      aria-label="Back"
                      onClick={onBack}
                      className="dex-pressable inline-flex min-h-11 w-fit items-center gap-1 rounded-control px-2 text-label tracking-widest text-[var(--lcd-accent)]"
                    >
                      <ChevronLeft size={18} aria-hidden="true" />
                      BACK
                    </button>
                    <span className="min-w-0 truncate text-center font-retro text-title tracking-widest text-[var(--lcd-text)] sm:text-display">
                      {title}
                    </span>
                    <span aria-hidden="true" />
                  </nav>
                )}
                {children}
                {!online && (
                  <span
                    role="status"
                    aria-live="polite"
                    data-offline-pill
                    className="pointer-events-none absolute right-2 top-2 z-[7] rounded-control border border-[var(--surface-line-strong)] bg-[var(--surface-raised)] px-2 py-1 font-retro text-micro tracking-widest text-[var(--lcd-accent)] shadow-elev-1"
                  >
                    OFFLINE
                  </span>
                )}
              </div>

              {/* Product-update invitation. It lives beside the routed LCD
                  content so it inherits the screen palette, clipping and
                  phosphor treatment instead of floating over the chassis. */}
              <IosUpdatesPromptOverlay />

              {/* The first-open card for a tool (v10#5). Before the boot
                  overlay in the tree, so a cold arrival on a tool route sees
                  the BIOS first and the card when it clears. Site routes and
                  spent tools render nothing. */}
              <ToolIntroHost />

              {/* The lamp-reassignment chooser.
                  Inside the LCD, above the screen and below the scanlines —
                  iOS's own slot (`DeviceChassis.swift:1156`) and its reason:
                  every overlay in this app is confined to the display, so it
                  is subject to the palette, the monochrome pass and the clip,
                  and reads as something this screen is doing rather than as a
                  sheet the browser put there.

                  `lcd-themed` for the same reason the content has it. z-5
                  puts it over the screen and under the scanlines at z-10. */}
              {lampSlot !== null && (
                <div className="lcd-themed absolute inset-0 z-[5] uppercase">
                  <MarqueeLampChooser slot={lampSlot} onClose={() => setLampSlot(null)} />
                </div>
              )}

              {/* Monochrome phosphor tint: grayscale lives on `.lcd-themed`;
                  this multiplies the tint over the whole LCD. Transparent in
                  colour modes, so a harmless no-op there. */}
              <div
                className="absolute inset-0 z-20 pointer-events-none"
                style={{ backgroundColor: 'var(--mono-tint, transparent)', mixBlendMode: 'multiply' }}
              />

              {/* Power-on belongs to this display, not to a second viewport-
                  sized device. The routed chassis stays visible while the
                  BIOS owns only the LCD. */}
              <VinodexBootOverlay />
              <ScreensaverOverlay />
            </div>

          </div>

          {/* Bottom strip (iOS v0.6.7+ `bottomVents`): the lone red lamp, the
              stretched wordmark — the device's one wordmark, moulded into the
              strip in the grille's own colour — and the grille slats.

              **Whose device it is (v8#7).** On the company site the moulding
              reads HORIZON/GODOT, because there the device is the studio's own
              hardware sitting on the desk and the app has not been opened yet.
              Inside the dex it reads VINODEX, as it always has. One wordmark,
              two owners, and the wordmark is how you can tell at a glance
              which one you are holding. */}
          <div className="bezel-bottom-strip shrink-0 relative h-7">
            {/* `bottomVentDot` (0.75rem), a shade over the pair on the bezel
                above: iOS's G3 makes them the same bulb at two sizes, and the
                bottom one is bigger because at `ventDot` "it read as a speck
                of dirt rather than as a lamp". */}
            <span
              className="bezel-bottom-light recessed-lamp absolute top-1/2 w-[0.75rem] h-[0.75rem] rounded-full bg-red-500"
              style={{
                border: '1px solid #991b1b',
                '--lamp-size': '0.75rem',
                '--lamp-halo': 'rgba(239,68,68,0.55)',
              } as React.CSSProperties}
            />
            <div className="absolute inset-0 flex min-w-0 items-center justify-center overflow-hidden px-20 pointer-events-none">
              {/* `bezel-wordmark` is a stable hook for the render gate, in the
                  house style of `.lamp-hit` / `.band-pills` / `.island-strip`.
                  The wordmark is `aria-hidden` moulding, so there is no
                  accessible name to select it by. */}
              <span
                aria-hidden="true"
                className="bezel-wordmark block max-w-full py-0.5 font-retro leading-[1.2] select-none whitespace-nowrap"
                style={{
                  color: 'var(--chassis-grill)',
                  opacity: 0.85,
                  fontSize: 'clamp(0.58rem, 2.6vw, 0.9rem)',
                  letterSpacing: '0.12em',
                }}
              >
                {onSite ? 'HORIZON/GODOT' : 'VINODEX'}
              </span>
            </div>
            {/* The grille, in whichever pattern the workshop fitted (v0.5.0).
                The site's device is always the stock CLASSIC, slats and all —
                the same rule as its skin override. `bezel-grill` and the
                absolute centring are the bezel's own contract (site.spec
                measures it, and in flow it would push the wordmark down). */}
            <ChassisGrille
              shape={onSite ? 'SLATS' : grilleShape()}
              className="bezel-grill absolute top-1/2 -translate-y-1/2"
            />
          </div>

        </div>
        </div>
        </div>

        {!onSite && (
          <DeviceFooter
            inert={behindChooser}
            onReassignLamp={setLampSlot}
            title={title}
            skin={skin}
            footerCenter={footerCenter}
            onBack={onBack}
            showBack={showBack}
            onHome={onHome}
            showSystemButtons={showSystemButtons}
          />
        )}
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
