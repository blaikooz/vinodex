import type { ChassisSkinId, LcdModeId } from './theme';

/**
 * The grouped pickers (iOS 0.7.0 B1/B2, web v0.6.46): "Twenty-two shells in
 * one flat grid is a swatch book, not a range." The membership is iOS's own
 * partition -- `ChassisSkinSection` / `LcdModeSection` -- translated to web
 * ids, and `pickerSections.test.ts` holds each list as a true partition of
 * its table: no shell can be dropped from the picker by being left off a
 * list, and none can appear twice.
 */
export const SKIN_SECTIONS: readonly { title: string; skins: readonly ChassisSkinId[] }[] = [
  // The house device and the two shells that are variations on it.
  { title: 'CLASSIC', skins: ['CLASSIC', 'MIDNIGHT', 'ORIGINAL'] },
  // Named for what is in the glass.
  { title: 'WINES', skins: ['BURGUNDY', 'NOCTURNE', 'CHAMPAGNE'] },
  // Named for what the wine is kept in -- cask, tank, bottle.
  { title: 'VESSEL', skins: ['OAKED', 'STEEL', 'PET_NAT'] },
  // The consumer-hardware homages.
  { title: 'RETROFIT', skins: ['VINHO_VERDE', 'PSVINO', 'GRIS_DE_GRIS', 'RIESLING', 'SMART_GRAPE', 'ORANGE_WINE', 'W64'] },
  // The translucent shells, mock internals showing through.
  { title: 'CLEARTECH', skins: ['GLOUGLOU', 'NOUVEAU', 'WALDGLAS'] },
  // Seasonal in theme only -- a skin that vanished in January would be a bug.
  { title: 'FESTIVE', skins: ['CHRISTMAS', 'BLUSH', 'HALLOWEEN'] },
];

export const LCD_SECTIONS: readonly { title: string; modes: readonly LcdModeId[] }[] = [
  // The house themes: no conceit beyond light and dark.
  { title: 'CLASSIC', modes: ['DARK', 'LIGHT'] },
  // Period display hardware -- monochrome by construction, not by palette.
  { title: 'RETRO', modes: ['AMBER', 'VINTAGE', 'TERMINAL', 'GRUENER_BOY'] },
  // Modes that quote one specific machine's screen.
  { title: 'EMULATOR', modes: ['STAR_TREK', 'BLUE_SCREEN', 'WINE_OS'] },
];
