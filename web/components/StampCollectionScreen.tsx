import React, { useState } from 'react';
import DeviceLayout from './DeviceLayout';
import DexAlert from './DexAlert';
import StampArt from './StampArt';
import { WineEntry } from '@/shared/types';
import { shelfIds } from '../src/services/bookmarks';
import { useBookmarks } from '../src/services/useBookmarks';
import { bestStreak } from '../src/services/dailyChallenge';
import { highestUnlocked } from '../src/services/quiz';
import { computePassport } from '../src/services/passport';
import { STAMP_CATALOG, Stamp } from '../src/services/stampCatalog';

/**
 * The stamp series, laid out as a collection — v10#2 (v0.6.26), ported from
 * `vinodex-ios/Sources/VinodexUI/StampCollectionScreen.swift` (0.8.6 C3/C4).
 *
 * **Why this is a screen and not a bigger grid on the passport.** The
 * passport counts: stat tiles saying how many, progress bars saying how far.
 * The stamps are the only things on it that are *objects* — drawn, each
 * with a story and a denomination — and at the tile size that page can spare
 * they were a symbol and two words. This gives them a page where the drawing
 * is the content and the words are the caption, which is what a collection
 * is.
 *
 * **Every stamp appears, earned or not.** An unearned stamp shows its
 * silhouette (drained and dimmed — `StampArt`'s `earned={false}`) and what it
 * would take, because a series with holes in it is what makes you want to
 * fill them. Tapping any stamp opens its story. No share control (ruling
 * 2026-08-30, v10#3): the profile and stamp image cards are not built.
 *
 * Reads the same `computePassport` the passport does; nothing here is
 * computed, the screen owns layout and nothing else.
 */
interface StampCollectionScreenProps {
  allEntries: WineEntry[];
  onBack: () => void;
  onHome: () => void;
}

const StampCollectionScreen: React.FC<StampCollectionScreenProps> = ({ allEntries, onBack, onHome }) => {
  // Re-rendered by the shelf store's revision; six badges over a few hundred
  // entries is cheap enough to compute in render, and it keeps the hook rule
  // honest (a memo keyed on `revision` is a dependency the linter cannot see).
  useBookmarks();
  const passport = computePassport(shelfIds('tried'), allEntries, bestStreak(), highestUnlocked());
  const badges = new Map(passport.badges.map(b => [b.id, b]));
  const earnedCount = passport.badges.filter(b => b.earned).length;
  const [open, setOpen] = useState<Stamp | null>(null);

  return (
    <DeviceLayout title="STAMPS" subtitle="" showBack onBack={onBack} onHome={onHome} centerHeaderText>
      <div className="h-full overflow-y-auto custom-scrollbar p-4 flex flex-col gap-4 relative" style={{ backgroundColor: 'var(--lcd-page)' }}>
        <header className="dex-section-rule pb-2">
          <h2 className="font-retro text-title tracking-widest text-[var(--lcd-accent)]">COLLECTION</h2>
          <p className="text-body normal-case text-[var(--lcd-subtext)] mt-1" data-stamps-issued>
            {earnedCount} of {passport.badges.length} issued. Tap a stamp for its story.
          </p>
        </header>

        {/* Two columns. Three would fit and put the drawings back at the size
            the passport already draws them at, which is the thing this page
            exists not to do. */}
        <div className="grid grid-cols-2 gap-3" data-stamp-grid>
          {STAMP_CATALOG.map(stamp => {
            const badge = badges.get(stamp.id);
            const earned = badge?.earned === true;
            return (
              <button
                key={stamp.id}
                type="button"
                onClick={() => setOpen(stamp)}
                aria-label={`${stamp.title}. ${earned ? `Earned, ${stamp.denomination}.` : `Not yet earned. ${badge?.blurb ?? ''}`} Opens its story.`}
                data-stamp={stamp.id}
                data-stamp-earned={earned ? 'true' : 'false'}
                className="dex-pressable flex flex-col items-center gap-2.5 rounded-card bg-[var(--surface-raised)] px-2 py-3 text-center shadow-elev-1"
                style={{ border: earned ? `2px solid color-mix(in srgb, ${stamp.colorHex} 55%, transparent)` : '1px solid var(--surface-line)' }}
              >
                {/* Bigger than anywhere else it appears: the passport draws it at 40. */}
                <StampArt id={stamp.id} size={96} earned={earned} />
                <span className="font-retro text-[11px] leading-snug tracking-wide" style={{ color: earned ? 'var(--lcd-text)' : 'var(--lcd-disabled-text)' }}>
                  {stamp.title}
                </span>
                <span className="text-caption normal-case leading-tight" style={{ color: earned ? stamp.colorHex : 'var(--lcd-subtext)' }}>
                  {earned ? stamp.denomination : badge?.blurb}
                </span>
              </button>
            );
          })}
        </div>

        {open && (
          <DexAlert
            tone="yellow"
            title={open.title}
            ariaLabel={`${open.title} story`}
            onDismiss={() => setOpen(null)}
            actions={[{ label: 'CLOSE', kind: 'cancel', onClick: () => setOpen(null) }]}
          >
            <span className="flex flex-col items-center gap-3">
              <StampArt id={open.id} size={72} earned={badges.get(open.id)?.earned === true} />
              <span className="block normal-case">{open.info}</span>
              <span className="block font-retro text-[10px] tracking-widest" style={{ color: open.colorHex }}>{open.denomination}</span>
            </span>
          </DexAlert>
        )}
      </div>
    </DeviceLayout>
  );
};

export default StampCollectionScreen;
