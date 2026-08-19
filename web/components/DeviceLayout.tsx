
import React, { useState } from 'react';
import ChassisIsland from './ChassisIsland';
import DeviceFooter from './DeviceFooter';
import MarqueeLampChooser from './MarqueeLampChooser';

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
  // Which lamp is being pointed, or null. State lives here rather than in the
  // band because the chooser is drawn in the LCD and the button that raises it
  // is on the chassis — iOS holds `lampBeingAssigned` at exactly this level for
  // exactly this reason.
  const [lampSlot, setLampSlot] = useState<number | null>(null);

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
        
        {!hideHeader && <ChassisIsland onTitleTap={onTitleTap} />}

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
              <div className="lcd-themed relative z-0 h-full w-full overflow-hidden flex flex-col uppercase">
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
              stretched VINODEX wordmark — the device's one wordmark, moulded
              into the strip in the grille's own colour — and the grille slats. */}
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

        <DeviceFooter
          onReassignLamp={setLampSlot}
          title={title}
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
