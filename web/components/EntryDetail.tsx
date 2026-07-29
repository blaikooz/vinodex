import React, { useMemo, useReducer, useRef } from 'react';
import { Tag, MapPin, Activity, Droplet, Grape, Mountain, ChevronRight, List, Circle, Leaf, Sparkles, Flame, Shield, BookOpen, Bookmark, MapPinned, Flower2, Apple, Wind, Citrus, Star, Crown, Waves, Coffee, Beef, Cherry, TreePalm, LeafyGreen, Carrot, Drumstick, Ham, Croissant, Cookie, Earth, TreePine, Shell, Hop, Nut } from 'lucide-react';
import { Icon } from '@iconify/react';
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
import { getCountryChipColors, getFlavorClassChipColors, getFlavorSubclassChipColors, SYSTEM_CHIP_COLOR, CLIMATE_CHIP_COLOR, APPELLATION_CHIP_COLORS, extractTagAbbrev } from '@/shared/services/chipColors';
import { getGrapeColorLabel, getGrapeBodyLabel, getGrapeColorChipColors, getGrapeBodyChipColors } from '../src/services/grapeDisplay';
import { getLucideIcon } from '../src/services/lucideIconMap';
import { getSoilIcon, getSoilsForRegion } from '../src/services/soilDisplay';
import { normalizeTypeClass, getStyleClassTileColors, getStyleColorTileColors, getWineTypeTileColors } from '../src/services/styleDisplay';
import { getFlavorClassTileColors, getFlavorSubclassTileColors } from '../src/services/flavorDisplay';
import { getClimateIcon } from '../src/services/climateDisplay';
import { isOn as isFlagOn, keyForDetail, toggleFlag } from '../src/services/screenState';
import { useScreenAnchor } from '../src/services/useScreenAnchor';
import { isBookmarked, toggleBookmark } from '../src/services/bookmarks';
import { useBookmarks } from '../src/services/useBookmarks';

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

  // Subscribes this screen to the bookmark store so the SAVE control reflects
  // a change made anywhere else — the saved list, another tab.
  useBookmarks();
  const saved = isBookmarked(entry.id);

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
  const matchedFlavorNotes = flavorNotes.filter((note) => !!getExactFlavorEntry(note.note));
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
            className="w-full flex items-center justify-center gap-2 py-3 rounded border-2 border-stone-700 hover:border-green-500 transition-colors font-retro text-[0.6rem] tracking-widest text-green-500"
          >
            {expanded ? 'SHOW FEWER' : `SHOW ALL (${items.length})`}
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
            <span className={`font-retro text-base leading-tight break-words whitespace-normal ${isLinkable ? 'text-white group-hover:text-green-400' : 'text-stone-500'}`}>
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
              icon={colorType === 'RED' ? 'game-icons:wine-bottle' : 'game-icons:wine-glass'}
              width={headerTileIconSize}
              height={headerTileIconSize}
            />
          );
          const bodyLabel = getGrapeBodyLabel(entry);
          const BODY_ICON_MAP: Record<string, string> = {
            'Light': 'game-icons:feather',
            'Light-Medium': 'game-icons:scales-tipped',
            'Medium': 'game-icons:scales',
            'Medium-Full': 'game-icons:weight-lifting-up',
            'Full': 'game-icons:weight',
          };
          const bodyIconName = BODY_ICON_MAP[bodyLabel] || 'game-icons:scales';
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
      
      return (
          <div className={getTileRowClass(3)}>
              {/* Tile 1: Main Grape */}
              <button 
                onClick={() => mainGrapeEntry && onSelectRelated(mainGrapeEntry)}
                disabled={!mainGrapeEntry}
                className={tileBase}
                style={{ backgroundColor: 'transparent', borderColor: 'transparent', color: '#22c55e' }}
              >
                   <span className={labelStyle}>KEY GRAPE</span>
                   <div
                     className={"w-12 h-12 rounded-lg border border-stone-700 shadow-inner flex items-center justify-center mb-1"}
                     style={mainGrapeIconStyle}
                   >
                     {/* Render the icon at 32px, centered */}
                     {mainGrapeEntry && resolveEntryIconVisual(mainGrapeEntry, {
                       size: 32,
                       resolver: entryVisualResolver,
                       includeRegionClimateOutline: true,
                     }).iconNode}
                   </div>
                   <span className={chipStyle} style={{ backgroundColor: mainGrapeTypeColors.bg, borderColor: mainGrapeTypeColors.border, color: mainGrapeTypeColors.text }}>
                     {formatUpper(mainGrape)}
                   </span>
              </button>

              {/* Tile 2: Climate */}
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

              {/* Tile 3: Country (right aligned via grid order) */}
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
          );
      } else if (isStyle) {
          const classColors = getStyleClassTileColors(styleClassType);
          const flagGradient = getFlagGradient(entry.details.origin);
          const flagImage = getFlagImage(entry.details.origin);
          const STYLE_CLASS_ICON_MAP: Record<string, string> = {
            TYPE: 'game-icons:holy-grail',
            BLEND: 'game-icons:pouring-chalice',
            ORIGIN: 'game-icons:atlas',
            METHOD: 'game-icons:cellar-barrels',
            STYLE: 'game-icons:grapes',
          };
          const styleClassIconNode = (
            <Icon
              icon={(styleClassType && STYLE_CLASS_ICON_MAP[styleClassType]) || 'game-icons:grapes'}
              width={32}
              height={32}
            />
          );

          const STYLE_COLOR_ICON_MAP: Record<string, string> = {
            RED: 'game-icons:wine-bottle',
            WHITE: 'game-icons:wine-glass',
            ROSE: 'game-icons:rose',
            ORANGE: 'game-icons:sun',
            DUAL: 'game-icons:two-shadows',
          };
          const colorIconNode = (
            <Icon
              icon={(colorType && STYLE_COLOR_ICON_MAP[colorType]) || 'game-icons:wine-glass'}
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

          const tiles = [classTile, colorTile];
          if (originTile) tiles.push(originTile);

          return <div className={getTileRowClass(tiles.length)}>{tiles}</div>;
      } else if (isFlavor) {
        const flavorClass = entry.details.classification || 'FLAVOR';
        const flavorColors = getFlavorClassTileColors(flavorClass);
        const subclass = entry.details.subclass || 'SUBCLASS';
        const subclassColors = getFlavorSubclassTileColors(entry.details.subclass);
        const linkedGrapesCount = (entry.details.notableGrapes || []).length;
        const linkedGrapesColors = { bg: '#14532d', border: '#22c55e', text: '#dcfce7' };

        const flavorClassIconNode = (() => {
          switch (flavorClass.toUpperCase()) {
            case 'SWEET': return <Sparkles size={32} />;
            case 'SOUR': return <Citrus size={32} />;
            case 'SALTY': return <Waves size={32} />;
            case 'BITTER': return <Coffee size={32} />;
            case 'UMAMI': return <Beef size={32} />;
            default: return <Circle size={32} />;
          }
        })();

        const subclassIconNode = (() => {
          switch ((entry.details.subclass || '').toUpperCase()) {
            case 'CITRUS': return <Citrus size={32} />;
            case 'ORCHARD_FRUIT': return <Apple size={32} />;
            case 'STONE_FRUIT': return <Cherry size={32} />;
            case 'TROPICAL': return <TreePalm size={32} />;
            case 'RED_FRUIT': return <Cherry size={32} />;
            case 'DARK_FRUIT': return <Grape size={32} />;
            case 'BERRY': return <Grape size={32} />;
            case 'HERBAL': return <LeafyGreen size={32} />;
            case 'VEGETAL': return <Carrot size={32} />;
            case 'GAME': return <Drumstick size={32} />;
            case 'SAVORY': return <Ham size={32} />;
            case 'SPICE': return <Flame size={32} />;
            case 'BREAD': return <Croissant size={32} />;
            case 'BAKING': return <Cookie size={32} />;
            case 'FLORAL': return <Flower2 size={32} />;
            case 'EARTH': return <Earth size={32} />;
            case 'SMOKY': return <Wind size={32} />;
            case 'WOOD': return <TreePine size={32} />;
            case 'SALTY': return <Droplet size={32} />;
            case 'BRINY': return <Shell size={32} />;
            case 'WAX': return <Hop size={32} />;
            case 'NUT': return <Nut size={32} />;
            default: return buildIconNode(entry.icon || 'default', subclassColors.border, 32);
          }
        })();

        return (
          <div className={getTileRowClass(3)}>
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
            <div className={`${tileBase} cursor-default`}>
              <span className={labelStyle}>GRAPES</span>
              <div className={iconRowStyle} style={{ color: linkedGrapesColors.border }}>
                <Grape size={32} />
              </div>
              <span className={chipStyle} style={{ backgroundColor: linkedGrapesColors.bg, borderColor: linkedGrapesColors.border, color: linkedGrapesColors.text }}>
                {linkedGrapesCount}
              </span>
            </div>
          </div>
        );
      }
      return null;
  };

  const headerTiles = renderHeaderTiles();

  return (
    <DeviceLayout
      title={scanTitle}
      onBack={onBack}
      showBack={true}
      onHome={onHome}
    >
      <div
        ref={scrollRef}
        className="h-full overflow-y-auto custom-scrollbar p-4 font-mono pb-20 text-[15px] md:text-base"
        style={{ backgroundColor: 'var(--lcd-page)', color: 'var(--lcd-accent)' }}
      >
        
        {/* Header Area with Title - Updated for text wrapping */}
        <div className="w-full min-h-[6rem] border-b-4 border-green-800 bg-green-900/10 mb-4 relative overflow-hidden flex items-center justify-center shrink-0 p-4">
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
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-retro text-white drop-shadow-[4px_4px_0px_rgba(0,100,0,0.8)] tracking-wide leading-tight break-words whitespace-normal uppercase w-full mt-4 mb-2" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                  {entry.name}
                </h1>

                {/* Ported from the iOS hero's SAVE control — see BookmarkStore. */}
                <button
                  onClick={() => toggleBookmark(entry.id)}
                  aria-pressed={saved}
                  className={`flex items-center gap-2 rounded-full px-5 py-2 border-2 transition-all active:translate-y-0.5 ${
                    saved
                      ? 'bg-green-600 border-green-400 text-white'
                      : 'bg-stone-900/70 border-green-700 text-green-400 hover:bg-stone-800'
                  }`}
                >
                  <Bookmark size={16} fill={saved ? 'currentColor' : 'none'} />
                  <span className="font-retro text-[0.6rem] tracking-widest">{saved ? 'SAVED' : 'SAVE'}</span>
                </button>
             </div>
        </div>

        {/* 3-Tile Header Row */}
        {headerTiles}
        {headerTiles ? <div className="w-full border-b-4 border-green-800 mb-4"></div> : null}

        {/* Info Section - Description at Top (skip for flavor entries) */}
        {!isFlavor && (
          <div className="mb-6">
              <div className="flex items-center gap-2 mb-2 border-b-2 border-green-800 pb-1">
                  <BookOpen size={18} className="text-green-500" />
                  <span className="font-retro text-xs md:text-sm tracking-widest text-green-500">INFO</span>
              </div>
              <div className="border-l-4 border-green-700 pl-4 py-3 bg-green-900/5">
                  <p className="text-lg md:text-xl leading-relaxed text-green-200 font-medium break-words whitespace-normal normal-case">
                      {grapeCard?.info || entry.description}
                  </p>
              </div>
          </div>
        )}

        {/* Search States Button - USA only */}
        {isCountry && entry.name === 'USA' && onViewStates && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2 border-b-2 border-green-800 pb-1">
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
            <div className="flex items-center gap-2 mb-2 border-b-2 border-green-800 pb-1">
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
            <div className="flex items-center gap-2 mb-2 border-b-2 border-green-800 pb-1">
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
            <div className="flex items-center gap-2 mb-2 border-b-2 border-green-800 pb-1">
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
              <div className="flex items-center gap-2 mb-2 border-b-2 border-green-800 pb-1">
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
              <div className="flex items-center gap-2 mb-2 border-b-2 border-green-800 pb-1">
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
              <div className="flex items-center gap-2 mb-2 border-b-2 border-green-800 pb-1">
                  <MapPin size={18} className="text-green-500" />
                  <span className="font-retro text-xs md:text-sm tracking-widest text-green-500">KEY REGIONS</span>
              </div>
              <div className="space-y-2">
                {expandableList(entry.details.keyRegions, 6, 'regions', { showRegionMetaTiles: true })}
              </div>
          </div>
        )}

        {/* Alternate Names Section - Grapes */}
        {isGrapes && (
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-3 border-b-2 border-green-800 pb-1">
                    <Tag size={18} className="text-green-500" />
                    <span className="font-retro text-xs md:text-sm tracking-widest text-green-500">ALTERNATE NAMES</span>
                </div>
                {grapeAlternateNames.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                      {grapeAlternateNames.map((name, i) => (
                          <span key={i} className="px-4 py-2 bg-stone-800 text-stone-200 border border-stone-600 text-xl font-bold font-mono rounded tracking-widest">
                              {name}
                          </span>
                      ))}
                  </div>
                ) : (
                  <div className="border border-stone-700 bg-stone-900/80 rounded p-3">
                    <p className="text-xl font-bold font-mono text-stone-300 tracking-widest">NO ALTERNATE NAMES LISTED.</p>
                  </div>
                )}
            </div>
        )}

        {/* Rarity Section - Grapes */}
        {isGrapes && (
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-3 border-b-2 border-green-800 pb-1">
                    <Star size={24} className="text-green-400" />
                    <span className="font-retro text-xs md:text-sm tracking-widest text-green-400">RARITY</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex-1 flex items-center px-3 py-1.5 rounded-full border-2 border-green-500 bg-green-950 text-base font-extrabold uppercase text-green-300 justify-between" style={{ letterSpacing: '0.1em' }}>
                    {displayClass}
                    <span className="ml-2 flex items-center">
                      {(() => {
                        const rarity = (entry.rarity || '').toUpperCase();
                        if (rarity === 'NOBLE') {
                          return <Crown size={20} className="text-yellow-400 ml-1" />;
                        }
                        const starCount = rarity === 'RARE' ? 3 : rarity === 'COMMON' ? 2 : rarity === 'UNCOMMON' ? 1 : 1;
                        return Array.from({ length: starCount }).map((_, i) => (
                          <Star key={i} size={18} className="text-yellow-400 ml-0.5" fill="#facc15" />
                        ));
                      })()}
                    </span>
                  </span>
                </div>
            </div>
        )}



        {/* Stats Section - Only for GRAPES */}
        {isGrapes && grapeCard && (
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-2 border-b-2 border-green-800 pb-1">
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
                          <span className="w-24 text-base font-bold text-white font-mono tracking-widest shrink-0">{stat.label}</span>
                          <div className="flex-1 h-2 bg-stone-800 flex gap-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                  <div key={i} className={`flex-1 ${i < stat.value ? stat.color : 'bg-transparent'} transition-all`}></div>
                              ))}
                          </div>
                      </div>
                    ))}
                </div>
            </div>
        )}

        {/* System Section - Regions */}
        {isRegion && entry.details.classification && (
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-2 border-b-2 border-green-800 pb-1">
                    <Shield size={18} className="text-green-500" />
                    <span className="font-retro text-xs md:text-sm tracking-widest text-green-500">APPELLATION SYSTEMS</span>
                </div>
                <div className="flex flex-wrap gap-2">
                    <span className="px-4 py-2 rounded text-xl font-bold font-mono tracking-widest" style={{ backgroundColor: SYSTEM_CHIP_COLOR.bg, border: `1px solid ${SYSTEM_CHIP_COLOR.border}`, color: SYSTEM_CHIP_COLOR.text }}>
                      {extractTagAbbrev(entry.details.classification || '')}
                    </span>
                </div>
            </div>
        )}

        {/* Appellations Section - Regions with appellations */}
        {isRegion && entry.details.appellations && entry.details.appellations.length > 0 && (
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-3 border-b-2 border-green-800 pb-1">
                    <MapPinned size={18} className="text-green-500" />
                    <span className="font-retro text-xs md:text-sm tracking-widest text-green-500">
                        {entry.name.includes('Beaujolais') ? 'CRUS OF BEAUJOLAIS' : 'APPELLATIONS'}
                    </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    {entry.details.appellations.map((appellation, i) => (
                        <div key={i} className="px-4 py-2 bg-stone-800 text-stone-200 border border-stone-600 text-xl font-bold font-mono rounded text-center tracking-widest">
                            {appellation}
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* Notable Grapes Section - Regions */}
        {isRegion && listSectionData && listSectionData.length > 0 && (
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-3 border-b-2 border-green-800 pb-1">
                   <List size={18} className="text-green-500" />
                   <span className="font-retro text-xs md:text-sm tracking-widest text-green-500">NOTABLE GRAPES</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                     {expandableList(listSectionData, 8, 'list')}
                </div>
            </div>
        )}

        {/* Notable Regions Section - Grapes */}
        {isGrapes && listSectionData && listSectionData.length > 0 && (
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-3 border-b-2 border-green-800 pb-1">
                   <MapPin size={18} className="text-green-500" />
                   <span className="font-retro text-xs md:text-sm tracking-widest text-green-500">NOTABLE REGIONS</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                     {expandableList(listSectionData, 8, 'list', { showRegionMetaTiles: true })}
                </div>
            </div>
        )}

        {/* Countries Section - Continents */}
        {isContinent && listSectionData && listSectionData.length > 0 && (
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-3 border-b-2 border-green-800 pb-1">
                   <List size={18} className="text-green-500" />
                   <span className="font-retro text-xs md:text-sm tracking-widest text-green-500">{listSectionTitle}</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                   {listSectionData.map((item, idx) => renderLinkedTile(item, idx, { preferCountryGate: true }))}
                </div>
            </div>
        )}

        {/* Climate Section - Regions */}
        {isRegion && (
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-2 border-b-2 border-green-800 pb-1">
                    <Wind size={18} className="text-green-500" />
                    <span className="font-retro text-xs md:text-sm tracking-widest text-green-500">CLIMATE</span>
                </div>
                <div className="flex flex-wrap gap-2">
                    {(() => {
                      const sectionClimateColors = (entry.climate && CLIMATE_CLASS_MAP[entry.climate]?.colors) || CLIMATE_CHIP_COLOR;
                      return (
                        <span className="px-4 py-2 rounded text-xl font-bold font-mono tracking-widest" style={{ backgroundColor: sectionClimateColors.bg, border: `1px solid ${sectionClimateColors.border}`, color: sectionClimateColors.text }}>
                          {(entry.climate && CLIMATE_CLASS_MAP[entry.climate]?.name) || 'Unknown Climate'}
                        </span>
                      );
                    })()}
                </div>
            </div>
        )}

        {/* Soil Composition Section - Regions */}
        {isRegion && (
            <div className="mb-6">
                 <div className="flex items-center gap-2 mb-3 border-b-2 border-green-800 pb-1">
                   <Mountain size={18} className="text-green-500" />
                   <span className="font-retro text-xs md:text-sm tracking-widest text-green-500">SOIL COMPOSITION</span>
                 </div>
                 <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 items-stretch">
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
                                <span className="font-retro text-xs text-white uppercase text-center leading-tight group-hover:text-green-300">
                                  {soil}
                                </span>
                            </button>
                        );
                    })}
                 </div>
            </div>
        )}

        {/* Tasting Notes Section - List Tile (For Grapes only) */}
        {isGrapes && (
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-3 border-b-2 border-green-800 pb-1">
                    <Grape size={18} className="text-green-500" />
                    <span className="font-retro text-xs md:text-sm tracking-widest text-green-500">FLAVOR PROFILE</span>
                </div>
                {matchedFlavorNotes.length > 0 ? (
                  <div className="flex flex-col gap-2 w-full">
                    {matchedFlavorNotes.map((note, i) => {
                      // Get icon, color, and label
                      const { relatedFlavor, iconNode, borderColor, bgColor, label } = getFlavorTileVisual(note);
                      // Get class and type
                      const subclass = categorizeFlavorSubclass(label);
                      const flavorClass = categorizeFlavor(label, subclass);
                      const classColor = getFlavorClassChipColors(flavorClass);
                      const typeColor = getFlavorSubclassChipColors(subclass);
                      return (
                        <button
                          type="button"
                          key={i}
                          onClick={() => relatedFlavor && onSelectRelated(relatedFlavor)}
                          disabled={!relatedFlavor}
                          className="w-full bg-stone-900 border-2 border-stone-700 rounded p-2 flex items-center gap-3 relative overflow-hidden min-h-[4.5rem] text-left hover:border-green-500 hover:bg-stone-800 transition-colors disabled:cursor-not-allowed cursor-pointer"
                        >
                          {/* Hero Icon */}
                          <div
                            className={`shrink-0 ${CONTAINER_SIZE_LIST} ${CONTAINER_BORDER_CLASS} ${CONTAINER_SHADOW_CLASS} flex items-center justify-center ${CONTAINER_BORDER}`}
                            style={{ backgroundColor: bgColor, borderColor }}
                          >
                            {iconNode}
                          </div>
                          {/* Name and Chips */}
                          <div className="flex flex-col flex-1 min-w-0 justify-center h-full items-start py-1">
                            <span className="font-retro text-base text-white leading-tight tracking-tight whitespace-normal break-words">
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
                ) : (
                  <div className="border border-stone-700 bg-stone-900/80 rounded p-3">
                    <p className="text-sm text-stone-300">No flavor profile listed.</p>
                  </div>
                )}
            </div>
        )}

        {/* Method Class: Key Grapes */}
        {isStyle && isMethodClass && entry.details.notableGrapes && entry.details.notableGrapes.length > 0 && (
          <div className="mb-6">
              <div className="flex items-center gap-2 mb-3 border-b-2 border-green-800 pb-1">
                  <Grape size={18} className="text-green-500" />
                  <span className="font-retro text-xs md:text-sm tracking-widest text-green-500">KEY GRAPES</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                  {expandableList(entry.details.notableGrapes, 6, 'grapes')}
              </div>
          </div>
        )}

        {/* Notable Grapes Section - For Styles (Style class) */}
        {isStyle && isStyleClassType && styleGrapes.length > 0 && (
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-3 border-b-2 border-green-800 pb-1">
                    <Grape size={18} className="text-green-500" />
                    <span className="font-retro text-xs md:text-sm tracking-widest text-green-500">NOTABLE GRAPES</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                     {expandableList(styleGrapes, 6, 'stylegrapes')}
                </div>
            </div>
        )}


        {/* Flavor entries: notable grapes */}
        {isFlavor && entry.details.notableGrapes && entry.details.notableGrapes.length > 0 && (
          <div className="mb-6">
              <div className="flex items-center gap-2 mb-3 border-b-2 border-green-800 pb-1">
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
              <div className="flex items-center gap-2 mb-3 border-b-2 border-green-800 pb-1">
                  <Grape size={18} className="text-green-500" />
                  <span className="font-retro text-xs md:text-sm tracking-widest text-green-500">NOTABLE GRAPES</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                   {expandableList(entry.details.notableGrapes, 6, 'grapes')}
              </div>
          </div>
        )}

        {isStyle && isOriginClass && entry.details.keyRegions && entry.details.keyRegions.length > 0 && (
          <div className="mb-6">
              <div className="flex items-center gap-2 mb-3 border-b-2 border-green-800 pb-1">
                  <MapPin size={18} className="text-green-500" />
                  <span className="font-retro text-xs md:text-sm tracking-widest text-green-500">KEY REGIONS</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                   {expandableList(entry.details.keyRegions, 6, 'regions', { showRegionMetaTiles: true })}
              </div>
          </div>
        )}

        {/* Key Regions for Styles (skip Origin class) */}
        {isStyle && !isOriginClass && entry.details.keyRegions && entry.details.keyRegions.length > 0 && (
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-3 border-b-2 border-green-800 pb-1">
                    <MapPin size={18} className="text-green-500" />
                    <span className="font-retro text-xs md:text-sm tracking-widest text-green-500">KEY REGIONS</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                     {expandableList(entry.details.keyRegions, 6, 'regions', { showRegionMetaTiles: true })}
                </div>
            </div>
        )}

      </div>
    </DeviceLayout>
  );
};

export default EntryDetail;
