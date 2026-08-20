
import React, { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import ChassisIsland from './ChassisIsland';
import DeviceFooter from './DeviceFooter';
import MarqueeLampChooser from './MarqueeLampChooser';
import { DEVICE_FRAME_BOX, DEVICE_FRAME_STAGE } from '../src/services/deviceFrame';
import { SITE_MARQUEE_TITLE, isSitePath } from '../src/services/appRoutes';
import { SITE_SKIN, skinCssVars } from '../src/services/theme';
import { useTheme } from '../src/services/useTheme';

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
   * Every company-site screen turns them off — they are in-app controls, and
   * the site is not the app.
   */
  showSystemButtons?: boolean;
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
  const onSite = isSitePath(pathname);

  // The player's own shell, so the dex repaints when they pick a new one.
  const theme = useTheme();
  const skin = onSite ? SITE_SKIN : theme.skin;
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

  // Taller than the old single-row band: the footer now stacks two controls in
  // each side well (iOS v0.6.9 button band), so it reserves room for a pair.
  const footerHeight = '8.5rem';
  const footerBottomPad = 'max(0.5rem, env(safe-area-inset-bottom))';

  return (
    <div
      className={`${DEVICE_FRAME_STAGE} min-h-screen bg-neutral-900 font-mono h-screen md:h-auto overflow-hidden rounded-[2rem]`}
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
        className={`relative ${DEVICE_FRAME_BOX}`}
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
        
        {!hideHeader && <ChassisIsland onTitleTap={onTitleTap} inert={behindChooser} />}

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
              exactly the printed-dot reading A6 exists to undo. */}
          <div className="relative flex items-center justify-center px-4 h-6 shrink-0">
            <div className="flex gap-2">
              {[0, 1].map(i => (
                <span
                  key={i}
                  className="recessed-lamp w-[0.65rem] h-[0.65rem] rounded-full bg-red-500"
                  style={{
                    border: '1px solid #991b1b',
                    '--lamp-size': '0.65rem',
                    '--lamp-halo': 'rgba(239,68,68,0.8)',
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
                  the LCD — see index.css; the chassis must not follow it. */}
              <div
                className="lcd-themed relative z-0 h-full w-full overflow-hidden flex flex-col uppercase"
                inert={behindChooser}
              >
                {children}
              </div>

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
          <div className="shrink-0 relative flex items-center gap-3 px-4 h-7">
            {/* `bottomVentDot` (0.75rem), a shade over the pair on the bezel
                above: iOS's G3 makes them the same bulb at two sizes, and the
                bottom one is bigger because at `ventDot` "it read as a speck
                of dirt rather than as a lamp". */}
            <span
              className="recessed-lamp w-[0.75rem] h-[0.75rem] rounded-full bg-red-500 shrink-0"
              style={{
                border: '1px solid #991b1b',
                '--lamp-size': '0.75rem',
                '--lamp-halo': 'rgba(239,68,68,0.8)',
              } as React.CSSProperties}
            />
            <div className="flex-1 min-w-0 flex justify-center overflow-hidden">
              {/* `bezel-wordmark` is a stable hook for the render gate, in the
                  house style of `.lamp-hit` / `.band-pills` / `.island-strip`.
                  The wordmark is `aria-hidden` moulding, so there is no
                  accessible name to select it by, and finding it in the span
                  soup by its `scaleX` transform is a selector that breaks the
                  first time anything else on the bezel is stretched. */}
              <span
                aria-hidden="true"
                className="bezel-wordmark font-retro leading-none select-none whitespace-nowrap"
                style={{
                  color: 'var(--chassis-grill)',
                  opacity: 0.85,
                  fontSize: 'clamp(0.65rem, 3vw, 1rem)',
                  letterSpacing: '0.12em',
                  transform: 'scaleX(1.3)',
                  display: 'inline-block',
                }}
              >
                {onSite ? 'HORIZON/GODOT' : 'VINODEX'}
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

        <DeviceFooter
          inert={behindChooser}
          onReassignLamp={setLampSlot}
          title={title}
          // The site's panel is one word (v8#8). The dex's rotating script —
          // WELCOME! once per launch, MENU at rest, the nine toasts after a
          // minute idle — is a dex behaviour and stays entirely in
          // `marqueeScript.ts`, armed only on the main menu.
          marqueeTitle={onSite ? SITE_MARQUEE_TITLE : undefined}
          skin={skin}
          footerCenter={footerCenter}
          onBack={onBack}
          showBack={showBack}
          onHome={onHome}
          showSystemButtons={showSystemButtons}
        />
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
