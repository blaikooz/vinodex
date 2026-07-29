import React from 'react';
import { Palette, BarChart3, Lock, Bug, Check } from 'lucide-react';
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
  onBack: () => void;
  onHome: () => void;
}> = ({ onSection, onBack, onHome }) => (
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

  const countIn = (category: string) => allEntries.filter(e => e.category === category).length;

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
          <Section title="DATABASE">
            <StatRow label="GRAPES" value={String(countIn('GRAPES'))} />
            <StatRow label="REGIONS" value={String(countIn('REGIONS'))} />
            <StatRow label="STYLES" value={String(countIn('STYLES'))} />
            <StatRow label="FLAVORS" value={String(countIn('FLAVORS'))} />
            <StatRow label="COUNTRIES" value={String(countIn('COUNTRY_GATE'))} />
            <StatRow label="CONTINENTS" value={String(countIn('CONTINENTS'))} />
            <StatRow label="TOTAL" value={String(allEntries.length)} />
            <StatRow label="CLIMATES" value={String(climates.size)} />
            <StatRow label="RARITY TIERS" value={String(rarities.size)} />
          </Section>
        );

      case 'ACCESS':
        return (
          <Section title="ACCESS">
            <p
              className="font-mono text-sm leading-relaxed normal-case px-3 py-4 rounded border-l-4"
              style={{
                color: 'var(--lcd-body-text)',
                borderColor: 'var(--lcd-accent)',
                backgroundColor: 'var(--lcd-surface)',
              }}
            >
              Everything is unlocked. The iOS build gates some entries behind
              purchase tiers; the web app has no tiers and no paywall, so there
              is nothing to unlock here.
            </p>
          </Section>
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
