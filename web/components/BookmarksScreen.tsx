import React, { useMemo, useRef, useState } from 'react';
import { Bookmark, XCircle, PlusCircle, CheckCircle2, Camera, SquarePen, Check, Star, BookOpen, UserRound, Flame } from 'lucide-react';
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
import DexAlert from './DexAlert';
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
  saved: { glyph: <Bookmark size={44} className="text-[var(--lcd-accent)] opacity-70 mb-3" />, head: 'NOTHING SAVED', hint: 'Tap SAVE on any entry to keep it here.' },
  wantToTry: { glyph: <PlusCircle size={44} className="text-[var(--lcd-accent)] opacity-70 mb-3" />, head: 'NOTHING ON THE WISHLIST', hint: 'Tap WANT on a grape or style you’re curious about.' },
  tried: { glyph: <CheckCircle2 size={44} className="text-[var(--lcd-accent)] opacity-70 mb-3" />, head: 'NOTHING TRIED YET', hint: 'Tap TRIED on a grape or style you’ve drunk — then rate it.' },
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
  const [pendingRemove, setPendingRemove] = useState<WineEntry | null>(null);
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
      <div className="flex flex-col h-full min-h-0 bg-[var(--surface-base)] relative">

        {/* ---- Profile ---- */}
        <div className="bg-[var(--surface-raised)] border-b border-[var(--surface-line)] px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => fileRef.current?.click()}
            aria-label="Change photo"
            className="dex-pressable relative w-16 h-16 shrink-0 rounded-full border-2 border-[var(--lcd-accent)] overflow-hidden bg-[var(--surface-high)] flex items-center justify-center"
          >
            {avatar ? (
              <img src={avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <UserRound size={30} className="text-[var(--lcd-subtext)]" />
            )}
            <span className="absolute bottom-0 right-0 bg-[var(--lcd-accent)] rounded-tl-md p-0.5">
              <Camera size={11} className="text-[var(--lcd-on-accent)]" />
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
                  className="flex-1 min-w-0 bg-[var(--lcd-well)] border border-[var(--surface-line-strong)] rounded-control px-2 py-1 text-label text-[var(--lcd-text)] placeholder:text-[var(--lcd-disabled-text)] focus:border-[var(--lcd-accent)] focus:outline-none"
                />
                <button onClick={commitName} aria-label="Save name" className="text-[var(--lcd-accent)] p-1">
                  <Check size={18} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-heading text-[var(--lcd-text)] tracking-wide truncate">
                  {name ? name.toUpperCase() : 'TASTER'}
                </span>
                <button onClick={startEditName} aria-label="Edit name" className="text-[var(--lcd-subtext)] hover:text-[var(--lcd-accent)] p-1">
                  <SquarePen size={14} />
                </button>
              </div>
            )}
            {/* Streak + PASSPORT. */}
            <div className="mt-2 flex items-center gap-2">
              {streak > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 bg-[var(--surface-raised)] border border-[var(--surface-line)]">
                  <Flame size={12} className="text-[var(--livery-amber)]" />
                  <span className="text-micro tracking-widest text-[var(--lcd-text)]">{streak} DAY{streak === 1 ? '' : 'S'}</span>
                </span>
              )}
              <button
                onClick={onPassport}
                className="dex-pressable inline-flex items-center gap-1.5 rounded-full px-3 py-1 bg-[var(--lcd-accent)]"
              >
                <BookOpen size={12} className="text-[var(--lcd-on-accent)]" />
                <span className="text-micro tracking-widest text-[var(--lcd-on-accent)]">PASSPORT</span>
              </button>
            </div>
          </div>
        </div>

        {/* ---- Recently viewed ---- */}
        {recents.length > 0 && (
          <div className="bg-[var(--surface-raised)] border-b border-[var(--surface-line)] px-3 py-2">
            <h2 className="text-micro tracking-widest text-[var(--lcd-subtext)] mb-1.5 px-1">RECENTLY VIEWED</h2>
            <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
              {recents.map(entry => {
                const v = resolveEntryIconVisual(entry, { size: 26, resolver });
                return (
                  <button
                    key={entry.id}
                    onClick={() => onSelect(entry)}
                    className="flex flex-col items-center gap-1 w-14 shrink-0"
                  >
                    <span className="w-12 h-12 rounded-control border border-[var(--surface-line-strong)] flex items-center justify-center overflow-hidden" style={v.style}>
                      {v.iconNode}
                    </span>
                    <span className="text-caption text-[var(--lcd-text)] leading-tight text-center w-full truncate line-clamp-1">
                      {entry.name.toUpperCase()}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ---- Shelf switcher ---- */}
        <div className="flex gap-1 px-3 py-2 bg-[var(--surface-high)] border-b border-[var(--surface-line)]">
          {SHELVES.map(s => {
            const active = s === shelf;
            return (
              <button
                key={s}
                onClick={() => setShelf(s)}
                className={`dex-pressable flex-1 rounded-control py-2  text-micro  tracking-widest ${
                  active ? 'bg-[var(--lcd-accent)] text-[var(--lcd-on-accent)]' : 'bg-[var(--surface-raised)] text-[var(--lcd-subtext)] hover:text-[var(--lcd-text)]'
                }`}
              >
                {SHELF_TAB[s]} {counts[s]}
              </button>
            );
          })}
        </div>

        {/* ---- Shelf header ---- */}
        <div className="flex items-center gap-2 px-4 py-2 bg-[var(--surface-raised)] border-b border-[var(--surface-line)]">
          <h2 className="text-label tracking-widest text-[var(--lcd-accent)]">{SHELF_TITLE[shelf]}</h2>
          <span className="flex-1" />
          {items.length > 0 && (
            <button
              onClick={() => setConfirmingClear(true)}
              className="dex-pressable text-micro tracking-widest text-[var(--livery-red)] border border-[var(--livery-red)] rounded-control px-2 py-1"
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
              backgroundImage:
                'linear-gradient(color-mix(in srgb, var(--lcd-text) 30%, transparent) 1px, transparent 1px), ' +
                'linear-gradient(90deg, color-mix(in srgb, var(--lcd-text) 30%, transparent) 1px, transparent 1px)',
              backgroundSize: '10px 10px',
            }}
          />
          {items.length === 0 ? (
            <div className="text-center py-16 opacity-70 flex flex-col items-center">
              {EMPTY[shelf].glyph}
              <p className="text-label tracking-widest text-[var(--lcd-text)]">{EMPTY[shelf].head}</p>
              <p className="text-caption text-[var(--lcd-subtext)] mt-2 normal-case max-w-[15rem] leading-relaxed">{EMPTY[shelf].hint}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 relative z-10 pb-4">
              {items.map((entry, index) => {
                const rating = shelf === 'tried' ? getRating(entry.id) : undefined;
                return (
                  <div key={entry.id} className="relative">
                    <EntryTile entry={entry} onPress={onSelect} index={index} />
                    {/*
                      44px hit target around the ~28px visual, matching the
                      audit's M25 fix on iOS. The destructive control was the
                      smallest tap target in the app, and it sits a few pixels
                      from the tile that opens the entry — so a near-miss opened
                      something instead of removing it.
                    */}
                    <button
                      onClick={() => setPendingRemove(entry)}
                      aria-label={`Remove ${entry.name}`}
                      className="absolute -top-1.5 -right-1.5 w-11 h-11 flex items-center justify-center group"
                    >
                      <span className="p-1.5 rounded bg-[var(--surface-base)] border border-[var(--surface-line-strong)] text-[var(--lcd-subtext)] group-hover:text-[var(--livery-red)] group-hover:border-[var(--livery-red)] transition-colors">
                        <XCircle size={16} />
                      </span>
                    </button>
                    {shelf === 'tried' && (
                      <button
                        onClick={() => setEditingRating(entry)}
                        className="dex-pressable mt-1 w-full flex items-center gap-2 px-2 py-1 rounded-control bg-[var(--surface-raised)] border border-[var(--surface-line)] hover:border-[var(--livery-amber)]"
                      >
                        <span className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              size={12}
                              className={i < (rating?.rating ?? 0) ? 'text-[var(--livery-amber)]' : 'text-[var(--lcd-disabled-text)]'}
                              fill={i < (rating?.rating ?? 0) ? 'currentColor' : 'none'}
                            />
                          ))}
                        </span>
                        {/* Stars only when unrated — iOS shows no placeholder text. */}
                        {rating?.note ? (
                          <span className="text-caption text-[var(--lcd-text)] normal-case truncate flex-1 text-left">{rating.note}</span>
                        ) : (
                          <span className="flex-1" />
                        )}
                        <SquarePen size={12} className="text-[var(--livery-amber)] shrink-0" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ---- Clear-all confirm ---- */}
        {/* Through DexAlert since stage 4 (the audit's M19 modal semantics
            travel with the primitive: role, aria-modal, Escape, safe-action
            focus). The alert card is fixed-colour by design. */}
        {confirmingClear && (
          <DexAlert
            tone="red"
            role="alertdialog"
            title={`CLEAR ALL ${SHELF_TITLE[shelf]}?`}
            ariaLabel={`Clear all ${SHELF_TITLE[shelf].toLowerCase()}`}
            onDismiss={() => setConfirmingClear(false)}
            actions={[
              { label: 'CANCEL', kind: 'cancel', onClick: () => setConfirmingClear(false) },
              { label: 'CLEAR', kind: 'confirm', onClick: () => { clearShelf(shelf); setConfirmingClear(false); } },
            ]}
          >
            {shelf === 'tried'
              ? `${items.length} tasting${items.length === 1 ? '' : 's'} will be removed - ratings and notes go with them.`
              : `${items.length} ${items.length === 1 ? 'item' : 'items'} will be removed. This cannot be undone.`}
          </DexAlert>
        )}

        {/* ---- Single-item remove confirm ---- */}
        {pendingRemove && (
          <DexAlert
            tone="red"
            role="alertdialog"
            title={`REMOVE FROM ${SHELF_TITLE[shelf]}?`}
            ariaLabel={`Remove from ${SHELF_TITLE[shelf].toLowerCase()}`}
            onDismiss={() => setPendingRemove(null)}
            actions={[
              { label: 'CANCEL', kind: 'cancel', onClick: () => setPendingRemove(null) },
              { label: 'REMOVE', kind: 'confirm', onClick: () => { removeFromShelf(shelf, pendingRemove.id); setPendingRemove(null); } },
            ]}
          >
            {pendingRemove.name.toUpperCase()}
          </DexAlert>
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
