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

import {
  DeviceAxisId,
  DeviceBuild,
  GrilleShapeId,
  PART_COLOR_BASE,
  activeBuild,
  axisMeta,
  grilleShapeOf,
  partColorOf,
  partControl,
  partHomeCap,
  partLampTrio,
  partMarqueeShadow,
  partMarqueeText,
  partOrb,
  partOrbGlow,
  readsAsInk,
  writeBuild,
} from './deviceParts';

export type ChassisSkinId =
  | 'CLASSIC' | 'MIDNIGHT' | 'ORIGINAL' | 'BURGUNDY' | 'RIESLING'
  | 'VINHO_VERDE' | 'GLOUGLOU' | 'SMART_GRAPE' | 'CHAMPAGNE' | 'CHRISTMAS'
  | 'NOUVEAU' | 'OAKED' | 'NOCTURNE' | 'STEEL' | 'BLUSH'
  | 'PSVINO' | 'GRIS_DE_GRIS' | 'ORANGE_WINE' | 'PET_NAT' | 'WALDGLAS'
  | 'HALLOWEEN' | 'W64';
export type LcdModeId =
  | 'DARK' | 'LIGHT' | 'VINTAGE' | 'AMBER' | 'WINE_OS'
  | 'TERMINAL' | 'BLUE_SCREEN' | 'STAR_TREK' | 'GRUENER_BOY';
export type TextScaleId = 'SMALL' | 'LARGE';
export type UiScaleId = 'SMALL' | 'LARGE';

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
  /** A tiling texture over the body (xmas-wrap / oak-grain / steel-brush). */
  bodyPattern?: string;
  /** Smoke-plastic skins that reveal the mock internals behind them. */
  translucent?: boolean;
  /** Glow-in-the-dark halo colour (NOCTURNE). */
  rimGlow?: string;
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
    displayName: 'BURGUNDY',
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
    displayName: 'VIN JAUNE',
    body: WALKMAN,
    footerWash: 'rgba(242, 193, 27, 0.7)',
    panel: WALKMAN_PANEL,
    panelEdge: WALKMAN_EDGE,
    grill: WALKMAN_EDGE,
    onBody: '#3A2C00',
    onBodyShadow: WALKMAN_EDGE,
  },
  // v0.5.x–v0.6.x additions. Patterned skins (CHRISTMAS/OAKED/STEEL) tile a
  // texture over the body; translucent skins (GLOUGLOU/NOUVEAU) reveal the mock
  // internals behind the shell.
  VINHO_VERDE: {
    id: 'VINHO_VERDE',
    displayName: 'BOX WINE',
    body: '#24402B',
    footerWash: 'rgba(36, 64, 43, 0.75)',
    panel: '#2E4F36',
    panelEdge: '#16281B',
    grill: '#16281B',
    onBody: '#FFFFFF',
    onBodyShadow: '#16281B',
  },
  GLOUGLOU: {
    id: 'GLOUGLOU',
    displayName: 'EMPTY BOTTLE',
    body: 'rgba(204, 216, 224, 0.55)',
    footerWash: 'rgba(204, 216, 224, 0.28)',
    panel: 'rgba(234, 241, 246, 0.7)',
    panelEdge: 'rgba(148, 163, 184, 0.85)',
    grill: '#64748B',
    onBody: '#0F172A',
    onBodyShadow: 'rgba(148, 163, 184, 0.85)',
    translucent: true,
  },
  SMART_GRAPE: {
    id: 'SMART_GRAPE',
    displayName: 'FIELD BLEND',
    body: '#1C1C1E',
    footerWash: 'rgba(28, 28, 30, 0.75)',
    panel: '#2C2A28',
    panelEdge: '#5A5148',
    grill: '#5A5148',
    onBody: '#FFFFFF',
    onBodyShadow: '#000000',
  },
  CHAMPAGNE: {
    id: 'CHAMPAGNE',
    displayName: 'CHAMPAGNE GOLD',
    body: '#E8D5A6',
    footerWash: 'rgba(232, 213, 166, 0.75)',
    panel: '#F6EEDC',
    panelEdge: '#B49B62',
    grill: '#B49B62',
    onBody: '#2E2410',
    onBodyShadow: '#B49B62',
  },
  CHRISTMAS: {
    id: 'CHRISTMAS',
    displayName: 'WINE XMAS',
    body: '#1B4332',
    footerWash: 'rgba(27, 67, 50, 0.75)',
    panel: '#F4F7F2',
    panelEdge: '#9CAF9C',
    grill: '#9CAF9C',
    onBody: '#FFFFFF',
    onBodyShadow: '#0F380F',
    bodyPattern: 'xmas-wrap',
  },
  NOUVEAU: {
    id: 'NOUVEAU',
    displayName: 'RETROVIN',
    body: 'rgba(147, 51, 234, 0.55)',
    footerWash: 'rgba(147, 51, 234, 0.3)',
    panel: 'rgba(216, 180, 254, 0.6)',
    panelEdge: 'rgba(233, 213, 255, 0.9)',
    grill: '#7C3AED',
    onBody: '#FFFFFF',
    onBodyShadow: '#2E1065',
    translucent: true,
  },
  OAKED: {
    id: 'OAKED',
    displayName: 'OAKED',
    body: '#5C4028',
    footerWash: 'rgba(92, 64, 40, 0.5)',
    panel: '#F2E8D5',
    panelEdge: '#B5892E',
    grill: '#8A6B45',
    onBody: '#F2E8D5',
    onBodyShadow: '#2E2014',
    bodyPattern: 'oak-grain',
  },
  NOCTURNE: {
    id: 'NOCTURNE',
    displayName: 'VINHO VERDE',
    body: '#C9F2BE',
    footerWash: 'rgba(201, 242, 190, 0.75)',
    panel: '#E9FBE0',
    panelEdge: '#8FCB7C',
    grill: '#8FCB7C',
    onBody: '#123B0C',
    onBodyShadow: '#8FCB7C',
    rimGlow: '#A8FF96',
  },
  STEEL: {
    id: 'STEEL',
    displayName: 'STAINLESS STEEL',
    body: '#C7CBD1',
    footerWash: 'rgba(184, 188, 194, 0.8)',
    panel: '#DDE0E4',
    panelEdge: '#6B7078',
    grill: '#6B7078',
    onBody: '#14181D',
    onBodyShadow: '#6B7078',
    bodyPattern: 'steel-brush',
  },
  BLUSH: {
    id: 'BLUSH',
    displayName: 'BLUSH',
    body: '#EEA7B6',
    footerWash: 'rgba(238, 167, 182, 0.75)',
    panel: '#FBE9EC',
    panelEdge: '#D2718A',
    grill: '#C8879A',
    onBody: '#4A1220',
    onBodyShadow: '#D2718A',
  },
  /**
   * The seven shells iOS added through 0.8.9x, ported with the art ruling
   * (v6#2 / v6#19-geometry). Values are `ChassisSkins.swift`'s verbatim;
   * WALDGLAS is authored translucent there and is composited here over the
   * same #14161A underlay iOS puts behind its translucent shells, so the web
   * renders one deterministic colour rather than whatever happens to sit
   * behind the device.
   *
   * `displayName` is iOS's, which is not always the case name: PSVINO shows
   * as PX, PET NAT as FIBERGLASS, HALLOWEEN as HALLOWINE and W64 as 1964.
   * The raw ids never change - they are the persisted vocabulary and the
   * sticker stems key off them.
   */
  PSVINO: {
    id: 'PSVINO',
    displayName: 'PX',
    body: '#232427',
    footerWash: 'rgba(35, 36, 39, 0.75)',
    panel: '#3B3C41',
    panelEdge: '#141517',
    grill: '#55575E',
    onBody: '#FFFFFF',
    onBodyShadow: '#141517',
  },
  GRIS_DE_GRIS: {
    id: 'GRIS_DE_GRIS',
    displayName: 'GRIS DE GRIS',
    body: '#C8C4BC',
    footerWash: 'rgba(200, 196, 188, 0.75)',
    panel: '#DAD6CE',
    panelEdge: '#8B8880',
    grill: '#9A968E',
    onBody: '#2B2A30',
    onBodyShadow: '#8B8880',
  },
  ORANGE_WINE: {
    id: 'ORANGE_WINE',
    displayName: 'ORANGE WINE',
    body: '#E8720E',
    footerWash: 'rgba(232, 114, 14, 0.75)',
    panel: '#F6A550',
    panelEdge: '#8A4406',
    grill: '#A85708',
    onBody: '#3A1B02',
    onBodyShadow: '#8A4406',
  },
  PET_NAT: {
    id: 'PET_NAT',
    displayName: 'FIBERGLASS',
    body: '#EFE9DC',
    // Authored `Color.clear` on iOS: this shell wears no footer wash.
    footerWash: 'rgba(0, 0, 0, 0)',
    panel: '#F8F4EA',
    panelEdge: '#2B3244',
    grill: '#4A5468',
    onBody: '#2B3244',
    onBodyShadow: '#4A5468',
  },
  WALDGLAS: {
    id: 'WALDGLAS',
    displayName: 'WALDGLAS',
    // rgba(160,183,116,0.42) over #14161A.
    body: '#4F5A40',
    footerWash: 'rgba(160, 183, 116, 0.28)',
    // rgba(214,229,178,0.55) and rgba(122,142,84,0.85) over the same.
    panel: '#7F886E',
    panelEdge: '#6B7C4B',
    grill: '#6C8348',
    onBody: '#F2F6E6',
    onBodyShadow: '#2A3320',
  },
  HALLOWEEN: {
    id: 'HALLOWEEN',
    displayName: 'HALLOWINE',
    body: '#17141A',
    footerWash: 'rgba(23, 20, 26, 0.75)',
    panel: '#241E2B',
    panelEdge: '#0C0A10',
    grill: '#4A3F55',
    onBody: '#FF8A3D',
    onBodyShadow: '#0C0A10',
  },
  W64: {
    id: 'W64',
    displayName: '1964',
    body: '#4A2E8C',
    footerWash: 'rgba(74, 46, 140, 0.75)',
    panel: '#33206B',
    panelEdge: '#1D1145',
    grill: '#8B6FD4',
    onBody: '#FFFFFF',
    onBodyShadow: '#1D1145',
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
   * When set, the whole LCD is desaturated (grayscale) then multiplied by this
   * tint - the phosphor look (amber/terminal/vintage/grunerboy). null = full
   * colour. Ports DeviceChassis' `.grayscale(1).colorMultiply(tint)`.
   */
  monochromeTint: string | null;
  /** Light-ground modes, for any styling that needs to know. */
  isLight: boolean;
  /**
   * Foreground for content sitting on an `accent` fill - a selected settings
   * option, an active chip. Dark mode's accent is mint (#4ADE80); white text on
   * it is about 1.8:1, so it takes black. From `LcdMode.onAccent` (audit M44).
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
    monochromeTint: null,
    isLight: false,
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
    monochromeTint: null,
    isLight: true, onAccent: '#FFFFFF', heroGrid: '#1B6B3A',
  },
  VINTAGE: {
    id: 'VINTAGE', displayName: 'VINTAGE',
    screen: '#E4E4DC', page: '#EDEDE4', text: '#101010', accent: '#1A1A16',
    bodyText: '#20201C', heroWash: 'rgba(0, 0, 0, 0.06)', surface: '#F6F6EF',
    surfaceEdge: '#84847A', subtext: '#42423C', well: '#FFFFFF', disabledText: '#96968C',
    monochromeTint: '#C6CFB2', isLight: true, onAccent: '#FFFFFF', heroGrid: '#3A3A34',
  },
  AMBER: {
    id: 'AMBER', displayName: 'AMBER',
    screen: '#232323', page: '#000000', text: '#FFFFFF', accent: '#4ADE80',
    bodyText: '#BBF7D0', heroWash: 'rgba(20, 83, 45, 0.1)', surface: '#1C1917',
    surfaceEdge: '#44403C', subtext: '#A8A29E', well: '#000000', disabledText: '#57534E',
    monochromeTint: '#FFB300', isLight: false, onAccent: '#000000', heroGrid: '#14532d',
  },
  WINE_OS: {
    id: 'WINE_OS', displayName: 'WINE.OS',
    screen: '#C7D3E6', page: '#D6DFEE', text: '#0E2258', accent: '#1D3E9E',
    bodyText: '#22335E', heroWash: 'rgba(29, 62, 158, 0.07)', surface: '#E9EEF6',
    surfaceEdge: '#8598B8', subtext: '#465578', well: '#FFFFFF', disabledText: '#9FACC6',
    monochromeTint: null, isLight: true, onAccent: '#FFFFFF', heroGrid: '#1D3E9E',
  },
  TERMINAL: {
    id: 'TERMINAL', displayName: 'TERMINAL',
    screen: '#232323', page: '#000000', text: '#FFFFFF', accent: '#4ADE80',
    bodyText: '#BBF7D0', heroWash: 'rgba(20, 83, 45, 0.1)', surface: '#1C1917',
    surfaceEdge: '#44403C', subtext: '#A8A29E', well: '#000000', disabledText: '#57534E',
    monochromeTint: '#4DFF4D', isLight: false, onAccent: '#000000', heroGrid: '#14532d',
  },
  BLUE_SCREEN: {
    id: 'BLUE_SCREEN', displayName: 'VINOFD',
    screen: '#1021B4', page: '#0E1CA8', text: '#A6DBFF', accent: '#7DF9FF',
    bodyText: '#BFE4FF', heroWash: 'rgba(255, 255, 255, 0.06)', surface: '#1F31CE',
    surfaceEdge: '#5D74E8', subtext: '#8FB0F0', well: '#0A1690', disabledText: '#6272D4',
    monochromeTint: null, isLight: false, onAccent: '#0A1690', heroGrid: '#4A5FE0',
  },
  STAR_TREK: {
    id: 'STAR_TREK', displayName: 'L-WINES',
    screen: '#0B0910', page: '#000000', text: '#FFA94D', accent: '#C983E8',
    bodyText: '#F2CD9A', heroWash: 'rgba(201, 131, 232, 0.08)', surface: '#191022',
    surfaceEdge: '#5C3E78', subtext: '#C2915C', well: '#000000', disabledText: '#6D5A49',
    monochromeTint: null, isLight: false, onAccent: '#000000', heroGrid: '#7A4E9E',
  },
  GRUENER_BOY: {
    id: 'GRUENER_BOY', displayName: 'GRÜNERBOY',
    screen: '#E6EBCF', page: '#DDE3C2', text: '#141A0C', accent: '#2F3A1C',
    bodyText: '#202817', heroWash: 'rgba(0, 0, 0, 0.06)', surface: '#EFF2DE',
    surfaceEdge: '#7A8258', subtext: '#455030', well: '#F4F6E8', disabledText: '#939B78',
    monochromeTint: '#9BBC0F', isLight: true, onAccent: '#FFFFFF', heroGrid: '#3A4224',
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

/**
 * A second, independent axis (v0.5.8): TextScale sizes the LCD copy, UIScale
 * sizes the chassis furniture — footer controls and marquee.
 */
export const UI_SCALES: Record<UiScaleId, { id: UiScaleId; displayName: string; factor: number }> = {
  SMALL: { id: 'SMALL', displayName: 'SMALL', factor: 1.0 },
  LARGE: { id: 'LARGE', displayName: 'LARGE', factor: 1.15 },
};

export interface ThemeState {
  skin: ChassisSkinId;
  lcd: LcdModeId;
  scale: TextScaleId;
  uiScale: UiScaleId;
}

// Storage keys match the iOS `@AppStorage` keys exactly.
const SKIN_KEY = 'chassisSkin';
const LCD_KEY = 'lcdMode';
const SCALE_KEY = 'textScale';
const UI_SCALE_KEY = 'uiScale';

const DEFAULTS: ThemeState = { skin: 'CLASSIC', lcd: 'DARK', scale: 'SMALL', uiScale: 'SMALL' };

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
    uiScale: readKey<UiScaleId>(UI_SCALE_KEY, UI_SCALES, DEFAULTS.uiScale),
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
export const setUiScale = (id: UiScaleId): void => persist(UI_SCALE_KEY, id);

// ---------------------------------------------------------------------------
// The Device Workshop's axes (v0.5.0, v6#35)
// ---------------------------------------------------------------------------

/**
 * The device the player has built, as the ten stored axes — see
 * `deviceParts.ts` for the model and its invariants. The workshop writes
 * through these two entry points so a part change repaints through the same
 * `applyTheme` + notify path a skin change always has; there is one device
 * and one way to paint it.
 */
export const readBuild = (): DeviceBuild => activeBuild();

/** Write one axis. Empty clears the key — absence, not `''`. */
export function setPart(axis: DeviceAxisId, value: string): void {
  const key = axisMeta(axis).storageKey;
  try {
    const trimmed = value.trim();
    if (trimmed === '') window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, trimmed);
  } catch {
    /* ignored */
  }
  revision += 1;
  applyTheme();
  listeners.forEach(fn => fn());
}

/** Make `build` the device — FIT and REVERT both come through here. */
export function applyBuild(build: DeviceBuild): void {
  writeBuild(build);
  revision += 1;
  applyTheme();
  listeners.forEach(fn => fn());
}

/** The grille pattern in effect (the site always shows stock SLATS). */
export const grilleShape = (): GrilleShapeId => grilleShapeOf(readBuild().grilleShape);

/** The FOOTER BUTTONS part in effect, if one is fitted. */
export const customButtonsPart = () => partColorOf(readBuild().buttons);

/** The marquee's stock phosphor — CLASSIC green, as the footer has always drawn it. */
const MARQUEE_STOCK = {
  text: '#22c55e',
  shadow: 'rgba(8, 32, 16, 0.65)',
  glow: 'rgba(34, 197, 94, 0.16)',
};

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
/**
 * Per-skin orb bead, its glow halo, and the three status lamps — ported from
 * iOS `ChassisSkin.orb` / `.orbGlow` / `.statusLights` (v0.6.x). Kept as a side
 * table rather than folded into every `ChassisSkin` literal: it is chassis
 * lighting, read only by `DeviceLayout`, and one table is far less error-prone
 * to keep in step with iOS than three fields across fifteen objects.
 */
/**
 * A lamp's **ink**: the legend colour for the two marquee lamp buttons.
 *
 * Derived, not authored — iOS `ChassisSkin.statusLights`'s third member, added
 * in 0.7.5 (A1), and its note is the argument for deriving it here too:
 *
 * > A1 asks for a darker glyph, and the honest way to get one is a further stop
 * > of the *lamp's own hue* rather than a chassis token: forty-two authored
 * > hexes would have to be re-picked otherwise, and a glyph in `marqueeShadow`
 * > would be the same near-black on all twenty-one skins.
 *
 * So it is the `edge` stop mixed 45% toward black — one derivation, twenty-two
 * skins, and a new skin gets an ink by writing the two hexes it was always
 * going to write. What it buys is a legend that reads as **cut into** the cap
 * rather than printed on it: a shade the lamp is already wearing, one stop
 * below the rim it is drawn with.
 */
export function lampInk(edge: string): string {
  const m = /^#([0-9a-fA-F]{6})$/.exec(edge.trim());
  // Every `edge` in `SKIN_LIGHTS` is a plain six-digit hex, and `lampInk`'s own
  // test holds that true — but a table that grew an `rgba()` should darken
  // nothing rather than emit `#NaNNaNNaN`.
  if (!m) return edge;
  const n = parseInt(m[1]!, 16);
  const mix = (c: number) => Math.round(c * 0.55);
  const [r, g, b] = [mix((n >> 16) & 255), mix((n >> 8) & 255), mix(n & 255)];
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

export type Lamp = [fill: string, edge: string];
export const SKIN_LIGHTS: Record<ChassisSkinId, { orb: string; orbGlow: string; lamps: [Lamp, Lamp, Lamp] }> = {
  CLASSIC:     { orb: '#67e8f9', orbGlow: '#2AB5FF', lamps: [['#dc2626', '#991b1b'], ['#facc15', '#ca8a04'], ['#22c55e', '#15803d']] },
  MIDNIGHT:    { orb: '#d8b4fe', orbGlow: '#a855f7', lamps: [['#d8b4fe', '#7c3aed'], ['#a855f7', '#6b21a8'], ['#7c3aed', '#4c1d95']] },
  ORIGINAL:    { orb: '#ffd76e', orbGlow: '#f0b429', lamps: [['#ffd76e', '#f0b429'], ['#e8e0cc', '#9a9a93'], ['#d4a017', '#8a6820']] },
  BURGUNDY:    { orb: '#7c3aed', orbGlow: '#5b21b6', lamps: [['#f9a8d4', '#be185d'], ['#c084fc', '#7c3aed'], ['#7c3aed', '#4c1d95']] },
  RIESLING:    { orb: '#ef4444', orbGlow: '#b91c1c', lamps: [['#ef4444', '#b91c1c'], ['#facc15', '#ca8a04'], ['#4b5563', '#1f2937']] },
  VINHO_VERDE: { orb: '#9BBC0F', orbGlow: '#8BAC0F', lamps: [['#9BBC0F', '#6a8a0a'], ['#8BAC0F', '#5a740a'], ['#306230', '#0F380F']] },
  GLOUGLOU:    { orb: '#FB923C', orbGlow: '#EA580C', lamps: [['#FDBA74', '#EA580C'], ['#FB923C', '#C2410C'], ['#F97316', '#9A3412']] },
  SMART_GRAPE: { orb: '#FF9F0A', orbGlow: '#C97800', lamps: [['#FF9F0A', '#C97800'], ['#FFD60A', '#B8860B'], ['#8E8E93', '#48484A']] },
  CHAMPAGNE:   { orb: '#F5D97E', orbGlow: '#D4A017', lamps: [['#F5D97E', '#D4A017'], ['#E3BC5F', '#8A6820'], ['#FDF6E3', '#C8B87A']] },
  CHRISTMAS:   { orb: '#FF4D4D', orbGlow: '#A61E1E', lamps: [['#FF4D4D', '#8F1414'], ['#FF4D4D', '#8F1414'], ['#FF4D4D', '#8F1414']] },
  NOUVEAU:     { orb: '#A855F7', orbGlow: '#7C3AED', lamps: [['#E9D5FF', '#A855F7'], ['#C084FC', '#7C3AED'], ['#A855F7', '#6B21A8']] },
  OAKED:       { orb: '#B06A32', orbGlow: '#7A4218', lamps: [['#E8C15A', '#B5892E'], ['#D9AE55', '#8A6820'], ['#B5892E', '#7A5A14']] },
  NOCTURNE:    { orb: '#7CFC9A', orbGlow: '#3EE06C', lamps: [['#B9FFAB', '#57D63E'], ['#8DF06A', '#2E8A20'], ['#57D63E', '#1E6A14']] },
  STEEL:       { orb: '#E8F1FF', orbGlow: '#9FB8D8', lamps: [['#E8F1FF', '#9FB8D8'], ['#C7CBD1', '#6B7078'], ['#9FD4FF', '#5FA8E8']] },
  BLUSH:       { orb: '#FF7FA8', orbGlow: '#E1447E', lamps: [['#FFE0E6', '#E11D48'], ['#F9A8D4', '#DB2777'], ['#D6296B', '#7A0B36']] },
  PSVINO:       { orb: '#5B93D8', orbGlow: '#2E6DB4', lamps: [['#3AC4B4', '#0E7A6E'], ['#F0435C', '#8F0E20'], ['#6FA3E8', '#1B4470']] },
  GRIS_DE_GRIS: { orb: '#E23E3E', orbGlow: '#8F1414', lamps: [['#FF8A8A', '#B02020'], ['#E23E3E', '#8F1414'], ['#A81E1E', '#5C0A0A']] },
  ORANGE_WINE:  { orb: '#FFD22E', orbGlow: '#C99000', lamps: [['#FFD22E', '#B98A00'], ['#FF8A1F', '#A34C00'], ['#C24E06', '#6E2A00']] },
  PET_NAT:      { orb: '#7FA6D8', orbGlow: '#3E6FA8', lamps: [['#E24A4A', '#8E1C1C'], ['#E8B93A', '#8E6A0A'], ['#3E7FBF', '#1B4470']] },
  WALDGLAS:     { orb: '#C9E86A', orbGlow: '#7A9A2E', lamps: [['#D7E8AE', '#7E9A3E'], ['#A8C766', '#5A7526'], ['#5F7A28', '#2E3F10']] },
  HALLOWEEN:    { orb: '#FF8A1F', orbGlow: '#B34700', lamps: [['#FFC98A', '#B36A00'], ['#FF8A1F', '#A34C00'], ['#8A2E00', '#3D1200']] },
  W64:          { orb: '#F2C93A', orbGlow: '#B58A0C', lamps: [['#63C86B', '#1E7A2E'], ['#3E7FD8', '#123C74'], ['#D8343E', '#7A0E16']] },
};


/**
 * A moulded footer cap: the four colours one of the band's controls is drawn
 * from.
 *
 * Ported from `ChassisControl` in `vinodex-ios/Sources/VinodexUI/Chassis/
 * ChassisSkins.swift:93`, hex for hex.
 *
 * `glyph` is a field rather than an assumed white because several skins need
 * it dark: ORIGINAL's caps are the original handheld's pale grey, CHAMPAGNE's
 * are pale gold, PET NAT's are paper, and white on any of those is
 * unreadable. That is iOS's own note and it is the reason the type has four
 * stops rather than two.
 */
export interface ChassisCap {
  /** Top of the cap's gradient. */
  top: string;
  /** Bottom of it. */
  bottom: string;
  /** The rim. */
  edge: string;
  /** The chevron, house, person or cog incised into the face. */
  glyph: string;
}

/** The four controls in the footer band. */
export type FooterCapKind = 'back' | 'home' | 'user' | 'settings';

export const FOOTER_CAP_KINDS: FooterCapKind[] = ['back', 'home', 'user', 'settings'];

/**
 * Each skin's moulded cap — the one every control wears unless the skin
 * authors a set below.
 *
 * From `ChassisSkin.control` (`ChassisSkins.swift:769`).
 *
 * Three skins carry `rgba(...)` stops rather than hex: GLOUGLOU, NOUVEAU and
 * WALDGLAS are smoke plastic, and the translucent stops are what make their
 * buttons read as moulded from the same material as the shell. They are
 * carried across verbatim — CSS takes them directly, which is one place the
 * web has an easier time of it than Swift.
 */
const SKIN_CAP: Record<ChassisSkinId, ChassisCap> = {
  CLASSIC:      { top: '#44403c', bottom: '#0c0a09', edge: '#a8a29e', glyph: '#ffffff' },
  MIDNIGHT:     { top: '#3b3746', bottom: '#0b0a10', edge: '#8b86a3', glyph: '#ffffff' },
  // Pale grey with a dark glyph -- the original handheld's own d-pad.
  ORIGINAL:     { top: '#c2c2ba', bottom: '#83837b', edge: '#5f5f59', glyph: '#262622' },
  BURGUNDY:     { top: '#5b21b6', bottom: '#1e0a38', edge: '#a78bfa', glyph: '#ffffff' },
  // Neutral grey: the blue cast the caps used to carry fought the livery once
  // the orb went red.
  RIESLING:     { top: '#5a6068', bottom: '#14171c', edge: '#a7adb5', glyph: '#ffffff' },
  VINHO_VERDE:  { top: '#4B4F54', bottom: '#111316', edge: '#8A9096', glyph: '#ffffff' },
  // Clear caps: the rgba stops are what makes the buttons read as moulded
  // from the same smoke plastic as the shell.
  GLOUGLOU:     { top: 'rgba(203,213,225,0.55)', bottom: 'rgba(51,65,85,0.60)', edge: 'rgba(226,232,240,0.90)', glyph: '#0F172A' },
  SMART_GRAPE:  { top: '#4A4239', bottom: '#151210', edge: '#8A7B6B', glyph: '#ffffff' },
  // Pale gold with a dark glyph, per the Blanc de Blancs precedent.
  CHAMPAGNE:    { top: '#D8C48E', bottom: '#7A6535', edge: '#55431F', glyph: '#2E2410' },
  // The holly-berry caps.
  CHRISTMAS:    { top: '#C93B3B', bottom: '#5C1010', edge: '#E88A8A', glyph: '#ffffff' },
  NOUVEAU:      { top: 'rgba(216,180,254,0.55)', bottom: 'rgba(76,29,149,0.60)', edge: 'rgba(233,213,255,0.90)', glyph: '#2E1065' },
  // Walnut with a cream glyph, like inlay.
  OAKED:        { top: '#7A5A3A', bottom: '#2E2014', edge: '#A8865E', glyph: '#F2E8D5' },
  // Moulded from the luminous shell, one register deeper.
  NOCTURNE:     { top: '#A9D89A', bottom: '#4E7A42', edge: '#6FA75E', glyph: '#123B0C' },
  // Machined, dark glyph, per the Blanc de Blancs precedent.
  STEEL:        { top: '#B9BEC6', bottom: '#5E646C', edge: '#3E434B', glyph: '#14181D' },
  BLUSH:        { top: '#F5BBC9', bottom: '#C97F94', edge: '#8F4A5E', glyph: '#4A1220' },
  PSVINO:       { top: '#3A3B40', bottom: '#101114', edge: '#6A6C72', glyph: '#ffffff' },
  GRIS_DE_GRIS: { top: '#D8484E', bottom: '#8A1F24', edge: '#F0989C', glyph: '#ffffff' },
  // Black caps on the warning orange.
  ORANGE_WINE:  { top: '#3A3A3C', bottom: '#0B0B0C', edge: '#6E6E70', glyph: '#ffffff' },
  // Paper caps with an ink glyph -- white on paper is nothing at all.
  PET_NAT:      { top: '#FBF8F1', bottom: '#DED7C7', edge: '#2B3244', glyph: '#2B3244' },
  WALDGLAS:     { top: 'rgba(203,222,160,0.55)', bottom: 'rgba(72,96,30,0.60)', edge: 'rgba(226,238,200,0.90)', glyph: '#1F2C0A' },
  // Black caps with an orange glyph -- the two colours, and only the two.
  HALLOWEEN:    { top: '#2A2530', bottom: '#0A080C', edge: '#5E5468', glyph: '#FF8A1F' },
  W64:          { top: '#6A4BB8', bottom: '#221448', edge: '#A98EE8', glyph: '#ffffff' },
};

/**
 * The four skins that colour each control separately.
 *
 * From `ChassisSkin.buttonSet` (`ChassisSkins.swift:866`). Every other skin
 * wears `SKIN_CAP` on all four, which is what `footerCap` below falls back
 * to.
 *
 * **Home is a cap here, not a ramp.** iOS 0.8.98 is the whole reason this
 * table can be written this way. Through 0.8.97 a livery's Home travelled as
 * a `ChassisAccent` -- a six-stop lit ramp -- all the way into the button
 * view, which kept a `.home` branch alive at every read it reached; and the
 * history §A records is that every such branch eventually disagrees with its
 * neighbours. Restating the ramp as a plain cap at the *resolution* step
 * means the view has one colour model and cannot tell Home apart. "Lit" is a
 * colour, not a code path.
 *
 * So the values below are what `ChassisControl(litRamp:)` produces from each
 * livery's authored Home ramp: `top` = the ramp's `light`, `bottom` = `mid`,
 * `edge` = `edge`, `glyph` = `ink`.
 *
 * CLASSIC is here for a different reason from the other three. It is not a
 * colour scheme; it is the skin the device ships wearing, and its four caps
 * used to disagree with each other -- Back, User and the cog resolved to
 * near-black stone with a white glyph while Home resolved through the accent
 * to an amber cap with dark amber ink. iOS 0.8.91 D2 made "CLASSIC's buttons
 * are black" a decision rather than an accident.
 */
const SKIN_CAP_SET: Partial<Record<ChassisSkinId, Record<FooterCapKind, ChassisCap>>> = {
  // Four grey glyphs on four black caps (iOS 0.8.91, D2).
  CLASSIC: {
    back:     { top: '#292524', bottom: '#0c0a09', edge: '#57534e', glyph: '#a8a29e' },
    home:     { top: '#3f3c39', bottom: '#1c1917', edge: '#0c0a09', glyph: '#a8a29e' },
    user:     { top: '#292524', bottom: '#0c0a09', edge: '#57534e', glyph: '#a8a29e' },
    settings: { top: '#292524', bottom: '#0c0a09', edge: '#57534e', glyph: '#a8a29e' },
  },
  // Green / red / blue / magenta-pink.
  PSVINO: {
    back:     { top: '#F0435C', bottom: '#7E0C1C', edge: '#FF97A6', glyph: '#FFE3E8' },
    home:     { top: '#9FE6DA', bottom: '#1E9E90', edge: '#0B5C54', glyph: '#04241F' },
    user:     { top: '#6FA3E8', bottom: '#173D6B', edge: '#A9CBF5', glyph: '#E4EFFC' },
    settings: { top: '#E86FC0', bottom: '#6E1250', edge: '#F5A9DA', glyph: '#FCE4F3' },
  },
  // Green / red / blue / yellow.
  VINHO_VERDE: {
    back:     { top: '#E5402F', bottom: '#7A1409', edge: '#FF9587', glyph: '#FFE2DE' },
    home:     { top: '#A7E39A', bottom: '#3A9A28', edge: '#1E5C14', glyph: '#062A02' },
    user:     { top: '#3F8FE0', bottom: '#123C68', edge: '#9AC6F0', glyph: '#E2EEFA' },
    // Dark glyph on the yellow cap, per the Blanc de Blancs precedent.
    settings: { top: '#F2C130', bottom: '#7A5A05', edge: '#FBE08C', glyph: '#3A2A00' },
  },
  // Green / blue / red / yellow. Home takes the green because it is the one
  // control on the device built to look powered; the yellow goes on the cog
  // so all four colours appear at once.
  W64: {
    back:     { top: '#D8343E', bottom: '#6E0C14', edge: '#F59098', glyph: '#FFE4E6' },
    home:     { top: '#A8E3A4', bottom: '#3A9A44', edge: '#1E5C24', glyph: '#062A08' },
    user:     { top: '#3E7FD8', bottom: '#123C74', edge: '#9AC2F0', glyph: '#E2EEFA' },
    settings: { top: '#F2C93A', bottom: '#7A6008', edge: '#FBE694', glyph: '#3A2E00' },
  },
};

/**
 * The cap one footer control wears on one skin -- **the** resolution path,
 * for all four kinds.
 *
 * The web twin of `ChassisLook.footerCap` (`DeviceParts.swift:498`), and it
 * exists for the reason that function does: until iOS 0.8.94 the four caps
 * resolved in three different places and Home resolved through a fourth, so
 * three consecutive batches of cap fixes each "missed the home button" --
 * every fix landed on the path Home was never on. One function means the next
 * cap fix cannot cover three buttons and skip the fourth.
 *
 * The web had the same fork frozen in Tailwind: Back, User and Settings were
 * hardcoded stone and Home was hardcoded amber with an inner lit disc, on
 * every one of the twenty-two skins.
 */
export function footerCap(skin: ChassisSkinId, kind: FooterCapKind): ChassisCap {
  return SKIN_CAP_SET[skin]?.[kind] ?? SKIN_CAP[skin];
}

/**
 * One skin's chassis tokens, as an inline style object (v8#4).
 *
 * **Why this exists.** On the company site the device is always the red
 * Vinodex CLASSIC shell, whatever colourway the player picked for the app — a
 * visitor who chose NOCTURNE sees NOCTURNE in the dex and CLASSIC on the site.
 * The obvious implementations are both wrong: writing CLASSIC through
 * `setSkin` would *destroy the user's choice*, and writing the `:root`
 * properties directly on entry and putting them back on exit is the same
 * destruction with a race in it — a reload on a site page would strand the
 * override as the stored value's worth of paint.
 *
 * Custom properties inherit, so an element that declares them shadows `:root`
 * for its own subtree and for nothing else. `DeviceLayout` puts this object on
 * the chassis stage; `applyTheme` goes on writing the player's real skin to
 * `:root`, untouched, and the dex keeps reading it. Nothing is stored, nothing
 * is restored, and there is no state to get out of step.
 *
 * **Chassis only, deliberately.** The LCD palette, the text scale and the UI
 * scale are *not* here. Those are not the shell — a player who reads at LARGE
 * text or in a monochrome screen mode chose that for their eyes, and the
 * device's colour is the only thing this ruling is about.
 *
 * The `--cap-*` tokens ride along because the four moulded caps are part of
 * the shell's paint (S1). The drawn cap *sprites* are a separate seam — they
 * are an image URL rather than a colour, so `DeviceFooter` takes the effective
 * skin id as well.
 */
export function skinCssVars(skin: ChassisSkinId): Record<string, string> {
  const s = CHASSIS_SKINS[skin];
  const lights = SKIN_LIGHTS[skin];
  const vars: Record<string, string> = {
    '--chassis-body': s.body,
    '--chassis-footer': s.footerWash,
    '--chassis-panel': s.panel,
    '--chassis-panel-edge': s.panelEdge,
    '--chassis-grill': s.grill,
    '--chassis-on-body': s.onBody,
    '--chassis-on-body-shadow': s.onBodyShadow,
    '--chassis-pattern': s.bodyPattern ? `url(/chassis/${s.bodyPattern}.png)` : 'none',
    '--chassis-rim-glow': s.rimGlow ?? 'transparent',
    '--chassis-orb': lights.orb,
    '--chassis-orb-glow': lights.orbGlow,
  };
  for (const kind of FOOTER_CAP_KINDS) {
    const cap = footerCap(skin, kind);
    vars[`--cap-${kind}-top`] = cap.top;
    vars[`--cap-${kind}-bottom`] = cap.bottom;
    vars[`--cap-${kind}-edge`] = cap.edge;
    vars[`--cap-${kind}-glyph`] = cap.glyph;
  }
  lights.lamps.forEach((lamp, i) => {
    vars[`--chassis-lamp${i + 1}`] = lamp[0];
    vars[`--chassis-lamp${i + 1}-edge`] = lamp[1];
    vars[`--chassis-lamp${i + 1}-ink`] = lampInk(lamp[1]);
    // The two marquee pill buttons read their own vars since v0.5.0 (the
    // workshop's marqueeLamps axis); on a stock shell they are the trio's
    // outer stops, exactly as before.
    vars[`--pill-lamp${i + 1}`] = lamp[0];
    vars[`--pill-lamp${i + 1}-edge`] = lamp[1];
    vars[`--pill-lamp${i + 1}-ink`] = lampInk(lamp[1]);
  });
  // The marquee phosphor, stock — shadowed here so a workshop marquee never
  // reaches the company site's CLASSIC device.
  vars['--marquee-text'] = '#22c55e';
  vars['--marquee-shadow'] = 'rgba(8, 32, 16, 0.65)';
  vars['--marquee-glow'] = 'rgba(34, 197, 94, 0.16)';
  return vars;
}

/** The shell the company site always wears (v8#4). */
export const SITE_SKIN: ChassisSkinId = 'CLASSIC';

export function applyTheme(): void {
  if (typeof document === 'undefined') return;
  const { skin, lcd, scale, uiScale } = readTheme();
  const s = CHASSIS_SKINS[skin];
  const l = LCD_MODES[lcd];
  const root = document.documentElement;

  // The Device Workshop's part overrides (v0.5.0). Each resolves
  // `part ?? skin.*` — the web twin of iOS's `ChassisLook`, and for its
  // reason: one resolver, so an unknown stored colour falls back to the
  // shell in one place rather than at every read.
  const build = activeBuild();
  const buttonsPart = partColorOf(build.buttons);
  const orbPart = partColorOf(build.orb);
  const headerLampsPart = partColorOf(build.headerLamps);
  const marqueePart = partColorOf(build.marquee);
  const marqueeLampsPart = partColorOf(build.marqueeLamps);
  const grillePart = partColorOf(build.grilleColor);
  const fontPart = partColorOf(build.font);

  root.style.setProperty('--chassis-body', s.body);
  root.style.setProperty('--chassis-footer', s.footerWash);
  root.style.setProperty('--chassis-panel', s.panel);
  root.style.setProperty('--chassis-panel-edge', s.panelEdge);
  root.style.setProperty('--chassis-grill', grillePart ? PART_COLOR_BASE[grillePart] : s.grill);
  root.style.setProperty('--chassis-on-body', s.onBody);
  root.style.setProperty('--chassis-on-body-shadow', s.onBodyShadow);
  root.style.setProperty('--chassis-pattern', s.bodyPattern ? `url(/chassis/${s.bodyPattern}.png)` : 'none');
  root.style.setProperty('--chassis-rim-glow', s.rimGlow ?? 'transparent');
  root.dataset.translucent = s.translucent ? 'on' : 'off';

  // The four footer caps (S1). Four properties each, so the band's buttons
  // are painted by the skin like every other moulded part -- see `footerCap`
  // for why this is one path rather than four. A fitted FOOTER BUTTONS part
  // replaces a console livery's whole set outright, per iOS's rule: the
  // alternative is a device whose buttons are five colours.
  for (const kind of FOOTER_CAP_KINDS) {
    const cap = buttonsPart
      ? (kind === 'home' ? partHomeCap(buttonsPart) : partControl(buttonsPart))
      : footerCap(skin, kind);
    root.style.setProperty(`--cap-${kind}-top`, cap.top);
    root.style.setProperty(`--cap-${kind}-bottom`, cap.bottom);
    root.style.setProperty(`--cap-${kind}-edge`, cap.edge);
    root.style.setProperty(`--cap-${kind}-glyph`, cap.glyph);
  }

  // Orb + status lamps (iOS v0.6.x per-skin lighting).
  const lights = SKIN_LIGHTS[skin];
  root.style.setProperty('--chassis-orb', orbPart ? partOrb(orbPart) : lights.orb);
  root.style.setProperty('--chassis-orb-glow', orbPart ? partOrbGlow(orbPart) : lights.orbGlow);
  const headerTrio = headerLampsPart ? partLampTrio(headerLampsPart) : lights.lamps;
  headerTrio.forEach((lamp, i) => {
    root.style.setProperty(`--chassis-lamp${i + 1}`, lamp[0]);
    root.style.setProperty(`--chassis-lamp${i + 1}-edge`, lamp[1]);
    // The engraved-legend stop for the two marquee lamp buttons. Written for
    // all three even though only the outer two are pilled, because a table
    // with a hole in it is a table somebody indexes wrong.
    root.style.setProperty(`--chassis-lamp${i + 1}-ink`, lampInk(lamp[1]));
  });
  // The two pill buttons take their own axis, falling back to the SHELL's
  // trio, not the header row's — iOS's own rule, so recolouring the header
  // cannot silently repaint two buttons at the other end of the device.
  const pillTrio = marqueeLampsPart ? partLampTrio(marqueeLampsPart) : lights.lamps;
  pillTrio.forEach((lamp, i) => {
    root.style.setProperty(`--pill-lamp${i + 1}`, lamp[0]);
    root.style.setProperty(`--pill-lamp${i + 1}-edge`, lamp[1]);
    root.style.setProperty(`--pill-lamp${i + 1}-ink`, lampInk(lamp[1]));
  });

  // The marquee phosphor. Stock is the CLASSIC green the footer has always
  // drawn; a fitted MARQUEE part re-lights the panel in its own colour, with
  // the letter shadow the very dark form of the same phosphor (iOS's
  // `marqueeShadow` derivation) and the glass glow the phosphor at the glass's
  // own 16%.
  if (marqueePart) {
    const text = partMarqueeText(marqueePart);
    root.style.setProperty('--marquee-text', text);
    root.style.setProperty('--marquee-shadow', partMarqueeShadow(marqueePart));
    root.style.setProperty('--marquee-glow', `color-mix(in srgb, ${text} 16%, transparent)`);
  } else {
    root.style.setProperty('--marquee-text', MARQUEE_STOCK.text);
    root.style.setProperty('--marquee-shadow', MARQUEE_STOCK.shadow);
    root.style.setProperty('--marquee-glow', MARQUEE_STOCK.glow);
  }

  // The grille pattern, as a data attribute for anything CSS-side; the drawn
  // slats are a component (`ChassisGrille`) that reads `grilleShape()`.
  root.dataset.grille = grilleShapeOf(build.grilleShape).toLowerCase();

  root.style.setProperty('--lcd-screen', l.screen);
  root.style.setProperty('--lcd-page', l.page);
  // The FONT axis (v0.5.0): a fitted ink replaces the mode's primary text
  // colour — with iOS's two guards, both load-bearing. A single-phosphor
  // screen sets the ink itself (the tint owns every colour on it), and an
  // ink that does not read on this ground is refused rather than applied, so
  // the unreadable device is not reachable — including by choosing an ink on
  // a dark screen and then switching to a pale one.
  const fontInkApplies = fontPart !== null && l.monochromeTint === null && readsAsInk(fontPart, l.isLight);
  root.style.setProperty('--lcd-text', fontInkApplies ? PART_COLOR_BASE[fontPart] : l.text);
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
  root.style.setProperty('--ui-scale', String(UI_SCALES[uiScale].factor));

  // Monochrome phosphor pass: a tint drives `.lcd-themed`'s grayscale filter and
  // the multiply overlay in DeviceLayout. Colour modes clear both.
  root.style.setProperty('--mono-tint', l.monochromeTint ?? 'transparent');
  root.style.setProperty('--lcd-grayscale', l.monochromeTint ? 'grayscale(1)' : 'none');

  // Lets plain CSS and any future `prefers-color-scheme` styling branch on the
  // screen mode without reading localStorage again.
  root.dataset.lcd = lcd.toLowerCase();
  root.dataset.skin = skin.toLowerCase();
  root.dataset.mono = l.monochromeTint ? 'on' : 'off';

  /**
   * The mode's own `isLight` flag, as an attribute (v0.4.0, m2).
   *
   * `data-lcd` alone cannot answer "is this a pale page": four of the nine
   * modes are light and only one of them is called LIGHT. (The count was
   * miswritten as "five" here through v0.4.2 and propagated into comments and
   * the ledger — `isLight: true` is exactly LIGHT, VINTAGE, WINE.OS and
   * GRÜNERBOY.) `index.css` used to
   * carry a rule keyed on `[data-lcd="light"]` that softens the grid wash so
   * it does not read as dirt on a white page -- a rule that therefore did
   * nothing on VINTAGE, WINE.OS or GRUNERBOY, the other three with exactly
   * the same problem. Rather than repeat the mistake for the v0.4.0 tile liveries,
   * whose light half is a seven-row table, the flag that already decides this
   * in TypeScript is published for CSS to branch on. (Stage 3 moved the grid
   * wash onto this flag too — v9#d1, closed.)
   *
   * Written as a string because that is what `dataset` stores; the selector
   * is `[data-lcd-light='true']`.
   */
  root.dataset.lcdLight = String(l.isLight);
}

export function subscribeToTheme(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

export function themeRevision(): number {
  return revision;
}

