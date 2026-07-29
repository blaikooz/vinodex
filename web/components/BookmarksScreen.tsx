import React, { useState } from 'react';
import { Bookmark, Trash2 } from 'lucide-react';
import DeviceLayout from './DeviceLayout';
import EntryTile from './EntryTile';
import { WineEntry } from '@/shared/types';
import { clearBookmarks, removeBookmark, savedEntries } from '../src/services/bookmarks';
import { useBookmarks } from '../src/services/useBookmarks';

interface BookmarksScreenProps {
  allEntries: WineEntry[];
  onSelect: (entry: WineEntry) => void;
  onBack: () => void;
  onHome: () => void;
}

/**
 * The saved list, ported from `vinodex-ios/Sources/VinodexUI/BookmarksScreen.swift`.
 *
 * Rows are the same `EntryTile` the encyclopedia lists use, so a saved grape
 * looks exactly like that grape everywhere else.
 */
const BookmarksScreen: React.FC<BookmarksScreenProps> = ({ allEntries, onSelect, onBack, onHome }) => {
  useBookmarks();
  const [confirmingClear, setConfirmingClear] = useState(false);
  const items = savedEntries(allEntries);

  return (
    <DeviceLayout title="SAVED" subtitle="" showBack={true} onBack={onBack} onHome={onHome} centerHeaderText={true}>
      <div className="flex flex-col h-full min-h-0 bg-stone-900">

        <div className="bg-stone-800 border-b border-stone-700 px-4 py-3 flex items-center gap-3 shadow-inner">
          <Bookmark size={22} className="text-green-500" />
          <span className="text-base font-mono text-stone-200 font-bold tracking-widest">
            {items.length} SAVED
          </span>
          <span className="flex-1" />
          {items.length > 0 && (
            <button
              onClick={() => setConfirmingClear(true)}
              className="font-retro text-[0.6rem] tracking-widest text-red-400 border-2 border-red-800 rounded px-3 py-2 hover:bg-red-950 transition-colors"
            >
              CLEAR ALL
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 bg-stone-950 relative">
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)',
              backgroundSize: '10px 10px',
            }}
          />

          {items.length === 0 ? (
            <div className="text-center py-20 opacity-50 flex flex-col items-center">
              <Bookmark size={48} className="text-green-700 mb-4" />
              <p className="text-green-600 font-retro text-xs">NOTHING SAVED YET</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 relative z-10 pb-4">
              {items.map((entry, index) => (
                <div key={entry.id} className="relative">
                  <EntryTile entry={entry} onPress={onSelect} index={index} />
                  {/*
                    Removing one entry does not ask for confirmation — that is
                    cheap to redo. Clearing the whole list does.
                  */}
                  {/*
                    44px hit target around the ~28px visual, matching the audit's
                    M25 fix on iOS. The destructive control was the smallest tap
                    target in the app, and it sits a few pixels from the tile
                    that opens the entry — so a near-miss opened something
                    instead of removing it.
                  */}
                  <button
                    onClick={() => removeBookmark(entry.id)}
                    aria-label={`Remove ${entry.name} from saved`}
                    className="absolute -top-1.5 -right-1.5 w-11 h-11 flex items-center justify-center group"
                  >
                    <span className="p-1.5 rounded bg-stone-950/80 border border-stone-700 text-stone-400 group-hover:text-red-400 group-hover:border-red-700 transition-colors">
                      <Trash2 size={16} />
                    </span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/*
          Rendered in-screen rather than as a browser confirm(), which would
          break the handheld metaphor the whole app is built on.
        */}
        {confirmingClear && (
          <div className="absolute inset-0 z-30 bg-black/80 flex items-center justify-center p-6">
            {/*
              Marked as a modal dialog so a screen reader keeps focus inside it
              rather than wandering into the list behind the scrim — the audit's
              M19 fix, which iOS made with accessibilityElement(.contain) plus
              the isModal trait.
            */}
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="clear-saved-title"
              aria-describedby="clear-saved-detail"
              className="w-full max-w-xs bg-stone-900 border-2 border-red-800 rounded-lg p-5 flex flex-col gap-4"
            >
              <p id="clear-saved-title" className="font-retro text-xs tracking-widest text-red-400 text-center">CLEAR ALL SAVED?</p>
              <p id="clear-saved-detail" className="font-mono text-sm text-stone-300 text-center normal-case">
                {items.length} {items.length === 1 ? 'item' : 'items'} will be removed. This cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmingClear(false)}
                  className="flex-1 font-retro text-[0.6rem] tracking-widest text-stone-300 border-2 border-stone-600 rounded py-3 hover:bg-stone-800"
                >
                  CANCEL
                </button>
                <button
                  onClick={() => {
                    clearBookmarks();
                    setConfirmingClear(false);
                  }}
                  className="flex-1 font-retro text-[0.6rem] tracking-widest text-white bg-red-700 border-2 border-red-900 rounded py-3 hover:bg-red-600"
                >
                  CLEAR
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </DeviceLayout>
  );
};

export default BookmarksScreen;
