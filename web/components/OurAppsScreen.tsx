import React from 'react';
import { ChevronRight, Lock, LockOpen, Construction } from 'lucide-react';
import DeviceLayout from './DeviceLayout';
import { isAppUnlocked } from '../src/services/appUnlock';
import { useAppUnlock } from '../src/services/useAppUnlock';

interface OurAppsScreenProps {
  onSelectVinodex: () => void;
  onBack: () => void;
  onHome: () => void;
}

/**
 * The shelf: one app today, and an honest placeholder for the rest.
 *
 * A list rather than the tile grid the dex uses for categories. Tiles work when
 * the items are peers of equal weight; here there is one real app and one
 * "not yet", and a grid would give the placeholder the same visual claim as the
 * thing that actually opens. A row can carry a name, a blurb and a lock state
 * side by side, which is what distinguishes the two.
 *
 * The lock badge is drawn from the unlock store rather than passed in, so the
 * row is right the moment the code is accepted — see `appUnlock`.
 */
const OurAppsScreen: React.FC<OurAppsScreenProps> = ({ onSelectVinodex, onBack, onHome }) => {
  // Subscribes to the store; the value is a change signal only.
  useAppUnlock();
  const unlocked = isAppUnlocked('vinodex');

  return (
    <DeviceLayout
      title="OUR APPS"
      subtitle=""
      showBack={true}
      onBack={onBack}
      onHome={onHome}
      centerHeaderText={true}
      showSystemButtons={false}
    >
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar bg-stone-950 p-3">
        <div className="flex flex-col gap-3">

          <button
            onClick={onSelectVinodex}
            className="w-full flex items-center gap-3 rounded-xl bg-stone-900 border-2 border-green-700 p-3 text-left transition-all active:translate-y-0.5 hover:bg-stone-800 group"
          >
            <img
              src="/vinodex-logo.png"
              alt=""
              aria-hidden="true"
              /* 18%, the radius the mark's own SVG plate uses — see SplashScreen. */
              className="w-14 h-14 shrink-0 rounded-[18%] object-contain shadow-[0_2px_6px_rgba(0,0,0,0.5)]"
            />
            <span className="flex-1 min-w-0 flex flex-col gap-1">
              <span className="font-retro text-xs sm:text-sm tracking-widest text-green-300">
                VINODEX
              </span>
              <span className="font-mono text-[0.65rem] sm:text-xs text-green-500 leading-relaxed normal-case">
                A wine encyclopedia that looks like a 90s handheld.
              </span>
              <span
                className={`font-retro text-[0.55rem] tracking-widest flex items-center gap-1 ${
                  unlocked ? 'text-green-400' : 'text-yellow-400'
                }`}
              >
                {unlocked ? <LockOpen size={11} /> : <Lock size={11} />}
                {unlocked ? 'UNLOCKED' : 'LOCKED'}
              </span>
            </span>
            <ChevronRight
              size={20}
              className="shrink-0 text-green-500 group-hover:translate-x-0.5 transition-transform"
            />
          </button>

          {/*
            Inert by design, and `disabled` rather than a no-op handler so it is
            inert to the keyboard and to assistive tech too — the same treatment
            the splash gives its not-built-yet button.
          */}
          <div
            aria-disabled="true"
            className="w-full flex items-center gap-3 rounded-xl bg-stone-900 border-2 border-dashed border-stone-600 p-3 opacity-60"
          >
            <span className="w-14 h-14 shrink-0 rounded-[18%] bg-stone-800 flex items-center justify-center">
              <Construction size={26} className="text-stone-400" />
            </span>
            <span className="flex-1 min-w-0 flex flex-col gap-1">
              <span className="font-retro text-xs sm:text-sm tracking-widest text-stone-300">
                MORE APPS
              </span>
              <span className="font-retro text-[0.55rem] tracking-widest text-amber-300/90">
                COMING SOON
              </span>
            </span>
          </div>

        </div>
      </div>
    </DeviceLayout>
  );
};

export default OurAppsScreen;
