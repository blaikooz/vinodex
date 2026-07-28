import React from 'react';
import { Circle, Cloud, Flame, Mountain } from 'lucide-react';
import type { ClimateClass } from '@/shared/types';

export interface SoilIconVisual {
  icon: React.ReactNode;
  color: string;
}

export const getSoilIcon = (soil: string): SoilIconVisual => {
  const s = soil.toLowerCase();
  if (s.includes('volcanic')) return { icon: <Flame size={16} />, color: '#FF4500' };
  if (s.includes('clay')) return { icon: <Circle size={16} />, color: '#8B4513' };
  if (s.includes('sand')) return { icon: <Cloud size={16} />, color: '#F4A460' };
  if (s.includes('limestone') || s.includes('chalk')) return { icon: <Mountain size={16} />, color: '#E0E0E0' };
  if (s.includes('slate') || s.includes('schist')) return { icon: <Mountain size={16} />, color: '#708090' };
  if (s.includes('granite')) return { icon: <Mountain size={16} />, color: '#A9A9A9' };
  if (s.includes('gravel')) return { icon: <Circle size={16} />, color: '#696969' };
  return { icon: <Mountain size={16} />, color: '#8B4513' };
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
