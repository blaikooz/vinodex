import React, { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { MapPin, Activity, Droplet, Grape, Mountain, ChevronRight, ChevronUp, ChevronDown, List, Leaf, Flame, Shield, BookOpen, Bookmark, MapPinned, Wind, Star, Crown, PlusCircle, CheckCircle2 } from 'lucide-react';
import { Icon } from '../src/components/LocalIcon';
import DeviceLayout from './DeviceLayout';
import { EntryCategory, WineEntry, isCountryGateEntry, isFlavorEntry, isGrapeEntry, isRegionEntry, isStyleEntry } from '@/shared/types';
import { CLIMATE_CLASS_MAP } from '@/shared/data/climateClasses';
import { getFlagGradient } from '@/shared/data/flagGradients';
import { getFlagImage } from '../data/flagImages';
import { HEADER_BORDER_CLASS, CONTAINER_SHADOW_CLASS, CONTAINER_SIZE_LIST, CONTAINER_BORDER_CLASS, CONTAINER_BORDER, ICON_SIZE_HEADER, ICON_SIZE_LINKED } from '../src/services/iconRendering';
import { createEntryVisualResolver, resolveEntryIconVisual } from '../src/services/entryIconVisuals';
import {
  categorizeFlavor,
  categorizeFlavorSubclass,
  findEntryByName,
  findRelatedEntry,
  getColorType,
  getStyleClassType,
} from '@/shared/services/entryUtils';
import Chip from './Chip';
import { getCountryChipColors, getFlavorClassChipColors, getFlavorSubclassChipColors, getRarityChipColors, SYSTEM_CHIP_COLOR, CLIMATE_CHIP_COLOR, APPELLATION_CHIP_COLORS, extractTagAbbrev } from '@/shared/services/chipColors';
import { getGrapeColorLabel, getGrapeBodyLabel, getGrapeColorChipColors, getGrapeBodyChipColors } from '../src/services/grapeDisplay';
import { getLucideIcon } from '../src/services/lucideIconMap';
import { getSoilIcon, getSoilsForRegion } from '../src/services/soilDisplay';
import { normalizeTypeClass, getStyleClassTileColors, getStyleColorTileColors, getWineTypeTileColors } from '../src/services/styleDisplay';
import { getFlavorClassTileColors, getFlavorSubclassTileColors } from '../src/services/flavorDisplay';
import { getClimateIcon } from '../src/services/climateDisplay';
import { colorIconId, bodyIconId, styleClassIconId, flavorClassIconId, flavorSubclassIconId } from '../src/services/classArt';
import { isOn as isFlagOn, keyForDetail, toggleFlag } from '../src/services/screenState';
import { useScreenAnchor } from '../src/services/useScreenAnchor';
import { isBookmarked, toggleBookmark, isOnShelf, toggleShelf, getRating, setRating, makeRating } from '../src/services/bookmarks';
import { useBookmarks } from '../src/services/useBookmarks';
import { recordRecentlyViewed } from '../src/services/recentlyViewed';
import { isTastable } from '../src/services/wineData';
import RatingPrompt from './RatingPrompt';

type FilterMode = 'REGION' | 'TYPE' | 'TASTING' | 'SOIL' | 'ORIGIN' | 'RARITY' | 'SYSTEM' | 'CLIMATE' | null;

interface EntryDetailProps {
  entry: WineEntry;
  allEntries: WineEntry[];
  onBack: () => void;
  onHome: () => void;
  onSelectRelated: (entry: WineEntry) => void;
  onFilterByType: (type: string, targetCategory?: EntryCategory) => void;
  onFilterByNote: (note: string, targetCategory?: EntryCategory, mode?: FilterMode) => void;
  onFilterBySoil: (soil: string) => void;
  onFilterByOrigin: (origin: string) => void;
  onViewStates?: () => void;
}

const EntryDetail: React.FC<EntryDetailProps> = ({ entry, allEntries, onBack, onHome, onSelectRelated, onFilterByType, onFilterByNote, onFilterBySoil, onFilterByOrigin, onViewStates }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const entryVisualResolver = useMemo(() => createEntryVisualResolver({ entries: allEntries }), [allEntries]);

  // Replaces the old `scrollTop = 0` reset keyed on entry.id. That reset existed
  // so following a cross-link would not open a never-seen entry halfway down;
  // this keeps the behaviour without the explicit assignment, because the store
  // is keyed per entry and a new entry simply has no anchor to restore. An
  // entry you have already read comes back where you left it.
  useScreenAnchor(keyForDetail(entry.id), scrollRef, { autoAnchorChildren: true });

  // Subscribes this screen to the bookmark store so the shelf controls reflect
  // a change made anywhere else — the collection screen, another tab.
  useBookmarks();
  const saved = isBookmarked(entry.id);
  // Only grapes and styles are tastable, so only they get WANT/TRIED + rating.
  const tastable = isTastable(entry);
  const want = isOnShelf('wantToTry', entry.id);
  const tried = isOnShelf('tried', entry.id);
  const rating = getRating(entry.id);
  const [showRating, setShowRating] = useState(false);

  // Record this open in the recently-viewed trail. Keyed on entry.id, not [],
  // because following a cross-link swaps the entry without remounting the
  // screen — an empty-dep effect would credit only the first entry in a chain.
  useEffect(() => {
    recordRecentlyViewed(entry.id);
  }, [entry.id]);

  // The expander state lives in the screen-state store so it survives Back,
  // which means React has to be told to repaint when it changes. A counter
  // rather than mirroring the flags into state: the store stays the single
  // source of truth, and two sections cannot drift out of step with it.
  const [, forceRender] = useReducer((n: number) => n + 1, 0);

  const formatUpper = (value?: string) => {
    return value ? value.toUpperCase() : 'N/A';
  };

  const getRelatedEntry = (name: string, preferredCategory?: EntryCategory) =>
    findRelatedEntry(allEntries, name, preferredCategory);

  const getExactFlavorEntry = (name: string) => findEntryByName(allEntries, name, 'FLAVORS');

  const grapeCard = isGrapeEntry(entry) ? entry.grapeCard : undefined;
  const detailsBag = entry.details as {
    origin?: string;
    state?: string;
    classification?: string;
    keyRegions?: string[];
    notableGrapes?: string[];
    synonyms?: string[];
    appellations?: string[];
    soilType?: string;
    body?: string;
    tannin?: string;
    acidity?: string;
    subclass?: string;
  };
  const entryRarity = isGrapeEntry(entry) ? entry.rarity : isStyleEntry(entry) ? entry.rarity : undefined;
  const entryTastingProfile = isGrapeEntry(entry) || isStyleEntry(entry) || isFlavorEntry(entry) ? entry.tastingProfile : undefined;

  // Logic checks
  const isGrapes = isGrapeEntry(entry);
  const isRegion = isRegionEntry(entry);
  const isStyle = isStyleEntry(entry);
  const isFlavor = isFlavorEntry(entry);
  const isContinent = entry.category === 'CONTINENTS';
  const isCountry = isCountryGateEntry(entry) && entry.details.classification?.toUpperCase() === 'COUNTRY';
  const isState = isCountryGateEntry(entry) && entry.details.classification?.toUpperCase() === 'STATE';

  const styleClassType = isStyleEntry(entry) ? getStyleClassType(entry.name, entry.details.classification) : undefined;
  const isMethodClass = styleClassType === 'METHOD';
  const isOriginClass = styleClassType === 'ORIGIN';
  const isStyleClassType = styleClassType === 'STYLE';
  const classTypeColors = getStyleClassTileColors(styleClassType);
  const colorType = isStyleEntry(entry) ? getColorType(entry.name) : undefined;
  const colorTypeColors = getStyleColorTileColors(colorType);

  // Classification Logic
  const displayClass = isGrapes ? (grapeCard?.rarityTier?.toUpperCase() || entryRarity) : (detailsBag.classification || entryRarity);
  // The rarity pill is tinted by its tier (iOS raritySection), not a flat green.
  const rarityChipColors = getRarityChipColors((entryRarity || displayClass || '').toUpperCase());

  // List Data Selection
  const listSectionTitle = isContinent ? 'COUNTRIES' : isCountry ? 'KEY REGIONS' : (isRegion ? 'NOTABLE GRAPES' : 'NOTABLE REGIONS');
  const listSectionData = isContinent ? detailsBag.keyRegions : (isRegion ? detailsBag.notableGrapes : (isGrapes ? grapeCard?.notableRegions : detailsBag.keyRegions));
  const scanTitle = isGrapes ? 'GRAPE SCAN' : isRegion ? 'REGION SCAN' : isFlavor ? 'FLAVOR SCAN' : isContinent ? 'CONTINENT SCAN' : isCountry ? 'COUNTRY SCAN' : isState ? 'STATE SCAN' : 'STYLE SCAN';
  const regionSoils = isRegionEntry(entry)
    ? getSoilsForRegion(entry.details.soilType, entry.climate)
    : [];

  const styleGrapes = isStyleEntry(entry) ? (entry.details.notableGrapes || []) : [];
  const styleFlavorNotes = isStyleEntry(entry)
    ? (entry.tastingProfile || entry.tags?.slice(0, 3).map(tag => ({ note: tag, icon: 'default' as const, color: classTypeColors.border }))) || []
    : [];
  const grapeFlavorNotes = (grapeCard?.tastingProfile || []).map(n => ({ note: n, icon: 'default' as const, color: '#16a34a' }));
  const flavorNotes = isStyleEntry(entry) ? styleFlavorNotes : (entryTastingProfile || grapeFlavorNotes);
  const grapeAlternateNames = isGrapeEntry(entry) ? (grapeCard?.alternateNames || entry.details.synonyms || []) : [];

  const getFlavorTileVisual = (note: { note: string; icon: string; color: string }) => {
    const relatedFlavor = getExactFlavorEntry(note.note);
    if (relatedFlavor) {
      const flavorVisual = resolveEntryIconVisual(relatedFlavor, {
        size: 18,
        resolver: entryVisualResolver,
        includeRegionClimateOutline: true,
      });
      return {
        relatedFlavor,
        iconNode: flavorVisual.iconNode,
        borderColor: flavorVisual.iconColor || note.color,
        bgColor: relatedFlavor.color || '#0b0f19',
        label: relatedFlavor.name
      };
    }

    return {
      relatedFlavor,
      iconNode: buildIconNode('default', '#e5e7eb', 18),
      borderColor: '#475569',
      bgColor: '#0b0f19',
      label: note.note
    };
  };

  const buildIconNode = (iconKey: string, color?: string, size = 20): React.ReactNode => {
    const LucideIconComponent = getLucideIcon(iconKey);
    return (
      <LucideIconComponent
        size={size}
        fill="currentColor"
        className="text-current"
        style={color ? { color } : undefined}
      />
    );
  };

  interface RenderLinkedTileOptions {
    useCountryFlag?: boolean;
    showRegionMetaTiles?: boolean;
    preferCountryGate?: boolean;
  }

  /**
   * A linked list capped at `cap`, with a SHOW ALL toggle when there is more
   * behind it.
   *
   * These lists used to truncate silently — `.slice(0, 6)` and nothing to say
   * a seventh region existed. iOS solved that with an expander per section
   * (see CountryScreen.swift), and the open/closed state is exactly what the
   * `flags` half of the screen-state store was built to hold: it survives Back
   * along with the scroll position, so opening a region from an expanded list
   * and returning does not re-collapse it.
   */
  const expandableList = (
    items: string[],
    cap: number,
    flag: string,
    options?: RenderLinkedTileOptions,
  ) => {
    const key = keyForDetail(entry.id);
    const expanded = isFlagOn(key, flag);
    const shown = expanded ? items : items.slice(0, cap);
    return (
      <>
        {shown.map((item, idx) => renderLinkedTile(item, idx, options))}
        {items.length > cap && (
          <button
            onClick={() => {
              toggleFlag(key, flag);
              forceRender();
            }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-full border-2 border-stone-700 hover:border-green-500 transition-colors font-retro text-[0.6rem] tracking-widest text-green-500"
          >
            {expanded ? <ChevronUp size={13} strokeWidth={3} /> : <ChevronDown size={13} strokeWidth={3} />}
            {expanded ? 'SHOW FEWER' : `EXPAND ALL (${items.length})`}
          </button>
        )}
      </>
    );
  };

  const renderLinkedTile = (label: string, idx: number, options?: RenderLinkedTileOptions) => {
    const relatedEntry = getRelatedEntry(label, options?.preferCountryGate ? 'COUNTRY_GATE' : undefined);
    const linkedVisual = resolveEntryIconVisual(relatedEntry, {
      size: ICON_SIZE_LINKED,
      resolver: entryVisualResolver,
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
    const regionSystemColors = SYSTEM_CHIP_COLOR;
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
        key={idx}
        onClick={() => isLinkable && relatedEntry && onSelectRelated(relatedEntry)}
        disabled={!isLinkable}
        className={`w-full bg-stone-900 border-2 rounded p-3 flex items-center gap-3 relative overflow-hidden group transition-all text-left ${
          isLinkable ? 'border-stone-700 hover:border-green-500 hover:bg-stone-800 active:translate-y-0.5' : 'border-stone-800 opacity-70 cursor-default'
        }`}
      >
        <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-stone-600 group-hover:border-green-400 transition-colors"></div>
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-stone-600 group-hover:border-green-400 transition-colors"></div>

        <div
          className={`shrink-0 ${CONTAINER_SIZE_LIST} ${CONTAINER_BORDER_CLASS} ${CONTAINER_SHADOW_CLASS} flex items-center justify-center ${CONTAINER_BORDER} ${!isLinkable ? 'grayscale' : ''}`}
          style={linkedVisual.style}
        >
          {linkedVisual.iconNode}
        </div>

        <div className="flex-1 flex items-center gap-2 min-w-0">
          <div className="flex-1">
            <span className={`font-retro text-base leading-tight break-words whitespace-normal ${isLinkable ? 'dex-text group-hover:text-green-400' : 'dex-disabled'}`}>
              {displayName}
            </span>
            {options?.useCountryFlag && classificationLabel && (
              <span className="text-[10px] tracking-widest uppercase text-stone-400 block">
                {classificationLabel}
              </span>
            )}
            {isRegionMeta && (
              <div className="mt-1 flex flex-wrap gap-1">
                {regionCountry && (
                  <Chip label={regionCountry} colorStyle={regionCountryColors} />
                )}
                {regionSystem && (
                  <Chip label={extractTagAbbrev(regionSystem)} colorStyle={regionSystemColors} />
                )}
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
                  <Chip
                    key={tag}
                    label={extractTagAbbrev(tag)}
                    colorStyle={APPELLATION_CHIP_COLORS[i % 3]}
                  />
                ))}
              </div>
            )}
          </div>
          {isLinkable && <ChevronRight size={16} className="text-stone-600 group-hover:text-green-500 shrink-0 ml-2" />}
        </div>
      </button>
    );
  };

  // Header Tiles Logic - Updated to remove rarity from regions/styles, add rarity clickable for grapes
  const renderHeaderTiles = () => {
      // New 3-tile visual language
      const tileBase = "flex flex-col items-center justify-start pt-1 pb-1 w-full border-0 bg-transparent group relative";
      const tileRowStyle = "grid grid-cols-3 gap-3 px-2 py-1 mb-3";
      const labelStyle = "font-retro text-[10px] md:text-[11px] tracking-normal text-green-500 z-10 whitespace-nowrap leading-none w-full text-center mb-2";
      const chipStyle = "inline-flex items-center justify-center px-2 py-1 rounded border font-retro text-[8px] md:text-[9px] tracking-normal leading-tight uppercase z-10 text-center mt-2";
      const iconRowStyle = "h-10 flex items-center justify-center mb-1";
      const getTileRowClass = (tileCount: number) =>
        tileCount === 2 ? 'grid grid-cols-2 gap-2 px-1 mb-3' : tileRowStyle;
      
      if (isCountry) {
        return null;
      }

      if (isGrapes) {
          // Tile 1: Color Grape
          const headerTileIconSize = 32;
          const colorType = grapeCard?.type === 'red' ? 'RED' : 'WHITE';
          const colorTypeColors = getStyleColorTileColors(colorType);
          const colorIconNode = (
            <Icon
              icon={colorIconId(colorType)}
              width={headerTileIconSize}
              height={headerTileIconSize}
            />
          );
          const bodyLabel = getGrapeBodyLabel(entry);
          const bodyIconName = bodyIconId(bodyLabel);
          const countryStyle = getCountryChipColors(entry.details.origin);
          const normalizedOrigin = entry.details.origin ? entry.details.origin.toLowerCase().trim() : undefined;
          const countryFlagGradient = getFlagGradient(normalizedOrigin);
          const countryFlagImage = getFlagImage(normalizedOrigin);

          return (
              <div className={getTileRowClass(3)}>
                  {/* Tile 1: Color Grape */}
                  <div className={tileBase} style={{ backgroundColor: 'transparent', borderColor: 'transparent', color: '#22c55e' }}>
                      <span className={labelStyle}>COLOR</span>
                      <div className={iconRowStyle} style={{ color: colorTypeColors.bg }}>
                        {colorIconNode}
                      </div>
                      <span className={chipStyle} style={{ backgroundColor: colorTypeColors.bg, borderColor: colorTypeColors.border, color: colorTypeColors.text }}>
                        {colorType}
                      </span>
                  </div>

                  {/* Tile 2: Type (was rarity) */}
                  <button 
                    onClick={() => grapeCard?.style && onFilterByType?.(normalizeTypeClass(grapeCard.style), 'GRAPES')}
                    className={tileBase}
                    style={{ backgroundColor: 'transparent', borderColor: 'transparent', color: '#22c55e' }}
                  >
                      <span className={labelStyle}>TYPE</span>
                      <div className={iconRowStyle}>
                        <Icon icon={bodyIconName} width={headerTileIconSize} height={headerTileIconSize} />
                      </div>
                      <span className={chipStyle} style={{ backgroundColor: '#222', borderColor: '#16a34a', color: '#bbf7d0' }}>
                        {normalizeTypeClass(grapeCard?.style)}
                      </span>
                  </button>

                  {/* Tile 3: Country */}
                  <button 
                    onClick={() => entry.details.origin && onFilterByOrigin(entry.details.origin)} 
                    className={tileBase}
                    style={{ backgroundColor: 'transparent', borderColor: 'transparent', color: '#22c55e' }}
                  >
                       <span className={labelStyle}>ORIGIN</span>
                       <div className={iconRowStyle}>
                         <div className="w-16 h-10 rounded border-2 border-white shadow-inner bg-stone-900 flex-shrink-0 overflow-hidden flex items-center justify-center">
                           {countryFlagImage ? (
                             <img
                                 src={countryFlagImage}
                                 alt={entry.details.origin}
                                 style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                 draggable={false}
                               />
                           ) : (
                             <span className="w-full h-full block" style={{ background: countryFlagGradient }} />
                           )}
                         </div>
                       </div>
                       <span className={chipStyle} style={{ backgroundColor: countryStyle.bg, borderColor: countryStyle.border, color: countryStyle.text }}>
                         {formatUpper(entry.details.origin)}
                       </span>
                  </button>
              </div>
          );
      } else if (isRegion) {
      const mainGrape = entry.details.notableGrapes?.[0] || 'N/A';
      const mainGrapeEntry = getRelatedEntry(mainGrape, 'GRAPES');
      const mainGrapeTypeColors = getWineTypeTileColors(mainGrapeEntry && isGrapeEntry(mainGrapeEntry) ? mainGrapeEntry.wineType : undefined);
      // Use the grape's hero image/icon and container, matching the grape detail header
      const mainGrapeVisual = mainGrapeEntry
        ? resolveEntryIconVisual(mainGrapeEntry, {
            size: ICON_SIZE_HEADER,
            resolver: entryVisualResolver,
            includeRegionClimateOutline: true,
          })
        : undefined;
      const mainGrapeIconStyle = mainGrapeVisual?.style;
      const countryStyle = getCountryChipColors(entry.details.origin);
      const climateMeta = entry.climate ? CLIMATE_CLASS_MAP[entry.climate] : undefined;
      const climateStyle = climateMeta?.colors ?? CLIMATE_CHIP_COLOR;
      const flagGradient = getFlagGradient(entry.details.origin);
      const flagImage = getFlagImage(entry.details.origin);
      
      // iOS region header (0.6.x): KEY GRAPE rides alone on a full-width flat
      // bar (grape names are the longest strings here and wrapped three
      // abreast), CLIMATE + COUNTRY keep the two-tile row below.
      return (
          <div className="px-1 mb-3">
              {/* Full-width KEY GRAPE bar */}
              <button
                onClick={() => mainGrapeEntry && onSelectRelated(mainGrapeEntry)}
                disabled={!mainGrapeEntry}
                className="w-full flex items-center gap-3 px-2 py-2 mb-2 bg-transparent border-0 text-left group"
              >
                   <div
                     className="w-9 h-9 rounded-md border border-stone-700 shadow-inner flex items-center justify-center shrink-0"
                     style={mainGrapeIconStyle}
                   >
                     {mainGrapeEntry && resolveEntryIconVisual(mainGrapeEntry, {
                       size: 26,
                       resolver: entryVisualResolver,
                       includeRegionClimateOutline: true,
                     }).iconNode}
                   </div>
                   <div className="flex flex-col min-w-0 flex-1">
                     <span className="font-retro text-[9px] tracking-normal text-green-500 leading-none mb-1">KEY GRAPE</span>
                     <span className="font-retro text-[13px] tracking-normal leading-tight truncate" style={{ color: mainGrapeTypeColors.text === '#000000' || !mainGrapeTypeColors.text ? mainGrapeTypeColors.border : mainGrapeTypeColors.text }}>
                       {formatUpper(mainGrape)}
                     </span>
                   </div>
                   {mainGrapeEntry && <ChevronRight size={14} className="text-stone-600 group-hover:text-green-500 shrink-0" />}
              </button>

              {/* CLIMATE + COUNTRY row */}
              <div className="grid grid-cols-2 gap-2">
                  {/* Climate */}
                  <div
                    className={`${tileBase} cursor-default`}
                    style={{ backgroundColor: 'transparent', borderColor: 'transparent', color: '#22c55e' }}
                  >
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
                    style={{ backgroundColor: 'transparent', borderColor: 'transparent', color: '#22c55e' }}
                  >
                       <span className={labelStyle}>COUNTRY</span>
                       <div className={iconRowStyle}>
                         <div className="w-16 h-10 rounded border-2 border-white shadow-inner bg-stone-900 flex-shrink-0 overflow-hidden flex items-center justify-center">
                           {flagImage ? (
                             <img
                               src={flagImage}
                               alt={entry.details.origin}
                               style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                               draggable={false}
                             />
                           ) : (
                             <span className="w-full h-full block" style={{ background: flagGradient }} />
                           )}
                         </div>
                       </div>
                       <span className={chipStyle} style={{ backgroundColor: countryStyle.bg, borderColor: countryStyle.border, color: countryStyle.text }}>
                         {formatUpper(entry.details.origin)}
                       </span>
                  </button>
              </div>
          </div>
          );
      } else if (isStyle) {
          const classColors = getStyleClassTileColors(styleClassType);
          const flagGradient = getFlagGradient(entry.details.origin);
          const flagImage = getFlagImage(entry.details.origin);
          const styleClassIconNode = (
            <Icon
              icon={styleClassIconId(styleClassType)}
              width={32}
              height={32}
            />
          );

          const colorIconNode = (
            <Icon
              icon={colorIconId(colorType)}
              width={32}
              height={32}
            />
          );

          const colorTile = (
            <button
              key="color-type"
              onClick={() => colorType && onFilterByType(colorType, 'STYLES')}
              className={tileBase}
              style={{ backgroundColor: 'transparent', borderColor: 'transparent', color: '#22c55e' }}
            >
              <span className={labelStyle}>COLOR</span>
              <div className={iconRowStyle} style={{ color: colorTypeColors.bg }}>
                {colorIconNode}
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
              style={{ backgroundColor: 'transparent', borderColor: 'transparent', color: '#22c55e' }}
            >
              <span className={labelStyle}>CLASS</span>
              <div className={iconRowStyle} style={{ color: classColors.border }}>
                {styleClassIconNode}
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
              style={{ backgroundColor: 'transparent', borderColor: 'transparent', color: '#22c55e' }}
            >
              <span className={labelStyle}>{originLabel}</span>
              <div className={iconRowStyle}>
                <span
                  className="w-12 h-8 rounded-sm border-2 border-white shadow-inner"
                  style={{
                    backgroundImage: flagImage ? `url(${flagImage})` : flagGradient,
                    backgroundSize: flagImage ? 'cover' : undefined,
                    backgroundPosition: flagImage ? 'center' : undefined
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
      } else if (isFlavor) {
        const flavorClass = entry.details.classification || 'FLAVOR';
        const flavorColors = getFlavorClassTileColors(flavorClass);
        const subclass = entry.details.subclass || 'SUBCLASS';
        const subclassColors = getFlavorSubclassTileColors(entry.details.subclass);

        const flavorClassIconNode = <Icon icon={flavorClassIconId(flavorClass)} width={32} height={32} />;

        const subclassArtId = flavorSubclassIconId(entry.details.subclass);
        const subclassIconNode = subclassArtId
          ? <Icon icon={subclassArtId} width={32} height={32} />
          : buildIconNode(entry.icon || 'default', subclassColors.border, 32);

        // iOS flavor header is two tiles: CLASS + SUBCLASS (no GRAPES count).
        return (
          <div className={getTileRowClass(2)}>
            <button
              className={tileBase}
              onClick={() => onFilterByNote(flavorClass, 'FLAVORS', 'TASTING')}
              style={{ backgroundColor: 'transparent', borderColor: 'transparent', color: '#22c55e' }}
            >
              <span className={labelStyle}>CLASS</span>
              <div className={iconRowStyle} style={{ color: flavorColors.border }}>
                {flavorClassIconNode}
              </div>
              <span className={chipStyle} style={{ backgroundColor: flavorColors.bg, borderColor: flavorColors.border, color: flavorColors.text }}>
                {flavorClass}
              </span>
            </button>
            <button
              className={tileBase}
              onClick={() => onFilterByNote(subclass, 'FLAVORS', 'TASTING')}
              style={{ backgroundColor: 'transparent', borderColor: 'transparent', color: '#22c55e' }}
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
      }
      return null;
  };

  const headerTiles = renderHeaderTiles();

  {/* Alternate Names Section - Grapes */}
  const grapeAlsoKnownAs = isGrapes && grapeAlternateNames.length > 0 ? (
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-3 dex-section-rule pb-1">
                    <BookOpen size={18} className="text-green-500" />
                    <span className="font-retro text-xs md:text-sm tracking-widest text-green-500">ALSO KNOWN AS</span>
                </div>
                <div className="flex flex-wrap gap-2">
                    {grapeAlternateNames.map((name, i) => (
                        <span key={i} className="px-4 py-2 text-xl font-bold font-mono rounded tracking-widest" style={{ backgroundColor: '#052e16', border: '1px solid #15803d', color: '#bbf7d0' }}>
                            {name}
                        </span>
                    ))}
                </div>
            </div>
  ) : null;

  {/* Rarity Section - Grapes */}
  const grapeRarity = isGrapes ? (
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-3 dex-section-rule pb-1">
                    <Star size={24} className="text-green-400" />
                    <span className="font-retro text-xs md:text-sm tracking-widest text-green-400">RARITY</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex-1 flex items-center px-3 py-1.5 rounded-full border-2 text-base font-extrabold uppercase justify-between" style={{ letterSpacing: '0.1em', backgroundColor: rarityChipColors.bg, borderColor: rarityChipColors.border, color: rarityChipColors.text }}>
                    {displayClass}
                    <span className="ml-2 flex items-center">
                      {(() => {
                        const rarity = (entry.rarity || '').toUpperCase();
                        // GODFORSAKEN (0.6.2) sits above even NOBLE: a
                        // cursed-gold flame, because nobility is fame and this
                        // is the opposite. Its own emblem, like NOBLE's crown —
                        // matches raritySection() in EntryDetailScreen.swift.
                        if (rarity === 'GODFORSAKEN') {
                          return (
                            <Flame
                              size={22}
                              className="ml-1"
                              style={{ color: '#ca8a04', filter: 'drop-shadow(0 0 4px rgba(202,138,4,0.6))' }}
                              fill="#ca8a04"
                            />
                          );
                        }
                        // NOBLE is a crown on its own, not a crown capping three
                        // stars — the stars implied it was simply one rank above
                        // RARE rather than a different kind of thing.
                        if (rarity === 'NOBLE') {
                          return (
                            <Crown
                              size={20}
                              className="text-yellow-400 ml-1"
                              style={{ filter: 'drop-shadow(0 0 4px rgba(250,204,21,0.55))' }}
                            />
                          );
                        }
                        // `rarityRank` in Swift: common 1, uncommon 2, rare 3.
                        // This read COMMON 2 / UNCOMMON 1, so a common grape
                        // outranked an uncommon one on screen.
                        const filled = rarity === 'RARE' ? 3 : rarity === 'UNCOMMON' ? 2 : 1;
                        // Always three slots, unfilled ones outlined — a count
                        // only means something against a visible ceiling.
                        return Array.from({ length: 3 }).map((_, i) => (
                          <Star
                            key={i}
                            size={18}
                            className={`ml-0.5 ${i < filled ? 'text-yellow-400' : 'text-stone-600'}`}
                            fill={i < filled ? '#facc15' : 'none'}
                          />
                        ));
                      })()}
                    </span>
                  </span>
                </div>
            </div>
  ) : null;

  {/* Stats Section - Only for GRAPES */}
  const grapeCharacteristics = isGrapes && grapeCard ? (
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-2 dex-section-rule pb-1">
                    <Activity size={18} className="text-green-500" />
                    <span className="font-retro text-xs md:text-sm tracking-widest text-green-500">CHARACTERISTICS</span>
                </div>
                <div className="space-y-4 bg-stone-900 p-3 rounded border border-stone-800">
                    {([
                      { label: 'BODY', value: grapeCard.characteristics.body, color: 'bg-green-500' },
                      { label: 'ACID', value: grapeCard.characteristics.acid, color: 'bg-yellow-500' },
                      { label: 'TANNIN', value: grapeCard.characteristics.tannin, color: 'bg-red-500' },
                      { label: 'AROMATICS', value: grapeCard.characteristics.aromatics, color: 'bg-purple-400' },
                      { label: 'COLOR', value: grapeCard.characteristics.colorIntensity, color: 'bg-amber-500' },
                    ]).map(stat => (
                      <div className="flex items-center gap-3" key={stat.label}>
                          <span className="w-24 text-base font-bold dex-text font-mono tracking-widest shrink-0">{stat.label}</span>
                          <div className="flex-1 h-2 bg-stone-800 flex gap-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                  <div key={i} className={`flex-1 ${i < stat.value ? stat.color : 'bg-transparent'} transition-all`}></div>
                              ))}
                          </div>
                      </div>
                    ))}
                </div>
            </div>
  ) : null;

  {/* System Section - Regions */}
  const regionSystem = isRegion && entry.details.classification ? (
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-2 dex-section-rule pb-1">
                    <Shield size={18} className="text-green-500" />
                    <span className="font-retro text-xs md:text-sm tracking-widest text-green-500">APPELLATION SYSTEM</span>
                </div>
                <div className="flex flex-wrap gap-2">
                    <span className="px-4 py-2 rounded text-xl font-bold font-mono tracking-widest" style={{ backgroundColor: SYSTEM_CHIP_COLOR.bg, border: `1px solid ${SYSTEM_CHIP_COLOR.border}`, color: SYSTEM_CHIP_COLOR.text }}>
                      {extractTagAbbrev(entry.details.classification || '')}
                    </span>
                </div>
            </div>
  ) : null;

  {/* Appellations Section - Regions with appellations */}
  const regionAppellations = isRegion && entry.details.appellations && entry.details.appellations.length > 0 ? (
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-3 dex-section-rule pb-1">
                    <Shield size={18} className="text-green-500" />
                    <span className="font-retro text-xs md:text-sm tracking-widest text-green-500">
                        APPELLATIONS
                    </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    {entry.details.appellations.map((appellation, i) => (
                        <div key={i} className="px-4 py-2 text-xl font-bold font-mono rounded text-center tracking-widest" style={{ backgroundColor: '#052e16', border: '1px solid #15803d', color: '#bbf7d0' }}>
                            {appellation}
                        </div>
                    ))}
                </div>
            </div>
  ) : null;

  {/* Notable Grapes Section - Regions */}
  const regionNotableGrapes = isRegion && listSectionData && listSectionData.length > 0 ? (
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-3 dex-section-rule pb-1">
                   <List size={18} className="text-green-500" />
                   <span className="font-retro text-xs md:text-sm tracking-widest text-green-500">NOTABLE GRAPES</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                     {listSectionData.slice(0, 8).map((item, idx) => renderLinkedTile(item, idx))}
                </div>
            </div>
  ) : null;

  {/* Notable Regions Section - Grapes */}
  const grapeNotableRegions = isGrapes && listSectionData && listSectionData.length > 0 ? (
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-3 dex-section-rule pb-1">
                   <MapPin size={18} className="text-green-500" />
                   <span className="font-retro text-xs md:text-sm tracking-widest text-green-500">NOTABLE REGIONS</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                     {listSectionData.slice(0, 8).map((item, idx) => renderLinkedTile(item, idx, { showRegionMetaTiles: true }))}
                </div>
            </div>
  ) : null;

  {/* Climate Section - Regions */}
  const regionClimate = isRegion ? (
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-2 dex-section-rule pb-1">
                    <Wind size={18} className="text-green-500" />
                    <span className="font-retro text-xs md:text-sm tracking-widest text-green-500">CLIMATE</span>
                </div>
                <div className="flex flex-wrap gap-2">
                    {(() => {
                      const sectionClimateColors = (entry.climate && CLIMATE_CLASS_MAP[entry.climate]?.colors) || CLIMATE_CHIP_COLOR;
                      // iOS wraps the climate icon + name together in the chip-
                      // coloured row, the glyph tinted with the border colour.
                      return (
                        <span className="inline-flex items-center gap-3 px-4 py-2 rounded text-xl font-bold font-mono tracking-widest" style={{ backgroundColor: sectionClimateColors.bg, border: `1px solid ${sectionClimateColors.border}`, color: sectionClimateColors.text }}>
                          <span className="inline-flex" style={{ color: sectionClimateColors.border }}>{getClimateIcon(entry.climate, 26)}</span>
                          {((entry.climate && CLIMATE_CLASS_MAP[entry.climate]?.name) || 'Unknown Climate').toUpperCase()}
                        </span>
                      );
                    })()}
                </div>
            </div>
  ) : null;

  {/* Soil Composition Section - Regions */}
  const regionSoil = isRegion ? (
            <div className="mb-6">
                 <div className="flex items-center gap-2 mb-3 dex-section-rule pb-1">
                   <Mountain size={18} className="text-green-500" />
                   <span className="font-retro text-xs md:text-sm tracking-widest text-green-500">SOIL COMPOSITION</span>
                 </div>
                 <div className="grid grid-cols-3 gap-3 items-stretch">
                    {regionSoils.map((soil, i) => {
                        const { icon, color } = getSoilIcon(soil);
                        return (
                            <button 
                                key={`${soil}-${i}`}
                                onClick={() => onFilterBySoil(soil)}
                                className="w-full flex flex-col items-center gap-3 p-3 bg-stone-900 border-2 border-stone-800 rounded-lg hover:border-green-500 hover:bg-stone-800 transition-all active:scale-95 group h-full"
                            >
                                <div 
                                  className="w-12 h-12 rounded-lg flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform border-2"
                                  style={{ backgroundColor: '#0b0f19', borderColor: color }}
                                >
                                  <span style={{ color }}>
                                    {icon}
                                  </span>
                                </div>
                                <span className="font-retro text-xs dex-text uppercase text-center leading-tight group-hover:text-green-300">
                                  {soil}
                                </span>
                            </button>
                        );
                    })}
                 </div>
            </div>
  ) : null;

  {/* Tasting Notes Section - List Tile (For Grapes only) */}
  const grapeFlavorProfile = isGrapes && flavorNotes.length > 0 ? (
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-3 dex-section-rule pb-1">
                    <Droplet size={18} className="text-green-500" />
                    <span className="font-retro text-xs md:text-sm tracking-widest text-green-500">FLAVOR PROFILE</span>
                </div>
                <div className="flex flex-col gap-2 w-full">
                  {flavorNotes.map((note, i) => {
                    // Get icon, color, and label
                    const { relatedFlavor, iconNode, borderColor, bgColor, label } = getFlavorTileVisual(note);
                    // Get class and type
                    const subclass = categorizeFlavorSubclass(label);
                    const flavorClass = categorizeFlavor(label, subclass);
                    const classColor = getFlavorClassChipColors(flavorClass);
                    const typeColor = getFlavorSubclassChipColors(subclass);
                    // iOS renders every note; those that do not resolve to a
                    // flavor entry render greyed and inert rather than dropped.
                    const isMatched = !!relatedFlavor;
                    return (
                      <button
                        type="button"
                        key={i}
                        onClick={() => relatedFlavor && onSelectRelated(relatedFlavor)}
                        disabled={!relatedFlavor}
                        className={`w-full border-2 rounded p-2 flex items-center gap-3 relative overflow-hidden min-h-[4.5rem] text-left transition-colors ${isMatched ? 'bg-stone-900 border-stone-700 hover:border-green-500 hover:bg-stone-800 cursor-pointer' : 'bg-stone-900/60 border-stone-800 opacity-70 cursor-default'}`}
                      >
                        {/* Hero Icon */}
                        <div
                          className={`shrink-0 ${CONTAINER_SIZE_LIST} ${CONTAINER_BORDER_CLASS} ${CONTAINER_SHADOW_CLASS} flex items-center justify-center ${CONTAINER_BORDER} ${isMatched ? '' : 'grayscale'}`}
                          style={{ backgroundColor: bgColor, borderColor }}
                        >
                          {iconNode}
                        </div>
                        {/* Name and Chips */}
                        <div className="flex flex-col flex-1 min-w-0 justify-center h-full items-start py-1">
                          <span className={`font-retro text-base leading-tight tracking-tight whitespace-normal break-words ${isMatched ? 'dex-text' : 'dex-disabled'}`}>
                            {label.toUpperCase()}
                          </span>
                          <div className="flex gap-1 mt-1">
                            <Chip label={flavorClass} colorStyle={classColor} />
                            <Chip label={subclass.replace(/_/g, ' ')} colorStyle={typeColor} />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
            </div>
  ) : null;

  return (
    <DeviceLayout
      title={scanTitle}
      onBack={onBack}
      showBack={true}
      onHome={onHome}
    >
      <div className="relative h-full">
      <div
        ref={scrollRef}
        className="h-full overflow-y-auto custom-scrollbar p-4 font-mono pb-20 text-[15px] md:text-base"
        style={{ backgroundColor: 'var(--lcd-page)', color: 'var(--lcd-accent)' }}
      >
        
        {/* Header Area with Title - Updated for text wrapping */}
        {/* Hero panel: `lcd.heroWash` behind the title, a solid accent rule at
            the bottom. Both follow the screen mode now. */}
        <div
          className="w-full min-h-[6rem] dex-hero-rule mb-4 relative overflow-hidden flex items-center justify-center shrink-0 p-4"
          style={{ backgroundColor: 'var(--lcd-hero-wash)' }}
        >
             <div className="absolute inset-0 grid grid-cols-8 grid-rows-4 opacity-20">
                {Array.from({ length: 32 }).map((_, i) => (
                    <div key={i} className="border border-green-900/50"></div>
                ))}
             </div>
             <div className="text-center z-10 w-full flex flex-col items-center px-2">
                {(() => {
                  const headerVisual = resolveEntryIconVisual(entry, {
                    size: ICON_SIZE_HEADER,
                    resolver: entryVisualResolver,
                    includeRegionClimateOutline: true,
                    countryOutlineHero: true,
                  });
                  // Hero: same width as before, height matches flag (h-8)
                  // Make hero icon bigger and perfectly square
                  return (
                    <div
                      className={`w-20 h-20 ${HEADER_BORDER_CLASS} border-2 ${isCountry || isState ? 'border-white' : 'border-black/30'} shadow-inner flex items-center justify-center mb-4 bg-stone-900`}
                      style={headerVisual.style}
                    >
                      {headerVisual.iconNode}
                    </div>
                  );
                })()}
                {/*
                  `lcd.text` with an accent drop shadow, as the iOS hero does.
                  This was a hardcoded `text-white` with a fixed dark-green
                  shadow, which is right on the black LCD and invisible on the
                  paper-white one — white on #F2F2EC is nothing at all.
                */}
                <h1
                  className="text-2xl md:text-3xl lg:text-4xl font-retro tracking-wide leading-tight break-words whitespace-normal uppercase w-full mt-4 mb-2"
                  style={{
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                    color: 'var(--lcd-text)',
                    textShadow: '4px 4px 0px color-mix(in srgb, var(--lcd-accent) 55%, transparent)',
                  }}
                >
                  {entry.name}
                </h1>

                {/*
                  Ported from the iOS hero's shelf controls (BookmarkStore):
                  SAVE is universal; WANT and TRIED show only for tastable
                  entries (grapes, styles). Marking TRIED opens the rating
                  prompt; the store also pulls it off WANT (coupling).
                */}
                {/* All three shelves wear the theme accent, as iOS does
                    (`shelfCapsule` fills with `lcd.accent` regardless of shelf);
                    the label + glyph, not colour, tell them apart. */}
                {(() => {
                  const shelfStyle = (on: boolean): React.CSSProperties => on
                    ? { backgroundColor: 'var(--lcd-accent)', borderColor: 'var(--lcd-accent)', color: 'var(--lcd-page)' }
                    : { backgroundColor: 'var(--lcd-well)', borderColor: 'var(--lcd-accent)', color: 'var(--lcd-accent)' };
                  const shelfClass = 'flex items-center gap-1.5 rounded-full px-4 py-2 border-2 transition-all active:translate-y-0.5';
                  return (
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    onClick={() => toggleBookmark(entry.id)}
                    aria-pressed={saved}
                    className={shelfClass}
                    style={shelfStyle(saved)}
                  >
                    <Bookmark size={15} fill={saved ? 'currentColor' : 'none'} />
                    <span className="font-retro text-[0.55rem] tracking-widest">{saved ? 'SAVED' : 'SAVE'}</span>
                  </button>

                  {tastable && (
                    <button
                      onClick={() => toggleShelf('wantToTry', entry.id)}
                      aria-pressed={want}
                      className={shelfClass}
                      style={shelfStyle(want)}
                    >
                      <PlusCircle size={15} fill={want ? 'currentColor' : 'none'} />
                      <span className="font-retro text-[0.55rem] tracking-widest">{want ? 'WANTED' : 'WANT'}</span>
                    </button>
                  )}

                  {tastable && (
                    <button
                      onClick={() => {
                        const nowTried = toggleShelf('tried', entry.id);
                        if (nowTried) setShowRating(true);
                      }}
                      aria-pressed={tried}
                      className={shelfClass}
                      style={shelfStyle(tried)}
                    >
                      <CheckCircle2 size={15} fill={tried ? 'currentColor' : 'none'} />
                      <span className="font-retro text-[0.55rem] tracking-widest">TRIED</span>
                    </button>
                  )}
                </div>
                  );
                })()}

             </div>
        </div>

        {/* 3-Tile Header Row */}
        {headerTiles}
        {headerTiles ? <div className="w-full dex-hero-rule mb-4"></div> : null}

        {/* Info Section - Description at Top. iOS gates INFO purely on a
            non-empty description (EntryDetailScreen.body), so flavours whose
            blurb now names their derived grapes get the block too. */}
        {(grapeCard?.info || entry.description) && (
          <div className="mb-6">
              <div className="flex items-center gap-2 mb-2 dex-section-rule pb-1">
                  <BookOpen size={18} className="text-green-500" />
                  <span className="font-retro text-xs md:text-sm tracking-widest text-green-500">INFO</span>
              </div>
              <div className="dex-info-rule dex-info-wash pl-4 py-3">
                  <p className="text-lg md:text-xl leading-relaxed text-green-200 font-medium break-words whitespace-normal normal-case">
                      {grapeCard?.info || entry.description}
                  </p>
              </div>
          </div>
        )}

        {/* MY RATING — dedicated body section for tastable entries you've tried
            (iOS EntryDetailScreen.myTasting): star header, five large stars,
            RATE/EDIT capsule, note below. */}
        {tastable && tried && (
          <div className="mb-6">
              <div className="flex items-center gap-2 mb-3 dex-section-rule pb-1">
                  <Star size={18} className="text-green-500" fill="#22c55e" />
                  <span className="font-retro text-xs md:text-sm tracking-widest text-green-500">MY RATING</span>
              </div>
              <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 flex-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={26}
                        className={i < (rating?.rating ?? 0) ? 'text-yellow-400' : 'text-stone-600'}
                        fill={i < (rating?.rating ?? 0) ? '#facc15' : 'none'}
                      />
                    ))}
                  </span>
                  <button
                    onClick={() => setShowRating(true)}
                    className="flex items-center gap-1.5 rounded-full px-4 py-2 bg-stone-900/70 border-2 border-amber-500 text-amber-300 hover:bg-stone-800 transition-colors active:translate-y-0.5"
                    aria-label={rating ? 'Edit your rating' : 'Rate this entry'}
                  >
                    <PlusCircle size={14} />
                    <span className="font-retro text-[0.6rem] tracking-widest">{rating ? 'EDIT' : 'RATE'}</span>
                  </button>
              </div>
              {rating?.note ? (
                <p className="mt-3 font-mono text-lg text-stone-300 break-words whitespace-normal">{rating.note}</p>
              ) : null}
          </div>
        )}

        {/* Search States Button - USA only */}
        {isCountry && entry.name === 'USA' && onViewStates && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2 dex-section-rule pb-1">
              <MapPinned size={18} className="text-green-500" />
              <span className="font-retro text-xs md:text-sm tracking-widest text-green-500">STATES</span>
            </div>
            <button
              onClick={onViewStates}
              className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-stone-900 border-2 border-stone-700 hover:border-green-500 hover:bg-stone-800 rounded transition-all group"
            >
              <MapPinned size={20} className="text-green-500 group-hover:text-green-400" />
              <span className="font-retro text-base tracking-widest text-green-500 group-hover:text-green-400">SEARCH STATES</span>
            </button>
          </div>
        )}

        {/* Main Grapes Section - States */}
        {isState && entry.details.notableGrapes && entry.details.notableGrapes.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2 dex-section-rule pb-1">
              <Leaf size={18} className="text-green-500" />
              <span className="font-retro text-xs md:text-sm tracking-widest text-green-500">MAIN GRAPES</span>
            </div>
            <div className="space-y-2">
              {expandableList(entry.details.notableGrapes, 3, 'grapes')}
            </div>
          </div>
        )}

        {/* Appellation Systems Section - States */}
        {isState && entry.tags && entry.tags.filter(t => t !== 'STATE').length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2 dex-section-rule pb-1">
              <Shield size={18} className="text-green-500" />
              <span className="font-retro text-xs md:text-sm tracking-widest text-green-500">APPELLATION SYSTEMS</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {entry.tags.filter(t => t !== 'STATE').map((system, idx) => {
                const c = APPELLATION_CHIP_COLORS[idx % 3]!;
                return (
                  <span key={idx} className="px-4 py-2 rounded text-xl font-bold font-mono tracking-widest" style={{ backgroundColor: c.bg, border: `1px solid ${c.border}`, color: c.text }}>
                    {extractTagAbbrev(system)}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Key Regions Section - States */}
        {isState && entry.details.keyRegions && entry.details.keyRegions.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2 dex-section-rule pb-1">
              <MapPin size={18} className="text-green-500" />
              <span className="font-retro text-xs md:text-sm tracking-widest text-green-500">KEY REGIONS</span>
            </div>
            <div className="space-y-2">
              {expandableList(entry.details.keyRegions, 6, 'regions', { showRegionMetaTiles: true })}
            </div>
          </div>
        )}

        {/* Main Grapes Section - Countries */}
        {isCountry && entry.details.notableGrapes && entry.details.notableGrapes.length > 0 && (
          <div className="mb-6">
              <div className="flex items-center gap-2 mb-2 dex-section-rule pb-1">
                  <Leaf size={18} className="text-green-500" />
                  <span className="font-retro text-xs md:text-sm tracking-widest text-green-500">MAIN GRAPES</span>
              </div>
              <div className="space-y-2">
                {expandableList(entry.details.notableGrapes, 3, 'grapes')}
              </div>
          </div>
        )}

        {/* System Section - Appellation Systems for Countries */}
        {isCountry && entry.tags && entry.tags.length > 0 && (
          <div className="mb-6">
              <div className="flex items-center gap-2 mb-2 dex-section-rule pb-1">
                  <Shield size={18} className="text-green-500" />
                  <span className="font-retro text-xs md:text-sm tracking-widest text-green-500">APPELLATION SYSTEMS</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {entry.tags.filter(tag => tag !== 'COUNTRY').map((system, idx) => {
                  const c = APPELLATION_CHIP_COLORS[idx % 3]!;
                  return (
                    <span key={idx} className="px-4 py-2 rounded text-xl font-bold font-mono tracking-widest" style={{ backgroundColor: c.bg, border: `1px solid ${c.border}`, color: c.text }}>
                      {extractTagAbbrev(system)}
                    </span>
                  );
                })}
              </div>
          </div>
        )}

        {/* Key Regions Section - Countries with Regions */}
        {isCountry && entry.details.keyRegions && entry.details.keyRegions.length > 0 && (
          <div className="mb-6">
              <div className="flex items-center gap-2 mb-2 dex-section-rule pb-1">
                  <MapPin size={18} className="text-green-500" />
                  <span className="font-retro text-xs md:text-sm tracking-widest text-green-500">KEY REGIONS</span>
              </div>
              <div className="space-y-2">
                {expandableList(entry.details.keyRegions, 6, 'regions', { showRegionMetaTiles: true })}
              </div>
          </div>
        )}

        {/* Grape sections, in the order EntryDetailScreen.swift lists them
            (v0.5.6): rarity leads — it's the one-glance fact — then
            characteristics, flavour profile, synonyms, regions. */}
        {grapeRarity}
        {grapeCharacteristics}
        {grapeFlavorProfile}
        {grapeAlsoKnownAs}
        {grapeNotableRegions}

        {/* Region sections, likewise: the system that governs the region, its
            denominations, then climate and soil, then the grapes. The grape
            list sat third here, above climate and soil. */}
        {regionSystem}
        {regionAppellations}
        {regionClimate}
        {regionSoil}
        {regionNotableGrapes}









        {/* Countries Section - Continents */}
        {isContinent && listSectionData && listSectionData.length > 0 && (
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-3 dex-section-rule pb-1">
                   <List size={18} className="text-green-500" />
                   <span className="font-retro text-xs md:text-sm tracking-widest text-green-500">{listSectionTitle}</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                   {listSectionData.map((item, idx) => renderLinkedTile(item, idx, { preferCountryGate: true }))}
                </div>
            </div>
        )}




        {/* Method Class: Key Grapes */}
        {isStyle && isMethodClass && entry.details.notableGrapes && entry.details.notableGrapes.length > 0 && (
          <div className="mb-6">
              <div className="flex items-center gap-2 mb-3 dex-section-rule pb-1">
                  <Grape size={18} className="text-green-500" />
                  <span className="font-retro text-xs md:text-sm tracking-widest text-green-500">KEY GRAPES</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                  {expandableList(entry.details.notableGrapes, 3, 'grapes')}
              </div>
          </div>
        )}

        {/* Notable Grapes Section - For Styles (Style class) */}
        {isStyle && isStyleClassType && styleGrapes.length > 0 && (
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-3 dex-section-rule pb-1">
                    <Grape size={18} className="text-green-500" />
                    <span className="font-retro text-xs md:text-sm tracking-widest text-green-500">NOTABLE GRAPES</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                     {expandableList(styleGrapes, 3, 'stylegrapes')}
                </div>
            </div>
        )}

        {/* Notable Grapes Section - TYPE-class styles (iOS parity) */}
        {isStyle && styleClassType === 'TYPE' && styleGrapes.length > 0 && (
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-3 dex-section-rule pb-1">
                    <Grape size={18} className="text-green-500" />
                    <span className="font-retro text-xs md:text-sm tracking-widest text-green-500">NOTABLE GRAPES</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                     {expandableList(styleGrapes, 3, 'stylegrapes')}
                </div>
            </div>
        )}


        {/* Flavor entries: notable grapes */}
        {isFlavor && entry.details.notableGrapes && entry.details.notableGrapes.length > 0 && (
          <div className="mb-6">
              <div className="flex items-center gap-2 mb-3 dex-section-rule pb-1">
                  <Grape size={18} className="text-green-500" />
                  <span className="font-retro text-xs md:text-sm tracking-widest text-green-500">NOTABLE GRAPES</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                   {expandableList(entry.details.notableGrapes, 8, 'grapes')}
              </div>
          </div>
        )}

        {/* Origin Class: Notable Grapes */}
        {isStyle && isOriginClass && entry.details.notableGrapes && entry.details.notableGrapes.length > 0 && (
          <div className="mb-6">
              <div className="flex items-center gap-2 mb-3 dex-section-rule pb-1">
                  <Grape size={18} className="text-green-500" />
                  <span className="font-retro text-xs md:text-sm tracking-widest text-green-500">NOTABLE GRAPES</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                   {expandableList(entry.details.notableGrapes, 3, 'grapes')}
              </div>
          </div>
        )}

        {isStyle && isOriginClass && entry.details.keyRegions && entry.details.keyRegions.length > 0 && (
          <div className="mb-6">
              <div className="flex items-center gap-2 mb-3 dex-section-rule pb-1">
                  <MapPin size={18} className="text-green-500" />
                  <span className="font-retro text-xs md:text-sm tracking-widest text-green-500">KEY REGIONS</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                   {expandableList(entry.details.keyRegions, 3, 'regions', { showRegionMetaTiles: true })}
              </div>
          </div>
        )}

        {/* Key Regions for Styles (skip Origin class) */}
        {isStyle && !isOriginClass && entry.details.keyRegions && entry.details.keyRegions.length > 0 && (
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-3 dex-section-rule pb-1">
                    <MapPin size={18} className="text-green-500" />
                    <span className="font-retro text-xs md:text-sm tracking-widest text-green-500">KEY REGIONS</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                     {expandableList(entry.details.keyRegions, 3, 'regions', { showRegionMetaTiles: true })}
                </div>
            </div>
        )}

      </div>
      {showRating && tastable && (
        <RatingPrompt
          entryName={entry.name}
          initial={rating}
          onSave={(stars, note) => {
            setRating(entry.id, makeRating(stars, note));
            setShowRating(false);
          }}
          onSkip={() => setShowRating(false)}
        />
      )}
      </div>
    </DeviceLayout>
  );
};

export default EntryDetail;
