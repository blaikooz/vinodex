import React from 'react';
import { Icon } from '../src/components/LocalIcon';
import { resolveFlavorIcon } from '@/shared/services/flavorIcon';

/**
 * A flavour note's glyph, resolved from its name and its parent flavour.
 *
 * **Typed since W16** — this was the last `.jsx` in the repo, so its four
 * props were invisible to `tsc --noEmit` and to every editor. Nothing about
 * the behaviour changes; the shape is the one both call sites in
 * `entryIconVisuals.tsx` were already passing.
 *
 * The raw lookup-table re-exports (`FLAVOR_ICON_MAP`, `FLAVOR_NAME_ICON_MAP`)
 * were removed with the v0.9.x shared master cleanup — the maps no longer
 * exist there and nothing here imported them; `resolveFlavorIcon` is the API
 * both apps use now (v6#1 repair, IOS-PARITY-v6.md).
 */
export interface FlavorIconProps {
  /** The parent flavour entry's name, used when the note itself is unmapped. */
  flavor?: string;
  /** The tasting note's own name — the first thing tried. */
  name?: string;
  className?: string;
  style?: React.CSSProperties;
}

const FlavorIcon: React.FC<FlavorIconProps> = ({ flavor, name, className, style }) => {
  const iconName = resolveFlavorIcon(name, flavor);
  return <Icon icon={iconName} className={className} style={style} />;
};

export default FlavorIcon;
