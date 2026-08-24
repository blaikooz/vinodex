import React, { useId, useLayoutEffect, useRef, useState } from 'react';
import DeviceLayout from './DeviceLayout';
import DeviceBackPanel from './DeviceBackPanel';
import { Tile } from './Card';
import type { Livery } from './Card';
import { EntryCategory } from '@/shared/types';

interface MainMenuProps {
  onNavigate: (category: EntryCategory) => void;
  /**
   * Backing out past the menu (v8#9).
   *
   * The menu had no Back at all, because under the old model there was nothing
   * above it worth returning to — Back would have landed on a DEX / WEBSITE
   * fork nobody wanted to see twice. The site is what the app sits on now, so
   * the top of the app has somewhere to go: out of it.
   */
  onExit: () => void;
}

/**
 * The main menu as a **dial** (iOS v0.8.4 `MainMenuScreen`): four category
 * tiles set into a dark moulded housing, each rounded on its outer corner and
 * concavely *scooped* on its inner corner, with the search button sitting over
 * the centre — a moulded four-way pad rather than four loose tiles.
 *
 * The scoop is a circle of radius `centre/2 + channel` centred on the dial, so
 * the gap around the button reads as the same channel as between the tiles.
 * Responsive SVG clip paths reproduce iOS's tangent fillets rather than
 * subtracting a hard circle and leaving a pair of sharp cusps on every tile.
 */

type Quadrant = 'tl' | 'tr' | 'bl' | 'br';

// iOS `MainMenuScreen`'s fixed moulded dimensions. These are physical parts,
// not percentages of the LCD: keeping one table makes the button, channel and
// four concave scoops stay concentric at every web viewport.
const DIAL_GEOMETRY = {
  channel: 9,
  centerDiameter: 116,
  outerCorner: 30,
  housingInset: 6,
} as const;

const SCOOP = DIAL_GEOMETRY.centerDiameter / 2 + DIAL_GEOMETRY.channel;

/**
 * The top-left tile path from iOS `ScoopedTile`, expressed as SVG commands.
 *
 * A circle subtracted from a rounded rectangle leaves two sharp cusps. iOS
 * joins that concave arc to the straight edges with small convex fillets; the
 * extra pair of arcs is why its four tiles visibly flow around Search while
 * the old CSS radial mask looked like four rectangles hidden under a circle.
 */
const scoopedPath = (width: number, height: number): string => {
  const r = Math.min(DIAL_GEOMETRY.outerCorner, width / 2, height / 2);
  const halfChannel = DIAL_GEOMETRY.channel / 2;
  const centre = { x: width + halfChannel, y: height + halfChannel };
  const fillet = Math.min(SCOOP * 0.22, Math.min(width, height) / 6);
  const inner = fillet + halfChannel;
  const outer = SCOOP + fillet;
  const tangent = Math.sqrt(Math.max(0, outer * outer - inner * inner));
  const onRight = { x: width, y: centre.y - tangent };
  const onBottom = { x: centre.x - tangent, y: height };
  const rightCentre = { x: width - fillet, y: onRight.y };
  const bottomCentre = { x: onBottom.x, y: height - fillet };
  const rightAngle = Math.atan2(centre.y - rightCentre.y, centre.x - rightCentre.x);
  const bottomAngle = Math.atan2(centre.y - bottomCentre.y, centre.x - bottomCentre.x);
  const biteStart = {
    x: rightCentre.x + Math.cos(rightAngle) * fillet,
    y: rightCentre.y + Math.sin(rightAngle) * fillet,
  };
  const biteEnd = {
    x: bottomCentre.x + Math.cos(bottomAngle) * fillet,
    y: bottomCentre.y + Math.sin(bottomAngle) * fillet,
  };
  const n = (value: number) => value.toFixed(2);

  return [
    `M ${n(r)} 0`,
    `L ${n(width - r)} 0`,
    `A ${n(r)} ${n(r)} 0 0 1 ${n(width)} ${n(r)}`,
    `L ${n(onRight.x)} ${n(onRight.y)}`,
    `A ${n(fillet)} ${n(fillet)} 0 0 1 ${n(biteStart.x)} ${n(biteStart.y)}`,
    `A ${SCOOP} ${SCOOP} 0 0 0 ${n(biteEnd.x)} ${n(biteEnd.y)}`,
    `A ${n(fillet)} ${n(fillet)} 0 0 1 ${n(onBottom.x)} ${n(onBottom.y)}`,
    `L ${n(r)} ${n(height)}`,
    `A ${n(r)} ${n(r)} 0 0 1 0 ${n(height - r)}`,
    `L 0 ${n(r)}`,
    `A ${n(r)} ${n(r)} 0 0 1 ${n(r)} 0`,
    'Z',
  ].join(' ');
};

const MIRROR: Record<Quadrant, (width: number, height: number) => string | undefined> = {
  tl: () => undefined,
  tr: width => `translate(${width} 0) scale(-1 1)`,
  bl: (_width, height) => `translate(0 ${height}) scale(1 -1)`,
  br: (width, height) => `translate(${width} ${height}) scale(-1 -1)`,
};

const CONTENT_SHIFT: Record<Quadrant, [string, string]> = {
  tl: ['-0.38rem', '-0.45rem'],
  tr: ['0.38rem', '-0.45rem'],
  bl: ['-0.38rem', '0.45rem'],
  br: ['0.38rem', '0.45rem'],
};

/**
 * The four categories, as one table (v0.4.0, m5).
 *
 * The liveries are `DexTileLivery`'s and the assignment is iOS's own
 * (`MainMenuScreen.swift:113-131`): GRAPES violet, REGIONS green, STYLES
 * orange, FLAVORS emerald. The *concept* is shared and stays shared; only
 * the drawing splits.
 *
 * What the table replaces is eight hexes spelled across four call sites --
 * `face="#a855f7" shadow="#6b21a8"` and three more -- with no light-mode
 * value anywhere, which is why this screen drew dark-mode faces on all five
 * pale screen modes. The livery names resolve through `index.css`, which
 * carries both halves.
 *
 * REGIONS green and FLAVORS emerald are two greens next to each other, and
 * they are two greens on the phone too. Left as iOS has it rather than
 * quietly re-hued: the assignment is one of the shared ideas, and changing it
 * is a product decision, not a presentation one. Flagged in the ledger.
 */
type DialItem = { quadrant: Quadrant; label: string; livery: Livery; iconName: string; iconSrc: string; category: EntryCategory };

const DIAL: DialItem[] = [
  { quadrant: 'tl', label: 'GRAPES', livery: 'violet', iconName: 'grapes', iconSrc: '/art/button/grapes.png', category: 'GRAPES' },
  { quadrant: 'tr', label: 'REGIONS', livery: 'green', iconName: 'regions', iconSrc: '/art/button/regions.png', category: 'REGIONS' },
  { quadrant: 'bl', label: 'STYLES', livery: 'orange', iconName: 'styles', iconSrc: '/art/button/styles.png', category: 'STYLES' },
  { quadrant: 'br', label: 'FLAVORS', livery: 'emerald', iconName: 'flavors', iconSrc: '/art/button/flavors.png', category: 'FLAVORS' },
];

const DialTile: React.FC<{ item: DialItem; onNavigate: (category: EntryCategory) => void }> = ({ item, onNavigate }) => {
  const host = useRef<HTMLDivElement>(null);
  const clipId = `dial-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const [size, setSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const node = host.current;
    if (!node) return undefined;
    const measure = () => {
      const rect = node.getBoundingClientRect();
      setSize(previous => (
        Math.abs(previous.width - rect.width) < 0.5 && Math.abs(previous.height - rect.height) < 0.5
          ? previous
          : { width: rect.width, height: rect.height }
      ));
    };
    measure();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const hasClip = size.width > 0 && size.height > 0;
  const [shiftX, shiftY] = CONTENT_SHIFT[item.quadrant];

  return (
    <div ref={host} className="relative min-h-0 min-w-0">
      {hasClip && (
        <svg aria-hidden="true" className="pointer-events-none absolute h-0 w-0 overflow-hidden">
          <defs>
            <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
              <path
                d={scoopedPath(size.width, size.height)}
                transform={MIRROR[item.quadrant](size.width, size.height)}
              />
            </clipPath>
          </defs>
        </svg>
      )}
      <Tile
        coachmark={item.quadrant === 'tl' ? 'menuTile' : undefined}
        livery={item.livery}
        label={item.label}
        onClick={() => onNavigate(item.category)}
        icon={(
          <img
            src={item.iconSrc}
            alt=""
            data-menu-icon={item.iconName}
            className="main-menu-icon h-16 w-16 object-contain drop-shadow-[0_3px_0_rgba(0,0,0,0.28)] sm:h-20 sm:w-20"
            style={{ imageRendering: 'pixelated' }}
          />
        )}
        bareIcon
        clipped
        elevation={0}
        className="main-menu-tile h-full w-full"
        style={{
          clipPath: hasClip ? `url(#${clipId})` : undefined,
          WebkitClipPath: hasClip ? `url(#${clipId})` : undefined,
          backgroundColor: 'var(--tint-solid)',
          color: 'var(--lcd-text)',
          '--dial-shift-x': shiftX,
          '--dial-shift-y': shiftY,
        } as React.CSSProperties}
      />
    </div>
  );
};

const MainMenu: React.FC<MainMenuProps> = ({ onNavigate, onExit }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <DeviceLayout
      title="VINODEX"
      subtitle=""
      showBack
      onBack={onExit}
      onHome={() => {}}
      isFlipped={isFlipped}
      onTitleTap={() => setIsFlipped(true)}
      backFace={<DeviceBackPanel onReturn={() => setIsFlipped(false)} />}
    >
      <div className="flex-1 min-h-0 w-full flex items-stretch justify-stretch bg-[var(--surface-base)] relative overflow-hidden p-0.5">
        {/* The grid wash, from the mode's own accent rather than a fixed
            phosphor green -- see the same note in `WebsitePortal`, which keeps
            its own copy because the site and the dex share a chassis and
            nothing else. */}
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(color-mix(in oklab, var(--lcd-accent) 55%, transparent) 1px, transparent 1px), '
              + 'linear-gradient(90deg, color-mix(in oklab, var(--lcd-accent) 55%, transparent) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* The moulded housing the four tiles are set into.

            The housing keeps its own corner (`--dial-corner`) and its
            geometry: the dial is one of the shared *ideas*, and the scoops
            being concentric with the button is a fact about the shape, not a
            style. What changed is its materials -- the hairline is the
            surface ramp's own line colour instead of `black/35`, and the drop
            is `--shadow-elev-2` instead of a hand-written `0 6px 14px`. */}
        <div
          className="main-menu-dial relative z-10 h-full w-full min-h-0 border-2 shadow-elev-2"
          style={
            {
              padding: 'var(--dial-inset)',
              backgroundColor: 'var(--surface-sunken)',
              borderColor: 'color-mix(in oklab, var(--surface-line) 70%, black)',
              borderRadius: `${DIAL_GEOMETRY.outerCorner + DIAL_GEOMETRY.housingInset}px`,
              // Dial geometry — one set of numbers so the scoops and the button
              // stay concentric (iOS: channel 9, centre 116, scoop = centre/2 + channel).
              '--dial-channel': `${DIAL_GEOMETRY.channel}px`,
              '--dial-center': `${DIAL_GEOMETRY.centerDiameter}px`,
              '--dial-inset': `${DIAL_GEOMETRY.housingInset}px`,
            } as React.CSSProperties
          }
        >
          {/* 2×2 cluster, channel-gapped. */}
          <div
            className="grid h-full w-full"
            style={{ gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 'var(--dial-channel)' }}
          >
            {DIAL.map(item => (
              <DialTile key={item.label} item={item} onNavigate={onNavigate} />
            ))}
          </div>

          {/* The search hub, over the centre and concentric with the scoops.

              Same construction as a tile's icon chip -- amber well, ink glyph
              -- so the dial reads as one system rather than four tiles plus a
              button from somewhere else. It is the primary action, so it gets
              the one saturated ring on the screen and the overlay elevation.

              The `animate-pulse` white wash it used to wear is gone. An
              infinite pulse on a control that is always available says
              "something is happening here" when nothing is, and it was one of
              the two things on this screen that moved on their own. */}
          <button
            type="button"
            onClick={() => onNavigate('MASTER_SEARCH')}
            aria-label="Search"
            className={
              'main-menu-search dex-tint dex-pressable absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 '
              + 'rounded-full border-[6px] border-[var(--tint-border)] bg-[var(--tint-subtle)] '
              + 'text-[var(--lcd-text)] shadow-elev-3 flex items-center justify-center group z-20'
            }
            style={
              {
                width: 'var(--dial-center)',
                height: 'var(--dial-center)',
                '--tint': 'var(--livery-amber)',
                backgroundColor: 'var(--tint-solid)',
                boxShadow: '0 0 0.45rem color-mix(in oklab, var(--tint-solid) 40%, transparent), var(--shadow-elev-3)',
              } as React.CSSProperties
            }
          >
            <img
              src="/art/button/search.png"
              alt=""
              aria-hidden="true"
              data-menu-icon="search"
              className="h-[56%] w-[56%] transition-transform duration-200 group-hover:scale-110"
              style={{ imageRendering: 'pixelated' }}
            />
          </button>
        </div>
      </div>
    </DeviceLayout>
  );
};

export default MainMenu;
