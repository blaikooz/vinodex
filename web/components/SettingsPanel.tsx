import React from 'react';
import { Palette, BarChart3, Lock, Bug, Check, Gamepad2, LogOut, Grip, Globe, Wine, Leaf, Map, Flag, Layers } from 'lucide-react';
import DataWave from './DataWave';
import DeviceLayout from './DeviceLayout';
import { WineEntry, isGrapeEntry, isRegionEntry } from '@/shared/types';
import {
  CHASSIS_SKINS,
  ChassisSkinId,
  LCD_MODES,
  LcdModeId,
  TEXT_SCALES,
  TextScaleId,
  setLcdMode,
  setSkin,
  setTextScale,
} from '../src/services/theme';
import { useTheme } from '../src/services/useTheme';
import { APP_VERSION_DISPLAY, BUILD_NUMBER } from '../src/services/appVersion';
import {
  TESTABLE_ENTITLEMENTS,
  browsableCount,
  entitlementBlurb,
  entitlementId,
  entitlementTitle,
  grantedIds,
  isGranted,
  revokeAll,
  setStarterOnly,
  starterOnly,
  toggleEntitlement,
} from '../src/services/access';
import { useAccess } from '../src/services/useAccess';
import { isAppUnlocked, lockApp } from '../src/services/appUnlock';
import { useAppUnlock } from '../src/services/useAppUnlock';

export type SettingsSectionId = 'CUSTOMIZATION' | 'DATA' | 'ACCESS' | 'DEV';

export const SETTINGS_SECTIONS: {
  id: SettingsSectionId;
  icon: React.ReactNode;
  tint: string;
  border: string;
}[] = [
  { id: 'CUSTOMIZATION', icon: <Palette size={30} />, tint: 'text-red-400', border: 'border-red-800' },
  { id: 'DATA', icon: <BarChart3 size={30} />, tint: 'text-blue-400', border: 'border-blue-800' },
  { id: 'ACCESS', icon: <Lock size={30} />, tint: 'text-yellow-400', border: 'border-yellow-700' },
  { id: 'DEV', icon: <Bug size={30} />, tint: 'text-stone-400', border: 'border-stone-600' },
];

/**
 * The settings grid, ported from
 * `vinodex-ios/Sources/VinodexUI/SettingsPanel.swift`.
 *
 * A grid of sections rather than one long scroll: the toggles had grown past a
 * screenful on iOS and the two anyone actually reaches for were below the
 * developer-facing ones. Each tile opens its own panel.
 */
export const SettingsGrid: React.FC<{
  onSection: (id: SettingsSectionId) => void;
  onMinigames: () => void;
  onExitToSplash: () => void;
  onBack: () => void;
  onHome: () => void;
}> = ({ onSection, onMinigames, onExitToSplash, onBack, onHome }) => (
  <DeviceLayout title="SYSTEM" subtitle="" showBack={true} onBack={onBack} onHome={onHome} centerHeaderText={true}>
    <div
      className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3"
      style={{ backgroundColor: 'var(--lcd-page)' }}
    >
      <div className="grid grid-cols-2 gap-3">
        {/*
          First, not last. Minigames is the only tile here anyone opens for
          fun — the other four are configuration and diagnostics — and burying
          it under them made the cog feel like a dead end.
        */}
        <button
          onClick={onMinigames}
          className="aspect-square flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-indigo-700 transition-all active:translate-y-0.5"
          style={{ backgroundColor: 'var(--lcd-surface)' }}
        >
          <span className="text-indigo-400"><Gamepad2 size={30} /></span>
          <span
            className="font-retro text-[0.55rem] sm:text-[0.65rem] tracking-widest text-center px-1"
            style={{ color: 'var(--lcd-text)' }}
          >
            MINIGAMES
          </span>
        </button>

        {SETTINGS_SECTIONS.map(s => (
          <button
            key={s.id}
            onClick={() => onSection(s.id)}
            className={`aspect-square flex flex-col items-center justify-center gap-3 rounded-xl border-2 ${s.border} transition-all active:translate-y-0.5`}
            style={{ backgroundColor: 'var(--lcd-surface)' }}
          >
            <span className={s.tint}>{s.icon}</span>
            <span
              className="font-retro text-[0.55rem] sm:text-[0.65rem] tracking-widest text-center px-1"
              style={{ color: 'var(--lcd-text)' }}
            >
              {s.id}
            </span>
          </button>
        ))}

      </div>

      {/*
        The way out of the app entirely, back to the DEX / WEBSITE fork. Home
        goes to the dex menu by design, so without this the splash was
        unreachable once you had entered — you had to edit the URL.
      */}
      <button
        onClick={onExitToSplash}
        className="w-full mt-3 flex items-center justify-center gap-2 py-4 rounded-xl border-2 transition-all active:translate-y-0.5"
        style={{ backgroundColor: 'var(--lcd-surface)', borderColor: 'var(--lcd-surface-edge)' }}
      >
        <LogOut size={18} style={{ color: 'var(--lcd-subtext)' }} />
        <span className="font-retro text-[0.6rem] tracking-widest" style={{ color: 'var(--lcd-text)' }}>
          EXIT TO SPLASH
        </span>
      </button>
    </div>
  </DeviceLayout>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-6">
    <div className="flex items-center gap-2 mb-3 pb-1 border-b-2" style={{ borderColor: 'var(--lcd-accent)' }}>
      <span className="font-retro text-[0.65rem] tracking-widest" style={{ color: 'var(--lcd-accent)' }}>
        {title}
      </span>
    </div>
    {children}
  </div>
);

/** A radio-style row: label on the left, tick when active. */
/**
 * Glyph and tint per table, from `statGlyph` in SettingsPanel.swift.
 *
 * The five categories reuse the main menu's own symbols and colours so a count
 * is recognisably the same thing as the tile that opens it; COUNTRIES is the odd
 * one out and gets a flag. The web previously drew a bare number with a caption
 * and no glyph at all.
 */
const STAT_GLYPHS: Record<string, { icon: React.ReactNode; tint: string }> = {
  GRAPES: { icon: <Grip size={20} />, tint: '#a855f7' },
  REGIONS: { icon: <Globe size={20} />, tint: '#22c55e' },
  STYLES: { icon: <Wine size={20} />, tint: '#f97316' },
  FLAVORS: { icon: <Leaf size={20} />, tint: '#10b981' },
  CONTINENTS: { icon: <Map size={20} />, tint: '#3b82f6' },
};

const DEFAULT_STAT_GLYPH = { icon: <Flag size={20} />, tint: '#eab308' };

/** Glyph left, count over label right — `statTile` on iOS. */
const StatTile: React.FC<{ label: string; count: number }> = ({ label, count }) => {
  const glyph = STAT_GLYPHS[label] ?? DEFAULT_STAT_GLYPH;
  return (
    <div
      className="flex items-center gap-2.5 rounded border-2 px-3 py-3"
      style={{ backgroundColor: 'var(--lcd-surface)', borderColor: 'var(--lcd-surface-edge)' }}
    >
      <span className="shrink-0 w-6 flex items-center justify-center" style={{ color: glyph.tint }}>
        {glyph.icon}
      </span>
      <span className="flex flex-col gap-0.5 min-w-0">
        <span className="font-retro text-[0.7rem]" style={{ color: 'var(--lcd-text)' }}>
          {count}
        </span>
        <span className="font-mono text-[0.65rem] truncate" style={{ color: 'var(--lcd-subtext)' }}>
          {label}
        </span>
      </span>
    </div>
  );
};

const ChoiceRow: React.FC<{
  label: string;
  selected: boolean;
  onClick: () => void;
  swatch?: string;
  /**
   * A chassis swatch: the moulding with the LCD panel below it, as the iOS skin
   * picker draws it — "body over panel, so the pair reads as the actual shell
   * rather than one flat swatch". A single `swatch` colour could not say which
   * of the five shells you were choosing once two of them were similar.
   */
  skinSwatch?: { body: string; panel: string; panelEdge: string };
}> = ({
  label,
  selected,
  onClick,
  swatch,
  skinSwatch,
}) => (
  /*
    The selected row is filled with the accent and its label switches to
    `--lcd-on-accent`, matching `SettingsSectionPanel` on iOS. The web used to
    keep every row on `--lcd-surface` and mark the selection with a border and a
    tick alone, which read as a much weaker "this one".

    `onAccent` is the audit's M44 fix and the reason it is a token rather than
    just `white`: dark mode's accent is mint, and white on it is about 1.8:1.
    Black on mint is ~12:1; light mode's deep green takes white.
  */
  <button
    onClick={onClick}
    aria-pressed={selected}
    className="w-full flex items-center gap-3 px-3 py-3 rounded border-2 transition-all active:translate-y-0.5 mb-2"
    style={{
      backgroundColor: selected ? 'var(--lcd-accent)' : 'var(--lcd-surface)',
      borderColor: selected ? 'var(--lcd-accent)' : 'var(--lcd-surface-edge)',
      color: selected ? 'var(--lcd-on-accent)' : 'var(--lcd-subtext)',
    }}
  >
    {skinSwatch ? (
      <span
        className="w-11 h-[34px] rounded shrink-0 overflow-hidden flex flex-col justify-end border"
        style={{ backgroundColor: skinSwatch.body, borderColor: skinSwatch.panelEdge }}
        aria-hidden="true"
      >
        <span className="h-3 w-full" style={{ backgroundColor: skinSwatch.panel }} />
      </span>
    ) : (
      swatch && (
        <span
          className="w-6 h-6 rounded border border-black/30 shrink-0"
          style={{ backgroundColor: swatch }}
          aria-hidden="true"
        />
      )
    )}
    <span className="font-retro text-[0.6rem] tracking-widest text-left flex-1">
      {label}
    </span>
    {selected && <Check size={18} />}
  </button>
);

/** A labelled switch, matching iOS `settingRow` + `DexToggle`. */
const ToggleRow: React.FC<{ title: string; detail: string; on: boolean; onToggle: () => void }> = ({
  title,
  detail,
  on,
  onToggle,
}) => (
  <button
    onClick={onToggle}
    role="switch"
    aria-checked={on}
    className="w-full flex items-center gap-3 px-3 py-3 rounded border-2 mb-2 text-left transition-all active:translate-y-0.5"
    style={{
      backgroundColor: 'var(--lcd-surface)',
      borderColor: on ? 'var(--lcd-accent)' : 'var(--lcd-surface-edge)',
    }}
  >
    <span className="flex-1 min-w-0">
      <span className="block font-retro text-[0.6rem] tracking-widest" style={{ color: 'var(--lcd-text)' }}>
        {title}
      </span>
      <span className="block font-mono text-sm normal-case mt-1" style={{ color: 'var(--lcd-subtext)' }}>
        {detail}
      </span>
    </span>
    <span
      className="w-11 h-6 rounded-full shrink-0 relative transition-colors"
      style={{ backgroundColor: on ? 'var(--lcd-accent)' : 'var(--lcd-surface-edge)' }}
      aria-hidden="true"
    >
      <span
        className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
        style={{ left: on ? '1.375rem' : '0.125rem' }}
      />
    </span>
  </button>
);

const StatRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div
    className="flex items-center justify-between px-3 py-2.5 rounded border-2 mb-2"
    style={{ backgroundColor: 'var(--lcd-surface)', borderColor: 'var(--lcd-surface-edge)' }}
  >
    <span className="font-retro text-[0.55rem] tracking-widest" style={{ color: 'var(--lcd-subtext)' }}>
      {label}
    </span>
    <span className="font-mono text-base font-bold" style={{ color: 'var(--lcd-text)' }}>
      {value}
    </span>
  </div>
);

export const SettingsSectionPanel: React.FC<{
  section: SettingsSectionId;
  allEntries: WineEntry[];
  onBack: () => void;
  onHome: () => void;
}> = ({ section, allEntries, onBack, onHome }) => {
  const theme = useTheme();

  useAccess();
  const locked = starterOnly();

  useAppUnlock();
  const vinodexUnlocked = isAppUnlocked('vinodex');

  const countIn = (category: string) => allEntries.filter(e => e.category === category).length;

  // Category tiles, in the order the iOS DATABASE block lists them.
  const categoryLines = [
    { label: 'GRAPES', count: countIn('GRAPES') },
    { label: 'REGIONS', count: countIn('REGIONS') },
    { label: 'STYLES', count: countIn('STYLES') },
    { label: 'FLAVORS', count: countIn('FLAVORS') },
    { label: 'COUNTRIES', count: countIn('COUNTRY_GATE') },
    { label: 'CONTINENTS', count: countIn('CONTINENTS') },
  ].filter(l => l.count > 0);

  const totalEntries = allEntries.length;

  /**
   * Milestones the DATA panel's wave sweeps through: empty, the original
   * starter selection, the first full import, and wherever the data stands now.
   * Fixed history plus a live tail, so the graph keeps meaning as the dataset
   * grows. Straight from `WineDatabase.waveMilestones`.
   */
  const waveMilestones = [0, 25, 186, totalEntries];

  const bag = (e: WineEntry) => e.details as { origin?: string; classification?: string };
  const origins = new Set(allEntries.flatMap(e => (bag(e).origin ? [bag(e).origin!] : [])));
  const systems = new Set(
    allEntries.flatMap(e => (bag(e).classification ? [bag(e).classification!] : [])),
  );

  // Counted as plain strings: the point is how many distinct values the data
  // carries, not which union member each one is.
  const climates = new Set(
    allEntries.filter(isRegionEntry).flatMap(e => (e.climate ? [String(e.climate)] : [])),
  );
  const rarities = new Set(
    allEntries.filter(isGrapeEntry).flatMap(e => (e.rarity ? [String(e.rarity)] : [])),
  );

  const body = () => {
    switch (section) {
      case 'CUSTOMIZATION':
        return (
          <>
            {/*
              Screen mode, text size, then the shell — the order `customization`
              lists them in on iOS. The web led with the skin picker, which put
              the cosmetic choice above the two that change legibility.
            */}
            <Section title="SCREEN MODE">
              {(Object.keys(LCD_MODES) as LcdModeId[]).map(id => (
                <ChoiceRow
                  key={id}
                  label={LCD_MODES[id].displayName}
                  swatch={LCD_MODES[id].screen}
                  selected={theme.lcd === id}
                  onClick={() => setLcdMode(id)}
                />
              ))}
            </Section>

            <Section title="TEXT SIZE">
              {(Object.keys(TEXT_SCALES) as TextScaleId[]).map(id => (
                <ChoiceRow
                  key={id}
                  label={TEXT_SCALES[id].displayName}
                  selected={theme.scale === id}
                  onClick={() => setTextScale(id)}
                />
              ))}
            </Section>

            {/* "CHASSIS SKIN", not "SHELL SKIN" — the rest of the app calls this
                part of the device the chassis. */}
            <Section title="CHASSIS SKIN">
              {(Object.keys(CHASSIS_SKINS) as ChassisSkinId[]).map(id => (
                <ChoiceRow
                  key={id}
                  label={CHASSIS_SKINS[id].displayName}
                  skinSwatch={{
                    body: CHASSIS_SKINS[id].body,
                    panel: CHASSIS_SKINS[id].panel,
                    panelEdge: CHASSIS_SKINS[id].panelEdge,
                  }}
                  selected={theme.skin === id}
                  onClick={() => setSkin(id)}
                />
              ))}
            </Section>
          </>
        );

      case 'DATA':
        return (
          <>
            {/* Glyph tiles rather than bare numbers — see STAT_GLYPHS. */}
            <Section title="DATABASE">
              <div className="grid grid-cols-2 gap-2">
                {categoryLines.map(line => (
                  <StatTile key={line.label} label={line.label} count={line.count} />
                ))}
              </div>
            </Section>

            {/* Glyph, count, then the table count pushed right — the iOS row. */}
            <Section title="TOTAL ENTRIES">
              <div
                className="flex items-center gap-3 rounded border px-3 py-3.5"
                style={{ backgroundColor: 'var(--lcd-surface)', borderColor: 'var(--lcd-surface-edge)' }}
              >
                <Layers size={26} style={{ color: 'var(--lcd-accent)' }} className="shrink-0" />
                <span className="font-retro text-xl" style={{ color: 'var(--lcd-text)' }}>
                  {totalEntries}
                </span>
                <span className="flex-1" />
                <span className="font-mono text-xs" style={{ color: 'var(--lcd-subtext)' }}>
                  ACROSS {categoryLines.length} TABLES
                </span>
              </div>
            </Section>

            {/*
              GROWTH — the sweep iOS draws here. The web had a static COVERAGE
              list in this slot and no graph at all; the list survives below,
              because those four counts are real data rather than decoration and
              iOS simply has no equivalent panel for them.
            */}
            <Section title="GROWTH">
              <div className="flex flex-col gap-2">
                <DataWave milestones={waveMilestones} />
                <p className="font-mono text-sm leading-relaxed normal-case" style={{ color: 'var(--lcd-subtext)' }}>
                  Entries shipped, from the first starter selection to the current
                  build.
                </p>
              </div>
            </Section>

            <Section title="COVERAGE">
              <StatRow label="CLIMATES" value={String(climates.size)} />
              <StatRow label="RARITY TIERS" value={String(rarities.size)} />
              <StatRow label="COUNTRIES OF ORIGIN" value={String(origins.size)} />
              <StatRow label="APPELLATION SYSTEMS" value={String(systems.size)} />
            </Section>

          </>
        );

      case 'ACCESS':
        return (
          <>
            {/*
              The website's app gate. It sat under DATA — reachable, but filed
              with the database readout rather than with the other things that
              decide what opens. ACCESS is the panel about being let in, so it
              belongs here even though it is a different mechanism from the
              paywall harness below: that models which bundles someone owns,
              this models whether the site hands the app over at all. They never
              consult each other — see `appUnlock`.
            */}
            <Section title="WEBSITE ACCESS">
              <StatRow label="VINODEX" value={vinodexUnlocked ? 'UNLOCKED' : 'LOCKED'} />
              {vinodexUnlocked && (
                <button
                  onClick={() => lockApp('vinodex')}
                  className="w-full mt-2 py-3 rounded border-2 border-red-800 font-retro text-[0.6rem] tracking-widest text-red-400 hover:bg-red-950 transition-colors"
                >
                  RE-LOCK VINODEX
                </button>
              )}
              <p className="font-mono text-sm leading-relaxed normal-case mt-2" style={{ color: 'var(--lcd-subtext)' }}>
                The code the website asks for before it hands over the app.
                Unlocking is remembered in this browser; re-locking asks again.
              </p>
            </Section>

            <Section title="FREE TIER">
              <ToggleRow
                title={locked ? 'FREE TIER' : 'EVERYTHING UNLOCKED'}
                detail={
                  locked
                    ? `${browsableCount(allEntries)} of ${allEntries.length} entries browsable`
                    : `All ${allEntries.length} entries browsable`
                }
                on={locked}
                onToggle={() => setStarterOnly(!locked)}
              />
              <p className="font-mono text-sm leading-relaxed normal-case mt-2" style={{ color: 'var(--lcd-subtext)' }}>
                Off means everything is open regardless of bundles — turn it on
                to test the locked experience. This is a test harness, not a
                paywall: nothing turns it on by itself.
              </p>
            </Section>

            <Section title="BUNDLES">
              {TESTABLE_ENTITLEMENTS.map(e => (
                <ToggleRow
                  key={entitlementId(e)}
                  title={entitlementTitle(e)}
                  detail={entitlementBlurb(e)}
                  on={isGranted(e)}
                  onToggle={() => toggleEntitlement(e)}
                />
              ))}

              {grantedIds().length > 0 && (
                <button
                  onClick={revokeAll}
                  className="w-full mt-2 py-3 rounded border-2 border-red-800 font-retro text-[0.6rem] tracking-widest text-red-400 hover:bg-red-950 transition-colors"
                >
                  REVOKE ALL PURCHASES
                </button>
              )}
            </Section>

            <p className="font-mono text-sm leading-relaxed normal-case" style={{ color: 'var(--lcd-subtext)' }}>
              iOS ships a free-tier manifest naming which entries are open
              without a purchase. This app ships none, so with the switch on an
              entry counts as browsable only if a bundle you hold covers it.
            </p>
          </>
        );

      case 'DEV':
        return (
          <Section title="DIAGNOSTICS">
            <StatRow label="VERSION" value={APP_VERSION_DISPLAY} />
            <StatRow label="BUILD" value={BUILD_NUMBER} />
            <StatRow label="ENTRIES LOADED" value={String(allEntries.length)} />
            <StatRow label="SKIN" value={theme.skin} />
            <StatRow label="SCREEN" value={theme.lcd} />
            <StatRow label="TEXT" value={theme.scale} />
            <StatRow
              label="STORAGE"
              value={typeof window !== 'undefined' && 'localStorage' in window ? 'OK' : 'NONE'}
            />
          </Section>
        );
    }
  };

  return (
    <DeviceLayout title={section} subtitle="" showBack={true} onBack={onBack} onHome={onHome} centerHeaderText={true}>
      <div
        className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4"
        style={{ backgroundColor: 'var(--lcd-page)' }}
      >
        {body()}
      </div>
    </DeviceLayout>
  );
};

export default SettingsGrid;
