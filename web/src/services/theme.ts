/**
 * Chassis skin, screen mode and text scale.
 *
 * Ported from `vinodex-ios/Sources/VinodexUI/DexTheme.swift`, hex for hex. The
 * stored vocabulary matches Swift's `rawValue` exactly — `CLASSIC`, `DARK`,
 * `SMALL` — deliberately: those strings are the persisted keys, and renaming a
 * case to change a label would silently reset every stored choice. Display
 * names live separately for the same reason.
 *
 * The LCD and the moulding are independent choices, as they are on iOS. A skin
 * swap repaints the shell only and can never affect the legibility of screen
 * content; pairing a light screen with the red shell is a perfectly good
 * combination.
 */

export type ChassisSkinId = 'CLASSIC' | 'MIDNIGHT' | 'ORIGINAL' | 'BURGUNDY' | 'RIESLING';
export type LcdModeId = 'DARK' | 'LIGHT';
export type TextScaleId = 'SMALL' | 'LARGE';

export interface ChassisSkin {
  id: ChassisSkinId;
  /** What the picker calls it — every skin has a wine name. */
  displayName: string;
  /** The moulding. */
  body: string;
  /** Wash behind the footer row, a shade off the body. */
  footerWash: string;
  /** The panel the LCD is set into. */
  panel: string;
  panelEdge: string;
  /** Speaker grill slats. */
  grill: string;
  /** Text sitting directly on the moulding — the wordmark and its shadow. */
  onBody: string;
  onBodyShadow: string;
}

// Palette constants, from `enum Dex` in DexTheme.swift.
const RED = '#DC0A2D';
const DARK_RED = '#89061C';
const UI = '#DEDEDE';
const GRAPHITE = '#17161A';
const GRAPHITE_PANEL = '#2B2A30';
const GRAPHITE_EDGE = '#4A4852';
const BONE = '#D8D8D0';
const BONE_PANEL = '#EFEFE9';
const BONE_EDGE = '#9A9A93';
const VELOUR = '#4B1D3F';
const VELOUR_PANEL = '#D3BBCE';
const VELOUR_EDGE = '#2C0F24';
const WALKMAN = '#F2C11B';
const WALKMAN_PANEL = '#FBF0CC';
const WALKMAN_EDGE = '#9A7A0A';
const STONE_400 = '#a8a29e';
const STONE_600 = '#57534e';

export const CHASSIS_SKINS: Record<ChassisSkinId, ChassisSkin> = {
  CLASSIC: {
    id: 'CLASSIC',
    displayName: 'VINODEX CLASSIC',
    body: RED,
    footerWash: 'rgba(220, 10, 45, 0.7)',
    panel: UI,
    panelEdge: STONE_400,
    grill: STONE_400,
    onBody: '#FFFFFF',
    onBodyShadow: DARK_RED,
  },
  MIDNIGHT: {
    id: 'MIDNIGHT',
    displayName: 'CÔTE DE NUITS',
    body: GRAPHITE,
    footerWash: 'rgba(23, 22, 26, 0.75)',
    panel: GRAPHITE_PANEL,
    panelEdge: GRAPHITE_EDGE,
    grill: STONE_600,
    onBody: '#FFFFFF',
    onBodyShadow: '#000000',
  },
  ORIGINAL: {
    id: 'ORIGINAL',
    displayName: 'BLANC DE BLANCS',
    body: BONE,
    footerWash: 'rgba(216, 216, 208, 0.75)',
    panel: BONE_PANEL,
    panelEdge: BONE_EDGE,
    grill: STONE_400,
    // The bone shell is too pale for white text; iOS relies on the LCD for
    // contrast, but the web wordmark sits directly on the moulding.
    onBody: '#2B2A30',
    onBodyShadow: BONE_EDGE,
  },
  BURGUNDY: {
    id: 'BURGUNDY',
    displayName: 'BURGUNDY VELOUR',
    body: VELOUR,
    footerWash: 'rgba(75, 29, 63, 0.75)',
    panel: VELOUR_PANEL,
    panelEdge: VELOUR_EDGE,
    grill: VELOUR_EDGE,
    onBody: '#FFFFFF',
    onBodyShadow: VELOUR_EDGE,
  },
  RIESLING: {
    id: 'RIESLING',
    displayName: 'ELECTRIC RIESLING',
    body: WALKMAN,
    footerWash: 'rgba(242, 193, 27, 0.7)',
    panel: WALKMAN_PANEL,
    panelEdge: WALKMAN_EDGE,
    grill: WALKMAN_EDGE,
    onBody: '#3A2C00',
    onBodyShadow: WALKMAN_EDGE,
  },
};

export interface LcdTheme {
  id: LcdModeId;
  displayName: string;
  /** LCD ground. */
  screen: string;
  /** Ground behind entry screens, which paint their own black. */
  page: string;
  /** Primary text on that ground. */
  text: string;
  /** Section rules, headers and glyph tints. */
  accent: string;
  /** Body copy inside INFO blocks. */
  bodyText: string;
  /** Hero panel wash behind an entry title. */
  heroWash: string;
  /** Row and card fill. */
  surface: string;
  surfaceEdge: string;
  /** Secondary text — captions, counts, placeholders. */
  subtext: string;
  /** Fill behind search fields. */
  well: string;
  /** A row that exists but cannot be opened. */
  disabledText: string;
  /**
   * Foreground for content sitting on an `accent` fill — a selected settings
   * option, an active chip.
   *
   * Dark mode's accent is mint (#4ADE80); white text on it is about 1.8:1, so it
   * takes black. Light mode's accent is a deep bottle green and takes white.
   * From `LcdMode.onAccent` (audit M44).
   */
  onAccent: string;
  /**
   * Grid lines drawn over the hero wash. Dark mode's deep #14532d reads heavy on
   * the light hero, so light mode lifts it toward the paper.
   * From `LcdMode.heroGrid` (audit L29).
   */
  heroGrid: string;
}

export const LCD_MODES: Record<LcdModeId, LcdTheme> = {
  DARK: {
    id: 'DARK',
    displayName: 'DARK',
    screen: '#232323',
    page: '#000000',
    text: '#ffffff',
    accent: '#4ADE80',
    bodyText: '#bbf7d0',
    heroWash: 'rgba(20, 83, 45, 0.10)',
    surface: '#1c1917',
    surfaceEdge: '#44403c',
    subtext: '#a8a29e',
    well: '#000000',
    disabledText: '#57534e',
    onAccent: '#000000',
    heroGrid: '#14532d',
  },
  LIGHT: {
    id: 'LIGHT',
    displayName: 'LIGHT',
    screen: '#E8E8E2',
    page: '#F2F2EC',
    text: '#1F1F1C',
    // The dark theme's #4ADE80 is invisible on white, so light mode drops to a
    // deep bottle green that still reads as "the green" without disappearing.
    accent: '#1B6B3A',
    bodyText: '#23342A',
    heroWash: 'rgba(27, 107, 58, 0.07)',
    surface: '#FFFFFF',
    surfaceEdge: '#C9C9C1',
    subtext: '#5A5A54',
    well: '#FFFFFF',
    // Not the dark theme's stone600: against a white surface that grey is close
    // enough to `text` to look like an ordinary enabled row.
    disabledText: '#A3A39B',
    onAccent: '#FFFFFF',
    heroGrid: '#1B6B3A',
  },
};

/**
 * Both steps sit at or below 1.0. The retro face has no optical sizes and the
 * tile metrics are tuned to 1.0, so that is the ceiling rather than the floor.
 */
export const TEXT_SCALES: Record<TextScaleId, { id: TextScaleId; displayName: string; factor: number }> = {
  SMALL: { id: 'SMALL', displayName: 'SMALL', factor: 0.85 },
  LARGE: { id: 'LARGE', displayName: 'LARGE', factor: 1.0 },
};

export interface ThemeState {
  skin: ChassisSkinId;
  lcd: LcdModeId;
  scale: TextScaleId;
}

// Storage keys match the iOS `@AppStorage` keys exactly.
const SKIN_KEY = 'chassisSkin';
const LCD_KEY = 'lcdMode';
const SCALE_KEY = 'textScale';

const DEFAULTS: ThemeState = { skin: 'CLASSIC', lcd: 'DARK', scale: 'SMALL' };

function readKey<T extends string>(key: string, valid: Record<T, unknown>, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw && raw in valid) return raw as T;
  } catch {
    // Private-mode Safari throws; the default theme is a fine outcome.
  }
  return fallback;
}

export function readTheme(): ThemeState {
  return {
    skin: readKey<ChassisSkinId>(SKIN_KEY, CHASSIS_SKINS, DEFAULTS.skin),
    lcd: readKey<LcdModeId>(LCD_KEY, LCD_MODES, DEFAULTS.lcd),
    scale: readKey<TextScaleId>(SCALE_KEY, TEXT_SCALES, DEFAULTS.scale),
  };
}

let revision = 0;
const listeners = new Set<() => void>();

function persist(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignored — the applied theme is still correct for this session.
  }
  revision += 1;
  applyTheme();
  listeners.forEach(fn => fn());
}

export const setSkin = (id: ChassisSkinId): void => persist(SKIN_KEY, id);
export const setLcdMode = (id: LcdModeId): void => persist(LCD_KEY, id);
export const setTextScale = (id: TextScaleId): void => persist(SCALE_KEY, id);

/** Cycles to the next colourway — the chassis itself is tappable on iOS. */
export function nextSkin(): void {
  const all = Object.keys(CHASSIS_SKINS) as ChassisSkinId[];
  const i = all.indexOf(readTheme().skin);
  setSkin(all[(i + 1) % all.length]!);
}

/**
 * Writes the active theme onto `:root` as custom properties.
 *
 * Variables rather than props threaded through the tree: every screen already
 * styles itself with Tailwind classes, and `bg-[var(--lcd-surface)]` is a
 * drop-in for `bg-stone-900` — which makes theming a find-and-replace rather
 * than a rewrite of twelve components.
 */
export function applyTheme(): void {
  if (typeof document === 'undefined') return;
  const { skin, lcd, scale } = readTheme();
  const s = CHASSIS_SKINS[skin];
  const l = LCD_MODES[lcd];
  const root = document.documentElement;

  root.style.setProperty('--chassis-body', s.body);
  root.style.setProperty('--chassis-footer', s.footerWash);
  root.style.setProperty('--chassis-panel', s.panel);
  root.style.setProperty('--chassis-panel-edge', s.panelEdge);
  root.style.setProperty('--chassis-grill', s.grill);
  root.style.setProperty('--chassis-on-body', s.onBody);
  root.style.setProperty('--chassis-on-body-shadow', s.onBodyShadow);

  root.style.setProperty('--lcd-screen', l.screen);
  root.style.setProperty('--lcd-page', l.page);
  root.style.setProperty('--lcd-text', l.text);
  root.style.setProperty('--lcd-accent', l.accent);
  root.style.setProperty('--lcd-body-text', l.bodyText);
  root.style.setProperty('--lcd-hero-wash', l.heroWash);
  root.style.setProperty('--lcd-surface', l.surface);
  root.style.setProperty('--lcd-surface-edge', l.surfaceEdge);
  root.style.setProperty('--lcd-subtext', l.subtext);
  root.style.setProperty('--lcd-well', l.well);
  root.style.setProperty('--lcd-disabled-text', l.disabledText);
  root.style.setProperty('--lcd-on-accent', l.onAccent);
  root.style.setProperty('--lcd-hero-grid', l.heroGrid);

  root.style.setProperty('--text-scale', String(TEXT_SCALES[scale].factor));

  // Lets plain CSS and any future `prefers-color-scheme` styling branch on the
  // screen mode without reading localStorage again.
  root.dataset.lcd = lcd.toLowerCase();
  root.dataset.skin = skin.toLowerCase();
}

export function subscribeToTheme(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

export function themeRevision(): number {
  return revision;
}
