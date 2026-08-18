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
    displayName: 'SMART GRAPE',
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
type Lamp = [fill: string, edge: string];
const SKIN_LIGHTS: Record<ChassisSkinId, { orb: string; orbGlow: string; lamps: [Lamp, Lamp, Lamp] }> = {
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

export function applyTheme(): void {
  if (typeof document === 'undefined') return;
  const { skin, lcd, scale, uiScale } = readTheme();
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
  root.style.setProperty('--chassis-pattern', s.bodyPattern ? `url(/chassis/${s.bodyPattern}.png)` : 'none');
  root.style.setProperty('--chassis-rim-glow', s.rimGlow ?? 'transparent');
  root.dataset.translucent = s.translucent ? 'on' : 'off';

  // Orb + status lamps (iOS v0.6.x per-skin lighting).
  const lights = SKIN_LIGHTS[skin];
  root.style.setProperty('--chassis-orb', lights.orb);
  root.style.setProperty('--chassis-orb-glow', lights.orbGlow);
  lights.lamps.forEach((lamp, i) => {
    root.style.setProperty(`--chassis-lamp${i + 1}`, lamp[0]);
    root.style.setProperty(`--chassis-lamp${i + 1}-edge`, lamp[1]);
  });

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
}

export function subscribeToTheme(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

export function themeRevision(): number {
  return revision;
}

