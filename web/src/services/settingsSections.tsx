import React from 'react';
import { Palette, BarChart3, Lock, Bug, SlidersHorizontal } from 'lucide-react';

/**
 * The settings section vocabulary, in its own module.
 *
 * It lived in `SettingsPanel.tsx`, which `App.tsx` both **statically**
 * imported (for these two exports) and **lazily** imported (for the panels).
 * Vite warned on every build and, more to the point, the static edge won: the
 * SettingsPanel chunk never split, so the whole panel rode in the entry
 * bundle and the `lazy()` around it bought nothing. Moving the constants is
 * the whole fix, and it is also the first cut of the standing decomposition
 * note — `SettingsPanel.tsx` had grown past 1,250 lines.
 *
 * The ids are persisted vocabulary (routes, the marquee pin table); they are
 * never renamed.
 */
export type SettingsSectionId = 'CUSTOMIZE' | 'SETTINGS' | 'DATA' | 'ACCESS' | 'DEV';

export const SETTINGS_SECTIONS: {
  id: SettingsSectionId;
  icon: React.ReactNode;
  tint: string;
  border: string;
  /** DEV is developer plumbing, not a setting — reached via a button, not a tile. */
  hidden?: boolean;
}[] = [
  { id: 'CUSTOMIZE', icon: <Palette size={30} />, tint: 'text-red-400', border: 'border-red-800' },
  { id: 'SETTINGS', icon: <SlidersHorizontal size={30} />, tint: 'text-orange-400', border: 'border-orange-800' },
  { id: 'DATA', icon: <BarChart3 size={30} />, tint: 'text-blue-400', border: 'border-blue-800' },
  { id: 'ACCESS', icon: <Lock size={30} />, tint: 'text-yellow-400', border: 'border-yellow-700' },
  { id: 'DEV', icon: <Bug size={30} />, tint: 'text-stone-400', border: 'border-stone-600', hidden: true },
];
