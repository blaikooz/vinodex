import React from 'react';
import { Globe, Wine } from 'lucide-react';
import DeviceLayout from './DeviceLayout';

interface SplashScreenProps {
  onEnterDex: () => void;
  onEnterWebsite: () => void;
}

/**
 * The landing fork: DEX enters the encyclopedia, WEBSITE opens the company
 * portal (OUR APPS / WHO WE ARE / CONTACT US / DATA).
 *
 * Rendered inside `DeviceLayout` rather than as a plain page, because the
 * splash is the first thing anyone sees and the handheld chassis *is* the
 * product's identity — a generic centred landing page would read as a
 * different site that happens to link to this one.
 *
 * No Home button: `DeviceLayout` only renders one when given `onHome`, and
 * Home is an in-app control. There is nowhere above the splash to go.
 */
const SplashScreen: React.FC<SplashScreenProps> = ({ onEnterDex, onEnterWebsite }) => {
  return (
    <DeviceLayout title="VINODEX" subtitle="" showBack={false} showSystemButtons={false} showWordmark>
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

          {/*
            The PNG, not `vinodex-logo.svg`. That SVG is a blocky one-glyph
            mark — it reads as an H rather than as the wordmark, which is
            wrong for the one screen whose job is to say what this is.
          */}
          {/*
            Rounded to match the mark's own artwork: the SVG version draws its
            red plate with `rx="92"` on a 512 box — 18% — so the PNG gets the
            same proportion rather than sitting as a hard square.
          */}
          <img
            src="/vinodex-logo.png"
            alt="VINODEX"
            className="w-40 sm:w-56 max-w-full shrink-0 rounded-[18%] shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
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
              Live now: opens the company portal. Same tile language as DEX so
              the two forks read as one product.
            */}
            <button
              type="button"
              onClick={onEnterWebsite}
              className="flex-1 min-h-[7rem] bg-green-500 border-b-[6px] border-green-700 rounded-xl shadow-lg active:translate-y-1 active:border-b-0 transition-all flex flex-col items-center justify-center group hover:bg-green-400 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
              <Globe size={48} className="text-white mb-2 group-hover:scale-110 transition-transform drop-shadow-md" />
              <span className="font-retro text-sm sm:text-xl text-white tracking-widest drop-shadow-md">WEBSITE</span>
            </button>

          </div>
        </div>

      </div>
    </DeviceLayout>
  );
};

export default SplashScreen;
