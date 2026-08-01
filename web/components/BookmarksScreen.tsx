import React, { useMemo, useRef, useState } from 'react';
import { Bookmark, XCircle, PlusCircle, CheckCircle2, Camera, Pencil, Check, Star, BookMarked, UserRound, Flame, ChevronRight } from 'lucide-react';
import DeviceLayout from './DeviceLayout';
import EntryTile from './EntryTile';
import RatingPrompt from './RatingPrompt';
import { WineEntry } from '@/shared/types';
import {
  Shelf,
  shelfEntries,
  shelfCount,
  removeFromShelf,
  clearShelf,
  getRating,
  setRating,
  makeRating,
} from '../src/services/bookmarks';
import { useBookmarks } from '../src/services/useBookmarks';
import { recentEntries } from '../src/services/recentlyViewed';
import { useRecentlyViewed } from '../src/services/useRecentlyViewed';
import { displayName, setDisplayName, avatarDataUrl, adoptAvatar } from '../src/services/profile';
import { useProfile } from '../src/services/useProfile';
import { currentStreak } from '../src/services/dailyChallenge';
import { createEntryVisualResolver, resolveEntryIconVisual } from '../src/services/entryIconVisuals';

interface BookmarksScreenProps {
  allEntries: WineEntry[];
  onSelect: (entry: WineEntry) => void;
  onPassport: () => void;
  onBack: () => void;
  onHome: () => void;
}

const SHELVES: Shelf[] = ['saved', 'wantToTry', 'tried'];
const SHELF_TAB: Record<Shelf, string> = { saved: 'SAVED', wantToTry: 'WANT', tried: 'TRIED' };
const SHELF_TITLE: Record<Shelf, string> = { saved: 'SAVED', wantToTry: 'WANT TO TRY', tried: 'TRIED' };
const EMPTY: Record<Shelf, { glyph: React.ReactNode; head: string; hint: string }> = {
  saved: { glyph: <Bookmark size={44} className="text-green-700 mb-3" />, head: 'NOTHING SAVED', hint: 'Tap SAVE on any entry to keep it here.' },
  wantToTry: { glyph: <PlusCircle size={44} className="text-sky-700 mb-3" />, head: 'NOTHING ON THE WISHLIST', hint: 'Tap WANT on a grape or style you’re curious about.' },
  tried: { glyph: <CheckCircle2 size={44} className="text-amber-700 mb-3" />, head: 'NOTHING TRIED YET', hint: 'Tap TRIED on a grape or style you’ve drunk — then rate it.' },
};

/**
 * The taster's collection, ported from
 * `vinodex-ios/Sources/VinodexUI/BookmarksScreen.swift`.
 *
 * Top-to-bottom: profile (avatar + name + passport), the recently-viewed
 * strip, a three-segment shelf switcher (SAVED / WANT / TRIED), then the active
 * shelf's rows. Rows reuse the same `EntryTile` the encyclopedia lists use.
 * On the TRIED shelf each row carries its star/note journal line with an edit
 * pencil. PASSPORT is stubbed here until Phase C builds it.
 */
const BookmarksScreen: React.FC<BookmarksScreenProps> = ({ allEntries, onSelect, onPassport, onBack, onHome }) => {
  useBookmarks();
  useRecentlyViewed();
  useProfile();
  const streak = currentStreak();

  const [shelf, setShelf] = useState<Shelf>('saved');
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [editingRating, setEditingRating] = useState<WineEntry | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const resolver = useMemo(() => createEntryVisualResolver({ entries: allEntries }), [allEntries]);
  const recents = recentEntries(allEntries);
  const items = shelfEntries(shelf, allEntries);
  const counts = { saved: shelfCount('saved'), wantToTry: shelfCount('wantToTry'), tried: shelfCount('tried') };
  const name = displayName();
  const avatar = avatarDataUrl();

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void adoptAvatar(file);
    e.target.value = '';
  };

  const startEditName = () => {
    setNameDraft(name);
    setEditingName(true);
  };
  const commitName = () => {
    setDisplayName(nameDraft);
    setEditingName(false);
  };

  return (
    <DeviceLayout title="COLLECTION" subtitle="" showBack={true} onBack={onBack} onHome={onHome} centerHeaderText={true}>
      <div className="flex flex-col h-full min-h-0 bg-stone-950 relative">

        {/* ---- Profile ---- */}
        <div className="bg-stone-900 border-b border-stone-700 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => fileRef.current?.click()}
            aria-label="Change photo"
            className="relative w-16 h-16 shrink-0 rounded-full border-2 border-green-500 overflow-hidden bg-stone-800 flex items-center justify-center"
          >
            {avatar ? (
              <img src={avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <UserRound size={30} className="text-stone-500" />
            )}
            <span className="absolute bottom-0 right-0 bg-green-600 rounded-tl-md p-0.5">
              <Camera size={11} className="text-white" />
            </span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickFile} />

          <div className="flex-1 min-w-0">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={nameDraft}
                  onChange={e => setNameDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') commitName(); }}
                  maxLength={24}
                  placeholder="YOUR NAME"
                  className="flex-1 min-w-0 bg-black/40 border-2 border-stone-700 rounded px-2 py-1 font-retro text-xs text-green-200 placeholder:text-stone-600 focus:border-green-600 focus:outline-none"
                />
                <button onClick={commitName} aria-label="Save name" className="text-green-400 p-1">
                  <Check size={18} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="font-retro text-sm text-green-300 tracking-widest truncate">
                  {name ? name.toUpperCase() : 'TASTER'}
                </span>
                <button onClick={startEditName} aria-label="Edit name" className="text-stone-500 hover:text-green-400 p-1">
                  <Pencil size={14} />
                </button>
              </div>
            )}
            {/* Streak + PASSPORT. */}
            <div className="mt-2 flex items-center gap-2">
              {streak > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 bg-amber-950/60 border border-amber-700">
                  <Flame size={12} className="text-amber-400" />
                  <span className="font-retro text-[0.5rem] tracking-widest text-amber-300">{streak} DAY{streak === 1 ? '' : 'S'}</span>
                </span>
              )}
              <button
                onClick={onPassport}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 bg-green-700 border border-green-500 hover:bg-green-600 transition-colors"
              >
                <BookMarked size={12} className="text-white" />
                <span className="font-retro text-[0.5rem] tracking-widest text-white">PASSPORT</span>
                <ChevronRight size={11} className="text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* ---- Recently viewed ---- */}
        {recents.length > 0 && (
          <div className="bg-stone-900/60 border-b border-stone-800 px-3 py-2">
            <div className="font-retro text-[0.5rem] tracking-widest text-stone-500 mb-1.5 px-1">RECENTLY VIEWED</div>
            <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
              {recents.map(entry => {
                const v = resolveEntryIconVisual(entry, { size: 26, resolver });
                return (
                  <button
                    key={entry.id}
                    onClick={() => onSelect(entry)}
                    className="flex flex-col items-center gap-1 w-14 shrink-0"
                  >
                    <span className="w-12 h-12 rounded-lg border-2 border-stone-700 flex items-center justify-center overflow-hidden" style={v.style}>
                      {v.iconNode}
                    </span>
                    <span className="font-retro text-[0.45rem] text-stone-300 leading-tight text-center w-full line-clamp-2">
                      {entry.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ---- Shelf switcher ---- */}
        <div className="flex gap-1 px-3 py-2 bg-stone-800 border-b border-stone-700">
          {SHELVES.map(s => {
            const active = s === shelf;
            return (
              <button
                key={s}
                onClick={() => setShelf(s)}
                className={`flex-1 rounded-lg py-2 font-retro text-[0.55rem] tracking-widest transition-colors ${
                  active ? 'bg-green-600 text-white' : 'bg-stone-900/60 text-stone-400 hover:text-stone-200'
                }`}
              >
                {SHELF_TAB[s]} {counts[s]}
              </button>
            );
          })}
        </div>

        {/* ---- Shelf header ---- */}
        <div className="flex items-center gap-2 px-4 py-2 bg-stone-900/40 border-b border-stone-800">
          <span className="font-retro text-[0.6rem] tracking-widest text-green-400">{SHELF_TITLE[shelf]}</span>
          <span className="flex-1" />
          {items.length > 0 && (
            <button
              onClick={() => setConfirmingClear(true)}
              className="font-retro text-[0.5rem] tracking-widest text-red-400 border border-red-800 rounded px-2 py-1 hover:bg-red-950 transition-colors"
            >
              CLEAR ALL
            </button>
          )}
        </div>

        {/* ---- Shelf contents ---- */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 relative">
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)',
              backgroundSize: '10px 10px',
            }}
          />
          {items.length === 0 ? (
            <div className="text-center py-16 opacity-70 flex flex-col items-center">
              {EMPTY[shelf].glyph}
              <p className="font-retro text-xs text-stone-300">{EMPTY[shelf].head}</p>
              <p className="font-mono text-xs text-stone-500 mt-2 normal-case max-w-[15rem]">{EMPTY[shelf].hint}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 relative z-10 pb-4">
              {items.map((entry, index) => {
                const rating = shelf === 'tried' ? getRating(entry.id) : undefined;
                return (
                  <div key={entry.id} className="relative">
                    <EntryTile entry={entry} onPress={onSelect} index={index} />
                    <button
                      onClick={() => removeFromShelf(shelf, entry.id)}
                      aria-label={`Remove ${entry.name}`}
                      className="absolute top-1 right-1 p-1.5 rounded bg-stone-950/80 border border-stone-700 text-stone-400 hover:text-red-400 hover:border-red-700 transition-colors"
                    >
                      <XCircle size={16} />
                    </button>
                    {shelf === 'tried' && (
                      <button
                        onClick={() => setEditingRating(entry)}
                        className="mt-1 w-full flex items-center gap-2 px-2 py-1 rounded bg-black/30 border border-stone-800 hover:border-amber-700 transition-colors"
                      >
                        <span className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              size={12}
                              className={i < (rating?.rating ?? 0) ? 'text-yellow-400' : 'text-stone-600'}
                              fill={i < (rating?.rating ?? 0) ? '#facc15' : 'none'}
                            />
                          ))}
                        </span>
                        {/* Stars only when unrated — iOS shows no placeholder text. */}
                        {rating?.note ? (
                          <span className="font-mono text-[0.7rem] text-stone-300 truncate flex-1 text-left">{rating.note}</span>
                        ) : (
                          <span className="flex-1" />
                        )}
                        <Pencil size={12} className="text-amber-400 shrink-0" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ---- Clear-all confirm ---- */}
        {confirmingClear && (
          <div className="absolute inset-0 z-30 bg-black/80 flex items-center justify-center p-6">
            <div className="w-full max-w-xs bg-stone-900 border-2 border-red-800 rounded-lg p-5 flex flex-col gap-4">
              <p className="font-retro text-xs tracking-widest text-red-400 text-center">CLEAR ALL {SHELF_TITLE[shelf]}?</p>
              <p className="font-mono text-sm text-stone-300 text-center normal-case">
                {shelf === 'tried'
                  ? `${items.length} tasting${items.length === 1 ? '' : 's'} will be removed — ratings and notes go with them.`
                  : `${items.length} ${items.length === 1 ? 'item' : 'items'} will be removed. This cannot be undone.`}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmingClear(false)}
                  className="flex-1 font-retro text-[0.6rem] tracking-widest text-stone-300 border-2 border-stone-600 rounded py-3 hover:bg-stone-800"
                >
                  CANCEL
                </button>
                <button
                  onClick={() => { clearShelf(shelf); setConfirmingClear(false); }}
                  className="flex-1 font-retro text-[0.6rem] tracking-widest text-white bg-red-700 border-2 border-red-900 rounded py-3 hover:bg-red-600"
                >
                  CLEAR
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ---- Edit rating from the tried shelf ---- */}
        {editingRating && (
          <RatingPrompt
            entryName={editingRating.name}
            initial={getRating(editingRating.id)}
            onSave={(stars, note) => {
              setRating(editingRating.id, makeRating(stars, note));
              setEditingRating(null);
            }}
            onSkip={() => setEditingRating(null)}
          />
        )}

      </div>
    </DeviceLayout>
  );
};

export default BookmarksScreen;
