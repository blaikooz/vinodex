import { Icon } from '../components/LocalIcon';
import type { ClimateClass } from '@/shared/types';

// Full-colour ClassArt (v0.5.7 `art:` ids), resolved by LocalIcon to
// /art/class/climate-*.png.
const CLIMATE_ICON_MAP: Record<ClimateClass, string> = {
  maritime: 'art:climate-maritime',
  continental: 'art:climate-continental',
  cool: 'art:climate-cool',
  warm: 'art:climate-warm',
  mediterranean: 'art:climate-mediterranean',
};

export const getClimateIcon = (climate?: ClimateClass, size: number = 20) => {
  const iconName = climate ? CLIMATE_ICON_MAP[climate] : undefined;
  return <Icon icon={iconName || 'game-icons:cloud'} width={size} height={size} />;
};
