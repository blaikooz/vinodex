import React from 'react';
import { Sparkles, ScanSearch, Moon } from 'lucide-react';
import DeviceLayout from './DeviceLayout';

interface MinigamesScreenProps {
  onDailyGrape: () => void;
  onScanner: () => void;
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
 * The minigames hub, ported from `vinodex-ios/Sources/VinodexUI/MinigamesScreen.swift`.
 *
 * Square glyph-over-label tiles, matching the iOS grid so the two apps read as
 * one product. The moon dial already existed here as a standalone route; it
 * moves under this shelf alongside the other two rather than hanging off the
 * main menu on its own.
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
  onDailyGrape,
  onScanner,
  onMoonDial,
  onBack,
  onHome,
}) => {
  return (
    <DeviceLayout title="MINIGAMES" subtitle="" showBack={true} onBack={onBack} onHome={onHome} centerHeaderText={true}>
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar bg-stone-950 p-3">
        <div className="grid grid-cols-2 gap-3">
          {/*
            Named for the question it asks rather than for its pick: the reveal
            rotates through regions and styles as well as grapes, so "grape of
            the day" was wrong two days in three.
          */}
          <Tile
            title={"WHAT'S\nTHAT…?"}
            tint="text-yellow-400"
            border="border-yellow-700"
            icon={<Sparkles size={32} />}
            onClick={onDailyGrape}
          />
          <Tile
            title="SCANNER"
            tint="text-green-400"
            border="border-green-700"
            icon={<ScanSearch size={32} />}
            onClick={onScanner}
          />
          <Tile
            title="MOON DIAL"
            tint="text-blue-400"
            border="border-blue-700"
            icon={<Moon size={32} />}
            onClick={onMoonDial}
          />
        </div>
      </div>
    </DeviceLayout>
  );
};

export default MinigamesScreen;
