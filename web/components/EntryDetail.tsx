import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MapPin, Activity, Droplet, Grape, Mountain, ChevronRight, List, Leaf, Flame, Shield, BookOpen, Bookmark, MapPinned, Wind, Star, Crown, PlusCircle, CheckCircle2, GitBranch, Share2 } from 'lucide-react';
import DeviceLayout from './DeviceLayout';
import { EntryCategory, WineEntry, isCountryGateEntry, isFlavorEntry, isGrapeEntry, isRegionEntry, isStyleEntry } from '@/shared/types';
import { CLIMATE_CLASS_MAP } from '@/shared/data/climateClasses';
import { HEADER_BORDER_CLASS, CONTAINER_SHADOW_CLASS, CONTAINER_SIZE_LIST, CONTAINER_BORDER_CLASS, CONTAINER_BORDER, ICON_SIZE_HEADER } from '../src/services/iconRendering';
import { createEntryVisualResolver, resolveEntryIconVisual } from '../src/services/entryIconVisuals';
import {
  categorizeFlavor,
  categorizeFlavorSubclass,
  findEntryByName,
  findRelatedEntry,
  getStyleClassType,
} from '@/shared/services/entryUtils';
import Chip from './Chip';
import { getFlavorClassChipColors, getFlavorSubclassChipColors, getRarityChipColors, SYSTEM_CHIP_COLOR, CLIMATE_CHIP_COLOR, APPELLATION_CHIP_COLORS } from '@/shared/services/chipColors';
import { getLucideIcon } from '../src/services/lucideIconMap';
import { getSoilIcon, getSoilsForRegion } from '../src/services/soilDisplay';
import { getStyleClassTileColors } from '../src/services/styleDisplay';
import { getClimateIcon } from '../src/services/climateDisplay';
import { shareEntry } from '../src/services/shareLink';
import { appellationName, extractTagAbbrev, hasAppellationName } from '../src/services/entryDisplay';
import { keyForDetail } from '../src/services/screenState';
import { useScreenAnchor } from '../src/services/useScreenAnchor';
import { isBookmarked, toggleBookmark, isOnShelf, toggleShelf, getRating, setRating, makeRating } from '../src/services/bookmarks';
import { useBookmarks } from '../src/services/useBookmarks';
import { recordRecentlyViewed } from '../src/services/recentlyViewed';
import { isTastable } from '../src/services/wineData';
import RatingPrompt from './RatingPrompt';
import StampUnlockedPrompt, { Celebration } from './StampUnlockedPrompt';
import { edgeCount, lineageIndexFor } from '../src/services/grapeLineage';
import { fireVino, setSuspended } from '../src/services/vinoPresenter';
import { reportCoachmark } from '../src/services/coachmarks';
import InsightSection from './InsightSection';
import { computePassport } from '../src/services/passport';
import { announceBadges, announceTier, seedIfNeeded } from '../src/services/passportProgress';
import { shelfIds } from '../src/services/bookmarks';
import { bestStreak } from '../src/services/dailyChallenge';
import { highestUnlocked } from '../src/services/quiz';
import { SectionHeader, LinkedListSection } from './EntryDetailSections';
import { GrapeHeaderTiles, RegionHeaderTiles, StyleHeaderTiles, FlavorHeaderTiles } from './EntryDetailHeaders';

type FilterMode = 'REGION' | 'TYPE' | 'TASTING' | 'SOIL' | 'ORIGIN' | 'RARITY' | 'SYSTEM' | 'CLIMATE' | null;

/**
 * The entry readout (stage 4, v0.4.3) — converted to the token language and
 * decomposed in the same pass (the W5 plan): the twenty-seven hand-rolled
 * ruled headers are `SectionHeader`, the linked lists are
 * `LinkedListSection` / `LinkedEntryTile`, and the four category header rows
 * live in `EntryDetailHeaders.tsx`. `EntryDetail.categories.test.tsx` pins
 * the ordered section list per category across the split.
 *
 * Conversion calls worth recording:
 * - The hero title moves from Press Start 2P with a hard 4px accent shadow to
 *   the sans display step, unshadowed. An entry name is the screen's title —
 *   reading text — and the hard offset shadow is the stroke the elevation
 *   system retired. The pixel face on this screen now belongs to nothing;
 *   the marquee below the LCD still carries it, which is its place.
 * - The ten inline `color: '#22c55e'` twins and the `#052e16/#15803d/#bbf7d0`
 *   pill triples — U8's sharpest leak, inline hex beating the cascade in
 *   every mode — are gone: accent token and `.dex-pill` respectively.
 * - Chip/tile DATA colours (country, climate, class, rarity, soil tables) are
 *   kept verbatim; they are catalogue vocabulary shared with iOS.
 * - Stars and rarity emblems move from yellow-400/#facc15 to the amber
 *   livery, which has an authored light-mode value; filled stars fill with
 *   `currentColor` so the fill and the stroke cannot disagree.
 */

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
  /** Opens the pedigree tree (v6#16); rendered only for connected grapes. */
  onLineage?: (entry: WineEntry) => void;
}

const EntryDetail: React.FC<EntryDetailProps> = ({ entry, allEntries, onBack, onHome, onSelectRelated, onFilterByType, onFilterByNote, onFilterBySoil, onFilterByOrigin, onViewStates, onLineage }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const entryVisualResolver = useMemo(() => createEntryVisualResolver({ entries: allEntries }), [allEntries]);
  // The pedigree gate + its teaser count (v6#16). Index built once per
  // catalog; the per-entry answer is a set lookup.
  const lineageIndex = lineageIndexFor(allEntries);
  const lineageEdges = useMemo(
    () => (isGrapeEntry(entry) && lineageIndex.hasLineage(entry.id) ? edgeCount(lineageIndex.relatives(entry.id)) : 0),
    [lineageIndex, entry],
  );

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
  const [shareMsg, setShareMsg] = useState<string | null>(null);

  /** Celebration queue (v6#17) — one card at a time, rating prompt after. */
  const [celebrations, setCelebrations] = useState<Celebration[]>([]);
  const [ratingAfterCelebrations, setRatingAfterCelebrations] = useState(false);

  // While a celebration or the rating prompt owns this screen, Professor
  // Vino holds his queue and the coachmark spotlight stands down — the
  // reasons-keyed seam from `vinoPresenter` (v6#26); each host clears only
  // its own claim.
  const modalUp = celebrations.length > 0 || showRating;
  useEffect(() => {
    setSuspended(modalUp, 'entryDetailPrompt');
    return () => setSuspended(false, 'entryDetailPrompt');
  }, [modalUp]);

  // Seed the announce ledgers on appear — always before this page's own
  // TRIED pill can be pressed, so an updated install never celebrates a
  // stamp the user earned weeks ago (iOS `seedIfNeeded`, thunked so the
  // passport is not computed once the flags are set).
  useEffect(() => {
    // Both thunks read the catalog-resolved passport (review M4): the rank
    // ladder counts `triedTotal`, never the raw shelf length — dead ids must
    // not inflate it.
    seedIfNeeded(
      () => computePassport(shelfIds('tried'), allEntries, bestStreak(), highestUnlocked()).badges,
      () => computePassport(shelfIds('tried'), allEntries, bestStreak(), highestUnlocked()).triedTotal,
    );
  }, [allEntries]);

  // Record this open in the recently-viewed trail. Keyed on entry.id, not [],
  // because following a cross-link swaps the entry without remounting the
  // screen — an empty-dep effect would credit only the first entry in a chain.
  useEffect(() => {
    recordRecentlyViewed(entry.id);
  }, [entry.id]);

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
  // The fallback border is the mode's accent, not a fixed dark green.
  const grapeFlavorNotes = (grapeCard?.tastingProfile || []).map(n => ({ note: n, icon: 'default' as const, color: 'var(--lcd-accent)' }));
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
        // The well behind a flavour glyph: the entry's own colour if it has
        // one (data), the mode's well if not.
        bgColor: relatedFlavor.color || 'var(--lcd-well)',
        label: relatedFlavor.name
      };
    }

    return {
      relatedFlavor,
      iconNode: buildIconNode('default', 'var(--lcd-subtext)', 18),
      borderColor: 'var(--surface-line-strong)',
      bgColor: 'var(--lcd-well)',
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

  const stateKey = keyForDetail(entry.id);
  const linkedListShared = {
    allEntries,
    resolver: entryVisualResolver,
    onSelect: onSelectRelated,
  };

  // The four category header rows, extracted to `EntryDetailHeaders.tsx`.
  // Countries draw no header row, exactly as before.
  const headerTiles = isCountry ? null
    : isGrapes ? <GrapeHeaderTiles entry={entry} onFilterByType={onFilterByType} onFilterByOrigin={onFilterByOrigin} />
    : isRegion ? (
        <RegionHeaderTiles
          entry={entry}
          allEntries={allEntries}
          resolver={entryVisualResolver}
          onSelectRelated={onSelectRelated}
          onFilterByOrigin={onFilterByOrigin}
          getRelatedEntry={getRelatedEntry}
        />
      )
    : isStyle ? <StyleHeaderTiles entry={entry} onFilterByType={onFilterByType} onFilterByNote={onFilterByNote} onFilterByOrigin={onFilterByOrigin} />
    : isFlavor ? <FlavorHeaderTiles entry={entry} onFilterByNote={onFilterByNote} />
    : null;

  {/* Alternate Names Section - Grapes */}
  const grapeAlsoKnownAs = isGrapes && grapeAlternateNames.length > 0 ? (
            <div className="mb-6">
                <SectionHeader icon={<BookOpen size={18} />} label="ALSO KNOWN AS" />
                <div className="flex flex-wrap gap-2">
                    {grapeAlternateNames.map((name, i) => (
                        <span key={i} className="dex-pill px-4 py-2 rounded font-sans text-body font-semibold tracking-wide">
                            {name}
                        </span>
                    ))}
                </div>
            </div>
  ) : null;

  {/* Rarity Section - Grapes */}
  const grapeRarity = isGrapes ? (
            <div className="mb-6">
                <SectionHeader icon={<Star size={24} />} label="RARITY" />
                <div className="flex items-center gap-2">
                  <span className="flex-1 flex items-center px-3 py-1.5 rounded-full border-2 font-sans text-body font-extrabold uppercase justify-between" style={{ letterSpacing: '0.1em', backgroundColor: rarityChipColors.bg, borderColor: rarityChipColors.border, color: rarityChipColors.text }}>
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
                              style={{ color: 'var(--livery-amber-deep)', filter: 'drop-shadow(0 0 4px color-mix(in srgb, var(--livery-amber-deep) 60%, transparent))' }}
                              fill="currentColor"
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
                              className="ml-1 text-[var(--livery-amber)]"
                              style={{ filter: 'drop-shadow(0 0 4px color-mix(in srgb, var(--livery-amber) 55%, transparent))' }}
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
                            className={`ml-0.5 ${i < filled ? 'text-[var(--livery-amber)]' : 'text-[var(--lcd-disabled-text)]'}`}
                            fill={i < filled ? 'currentColor' : 'none'}
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
                <SectionHeader icon={<Activity size={18} />} label="CHARACTERISTICS" gap="mb-2" />
                <div className="space-y-4 bg-[var(--surface-raised)] p-3 rounded-card border border-[var(--surface-line)]">
                    {([
                      // The bar hues move onto the livery table, which has an
                      // authored light-mode half; the assignment (body green,
                      // acid amber, tannin red...) is unchanged.
                      { label: 'BODY', value: grapeCard.characteristics.body, color: 'var(--livery-green)' },
                      { label: 'ACID', value: grapeCard.characteristics.acid, color: 'var(--livery-amber)' },
                      { label: 'TANNIN', value: grapeCard.characteristics.tannin, color: 'var(--livery-red)' },
                      { label: 'AROMATICS', value: grapeCard.characteristics.aromatics, color: 'var(--livery-violet)' },
                      { label: 'COLOR', value: grapeCard.characteristics.colorIntensity, color: 'var(--livery-orange)' },
                    ]).map(stat => (
                      <div className="flex items-center gap-3" key={stat.label}>
                          <span className="w-24 font-sans text-label dex-text tracking-widest shrink-0">{stat.label}</span>
                          <div className="flex-1 h-2 bg-[var(--surface-high)] flex gap-0.5 rounded-sm overflow-hidden">
                              {Array.from({ length: 5 }).map((_, i) => (
                                  <div key={i} className="flex-1 transition-all" style={{ backgroundColor: i < stat.value ? stat.color : 'transparent' }}></div>
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
                <SectionHeader icon={<Shield size={18} />} label="APPELLATION SYSTEM" gap="mb-2" />
                {/*
                  The abbreviation in the chip, the spelled-out name beside it,
                  the state at the end — matching `systemSection` in
                  EntryDetailScreen.swift. The web printed the abbreviation
                  alone, so "AOC" arrived with nothing to say what it stands
                  for, and the only place the full name appeared was a country
                  page two taps away.

                  Straight from the Swift, on why the chip keeps the short form:
                  the chip used to carry the full name, which made it five words
                  wide and wrapped it to three lines — and it hid the
                  abbreviation the bottle label actually prints, which is the
                  thing worth recognising.
                */}
                <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
                    <span className="px-4 py-2 rounded font-sans text-body font-semibold tracking-wide shrink-0" style={{ backgroundColor: SYSTEM_CHIP_COLOR.bg, border: `1px solid ${SYSTEM_CHIP_COLOR.border}`, color: SYSTEM_CHIP_COLOR.text }}>
                      {extractTagAbbrev(entry.details.classification || '')}
                    </span>
                    {(() => {
                      const short = entry.details.classification || '';
                      const country = (entry.details as { origin?: string }).origin || '';
                      // Hidden rather than repeated when the system is unknown:
                      // `appellationName` passes its input through, so printing
                      // it unconditionally would render the chip's text twice.
                      if (!hasAppellationName(short, country)) return null;
                      return (
                        <span className="flex-1 min-w-0 self-center font-sans text-body text-[var(--lcd-subtext)] normal-case leading-snug">
                          {appellationName(short, country)}
                        </span>
                      );
                    })()}
                    {(entry.details as { state?: string }).state && (
                      <span className="self-center font-sans text-body dex-subtext tracking-widest shrink-0">
                        {((entry.details as { state?: string }).state || '').toUpperCase()}
                      </span>
                    )}
                </div>
            </div>
  ) : null;

  {/* Appellations Section - Regions with appellations */}
  const regionAppellations = isRegion && entry.details.appellations && entry.details.appellations.length > 0 ? (
            <div className="mb-6">
                <SectionHeader icon={<Shield size={18} />} label="APPELLATIONS" />
                <div className="grid grid-cols-2 gap-2">
                    {entry.details.appellations.map((appellation, i) => (
                        <div key={i} className="dex-pill px-4 py-2 rounded text-center font-sans text-body font-semibold tracking-wide">
                            {appellation}
                        </div>
                    ))}
                </div>
            </div>
  ) : null;

  {/* Notable Grapes Section - Regions. Kept as a silent slice(0, 8), exactly
      as authored — only the state/country lists carry the expander. */}
  const regionNotableGrapes = isRegion && listSectionData && listSectionData.length > 0 ? (
    <LinkedListSection
      icon={<List size={18} />}
      title="NOTABLE GRAPES"
      items={listSectionData}
      cap={8}
      {...linkedListShared}
    />
  ) : null;

  {/* Notable Regions Section - Grapes */}
  const grapeNotableRegions = isGrapes && listSectionData && listSectionData.length > 0 ? (
    <LinkedListSection
      icon={<MapPin size={18} />}
      title="NOTABLE REGIONS"
      items={listSectionData}
      cap={8}
      options={{ showRegionMetaTiles: true }}
      {...linkedListShared}
    />
  ) : null;

  {/* Climate Section - Regions */}
  const regionClimate = isRegion ? (
            <div className="mb-6">
                <SectionHeader icon={<Wind size={18} />} label="CLIMATE" gap="mb-2" />
                {/*
                  Icon then name, as `climateSection` has it. The web showed a
                  bare chip here and put the climate glyph only in the hero tile
                  row, so the section that is actually titled CLIMATE was the
                  one place without it.
                */}
                <div className="flex flex-wrap gap-2">
                    {(() => {
                      const sectionClimateColors = (entry.climate && CLIMATE_CLASS_MAP[entry.climate]?.colors) || CLIMATE_CHIP_COLOR;
                      // iOS wraps the climate icon + name together in the chip-
                      // coloured row, the glyph tinted with the border colour.
                      return (
                        <span className="inline-flex items-center gap-3 px-4 py-2 rounded font-sans text-body font-semibold tracking-wide" style={{ backgroundColor: sectionClimateColors.bg, border: `1px solid ${sectionClimateColors.border}`, color: sectionClimateColors.text }}>
                          {/* Parity chip (e32a82e) with master's shrink-0 kept: the glyph must not squash when the climate name is long. */}
                          <span className="shrink-0 inline-flex items-center" style={{ color: sectionClimateColors.border }}>
                            {getClimateIcon(entry.climate, 26)}
                          </span>
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
                 <SectionHeader icon={<Mountain size={18} />} label="SOIL COMPOSITION" />
                 <div className="grid grid-cols-3 gap-3 items-stretch">
                    {regionSoils.map((soil, i) => {
                        const { icon, color } = getSoilIcon(soil);
                        return (
                            <button
                                key={`${soil}-${i}`}
                                onClick={() => onFilterBySoil(soil)}
                                className="dex-pressable w-full flex flex-col items-center gap-3 p-3 bg-[var(--surface-raised)] border border-[var(--surface-line)] rounded-card hover:border-[var(--lcd-accent)] shadow-elev-1 group h-full"
                            >
                                <div
                                  className="w-12 h-12 rounded-lg flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform border-2"
                                  style={{ backgroundColor: 'var(--lcd-well)', borderColor: color }}
                                >
                                  <span style={{ color }}>
                                    {icon}
                                  </span>
                                </div>
                                <span className="font-sans text-caption dex-text uppercase text-center leading-tight">
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
                <SectionHeader icon={<Droplet size={18} />} label="FLAVOR PROFILE" />
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
                        className={`w-full rounded-card p-2 flex items-center gap-3 relative overflow-hidden min-h-[4.5rem] text-left border ${isMatched ? 'dex-pressable bg-[var(--surface-raised)] border-[var(--surface-line)] hover:border-[var(--lcd-accent)] shadow-elev-1 cursor-pointer' : 'bg-[var(--surface-raised)] border-[var(--surface-line)] opacity-70 cursor-default'}`}
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
                          <span className={`font-sans text-heading leading-tight tracking-tight whitespace-normal break-words ${isMatched ? 'dex-text' : 'dex-disabled'}`}>
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
        className="h-full overflow-y-auto custom-scrollbar p-4 font-sans pb-20 text-[15px] md:text-base"
        style={{ backgroundColor: 'var(--lcd-page)', color: 'var(--lcd-accent)' }}
      >

        {/* Header Area with Title - Updated for text wrapping */}
        {/* Hero panel: `lcd.heroWash` behind the title, a solid accent rule at
            the bottom. Both follow the screen mode now. */}
        <div
          className="w-full min-h-[6rem] dex-hero-rule mb-4 relative overflow-hidden flex items-center justify-center shrink-0 p-4"
          style={{ backgroundColor: 'var(--lcd-hero-wash)' }}
        >
             {/*
               The grid over the hero wash. `--lcd-hero-grid` rather than the
               fixed dark green iOS singled out as reading heavy on the light
               hero — light mode lifts it toward the paper. Every country, state and continent page renders through
               this component, so this is the web's whole equivalent of the four
               hero grids the Swift pass touched.
             */}
             <div className="absolute inset-0 grid grid-cols-8 grid-rows-4 opacity-20" aria-hidden="true">
                {Array.from({ length: 32 }).map((_, i) => (
                    <div
                      key={i}
                      className="border"
                      style={{ borderColor: 'color-mix(in srgb, var(--lcd-hero-grid) 50%, transparent)' }}
                    ></div>
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
                      className={`w-20 h-20 ${HEADER_BORDER_CLASS} border-2 ${isCountry || isState ? 'border-[var(--lcd-text)]' : 'border-black/30'} shadow-inner flex items-center justify-center mb-4 bg-[var(--lcd-well)]`}
                      style={headerVisual.style}
                    >
                      {headerVisual.iconNode}
                    </div>
                  );
                })()}
                {/*
                  The hero title, in the sans display step (stage 4). It was
                  Press Start 2P with a hard 4px accent offset shadow — the
                  loudest survivor of the old language. `lcd.text`, no shadow:
                  the wash and the rule carry the hero, the name just reads.
                */}
                <h1
                  className="font-sans text-display tracking-tight leading-tight break-words whitespace-normal uppercase w-full mt-4 mb-2"
                  style={{
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                    color: 'var(--lcd-text)',
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
                  const shelfClass = 'dex-pressable flex items-center gap-1.5 rounded-full px-4 py-2 border-2';
                  return (
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    onClick={() => toggleBookmark(entry.id)}
                    aria-pressed={saved}
                    className={shelfClass}
                    style={shelfStyle(saved)}
                  >
                    <Bookmark size={15} fill={saved ? 'currentColor' : 'none'} />
                    <span className="font-sans text-caption tracking-widest">{saved ? 'SAVED' : 'SAVE'}</span>
                  </button>

                  {tastable && (
                    <button
                      onClick={() => toggleShelf('wantToTry', entry.id)}
                      aria-pressed={want}
                      className={shelfClass}
                      style={shelfStyle(want)}
                    >
                      <PlusCircle size={15} fill={want ? 'currentColor' : 'none'} />
                      <span className="font-sans text-caption tracking-widest">{want ? 'WANTED' : 'WANT'}</span>
                    </button>
                  )}

                  {tastable && (
                    <button
                      data-coachmark="triedControl"
                      onClick={() => {
                        const nowTried = toggleShelf('tried', entry.id);
                        if (!nowTried) return;
                        // Announce at the moment the thing happens, never in
                        // a render (v6#17): stamps first, then a rank-up, one
                        // card at a time; the rating prompt waits its turn.
                        const passport = computePassport(shelfIds('tried'), allEntries, bestStreak(), highestUnlocked());
                        const queue: Celebration[] = announceBadges(passport.badges).map(b => ({ kind: 'stamp' as const, badge: b }));
                        const rankedUp = announceTier(passport.triedTotal);
                        if (rankedUp) queue.push({ kind: 'tier', tier: rankedUp });
                        // The professor's remarks (v6#26): the write is the
                        // trigger, and a stamp announced is his cue too.
                        fireVino('firstTried');
                        if (queue.some(c => c.kind === 'stamp')) fireVino('firstStamp');
                        // The spotlit step advances on the same write (v6#23).
                        reportCoachmark('markedTried');
                        if (queue.length > 0) {
                          setCelebrations(queue);
                          setRatingAfterCelebrations(true);
                        } else {
                          setShowRating(true);
                        }
                      }}
                      aria-pressed={tried}
                      className={shelfClass}
                      style={shelfStyle(tried)}
                    >
                      <CheckCircle2 size={15} fill={tried ? 'currentColor' : 'none'} />
                      <span className="font-sans text-caption tracking-widest">TRIED</span>
                    </button>
                  )}
                </div>
                  );
                })()}

                {/* Share — the web is the top of the funnel, so every entry is a
                    link you can send. Native share sheet on mobile, copy fallback. */}
                <div className="mt-3 flex items-center justify-center gap-2">
                  <button
                    onClick={async () => {
                      const r = await shareEntry(entry.id, entry.name);
                      if (r === 'shared') return;
                      setShareMsg(r === 'copied' ? 'LINK COPIED' : 'COULD NOT SHARE');
                      window.setTimeout(() => setShareMsg(null), 1800);
                    }}
                    className="dex-pressable flex items-center gap-1.5 rounded-full px-4 py-2 border-2"
                    style={{ backgroundColor: 'var(--lcd-well)', borderColor: 'var(--lcd-accent)', color: 'var(--lcd-accent)' }}
                    aria-label={`Share ${entry.name}`}
                  >
                    <Share2 size={15} />
                    <span className="font-sans text-caption tracking-widest">{shareMsg ?? 'SHARE'}</span>
                  </button>
                </div>

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
              <SectionHeader icon={<BookOpen size={18} />} label="INFO" gap="mb-2" />
              <div className="dex-info-rule dex-info-wash pl-4 py-3">
                  <p className="font-sans text-body leading-relaxed text-[var(--lcd-body-text)] break-words whitespace-normal normal-case">
                      {grapeCard?.info || entry.description}
                  </p>
              </div>
          </div>
        )}

        {/* INSIGHT — what the tried set says about this entry (v6#21 tail).
            iOS draws it after INFO and before MY TASTING; extracted per the
            god-file rule. */}
        <InsightSection entry={entry} allEntries={allEntries} />

        {/* MY RATING — dedicated body section for tastable entries you've tried
            (iOS EntryDetailScreen.myTasting): star header, five large stars,
            RATE/EDIT capsule, note below. */}
        {tastable && tried && (
          <div className="mb-6">
              <SectionHeader icon={<Star size={18} fill="currentColor" />} label="MY RATING" />
              <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 flex-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={26}
                        className={i < (rating?.rating ?? 0) ? 'text-[var(--livery-amber)]' : 'text-[var(--lcd-disabled-text)]'}
                        fill={i < (rating?.rating ?? 0) ? 'currentColor' : 'none'}
                      />
                    ))}
                  </span>
                  <button
                    onClick={() => setShowRating(true)}
                    className="dex-pressable flex items-center gap-1.5 rounded-full px-4 py-2 bg-[var(--surface-raised)] border-2 border-[var(--livery-amber)] text-[var(--livery-amber)]"
                    aria-label={rating ? 'Edit your rating' : 'Rate this entry'}
                  >
                    <PlusCircle size={14} />
                    <span className="font-sans text-caption tracking-widest">{rating ? 'EDIT' : 'RATE'}</span>
                  </button>
              </div>
              {rating?.note ? (
                <p className="mt-3 font-sans text-body text-[var(--lcd-text)] break-words whitespace-normal normal-case">{rating.note}</p>
              ) : null}
          </div>
        )}

        {/* LINEAGE — the pedigree door (v6#16). Only where there is a tree:
            iOS's gate is `hasLineage`, deliberately unaffected by
            `parentageUnknown` — a screen whose whole content is "there is no
            pedigree to draw" is not offered. */}
        {isGrapeEntry(entry) && onLineage && lineageEdges > 0 && (
          <div className="px-4 md:px-6 pb-2">
            <button
              onClick={() => onLineage(entry)}
              className="dex-pressable w-full flex items-center gap-3 rounded-card border border-[var(--surface-line-strong)] bg-[var(--surface-raised)] shadow-elev-1 px-4 py-3 hover:border-[var(--lcd-accent)]"
            >
              <GitBranch size={18} className="text-[var(--lcd-accent)] shrink-0" />
              <span className="flex-1 min-w-0 text-left">
                <span className="block font-sans text-label tracking-widest text-[var(--lcd-text)]">LINEAGE</span>
                <span className="block font-sans text-caption text-[var(--lcd-subtext)] normal-case mt-0.5">
                  {lineageEdges} recorded relative{lineageEdges === 1 ? '' : 's'} — the family tree.
                </span>
              </span>
              <ChevronRight size={16} className="text-[var(--lcd-subtext)] shrink-0" />
            </button>
          </div>
        )}

        {/* Search States Button - USA only */}
        {isCountry && entry.name === 'USA' && onViewStates && (
          <div className="mb-6">
            <SectionHeader icon={<MapPinned size={18} />} label="STATES" gap="mb-2" />
            <button
              onClick={onViewStates}
              className="dex-pressable w-full flex items-center justify-center gap-3 px-6 py-3 bg-[var(--surface-raised)] border border-[var(--surface-line)] hover:border-[var(--lcd-accent)] rounded-card shadow-elev-1 group"
            >
              <MapPinned size={20} className="text-[var(--lcd-accent)]" />
              <span className="font-sans text-label tracking-widest text-[var(--lcd-accent)]">SEARCH STATES</span>
            </button>
          </div>
        )}

        {/* Main Grapes Section - States */}
        {isState && entry.details.notableGrapes && entry.details.notableGrapes.length > 0 && (
          <LinkedListSection
            icon={<Leaf size={18} />}
            title="MAIN GRAPES"
            gap="mb-2"
            items={entry.details.notableGrapes}
            cap={3}
            expandKey={{ stateKey, flag: 'grapes' }}
            {...linkedListShared}
          />
        )}

        {/* Appellation Systems Section - States */}
        {isState && entry.tags && entry.tags.filter(t => t !== 'STATE').length > 0 && (
          <div className="mb-6">
            <SectionHeader icon={<Shield size={18} />} label="APPELLATION SYSTEMS" gap="mb-2" />
            <div className="flex flex-wrap gap-2">
              {entry.tags.filter(t => t !== 'STATE').map((system, idx) => {
                const c = APPELLATION_CHIP_COLORS[idx % 3]!;
                return (
                  <span key={idx} className="px-4 py-2 rounded font-sans text-body font-semibold tracking-wide" style={{ backgroundColor: c.bg, border: `1px solid ${c.border}`, color: c.text }}>
                    {extractTagAbbrev(system)}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Key Regions Section - States */}
        {isState && entry.details.keyRegions && entry.details.keyRegions.length > 0 && (
          <LinkedListSection
            icon={<MapPin size={18} />}
            title="KEY REGIONS"
            gap="mb-2"
            items={entry.details.keyRegions}
            cap={6}
            expandKey={{ stateKey, flag: 'regions' }}
            options={{ showRegionMetaTiles: true }}
            {...linkedListShared}
          />
        )}

        {/* Main Grapes Section - Countries */}
        {isCountry && entry.details.notableGrapes && entry.details.notableGrapes.length > 0 && (
          <LinkedListSection
            icon={<Leaf size={18} />}
            title="MAIN GRAPES"
            gap="mb-2"
            items={entry.details.notableGrapes}
            cap={3}
            expandKey={{ stateKey, flag: 'grapes' }}
            {...linkedListShared}
          />
        )}

        {/* System Section - Appellation Systems for Countries */}
        {isCountry && entry.tags && entry.tags.length > 0 && (
          <div className="mb-6">
              <SectionHeader icon={<Shield size={18} />} label="APPELLATION SYSTEMS" gap="mb-2" />
              <div className="flex flex-wrap gap-2">
                {entry.tags.filter(tag => tag !== 'COUNTRY').map((system, idx) => {
                  const c = APPELLATION_CHIP_COLORS[idx % 3]!;
                  return (
                    <span key={idx} className="px-4 py-2 rounded font-sans text-body font-semibold tracking-wide" style={{ backgroundColor: c.bg, border: `1px solid ${c.border}`, color: c.text }}>
                      {extractTagAbbrev(system)}
                    </span>
                  );
                })}
              </div>
          </div>
        )}

        {/* Key Regions Section - Countries with Regions */}
        {isCountry && entry.details.keyRegions && entry.details.keyRegions.length > 0 && (
          <LinkedListSection
            icon={<MapPin size={18} />}
            title="KEY REGIONS"
            gap="mb-2"
            items={entry.details.keyRegions}
            cap={6}
            expandKey={{ stateKey, flag: 'regions' }}
            options={{ showRegionMetaTiles: true }}
            {...linkedListShared}
          />
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
          <LinkedListSection
            icon={<List size={18} />}
            title={listSectionTitle}
            items={listSectionData}
            options={{ preferCountryGate: true }}
            {...linkedListShared}
          />
        )}

        {/* Method Class: Key Grapes */}
        {isStyle && isMethodClass && entry.details.notableGrapes && entry.details.notableGrapes.length > 0 && (
          <LinkedListSection
            icon={<Grape size={18} />}
            title="KEY GRAPES"
            items={entry.details.notableGrapes}
            cap={3}
            expandKey={{ stateKey, flag: 'grapes' }}
            {...linkedListShared}
          />
        )}

        {/* Notable Grapes Section - For Styles (Style class) */}
        {isStyle && isStyleClassType && styleGrapes.length > 0 && (
          <LinkedListSection
            icon={<Grape size={18} />}
            title="NOTABLE GRAPES"
            items={styleGrapes}
            cap={3}
            expandKey={{ stateKey, flag: 'stylegrapes' }}
            {...linkedListShared}
          />
        )}

        {/* Notable Grapes Section - TYPE-class styles (iOS parity) */}
        {isStyle && styleClassType === 'TYPE' && styleGrapes.length > 0 && (
          <LinkedListSection
            icon={<Grape size={18} />}
            title="NOTABLE GRAPES"
            items={styleGrapes}
            cap={3}
            expandKey={{ stateKey, flag: 'stylegrapes' }}
            {...linkedListShared}
          />
        )}

        {/* Flavor entries: notable grapes */}
        {isFlavor && entry.details.notableGrapes && entry.details.notableGrapes.length > 0 && (
          <LinkedListSection
            icon={<Grape size={18} />}
            title="NOTABLE GRAPES"
            items={entry.details.notableGrapes}
            cap={8}
            expandKey={{ stateKey, flag: 'grapes' }}
            {...linkedListShared}
          />
        )}

        {/* Origin Class: Notable Grapes */}
        {isStyle && isOriginClass && entry.details.notableGrapes && entry.details.notableGrapes.length > 0 && (
          <LinkedListSection
            icon={<Grape size={18} />}
            title="NOTABLE GRAPES"
            items={entry.details.notableGrapes}
            cap={3}
            expandKey={{ stateKey, flag: 'grapes' }}
            {...linkedListShared}
          />
        )}

        {isStyle && isOriginClass && entry.details.keyRegions && entry.details.keyRegions.length > 0 && (
          <LinkedListSection
            icon={<MapPin size={18} />}
            title="KEY REGIONS"
            items={entry.details.keyRegions}
            cap={3}
            expandKey={{ stateKey, flag: 'regions' }}
            options={{ showRegionMetaTiles: true }}
            {...linkedListShared}
          />
        )}

        {/* Key Regions for Styles (skip Origin class) */}
        {isStyle && !isOriginClass && entry.details.keyRegions && entry.details.keyRegions.length > 0 && (
          <LinkedListSection
            icon={<MapPin size={18} />}
            title="KEY REGIONS"
            items={entry.details.keyRegions}
            cap={3}
            expandKey={{ stateKey, flag: 'regions' }}
            options={{ showRegionMetaTiles: true }}
            {...linkedListShared}
          />
        )}

      </div>
      {celebrations[0] && (
        <StampUnlockedPrompt
          celebration={celebrations[0]}
          onDismiss={() => {
            const rest = celebrations.slice(1);
            setCelebrations(rest);
            if (rest.length === 0 && ratingAfterCelebrations) {
              setRatingAfterCelebrations(false);
              setShowRating(true);
            }
          }}
        />
      )}
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
