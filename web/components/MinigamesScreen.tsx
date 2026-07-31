import React from 'react';
import { Sparkles, ScanSearch, Moon, Filter, BadgeCheck, Flame } from 'lucide-react';
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
  tint: string;
  border: string;
  icon: React.ReactNode;
  onClick: () => void;
}

/**
 * The Tools hub, ported from `vinodex-ios/Sources/VinodexUI/ToolsScreen.swift`.
 *
 * Square glyph-over-label tiles in the iOS 3×2 order: SCANNER, FILTER SEARCH,
 * WINE EXAM, DAILY CHALLENGE, WHAT'S THAT…?, MOON DIAL — so the two apps read as
 * one product. Reached from the Settings TOOLS tile.
 */
const Tile: React.FC<TileProps> = ({ title, tint, border, icon, onClick }) => (
  <button
    onClick={onClick}
    className={`aspect-square flex flex-col items-center justify-center gap-3 rounded-xl bg-stone-900 border-2 ${border} transition-all active:translate-y-0.5 hover:bg-stone-800 group`}
  >
    <span className={`${tint} group-hover:scale-110 transition-transform`}>{icon}</span>
    <span className="font-retro text-[0.6rem] sm:text-xs tracking-widest text-green-300 text-center px-2 leading-relaxed whitespace-pre-line">
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
          <Tile title="SCANNER" tint="text-green-400" border="border-green-700" icon={<ScanSearch size={32} />} onClick={onScanner} />
          <Tile title={'FILTER\nSEARCH'} tint="text-sky-400" border="border-sky-700" icon={<Filter size={32} />} onClick={onChipFilter} />
          <Tile title={'WINE\nEXAM'} tint="text-purple-400" border="border-purple-700" icon={<BadgeCheck size={32} />} onClick={onQuiz} />
          <Tile title={'DAILY\nCHALLENGE'} tint="text-red-400" border="border-red-700" icon={<Flame size={32} />} onClick={onDailyChallenge} />
          {/* Named for the question it asks rather than its pick — the reveal
              rotates through regions and styles as well as grapes. */}
          <Tile title={"WHAT'S\nTHAT…?"} tint="text-yellow-400" border="border-yellow-700" icon={<Sparkles size={32} />} onClick={onDailyGrape} />
          <Tile title="MOON DIAL" tint="text-cyan-400" border="border-cyan-700" icon={<Moon size={32} />} onClick={onMoonDial} />
        </div>
      </div>
    </DeviceLayout>
  );
};

export default MinigamesScreen;
