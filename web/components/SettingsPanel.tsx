import React from 'react';
import { Palette, BarChart3, Lock, LockOpen, Bug, Check, Wrench, LogOut, Flag, SlidersHorizontal, Crown, Leaf, Sun, Moon, Grid3x3, Globe, Wine, Map as MapIcon, Layers, Vibrate, Volume2, ChevronRight, MemoryStick, Download, Upload, Mail, KeyRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DeviceLayout from './DeviceLayout';
import { WineEntry } from '@/shared/types';
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
import { removeEverything } from '../src/services/bookmarks';
import iconManifest from '../src/data/iconManifest.json';
import { isAppUnlocked, lockApp } from '../src/services/appUnlock';
import { useAppUnlock } from '../src/services/useAppUnlock';
import {
  SavedDataArchive,
  applyArchive,
  decodeArchive,
  encodeArchive,
  exportArchive,
  suggestedFilename,
} from '../src/services/savedDataArchive';

export type SettingsSectionId = 'CUSTOMIZE' | 'SETTINGS' | 'DATA' | 'ACCESS' | 'DEV';

/**
 * Full stored-data wipe behind the SETTINGS ▸ CLEAR SAVED DATA control, mirroring
 * iOS's reset: shelves + ratings (via the store's `removeEverything`, which also
 * notifies subscribers), then the remaining per-user keys — recents, quiz/streak
 * progress, name + photo, purchases, and the skin / screen / text preferences.
 * The encyclopedia itself is untouched. Reloads so every external store re-reads
 * from a clean slate.
 */
const WIPE_KEYS = [
  'recentlyViewedEntryIDs',
  'quizTierUnlocked',
  'dailyStreak',
  'dailyLastDay',
  'dailyBestStreak',
  'userDisplayName',
  'avatarImage',
  'grantedEntitlements',
  'starterOnly',
  'revealCursor',
  'chassisSkin',
  'lcdMode',
  'textScale',
  'uiScale',
];
function clearAllSavedData(): void {
  try {
    removeEverything();
    for (const k of WIPE_KEYS) window.localStorage.removeItem(k);
  } catch {
    /* ignore */
  }
  if (typeof window !== 'undefined') window.location.reload();
}

export const SETTINGS_SECTIONS: {
  id: SettingsSectionId;
  icon: React.ReactNode;
  tint: string;
  border: string;
  /** DEV is developer plumbing, not a setting — reached via a button, not a tile. */
  hidden?: boolean;
}[] = [
  { id: 'CUSTOMIZE', icon: <Palette size={30} />, tint: 'text-red-400', border: 'border-red-800' },
  { id: 'SETTINGS', icon: <SlidersHorizontal size={30} />, tint: 'text-orange-400', border: 'border-orange-800' },
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
  // The green TUTORIAL freed when the tour moved into SETTINGS (iOS 0.7.6 F1),
  // reassigned to FIRMWARE (0.8.92, item 2) — same slot, same livery.
  FIRMWARE: { dark: ['#22C55E', '#15803D', '#FFFFFF'], light: ['#15803D', '#0B4A24', '#FFFFFF'] },
  TOOLS: { dark: ['#FACC15', '#CA8A04', '#78350F'], light: ['#B45309', '#7A3606', '#FFFFFF'] },
  CUSTOMIZE: { dark: ['#EF4444', '#991B1B', '#FFFFFF'], light: ['#B91C1C', '#7A1010', '#FFFFFF'] },
  SETTINGS: { dark: ['#F97316', '#9A3412', '#FFFFFF'], light: ['#C2410C', '#7C2D12', '#FFFFFF'] },
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
        {/* A small palette emblem, tinted to the shell's own on-body ink (iOS draws the skin's emblem here). */}
        <span className="absolute inset-0 flex items-center justify-center">
          <Palette size={12} style={{ color: s.onBody, opacity: 0.85 }} />
        </span>
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
          {/* A representative emblem for the mode: sun for light screens, moon otherwise (iOS's SF Symbol on the preview). */}
          {m.isLight ? <Sun size={12} style={{ color: m.accent }} /> : <Moon size={12} style={{ color: m.accent }} />}
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
  onFirmware: () => void;
  onExitToSplash: () => void;
  onBack: () => void;
  onHome: () => void;
}> = ({ onSection, onMinigames, onFirmware, onExitToSplash, onBack, onHome }) => {
  const theme = useTheme();
  const isLight = LCD_MODES[theme.lcd].isLight;
  return (
  <DeviceLayout title="SYSTEM" subtitle="" showBack={true} onBack={onBack} onHome={onHome} centerHeaderText={true}>
    <div
      className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3"
      style={{ backgroundColor: 'var(--lcd-page)' }}
    >
      {/* Filled colour faces in iOS 0.8.92 order: TOOLS, then CUSTOMIZE /
          SETTINGS / DATA / ACCESS, with FIRMWARE closing the last pair
          (v6#9). TUTORIAL's tile moved into SETTINGS, as on iOS (0.7.6, F1).
          DEV is a button below, not a peer tile. */}
      <div className="grid grid-cols-2 gap-3">
        <FeatureTile title="TOOLS" icon={<Wrench size={30} />} onClick={onMinigames} isLight={isLight} />
        {SETTINGS_SECTIONS.filter(s => !s.hidden).map(s => (
          <FeatureTile key={s.id} title={s.id} icon={s.icon} onClick={() => onSection(s.id)} isLight={isLight} />
        ))}
        <FeatureTile title="FIRMWARE" icon={<MemoryStick size={30} />} onClick={onFirmware} isLight={isLight} />
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
/** A labelled switch with a leading glyph, matching iOS `settingRow` (HAPTICS/SOUNDS). */
const IconToggleRow: React.FC<{ icon: React.ReactNode; title: string; detail: string; on: boolean; onToggle: () => void }> = ({
  icon,
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
    <span className="shrink-0" style={{ color: on ? '#22c55e' : 'var(--lcd-subtext)' }}>{icon}</span>
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

// Glyph + tint per database table, reusing the main-menu symbols so a count
// reads as the same thing as the tile that opens it (iOS `statGlyph`).
const STAT_GLYPH: Record<string, { icon: React.ReactNode; tint: string }> = {
  GRAPES: { icon: <Grid3x3 size={20} />, tint: '#a855f7' },
  REGIONS: { icon: <Globe size={20} />, tint: '#22c55e' },
  STYLES: { icon: <Wine size={20} />, tint: '#f97316' },
  FLAVORS: { icon: <Leaf size={20} />, tint: '#10b981' },
  CONTINENTS: { icon: <MapIcon size={20} />, tint: '#3b82f6' },
  COUNTRIES: { icon: <Flag size={20} />, tint: '#eab308' },
};
const statGlyph = (label: string) => STAT_GLYPH[label] ?? STAT_GLYPH.COUNTRIES!;

// Per-bundle glyph for the ACCESS panel (iOS `bundleSymbol`).
const bundleSymbol = (kind: string): React.ReactNode => {
  switch (kind) {
    case 'pro': return <Crown size={20} />;
    case 'flavors': return <Leaf size={20} />;
    case 'country': return <Flag size={20} />;
    case 'skins': return <Palette size={20} />;
    case 'lightMode': return <Sun size={20} />;
    default: return <Lock size={20} />;
  }
};

/** A DATABASE category tile: glyph + tint, count, label (iOS `statTile`). */
const StatTile: React.FC<{ label: string; count: number }> = ({ label, count }) => {
  const glyph = statGlyph(label);
  return (
    <div
      className="flex items-center gap-2.5 px-2.5 py-3 rounded border-2"
      style={{ backgroundColor: 'var(--lcd-surface)', borderColor: `${glyph.tint}73` }}
    >
      <span className="shrink-0 w-6 flex justify-center" style={{ color: glyph.tint }}>{glyph.icon}</span>
      <span className="flex flex-col min-w-0">
        <span className="font-retro text-sm" style={{ color: 'var(--lcd-text)' }}>{count}</span>
        <span className="font-mono text-xs truncate" style={{ color: 'var(--lcd-subtext)' }}>{label}</span>
      </span>
    </div>
  );
};

/** The DATA panel's GROWTH area chart — a left-to-right sweep over the running
 *  cumulative entry total, mirroring iOS `DataWave`. Milestones are the running
 *  totals as each table is added. */
const GrowthWave: React.FC<{ milestones: number[] }> = ({ milestones }) => {
  const w = 300;
  const h = 88;
  const pad = 4;
  const max = Math.max(1, ...milestones);
  const n = milestones.length;
  const pts = milestones.map((v, i) => {
    const x = n <= 1 ? w : pad + (i / (n - 1)) * (w - pad * 2);
    const y = h - pad - (v / max) * (h - pad * 2);
    return [x, y] as [number, number];
  });
  const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const first = pts[0]!;
  const last = pts[n - 1]!;
  const area = `${line} L${last[0].toFixed(1)},${h - pad} L${first[0].toFixed(1)},${h - pad} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full rounded border-2" preserveAspectRatio="none"
      style={{ backgroundColor: 'var(--lcd-surface)', borderColor: 'var(--lcd-surface-edge)', height: 96 }}>
      <path d={area} fill="var(--lcd-accent)" fillOpacity={0.22} />
      <path d={line} fill="none" stroke="var(--lcd-accent)" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={2.6} fill="var(--lcd-accent)" />
      ))}
    </svg>
  );
};

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

/** A DEV health-check row: a label, a short detail, and an OK / !! status
 *  (green / red), mirroring iOS's DEV health report. */
const HealthRow: React.FC<{ label: string; ok: boolean; detail: string }> = ({ label, ok, detail }) => (
  <div
    className="flex items-center justify-between px-3 py-2.5 rounded border-2 mb-2"
    style={{ backgroundColor: 'var(--lcd-surface)', borderColor: 'var(--lcd-surface-edge)' }}
  >
    <span className="font-retro text-[0.55rem] tracking-widest" style={{ color: 'var(--lcd-subtext)' }}>
      {label}
    </span>
    <span className="flex items-center gap-2">
      <span className="font-mono text-sm normal-case" style={{ color: 'var(--lcd-subtext)' }}>{detail}</span>
      <span className="font-retro text-[0.6rem] tracking-widest" style={{ color: ok ? '#22c55e' : '#ef4444' }}>
        {ok ? 'OK' : '!!'}
      </span>
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
  const navigate = useNavigate();
  const [sounds, setSounds] = React.useState(soundsEnabled());
  const [haptics, setHaptics] = React.useState(hapticsEnabled());
  const [confirmingWipe, setConfirmingWipe] = React.useState(false);
  const [offeringTour, setOfferingTour] = React.useState(false);
  const [pendingRestore, setPendingRestore] = React.useState<SavedDataArchive | null>(null);
  const [restoreError, setRestoreError] = React.useState<string | null>(null);

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

          </>
        );

      case 'SETTINGS':
        // Device behaviour rather than device looks (iOS split): text/UI size,
        // haptics + sounds as their own sections, the stored-data reset, and
        // the developer entry — kept out of the purely-cosmetic CUSTOMIZE panel.
        return (
          <>
            <Section title="TEXT SIZE">
              {(Object.keys(TEXT_SCALES) as TextScaleId[]).map(id => (
                <ChoiceRow
                  key={id}
                  label={TEXT_SCALES[id].displayName}
                  selected={theme.scale === id}
                  onClick={() => setTextScale(id)}
                />
              ))}
              <p className="font-mono text-sm leading-relaxed normal-case mt-1" style={{ color: 'var(--lcd-subtext)' }}>
                Applies everywhere. Capped so the retro face still fits its tiles.
              </p>
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
              <p className="font-mono text-sm leading-relaxed normal-case mt-1" style={{ color: 'var(--lcd-subtext)' }}>
                Buttons, wells and chassis chrome — the text keeps its own size above.
              </p>
            </Section>

            <Section title="HAPTICS">
              <IconToggleRow
                icon={<Vibrate size={20} />}
                title="HAPTICS"
                detail={haptics ? 'Every chassis button clicks in your hand.' : 'The buttons are silent to the hand.'}
                on={haptics}
                onToggle={() => { const next = !haptics; setHapticsEnabled(next); setHaptics(next); }}
              />
            </Section>

            <Section title="SOUNDS">
              <IconToggleRow
                icon={<Volume2 size={20} />}
                title="SOUNDS"
                detail={sounds ? 'Clicks, pings and stings from the SFX pack.' : 'The device is silent to the ear.'}
                on={sounds}
                onToggle={() => { const next = !sounds; setSoundsEnabled(next); setSounds(next); }}
              />
              <p className="font-mono text-sm leading-relaxed normal-case mt-1" style={{ color: 'var(--lcd-subtext)' }}>
                The ring/silent switch always wins — sounds never interrupt your music.
              </p>
            </Section>

            {/* SUPPORT above CHEAT CODES, as on iOS (0.8.91 F1): the door for
                "who do I tell" belongs above the console for the initiated. */}
            <Section title="SUPPORT">
              <button
                onClick={() => navigate('/support')}
                className="w-full flex items-center gap-3 px-3 py-3 rounded border-2 text-left transition-all active:translate-y-0.5"
                style={{ backgroundColor: 'var(--lcd-surface)', borderColor: 'var(--lcd-surface-edge)' }}
              >
                <span style={{ color: 'var(--lcd-subtext)' }}><Mail size={20} /></span>
                <span className="flex-1 min-w-0">
                  <span className="block font-retro text-[0.6rem] tracking-widest" style={{ color: 'var(--lcd-text)' }}>SUPPORT</span>
                  <span className="block font-mono text-sm normal-case mt-1" style={{ color: 'var(--lcd-subtext)' }}>
                    Something broken, or something it should do? Write in.
                  </span>
                </span>
                <ChevronRight size={16} style={{ color: 'var(--lcd-subtext)' }} />
              </button>
            </Section>

            <Section title="CHEAT CODES">
              <button
                onClick={() => navigate('/cheats')}
                className="w-full flex items-center gap-3 px-3 py-3 rounded border-2 text-left transition-all active:translate-y-0.5"
                style={{ backgroundColor: 'var(--lcd-surface)', borderColor: 'var(--lcd-surface-edge)' }}
              >
                <span style={{ color: 'var(--lcd-subtext)' }}><KeyRound size={20} /></span>
                <span className="flex-1 min-w-0">
                  <span className="block font-retro text-[0.6rem] tracking-widest" style={{ color: 'var(--lcd-text)' }}>CHEAT CODES</span>
                  <span className="block font-mono text-sm normal-case mt-1" style={{ color: 'var(--lcd-subtext)' }}>
                    Found, not listed. Type one and see.
                  </span>
                </span>
                <ChevronRight size={16} style={{ color: 'var(--lcd-subtext)' }} />
              </button>
            </Section>

            {/* The guided tour's door, moved here from its old grid tile —
                iOS 0.7.6 (F1): "three things the device can tell you or do",
                and a guided tour of the device belongs with them. */}
            <Section title="TUTORIAL">
              <button
                onClick={() => setOfferingTour(true)}
                className="w-full flex items-center gap-3 px-3 py-3 rounded border-2 text-left transition-all active:translate-y-0.5"
                style={{ backgroundColor: 'var(--lcd-surface)', borderColor: 'var(--lcd-surface-edge)' }}
              >
                <span style={{ color: 'var(--lcd-subtext)' }}><Flag size={20} /></span>
                <span className="flex-1 min-w-0">
                  <span className="block font-retro text-[0.6rem] tracking-widest" style={{ color: 'var(--lcd-text)' }}>TAKE THE TOUR</span>
                  <span className="block font-mono text-sm normal-case mt-1" style={{ color: 'var(--lcd-subtext)' }}>
                    A walk round the device — about a minute.
                  </span>
                </span>
                <ChevronRight size={16} style={{ color: 'var(--lcd-subtext)' }} />
              </button>
            </Section>

            <Section title="STORED DATA">
              {/* A copy of everything this device holds, as one file the user
                  owns (iOS SavedDataArchive, v6#31) — a backup, and a way to
                  move a shelf between browsers. */}
              <button
                onClick={() => {
                  const archive = exportArchive();
                  const blob = new Blob([encodeArchive(archive)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = suggestedFilename(archive);
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded border-2 text-left transition-all active:translate-y-0.5 mb-2"
                style={{ backgroundColor: 'var(--lcd-surface)', borderColor: 'var(--lcd-surface-edge)' }}
              >
                <span style={{ color: 'var(--lcd-subtext)' }}><Download size={20} /></span>
                <span className="flex-1 min-w-0">
                  <span className="block font-retro text-[0.6rem] tracking-widest" style={{ color: 'var(--lcd-text)' }}>EXPORT BACKUP</span>
                  <span className="block font-mono text-sm normal-case mt-1" style={{ color: 'var(--lcd-subtext)' }}>
                    Shelves, ratings, progress and settings as one file you own.
                  </span>
                </span>
              </button>
              <label
                className="w-full flex items-center gap-3 px-3 py-3 rounded border-2 text-left transition-all active:translate-y-0.5 mb-2 cursor-pointer"
                style={{ backgroundColor: 'var(--lcd-surface)', borderColor: 'var(--lcd-surface-edge)' }}
              >
                <span style={{ color: 'var(--lcd-subtext)' }}><Upload size={20} /></span>
                <span className="flex-1 min-w-0">
                  <span className="block font-retro text-[0.6rem] tracking-widest" style={{ color: 'var(--lcd-text)' }}>RESTORE BACKUP</span>
                  <span className="block font-mono text-sm normal-case mt-1" style={{ color: 'var(--lcd-subtext)' }}>
                    Replaces what is here with a backup file. Purchases never import.
                  </span>
                </span>
                <input
                  type="file"
                  accept="application/json,.json"
                  className="sr-only"
                  aria-label="Restore backup from file"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    e.target.value = '';
                    if (!file) return;
                    void file.text().then(text => {
                      const result = decodeArchive(text);
                      if (!result.ok) {
                        // A user who picked the wrong file should be told so.
                        setRestoreError(
                          result.refusal.kind === 'notOurArchive'
                            ? `Not a Vinodex backup${result.refusal.app ? ` — it says "${result.refusal.app}"` : ''}.`
                            : result.refusal.kind === 'unreadableFormat'
                              ? `Written by a newer build (format ${result.refusal.format}); this one cannot read it.`
                              : 'Not a readable backup file.',
                        );
                        return;
                      }
                      setPendingRestore(result.archive);
                    });
                  }}
                />
              </label>

              <button
                onClick={() => setConfirmingWipe(true)}
                className="w-full py-4 rounded border-2 font-retro text-[0.65rem] tracking-widest transition-colors"
                style={{ backgroundColor: 'var(--lcd-surface)', borderColor: 'rgba(239,68,68,0.55)', color: '#ef4444' }}
              >
                CLEAR SAVED DATA
              </button>
              <p className="font-mono text-sm leading-relaxed normal-case mt-2" style={{ color: 'var(--lcd-subtext)' }}>
                Erases bookmarks, tastings and ratings, quiz progress, the daily
                streak, name and photo, purchases, skin, screen and text settings.
                The encyclopedia itself is untouched.
              </p>
            </Section>

            <Section title="DEVELOPER">
              <button
                onClick={() => navigate('/settings/DEV')}
                className="w-full flex items-center gap-3 px-3 py-3 rounded border-2 text-left transition-all active:translate-y-0.5"
                style={{ backgroundColor: 'var(--lcd-surface)', borderColor: 'var(--lcd-surface-edge)' }}
              >
                <span style={{ color: 'var(--lcd-subtext)' }}><Bug size={20} /></span>
                <span className="flex-1 min-w-0">
                  <span className="block font-retro text-[0.6rem] tracking-widest" style={{ color: 'var(--lcd-text)' }}>DEV</span>
                  <span className="block font-mono text-sm normal-case mt-1" style={{ color: 'var(--lcd-subtext)' }}>
                    Diagnostics, the component gallery and the icon sheet.
                  </span>
                </span>
                <ChevronRight size={16} style={{ color: 'var(--lcd-subtext)' }} />
              </button>
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
                className="flex items-center gap-3 px-3 py-4 rounded border-2"
                style={{ backgroundColor: 'var(--lcd-surface)', borderColor: 'var(--lcd-surface-edge)' }}
              >
                <span style={{ color: 'var(--lcd-accent)' }}><Layers size={26} /></span>
                <span className="font-retro text-2xl" style={{ color: 'var(--lcd-text)' }}>{allEntries.length}</span>
                <span className="flex-1" />
                <span className="font-mono text-sm" style={{ color: 'var(--lcd-subtext)' }}>
                  ACROSS {categoryLines.length} TABLES
                </span>
              </div>
            </Section>

            <Section title="GROWTH">
              <GrowthWave milestones={[0, 25, 186, 281, 342, allEntries.length]} />
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
              <IconToggleRow
                icon={locked ? <Lock size={20} /> : <LockOpen size={20} />}
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
                <IconToggleRow
                  key={entitlementId(e)}
                  icon={bundleSymbol(e.kind)}
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

      case 'DEV': {
        // Real, computable health checks mirroring iOS's DEV health report —
        // nothing fabricated: each row reflects the running app's state.
        const storageOk = typeof window !== 'undefined' && 'localStorage' in window;
        const entriesOk = allEntries.length > 0;
        const iconKeys = Object.keys(iconManifest.byEntry);
        const iconsOk = iconKeys.length > 0;
        const fontsStatus =
          typeof document !== 'undefined' && document.fonts ? document.fonts.status : 'OK';
        const fontsOk = fontsStatus === 'loaded' || fontsStatus === 'OK';
        return (
          <>
            <Section title="DIAGNOSTICS">
              <StatRow label="VERSION" value={APP_VERSION_DISPLAY} />
              <StatRow label="BUILD" value={BUILD_NUMBER} />
              <StatRow label="ENTRIES LOADED" value={String(allEntries.length)} />
              <StatRow label="SKIN" value={theme.skin} />
              <StatRow label="SCREEN" value={theme.lcd} />
              <StatRow label="TEXT" value={theme.scale} />
              <StatRow
                label="STORAGE"
                value={storageOk ? 'OK' : 'NONE'}
              />
            </Section>

            <Section title="HEALTH">
              <HealthRow label="STORAGE" ok={storageOk} detail={storageOk ? 'AVAILABLE' : 'NONE'} />
              <HealthRow label="ENTRIES" ok={entriesOk} detail={`${allEntries.length} LOADED`} />
              <HealthRow label="ICON MANIFEST" ok={iconsOk} detail={`${iconKeys.length} KEYS`} />
              <HealthRow label="FONTS" ok={fontsOk} detail={String(fontsStatus).toUpperCase()} />
            </Section>
          </>
        );
      }
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

      {/* CLEAR SAVED DATA asks first — the one control here that cannot be undone. */}
      {pendingRestore && (
        <div className="absolute inset-0 z-30 bg-black/80 flex items-center justify-center p-6">
          <div className="w-full max-w-xs bg-stone-900 border-2 border-yellow-700 rounded-lg p-5 flex flex-col gap-4 text-center">
            <p className="font-retro text-xs tracking-widest text-yellow-300">RESTORE THIS BACKUP?</p>
            <p className="font-mono text-sm text-stone-300 normal-case">
              From {pendingRestore.app} {pendingRestore.appVersion || '(unknown version)'} —
              {' '}{pendingRestore.triedShelf.length} tastings, {pendingRestore.savedShelf.length} saved.
              It replaces everything currently on this device.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setPendingRestore(null)}
                className="flex-1 font-retro text-[0.6rem] tracking-widest text-stone-300 border-2 border-stone-600 rounded py-3"
              >
                CANCEL
              </button>
              <button
                onClick={() => {
                  applyArchive(pendingRestore);
                  setPendingRestore(null);
                  // Reload so every external store re-reads from the restored state.
                  window.location.reload();
                }}
                className="flex-1 font-retro text-[0.6rem] tracking-widest text-black bg-yellow-400 border-2 border-yellow-600 rounded py-3"
              >
                RESTORE
              </button>
            </div>
          </div>
        </div>
      )}

      {restoreError && (
        <div className="absolute inset-0 z-30 bg-black/80 flex items-center justify-center p-6" role="alertdialog" aria-modal="true" aria-label="Restore failed">
          <div className="w-full max-w-xs bg-stone-900 border-2 border-red-700 rounded-lg p-5 flex flex-col gap-4 text-center">
            <p className="font-retro text-xs tracking-widest text-red-400">CAN'T RESTORE</p>
            <p className="font-mono text-sm text-stone-300 normal-case">{restoreError}</p>
            <button
              onClick={() => setRestoreError(null)}
              className="font-retro text-[0.6rem] tracking-widest text-stone-300 border-2 border-stone-600 rounded py-3"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {offeringTour && (
        <div className="absolute inset-0 z-30 bg-black/80 flex items-center justify-center p-6">
          <div className="w-full max-w-xs bg-stone-900 border-2 border-green-700 rounded-lg p-5 flex flex-col gap-4 text-center">
            <p className="font-retro text-xs tracking-widest text-green-300">TAKE THE TOUR?</p>
            <p className="font-mono text-sm text-stone-300 normal-case">
              A quick walk round the device — what each button does and where things live. About a minute, and you can leave at any point.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setOfferingTour(false)} className="flex-1 font-retro text-[0.6rem] tracking-widest text-stone-300 border-2 border-stone-600 rounded py-3">NOT NOW</button>
              <button onClick={() => { setOfferingTour(false); navigate('/walkthrough'); }} className="flex-1 font-retro text-[0.6rem] tracking-widest text-white bg-green-700 border-2 border-green-900 rounded py-3">YES</button>
            </div>
          </div>
        </div>
      )}

      {confirmingWipe && (
        <div className="absolute inset-0 z-30 bg-black/80 flex items-center justify-center p-6">
          <div className="w-full max-w-xs bg-stone-900 border-2 border-red-700 rounded-lg p-5 flex flex-col gap-4 text-center">
            <p className="font-retro text-xs tracking-widest text-red-400">CLEAR SAVED DATA?</p>
            <p className="font-mono text-sm text-stone-300 normal-case">
              This erases your bookmarks, tastings, ratings, quiz progress, streak,
              name and photo, purchases and appearance settings. It cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmingWipe(false)}
                className="flex-1 font-retro text-[0.6rem] tracking-widest text-stone-300 border-2 border-stone-600 rounded py-3"
              >
                CANCEL
              </button>
              <button
                onClick={() => { setConfirmingWipe(false); clearAllSavedData(); }}
                className="flex-1 font-retro text-[0.6rem] tracking-widest text-white bg-red-700 border-2 border-red-900 rounded py-3"
              >
                ERASE
              </button>
            </div>
          </div>
        </div>
      )}
    </DeviceLayout>
  );
};

export default SettingsGrid;
