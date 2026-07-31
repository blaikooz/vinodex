import React, { useState } from 'react';
import { LayoutGrid, Users, Mail, Database, Construction, Delete, ChevronRight, Lock } from 'lucide-react';
import DeviceLayout from './DeviceLayout';

/**
 * The company portal — the WEBSITE fork off the splash, as opposed to the DEX
 * fork that enters the encyclopedia app.
 *
 * It deliberately reuses the handheld chassis and the dex's retro tile styling
 * so the two forks read as one product. The chassis SAVED/SETTINGS system
 * buttons are hidden here (showSystemButtons={false}) because those are in-app
 * controls that have no meaning on the company site; every portal screen offers
 * Back instead.
 *
 * Structure:
 *   /website              PortalHome  — OUR APPS / WHO WE ARE / CONTACT US / DATA
 *   /website/apps         OurAppsList — Vinodex (→ unlock) + "more apps soon"
 *   /website/unlock       UnlockVinodex — code entry (0000 for now) → the dex
 *   /website/who-we-are   WhoWeAre
 *   /website/contact      ContactUs
 * DATA links straight to the existing data settings screen (/settings/DATA).
 */

const RetroGrid: React.FC = () => (
  <div
    className="absolute inset-0 opacity-10 pointer-events-none"
    style={{
      backgroundImage:
        'linear-gradient(rgba(50, 255, 50, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(50, 255, 50, 0.3) 1px, transparent 1px)',
      backgroundSize: '30px 30px',
    }}
  />
);

/** The code the unlock screen accepts. Placeholder — "0000 for now". */
export const UNLOCK_CODE = '0000';

// ---------------------------------------------------------------------------
// Portal home — four tiles, same language as the dex MainMenu.
// ---------------------------------------------------------------------------

interface PortalHomeProps {
  onBack: () => void;
  onOpenApps: () => void;
  onWhoWeAre: () => void;
  onContactUs: () => void;
  onData: () => void;
}

const tileBase =
  'flex-1 rounded-xl shadow-lg active:translate-y-1 active:border-b-0 transition-all flex flex-col items-center justify-center group relative overflow-hidden';

export const PortalHome: React.FC<PortalHomeProps> = ({ onBack, onOpenApps, onWhoWeAre, onContactUs, onData }) => (
  <DeviceLayout title="VINODEX" subtitle="" showBack onBack={onBack} showSystemButtons={false}>
    <div className="flex-1 min-h-0 w-full flex flex-col items-center bg-dex-screen relative overflow-hidden">
      <RetroGrid />
      <div className="relative w-full h-full z-10 flex flex-col p-6 gap-4 justify-between">

        <div className="flex gap-4 w-full flex-1 min-h-0">
          <button
            onClick={onOpenApps}
            className={`${tileBase} bg-purple-500 border-b-[6px] border-purple-800 hover:bg-purple-400`}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
            <LayoutGrid size={44} className="text-white mb-2 group-hover:scale-110 transition-transform drop-shadow-md sm:w-14 sm:h-14" />
            <span className="font-retro text-xs sm:text-lg text-white tracking-widest drop-shadow-md">OUR APPS</span>
          </button>

          <button
            onClick={onWhoWeAre}
            className={`${tileBase} bg-green-500 border-b-[6px] border-green-700 hover:bg-green-400`}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
            <Users size={44} className="text-white mb-2 group-hover:scale-110 transition-transform drop-shadow-md sm:w-14 sm:h-14" />
            <span className="font-retro text-xs sm:text-lg text-white tracking-widest drop-shadow-md text-center leading-tight">WHO WE<br />ARE</span>
          </button>
        </div>

        <div className="flex gap-4 w-full flex-1 min-h-0">
          <button
            onClick={onContactUs}
            className={`${tileBase} bg-orange-500 border-b-[6px] border-orange-800 hover:bg-orange-400`}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
            <Mail size={44} className="text-white mb-2 group-hover:scale-110 transition-transform drop-shadow-md sm:w-14 sm:h-14" />
            <span className="font-retro text-xs sm:text-lg text-white tracking-widest drop-shadow-md text-center leading-tight">CONTACT<br />US</span>
          </button>

          <button
            onClick={onData}
            className={`${tileBase} bg-blue-500 border-b-[6px] border-blue-800 hover:bg-blue-400`}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
            <Database size={44} className="text-white mb-2 group-hover:scale-110 transition-transform drop-shadow-md sm:w-14 sm:h-14" />
            <span className="font-retro text-xs sm:text-lg text-white tracking-widest drop-shadow-md">DATA</span>
          </button>
        </div>

      </div>
    </div>
  </DeviceLayout>
);

// ---------------------------------------------------------------------------
// OUR APPS — the app catalogue. Vinodex is live; the rest is a teaser.
// ---------------------------------------------------------------------------

interface OurAppsListProps {
  onBack: () => void;
  onSelectVinodex: () => void;
}

export const OurAppsList: React.FC<OurAppsListProps> = ({ onBack, onSelectVinodex }) => (
  <DeviceLayout title="OUR APPS" subtitle="" showBack onBack={onBack} showSystemButtons={false} centerHeaderText>
    <div className="flex-1 min-h-0 w-full flex flex-col bg-dex-screen relative overflow-hidden">
      <RetroGrid />
      <div className="relative z-10 flex-1 overflow-y-auto p-4 flex flex-col gap-3">

        <button
          onClick={onSelectVinodex}
          className="w-full flex items-center gap-4 p-4 rounded-xl bg-stone-900/80 border-2 border-green-600 active:translate-y-0.5 transition-all group hover:border-green-400"
        >
          <div className="w-14 h-14 shrink-0 rounded-[18%] bg-dex-red flex items-center justify-center overflow-hidden">
            <img src="/vinodex-logo.png" alt="Vinodex" className="w-full h-full object-cover rounded-[18%]" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="font-retro text-sm text-green-300 tracking-widest">VINODEX</div>
            <div className="font-mono text-xs text-stone-400 mt-1">Retro wine encyclopedia</div>
          </div>
          <span className="flex items-center gap-1 shrink-0">
            <Lock size={14} className="text-yellow-400" />
            <ChevronRight size={20} className="text-green-400 group-hover:translate-x-1 transition-transform" />
          </span>
        </button>

        {/* Inert teaser row, same "not built yet" treatment as the splash. */}
        <div
          aria-disabled="true"
          className="w-full flex items-center gap-4 p-4 rounded-xl bg-stone-700/40 border-2 border-stone-700/70 opacity-60 cursor-not-allowed"
        >
          <div className="w-14 h-14 shrink-0 rounded-[18%] bg-stone-600/60 flex items-center justify-center">
            <Construction size={28} className="text-stone-300" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="font-retro text-sm text-stone-200 tracking-widest">MORE APPS</div>
            <div className="font-retro text-[0.6rem] text-amber-300/90 tracking-widest mt-1">COMING SOON</div>
          </div>
        </div>

      </div>
    </div>
  </DeviceLayout>
);

// ---------------------------------------------------------------------------
// Unlock Vinodex — a device-native numeric keypad, no OS keyboard needed.
// ---------------------------------------------------------------------------

interface UnlockVinodexProps {
  onBack: () => void;
  onUnlocked: () => void;
}

export const UnlockVinodex: React.FC<UnlockVinodexProps> = ({ onBack, onUnlocked }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);

  const submit = (full: string) => {
    if (full === UNLOCK_CODE) {
      onUnlocked();
    } else {
      setError(true);
      setCode('');
    }
  };

  const press = (digit: string) => {
    if (code.length >= UNLOCK_CODE.length) return;
    setError(false);
    const next = code + digit;
    setCode(next);
    if (next.length === UNLOCK_CODE.length) {
      // Small settle so the last slot paints filled before the verdict.
      setTimeout(() => submit(next), 120);
    }
  };

  const backspace = () => {
    setError(false);
    setCode(c => c.slice(0, -1));
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return (
    <DeviceLayout title="UNLOCK VINODEX" subtitle="" showBack onBack={onBack} showSystemButtons={false} centerHeaderText>
      <div className="flex-1 min-h-0 w-full flex flex-col items-center bg-dex-screen relative overflow-hidden">
        <RetroGrid />
        <div className="relative z-10 flex-1 w-full flex flex-col items-center justify-center gap-6 p-6">

          <div className="flex flex-col items-center gap-2">
            <Lock size={28} className={error ? 'text-red-400' : 'text-green-400'} />
            <span className="font-retro text-[0.65rem] tracking-widest text-stone-300 text-center">
              ENTER ACCESS CODE
            </span>
          </div>

          {/* Code slots */}
          <div className={`flex gap-3 ${error ? 'animate-pulse' : ''}`}>
            {Array.from({ length: UNLOCK_CODE.length }).map((_, i) => {
              const filled = i < code.length;
              return (
                <div
                  key={i}
                  className={`w-11 h-14 rounded-lg border-2 flex items-center justify-center font-retro text-2xl ${
                    error
                      ? 'border-red-500 text-red-400'
                      : filled
                        ? 'border-green-400 text-green-300'
                        : 'border-stone-600 text-stone-600'
                  } bg-black/40`}
                >
                  {filled ? '•' : ''}
                </div>
              );
            })}
          </div>

          <span className={`font-retro text-[0.6rem] tracking-widest h-4 ${error ? 'text-red-400' : 'text-transparent'}`}>
            WRONG CODE — TRY AGAIN
          </span>

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-3 w-full max-w-[15rem]">
            {keys.map(k => (
              <button
                key={k}
                onClick={() => press(k)}
                className="h-14 rounded-xl bg-stone-800 border-b-4 border-stone-950 active:translate-y-0.5 active:border-b-0 transition-all font-retro text-xl text-green-300 hover:bg-stone-700"
              >
                {k}
              </button>
            ))}
            <span />
            <button
              onClick={() => press('0')}
              className="h-14 rounded-xl bg-stone-800 border-b-4 border-stone-950 active:translate-y-0.5 active:border-b-0 transition-all font-retro text-xl text-green-300 hover:bg-stone-700"
            >
              0
            </button>
            <button
              onClick={backspace}
              aria-label="Delete"
              className="h-14 rounded-xl bg-stone-800 border-b-4 border-stone-950 active:translate-y-0.5 active:border-b-0 transition-all flex items-center justify-center text-stone-300 hover:bg-stone-700"
            >
              <Delete size={22} />
            </button>
          </div>

        </div>
      </div>
    </DeviceLayout>
  );
};

// ---------------------------------------------------------------------------
// Simple content pages. Copy is placeholder — edit freely.
// ---------------------------------------------------------------------------

const InfoPage: React.FC<{ title: string; onBack: () => void; children: React.ReactNode }> = ({ title, onBack, children }) => (
  <DeviceLayout title={title} subtitle="" showBack onBack={onBack} showSystemButtons={false} centerHeaderText>
    <div className="flex-1 min-h-0 w-full flex flex-col bg-dex-screen relative overflow-hidden">
      <RetroGrid />
      <div className="relative z-10 flex-1 overflow-y-auto p-6 font-mono text-sm text-green-200 leading-relaxed space-y-4">
        {children}
      </div>
    </div>
  </DeviceLayout>
);

export const WhoWeAre: React.FC<{ onBack: () => void }> = ({ onBack }) => (
  <InfoPage title="WHO WE ARE" onBack={onBack}>
    <p className="font-retro text-green-300 text-xs tracking-widest">/* PLACEHOLDER COPY */</p>
    <p>
      We build small, characterful apps for people who love wine — starting with
      Vinodex, a retro-handheld encyclopedia of grapes, regions, styles and
      flavors.
    </p>
    <p>
      Our aim is simple: make wine knowledge feel like play. No jargon walls, no
      endless scrolling — just a friendly device you can pick up and explore.
    </p>
    <p className="text-stone-400">
      Replace this with your real story, mission, and team.
    </p>
  </InfoPage>
);

export const ContactUs: React.FC<{ onBack: () => void }> = ({ onBack }) => (
  <InfoPage title="CONTACT US" onBack={onBack}>
    <p className="font-retro text-green-300 text-xs tracking-widest">/* PLACEHOLDER COPY */</p>
    <p>Questions, ideas, or just want to say hello?</p>
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <Mail size={16} className="text-green-400 shrink-0" />
        <a href="mailto:hello@vinodex.app" className="underline decoration-green-600 hover:text-green-100">
          hello@vinodex.app
        </a>
      </div>
    </div>
    <p className="text-stone-400">
      Replace this with your real email, social links, and support details.
    </p>
  </InfoPage>
);
