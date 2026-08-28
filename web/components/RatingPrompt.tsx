import React, { useState } from 'react';
import { Star } from 'lucide-react';
import type { TriedRating } from '../src/services/bookmarks';

/**
 * The tasting-journal form, ported from
 * `vinodex-ios/Sources/VinodexUI/RatingPrompt.swift`.
 *
 * Five tappable stars and an optional one-line note. SKIP always exits keeping
 * the tried mark (the score is optional — a forced rating is noise); tapping the
 * scrim is the same as SKIP. SAVE is enabled only once at least one star is set.
 * The prompt does not build the persisted record — the caller stamps the day.
 */

interface RatingPromptProps {
  entryName: string;
  initial?: TriedRating;
  onSave: (stars: number, note: string) => void;
  onSkip: () => void;
}

const RatingPrompt: React.FC<RatingPromptProps> = ({ entryName, initial, onSave, onSkip }) => {
  const [stars, setStars] = useState(initial?.rating ?? 0);
  const [note, setNote] = useState(initial?.note ?? '');

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Scrim — tap to skip. */}
      <button
        aria-label="Skip"
        onClick={onSkip}
        className="absolute inset-0 bg-black/70"
      />

      <div className="relative w-full max-w-[20rem] rounded-2xl border-2 border-green-700 bg-stone-900 p-5 shadow-2xl flex flex-col gap-4">
        <div className="text-center">
          <div className="text-label tracking-widest text-green-300">HOW WAS IT?</div>
          <div className="text-micro text-stone-300 mt-1 uppercase break-words">
            {entryName}
          </div>
        </div>

        {/* Stars */}
        <div className="flex items-center justify-center gap-1.5">
          {Array.from({ length: 5 }).map((_, i) => {
            const n = i + 1;
            const on = n <= stars;
            return (
              <button
                key={n}
                aria-label={`${n} star${n > 1 ? 's' : ''}`}
                aria-pressed={on}
                onClick={() => setStars(n)}
                className="active:scale-90 transition-transform"
              >
                <Star size={30} className={on ? 'text-yellow-400' : 'text-stone-600'} fill={on ? 'currentColor' : 'none'} />
              </button>
            );
          })}
        </div>

        {/* Optional note */}
        <input
          type="text"
          value={note}
          onChange={e => setNote(e.target.value)}
          maxLength={80}
          placeholder="ONE-LINE NOTE…"
          className="w-full rounded-control bg-black/40 border-2 border-stone-700 px-3 py-2 text-caption text-green-200 placeholder:text-stone-600 focus:border-green-600 focus:outline-none"
        />

        <div className="flex gap-3">
          <button
            onClick={onSkip}
            className="dex-pressable flex-1 rounded-control bg-stone-800 border-2 border-stone-600 py-2.5 text-micro tracking-widest text-stone-300"
          >
            SKIP
          </button>
          <button
            disabled={stars === 0}
            onClick={() => stars > 0 && onSave(stars, note.trim())}
            className={`dex-pressable flex-1 rounded-control border-2 py-2.5  text-micro  tracking-widest ${
              stars > 0
                ? 'bg-green-700 border-green-900 text-white'
                : 'bg-stone-700/50 border-stone-800/50 text-stone-500 cursor-not-allowed'
            }`}
          >
            SAVE
          </button>
        </div>
      </div>
    </div>
  );
};

export default RatingPrompt;
