import React from 'react';
import { Icon } from '../components/LocalIcon';
import type { ClimateClass } from '@/shared/types';

export interface SoilIconVisual {
  icon: React.ReactNode;
  color: string;
}

// The 16 ClassArt soil sprites (v0.5.7 `art:` ids). First stem the soil name
// contains wins; anything unrecognised falls to `default`.
const SOIL_STEMS = [
  'volcanic', 'basalt', 'limestone', 'chalk', 'clay', 'granite', 'gravel', 'laterite',
  'loam', 'loess', 'sand', 'schist', 'shale', 'slate', 'alluvial',
];
const SOIL_COLOR: Record<string, string> = {
  volcanic: '#FF4500', basalt: '#2F4F4F', clay: '#B5651D', loam: '#8B5A2B',
  limestone: '#E0E0E0', chalk: '#E0E0E0', slate: '#708090', schist: '#708090',
  granite: '#A9A9A9', gravel: '#696969', sand: '#F4A460', laterite: '#A0522D',
  loess: '#C2B280', shale: '#5A5A5A', alluvial: '#9B7653', default: '#8B4513',
};

export const getSoilIcon = (soil: string, size = 16): SoilIconVisual => {
  const s = soil.toLowerCase();
  const stem = SOIL_STEMS.find(x => s.includes(x)) ?? 'default';
  return { icon: <Icon icon={`art:soil-${stem}`} width={size} height={size} />, color: SOIL_COLOR[stem] ?? SOIL_COLOR.default! };
};

// Fallback soil triplet keyed by climate, used when a region lacks an
// explicit soilType. Order is significant for display.
const CLIMATE_SOIL_FALLBACK: Record<ClimateClass, [string, string, string]> = {
  maritime: ['Alluvial', 'Clay', 'Sand'],
  continental: ['Limestone', 'Loess', 'Gravel'],
  cool: ['Limestone', 'Slate', 'Alluvial'],
  warm: ['Alluvial', 'Sand', 'Clay'],
  mediterranean: ['Limestone', 'Clay', 'Gravel'],
};

const DEFAULT_SOIL_TRIPLET: [string, string, string] = ['Alluvial', 'Clay', 'Limestone'];

export const getSoilsForRegion = (soilType?: string, climate?: ClimateClass): string[] => {
  if (soilType) {
    return soilType.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 3);
  }
  return climate ? CLIMATE_SOIL_FALLBACK[climate] : DEFAULT_SOIL_TRIPLET;
};
