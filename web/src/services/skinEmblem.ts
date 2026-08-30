import {
  BadgeCheck, Calculator, CloudMoon, Cog, Cpu, Diamond, Gamepad, Gamepad2, Gift, Grid2x2, Heart, Leaf, Moon, MoonStar,
  Package, PartyPopper, PenTool, Sparkles, TreePine, TriangleAlert, Wine, Zap, type LucideIcon,
} from 'lucide-react';
import type { ChassisSkinId } from './theme';

/**
 * The glyph each shell carries in the skin picker — iOS `ChassisSkin.symbol`
 * (v0.9.2) mapped to the nearest lucide mark, so `SkinPreviewTile` reads like
 * `ChassisMockup` + `SkinEmblem` rather than the sticker sheet (v0.6.30).
 * PSVINO's drawn sigil has no lucide twin; the seal stands in.
 */
export const SKIN_EMBLEM: Record<ChassisSkinId, LucideIcon> = {
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
  PSVINO: BadgeCheck,
  GRIS_DE_GRIS: Gamepad,
  ORANGE_WINE: TriangleAlert,
  PET_NAT: PenTool,
  WALDGLAS: Leaf,
  HALLOWEEN: CloudMoon,
  W64: Grid2x2,
};
