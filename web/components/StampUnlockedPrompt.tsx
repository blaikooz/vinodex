import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { Badge } from '../src/services/passport';
import { PassportTier } from '../src/services/passportTier';
import { BADGE_ICON, BADGE_TINT } from './badgeVisuals';

/**
 * The celebration cards, ported from
 * `vinodex-ios/Sources/VinodexUI/StampUnlockedPrompt.swift` (0.7.1 D2,
 * 0.8.7 D1) — v6#17. One card at a time — a queue of stamps advances on
 * NICE rather than stacking, and a rank-up shows the rung it announces.
 */
export interface Celebration {
  kind: 'stamp' | 'tier';
  badge?: Badge;
  tier?: PassportTier;
}

interface StampUnlockedPromptProps {
  celebration: Celebration;
  onDismiss: () => void;
}

const StampUnlockedPrompt: React.FC<StampUnlockedPromptProps> = ({ celebration, onDismiss }) => {
  const isTier = celebration.kind === 'tier' && celebration.tier;
  const badge = celebration.badge;
  const Icon = badge ? BADGE_ICON[badge.id] : ShieldCheck;
  const tint = isTier ? '#eab308' : badge ? BADGE_TINT[badge.id] : '#22c55e';

  return (
    <div
      className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-6"
      role="dialog"
      aria-modal="true"
      aria-label={isTier ? 'Rank up' : 'Stamp earned'}
    >
      <div className="w-full max-w-xs bg-stone-900 border-2 rounded-lg p-5 flex flex-col items-center gap-3 text-center" style={{ borderColor: tint }}>
        <p className="font-retro text-xs tracking-widest" style={{ color: tint }}>
          {isTier ? 'RANK UP' : 'STAMP EARNED'}
        </p>
        <Icon size={44} color={tint} />
        <p className="font-retro text-sm tracking-widest text-stone-100">
          {isTier ? celebration.tier!.name : badge?.title}
        </p>
        <p className="font-mono text-sm text-stone-300 normal-case">
          {isTier ? celebration.tier!.blurb : badge?.blurb}
        </p>
        {!isTier && <p className="font-retro text-[0.5rem] tracking-widest text-stone-500">ADDED TO YOUR COLLECTION.</p>}
        <button
          onClick={onDismiss}
          className="w-full mt-1 rounded-xl bg-green-600 border-b-4 border-green-800 active:translate-y-0.5 px-5 py-3 font-retro text-[0.6rem] tracking-widest text-white"
        >
          NICE
        </button>
      </div>
    </div>
  );
};

export default StampUnlockedPrompt;
