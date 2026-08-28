import React, { useReducer } from 'react';
import { ChevronDown, ChevronRight, ChevronUp } from 'lucide-react';
import { WineEntry, isRegionEntry } from '@/shared/types';
import { CLIMATE_CLASS_MAP } from '@/shared/data/climateClasses';
import Chip from './Chip';
import {
  getCountryChipColors,
  SYSTEM_CHIP_COLOR,
  CLIMATE_CHIP_COLOR,
  APPELLATION_CHIP_COLORS,
} from '@/shared/services/chipColors';
import { findRelatedEntry } from '@/shared/services/entryUtils';
import {
  getGrapeColorLabel,
  getGrapeBodyLabel,
  getGrapeColorChipColors,
  getGrapeBodyChipColors,
} from '../src/services/grapeDisplay';
import {
  CONTAINER_SIZE_LIST,
  CONTAINER_BORDER_CLASS,
  CONTAINER_SHADOW_CLASS,
  CONTAINER_BORDER,
  ICON_SIZE_LINKED,
} from '../src/services/iconRendering';
import { createEntryVisualResolver, resolveEntryIconVisual } from '../src/services/entryIconVisuals';
import { extractTagAbbrev } from '../src/services/entryDisplay';
import { isOn as isFlagOn, toggleFlag } from '../src/services/screenState';

/**
 * The entry readout's section vocabulary (stage 4, v0.4.3) — the W5/U1
 * decomposition, done AS the conversion rather than before or after it.
 *
 * `EntryDetail.tsx` hand-rolled the same ruled header twenty-seven times and
 * the same linked-entry row in three private closures; iOS split the identical
 * surface into `EntryDetailSections.swift` / `EntryDetailRows.swift` for the
 * identical reason. Extracting *while* converting means the new type and the
 * new surfaces exist in exactly one place each, so the next retune is one
 * edit — which is the whole argument for the split.
 *
 * `EntryDetail.categories.test.tsx` pins the ordered section list per
 * category, which is what makes this decomposition provable rather than
 * hopeful.
 */

export type EntryVisualResolver = ReturnType<typeof createEntryVisualResolver>;

export interface LinkedTileOptions {
  useCountryFlag?: boolean;
  showRegionMetaTiles?: boolean;
  preferCountryGate?: boolean;
}

/**
 * The ruled section header: accent glyph, sans label, the 40%-accent rule.
 *
 * The label moves from Press Start 2P to the sans label step — a section
 * header is wayfinding, not a mark. The glyph inherits `currentColor` from
 * the header's own accent, so callers pass a bare `<Icon size={18} />`.
 */
export const SectionHeader: React.FC<{
  icon: React.ReactNode;
  label: string;
  /** The two authored rhythms: `mb-3` (default) and the tighter `mb-2`. */
  gap?: 'mb-2' | 'mb-3';
}> = ({ icon, label, gap = 'mb-3' }) => (
  <div className={`flex items-center gap-2 ${gap} dex-section-rule pb-1 text-[var(--lcd-accent)]`}>
    {icon}
    <h2 className="text-label uppercase tracking-widest">{label}</h2>
  </div>
);

const formatUpper = (value?: string) => (value ? value.toUpperCase() : 'N/A');

/**
 * One linked-entry row: the card treatment `EntryTile` converted to, with the
 * unresolvable-name state kept (greyed, inert, never dropped — iOS renders
 * every name it is given).
 */
export const LinkedEntryTile: React.FC<{
  label: string;
  allEntries: WineEntry[];
  resolver: EntryVisualResolver;
  onSelect: (entry: WineEntry) => void;
  options?: LinkedTileOptions;
}> = ({ label, allEntries, resolver, onSelect, options }) => {
  const relatedEntry = findRelatedEntry(allEntries, label, options?.preferCountryGate ? 'COUNTRY_GATE' : undefined);
  const linkedVisual = resolveEntryIconVisual(relatedEntry, {
    size: ICON_SIZE_LINKED,
    resolver,
    includeRegionClimateOutline: true,
  });
  const displayName = (relatedEntry?.name || label || 'UNKNOWN').toUpperCase();
  const isLinkable = !!relatedEntry;
  const relatedDetailsClassificationLocal = relatedEntry && 'classification' in relatedEntry.details ? relatedEntry.details.classification : undefined;
  const classificationLabel = relatedDetailsClassificationLocal ? formatUpper(relatedDetailsClassificationLocal) : undefined;
  const isRegionMeta = relatedEntry?.category === 'REGIONS' && options?.showRegionMetaTiles;
  const relatedRegion = relatedEntry && isRegionEntry(relatedEntry) ? relatedEntry : undefined;
  const relatedDetailsOrigin = relatedEntry && 'origin' in relatedEntry.details ? relatedEntry.details.origin : undefined;
  const relatedDetailsClassification = relatedEntry && 'classification' in relatedEntry.details ? relatedEntry.details.classification : undefined;

  const regionCountry = relatedRegion?.details.origin;
  const regionSystem = relatedDetailsClassification;
  const regionClimate = relatedRegion?.climate;
  const regionCountryColors = getCountryChipColors(regionCountry);
  const regionClimateColors = regionClimate ? CLIMATE_CLASS_MAP[regionClimate]?.colors ?? CLIMATE_CHIP_COLOR : CLIMATE_CHIP_COLOR;
  const regionClimateName = regionClimate ? CLIMATE_CLASS_MAP[regionClimate]?.name : undefined;
  const linkedOrigin = relatedDetailsOrigin;
  const linkedOriginColors = getCountryChipColors(linkedOrigin);
  const showLinkedGrapeChips = relatedEntry?.category === 'GRAPES';
  const linkedGrapeColorLabel = showLinkedGrapeChips && relatedEntry ? getGrapeColorLabel(relatedEntry) : undefined;
  const linkedGrapeBodyLabel = showLinkedGrapeChips && relatedEntry ? getGrapeBodyLabel(relatedEntry) : undefined;
  const showLinkedCountryChips = relatedEntry?.category === 'COUNTRY_GATE';
  const linkedCountryAppellations = showLinkedCountryChips && relatedEntry
    ? relatedEntry.tags.filter((tag) => tag !== 'COUNTRY' && tag !== 'STATE')
    : [];

  return (
    <button
      onClick={() => isLinkable && relatedEntry && onSelect(relatedEntry)}
      disabled={!isLinkable}
      className={`w-full rounded-card p-3 flex items-center gap-3 relative overflow-hidden group text-left border ${
        isLinkable
          ? 'dex-pressable bg-[var(--surface-raised)] border-[var(--surface-line)] hover:border-[var(--lcd-accent)] shadow-elev-1'
          : 'bg-[var(--surface-raised)] border-[var(--surface-line)] opacity-70 cursor-default'
      }`}
    >
      <div
        className={`shrink-0 ${CONTAINER_SIZE_LIST} ${CONTAINER_BORDER_CLASS} ${CONTAINER_SHADOW_CLASS} flex items-center justify-center ${CONTAINER_BORDER} ${!isLinkable ? 'grayscale' : ''}`}
        style={linkedVisual.style}
      >
        {linkedVisual.iconNode}
      </div>

      <div className="flex-1 flex items-center gap-2 min-w-0">
        <div className="flex-1">
          <span className={`text-heading leading-tight break-words whitespace-normal ${isLinkable ? 'dex-text group-hover:text-[var(--lcd-accent)]' : 'dex-disabled'}`}>
            {displayName}
          </span>
          {options?.useCountryFlag && classificationLabel && (
            <span className="text-micro tracking-widest uppercase text-[var(--lcd-subtext)] block">
              {classificationLabel}
            </span>
          )}
          {isRegionMeta && (
            <div className="mt-1 flex flex-wrap gap-1">
              {regionCountry && <Chip label={regionCountry} colorStyle={regionCountryColors} />}
              {regionSystem && <Chip label={extractTagAbbrev(regionSystem)} colorStyle={SYSTEM_CHIP_COLOR} />}
              {regionClimate && regionClimateName && (
                <Chip label={regionClimateName} colorStyle={regionClimateColors} />
              )}
            </div>
          )}
          {showLinkedGrapeChips && (
            <div className="mt-1 flex flex-wrap gap-1">
              {linkedGrapeColorLabel && (
                <Chip label={formatUpper(linkedGrapeColorLabel)} colorStyle={getGrapeColorChipColors(linkedGrapeColorLabel)} />
              )}
              {linkedGrapeBodyLabel && (
                <Chip label={formatUpper(linkedGrapeBodyLabel)} colorStyle={getGrapeBodyChipColors(linkedGrapeBodyLabel)} />
              )}
              {linkedOrigin && (
                <Chip label={formatUpper(linkedOrigin)} colorStyle={linkedOriginColors} />
              )}
            </div>
          )}
          {showLinkedCountryChips && linkedCountryAppellations.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {linkedCountryAppellations.map((tag, i) => (
                <Chip key={tag} label={extractTagAbbrev(tag)} colorStyle={APPELLATION_CHIP_COLORS[i % 3]} />
              ))}
            </div>
          )}
        </div>
        {isLinkable && <ChevronRight size={16} className="text-[var(--lcd-subtext)] group-hover:text-[var(--lcd-accent)] shrink-0 ml-2" />}
      </div>
    </button>
  );
};

/**
 * A titled list of linked entries, optionally capped, optionally expandable.
 *
 * Two capping behaviours, both preserved from the hand-rolled originals:
 * a bare `cap` slices silently (the region/grape notable lists), and a `cap`
 * with an `expandKey` shows the SHOW ALL toggle whose open state lives in the
 * screen-state store — it survives Back, which is the point of the store. The
 * repaint is a local counter, so the store stays the single source of truth.
 */
export const LinkedListSection: React.FC<{
  icon: React.ReactNode;
  title: string;
  items: string[];
  allEntries: WineEntry[];
  resolver: EntryVisualResolver;
  onSelect: (entry: WineEntry) => void;
  options?: LinkedTileOptions;
  cap?: number;
  expandKey?: { stateKey: string; flag: string };
  gap?: 'mb-2' | 'mb-3';
}> = ({ icon, title, items, allEntries, resolver, onSelect, options, cap, expandKey, gap }) => {
  const [, forceRender] = useReducer((n: number) => n + 1, 0);
  const expanded = expandKey ? isFlagOn(expandKey.stateKey, expandKey.flag) : false;
  const shown = cap !== undefined && !expanded ? items.slice(0, cap) : items;

  if (items.length === 0) return null;

  return (
    <div className="mb-6">
      <SectionHeader icon={icon} label={title} gap={gap} />
      <div className="grid grid-cols-1 gap-2">
        {shown.map((item, idx) => (
          <LinkedEntryTile
            key={`${item}-${idx}`}
            label={item}
            allEntries={allEntries}
            resolver={resolver}
            onSelect={onSelect}
            options={options}
          />
        ))}
        {expandKey && cap !== undefined && items.length > cap && (
          <button
            onClick={() => {
              toggleFlag(expandKey.stateKey, expandKey.flag);
              forceRender();
            }}
            className="dex-pressable w-full flex items-center justify-center gap-2 py-3 rounded-full border border-[var(--surface-line-strong)] hover:border-[var(--lcd-accent)] text-micro tracking-widest text-[var(--lcd-accent)]"
          >
            {expanded ? <ChevronUp size={13} strokeWidth={3} /> : <ChevronDown size={13} strokeWidth={3} />}
            {expanded ? 'SHOW FEWER' : `EXPAND ALL (${items.length})`}
          </button>
        )}
      </div>
    </div>
  );
};
