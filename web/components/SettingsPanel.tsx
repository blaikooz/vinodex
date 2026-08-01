import React from 'react';
import { Palette, BarChart3, Lock, Bug, Check, Wrench, LogOut, Flag } from 'lucide-react';
import DeviceLayout from './DeviceLayout';
import { WineEntry, isGrapeEntry, isRegionEntry } from '@/shared/types';
import {
  CHASSIS_SKINS,
  ChassisSkinId,
  LCD_MODES,
  LcdModeId,
  TEXT_SCALES,
  TextScaleId,
  UI_SCALES,
  UiScaleId,
  setLcdMode,
  setSkin,
  setTextScale,
  setUiScale,
} from '../src/services/theme';
import { useTheme } from '../src/services/useTheme';
import { soundsEnabled, setSoundsEnabled } from '../src/services/sound';
import { hapticsEnabled, setHapticsEnabled } from '../src/services/haptics';
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

export type SettingsSectionId = 'CUSTOMIZE' | 'DATA' | 'ACCESS' | 'DEV';

export const SETTINGS_SECTIONS: {
  id: SettingsSectionId;
  icon: React.ReactNode;
  tint: string;
  border: string;
  /** DEV is developer plumbing, not a setting — reached via a button, not a tile. */
  hidden?: boolean;
}[] = [
  { id: 'CUSTOMIZE', icon: <Palette size={30} />, tint: 'text-red-400', border: 'border-red-800' },
  { id: 'DATA', icon: <BarChart3 size={30} />, tint: 'text-blue-400', border: 'border-blue-800' },
  { id: 'ACCESS', icon: <Lock size={30} />, tint: 'text-yellow-400', border: 'border-yellow-700' },
  { id: 'DEV', icon: <Bug size={30} />, tint: 'text-stone-400', border: 'border-stone-600', hidden: true },
];

/**
 * The settings grid, ported from
 * `vinodex-ios/Sources/VinodexUI/SettingsPanel.swift`.
 *
 * A grid of sections rather than one long scroll: the toggles had grown past a
 * screenful on iOS and the two anyone actually reaches for were below the
 * developer-facing ones. Each tile opens its own panel.
 */
// Filled tile faces per section, tuned for pale vs dark grounds — ported from
// SettingsPanel.swift's tileColors (v0.5.6: each tile unique again).
const TILE_FACE: Record<string, { dark: [string, string, string]; light: [string, string, string] }> = {
  TUTORIAL: { dark: ['#22C55E', '#15803D', '#FFFFFF'], light: ['#15803D', '#0B4A24', '#FFFFFF'] },
  TOOLS: { dark: ['#FACC15', '#CA8A04', '#78350F'], light: ['#B45309', '#7A3606', '#FFFFFF'] },
  CUSTOMIZE: { dark: ['#EF4444', '#991B1B', '#FFFFFF'], light: ['#B91C1C', '#7A1010', '#FFFFFF'] },
  DATA: { dark: ['#2AB5FF', '#136A99', '#FFFFFF'], light: ['#1D6FA8', '#11486E', '#FFFFFF'] },
  ACCESS: { dark: ['#A855F7', '#6B21A8', '#FFFFFF'], light: ['#7E22CE', '#4C1D95', '#FFFFFF'] },
};

/** A settings grid tile — a filled colour face with a 6px bottom extrusion, like the main menu. */
const FeatureTile: React.FC<{ title: string; icon: React.ReactNode; onClick: () => void; isLight: boolean }> = ({ title, icon, onClick, isLight }) => {
  const [face, shadow, ink] = (TILE_FACE[title] ?? TILE_FACE.DATA!)[isLight ? 'light' : 'dark'];
  return (
    <button
      onClick={onClick}
      className="aspect-square flex flex-col items-center justify-center gap-3 rounded-xl transition-all active:translate-y-1 active:border-b-0"
      style={{ backgroundColor: face, borderBottom: `6px solid ${shadow}`, color: ink }}
    >
      <span style={{ color: ink }}>{icon}</span>
      <span className="font-retro text-[0.55rem] sm:text-[0.65rem] tracking-widest text-center px-1" style={{ color: ink }}>{title}</span>
    </button>
  );
};

/** A mini-chassis preview: body over a dark base, status dots, a panel strip with a marquee bar. */
const SkinPreviewTile: React.FC<{ id: ChassisSkinId; selected: boolean; onClick: () => void }> = ({ id, selected, onClick }) => {
  const s = CHASSIS_SKINS[id];
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-2 rounded-lg transition-all active:scale-95"
      style={{ backgroundColor: selected ? 'var(--lcd-accent)' : 'var(--lcd-surface)' }}
    >
      <span className="w-full h-12 rounded-md relative overflow-hidden block" style={{ backgroundColor: '#1B1D21', border: `1px solid ${s.panelEdge}` }}>
        <span className="absolute inset-0" style={{ backgroundColor: s.body, backgroundImage: s.bodyPattern ? `url(/chassis/${s.bodyPattern}.png)` : undefined, backgroundSize: '40px' }} />
        <span className="absolute top-1 left-1 w-2 h-2 rounded-full" style={{ backgroundColor: s.grill }} />
        <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ backgroundColor: s.onBody }} />
        <span className="absolute bottom-0 inset-x-0 h-3.5 flex items-center justify-center" style={{ backgroundColor: s.panel }}>
          <span className="w-5 h-0.5 rounded-full" style={{ backgroundColor: s.onBody }} />
        </span>
        {selected && <Check size={12} className="absolute bottom-0.5 right-0.5" style={{ color: s.onBody }} />}
      </span>
      <span className="font-retro text-[0.45rem] leading-tight text-center h-6 flex items-center justify-center" style={{ color: selected ? 'var(--lcd-on-accent, #fff)' : 'var(--lcd-subtext)' }}>{s.displayName}</span>
    </button>
  );
};

/** A mini-LCD preview: the mode's screen with a glyph + two text bars, monochrome pass and all. */
const ModePreviewTile: React.FC<{ id: LcdModeId; selected: boolean; onClick: () => void }> = ({ id, selected, onClick }) => {
  const m = LCD_MODES[id];
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-2 rounded-lg transition-all active:scale-95"
      style={{ backgroundColor: selected ? 'var(--lcd-accent)' : 'var(--lcd-surface)' }}
    >
      <span className="w-full h-12 rounded-md relative overflow-hidden block" style={{ backgroundColor: m.screen, border: `1px solid ${m.surfaceEdge}`, isolation: 'isolate' }}>
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-1" style={{ filter: m.monochromeTint ? 'grayscale(1)' : undefined }}>
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.accent }} />
          <span className="w-8 h-[3px] rounded" style={{ backgroundColor: m.text, opacity: 0.85 }} />
          <span className="w-6 h-[3px] rounded" style={{ backgroundColor: m.subtext, opacity: 0.8 }} />
        </span>
        {m.monochromeTint && <span className="absolute inset-0" style={{ backgroundColor: m.monochromeTint, mixBlendMode: 'multiply' }} />}
      </span>
      <span className="font-retro text-[0.45rem] text-center" style={{ color: selected ? 'var(--lcd-on-accent, #fff)' : 'var(--lcd-subtext)' }}>{m.displayName}</span>
    </button>
  );
};

export const SettingsGrid: React.FC<{
  onSection: (id: SettingsSectionId) => void;
  onMinigames: () => void;
  onWalkthrough: () => void;
  onExitToSplash: () => void;
  onBack: () => void;
  onHome: () => void;
}> = ({ onSection, onMinigames, onWalkthrough, onExitToSplash, onBack, onHome }) => {
  const [offeringTour, setOfferingTour] = React.useState(false);
  const theme = useTheme();
  const isLight = LCD_MODES[theme.lcd].isLight;
  return (
  <DeviceLayout title="SYSTEM" subtitle="" showBack={true} onBack={onBack} onHome={onHome} centerHeaderText={true}>
    <div
      className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3"
      style={{ backgroundColor: 'var(--lcd-page)' }}
    >
      {/* Filled colour faces in iOS order: TUTORIAL, TOOLS, then CUSTOMIZE /
          DATA / ACCESS. DEV is a button below, not a peer tile. */}
      <div className="grid grid-cols-2 gap-3">
        <FeatureTile title="TUTORIAL" icon={<Flag size={30} />} onClick={() => setOfferingTour(true)} isLight={isLight} />
        <FeatureTile title="TOOLS" icon={<Wrench size={30} />} onClick={onMinigames} isLight={isLight} />
        {SETTINGS_SECTIONS.filter(s => !s.hidden).map(s => (
          <FeatureTile key={s.id} title={s.id} icon={s.icon} onClick={() => onSection(s.id)} isLight={isLight} />
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

      {/* Developer plumbing lives under settings, not as a peer tile. */}
      <button
        onClick={() => onSection('DEV')}
        className="w-full mt-2 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all active:translate-y-0.5"
        style={{ backgroundColor: 'var(--lcd-surface)', borderColor: 'var(--lcd-surface-edge)' }}
      >
        <Bug size={16} style={{ color: 'var(--lcd-subtext)' }} />
        <span className="font-retro text-[0.55rem] tracking-widest" style={{ color: 'var(--lcd-subtext)' }}>
          DEVELOPER
        </span>
      </button>

      {offeringTour && (
        <div className="absolute inset-0 z-30 bg-black/80 flex items-center justify-center p-6">
          <div className="w-full max-w-xs bg-stone-900 border-2 border-green-700 rounded-lg p-5 flex flex-col gap-4 text-center">
            <p className="font-retro text-xs tracking-widest text-green-300">TAKE THE TOUR?</p>
            <p className="font-mono text-sm text-stone-300 normal-case">
              A quick walk round the device — what each button does and where things live. About a minute, and you can leave at any point.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setOfferingTour(false)} className="flex-1 font-retro text-[0.6rem] tracking-widest text-stone-300 border-2 border-stone-600 rounded py-3">NOT NOW</button>
              <button onClick={() => { setOfferingTour(false); onWalkthrough(); }} className="flex-1 font-retro text-[0.6rem] tracking-widest text-white bg-green-700 border-2 border-green-900 rounded py-3">YES</button>
            </div>
          </div>
        </div>
      )}
    </div>
  </DeviceLayout>
  );
};

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
  const [sounds, setSounds] = React.useState(soundsEnabled());
  const [haptics, setHaptics] = React.useState(hapticsEnabled());

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
      case 'CUSTOMIZE':
        return (
          <>
            {/* Screen mode first, then skins — matching iOS's CUSTOMIZE order.
                Each is a 3-column grid of preview tiles: a mini-LCD in the
                mode's own colours (monochrome pass and all) and a mini-chassis
                in the skin's shell. */}
            <Section title="SCREEN MODE">
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(LCD_MODES) as LcdModeId[]).map(id => (
                  <ModePreviewTile key={id} id={id} selected={theme.lcd === id} onClick={() => setLcdMode(id)} />
                ))}
              </div>
            </Section>

            {/* "CHASSIS SKINS", not "SHELL SKINS" — the rest of the app calls this
                part of the device the chassis. */}
            <Section title="CHASSIS SKINS">
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(CHASSIS_SKINS) as ChassisSkinId[]).map(id => (
                  <SkinPreviewTile key={id} id={id} selected={theme.skin === id} onClick={() => setSkin(id)} />
                ))}
              </div>
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

            <Section title="UI SIZE">
              {(Object.keys(UI_SCALES) as UiScaleId[]).map(id => (
                <ChoiceRow
                  key={id}
                  label={UI_SCALES[id].displayName}
                  selected={theme.uiScale === id}
                  onClick={() => setUiScale(id)}
                />
              ))}
            </Section>

            <Section title="FEEDBACK">
              <ToggleRow
                title="SOUNDS"
                detail="Button clicks and quiz stings. Off by default."
                on={sounds}
                onToggle={() => { const next = !sounds; setSoundsEnabled(next); setSounds(next); }}
              />
              <ToggleRow
                title="HAPTICS"
                detail="A light tap on each press. Android only."
                on={haptics}
                onToggle={() => { const next = !haptics; setHapticsEnabled(next); setHaptics(next); }}
              />
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
