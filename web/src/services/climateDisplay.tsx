import { Icon } from '@iconify/react';
import type { ClimateClass } from '@/shared/types';

const CLIMATE_ICON_MAP: Record<ClimateClass, string> = {
  maritime: 'game-icons:big-wave',
  continental: 'game-icons:mountains',
  cool: 'game-icons:snowflake-2',
  warm: 'game-icons:sun',
  mediterranean: 'game-icons:olive',
};

export const getClimateIcon = (climate?: ClimateClass, size: number = 20) => {
  const iconName = climate ? CLIMATE_ICON_MAP[climate] : undefined;
  return <Icon icon={iconName || 'game-icons:cloud'} width={size} height={size} />;
};
