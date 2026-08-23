import React, { useState } from 'react';
import { Grip, Globe, Leaf, Search, Wine } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
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
 * the gap around the button reads as the same channel as between the tiles. In
 * CSS that circle is a radial-gradient mask keyed to each tile's inner corner.
 */

type Quadrant = 'tl' | 'tr' | 'bl' | 'br';

// Where the dial's centre sits relative to each tile (its inner corner), used
// both for the scoop mask origin and to round the opposite (outer) corner.
const SCOOP_AT: Record<Quadrant, string> = {
  tl: '100% 100%',
  tr: '0% 100%',
  bl: '100% 0%',
  br: '0% 0%',
};
const OUTER_RADIUS: Record<Quadrant, string> = {
  tl: 'var(--dial-corner) 0 0 0',
  tr: '0 var(--dial-corner) 0 0',
  bl: '0 0 0 var(--dial-corner)',
  br: '0 0 var(--dial-corner) 0',
};

const tileMask = (q: Quadrant): React.CSSProperties => {
  const mask = `radial-gradient(circle var(--dial-scoop) at ${SCOOP_AT[q]}, transparent calc(var(--dial-scoop) - 0.5px), #000 var(--dial-scoop))`;
  return {
    borderRadius: OUTER_RADIUS[q],
    WebkitMaskImage: mask,
    maskImage: mask,
  };
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
const DIAL: { quadrant: Quadrant; label: string; livery: Livery; icon: LucideIcon; category: EntryCategory }[] = [
  { quadrant: 'tl', label: 'GRAPES', livery: 'violet', icon: Grip, category: 'GRAPES' },
  { quadrant: 'tr', label: 'REGIONS', livery: 'green', icon: Globe, category: 'REGIONS' },
  { quadrant: 'bl', label: 'STYLES', livery: 'orange', icon: Wine, category: 'STYLES' },
  { quadrant: 'br', label: 'FLAVORS', livery: 'emerald', icon: Leaf, category: 'FLAVORS' },
];

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
      <div className="flex-1 min-h-0 w-full flex items-stretch justify-stretch bg-[var(--surface-base)] relative overflow-hidden p-2 sm:p-3">
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
          className="main-menu-dial relative z-10 h-full w-full min-h-0 rounded-[2.4rem] border border-[var(--surface-line)] shadow-elev-2"
          style={
            {
              padding: 'var(--dial-inset)',
              backgroundColor: 'var(--surface-sunken)',
              // Dial geometry — one set of numbers so the scoops and the button
              // stay concentric (iOS: channel 9, centre 116, scoop = centre/2 + channel).
              '--dial-channel': '8px',
              '--dial-center': 'clamp(5rem, 27%, 7.5rem)',
              '--dial-scoop': 'calc(var(--dial-center) / 2 + var(--dial-channel))',
              '--dial-corner': '1.9rem',
              '--dial-inset': '6px',
            } as React.CSSProperties
          }
        >
          {/* 2×2 cluster, channel-gapped. */}
          <div
            className="grid h-full w-full"
            style={{ gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 'var(--dial-channel)' }}
          >
            {DIAL.map(t => (
              <Tile
                key={t.label}
                coachmark={t.quadrant === 'tl' ? 'menuTile' : undefined}
                livery={t.livery}
                label={t.label}
                onClick={() => onNavigate(t.category)}
                icon={<t.icon className="w-11 h-11 sm:w-14 sm:h-14" aria-hidden="true" />}
                bareIcon
                // The quadrant supplies its own outer radius and its concave
                // inner scoop, so the card's rectangle and hairline would both
                // fight the shape -- and the mask clips to the border box, so
                // the focus ring has to be drawn inside or it is masked away
                // and a keyboard user gets nothing. `clipped` is both.
                // Elevation goes too: a tile set INTO a housing does not cast
                // a shadow onto it.
                clipped
                elevation={0}
                className="main-menu-tile"
                style={{
                  ...tileMask(t.quadrant),
                  backgroundColor: 'var(--tint-solid)',
                  color: 'var(--lcd-text)',
                }}
              />
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
              + 'rounded-full border-[3px] border-[var(--tint-solid)] bg-[var(--tint-subtle)] '
              + 'text-[var(--lcd-text)] shadow-elev-3 flex items-center justify-center group z-20'
            }
            style={
              {
                width: 'var(--dial-center)',
                height: 'var(--dial-center)',
                '--tint': 'var(--livery-amber)',
                backgroundColor: 'var(--tint-solid)',
              } as React.CSSProperties
            }
          >
            <Search aria-hidden="true" className="w-2/5 h-2/5 transition-transform duration-200 group-hover:scale-110" />
          </button>
        </div>
      </div>
    </DeviceLayout>
  );
};

export default MainMenu;
