import React from 'react';
import DeviceLayout from './DeviceLayout';
import IOSGridTile from './IOSGridTile';

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
  face: string;
  shadow: string;
  ink: string;
  art: string;
  comingSoon?: boolean;
}

/**
 * The one roster the tiles, the titles and the walkthrough sentence all read
 * (cleanbot batch-1 M3): a constant and six JSX literals were the exact
 * parallel-copy drift the derived sentence exists to prevent.
 */
export const TOOL_ROSTER: ToolEntry[] = [
  { id: 'scanner', title: 'BLIND TASTING', face: '#22C55E', shadow: '#15803D', ink: '#FFFFFF', art: '/art/button/blindtasting.png' },
  { id: 'labelReader', title: 'LABEL SCAN', face: '#3B82F6', shadow: '#1D4ED8', ink: '#FFFFFF', art: '/art/button/labelscanner.png', comingSoon: true },
  { id: 'wineExam', title: 'WINE EXAM', face: '#A855F7', shadow: '#6B21A8', ink: '#FFFFFF', art: '/art/button/wineexam.png' },
  { id: 'dailyChallenge', title: 'DAILY CHALLENGE', face: '#EF4444', shadow: '#991B1B', ink: '#FFFFFF', art: '/art/button/dailychallenge.png' },
  // PROF. VINO holds WHAT'S THAT…?'s old slot, exactly as iOS 0.8.93 gave
  // it to him — ruling v6#6 deleted the game outright, and the shelf is the
  // fixed six again.
  { id: 'profVino', title: 'PROF. VINO', face: '#EAB308', shadow: '#A16207', ink: '#FFFFFF', art: '/art/vino/vino-neutral.png' },
  { id: 'moonDial', title: 'MOON DIAL', face: '#0891B2', shadow: '#155E75', ink: '#FFFFFF', art: '/art/button/moondial.png' },
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
 * Faces, shadows, and inks follow iOS `ToolsScreen`'s current values.
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
      <div
        className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3"
        style={{ backgroundColor: 'var(--lcd-page)' }}
      >
        {/* Rows 1–3 as iOS orders them: the two that answer a question about a
            specific glass first, then the quiz family, then the rest. The grid
            *is* the roster — nothing here restates a title or a face. */}
        <div className="ios-grid-shelf" data-ios-grid="tools">
          {TOOL_ROSTER.map(tool => {
            const action = {
              scanner: onScanner,
              labelReader: () => {},
              wineExam: onQuiz,
              dailyChallenge: onDailyChallenge,
              profVino: onProfVino,
              moonDial: onMoonDial,
            }[tool.id];
            return (
              <IOSGridTile
                key={tool.id}
                title={tool.title}
                face={tool.face}
                shadow={tool.shadow}
                ink={tool.ink}
                artSrc={tool.art}
                artName={tool.id === 'profVino' ? 'vino-neutral' : tool.art.split('/').pop()?.replace('.png', '')}
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
