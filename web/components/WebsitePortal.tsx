import React, { useState } from 'react';
import { LayoutGrid, Users, Mail, Database, Delete, ChevronRight, Lock, ArrowUpRight } from 'lucide-react';
import DeviceLayout from './DeviceLayout';

/**
 * The studio's other projects, shown under OUR WORK beneath Vinodex. These are
 * Substack projects. Tapping a row now opens an in-app splash (/website/project/:id)
 * that explains the project before handing off to Substack via CHECK IT OUT —
 * rather than jumping straight out to the external site.
 *
 * This array is the single source of truth for each project's id, list blurb,
 * external URL, and the longer splash description.
 *
 * The `description` copy is paraphrased from each publication's own Substack
 * tagline/about, fetched 2026-08-03:
 *   FOCUSPOND  — https://focuspond.substack.com
 *   VARIED/MIX — https://variedmix.substack.com
 * Both URLs resolved and matched the projects, but they remain best-guess
 * pending Harrison's confirmation. TODO(Harrison): confirm the two Substack URLs.
 */
export interface Project {
  id: string;
  name: string;
  blurb: string;
  /** External destination for CHECK IT OUT. Unused for `locked` projects, which
   *  hand off to the in-app unlock keypad instead. */
  href: string;
  description: string;
  /** Bundled square logo shown in the list row and on the splash. */
  logo: string;
  /** Vinodex: gated behind the access-code keypad rather than opening a URL. */
  locked?: boolean;
}

export const PROJECTS: Project[] = [
  {
    id: 'vinodex',
    name: 'VINODEX',
    blurb: 'Retro wine encyclopedia',
    href: '/website/unlock',
    description:
      'Vinodex is a retro-handheld encyclopedia of wine — hundreds of grapes, regions, styles and flavours to scan, save, and quiz yourself on, all on a device you can pick up and explore. Enter the access code to step inside.',
    logo: '/vinodex-logo.png',
    locked: true,
  },
  {
    id: 'focuspond',
    name: 'FOCUSPOND',
    blurb: 'Paid focus groups & product tests',
    href: 'https://focuspond.substack.com',
    description:
      'FocusPond curates legitimate paid market research — focus groups and product-testing opportunities — so you can earn with your opinion, paired with motivational content to keep you focused on your financial goals.',
    logo: '/projects/focuspond.png',
  },
  {
    id: 'varied-mix',
    name: 'VARIED/MIX',
    blurb: 'A music blog & radio, genre to genre',
    href: 'https://variedmix.substack.com',
    description:
      'varied/mix is a music blog of themed playlists celebrating diverse artists and genres, with live radio broadcasts, extended mixes, and hours of curated music to explore.',
    logo: '/projects/varied-mix.png',
  },
];

/** Look up a project by its route id. Returns undefined for unknown ids. */
export const getProject = (id: string | undefined): Project | undefined =>
  PROJECTS.find(p => p.id === id);

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
 *   /website              PortalHome  — OUR WORK / WHO WE ARE / CONTACT US / DATA
 *   /website/apps         OurAppsList — Vinodex (→ unlock) + Substack projects
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
  <DeviceLayout title="HORIZON/GODOT" subtitle="" showBack onBack={onBack} showSystemButtons={false}>
    <div className="flex-1 min-h-0 w-full flex flex-col items-center bg-dex-screen relative overflow-hidden">
      <RetroGrid />
      <div className="relative w-full h-full z-10 flex flex-col p-6 gap-4">

        {/* Studio title. */}
        <div className="text-center shrink-0">
          <h1
            className="font-retro text-xl sm:text-3xl tracking-widest text-green-300 leading-none"
            style={{ textShadow: '2px 2px 0 rgba(8,32,16,0.6)' }}
          >
            HORIZON/GODOT
          </h1>
          <p className="font-mono text-[0.55rem] sm:text-xs tracking-[0.3em] text-stone-400 mt-1.5">
            CREATING ACROSS MULTITUDES
          </p>
        </div>

        <div className="flex gap-4 w-full flex-1 min-h-0">
          <button
            onClick={onOpenApps}
            className={`${tileBase} bg-purple-500 border-b-[6px] border-purple-800 hover:bg-purple-400`}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
            <LayoutGrid size={44} className="text-white mb-2 group-hover:scale-110 transition-transform drop-shadow-md sm:w-14 sm:h-14" />
            <span className="font-retro text-xs sm:text-lg text-white tracking-widest drop-shadow-md">OUR WORK</span>
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
// OUR WORK — Vinodex (the app, behind the unlock) plus the studio's Substacks.
// ---------------------------------------------------------------------------

interface OurAppsListProps {
  onBack: () => void;
  onSelectProject: (id: string) => void;
}

export const OurAppsList: React.FC<OurAppsListProps> = ({ onBack, onSelectProject }) => (
  <DeviceLayout title="OUR WORK" subtitle="" showBack onBack={onBack} showSystemButtons={false} centerHeaderText>
    <div className="flex-1 min-h-0 w-full flex flex-col bg-dex-screen relative overflow-hidden">
      <RetroGrid />
      <div className="relative z-10 flex-1 overflow-y-auto p-4 flex flex-col gap-3">

        {/* Every project — the locked Vinodex app plus the studio's Substacks —
            opens its own in-app splash first (CHECK IT OUT hands off from there). */}
        {PROJECTS.map(p => (
          <button
            key={p.id}
            onClick={() => onSelectProject(p.id)}
            className={`w-full flex items-center gap-4 p-4 rounded-xl bg-stone-900/80 border-2 active:translate-y-0.5 transition-all group ${p.locked ? 'border-green-600 hover:border-green-400' : 'border-stone-700 hover:border-green-500'}`}
          >
            <div className="w-14 h-14 shrink-0 rounded-[18%] bg-white flex items-center justify-center overflow-hidden">
              <img src={p.logo} alt={p.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="font-retro text-sm text-green-300 tracking-widest">{p.name}</div>
              <div className="font-mono text-xs text-stone-400 mt-1">{p.blurb}</div>
            </div>
            <span className="flex items-center gap-1 shrink-0">
              {p.locked && <Lock size={14} className="text-yellow-400" />}
              <ChevronRight size={20} className="text-green-400 group-hover:translate-x-1 transition-transform" />
            </span>
          </button>
        ))}

      </div>
    </div>
  </DeviceLayout>
);

// ---------------------------------------------------------------------------
// Project splash — an in-app intro for a Substack project. Explains the project
// in the portal's retro chrome, then hands off to Substack via CHECK IT OUT.
// ---------------------------------------------------------------------------

interface ProjectSplashProps {
  project: Project;
  onBack: () => void;
  /** Locked projects (Vinodex) route CHECK IT OUT to the unlock keypad. */
  onUnlock: () => void;
}

const checkOutClass =
  'inline-flex items-center gap-2 px-6 py-4 rounded-xl bg-green-500 border-b-4 border-green-700 active:translate-y-0.5 active:border-b-0 transition-all font-retro text-sm tracking-widest text-white hover:bg-green-400 shadow-lg';

export const ProjectSplash: React.FC<ProjectSplashProps> = ({ project, onBack, onUnlock }) => (
  <DeviceLayout title={project.name} subtitle="" showBack onBack={onBack} showSystemButtons={false} centerHeaderText>
    <div className="flex-1 min-h-0 w-full flex flex-col bg-dex-screen relative overflow-hidden">
      <RetroGrid />
      <div className="relative z-10 flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center gap-6 text-center">

        <div className="w-24 h-24 shrink-0 rounded-[18%] bg-white flex items-center justify-center overflow-hidden shadow-lg">
          <img src={project.logo} alt={project.name} className="w-full h-full object-cover" />
        </div>

        <div className="space-y-2">
          <h2 className="font-retro text-lg text-green-300 tracking-widest">{project.name}</h2>
          <p className="font-retro text-[0.6rem] tracking-widest text-stone-400 uppercase">{project.blurb}</p>
        </div>

        <p className="font-mono text-sm text-green-200 leading-relaxed max-w-prose">
          {project.description}
        </p>

        {project.locked ? (
          // Vinodex: CHECK IT OUT opens the access-code keypad, not a URL.
          <button onClick={onUnlock} className={checkOutClass}>
            CHECK IT OUT
            <Lock size={16} className="shrink-0" />
          </button>
        ) : (
          <a href={project.href} target="_blank" rel="noopener noreferrer" className={checkOutClass}>
            CHECK IT OUT
            <ArrowUpRight size={18} className="shrink-0" />
          </a>
        )}

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
    <p className="font-retro text-green-300 text-sm tracking-widest">CREATING ACROSS MULTITUDES.</p>
    <p>
      Horizon/Godot is a two-person studio in New York. We're creators and
      developers, and we build the projects we want to use every day.
    </p>
    <p>
      Vinodex came out of years in wine service and retail, where every reference
      tool was the same — dry, clunky, no fun to learn from. We wanted one that
      rewarded curiosity instead of testing patience, so we made it. The aim is
      simple: make wine knowledge feel like play.
    </p>
    <p>
      Wine is one of many things we make. See what else we're building under OUR
      WORK.
    </p>
  </InfoPage>
);

export const ContactUs: React.FC<{ onBack: () => void }> = ({ onBack }) => (
  <InfoPage title="CONTACT US" onBack={onBack}>
    <p>Questions, ideas, feedback on Vinodex, or a project you think we'd like — we read everything.</p>
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <Mail size={16} className="text-green-400 shrink-0" />
        <a href="mailto:hello@vinodex.app" className="underline decoration-green-600 hover:text-green-100">
          hello@vinodex.app
        </a>
      </div>
    </div>
  </InfoPage>
);
