import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
// The union of what the merged body actually renders: the parity line's
// Filter/ListChecks chrome plus the X still used by master's filter pill.
import { Search, Filter, ListChecks, X } from "lucide-react";
import EntryTile from "./EntryTile";
import DeviceLayout from "./DeviceLayout";
import { WineEntry, EntryCategory, ClimateClass } from "@/shared/types";
import { CLIMATE_CLASS_MAP } from "@/shared/data/climateClasses";
import { getAllEntries } from "../src/services/wineData";
import { filterEntries } from "../src/services/entryFilter";
import { keyForList, query as storedQuery, setQuery as setStoredQuery } from "../src/services/screenState";
import { useScreenAnchor } from "../src/services/useScreenAnchor";

interface EncyclopediaListProps {
  category: EntryCategory;
  filterMode: 'REGION' | 'TYPE' | 'TASTING' | 'SOIL' | 'ORIGIN' | 'STATE' | 'RARITY' | 'SYSTEM' | 'CLIMATE' | null;
  filterValue: string | string[] | null;
  initialSearchQuery?: string;
  onSelect: (entry: WineEntry) => void;
  onBack: () => void;
  onHome: () => void;
}

export default function EncyclopediaList({ category, filterMode, filterValue, initialSearchQuery, onSelect, onBack, onHome }: EncyclopediaListProps) {
  const entries = useMemo(() => getAllEntries(), []);
  const SEARCH_INPUT_START_OFFSET = 16;
  const [cursorOffset, setCursorOffset] = useState(SEARCH_INPUT_START_OFFSET);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchMeasureRef = useRef<HTMLSpanElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // The listing is URL-addressed, so the URL is the instance key: /list/GRAPES
  // and /list/GRAPES?filterMode=TYPE&filterValue=RED are different listings and
  // must not share a scroll position or a query.
  const location = useLocation();
  const listKey = keyForList(`${location.pathname}${location.search}`);
  useScreenAnchor(listKey, scrollRef);

  /**
   * The query is mirrored into local state for the controlled input, but the
   * store is what survives navigation — returning from a result used to drop
   * you into the unfiltered list with an empty field, so reaching the *second*
   * result meant retyping the search.
   *
   * Seeded from the store first and the URL's `q` second: a stored query is
   * something the user typed a moment ago, while `q` is where they arrived
   * from, and the more recent of the two should win.
   */
  const [searchQuery, setSearchQueryLocal] = useState(
    () => storedQuery(listKey) || initialSearchQuery || '',
  );

  const setSearchQuery = (value: string) => {
    setSearchQueryLocal(value);
    setStoredQuery(listKey, value);
  };

  const activeFilterMode = filterMode;
  const activeFilterValue = filterValue;
  const isMasterSearch = category === 'MASTER_SEARCH';
  const isWorldSearch = category === 'WORLD_SEARCH';
  const effectiveCategory = isMasterSearch ? 'GRAPES' : category;
  const showTopSearchBar = isMasterSearch || isWorldSearch || effectiveCategory === 'GRAPES' || effectiveCategory === 'STYLES' || effectiveCategory === 'FLAVORS';

  // Re-seed when the listing itself changes — a different URL is a different
  // search. Keyed on `listKey` rather than `category`, since two listings of
  // the same category under different filters are different searches too.
  useEffect(() => {
    setSearchQueryLocal(storedQuery(listKey) || initialSearchQuery || '');
  }, [listKey, initialSearchQuery]);

  const updateSearchCursorOffset = useCallback(() => {
    const inputEl = searchInputRef.current;
    const measureEl = searchMeasureRef.current;
    if (!inputEl || !measureEl) return;

    const caretIndex = inputEl.selectionStart ?? inputEl.value.length;
    measureEl.textContent = inputEl.value.slice(0, caretIndex);

    const measuredWidth = measureEl.getBoundingClientRect().width;
    const maxOffset = Math.max(SEARCH_INPUT_START_OFFSET, inputEl.clientWidth - 8);
    setCursorOffset(Math.min(measuredWidth + SEARCH_INPUT_START_OFFSET, maxOffset));
  }, [SEARCH_INPUT_START_OFFSET]);

  useEffect(() => {
    updateSearchCursorOffset();
  }, [searchQuery, updateSearchCursorOffset]);

  useEffect(() => {
    const handleResize = () => updateSearchCursorOffset();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateSearchCursorOffset]);

  /**
   * The predicate now lives in `entryFilter.ts`, matching how iOS keeps it in
   * `EntryFilter.swift` rather than inside the view. It was ~120 lines of
   * closure over eight component locals here, which is why the Swift suite that
   * claims to cover it had no runnable counterpart on this side.
   */
  const filteredEntries = useMemo(
    () => filterEntries(entries, {
      category,
      filterMode: activeFilterMode,
      filterValue: activeFilterValue,
      search: searchQuery,
    }),
    [category, searchQuery, activeFilterMode, activeFilterValue, entries],
  );

  const getTitle = () => {
      if (category === 'MASTER_SEARCH') return 'MASTER SEARCH';
      if (category === 'WORLD_SEARCH') return 'WORLD SEARCH';
      if (activeFilterMode === 'REGION') return category === 'COUNTRY_GATE' ? "AREA SCAN" : "SECTOR SCAN";
      if (activeFilterMode === 'TYPE') return "STYLE SCAN";
      if (activeFilterMode === 'TASTING') return "FLAVOR SCAN";
      if (activeFilterMode === 'SOIL') return "GEOLOGY SCAN";
      if (activeFilterMode === 'ORIGIN') return "REGION SCAN";
      if (activeFilterMode === 'STATE') return "STATE SCAN";
      if (activeFilterMode === 'CLIMATE') return "CLIMATE SCAN";
      if (activeFilterMode === 'SYSTEM') return "SYSTEM SCAN";
      
      switch(effectiveCategory) {
          case 'GRAPES': return 'VARIETIES';
          case 'REGIONS': return 'REGIONS';
          case 'STYLES': return 'STYLES';
          case 'COUNTRY_GATE': return 'COUNTRIES';
          case 'FLAVORS': return 'FLAVORS';
          default: return 'DATABASE';
      }
  };

  // iOS uses a single funnel glyph (line.3.horizontal.decrease.circle.fill) in
  // the accent colour for every filter mode, rather than a per-mode glyph.
  const getFilterIcon = () => <Filter size={24} className="text-[var(--lcd-accent)]" />;

  const getFilterText = () => {
      const val = typeof activeFilterValue === 'string' ? activeFilterValue.toUpperCase() : 'SELECTION';
      if (activeFilterMode === 'REGION') return "FILTER: REGIONAL SECTOR";
      if (activeFilterMode === 'TYPE') return `FILTER: ${val}`;
      if (activeFilterMode === 'TASTING') return `FILTER: ${val}`;
      if (activeFilterMode === 'SOIL') return `FILTER: ${val}`;
      if (activeFilterMode === 'ORIGIN') return `FILTER: REGION ${val}`;
      if (activeFilterMode === 'STATE') return `FILTER: STATE ${val}`;
      if (activeFilterMode === 'RARITY') return `FILTER: ${val} RARITY`;
      if (activeFilterMode === 'SYSTEM') return `FILTER: ${val} SYSTEM`;
      if (activeFilterMode === 'CLIMATE') {
        const label = typeof activeFilterValue === 'string' ? CLIMATE_CLASS_MAP[activeFilterValue as ClimateClass]?.name || val : val;
        return `FILTER: ${label} CLIMATE`;
      }
      return "";
  };

  const showFilterIndicator = !isMasterSearch && !!filterMode;

  return (
    <DeviceLayout
      title={getTitle()}
      subtitle={isMasterSearch ? "MASTER SEARCH MODE" : isWorldSearch ? "PLACE SEARCH MODE" : "LIST MODE"}
      onBack={onBack}
      showBack={true}
      centerHeaderText={true}
      onHome={onHome}
    >
      {/* Stage 4 (v0.4.3): surfaces move onto the token ramp — `--surface-*`
          resolves from the mode's own colours, so nothing here needs the
          `.lcd-themed` palette remap any more. */}
      <div className="flex flex-col h-full min-h-0 bg-[var(--surface-raised)]">
        {showFilterIndicator && (
          <div className="bg-[var(--surface-high)] border-b border-[var(--surface-line)] px-4 py-3 flex items-center gap-3 animate-in slide-in-from-top-2">
            <span className="[&>svg]:!w-6 [&>svg]:!h-6">{getFilterIcon()}</span>
            <span className="text-label tracking-widest text-[var(--lcd-text)]">{getFilterText()}</span>
          </div>
        )}

        <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar p-3 bg-[var(--surface-base)] relative">
          {/* The grid wash, drawn from the mode's own ink rather than a fixed
              #333 — same move the portal's RetroGrid made in v9#m4. The pale
              modes soften it through the `data-lcd-light` opacity rule. */}
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(color-mix(in srgb, var(--lcd-text) 30%, transparent) 1px, transparent 1px), ' +
                'linear-gradient(90deg, color-mix(in srgb, var(--lcd-text) 30%, transparent) 1px, transparent 1px)',
              backgroundSize: '10px 10px',
            }}
          />

          {showTopSearchBar && (
            // A legal restore target in its own right, so a list left scrolled
            // to the very top comes back with the search bar in view rather
            // than nudged past it.
            <div data-screen-anchor="__searchbar__" className="relative z-10 mb-3">
              {/*
                Explicitly the LCD "well" colour rather than the page ground.
                iOS gives search fields their own `lcd.well` — black on the dark
                theme, white on the light one — so the field reads as a recess
                cut into the page. Letting the bg-black remap take it would make
                it page-coloured in light mode and lose that read entirely.
              */}
              <div
                className="flex flex-row items-center justify-between h-12 border border-[var(--surface-line-strong)] px-3 shadow-inner rounded-full"
                style={{ backgroundColor: 'var(--lcd-well)' }}
              >
                {/* The pulse is gone (stage 4): an infinite pulse on a control
                    that is always available says something is happening when
                    nothing is — the same call v9#m5 made on the dial hub. */}
                <Search size={22} className="text-[var(--lcd-accent)] shrink-0" />
                <div className="relative flex-1 h-full ml-2">
                  <span
                    ref={searchMeasureRef}
                    aria-hidden="true"
                    className="absolute left-0 top-1/2 -translate-y-1/2 invisible whitespace-pre text-2xl leading-none font-mono font-bold uppercase"
                  />
                  {/* The input keeps VT323 and the block cursor on purpose —
                      an LCD-terminal moment the stage-4 language reserves the
                      mono face for. Its colours move onto the mode's tokens. */}
                  <input
                    ref={searchInputRef}
                    type="text"
                    autoFocus={false}
                    className="w-full text-2xl leading-none font-bold text-[var(--lcd-accent)] outline-none bg-transparent placeholder:text-[var(--lcd-disabled-text)] placeholder:font-bold font-mono uppercase h-full pl-4"
                    placeholder="INPUT SEARCH..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                    }}
                    onClick={updateSearchCursorOffset}
                    onKeyUp={updateSearchCursorOffset}
                    onSelect={updateSearchCursorOffset}
                  />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-2 h-6 bg-[var(--lcd-accent)] animate-blink pointer-events-none"
                    style={{ left: `${cursorOffset}px` }}
                  ></div>
                </div>
                {/*
                  Clear button, shown only while there is something to clear —
                  iOS added one in the same pass (audit L34). Emptying the field
                  by hand meant holding backspace through a query the store had
                  deliberately kept alive across Back.

                  44px square around the 18px glyph: the same minimum-target
                  rule the audit applied to the destructive bookmark control.
                */}
                {searchQuery && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => {
                      setSearchQuery('');
                      searchInputRef.current?.focus();
                    }}
                    className="dex-pressable w-11 h-11 -mr-2 shrink-0 flex items-center justify-center rounded-full text-[var(--lcd-accent)]"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            </div>
          )}

          {filteredEntries.length === 0 ? (
            <div className="text-center py-20 opacity-60 flex flex-col items-center">
              <ListChecks size={40} className="text-[var(--livery-red)] mb-4" />
              <p className="text-label tracking-widest text-[var(--livery-red)]">NO DATA FOUND</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 relative z-10 pb-4" data-coachmark="listingRow">
              {filteredEntries.map((entry, index) => (
                <EntryTile
                  key={entry.id}
                  entry={entry}
                  onPress={onSelect}
                  index={index}
                  // Row-level restore: coming back from an entry lands on the
                  // row you tapped. An id that the current filter no longer
                  // yields simply resolves to nothing and the list opens at top.
                  anchorId={entry.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </DeviceLayout>
  );
}
