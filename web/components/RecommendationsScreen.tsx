import React, { useMemo } from 'react';
import DeviceLayout from './DeviceLayout';
import EntryTile from './EntryTile';
import { WineEntry } from '@/shared/types';
import { allRecommendations, buildProfile, buildTriedIndex } from '../src/services/recommendations';
import { useBookmarks } from '../src/services/useBookmarks';

interface RecommendationsScreenProps {
  allEntries: WineEntry[];
  onSelect: (entry: WineEntry) => void;
  onBack: () => void;
  onHome: () => void;
}

/**
 * YOU MIGHT LIKE, in full — ported from
 * `vinodex-ios/Sources/VinodexUI/RecommendationsScreen.swift` (0.8.91 B3),
 * v6#15. The passport's strip shows `RECOMMENDATION_STRIP` rows and this is
 * what SHOW ALL opens: the same ranking with the cap removed, not a second
 * query — a SHOW ALL that reshuffles reads as the whole feature being
 * arbitrary.
 *
 * Rows are `EntryTile` — this page *is* the list, so it uses the row every
 * other listing uses. The score is not printed: it is an internal 0–100 the
 * floor already gates on, and putting it on a row would invite comparing a 71
 * with a 68 as though the difference meant something the arithmetic can
 * support.
 */
const RecommendationsScreen: React.FC<RecommendationsScreenProps> = ({ allEntries, onSelect, onBack, onHome }) => {
  // Re-render on any shelf change: the ranking is a function of the tried set.
  const revision = useBookmarks();
  const picks = useMemo(() => {
    const index = buildTriedIndex(allEntries);
    return allRecommendations(buildProfile(index), index);
  }, [allEntries, revision]);

  return (
    <DeviceLayout title="YOU MIGHT LIKE" subtitle="" showBack onBack={onBack} onHome={onHome} centerHeaderText>
      <div className="h-full overflow-y-auto custom-scrollbar p-3 flex flex-col gap-2.5" style={{ backgroundColor: 'var(--lcd-page)' }}>
        <div>
          <div className="font-retro text-sm tracking-widest text-green-400 pb-1 border-b-2" style={{ borderColor: 'color-mix(in srgb, var(--lcd-accent) 45%, transparent)' }}>
            YOU MIGHT LIKE
          </div>
          <p className="font-mono text-xs text-stone-400 normal-case mt-1.5">
            {picks.length === 0
              ? 'Ranked against what you have tasted.'
              : `${picks.length} untried, ranked against what you have tasted.`}
          </p>
        </div>

        {picks.length === 0 ? (
          // A thin profile is not a failure, it is a device that has not been
          // told enough yet. Said out loud here, because unlike the strip this
          // page was asked for and cannot simply not appear.
          <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center">
            <div className="font-retro text-sm tracking-widest text-green-400">NOTHING YET</div>
            <p className="font-mono text-sm text-stone-300 normal-case max-w-[18rem]">
              Mark a few more entries tried and the device will start guessing.
              It would rather say nothing than guess from two.
            </p>
          </div>
        ) : (
          picks.map((entry, i) => <EntryTile key={entry.id} entry={entry} onPress={() => onSelect(entry)} index={i} />)
        )}
      </div>
    </DeviceLayout>
  );
};

export default RecommendationsScreen;
