import React from 'react';
import { Construction, Wine } from 'lucide-react';
import DeviceLayout from './DeviceLayout';

interface SplashScreenProps {
  onEnterDex: () => void;
}

/**
 * The landing fork: DEX enters the encyclopedia, WEBSITE is a teaser.
 *
 * Rendered inside `DeviceLayout` rather than as a plain page, because the
 * splash is the first thing anyone sees and the handheld chassis *is* the
 * product's identity — a generic centred landing page would read as a
 * different site that happens to link to this one.
 *
 * No Home button: `DeviceLayout` only renders one when given `onHome`, and
 * Home is an in-app control. There is nowhere above the splash to go.
 */
const SplashScreen: React.FC<SplashScreenProps> = ({ onEnterDex }) => {
  return (
    <DeviceLayout title="VINODEX" subtitle="" showBack={false} showSystemButtons={false}>
      <div className="flex-1 min-h-0 w-full flex flex-col items-center bg-dex-screen relative overflow-hidden">

        {/* Retro grid background — same treatment as the dex menu. */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(50, 255, 50, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(50, 255, 50, 0.3) 1px, transparent 1px)',
            backgroundSize: '30px 30px',
          }}
        />

        <div className="relative w-full h-full z-10 flex flex-col p-6 gap-6 justify-center items-center">

          <img
            src="/vinodex-logo.svg"
            alt="VINODEX"
            className="w-40 sm:w-56 max-w-full shrink-0 drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
          />

          {/* Stacked on a phone, side by side once there is room. */}
          <div className="w-full flex flex-col sm:flex-row gap-4 items-stretch justify-center">

            <button
              onClick={onEnterDex}
              className="flex-1 min-h-[7rem] bg-purple-500 border-b-[6px] border-purple-800 rounded-xl shadow-lg active:translate-y-1 active:border-b-0 transition-all flex flex-col items-center justify-center group hover:bg-purple-400 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
              <Wine size={48} className="text-white mb-2 group-hover:scale-110 transition-transform drop-shadow-md" />
              <span className="font-retro text-sm sm:text-xl text-white tracking-widest drop-shadow-md">DEX</span>
            </button>

            {/*
              Inert by design. `disabled` rather than a click handler that does
              nothing, so it is inert to the keyboard and to assistive tech too
              — and muted hard enough that it reads as "not built yet" rather
              than "broken". No active:translate, because nothing depresses.
            */}
            <button
              type="button"
              disabled
              aria-disabled="true"
              className="flex-1 min-h-[7rem] bg-stone-600/60 border-b-[6px] border-stone-800/70 rounded-xl shadow-lg flex flex-col items-center justify-center relative overflow-hidden opacity-60 cursor-not-allowed"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
              <Construction size={44} className="text-stone-300 mb-2 drop-shadow-md" />
              <span className="font-retro text-sm sm:text-xl text-stone-200 tracking-widest drop-shadow-md">WEBSITE</span>
              <span className="font-retro text-[0.6rem] sm:text-xs text-amber-300/90 tracking-widest mt-1">
                COMING SOON
              </span>
            </button>

          </div>
        </div>

      </div>
    </DeviceLayout>
  );
};

export default SplashScreen;
