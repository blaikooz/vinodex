import React, { useEffect, useMemo, useState } from 'react';
import DeviceLayout from './DeviceLayout';
import { WineEntry } from '@/shared/types';
import { CONTAINER_BORDER, CONTAINER_BORDER_CLASS, CONTAINER_SHADOW_CLASS } from '../src/services/iconRendering';
import { createEntryVisualResolver, resolveEntryIconVisual } from '../src/services/entryIconVisuals';
import { advanceRevealCursor, revealEntry } from '../src/services/dailyPick';

interface DailyGrapeScreenProps {
  allEntries: WineEntry[];
  onOpen: (entry: WineEntry) => void;
  onBack: () => void;
  onHome: () => void;
}

/**
 * "Grape of the day", played as a reveal. Ported from
 * `vinodex-ios/Sources/VinodexUI/DailyGrapeScreen.swift`.
 *
 * The silhouette-then-reveal is the whole point: a shuffled entry shown
 * outright is just a list of one. Holding the name back for a beat turns it
 * into a guess, which is the thing worth reopening the app for.
 */
const DailyGrapeScreen: React.FC<DailyGrapeScreenProps> = ({ allEntries, onOpen, onBack, onHome }) => {
  const [revealed, setRevealed] = useState(false);

  /**
   * Position in the cycle for *this* visit, fixed on mount.
   *
   * Held in state rather than read on each render: the cursor advances when
   * read, so recomputing the pick mid-render would give a different entry every
   * time and the silhouette would stop matching the name.
   */
  const [cursor, setCursor] = useState<number | null>(null);
  useEffect(() => {
    setCursor(advanceRevealCursor());
  }, []);

  const pick = useMemo(
    () => (cursor === null ? null : revealEntry(allEntries, cursor)),
    [allEntries, cursor],
  );

  const resolver = useMemo(() => createEntryVisualResolver({ entries: allEntries }), [allEntries]);

  // "WHAT'S THAT GRAPE / REGION / STYLE" — named for whatever came up.
  const kindWord = pick?.category === 'REGIONS' ? 'REGION' : pick?.category === 'STYLES' ? 'STYLE' : 'GRAPE';

  const visual = pick
    ? resolveEntryIconVisual(pick, { size: 96, resolver, includeRegionClimateOutline: true })
    : null;

  return (
    <DeviceLayout
      title="WHAT'S THAT…?"
      subtitle=""
      showBack={true}
      onBack={onBack}
      onHome={onHome}
      centerHeaderText={true}
    >
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar bg-stone-950 flex flex-col items-center justify-center gap-5 p-6 text-center">
        {!pick ? (
          <p className="font-retro text-xs text-stone-400">NOTHING TODAY</p>
        ) : (
          <>
            <p className="font-retro text-xs sm:text-sm tracking-widest text-yellow-400">
              {revealed ? `TODAY'S ${kindWord}` : `WHAT'S THAT ${kindWord}?`}
            </p>

            {/*
              Silhouette until revealed: the real icon well, drained of colour
              and darkened, so the outline still teases the answer.
            */}
            <div
              className={`flex items-center justify-center w-36 h-36 rounded-2xl bg-stone-900 ${CONTAINER_BORDER_CLASS} ${CONTAINER_SHADOW_CLASS} transition-all duration-300`}
              style={{
                borderWidth: CONTAINER_BORDER,
                filter: revealed ? 'none' : 'grayscale(1) brightness(0.35)',
              }}
            >
              {visual?.iconNode}
            </div>

            <p className="font-retro text-lg sm:text-2xl text-green-300 break-words px-2">
              {revealed ? pick.name.toUpperCase() : '? ? ?'}
            </p>

            {revealed && (
              <p className="font-mono text-sm sm:text-base text-green-200 normal-case leading-relaxed max-w-sm">
                {pick.description}
              </p>
            )}

            {revealed ? (
              <button
                onClick={() => onOpen(pick)}
                className="font-retro text-xs tracking-widest text-black bg-green-500 border-b-[6px] border-green-800 rounded-full px-8 py-4 active:translate-y-1 active:border-b-0 transition-all hover:bg-green-400"
              >
                OPEN ENTRY
              </button>
            ) : (
              <button
                onClick={() => setRevealed(true)}
                className="font-retro text-xs tracking-widest text-yellow-900 bg-yellow-400 border-b-[6px] border-yellow-700 rounded-full px-8 py-4 active:translate-y-1 active:border-b-0 transition-all hover:bg-yellow-300"
              >
                REVEAL
              </button>
            )}
          </>
        )}
      </div>
    </DeviceLayout>
  );
};

export default DailyGrapeScreen;
