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
  parseFilter,
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
  // Validated, not cast (W15) - see `chipFilter.parseFilter`. Unknown facets
  // are dropped one at a time rather than failing the whole filter.
  const [filter, setFilter] = useState<ChipFilter>(() => parseFilter(ssQuery(SS_KEY)));
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
  // Read once on mount: the shelves do not change while this screen is up,
  // and keying it on `filter` re-read storage on every chip tap.
  const snap = useMemo(() => shelfSnapshot(), []);

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
        <div className="rounded-card bg-[var(--surface-raised)] border border-[var(--surface-line-strong)] shadow-elev-1 p-3 flex items-center gap-3">
          <Filter size={26} className="text-[var(--lcd-accent)] shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="font-sans text-heading font-bold text-[var(--lcd-text)]">{total} {total === 1 ? 'MATCH' : 'MATCHES'}</div>
            <div className="font-sans text-caption text-[var(--lcd-subtext)] mt-0.5 normal-case">
              {filterIsEmpty(filter) ? 'Tap chips to narrow the database.' : `${count} chip${count === 1 ? '' : 's'} active`}
            </div>
          </div>
          {!filterIsEmpty(filter) && (
            <button
              onClick={() => setFilter({})}
              className="dex-pressable font-sans text-caption font-semibold tracking-widest text-[var(--livery-red)] border-2 border-[var(--livery-red)] rounded-full px-3 py-1.5"
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
          className="w-full rounded-control border border-[var(--surface-line-strong)] px-3 py-2 font-mono text-sm text-[var(--lcd-body-text)] placeholder:text-[var(--lcd-disabled-text)] focus:border-[var(--lcd-accent)] focus:outline-none bg-[var(--lcd-well)]"
        />

        {/* Chip dropdown toggle */}
        <button
          onClick={() => setShowsChips(v => !v)}
          className="dex-pressable w-full flex items-center gap-2 rounded-control bg-[var(--surface-raised)] border border-[var(--surface-line)] px-3 py-2"
        >
          <SlidersHorizontal size={16} className="text-[var(--lcd-accent)]" />
          <span className="font-sans text-label tracking-widest text-[var(--lcd-text)]">FILTER CHIPS</span>
          {count > 0 && <span className="font-sans text-caption font-semibold tracking-widest bg-[var(--lcd-accent)] text-[var(--lcd-on-accent)] rounded-full px-2 py-0.5">{count} ON</span>}
          <span className="flex-1" />
          <ChevronDown size={16} className={`text-[var(--lcd-subtext)] transition-transform ${showsChips ? 'rotate-180' : ''}`} />
        </button>

        {/* Facet rows */}
        {showsChips && (
          <div className="space-y-4">
            {CHIP_FACETS.map(facet => (
              <div key={facet}>
                <h2 className="font-sans text-label uppercase tracking-widest text-[var(--lcd-accent)] dex-section-rule pb-1">{FACET_TITLE[facet]}</h2>
                <div className="font-sans text-caption text-[var(--lcd-subtext)] mt-1 mb-2 normal-case">{FACET_NOTE[facet]}</div>
                <div className="flex flex-wrap gap-2">
                  {(options[facet] ?? []).map(o => {
                    const on = isOn(filter, o);
                    const cnt = countWithChip(filter, o, allEntries, snap) + (toggleOption(filter, o).category?.includes('COUNTRIES') ? searchableCountries(allEntries).length : 0);
                    const dead = !on && cnt === 0;
                    return (
                      <button
                        key={o.value}
                        onClick={() => setFilter(toggleOption(filter, o))}
                        className={`dex-pressable rounded-full px-3 py-1.5 border font-sans text-caption tracking-wide ${
                          on ? 'bg-[var(--lcd-accent)] border-[var(--lcd-accent)] text-[var(--lcd-on-accent)]' : dead ? 'bg-[var(--surface-raised)] border-[var(--surface-line)] text-[var(--lcd-disabled-text)]' : 'bg-[var(--surface-raised)] border-[var(--surface-line-strong)] text-[var(--lcd-text)]'
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
        <h2 className="font-sans text-label uppercase tracking-widest text-[var(--lcd-accent)] dex-section-rule pb-1 pt-1">
          {filterIsEmpty(filter) ? 'EVERYTHING' : 'MATCHES'}
        </h2>
        {total === 0 ? (
          <div className="text-center py-12 opacity-60 flex flex-col items-center">
            <CircleSlash size={40} className="text-[var(--lcd-disabled-text)] mb-3" />
            <p className="font-sans text-label tracking-widest text-[var(--lcd-text)]">NOTHING MATCHES</p>
            <p className="font-sans text-caption text-[var(--lcd-subtext)] mt-2 normal-case">{q ? 'Nothing fits the chips and the search together.' : 'Those chips have no overlap. Turn one off.'}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 pb-4">
            {countryResults.map(name => {
              const flag = getFlagImage(name);
              return (
                <button
                  key={`c:${name}`}
                  onClick={() => onSelectCountry(name)}
                  className="dex-pressable w-full flex items-center gap-3 p-3 rounded-card bg-[var(--surface-raised)] border border-[var(--surface-line)] hover:border-[var(--lcd-accent)] shadow-elev-1"
                >
                  {flag ? (
                    <img src={flag} alt="" className="w-8 h-6 object-cover rounded shrink-0" />
                  ) : (
                    <span className="w-8 h-6 rounded bg-[var(--surface-high)] shrink-0" />
                  )}
                  <span className="flex-1 text-left font-sans text-label tracking-wide text-[var(--lcd-text)]">{name.toUpperCase()}</span>
                  <ChevronRight size={18} className="text-[var(--lcd-subtext)]" />
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
