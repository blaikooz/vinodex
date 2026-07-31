import React from 'react';
import { Icon as IconifyIcon } from '@iconify/react';
import iconManifest from '../data/iconManifest.json';

/**
 * The ~104-icon set vinodex-ios already rasterizes to local PNGs — see
 * `vinodex-ios/scripts/rasterize-icons.sh`. `iconManifest.json` here is a
 * direct copy of that repo's generated `icons.json` (read-only reference,
 * regenerated there, not authored here); `public/icons/*.png` is a copy of
 * its `Resources/Icons/*.png` output. Neither vinodex-ios nor shared/ are
 * touched to produce this — these are copies of already-generated output.
 */
const OFFLINE_ICONS: ReadonlySet<string> = new Set(
  (iconManifest as { unique: string[] }).unique
);

const slugFor = (icon: string) => icon.replace(':', '--');

export interface LocalIconProps {
  icon: string;
  width?: number | string;
  height?: number | string;
  color?: string;
  style?: React.CSSProperties;
  className?: string;
}

/**
 * Drop-in replacement for `@iconify/react`'s `<Icon>`, scoped to the offline
 * set above. Renders the bundled PNG as a CSS mask, tinted via
 * `background-color` — the same trick `entryIconVisuals.tsx` already used
 * for shaped flags — so a glyph stays tintable at runtime the way the live
 * Iconify SVG was, without a network round trip.
 *
 * Icon keys outside the offline set (moon-dial's botanical glyphs, a handful
 * of ad hoc fallbacks that were never in iOS's curated manifest) fall back to
 * the live Iconify component below — identical to today's behavior, so nothing
 * regresses for the keys this pass doesn't cover.
 */
export function Icon({ icon, width, height, color, style, className }: LocalIconProps) {
  // `art:`-prefixed ids are the bundled full-colour pixel art (ClassArt —
  // globes, outlines, soils, climate/colour/class tiles). They carry their own
  // colours and outline, so they render as a plain <img>, no mask, no tint.
  if (icon.startsWith('art:')) {
    const stem = icon.slice(4);
    return (
      <img
        src={`/art/class/${stem}.png`}
        alt=""
        width={width as number | undefined}
        height={height as number | undefined}
        draggable={false}
        className={className}
        style={{
          width: width ?? '1em',
          height: height ?? '1em',
          objectFit: 'contain',
          imageRendering: 'pixelated',
          display: 'inline-block',
          ...style,
          color: undefined,
        }}
      />
    );
  }

  if (!OFFLINE_ICONS.has(icon)) {
    return (
      <IconifyIcon
        icon={icon}
        width={width}
        height={height}
        color={color}
        style={style}
        className={className}
      />
    );
  }

  const slug = slugFor(icon);
  const maskUrl = `url(/icons/${slug}@3x.png)`;
  const tint = color ?? style?.color ?? 'currentColor';

  return (
    <span
      className={className}
      role="img"
      aria-label={icon}
      style={{
        display: 'inline-block',
        width: width ?? '1em',
        height: height ?? '1em',
        backgroundColor: tint,
        WebkitMaskImage: maskUrl,
        maskImage: maskUrl,
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        maskPosition: 'center',
        ...style,
      }}
    />
  );
}

export default Icon;
