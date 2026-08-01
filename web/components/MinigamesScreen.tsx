import React from 'react';
import { Sparkles, ScanSearch, MoonStar, Filter, BadgeCheck, Flame } from 'lucide-react';
import DeviceLayout from './DeviceLayout';

interface MinigamesScreenProps {
  onScanner: () => void;
  onChipFilter: () => void;
  onQuiz: () => void;
  onDailyChallenge: () => void;
  onDailyGrape: () => void;
  onMoonDial: () => void;
  onBack: () => void;
  onHome: () => void;
}

interface TileProps {
  title: string;
  /** Filled tile face + 6px extrusion + ink, mirroring iOS `ToolsScreen.tile`
   *  and the web SETTINGS grid's `FeatureTile`. */
  face: string;
  shadow: string;
  ink: string;
  icon: React.ReactNode;
  onClick: () => void;
}

/**
 * The Tools hub, ported from `vinodex-ios/Sources/VinodexUI/ToolsScreen.swift`.
 *
 * Square glyph-over-label tiles in the iOS 3×2 order: SCANNER, FILTER SEARCH,
 * WINE EXAM, DAILY CHALLENGE, WHAT'S THAT…?, MOON DIAL — so the two apps read as
 * one product. Reached from the Settings TOOLS tile.
 *
 * Each tile is a filled colour face with a 6px bottom extrusion — the same
 * look as the SETTINGS grid's `FeatureTile` (SettingsPanel.tsx) — using the
 * per-tool faces/shadows/inks from iOS `ToolsScreen`. Yellow and cyan faces
 * take a dark ink; white is unreadable on either.
 */
const Tile: React.FC<TileProps> = ({ title, face, shadow, ink, icon, onClick }) => (
  <button
    onClick={onClick}
    className="aspect-square flex flex-col items-center justify-center gap-3 rounded-xl transition-all active:translate-y-1 active:border-b-0"
    style={{ backgroundColor: face, borderBottom: `6px solid ${shadow}`, color: ink }}
  >
    <span style={{ color: ink }}>{icon}</span>
    <span className="font-retro text-[0.6rem] sm:text-xs tracking-widest text-center px-2 leading-relaxed whitespace-pre-line" style={{ color: ink }}>
      {title}
    </span>
  </button>
);

const MinigamesScreen: React.FC<MinigamesScreenProps> = ({
  onScanner,
  onChipFilter,
  onQuiz,
  onDailyChallenge,
  onDailyGrape,
  onMoonDial,
  onBack,
  onHome,
}) => {
  return (
    <DeviceLayout title="TOOLS" subtitle="" showBack={true} onBack={onBack} onHome={onHome} centerHeaderText={true}>
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar bg-stone-950 p-3">
        <div className="grid grid-cols-2 gap-3">
          <Tile title="SCANNER" face="#22C55E" shadow="#15803D" ink="#FFFFFF" icon={<ScanSearch size={32} />} onClick={onScanner} />
          <Tile title={'FILTER\nSEARCH'} face="#2AB5FF" shadow="#136A99" ink="#FFFFFF" icon={<Filter size={32} />} onClick={onChipFilter} />
          <Tile title={'WINE\nEXAM'} face="#A855F7" shadow="#6B21A8" ink="#FFFFFF" icon={<BadgeCheck size={32} />} onClick={onQuiz} />
          <Tile title={'DAILY\nCHALLENGE'} face="#EF4444" shadow="#991B1B" ink="#FFFFFF" icon={<Flame size={32} />} onClick={onDailyChallenge} />
          {/* Named for the question it asks rather than its pick — the reveal
              rotates through regions and styles as well as grapes. Yellow +
              cyan faces take a dark ink (iOS amber900 / cyan-950). */}
          <Tile title={"WHAT'S\nTHAT…?"} face="#FACC15" shadow="#CA8A04" ink="#78350F" icon={<Sparkles size={32} />} onClick={onDailyGrape} />
          <Tile title="MOON DIAL" face="#67E8F9" shadow="#155E75" ink="#164E63" icon={<MoonStar size={32} />} onClick={onMoonDial} />
        </div>
      </div>
    </DeviceLayout>
  );
};

export default MinigamesScreen;
