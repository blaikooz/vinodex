import React from 'react';
import { MoonStar, BadgeCheck, Flame, EyeOff, Camera, GraduationCap } from 'lucide-react';
import DeviceLayout from './DeviceLayout';
import { Tile as CardTile, Livery } from './Card';

interface MinigamesScreenProps {
  onScanner: () => void;
  onProfVino: () => void;
  onQuiz: () => void;
  onDailyChallenge: () => void;
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
 * Ruling v6#6 deleted WHAT'S THAT…? to match iOS 0.8.93; the professor
 * holds its slot, and the shelf is the fixed six.
 */
export type ToolId = 'scanner' | 'labelReader' | 'wineExam' | 'dailyChallenge' | 'profVino' | 'moonDial';

interface ToolEntry {
  id: ToolId;
  title: string;
  livery: Livery;
  comingSoon?: boolean;
}

/**
 * The one roster the tiles, the titles and the walkthrough sentence all read
 * (cleanbot batch-1 M3): a constant and six JSX literals were the exact
 * parallel-copy drift the derived sentence exists to prevent.
 *
 * Stage 4 (v0.4.3): the face/shadow/ink hex triples become livery names —
 * same hue family per tool, from the seven-name table with the authored
 * light half. Two approximations, recorded: LABEL SCAN's blue and MOON
 * DIAL's cyan both fall outside the seven-livery vocabulary; sky and emerald
 * are the nearest names, and inventing an eighth livery for two tiles would
 * be a second table.
 */
export const TOOL_ROSTER: ToolEntry[] = [
  { id: 'scanner', title: 'BLIND TASTING', livery: 'green' },
  { id: 'labelReader', title: 'LABEL SCAN', livery: 'sky', comingSoon: true },
  { id: 'wineExam', title: 'WINE EXAM', livery: 'violet' },
  { id: 'dailyChallenge', title: 'DAILY CHALLENGE', livery: 'red' },
  // PROF. VINO holds WHAT'S THAT…?'s old slot, exactly as iOS 0.8.93 gave
  // it to him — ruling v6#6 deleted the game outright, and the shelf is the
  // fixed six again.
  { id: 'profVino', title: 'PROF. VINO', livery: 'amber' },
  { id: 'moonDial', title: 'MOON DIAL', livery: 'emerald' },
];

export const TOOL_TITLES: string[] = TOOL_ROSTER.map(t => t.title);

/** iOS `ToolRoster.sentence` — six lowercase names, Oxford-comma'd. */
export const toolSentence = (): string => {
  const names = TOOL_TITLES.map(t => t.toLowerCase());
  const last = names[names.length - 1];
  // iOS `ToolRoster.sentence`'s guard: a one-tool shelf is its own sentence,
  // and an empty one is the empty string rather than ", and undefined".
  if (last === undefined || names.length <= 1) return names[0] ?? '';
  return names.slice(0, -1).join(', ') + ', and ' + last;
};

interface TileProps {
  title: string;
  livery: Livery;
  icon: React.ReactNode;
  /**
   * iOS's announced-but-unbuilt treatment (`ToolsScreen.swift` 0.7.0, I2):
   * the tile still exists and looks like what it will be, its ink dims, and it
   * says COMING SOON in words. Not `disabled` — a dead grey tile is
   * indistinguishable from a paywalled one and from a bug. It stays tappable
   * and does nothing, because there is nothing yet to explain that the label
   * has not already said. Stage 4 keeps the words and the dim, drawn on the
   * card treatment; the hourglass glyph retires with the painted face.
   */
  comingSoon?: boolean;
  onClick: () => void;
}

const Tile: React.FC<TileProps> = ({ title, livery, icon, comingSoon = false, onClick }) => (
  <CardTile
    livery={livery}
    icon={icon}
    label={title}
    caption={comingSoon ? 'Coming soon — not built yet' : undefined}
    onClick={onClick}
    className={`aspect-square ${comingSoon ? 'opacity-70' : ''}`}
  />
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
 * The tiles wear the card treatment since stage 4: the livery as accent, the
 * label in the mode's own ink — see TOOL_ROSTER's note for the hue mapping.
 */
const MinigamesScreen: React.FC<MinigamesScreenProps> = ({
  onScanner,
  onProfVino,
  onQuiz,
  onDailyChallenge,
  onMoonDial,
  onBack,
  onHome,
}) => {
  return (
    <DeviceLayout title="TOOLS" subtitle="" showBack={true} onBack={onBack} onHome={onHome} centerHeaderText={true}>
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar bg-[var(--surface-base)] p-3">
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
              profVino: <GraduationCap size={32} />,
              moonDial: <MoonStar size={32} />,
            }[tool.id];
            const action = {
              scanner: onScanner,
              labelReader: () => {},
              wineExam: onQuiz,
              dailyChallenge: onDailyChallenge,
              profVino: onProfVino,
              moonDial: onMoonDial,
            }[tool.id];
            return (
              <Tile
                key={tool.id}
                title={tool.title}
                livery={tool.livery}
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
