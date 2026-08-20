import React, { useState } from 'react';
import { Grip, Globe, Leaf, Search, Wine } from 'lucide-react';
import DeviceLayout from './DeviceLayout';
import DeviceBackPanel from './DeviceBackPanel';
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

const DialTile: React.FC<{
  quadrant: Quadrant;
  label: string;
  icon: React.ReactNode;
  face: string;
  shadow: string;
  onClick: () => void;
  /** Walkthrough anchor: the spotlight cuts its hole from this tile's rect. */
  coachmark?: string;
}> = ({ quadrant, label, icon, face, shadow, onClick, coachmark }) => (
  <button
    onClick={onClick}
    data-coachmark={coachmark}
    className="relative flex flex-col items-center justify-center group overflow-hidden transition-[filter,transform] active:brightness-90"
    style={{ backgroundColor: face, boxShadow: `inset 0 -5px 0 ${shadow}`, ...tileMask(quadrant) }}
  >
    <span className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
    <span className="text-white mb-2 group-hover:scale-110 transition-transform drop-shadow-md">{icon}</span>
    <span className="font-retro text-sm sm:text-lg text-white tracking-widest drop-shadow-md">{label}</span>
  </button>
);

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
      <div className="flex-1 min-h-0 w-full flex items-center justify-center bg-[var(--lcd-page)] relative overflow-hidden p-4">
        {/* Retro grid background */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(50, 255, 50, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(50, 255, 50, 0.3) 1px, transparent 1px)',
            backgroundSize: '30px 30px',
          }}
        />

        {/* The moulded housing the four tiles are set into. */}
        <div
          className="relative z-10 rounded-[2.4rem] border-2 border-black/35 shadow-[0_6px_14px_rgba(0,0,0,0.35)]"
          style={
            {
              width: 'min(92%, 26rem)',
              aspectRatio: '1',
              padding: 'var(--dial-inset)',
              backgroundColor: 'color-mix(in srgb, var(--lcd-page) 55%, transparent)',
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
            <DialTile coachmark="menuTile" quadrant="tl" label="GRAPES" face="#a855f7" shadow="#6b21a8" icon={<Grip className="w-11 h-11 sm:w-14 sm:h-14" />} onClick={() => onNavigate('GRAPES')} />
            <DialTile quadrant="tr" label="REGIONS" face="#22c55e" shadow="#15803d" icon={<Globe className="w-11 h-11 sm:w-14 sm:h-14" />} onClick={() => onNavigate('REGIONS')} />
            <DialTile quadrant="bl" label="STYLES" face="#f97316" shadow="#9a3412" icon={<Wine className="w-11 h-11 sm:w-14 sm:h-14" />} onClick={() => onNavigate('STYLES')} />
            <DialTile quadrant="br" label="FLAVORS" face="#10b981" shadow="#065f46" icon={<Leaf className="w-11 h-11 sm:w-14 sm:h-14" />} onClick={() => onNavigate('FLAVORS')} />
          </div>

          {/* The search hub, over the centre and concentric with the scoops. */}
          <button
            onClick={() => onNavigate('MASTER_SEARCH')}
            aria-label="Search"
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-dex-yellow border-[6px] border-yellow-600 shadow-[0_0_25px_rgba(250,204,21,0.4)] flex items-center justify-center active:scale-95 active:border-yellow-700 transition-all overflow-hidden group hover:bg-yellow-300 z-20"
            style={{ width: 'var(--dial-center)', height: 'var(--dial-center)' }}
          >
            <span className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
            <Search className="text-yellow-900 relative z-10 group-hover:scale-110 transition-transform w-2/5 h-2/5" />
          </button>
        </div>
      </div>
    </DeviceLayout>
  );
};

export default MainMenu;
