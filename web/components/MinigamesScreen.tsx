import React from 'react';
import { Sparkles, MoonStar, BadgeCheck, Flame, EyeOff, Camera, Hourglass, GraduationCap } from 'lucide-react';
import DeviceLayout from './DeviceLayout';

interface MinigamesScreenProps {
  onScanner: () => void;
  onProfVino: () => void;
  onQuiz: () => void;
  onDailyChallenge: () => void;
  onDailyGrape: () => void;
  onMoonDial: () => void;
  onBack: () => void;
  onHome: () => void;
}

/**
 * The tool shelf, in iOS reading order (`ToolRoster.all`), so the walkthrough's
 * TOOLS sentence can be **derived** from what the shelf actually draws rather
 * than hand-written — iOS learned that lesson twice (0.7.2 LR1, 0.8.8 D2):
 * prose and a grid of literals cannot be compared, so the prose goes wrong.
 *
 * WHAT'S THAT…? holds the slot iOS gave PROF. VINO in 0.8.93 — the game's
 * deletion is an open ruling (v6#6) and the professor an open port (v6#26).
 */
export type ToolId = 'scanner' | 'labelReader' | 'wineExam' | 'dailyChallenge' | 'dailyGrape' | 'profVino' | 'moonDial';

interface ToolEntry {
  id: ToolId;
  title: string;
  face: string;
  shadow: string;
  ink: string;
  comingSoon?: boolean;
}

/**
 * The one roster the tiles, the titles and the walkthrough sentence all read
 * (cleanbot batch-1 M3): a constant and six JSX literals were the exact
 * parallel-copy drift the derived sentence exists to prevent.
 */
export const TOOL_ROSTER: ToolEntry[] = [
  { id: 'scanner', title: 'BLIND TASTING', face: '#22C55E', shadow: '#15803D', ink: '#FFFFFF' },
  { id: 'labelReader', title: 'LABEL SCAN', face: '#3B82F6', shadow: '#1D4ED8', ink: '#FFFFFF', comingSoon: true },
  { id: 'wineExam', title: 'WINE EXAM', face: '#A855F7', shadow: '#6B21A8', ink: '#FFFFFF' },
  { id: 'dailyChallenge', title: 'DAILY CHALLENGE', face: '#EF4444', shadow: '#991B1B', ink: '#FFFFFF' },
  // WHAT'S THAT…? — held pending v6#6; yellow face takes a dark ink. On iOS
  // the professor took exactly this slot (0.8.93), so ruling v6#6's delete
  // resolves the shelf back to the fixed six.
  { id: 'dailyGrape', title: "WHAT'S THAT…?", face: '#FACC15', shadow: '#CA8A04', ink: '#78350F' },
  // PROF. VINO (v6#26) — iOS's amber face; the seventh tile is the interim
  // cost of the open ruling above.
  { id: 'profVino', title: 'PROF. VINO', face: '#EAB308', shadow: '#A16207', ink: '#FFFFFF' },
  { id: 'moonDial', title: 'MOON DIAL', face: '#0891B2', shadow: '#155E75', ink: '#FFFFFF' },
];

export const TOOL_TITLES: string[] = TOOL_ROSTER.map(t => t.title);

/** iOS `ToolRoster.sentence` — six lowercase names, Oxford-comma'd. */
export const toolSentence = (): string => {
  const names = TOOL_TITLES.map(t => t.toLowerCase());
  const last = names[names.length - 1]!;
  return names.slice(0, -1).join(', ') + ', and ' + last;
};

interface TileProps {
  title: string;
  /** Filled tile face + 6px extrusion + ink, mirroring iOS `ToolsScreen.tile`
   *  and the web SETTINGS grid's `FeatureTile`. */
  face: string;
  shadow: string;
  ink: string;
  icon: React.ReactNode;
  /**
   * iOS's announced-but-unbuilt treatment (`ToolsScreen.swift` 0.7.0, I2):
   * the tile still exists and looks like what it will be, its ink dims, and it
   * says COMING SOON in words. Not `disabled` — a dead grey tile is
   * indistinguishable from a paywalled one and from a bug. It stays tappable
   * and does nothing, because there is nothing yet to explain that the label
   * has not already said.
   */
  comingSoon?: boolean;
  onClick: () => void;
}

const Tile: React.FC<TileProps> = ({ title, face, shadow, ink, icon, comingSoon = false, onClick }) => (
  <button
    onClick={onClick}
    className="aspect-square flex flex-col items-center justify-center gap-3 rounded-xl transition-all active:translate-y-1 active:border-b-0"
    style={{ backgroundColor: face, borderBottom: `6px solid ${shadow}`, color: ink, opacity: comingSoon ? 0.62 : 1 }}
  >
    <span style={{ color: ink }}>{icon}</span>
    {/* No hard line breaks in the label — a literal newline lands in the
        button's accessible name (v6#39; same bug Block 10 fixed for
        WHO WE ARE). Wrapping is the browser's job. */}
    <span className="font-retro text-[0.6rem] sm:text-xs tracking-widest text-center px-2 leading-relaxed" style={{ color: ink }}>
      {title}
    </span>
    {comingSoon && (
      <span
        className="flex items-center gap-1 font-retro text-[0.55rem] tracking-widest"
        style={{ color: ink, opacity: 0.85 }}
        aria-label="Coming soon — not built yet"
      >
        <Hourglass size={10} aria-hidden="true" />
        COMING SOON
      </span>
    )}
  </button>
);

/**
 * The Tools hub, ported from `vinodex-ios/Sources/VinodexUI/ToolsScreen.swift`
 * at v0.9.2 (v6#10/#11/#13):
 *
 * - SCANNER became BLIND TASTING (0.7.1, E3) — UI string and glyph only; the
 *   `/scanner` route and `scanner` state keys keep their names, per the same
 *   convention iOS follows (`DexRoute.scanner` is unrenamed there too).
 * - FILTER SEARCH left the shelf (0.7.0, I1/I2): the main menu's big round
 *   button opens that screen now, and a tool reachable two ways from one
 *   screen is a tool nobody can find.
 * - LABEL SCAN holds its slot with the COMING SOON treatment until the web
 *   OCR ruling (v6#4/v6#27).
 *
 * Faces/shadows/inks are iOS `ToolsScreen`'s current values; yellow faces take
 * a dark ink — white on it is unreadable.
 */
const MinigamesScreen: React.FC<MinigamesScreenProps> = ({
  onScanner,
  onProfVino,
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
        {/* Rows 1–3 as iOS orders them: the two that answer a question about a
            specific glass first, then the quiz family, then the rest. The grid
            *is* the roster — nothing here restates a title or a face. */}
        <div className="grid grid-cols-2 gap-3">
          {TOOL_ROSTER.map(tool => {
            const icon = {
              scanner: <EyeOff size={32} />,
              labelReader: <Camera size={32} />,
              wineExam: <BadgeCheck size={32} />,
              dailyChallenge: <Flame size={32} />,
              dailyGrape: <Sparkles size={32} />,
              profVino: <GraduationCap size={32} />,
              moonDial: <MoonStar size={32} />,
            }[tool.id];
            const action = {
              scanner: onScanner,
              labelReader: () => {},
              wineExam: onQuiz,
              dailyChallenge: onDailyChallenge,
              dailyGrape: onDailyGrape,
              profVino: onProfVino,
              moonDial: onMoonDial,
            }[tool.id];
            return (
              <Tile
                key={tool.id}
                title={tool.title}
                face={tool.face}
                shadow={tool.shadow}
                ink={tool.ink}
                icon={icon}
                comingSoon={tool.comingSoon}
                onClick={action}
              />
            );
          })}
        </div>
      </div>
    </DeviceLayout>
  );
};

export default MinigamesScreen;
