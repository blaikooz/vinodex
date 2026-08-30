import type { ChassisSkinId } from './theme';

/**
 * The die-cut sticker each shell ships with (`/art/sticker/*.png`) -- iOS
 * `ChassisSkin.stickerStem`, the kebab form of the skin id. Two shells have
 * no drawn sticker on either platform (v6#2): ORANGE WINE and WINE XMAS.
 * Shown on the back plate (v0.6.42); the picker stopped wearing these in
 * v0.6.30 when the emblem tiles landed.
 */
const STICKERLESS: ReadonlySet<ChassisSkinId> = new Set(['ORANGE_WINE', 'CHRISTMAS'] as ChassisSkinId[]);

export const skinStickerStem = (id: ChassisSkinId): string | null =>
  STICKERLESS.has(id) ? null : `sticker-${id.toLowerCase().replace(/_/g, '-')}`;
