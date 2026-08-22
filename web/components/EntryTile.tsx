import React, { useMemo } from 'react';
import { WineEntry, isFlavorEntry, isGrapeEntry, isRegionEntry, isStyleEntry } from '@/shared/types';
import { ChevronRight } from 'lucide-react';
import { CLIMATE_CLASS_MAP } from '@/shared/data/climateClasses';
import { CONTAINER_SIZE_LIST, CONTAINER_BORDER_CLASS, CONTAINER_SHADOW_CLASS, CONTAINER_BORDER, ICON_SIZE_LIST } from '../src/services/iconRendering';
import { getAllEntries } from '../src/services/wineData';
import { extractTagAbbrev } from '../src/services/entryDisplay';
import { createEntryVisualResolver, resolveEntryIconVisual } from '../src/services/entryIconVisuals';
import Chip from './Chip';
import { getGrapeColorLabel, getGrapeBodyLabel, getGrapeColorChipColors, getGrapeBodyChipColors } from '../src/services/grapeDisplay';
import {
  getCountryChipColors,
  getColorTypeChipColors,
  getStyleClassChipColors,
  getFlavorClassChipColors,
  getFlavorSubclassChipColors,
  SYSTEM_CHIP_COLOR,
  APPELLATION_CHIP_COLORS,
} from '@/shared/services/chipColors';
import { getColorType, getStyleClassType } from '@/shared/services/entryUtils';

interface EntryTileProps {
  entry: WineEntry;
  onPress: (entry: WineEntry) => void;
  index: number;
  /**
   * Marks this row as a scroll-restore target — see `useScreenAnchor`. Optional
   * so a list that does not restore its position renders no stray attribute.
   */
  anchorId?: string;
}

const formatLabelUpper = (label?: string) => {
  if (!label) return '';
  return label.replace(/_/g, ' ').toUpperCase();
};

const formatTitle = (value?: string) => {
  if (!value) return '';
  return value
    .split(/[\s_-]+/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const formatUpper = (value?: string) => {
  if (!value) return '';
  return value.replace(/_/g, ' ').toUpperCase();
};

const EntryTile: React.FC<EntryTileProps> = ({ entry, onPress, index, anchorId }) => {
  const isGrape = isGrapeEntry(entry);
  const isRegion = isRegionEntry(entry);
  const isCountryGate = entry.category === 'COUNTRY_GATE';
  const isStyle = isStyleEntry(entry);
  const isFlavor = isFlavorEntry(entry);
  const isContinent = entry.category === 'CONTINENTS';
  const climateMeta = isRegionEntry(entry) && entry.climate ? CLIMATE_CLASS_MAP[entry.climate] : undefined;
  const originLabel = 'origin' in entry.details ? entry.details.origin || '' : '';
  const country = originLabel;

  const styleClassType = isStyleEntry(entry) ? getStyleClassType(entry.name, entry.details.classification) : undefined;
  const styleColorType = isStyleEntry(entry) ? getColorType(entry.name) : undefined;

  // Shared hex color styles (consistent with EntryDetail scan chips)
  const grapeOriginColors = isGrapeEntry(entry) && originLabel ? getCountryChipColors(originLabel) : null;
  const countryColors = isRegionEntry(entry) ? getCountryChipColors(country) : null;
  const styleClassColors = getStyleClassChipColors(styleClassType);
  const styleColorColors = getColorTypeChipColors(styleColorType);
  const styleCountryColors = isStyleEntry(entry) && entry.details.origin ? getCountryChipColors(entry.details.origin) : null;
  const flavorClassColors = isFlavorEntry(entry) ? getFlavorClassChipColors(entry.details.classification) : null;
  const flavorSubclassColors = isFlavorEntry(entry) ? getFlavorSubclassChipColors(entry.details.subclass) : null;

  const styleClassLabel = formatTitle(styleClassType);
  const styleColorLabel = formatTitle(styleColorType);
  const styleCountryLabel = formatUpper(isStyleEntry(entry) ? (entry.details.origin || '') : '');
  const flavorClassLabel = formatLabelUpper(isFlavorEntry(entry) ? entry.details.classification : '');
  const flavorSubclassLabel = formatLabelUpper(isFlavorEntry(entry) ? entry.details.subclass : '');
  const grapeOriginLabel = formatUpper(originLabel);

  const entryVisualResolver = useMemo(() => createEntryVisualResolver({ entries: getAllEntries() }), []);
  const entryVisual = resolveEntryIconVisual(entry, {
    size: ICON_SIZE_LIST,
    resolver: entryVisualResolver,
    includeRegionClimateOutline: true,
  });

  const renderedIcon = entryVisual.iconNode;

  return (
    // Stage 4 (v0.4.3): the row becomes a card — tokened surface, one soft
    // shadow, the card radius — and drops its retro dressing: the two
    // decorative corner brackets, the 2px stone border and the hard
    // `active:translate-y` nudge (the press spring in `.dex-pressable` is the
    // press treatment now). The accent appears once, on hover/focus, as the
    // border warming to the mode's own accent.
    <button
      onClick={() => onPress(entry)}
      data-screen-anchor={anchorId}
      className="dex-pressable row-enter w-full bg-[var(--surface-raised)] border border-[var(--surface-line)] hover:border-[var(--lcd-accent)] rounded-card shadow-elev-1 p-2 flex items-center gap-3 relative overflow-hidden group min-h-[4.5rem]"
      // The stagger (stage 5): the first ten rows arrive 40ms apart, the rest
      // together — a list is a screen refreshing, not a procession, and an
      // uncapped `index * 50` had a 400-row list arriving for twenty seconds.
      style={{ animationDelay: `${Math.min(index, 10) * 40}ms` }}
    >
      {/* Left: Large Icon Identifier */}
      <div
        className={`shrink-0 ${CONTAINER_SIZE_LIST} ${CONTAINER_BORDER_CLASS} ${CONTAINER_SHADOW_CLASS} flex items-center justify-center ${CONTAINER_BORDER} self-start`}
        // The flag tile's keyline follows the mode's own ink: the old literal
        // white read as a frame on the dark LCD and vanished on the pale modes.
        style={isCountryGate ? { ...entryVisual.style, borderColor: 'var(--lcd-text)', borderWidth: 2, overflow: 'hidden' } : entryVisual.style}
      >
        {renderedIcon}
      </div>

      {/* Middle: Title and Tags */}
      <div className="flex flex-col flex-1 min-w-0 justify-center h-full items-start py-1">
          {/* Title - the sans heading step. Uppercase stays: an entry name on
              the readout is the product's voice, not a paragraph. */}
          <h3 className="font-sans text-heading dex-text leading-tight group-hover:text-[var(--lcd-accent)] transition-colors w-full text-left mb-2 tracking-tight whitespace-normal break-words">
            {entry.name.toUpperCase()}
          </h3>

          {/* Tags Row - Different based on category */}
          <div className="flex flex-wrap gap-1.5 w-full items-center">
              {/* GRAPES: color (RED/WHITE) + body class */}
              {isGrape && (() => {
                const colorLabel = getGrapeColorLabel(entry);
                const bodyLabel = getGrapeBodyLabel(entry);
                return (
                  <>
                    <Chip
                      label={colorLabel}
                      colorStyle={getGrapeColorChipColors(colorLabel)}
                    />
                    <Chip
                      label={bodyLabel}
                      colorStyle={getGrapeBodyChipColors(bodyLabel)}
                    />
                  </>
                );
              })()}

              {/* REGIONS: Show only Country */}
              {isRegion && countryColors && (
                <>
                  <Chip
                    label={formatUpper(country)}
                    colorStyle={countryColors}
                  />
                  {entry.details.classification && (
                    <Chip
                      label={formatUpper(entry.details.classification)}
                      colorStyle={SYSTEM_CHIP_COLOR}
                    />
                  )}
                  {climateMeta && (
                    <Chip
                      label={formatUpper(climateMeta.name)}
                      colorStyle={climateMeta.colors}
                    />
                  )}
                </>
              )}

              {/* COUNTRY GATE: classification tags */}
              {isCountryGate && (
                <>
                  {entry.tags.filter(tag => tag !== 'COUNTRY').map((tag, i) => (
                    <Chip key={i} label={extractTagAbbrev(tag)} colorStyle={APPELLATION_CHIP_COLORS[i % 3]} />
                  ))}
                </>
              )}

              {/* CONTINENTS: continent label. The colours are chip DATA in the
                  `shared/services/chipColors` sense — a continent's own cyan,
                  fixed on both platforms — not paint that should follow the
                  screen mode; `designTokens.test.ts` exempts them by value. */}
              {isContinent && (
                <Chip label="CONTINENT" colorStyle={{ bg: '#0f2027', border: '#0891b2', text: '#7dd3fc' }} />
              )}

              {/* STYLES & FLAVORS: Show class chips */}
              {!isGrape && !isRegion && !isCountryGate && (
                <>
                  {isStyle && styleClassType && (
                    <Chip
                      label={styleClassLabel}
                      colorStyle={styleClassColors}
                    />
                  )}
                  {isStyle && styleColorType && (
                    <Chip
                      label={styleColorLabel}
                      colorStyle={styleColorColors}
                    />
                  )}
                  {isStyle && entry.details.origin && entry.details.origin.toLowerCase() !== 'various' && styleCountryColors && (
                    <Chip
                      label={styleCountryLabel}
                      colorStyle={styleCountryColors}
                    />
                  )}
                  {isFlavor && flavorClassColors && (
                    <Chip
                      label={flavorClassLabel}
                      colorStyle={flavorClassColors}
                    />
                  )}
                  {isFlavor && flavorSubclassColors && (
                    <Chip
                      label={flavorSubclassLabel}
                      colorStyle={flavorSubclassColors}
                    />
                  )}
                </>
              )}

              {/* Origin tag for grapes */}
              {isGrape && originLabel && grapeOriginColors && (
                <Chip
                  label={grapeOriginLabel}
                  colorStyle={grapeOriginColors}
                />
              )}
          </div>
     </div>

      {/* Right: Chevron */}
      <div className="shrink-0 text-[var(--lcd-subtext)] group-hover:text-[var(--lcd-text)] pl-2">
         <ChevronRight size={18} />
      </div>
    </button>
  );
};

export default EntryTile;
