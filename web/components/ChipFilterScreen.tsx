import React, { useEffect, useMemo, useState } from 'react';
import { SlidersHorizontal, Filter, ChevronDown, CircleSlash, ChevronRight } from 'lucide-react';
import DeviceLayout from './DeviceLayout';
import EntryTile from './EntryTile';
import { WineEntry } from '@/shared/types';
import { getFlagImage } from '../data/flagImages';
import {
  ChipFilter,
  CHIP_FACETS,
  FACET_TITLE,
  FACET_NOTE,
  facetOptions,
  isOn,
  toggleOption,
  matchingEntries,
  countWithChip,
  filterCount,
  filterIsEmpty,
  includesCountries,
  searchableCountries,
  shelfSnapshot,
} from '../src/services/chipFilter';
import { query as ssQuery, setQuery as ssSetQuery } from '../src/services/screenState';

interface ChipFilterScreenProps {
  allEntries: WineEntry[];
  onSelect: (entry: WineEntry) => void;
  onSelectCountry: (name: string) => void;
  onBack: () => void;
  onHome: () => void;
}

const SS_KEY = 'chipFilter';

const ChipFilterScreen: React.FC<ChipFilterScreenProps> = ({ allEntries, onSelect, onSelectCountry, onBack, onHome }) => {
  const [filter, setFilter] = useState<ChipFilter>(() => {
    try {
      const raw = ssQuery(SS_KEY);
      return raw ? (JSON.parse(raw) as ChipFilter) : {};
    } catch {
      return {};
    }
  });
  const [query, setSearch] = useState('');
  const [showsChips, setShowsChips] = useState(false);

  // Persist through the screen-state store so a trip into an entry and Back
  // keeps the filter (session only, matching iOS).
  useEffect(() => {
    ssSetQuery(SS_KEY, filterIsEmpty(filter) ? '' : JSON.stringify(filter));
  }, [filter]);

  const options = useMemo(() => Object.fromEntries(CHIP_FACETS.map(f => [f, facetOptions(f, allEntries)])), [allEntries]);
  const q = query.trim().toLowerCase();

  // One read of the shelves per render — the shelf facet matches against this
  // rather than re-reading storage for every entry and every chip count.
  const snap = useMemo(() => shelfSnapshot(), [filter, allEntries]);

  const results = useMemo(() => {
    let list = matchingEntries(filter, allEntries, snap);
    if (q) list = list.filter(e => e.name.toLowerCase().includes(q));
    return list;
  }, [filter, allEntries, q, snap]);

  const countryResults = useMemo(() => {
    if (!includesCountries(filter)) return [];
    const all = searchableCountries(allEntries);
    return q ? all.filter(c => c.toLowerCase().includes(q)) : all;
  }, [filter, allEntries, q]);

  const total = results.length + countryResults.length;
  const count = filterCount(filter);

  return (
    <DeviceLayout title="MASTER SEARCH" subtitle="" showBack onBack={onBack} onHome={onHome} centerHeaderText>
      <div className="h-full overflow-y-auto custom-scrollbar p-3 space-y-3" style={{ backgroundColor: 'var(--lcd-page)' }}>

        {/* Summary */}
        <div className="rounded-xl bg-stone-900/70 border-2 border-green-800 p-3 flex items-center gap-3">
          <Filter size={26} className="text-green-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="font-retro text-base text-green-200">{total} {total === 1 ? 'MATCH' : 'MATCHES'}</div>
            <div className="font-mono text-xs text-stone-400 mt-0.5">
              {filterIsEmpty(filter) ? 'Tap chips to narrow the database.' : `${count} chip${count === 1 ? '' : 's'} active`}
            </div>
          </div>
          {!filterIsEmpty(filter) && (
            <button
              onClick={() => setFilter({})}
              className="font-retro text-[0.55rem] tracking-widest text-red-400 border-2 border-red-800 rounded-full px-3 py-1.5 hover:bg-red-950"
            >
              RESET
            </button>
          )}
        </div>

        {/* Search. Focused on arrival (iOS AUDIT L35): the one route whose
            whole purpose is typing should not make you tap the field first —
            and since the orb became the only way here (v6#11), every arrival
            is that route. */}
        <input
          type="text"
          autoFocus
          value={query}
          onChange={e => setSearch(e.target.value)}
          placeholder="SEARCH MATCHES…"
          aria-label="Search matches"
          className="w-full rounded-lg bg-black/40 border-2 border-stone-700 px-3 py-2 font-mono text-sm text-green-200 placeholder:text-stone-600 focus:border-green-600 focus:outline-none"
        />

        {/* Chip dropdown toggle */}
        <button
          onClick={() => setShowsChips(v => !v)}
          className="w-full flex items-center gap-2 rounded-lg bg-stone-900/70 border-2 border-stone-700 px-3 py-2"
        >
          <SlidersHorizontal size={16} className="text-green-400" />
          <span className="font-retro text-[0.6rem] tracking-widest text-stone-200">FILTER CHIPS</span>
          {count > 0 && <span className="font-retro text-[0.5rem] tracking-widest bg-green-600 text-white rounded-full px-2 py-0.5">{count} ON</span>}
          <span className="flex-1" />
          <ChevronDown size={16} className={`text-stone-400 transition-transform ${showsChips ? 'rotate-180' : ''}`} />
        </button>

        {/* Facet rows */}
        {showsChips && (
          <div className="space-y-4">
            {CHIP_FACETS.map(facet => (
              <div key={facet}>
                <div className="font-retro text-[0.55rem] tracking-widest text-green-400 border-b border-green-900 pb-1">{FACET_TITLE[facet]}</div>
                <div className="font-mono text-[0.65rem] text-stone-500 mt-1 mb-2 normal-case">{FACET_NOTE[facet]}</div>
                <div className="flex flex-wrap gap-2">
                  {(options[facet] ?? []).map(o => {
                    const on = isOn(filter, o);
                    const cnt = countWithChip(filter, o, allEntries, snap) + (toggleOption(filter, o).category?.includes('COUNTRIES') ? searchableCountries(allEntries).length : 0);
                    const dead = !on && cnt === 0;
                    return (
                      <button
                        key={o.value}
                        onClick={() => setFilter(toggleOption(filter, o))}
                        className={`rounded-full px-3 py-1.5 border-2 font-retro text-[0.5rem] tracking-widest transition-colors ${
                          on ? 'bg-green-600 border-green-400 text-white' : dead ? 'bg-stone-900/40 border-stone-800 text-stone-600' : 'bg-stone-900/70 border-stone-700 text-stone-300'
                        }`}
                      >
                        {o.label} <span className="opacity-70">{cnt}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Results */}
        <div className="font-retro text-[0.55rem] tracking-widest text-green-400 border-b border-green-900 pb-1 pt-1">
          {filterIsEmpty(filter) ? 'EVERYTHING' : 'MATCHES'}
        </div>
        {total === 0 ? (
          <div className="text-center py-12 opacity-60 flex flex-col items-center">
            <CircleSlash size={40} className="text-stone-600 mb-3" />
            <p className="font-retro text-xs text-stone-300">NOTHING MATCHES</p>
            <p className="font-mono text-xs text-stone-500 mt-2 normal-case">{q ? 'Nothing fits the chips and the search together.' : 'Those chips have no overlap. Turn one off.'}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 pb-4">
            {countryResults.map(name => {
              const flag = getFlagImage(name);
              return (
                <button
                  key={`c:${name}`}
                  onClick={() => onSelectCountry(name)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-stone-900/70 border-2 border-stone-700 hover:border-stone-500 transition-colors"
                >
                  {flag ? (
                    <img src={flag} alt="" className="w-8 h-6 object-cover rounded shrink-0" />
                  ) : (
                    <span className="w-8 h-6 rounded bg-stone-700 shrink-0" />
                  )}
                  <span className="flex-1 text-left font-retro text-[0.6rem] tracking-widest text-stone-200">{name.toUpperCase()}</span>
                  <ChevronRight size={18} className="text-stone-400" />
                </button>
              );
            })}
            {results.map((entry, index) => (
              <EntryTile key={entry.id} entry={entry} onPress={onSelect} index={index} />
            ))}
          </div>
        )}

      </div>
    </DeviceLayout>
  );
};

export default ChipFilterScreen;
