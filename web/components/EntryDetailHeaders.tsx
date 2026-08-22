import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Icon } from '../src/components/LocalIcon';
import { EntryCategory, WineEntry, isGrapeEntry, isRegionEntry, isStyleEntry, isFlavorEntry } from '@/shared/types';
import { CLIMATE_CLASS_MAP } from '@/shared/data/climateClasses';
import { getFlagGradient } from '@/shared/data/flagGradients';
import { getFlagImage } from '../data/flagImages';
import { getCountryChipColors, CLIMATE_CHIP_COLOR } from '@/shared/services/chipColors';
import { getColorType, getStyleClassType } from '@/shared/services/entryUtils';
import { getGrapeBodyLabel } from '../src/services/grapeDisplay';
import { getLucideIcon } from '../src/services/lucideIconMap';
import {
  normalizeTypeClass,
  getStyleClassTileColors,
  getStyleColorTileColors,
  getWineTypeTileColors,
} from '../src/services/styleDisplay';
import { getFlavorClassTileColors, getFlavorSubclassTileColors } from '../src/services/flavorDisplay';
import { getClimateIcon } from '../src/services/climateDisplay';
import { colorIconId, bodyIconId, styleClassIconId, flavorClassIconId, flavorSubclassIconId } from '../src/services/classArt';
import { ICON_SIZE_HEADER } from '../src/services/iconRendering';
import { resolveEntryIconVisual } from '../src/services/entryIconVisuals';
import type { EntryVisualResolver } from './EntryDetailSections';

/**
 * The four category header-tile rows (stage 4, v0.4.3) — the second half of
 * the W5 decomposition. `renderHeaderTiles` was a 300-line closure branching
 * four ways inside the app's largest component; each branch is now its own
 * component, converted to the token language on the way out:
 *
 * - labels and value chips move from Press Start 2P at 8–11px to the sans
 *   caption step;
 * - the ten `style={{ color: '#22c55e' }}` inline twins — the sharpest leak
 *   the U8 audit found, because an inline hex beats the `.lcd-themed` cascade
 *   in every mode — become the accent token, carried once by `tileBase`;
 * - flag frames follow `--lcd-text` instead of literal white, and flag wells
 *   follow `--lcd-well`;
 * - tile/chip DATA colours (country, climate, class, rarity tables in
 *   `shared/services`) are kept verbatim: they are catalogue vocabulary, the
 *   same on both platforms, and do not follow the screen mode.
 */

const tileBase = 'dex-pressable flex flex-col items-center justify-start pt-1 pb-1 w-full border-0 bg-transparent group relative rounded-control text-[var(--lcd-accent)]';
const labelStyle = 'font-sans text-caption tracking-widest uppercase text-[var(--lcd-accent)] z-10 whitespace-nowrap leading-none w-full text-center mb-2';
const chipStyle = 'inline-flex items-center justify-center px-2 py-1 rounded border font-sans text-caption uppercase z-10 text-center mt-2';
const iconRowStyle = 'h-10 flex items-center justify-center mb-1';
const tileRowStyle = 'grid grid-cols-3 gap-3 px-2 py-1 mb-3';
const getTileRowClass = (tileCount: number) =>
  tileCount === 2 ? 'grid grid-cols-2 gap-2 px-1 mb-3' : tileRowStyle;

const formatUpper = (value?: string) => (value ? value.toUpperCase() : 'N/A');

/** The flag well: image if drawn, gradient fallback, mode-ink keyline. */
const FlagWell: React.FC<{ origin?: string; className?: string }> = ({ origin, className = 'w-16 h-10' }) => {
  const normalized = origin ? origin.toLowerCase().trim() : undefined;
  const flagImage = getFlagImage(normalized);
  const flagGradient = getFlagGradient(normalized);
  return (
    <div className={`${className} rounded border-2 border-[var(--lcd-text)] shadow-inner bg-[var(--lcd-well)] flex-shrink-0 overflow-hidden flex items-center justify-center`}>
      {flagImage ? (
        <img
          src={flagImage}
          alt={origin}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          draggable={false}
        />
      ) : (
        <span className="w-full h-full block" style={{ background: flagGradient }} />
      )}
    </div>
  );
};

export const GrapeHeaderTiles: React.FC<{
  entry: WineEntry;
  onFilterByType: (type: string, targetCategory?: EntryCategory) => void;
  onFilterByOrigin: (origin: string) => void;
}> = ({ entry, onFilterByType, onFilterByOrigin }) => {
  if (!isGrapeEntry(entry)) return null;
  const grapeCard = entry.grapeCard;
  const headerTileIconSize = 32;
  const colorType = grapeCard?.type === 'red' ? 'RED' : 'WHITE';
  const colorTypeColors = getStyleColorTileColors(colorType);
  const bodyLabel = getGrapeBodyLabel(entry);
  const bodyIconName = bodyIconId(bodyLabel);
  const countryStyle = getCountryChipColors(entry.details.origin);

  return (
    <div className={getTileRowClass(3)}>
      {/* Tile 1: Color Grape */}
      <div className={tileBase}>
        <span className={labelStyle}>COLOR</span>
        <div className={iconRowStyle} style={{ color: colorTypeColors.bg }}>
          <Icon icon={colorIconId(colorType)} width={headerTileIconSize} height={headerTileIconSize} />
        </div>
        <span className={chipStyle} style={{ backgroundColor: colorTypeColors.bg, borderColor: colorTypeColors.border, color: colorTypeColors.text }}>
          {colorType}
        </span>
      </div>

      {/* Tile 2: Type */}
      <button
        onClick={() => grapeCard?.style && onFilterByType(normalizeTypeClass(grapeCard.style), 'GRAPES')}
        className={tileBase}
      >
        <span className={labelStyle}>TYPE</span>
        <div className={iconRowStyle}>
          <Icon icon={bodyIconName} width={headerTileIconSize} height={headerTileIconSize} />
        </div>
        <span className={`${chipStyle} dex-pill`}>
          {normalizeTypeClass(grapeCard?.style)}
        </span>
      </button>

      {/* Tile 3: Country */}
      <button
        onClick={() => entry.details.origin && onFilterByOrigin(entry.details.origin)}
        className={tileBase}
      >
        <span className={labelStyle}>ORIGIN</span>
        <div className={iconRowStyle}>
          <FlagWell origin={entry.details.origin} />
        </div>
        <span className={chipStyle} style={{ backgroundColor: countryStyle.bg, borderColor: countryStyle.border, color: countryStyle.text }}>
          {formatUpper(entry.details.origin)}
        </span>
      </button>
    </div>
  );
};

export const RegionHeaderTiles: React.FC<{
  entry: WineEntry;
  allEntries: WineEntry[];
  resolver: EntryVisualResolver;
  onSelectRelated: (entry: WineEntry) => void;
  onFilterByOrigin: (origin: string) => void;
  getRelatedEntry: (name: string, preferredCategory?: EntryCategory) => WineEntry | undefined;
}> = ({ entry, resolver, onSelectRelated, onFilterByOrigin, getRelatedEntry }) => {
  if (!isRegionEntry(entry)) return null;
  const mainGrape = entry.details.notableGrapes?.[0] || 'N/A';
  const mainGrapeEntry = getRelatedEntry(mainGrape, 'GRAPES');
  const mainGrapeTypeColors = getWineTypeTileColors(mainGrapeEntry && isGrapeEntry(mainGrapeEntry) ? mainGrapeEntry.wineType : undefined);
  const mainGrapeVisual = mainGrapeEntry
    ? resolveEntryIconVisual(mainGrapeEntry, {
        size: ICON_SIZE_HEADER,
        resolver,
        includeRegionClimateOutline: true,
      })
    : undefined;
  const countryStyle = getCountryChipColors(entry.details.origin);
  const climateMeta = entry.climate ? CLIMATE_CLASS_MAP[entry.climate] : undefined;
  const climateStyle = climateMeta?.colors ?? CLIMATE_CHIP_COLOR;
  // `getWineTypeTileColors` can answer black-on-dark for a white grape; the
  // border colour is the readable stand-in, exactly as the closure had it.
  const keyGrapeInk = mainGrapeTypeColors.text === '#000000' || !mainGrapeTypeColors.text
    ? mainGrapeTypeColors.border
    : mainGrapeTypeColors.text;

  // iOS region header (0.6.x): KEY GRAPE rides alone on a full-width flat
  // bar (grape names are the longest strings here and wrapped three abreast),
  // CLIMATE + COUNTRY keep the two-tile row below.
  return (
    <div className="px-1 mb-3">
      <button
        onClick={() => mainGrapeEntry && onSelectRelated(mainGrapeEntry)}
        disabled={!mainGrapeEntry}
        className="dex-pressable w-full flex items-center gap-3 px-2 py-2 mb-2 bg-transparent border-0 rounded-control text-left group"
      >
        <div
          className="w-9 h-9 rounded-md border border-[var(--surface-line)] shadow-inner flex items-center justify-center shrink-0"
          style={mainGrapeVisual?.style}
        >
          {mainGrapeEntry && resolveEntryIconVisual(mainGrapeEntry, {
            size: 26,
            resolver,
            includeRegionClimateOutline: true,
          }).iconNode}
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="font-sans text-caption tracking-widest uppercase text-[var(--lcd-accent)] leading-none mb-1">KEY GRAPE</span>
          <span className="font-sans text-label leading-tight truncate" style={{ color: keyGrapeInk }}>
            {formatUpper(mainGrape)}
          </span>
        </div>
        {mainGrapeEntry && <ChevronRight size={14} className="text-[var(--lcd-subtext)] group-hover:text-[var(--lcd-accent)] shrink-0" />}
      </button>

      <div className="grid grid-cols-2 gap-2">
        {/* Climate */}
        <div className={`${tileBase} cursor-default`}>
          <span className={labelStyle}>CLIMATE</span>
          <div className={iconRowStyle} style={{ color: climateStyle.border }}>
            {getClimateIcon(entry.climate, 48)}
          </div>
          <span className={chipStyle} style={{ backgroundColor: climateStyle.bg, borderColor: climateStyle.border, color: climateStyle.text }}>
            {formatUpper(climateMeta?.name || 'N/A')}
          </span>
        </div>

        {/* Country */}
        <button
          onClick={() => entry.details.origin && onFilterByOrigin(entry.details.origin)}
          className={tileBase}
        >
          <span className={labelStyle}>COUNTRY</span>
          <div className={iconRowStyle}>
            <FlagWell origin={entry.details.origin} />
          </div>
          <span className={chipStyle} style={{ backgroundColor: countryStyle.bg, borderColor: countryStyle.border, color: countryStyle.text }}>
            {formatUpper(entry.details.origin)}
          </span>
        </button>
      </div>
    </div>
  );
};

export const StyleHeaderTiles: React.FC<{
  entry: WineEntry;
  onFilterByType: (type: string, targetCategory?: EntryCategory) => void;
  onFilterByNote: (note: string, targetCategory?: EntryCategory, mode?: 'TASTING') => void;
  onFilterByOrigin: (origin: string) => void;
}> = ({ entry, onFilterByType, onFilterByNote, onFilterByOrigin }) => {
  if (!isStyleEntry(entry)) return null;
  const styleClassType = getStyleClassType(entry.name, entry.details.classification);
  const classColors = getStyleClassTileColors(styleClassType);
  const colorType = getColorType(entry.name);
  const colorTypeColors = getStyleColorTileColors(colorType);
  const flagGradient = getFlagGradient(entry.details.origin);
  const flagImage = getFlagImage(entry.details.origin);

  const colorTile = (
    <button
      key="color-type"
      onClick={() => colorType && onFilterByType(colorType, 'STYLES')}
      className={tileBase}
    >
      <span className={labelStyle}>COLOR</span>
      <div className={iconRowStyle} style={{ color: colorTypeColors.bg }}>
        <Icon icon={colorIconId(colorType)} width={32} height={32} />
      </div>
      <span className={chipStyle} style={{ backgroundColor: colorTypeColors.bg, borderColor: colorTypeColors.border, color: colorTypeColors.text }}>
        {colorType}
      </span>
    </button>
  );

  const classTile = (
    <button
      key="class"
      onClick={() => styleClassType && onFilterByNote(styleClassType, 'STYLES', 'TASTING')}
      className={tileBase}
    >
      <span className={labelStyle}>CLASS</span>
      <div className={iconRowStyle} style={{ color: classColors.border }}>
        <Icon icon={styleClassIconId(styleClassType)} width={32} height={32} />
      </div>
      <span className={chipStyle} style={{ backgroundColor: classColors.bg, borderColor: classColors.border, color: classColors.text }}>
        {styleClassType}
      </span>
    </button>
  );

  const originChipColors = entry.details.origin ? getCountryChipColors(entry.details.origin) : null;
  const originLabel = styleClassType === 'STYLE' || styleClassType === 'BLEND' ? 'ORIGIN' : 'COUNTRY';
  const originTile = entry.details.origin ? (
    <button
      key="origin"
      onClick={() => onFilterByOrigin(entry.details.origin!)}
      className={tileBase}
    >
      <span className={labelStyle}>{originLabel}</span>
      <div className={iconRowStyle}>
        <span
          className="w-12 h-8 rounded-sm border-2 border-[var(--lcd-text)] shadow-inner"
          style={{
            backgroundImage: flagImage ? `url(${flagImage})` : flagGradient,
            backgroundSize: flagImage ? 'cover' : undefined,
            backgroundPosition: flagImage ? 'center' : undefined,
          }}
        ></span>
      </div>
      <span className={chipStyle} style={{ backgroundColor: originChipColors?.bg, borderColor: originChipColors?.border, color: originChipColors?.text }}>
        {formatUpper(entry.details.origin)}
      </span>
    </button>
  ) : null;

  // iOS order: COLOR → CLASS → ORIGIN.
  const tiles = [colorTile, classTile];
  if (originTile) tiles.push(originTile);

  return <div className={getTileRowClass(tiles.length)}>{tiles}</div>;
};

export const FlavorHeaderTiles: React.FC<{
  entry: WineEntry;
  onFilterByNote: (note: string, targetCategory?: EntryCategory, mode?: 'TASTING') => void;
}> = ({ entry, onFilterByNote }) => {
  if (!isFlavorEntry(entry)) return null;
  const flavorClass = entry.details.classification || 'FLAVOR';
  const flavorColors = getFlavorClassTileColors(flavorClass);
  const subclass = entry.details.subclass || 'SUBCLASS';
  const subclassColors = getFlavorSubclassTileColors(entry.details.subclass);

  const subclassArtId = flavorSubclassIconId(entry.details.subclass);
  const FallbackIcon = getLucideIcon(entry.icon || 'default');
  const subclassIconNode = subclassArtId
    ? <Icon icon={subclassArtId} width={32} height={32} />
    : <FallbackIcon size={32} fill="currentColor" className="text-current" style={{ color: subclassColors.border }} />;

  // iOS flavor header is two tiles: CLASS + SUBCLASS (no GRAPES count).
  return (
    <div className={getTileRowClass(2)}>
      <button
        className={tileBase}
        onClick={() => onFilterByNote(flavorClass, 'FLAVORS', 'TASTING')}
      >
        <span className={labelStyle}>CLASS</span>
        <div className={iconRowStyle} style={{ color: flavorColors.border }}>
          <Icon icon={flavorClassIconId(flavorClass)} width={32} height={32} />
        </div>
        <span className={chipStyle} style={{ backgroundColor: flavorColors.bg, borderColor: flavorColors.border, color: flavorColors.text }}>
          {flavorClass}
        </span>
      </button>
      <button
        className={tileBase}
        onClick={() => onFilterByNote(subclass, 'FLAVORS', 'TASTING')}
      >
        <span className={labelStyle}>SUBCLASS</span>
        <div className={iconRowStyle} style={{ color: subclassColors.border }}>
          {subclassIconNode}
        </div>
        <span className={chipStyle} style={{ backgroundColor: subclassColors.bg, borderColor: subclassColors.border, color: subclassColors.text }}>
          {subclass.replace(/_/g, ' ')}
        </span>
      </button>
    </div>
  );
};
