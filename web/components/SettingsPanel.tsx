import React from 'react';
import { Palette, BarChart3, Lock, Bug, Check, Gamepad2 } from 'lucide-react';
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
  onBack: () => void;
  onHome: () => void;
}> = ({ onSection, onMinigames, onBack, onHome }) => (
  <DeviceLayout title="SYSTEM" subtitle="" showBack={true} onBack={onBack} onHome={onHome} centerHeaderText={true}>
    <div
      className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3"
      style={{ backgroundColor: 'var(--lcd-page)' }}
    >
      <div className="grid grid-cols-2 gap-3">
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

        {/*
          Minigames hangs off the settings grid, as on iOS — the cog is the
          only door to it. Removing the menu's spare circles left /minigames
          reachable only by typing the URL, which is not reachable at all.
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
      </div>
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
const ChoiceRow: React.FC<{ label: string; selected: boolean; onClick: () => void; swatch?: string }> = ({
  label,
  selected,
  onClick,
  swatch,
}) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-3 px-3 py-3 rounded border-2 transition-all active:translate-y-0.5 mb-2"
    style={{
      backgroundColor: 'var(--lcd-surface)',
      borderColor: selected ? 'var(--lcd-accent)' : 'var(--lcd-surface-edge)',
    }}
  >
    {swatch && (
      <span
        className="w-6 h-6 rounded border border-black/30 shrink-0"
        style={{ backgroundColor: swatch }}
        aria-hidden="true"
      />
    )}
    <span className="font-retro text-[0.6rem] tracking-widest text-left flex-1" style={{ color: 'var(--lcd-text)' }}>
      {label}
    </span>
    {selected && <Check size={18} style={{ color: 'var(--lcd-accent)' }} />}
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

/** A big single number, as the iOS TOTAL ENTRIES block renders it. */
const BigStat: React.FC<{ value: string; caption: string }> = ({ value, caption }) => (
  <div
    className="flex flex-col items-center py-5 rounded border-2 mb-2"
    style={{ backgroundColor: 'var(--lcd-surface)', borderColor: 'var(--lcd-surface-edge)' }}
  >
    <span className="font-retro text-3xl" style={{ color: 'var(--lcd-accent)' }}>{value}</span>
    <span className="font-retro text-[0.55rem] tracking-widest mt-2" style={{ color: 'var(--lcd-subtext)' }}>
      {caption}
    </span>
  </div>
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
            {/* "CHASSIS SKIN", not "SHELL SKIN" — the rest of the app calls this
                part of the device the chassis. */}
            <Section title="CHASSIS SKIN">
              {(Object.keys(CHASSIS_SKINS) as ChassisSkinId[]).map(id => (
                <ChoiceRow
                  key={id}
                  label={CHASSIS_SKINS[id].displayName}
                  swatch={CHASSIS_SKINS[id].body}
                  selected={theme.skin === id}
                  onClick={() => setSkin(id)}
                />
              ))}
            </Section>

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
          </>
        );

      case 'DATA':
        return (
          <>
            <Section title="DATABASE">
              <div className="grid grid-cols-2 gap-2">
                {categoryLines.map(line => (
                  <div
                    key={line.label}
                    className="flex flex-col items-center py-4 rounded border-2"
                    style={{ backgroundColor: 'var(--lcd-surface)', borderColor: 'var(--lcd-surface-edge)' }}
                  >
                    <span className="font-mono text-2xl font-bold" style={{ color: 'var(--lcd-text)' }}>
                      {line.count}
                    </span>
                    <span
                      className="font-retro text-[0.5rem] tracking-widest mt-1.5 text-center px-1"
                      style={{ color: 'var(--lcd-subtext)' }}
                    >
                      {line.label}
                    </span>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="TOTAL ENTRIES">
              <BigStat value={String(allEntries.length)} caption={`ACROSS ${categoryLines.length} TABLES`} />
            </Section>

            <Section title="COVERAGE">
              <StatRow label="CLIMATES" value={String(climates.size)} />
              <StatRow label="RARITY TIERS" value={String(rarities.size)} />
              <StatRow label="COUNTRIES OF ORIGIN" value={String(origins.size)} />
              <StatRow label="APPELLATION SYSTEMS" value={String(systems.size)} />
              <p className="font-mono text-sm leading-relaxed normal-case mt-2" style={{ color: 'var(--lcd-subtext)' }}>
                Entries shipped, from the first starter selection to the current
                build.
              </p>
            </Section>
          </>
        );

      case 'ACCESS':
        return (
          <>
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
