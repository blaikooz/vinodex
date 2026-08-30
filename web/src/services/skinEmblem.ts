import type React from 'react';
import {
  Calculator, Cog, Cpu, Diamond, Gamepad, Gamepad2, Gift, Grid2x2, Heart, Leaf, Moon, MoonStar,
  Package, PartyPopper, PenTool, Sparkles, TreePine, TriangleAlert, Wine, Zap,
} from 'lucide-react';
import { SkinPumpkin, SkinSigil, type SkinMarkProps } from '../../components/SkinMarks';
import type { ChassisSkinId } from './theme';

/** What a tile can render: a lucide icon or one of our own drawn marks. */
export type SkinEmblemComponent = React.ComponentType<SkinMarkProps>;

/**
 * The glyph each shell carries in the skin picker — iOS `ChassisSkin.symbol`
 * (v0.9.2) mapped to the nearest lucide mark, so `SkinPreviewTile` reads like
 * `ChassisMockup` + `SkinEmblem` rather than the sticker sheet (v0.6.30).
 * PSVINO and HALLOWEEN carry the two drawn marks (iOS `drawnMark`,
 * web v0.6.47) -- a mark of our own where a borrowed one would not do.
 */
export const SKIN_EMBLEM: Record<ChassisSkinId, SkinEmblemComponent> = {
  CLASSIC: Gamepad2,
  MIDNIGHT: Moon,
  ORIGINAL: Sparkles,
  BURGUNDY: Diamond,
  RIESLING: Zap,
  VINHO_VERDE: Package,
  GLOUGLOU: Wine,
  SMART_GRAPE: Calculator,
  CHAMPAGNE: PartyPopper,
  CHRISTMAS: Gift,
  NOUVEAU: Cpu,
  OAKED: TreePine,
  NOCTURNE: MoonStar,
  STEEL: Cog,
  BLUSH: Heart,
  PSVINO: SkinSigil,
  GRIS_DE_GRIS: Gamepad,
  ORANGE_WINE: TriangleAlert,
  PET_NAT: PenTool,
  WALDGLAS: Leaf,
  HALLOWEEN: SkinPumpkin,
  W64: Grid2x2,
};
