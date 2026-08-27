import React from 'react';
import { Palette, Lock, LockOpen, Bug, Check, LogOut, Flag, Crown, Leaf, Sun, Moon, Grid3x3, Globe, Wine, Map as MapIcon, Layers, ChevronRight, Download, Upload, UserRound, Sparkle, Wrench } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DeviceLayout from './DeviceLayout';
// The section vocabulary moved out so `App.tsx` can import it without
// dragging this module into the entry bundle — see settingsSections.tsx.
import { SETTINGS_SECTIONS, SettingsSectionId } from '../src/services/settingsSections';

export type { SettingsSectionId };
export { SETTINGS_SECTIONS };
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
import {
  SavedDataArchive,
  applyArchive,
  decodeArchive,
  encodeArchive,
  exportArchive,
  suggestedFilename,
} from '../src/services/savedDataArchive';
import {
  FRESH_PROFILE_NAME,
  allSlots,
  loadProfile,
  profiles,
  saveProfile,
} from '../src/services/userProfiles';
import { DEMO_STOPS, demoCycleSeconds, startDemo } from '../src/services/demoMode';
import DexAlert from './DexAlert';
import { lineageIndexFor } from '../src/services/grapeLineage';
import { WEB_RELEASES } from '../src/services/webChangelog';
import { WIPE_KEYS } from '../src/services/storageKeys';
import IOSGridTile from './IOSGridTile';


/**
 * Full stored-data wipe behind SETTINGS ▸ CLEAR SAVED DATA, mirroring iOS's
 * `SavedDataReset.wipeAll()`.
 *
 * What goes and what stays is stated once, in `storageKeys.ts`, rather than
 * described here — a prose list beside a literal array is how the old one
 * came to claim a completeness it did not have. The encyclopedia itself is
 * untouched. Reloads so every external store re-reads from a clean slate.
 */
function clearAllSavedData(): void {
  try {
    // The shelves first, through the store: `removeEverything()` also
    // notifies subscribers, which the raw key loop below cannot do.
    removeEverything();
    // Then the registry (W25). This was a hand-kept literal array of 27 keys
    // and it had drifted the same way iOS's had before AUDIT M35 caught it —
    // most seriously, the five profile slots were on no list at all, so a
    // wipe left five complete snapshots of the erased device in localStorage
    // and the PROFILES panel went on offering to load them.
    //
    // `storageKeys.ts` is the single statement of what persists and what a
    // wipe does to it, and `storageKeys.test.ts` walks the source to prove
    // nothing is missing from it.
    for (const k of WIPE_KEYS) window.localStorage.removeItem(k);
  } catch {
    /* ignore */
  }
  if (typeof window !== 'undefined') window.location.reload();
}



/**
 * The settings grid, ported from
 * `vinodex-ios/Sources/VinodexUI/SettingsPanel.swift`.
 *
 * A grid of sections rather than one long scroll: the toggles had grown past a
 * screenful on iOS and the two anyone actually reaches for were below the
 * developer-facing ones. Each tile opens its own panel.
 */
// Filled tile faces per section, tuned for pale vs dark grounds — ported from
// iOS's `DexTileLivery` table (DexTheme.swift; AUDIT L33 hoisted the old
// per-screen tileColors into it). Ink is white on every livery in both modes
// — iOS 0.6.4 retired TOOLS's dark-amber ink, "the odd one out on the grid".
const TILE_FACE: Record<string, { dark: [string, string, string]; light: [string, string, string] }> = {
  // The green TUTORIAL freed when the tour moved into SETTINGS (iOS 0.7.6 F1),
  // reassigned to FIRMWARE (0.8.92, item 2) — same slot, same livery.
  FIRMWARE: { dark: ['#22C55E', '#15803D', '#FFFFFF'], light: ['#15803D', '#0B4A24', '#FFFFFF'] },
  TOOLS: { dark: ['#EAB308', '#A16207', '#FFFFFF'], light: ['#B45309', '#7A3606', '#FFFFFF'] },
  CUSTOMIZE: { dark: ['#EF4444', '#991B1B', '#FFFFFF'], light: ['#B91C1C', '#7A1010', '#FFFFFF'] },
  SETTINGS: { dark: ['#F97316', '#9A3412', '#FFFFFF'], light: ['#C2410C', '#7C2D12', '#FFFFFF'] },
  DATA: { dark: ['#2AB5FF', '#136A99', '#FFFFFF'], light: ['#1D6FA8', '#11486E', '#FFFFFF'] },
  SHOP: { dark: ['#A855F7', '#6B21A8', '#FFFFFF'], light: ['#7E22CE', '#4C1D95', '#FFFFFF'] },
};

/** A settings-grid tile backed by the same ButtonArt bitmap iOS renders. */
const FeatureTile: React.FC<{ title: string; art: string; onClick: () => void; isLight: boolean }> = ({ title, art, onClick, isLight }) => {
  const [face, shadow, ink] = (TILE_FACE[title] ?? TILE_FACE.DATA!)[isLight ? 'light' : 'dark'];
  return (
    <IOSGridTile
      title={title}
      onClick={onClick}
      face={face}
      shadow={shadow}
      ink={ink}
      artSrc={`/art/button/${art}.png`}
      artName={art}
    />
  );
};

/** A mini-chassis preview: body over a dark base, status dots, a panel strip with a marquee bar. */
/**
 * The drawn sticker each chassis skin wears, mirrored from iOS by the web art
 * leg (v6#2). Keyed by our skin id; a skin with no mirrored sticker is simply
 * absent and the tile falls back to the tinted emblem. ORANGE WINE and
 * CHRISTMAS are the two without one on either platform.
 */
const SKIN_STICKER: Partial<Record<ChassisSkinId, string>> = {
  CLASSIC: 'sticker-classic',
  MIDNIGHT: 'sticker-midnight',
  ORIGINAL: 'sticker-original',
  BURGUNDY: 'sticker-burgundy',
  RIESLING: 'sticker-riesling',
  VINHO_VERDE: 'sticker-vinho-verde',
  GLOUGLOU: 'sticker-glouglou',
  SMART_GRAPE: 'sticker-smart-grape',
  CHAMPAGNE: 'sticker-champagne',
  NOUVEAU: 'sticker-nouveau',
  OAKED: 'sticker-oaked',
  NOCTURNE: 'sticker-nocturne',
  STEEL: 'sticker-steel',
  BLUSH: 'sticker-blush',
  PSVINO: 'sticker-psvino',
  GRIS_DE_GRIS: 'sticker-gris-de-gris',
  PET_NAT: 'sticker-pet-nat',
  WALDGLAS: 'sticker-waldglas',
  HALLOWEEN: 'sticker-halloween',
  W64: 'sticker-w64',
};

const SkinPreviewTile: React.FC<{ id: ChassisSkinId; selected: boolean; onClick: () => void }> = ({ id, selected, onClick }) => {
  const s = CHASSIS_SKINS[id];
  return (
    <button
      onClick={onClick}
      className="dex-pressable flex flex-col items-center gap-2 p-2 rounded-control"
      style={{ backgroundColor: selected ? 'var(--lcd-accent)' : 'var(--lcd-surface)' }}
    >
      <span className="w-full h-12 rounded-md relative overflow-hidden block" style={{ backgroundColor: '#1B1D21', border: `1px solid ${s.panelEdge}` }}>
        <span className="absolute inset-0" style={{ backgroundColor: s.body, backgroundImage: s.bodyPattern ? `url(/chassis/${s.bodyPattern}.png)` : undefined, backgroundSize: '40px' }} />
        <span className="absolute top-1 left-1 w-2 h-2 rounded-full" style={{ backgroundColor: s.grill }} />
        <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ backgroundColor: s.onBody }} />
        {/* The skin's own drawn sticker, as iOS draws it (v6#37, art ruling
            v6#2). A shell whose sticker has not been mirrored keeps the
            tinted palette emblem rather than a hole. */}
        <span className="absolute inset-0 flex items-center justify-center">
          {SKIN_STICKER[id] ? (
            <img
              src={`/art/sticker/${SKIN_STICKER[id]}.png`}
              alt=""
              aria-hidden="true"
              draggable={false}
              style={{ height: 26, width: 'auto', objectFit: 'contain', imageRendering: 'pixelated' }}
            />
          ) : (
            <Palette size={12} style={{ color: s.onBody, opacity: 0.85 }} />
          )}
        </span>
        <span className="absolute bottom-0 inset-x-0 h-3.5 flex items-center justify-center" style={{ backgroundColor: s.panel }}>
          <span className="w-5 h-0.5 rounded-full" style={{ backgroundColor: s.onBody }} />
        </span>
        {selected && <Check size={12} className="absolute bottom-0.5 right-0.5" style={{ color: s.onBody }} />}
      </span>
      <span className="font-sans text-caption leading-tight text-center min-h-6 flex items-center justify-center" style={{ color: selected ? 'var(--lcd-on-accent)' : 'var(--lcd-subtext)' }}>{s.displayName}</span>
    </button>
  );
};

/** A mini-LCD preview: the mode's screen with a glyph + two text bars, monochrome pass and all. */
const ModePreviewTile: React.FC<{ id: LcdModeId; selected: boolean; onClick: () => void }> = ({ id, selected, onClick }) => {
  const m = LCD_MODES[id];
  return (
    <button
      onClick={onClick}
      className="dex-pressable flex flex-col items-center gap-2 p-2 rounded-control"
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
      <span className="font-sans text-caption text-center" style={{ color: selected ? 'var(--lcd-on-accent)' : 'var(--lcd-subtext)' }}>{m.displayName}</span>
    </button>
  );
};

export const SettingsGrid: React.FC<{
  onSection: (id: SettingsSectionId) => void;
  onMinigames: () => void;
  onFirmware: () => void;
  onExitToSite: () => void;
  onBack: () => void;
  onHome: () => void;
}> = ({ onSection, onMinigames, onFirmware, onExitToSite, onBack, onHome }) => {
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
      <div className="ios-grid-shelf" data-ios-grid="system">
        <FeatureTile title="TOOLS" art="tools" onClick={onMinigames} isLight={isLight} />
        <FeatureTile title="CUSTOMIZE" art="customize" onClick={() => onSection('CUSTOMIZE')} isLight={isLight} />
        <FeatureTile title="SETTINGS" art="settings" onClick={() => onSection('SETTINGS')} isLight={isLight} />
        <FeatureTile title="DATA" art="data" onClick={() => onSection('DATA')} isLight={isLight} />
        {/* ACCESS is the persisted route id; SHOP is the public-facing iOS label. */}
        <FeatureTile title="SHOP" art="shop" onClick={() => onSection('ACCESS')} isLight={isLight} />
        <FeatureTile title="FIRMWARE" art="firmware" onClick={onFirmware} isLight={isLight} />
      </div>

      {/*
        The way out of the app entirely, back to the company site the app sits
        on top of (v8#9). Home goes to the dex menu by design, and Back only
        reaches the site from the menu itself, so this is the one control that
        closes the app from wherever you happen to be.
      */}
      <button
        onClick={onExitToSite}
        className="dex-pressable w-full mt-3 flex items-center justify-center gap-2 py-4 rounded-card border-2"
        style={{ backgroundColor: 'var(--lcd-surface)', borderColor: 'var(--lcd-surface-edge)' }}
      >
        <LogOut size={18} style={{ color: 'var(--lcd-subtext)' }} />
        <span className="font-sans text-label tracking-widest" style={{ color: 'var(--lcd-text)' }}>
          EXIT TO SITE
        </span>
      </button>

    </div>
  </DeviceLayout>
  );
};

/* The settings family's ruled header. Deliberately keeps its full-strength
   accent rule against the readout's 40% `dex-section-rule` — the D9 question,
   answered by leaving both weights as authored: a settings panel is denser
   and its rule carries more of the wayfinding. The label converts to the sans
   label step and becomes a real heading. */
const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-6">
    <div className="flex items-center gap-2 mb-3 pb-1 border-b-2" style={{ borderColor: 'var(--lcd-accent)' }}>
      <h2 className="font-sans text-label uppercase tracking-widest" style={{ color: 'var(--lcd-accent)' }}>
        {title}
      </h2>
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
    className="dex-pressable w-full flex items-center gap-3 px-3 py-3 rounded-control border-2 mb-2"
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
    <span className="font-sans text-label tracking-widest text-left flex-1">
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
    className="dex-pressable w-full flex items-center gap-3 px-3 py-3 rounded-control border-2 mb-2 text-left"
    style={{
      backgroundColor: 'var(--lcd-surface)',
      borderColor: on ? 'var(--lcd-accent)' : 'var(--lcd-surface-edge)',
    }}
  >
    <span className="shrink-0" style={{ color: on ? 'var(--lcd-accent)' : 'var(--lcd-subtext)' }}>{icon}</span>
    <span className="flex-1 min-w-0">
      <span className="block font-sans text-label tracking-widest" style={{ color: 'var(--lcd-text)' }}>
        {title}
      </span>
      <span className="block font-sans text-caption normal-case mt-1" style={{ color: 'var(--lcd-subtext)' }}>
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

/** Canonical baked iOS art in the standard secondary-control well. */
const PixelControlGlyph: React.FC<{ family?: 'button' | 'glyph'; stem: string }> = ({ family = 'button', stem }) => (
  <img
    src={`/art/${family}/${family === 'glyph' ? `glyph-${stem}` : stem}.png`}
    alt=""
    aria-hidden="true"
    draggable={false}
    data-control-art={stem}
    className="w-7 h-7 object-contain"
    style={{ imageRendering: 'pixelated' }}
  />
);

// Glyph + tint per database table, reusing the main-menu symbols so a count
// reads as the same thing as the tile that opens it (iOS `statGlyph`).
// Tints move onto the livery table (stage 4): same hue-to-category assignment
// as the dial, now with the authored light-mode half for free.
const STAT_GLYPH: Record<string, { icon: React.ReactNode; tint: string }> = {
  GRAPES: { icon: <Grid3x3 size={20} />, tint: 'var(--livery-violet)' },
  REGIONS: { icon: <Globe size={20} />, tint: 'var(--livery-green)' },
  STYLES: { icon: <Wine size={20} />, tint: 'var(--livery-orange)' },
  FLAVORS: { icon: <Leaf size={20} />, tint: 'var(--livery-emerald)' },
  CONTINENTS: { icon: <MapIcon size={20} />, tint: 'var(--livery-sky)' },
  COUNTRIES: { icon: <Flag size={20} />, tint: 'var(--livery-amber)' },
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
    case 'workshop': return <Wrench size={20} />;
    default: return <Lock size={20} />;
  }
};

/** A DATABASE category tile: glyph + tint, count, label (iOS `statTile`). */
const StatTile: React.FC<{ label: string; count: number }> = ({ label, count }) => {
  const glyph = statGlyph(label);
  return (
    <div
      className="flex items-center gap-2.5 px-2.5 py-3 rounded-control border-2"
      // 45% is the old `73` alpha suffix, restated as a mix so it works on a
      // `var()` tint (a hex-suffix cannot be appended to a custom property).
      style={{ backgroundColor: 'var(--lcd-surface)', borderColor: `color-mix(in srgb, ${glyph.tint} 45%, transparent)` }}
    >
      <span className="shrink-0 w-6 flex justify-center" style={{ color: glyph.tint }}>{glyph.icon}</span>
      <span className="flex flex-col min-w-0">
        <span className="font-sans text-heading font-bold" style={{ color: 'var(--lcd-text)' }}>{count}</span>
        <span className="font-sans text-caption truncate" style={{ color: 'var(--lcd-subtext)' }}>{label}</span>
      </span>
    </div>
  );
};

/** The DATA panel's GROWTH area chart — a left-to-right sweep over the running
 *  cumulative entry total with a counter running up alongside it, mirroring iOS
 *  `DataWave`. Milestones are the running totals as each table is added.
 *
 *  This is the only implementation of that chart. A second one lived in a
 *  standalone `DataWave.tsx` that nothing rendered, and carried the only
 *  tests of it; W4 deleted the orphan and moved the coverage here, through
 *  the panel that draws it (`SettingsSectionPanel.test.tsx`). */
const GrowthWave: React.FC<{ milestones: number[] }> = ({ milestones }) => {
  const w = 300;
  const h = 88;
  const pad = 4;
  const max = Math.max(1, ...milestones);
  const n = milestones.length;
  const total = milestones[n - 1] ?? 0;
  const pts = milestones.map((v, i) => {
    const x = n <= 1 ? w : pad + (i / (n - 1)) * (w - pad * 2);
    const y = h - pad - (v / max) * (h - pad * 2);
    return [x, y] as [number, number];
  });
  const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const first = pts[0]!;
  const last = pts[n - 1]!;
  const area = `${line} L${last[0].toFixed(1)},${h - pad} L${first[0].toFixed(1)},${h - pad} Z`;

  // Sweep the line (0→1) and run the counter up over ~1.5s on mount; jump to the
  // end for reduced-motion. `pathLength="1"` normalises the dash units.
  const [t, setT] = React.useState(0);
  React.useEffect(() => {
    if (typeof window === 'undefined') { setT(1); return; }
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { setT(1); return; }
    let raf = 0;
    let start = 0;
    const dur = 1500;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min(1, (ts - start) / dur);
      setT(1 - Math.pow(1 - p, 3)); // easeOutCubic
      if (p < 1) raf = window.requestAnimationFrame(step);
    };
    raf = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full rounded border-2" preserveAspectRatio="none"
        style={{ backgroundColor: 'var(--lcd-surface)', borderColor: 'var(--lcd-surface-edge)', height: 96 }}>
        <path d={area} fill="var(--lcd-accent)" style={{ fillOpacity: 0.22 * t }} />
        <path
          d={line}
          fill="none"
          stroke="var(--lcd-accent)"
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
          pathLength={1}
          style={{ strokeDasharray: 1, strokeDashoffset: 1 - t }}
        />
        {pts.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={2.6} fill="var(--lcd-accent)" style={{ opacity: t >= (n <= 1 ? 1 : i / (n - 1)) ? 1 : 0 }} />
        ))}
      </svg>
      <span
        className="absolute top-1.5 left-2 font-sans text-title leading-none pointer-events-none"
        style={{ color: 'var(--lcd-accent)' }}
      >
        {Math.round(total * t)}
      </span>
    </div>
  );
};

const StatRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div
    className="flex items-center justify-between px-3 py-2.5 rounded border-2 mb-2"
    style={{ backgroundColor: 'var(--lcd-surface)', borderColor: 'var(--lcd-surface-edge)' }}
  >
    <span className="font-sans text-caption tracking-widest" style={{ color: 'var(--lcd-subtext)' }}>
      {label}
    </span>
    <span className="font-sans text-body font-bold" style={{ color: 'var(--lcd-text)' }}>
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
    <span className="font-sans text-caption tracking-widest" style={{ color: 'var(--lcd-subtext)' }}>
      {label}
    </span>
    <span className="flex items-center gap-2">
      <span className="font-sans text-caption normal-case" style={{ color: 'var(--lcd-subtext)' }}>{detail}</span>
      <span className="font-sans text-caption font-bold tracking-widest" style={{ color: ok ? 'var(--livery-green)' : 'var(--livery-red)' }}>
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
  const tourDialogRef = React.useRef<HTMLDivElement>(null);
  const tourYesRef = React.useRef<HTMLButtonElement>(null);
  const [pendingRestore, setPendingRestore] = React.useState<SavedDataArchive | null>(null);
  const [restoreError, setRestoreError] = React.useState<string | null>(null);
  /** A profile action waiting on its confirm. Every case is destructive.
   *  SAVE is always into a numbered slot — FRESH is a load-only row. */
  const [pendingProfile, setPendingProfile] = React.useState<
    { mode: 'save'; slot: number } | { mode: 'load'; slot: number | 'fresh' } | null
  >(null);
  // Read in an effect, not a `useState` initializer (review L5): `profiles()`
  // seeds HORIZON on first read, and a localStorage write + notify during
  // render is a side effect React may run twice.
  const [profileList, setProfileList] = React.useState<ReturnType<typeof profiles>>([]);
  React.useEffect(() => {
    setProfileList(profiles());
  }, []);
  // The exam bank is 283 KB and belongs to the exam's own chunk; the DEV row
  // fetches its count on demand rather than dragging the bank into /settings.
  const [examCount, setExamCount] = React.useState<number | null>(null);
  React.useEffect(() => {
    if (section !== 'DEV' || examCount !== null) return;
    void import('@/shared/data/exam').then(m => setExamCount(m.EXAM_QUESTIONS.length)).catch(() => setExamCount(0));
  }, [section, examCount]);

  React.useEffect(() => {
    if (!offeringTour) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    tourYesRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOfferingTour(false);
        return;
      }
      if (event.key !== 'Tab') return;
      const controls = [...(tourDialogRef.current?.querySelectorAll<HTMLElement>('button, [href], [tabindex]:not([tabindex="-1"])') ?? [])]
        .filter(control => !control.hasAttribute('disabled'));
      if (controls.length === 0) return;
      const first = controls[0]!;
      const last = controls[controls.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previous?.focus();
    };
  }, [offeringTour]);

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

  const body = () => {
    switch (section) {
      case 'CUSTOMIZE':
        return (
          <>
            {/* The workshop door (v0.5.0): parts, not presets. Above the two
                preset grids because a build you made is the more specific
                choice, exactly as iOS orders CUSTOMIZE. */}
            <Section title="WORKSHOP">
              <button
                onClick={() => navigate('/workshop')}
                className="dex-pressable w-full flex items-center gap-3 px-3 py-3 rounded-control border-2 text-left"
                style={{ backgroundColor: 'var(--lcd-surface)', borderColor: 'var(--lcd-surface-edge)' }}
              >
                <span style={{ color: 'var(--lcd-subtext)' }}><Wrench size={20} /></span>
                <span className="flex-1 min-w-0">
                  <span className="block font-sans text-label tracking-widest" style={{ color: 'var(--lcd-text)' }}>DEVICE WORKSHOP</span>
                  <span className="block font-sans text-caption normal-case mt-1" style={{ color: 'var(--lcd-subtext)' }}>
                    Build the device part by part — buttons, lamps, marquee, grille, font — and save it under a name.
                  </span>
                </span>
                <ChevronRight size={16} style={{ color: 'var(--lcd-subtext)' }} />
              </button>
            </Section>

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
              <p className="font-sans text-caption leading-relaxed normal-case mt-1" style={{ color: 'var(--lcd-subtext)' }}>
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
              <p className="font-sans text-caption leading-relaxed normal-case mt-1" style={{ color: 'var(--lcd-subtext)' }}>
                Buttons, wells and chassis chrome — the text keeps its own size above.
              </p>
            </Section>

            <Section title="HAPTICS">
              <IconToggleRow
                icon={<PixelControlGlyph stem="haptics" />}
                title="HAPTICS"
                detail={haptics ? 'Every chassis button clicks in your hand.' : 'The buttons are silent to the hand.'}
                on={haptics}
                onToggle={() => { const next = !haptics; setHapticsEnabled(next); setHaptics(next); }}
              />
            </Section>

            <Section title="SOUNDS">
              <IconToggleRow
                icon={<PixelControlGlyph family="glyph" stem={sounds ? 'sounds-on' : 'sounds-off'} />}
                title="SOUNDS"
                detail={sounds ? 'Clicks, pings and stings from the SFX pack.' : 'The device is silent to the ear.'}
                on={sounds}
                onToggle={() => { const next = !sounds; setSoundsEnabled(next); setSounds(next); }}
              />
              <p className="font-sans text-caption leading-relaxed normal-case mt-1" style={{ color: 'var(--lcd-subtext)' }}>
                The ring/silent switch always wins — sounds never interrupt your music.
              </p>
            </Section>
            <Section title="TUTORIAL">
              <button
                onClick={() => setOfferingTour(true)}
                className="dex-pressable w-full flex items-center gap-3 px-3 py-3 rounded-control border-2 text-left"
                style={{ backgroundColor: 'var(--lcd-surface)', borderColor: 'var(--lcd-surface-edge)' }}
              >
                <span><PixelControlGlyph stem="tutorial" /></span>
                <span className="flex-1 min-w-0">
                  <span className="block font-retro text-[0.6rem] tracking-widest" style={{ color: 'var(--lcd-text)' }}>TUTORIAL</span>
                  <span className="block font-mono text-sm normal-case mt-1" style={{ color: 'var(--lcd-subtext)' }}>
                    A guided walk round the device, then a run through your first tasting if you want one.
                  </span>
                </span>
                <ChevronRight size={16} style={{ color: 'var(--lcd-subtext)' }} />
              </button>
            </Section>


            {/* SUPPORT above CHEAT CODES, as on iOS (0.8.91 F1): the door for
                "who do I tell" belongs above the console for the initiated. */}
            <Section title="SUPPORT">
              <button
                onClick={() => navigate('/support')}
                className="dex-pressable w-full flex items-center gap-3 px-3 py-3 rounded-control border-2 text-left"
                style={{ backgroundColor: 'var(--lcd-surface)', borderColor: 'var(--lcd-surface-edge)' }}
              >
                <span><PixelControlGlyph family="glyph" stem="seal" /></span>
                <span className="flex-1 min-w-0">
                  <span className="block font-sans text-label tracking-widest" style={{ color: 'var(--lcd-text)' }}>SUPPORT</span>
                  <span className="block font-sans text-caption normal-case mt-1" style={{ color: 'var(--lcd-subtext)' }}>
                    Something broken, or something it should do? Write in.
                  </span>
                </span>
                <ChevronRight size={16} style={{ color: 'var(--lcd-subtext)' }} />
              </button>
            </Section>

            <Section title="CHEAT CODES">
              <button
                onClick={() => navigate('/cheats')}
                className="dex-pressable w-full flex items-center gap-3 px-3 py-3 rounded-control border-2 text-left"
                style={{ backgroundColor: 'var(--lcd-surface)', borderColor: 'var(--lcd-surface-edge)' }}
              >
                <span><PixelControlGlyph stem="cheatcodes" /></span>
                <span className="flex-1 min-w-0">
                  <span className="block font-sans text-label tracking-widest" style={{ color: 'var(--lcd-text)' }}>CHEAT CODES</span>
                  <span className="block font-sans text-caption normal-case mt-1" style={{ color: 'var(--lcd-subtext)' }}>
                    Found, not listed. Type one and see.
                  </span>
                </span>
                <ChevronRight size={16} style={{ color: 'var(--lcd-subtext)' }} />
              </button>
            </Section>

            <Section title="DEMO MODE">
              <button
                onClick={() => { startDemo(); }}
                className="dex-pressable w-full flex items-center gap-3 px-3 py-3 rounded-control border-2 text-left"
                style={{ backgroundColor: 'var(--lcd-surface)', borderColor: 'var(--lcd-surface-edge)' }}
              >
                <span><PixelControlGlyph stem="demomode" /></span>
                <span className="flex-1 min-w-0">
                  <span className="block font-sans text-label tracking-widest" style={{ color: 'var(--lcd-text)' }}>START DEMO</span>
                  <span className="block font-sans text-caption normal-case mt-1" style={{ color: 'var(--lcd-subtext)' }}>
                    The unattended tour — {DEMO_STOPS.length} stops, about {Math.round(demoCycleSeconds())}s a lap. Touch anything to take over.
                  </span>
                </span>
              </button>
            </Section>

            {/* Named snapshots of the whole saved state (iOS 0.8.92 item 5,
                v6#32). FRESH is a virtual row, not a slot — loading it is a
                fresh install, every time. */}
            <Section title="PROFILES">
              <div className="flex flex-col gap-2">
                {allSlots().map(slot => {
                  const p = profileList.find(x => x.slot === slot) ?? null;
                  return (
                    <div
                      key={slot}
                      className="flex items-center gap-3 px-3 py-2.5 rounded border-2"
                      style={{ backgroundColor: 'var(--lcd-surface)', borderColor: 'var(--lcd-surface-edge)' }}
                    >
                      <span style={{ color: 'var(--lcd-subtext)' }}><UserRound size={18} /></span>
                      <span className="flex-1 min-w-0">
                        <span className="block font-sans text-label tracking-widest truncate" style={{ color: p ? 'var(--lcd-text)' : 'var(--lcd-subtext)' }}>
                          {p ? p.name : `SLOT ${slot}`}
                        </span>
                        <span className="block font-sans text-caption normal-case mt-0.5" style={{ color: 'var(--lcd-subtext)' }}>
                          {p ? (p.savedAt ? new Date(p.savedAt).toLocaleDateString() : 'seeded — loads fresh') : 'empty'}
                        </span>
                      </span>
                      <button
                        onClick={() => setPendingProfile({ mode: 'save', slot })}
                        className="dex-pressable font-sans text-caption font-semibold tracking-widest px-2.5 py-2 rounded-control border-2"
                        style={{ borderColor: 'var(--lcd-surface-edge)', color: 'var(--lcd-text)' }}
                      >
                        SAVE
                      </button>
                      {p && (
                        <button
                          onClick={() => setPendingProfile({ mode: 'load', slot })}
                          className="dex-pressable font-sans text-caption font-semibold tracking-widest px-2.5 py-2 rounded-control border-2 border-[var(--livery-amber)] text-[var(--livery-amber)]"
                        >
                          LOAD
                        </button>
                      )}
                    </div>
                  );
                })}
                <button
                  onClick={() => setPendingProfile({ mode: 'load', slot: 'fresh' })}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded border-2 text-left"
                  style={{ backgroundColor: 'var(--lcd-surface)', borderColor: 'var(--lcd-surface-edge)' }}
                >
                  <span style={{ color: 'var(--lcd-subtext)' }}><Sparkle size={18} /></span>
                  <span className="flex-1 min-w-0">
                    <span className="block font-sans text-label tracking-widest" style={{ color: 'var(--lcd-text)' }}>{FRESH_PROFILE_NAME}</span>
                    <span className="block font-sans text-caption normal-case mt-0.5" style={{ color: 'var(--lcd-subtext)' }}>
                      A fresh install, every time. For walking the first run.
                    </span>
                  </span>
                </button>
              </div>
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
                className="dex-pressable w-full flex items-center gap-3 px-3 py-3 rounded-control border-2 text-left mb-2"
                style={{ backgroundColor: 'var(--lcd-surface)', borderColor: 'var(--lcd-surface-edge)' }}
              >
                <span style={{ color: 'var(--lcd-subtext)' }}><Download size={20} /></span>
                <span className="flex-1 min-w-0">
                  <span className="block font-sans text-label tracking-widest" style={{ color: 'var(--lcd-text)' }}>EXPORT BACKUP</span>
                  <span className="block font-sans text-caption normal-case mt-1" style={{ color: 'var(--lcd-subtext)' }}>
                    Shelves, ratings, progress and settings as one file you own.
                  </span>
                </span>
              </button>
              <label
                className="dex-pressable w-full flex items-center gap-3 px-3 py-3 rounded-control border-2 text-left mb-2 cursor-pointer"
                style={{ backgroundColor: 'var(--lcd-surface)', borderColor: 'var(--lcd-surface-edge)' }}
              >
                <span style={{ color: 'var(--lcd-subtext)' }}><Upload size={20} /></span>
                <span className="flex-1 min-w-0">
                  <span className="block font-sans text-label tracking-widest" style={{ color: 'var(--lcd-text)' }}>RESTORE BACKUP</span>
                  <span className="block font-sans text-caption normal-case mt-1" style={{ color: 'var(--lcd-subtext)' }}>
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
                className="dex-pressable w-full py-4 rounded-control border-2 font-sans text-label tracking-widest"
                style={{ backgroundColor: 'var(--lcd-surface)', borderColor: 'color-mix(in srgb, var(--livery-red) 55%, transparent)', color: 'var(--livery-red)' }}
              >
                CLEAR SAVED DATA
              </button>
              <p className="font-sans text-caption leading-relaxed normal-case mt-2" style={{ color: 'var(--lcd-subtext)' }}>
                Erases bookmarks, tastings and ratings, quiz progress, the daily
                streak, name and photo, purchases, skin, screen and text settings.
                The encyclopedia itself is untouched.
              </p>
            </Section>

            <Section title="DEVELOPER">
              <button
                onClick={() => navigate('/settings/DEV')}
                className="dex-pressable w-full flex items-center gap-3 px-3 py-3 rounded-control border-2 text-left"
                style={{ backgroundColor: 'var(--lcd-surface)', borderColor: 'var(--lcd-surface-edge)' }}
              >
                <span style={{ color: 'var(--lcd-subtext)' }}><Bug size={20} /></span>
                <span className="flex-1 min-w-0">
                  <span className="block font-sans text-label tracking-widest" style={{ color: 'var(--lcd-text)' }}>DEV</span>
                  <span className="block font-sans text-caption normal-case mt-1" style={{ color: 'var(--lcd-subtext)' }}>
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
                <span className="font-sans text-title font-bold" style={{ color: 'var(--lcd-text)' }}>{allEntries.length}</span>
                <span className="flex-1" />
                <span className="font-sans text-caption tracking-wide" style={{ color: 'var(--lcd-subtext)' }}>
                  ACROSS {categoryLines.length} TABLES
                </span>
              </div>
            </Section>

            <Section title="GROWTH">
              <GrowthWave milestones={[0, 25, 186, 281, 342, allEntries.length]} />
              <p className="font-sans text-caption leading-relaxed normal-case mt-2" style={{ color: 'var(--lcd-subtext)' }}>
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
              The WEBSITE ACCESS section stood here and is gone (v8#3). It read
              out whether the access code had been entered and offered to
              re-lock the app. There is no code and no lock: the site hands the
              app over on a button press, so a readout of a permission nobody
              grants would be a control that lies about the product.

              ACCESS keeps its name and its remaining section. The panel is
              about what opens, and the paywall harness below is still exactly
              that — it models which bundles someone owns, which is a different
              question from the one the door used to ask and the only one left.
            */}
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
              <p className="font-sans text-caption leading-relaxed normal-case mt-2" style={{ color: 'var(--lcd-subtext)' }}>
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
                  className="dex-pressable w-full mt-2 py-3 rounded-control border-2 border-[var(--livery-red)] font-sans text-caption font-semibold tracking-widest text-[var(--livery-red)]"
                >
                  REVOKE ALL PURCHASES
                </button>
              )}
            </Section>

            <p className="font-sans text-caption leading-relaxed normal-case" style={{ color: 'var(--lcd-subtext)' }}>
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
        const lineageConnected = lineageIndexFor(allEntries).connectedIDs.size;
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
              {/* The v6#34 delta against iOS DiagnosticsReport: the systems
                  this parity pass added get their own OK-or-not lines. */}
              <HealthRow label="EXAM BANK" ok={examCount === null || examCount > 0} detail={examCount === null ? 'LOADING…' : `${examCount} QUESTIONS`} />
              <HealthRow
                label="LINEAGE GRAPH"
                ok={lineageConnected > 0}
                detail={`${lineageConnected} CONNECTED GRAPES`}
              />
              <HealthRow
                label="FLAVOR ART"
                ok={Object.keys((iconManifest as { flavorArt?: Record<string, string> }).flavorArt ?? {}).length > 0}
                detail={`${Object.keys((iconManifest as { flavorArt?: Record<string, string> }).flavorArt ?? {}).length} STEMS`}
              />
              <HealthRow
                label="FIRMWARE LOG"
                ok={WEB_RELEASES.length > 0}
                detail={`${WEB_RELEASES.length} RELEASES`}
              />
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

      {/* CLEAR SAVED DATA asks first — the one control here that cannot be
          undone. All five dialogs render through DexAlert (stage 4): the
          fixed-colour alert card extracted per U2, with Escape-to-close and
          initial focus on the safe action per U6. */}
      {pendingProfile && (
        <DexAlert
          tone="yellow"
          title={pendingProfile.mode === 'save'
            ? `SAVE INTO SLOT ${pendingProfile.slot}?`
            : `LOAD ${pendingProfile.slot === 'fresh' ? FRESH_PROFILE_NAME : profileList.find(p => p.slot === pendingProfile.slot)?.name ?? `SLOT ${pendingProfile.slot}`}?`}
          ariaLabel={pendingProfile.mode === 'save' ? 'Save profile' : 'Load profile'}
          onDismiss={() => setPendingProfile(null)}
          actions={[
            { label: 'CANCEL', kind: 'cancel', onClick: () => setPendingProfile(null) },
            {
              label: pendingProfile.mode === 'save' ? 'SAVE' : 'LOAD',
              kind: 'confirm',
              onClick: () => {
                const action = pendingProfile;
                setPendingProfile(null);
                if (action.mode === 'save') {
                  saveProfile(action.slot);
                  setProfileList(profiles());
                } else {
                  loadProfile(action.slot);
                  // Relaunch into the loaded state, so every store re-reads.
                  window.location.reload();
                }
              },
            },
          ]}
        >
          {pendingProfile.mode === 'save'
            ? 'Captures everything on this device into the slot, replacing whatever the slot held.'
            : pendingProfile.slot === 'fresh'
              ? 'A fresh install — everything on this device is cleared. Save into a slot first if you want it back.'
              : 'Replaces everything on this device with the snapshot. Save into a slot first if you want the current state back.'}
        </DexAlert>
      )}

      {pendingRestore && (
        <DexAlert
          tone="yellow"
          title="RESTORE THIS BACKUP?"
          ariaLabel="Restore backup"
          onDismiss={() => setPendingRestore(null)}
          actions={[
            { label: 'CANCEL', kind: 'cancel', onClick: () => setPendingRestore(null) },
            {
              label: 'RESTORE',
              kind: 'confirm',
              onClick: () => {
                applyArchive(pendingRestore);
                setPendingRestore(null);
                // Reload so every external store re-reads from the restored state.
                window.location.reload();
              },
            },
          ]}
        >
          From {pendingRestore.app} {pendingRestore.appVersion || '(unknown version)'} —
          {' '}{pendingRestore.triedShelf.length} tastings, {pendingRestore.savedShelf.length} saved.
          It replaces everything currently on this device.
        </DexAlert>
      )}

      {restoreError && (
        <DexAlert
          tone="red"
          role="alertdialog"
          title="CAN'T RESTORE"
          ariaLabel="Restore failed"
          onDismiss={() => setRestoreError(null)}
          actions={[{ label: 'OK', kind: 'cancel', onClick: () => setRestoreError(null) }]}
        >
          {restoreError}
        </DexAlert>
      )}

      {offeringTour && (
        <div className="absolute inset-0 z-30 bg-black/80 flex items-center justify-center p-6">
          <div
            ref={tourDialogRef}
            className="w-full max-w-xs border-2 rounded-lg p-5 flex flex-col gap-4 text-center"
            style={{ backgroundColor: 'var(--lcd-surface)', borderColor: 'var(--lcd-accent)' }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="tour-offer-title"
            aria-describedby="tour-offer-description"
          >
            <p id="tour-offer-title" className="font-retro text-xs tracking-widest" style={{ color: 'var(--lcd-accent)' }}>TAKE THE TOUR?</p>
            <p id="tour-offer-description" className="font-mono text-sm normal-case" style={{ color: 'var(--lcd-body-text)' }}>
              A quick walk round the device — what each button does and where things live. About a minute, and you can leave at any point.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setOfferingTour(false)} className="flex-1 font-retro text-[0.6rem] tracking-widest border-2 rounded py-3" style={{ color: 'var(--lcd-text)', borderColor: 'var(--lcd-surface-edge)' }}>NOT NOW</button>
              <button ref={tourYesRef} onClick={() => { setOfferingTour(false); navigate('/walkthrough'); }} className="flex-1 font-retro text-[0.6rem] tracking-widest rounded py-3 text-[var(--lcd-on-accent)]" style={{ backgroundColor: 'var(--lcd-accent)' }}>YES</button>
            </div>
          </div>
        </div>
      )}

      {confirmingWipe && (
        <DexAlert
          tone="red"
          role="alertdialog"
          title="CLEAR SAVED DATA?"
          ariaLabel="Clear saved data"
          onDismiss={() => setConfirmingWipe(false)}
          actions={[
            { label: 'CANCEL', kind: 'cancel', onClick: () => setConfirmingWipe(false) },
            { label: 'ERASE', kind: 'confirm', onClick: () => { setConfirmingWipe(false); clearAllSavedData(); } },
          ]}
        >
          This erases your bookmarks, tastings, ratings, quiz progress, streak,
          name and photo, purchases and appearance settings. It cannot be undone.
        </DexAlert>
      )}
    </DeviceLayout>
  );
};

export default SettingsGrid;
