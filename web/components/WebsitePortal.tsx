import React from 'react';
import { LayoutGrid, Users, Mail, Database, ChevronRight, Gamepad2, ArrowUpRight } from 'lucide-react';
import DeviceLayout from './DeviceLayout';
import { CONTACT_ADDRESS } from '../src/services/brand';

/**
 * The studio's other projects, shown under OUR WORK beneath Vinodex. These are
 * Substack projects. Tapping a row opens an in-app splash (/project/:id) that
 * explains the project before handing off to Substack via CHECK IT OUT —
 * rather than jumping straight out to the external site. Vinodex is the one
 * row that does not leave: it opens the app (see `inApp`).
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
  /** External destination for CHECK IT OUT. Empty for `inApp` projects, which
   *  open here rather than somewhere else. */
  href: string;
  description: string;
  /** Bundled square logo shown in the list row and on the splash. */
  logo: string;
  /**
   * Vinodex: the one project that *is* this site's own app, so its splash
   * offers OPEN VINODEX and boots the device rather than leaving for a URL.
   *
   * This used to be `locked`, and it used to mean "behind the access-code
   * keypad". The keypad is gone (v8#3) — the code lived in the client bundle
   * and `/dex` was always reachable directly, so it withheld nothing and cost
   * every visitor four taps to learn that. What is left is the true
   * distinction, which is not about permission at all: every other row leaves
   * for Substack, and this one opens an app that is already here.
   */
  inApp?: boolean;
}

export const PROJECTS: Project[] = [
  {
    id: 'vinodex',
    name: 'VINODEX',
    blurb: 'Retro wine encyclopedia',
    href: '',
    description:
      'Vinodex is a retro-handheld encyclopedia of wine — hundreds of grapes, regions, styles and flavours to scan, save, and quiz yourself on, all on a device you can pick up and explore. Open it and the device boots.',
    logo: '/vinodex-logo.png',
    inApp: true,
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
 * The company site — **the landing experience** (v8#1).
 *
 * It is no longer one fork of a splash. `/` is Horizon/Godot, and Vinodex is an
 * app you open from inside it: OUR WORK → VINODEX → OPEN VINODEX → the BIOS →
 * the dex. The handheld chassis carries both, which is the whole conceit — on
 * the site it is the studio's device sitting on the desk, in its own red
 * CLASSIC shell (v8#4), and opening the app boots it.
 *
 * The chassis SAVED/SETTINGS system buttons are hidden here
 * (`showSystemButtons={false}`) because those are in-app controls that have no
 * meaning on the company site; every site screen offers Back instead. The
 * marquee lamps follow the same flag — see `DeviceFooter`.
 *
 * Structure:
 *   /               PortalHome  — OUR WORK / WHO WE ARE / CONTACT US / DATA
 *   /apps           OurAppsList — Vinodex plus the studio's Substacks
 *   /project/:id    ProjectSplash — one project, then out to it
 *   /who-we-are     WhoWeAre
 *   /contact        ContactUs
 *
 * DATA links straight to the existing data settings screen (`/settings/DATA`).
 * That single crossing is sanctioned and is the only one: no dex service is
 * imported here, and no site copy or gating logic goes the other way.
 *
 * The v0.2.x `/website/*` spellings still resolve — App.tsx redirects each to
 * its new home, so nothing linked, bookmarked or shared breaks.
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

// ---------------------------------------------------------------------------
// Portal home — four tiles, same language as the dex MainMenu.
// ---------------------------------------------------------------------------

interface PortalHomeProps {
  onHome: () => void;
  onOpenApps: () => void;
  onWhoWeAre: () => void;
  onContactUs: () => void;
  onData: () => void;
}

const tileBase =
  'flex-1 rounded-xl shadow-lg active:translate-y-1 active:border-b-0 transition-all flex flex-col items-center justify-center group relative overflow-hidden';

export const PortalHome: React.FC<PortalHomeProps> = ({ onHome, onOpenApps, onWhoWeAre, onContactUs, onData }) => (
  // **No Back cap (v8#12).** `/` is the top of the site: there is nothing above
  // it, so a Back here could only be a no-op or a lie. It was the latter until
  // this release -- the cold-start fallback launched the dex from the front
  // page. The cap stays moulded into the shell and inert, which is the same
  // answer the band already gives for SAVED and SETTINGS on a site screen.
  <DeviceLayout title="HORIZON/GODOT" subtitle="" showBack={false} onHome={onHome} showSystemButtons={false}>
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
          {/* No strapline under the wordmark (v8#6). CREATING ACROSS
              MULTITUDES was doing the splash's job of explaining where you had
              just arrived; this is the landing now, and the page whose job
              that is has a tile of its own two rows down — WHO WE ARE opens
              with the same line. */}
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
// OUR WORK — Vinodex (the app, opened from here) plus the studio's Substacks.
// ---------------------------------------------------------------------------

interface OurAppsListProps {
  onBack: () => void;
  onHome: () => void;
  onSelectProject: (id: string) => void;
}

export const OurAppsList: React.FC<OurAppsListProps> = ({ onBack, onHome, onSelectProject }) => (
  <DeviceLayout title="OUR WORK" subtitle="" showBack onBack={onBack} onHome={onHome} showSystemButtons={false} centerHeaderText>
    <div className="flex-1 min-h-0 w-full flex flex-col bg-dex-screen relative overflow-hidden">
      <RetroGrid />
      <div className="relative z-10 flex-1 overflow-y-auto p-4 flex flex-col gap-3">

        {/* Every project — the Vinodex app plus the studio's Substacks — opens
            its own in-app splash first. From there Vinodex boots the device
            and the rest hand off to Substack. */}
        {PROJECTS.map(p => (
          <button
            key={p.id}
            onClick={() => onSelectProject(p.id)}
            className={`w-full flex items-center gap-4 p-4 rounded-xl bg-stone-900/80 border-2 active:translate-y-0.5 transition-all group ${p.inApp ? 'border-green-600 hover:border-green-400' : 'border-stone-700 hover:border-green-500'}`}
          >
            <div className="w-14 h-14 shrink-0 rounded-[18%] bg-white flex items-center justify-center overflow-hidden">
              <img src={p.logo} alt={p.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="font-retro text-sm text-green-300 tracking-widest">{p.name}</div>
              <div className="font-mono text-xs text-stone-400 mt-1">{p.blurb}</div>
            </div>
            <span className="flex items-center gap-1 shrink-0">
              {/* The padlock is gone with the gate it stood for (v8#3). The
                  app's own row is marked as the one that opens here rather
                  than leaving, which is what the badge was really telling you
                  once the code stopped withholding anything. */}
              {p.inApp && <Gamepad2 size={16} className="text-green-400" aria-hidden="true" />}
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
  onHome: () => void;
  /** The `inApp` project (Vinodex) opens the app rather than leaving the site. */
  onOpenApp: () => void;
}

const checkOutClass =
  'inline-flex items-center gap-2 px-6 py-4 rounded-xl bg-green-500 border-b-4 border-green-700 active:translate-y-0.5 active:border-b-0 transition-all font-retro text-sm tracking-widest text-white hover:bg-green-400 shadow-lg';

export const ProjectSplash: React.FC<ProjectSplashProps> = ({ project, onBack, onHome, onOpenApp }) => (
  <DeviceLayout title={project.name} subtitle="" showBack onBack={onBack} onHome={onHome} showSystemButtons={false} centerHeaderText>
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

        {project.inApp ? (
          // Vinodex opens here. Named for what it does, rather than borrowing
          // the outbound rows' CHECK IT OUT: this button does not take you to
          // another site, it powers on the device you are already holding.
          <button onClick={onOpenApp} className={checkOutClass}>
            OPEN VINODEX
            <Gamepad2 size={18} className="shrink-0" aria-hidden="true" />
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
// Simple content pages. Copy is placeholder — edit freely.
// ---------------------------------------------------------------------------

const InfoPage: React.FC<{ title: string; onBack: () => void; onHome: () => void; children: React.ReactNode }> = ({ title, onBack, onHome, children }) => (
  <DeviceLayout title={title} subtitle="" showBack onBack={onBack} onHome={onHome} showSystemButtons={false} centerHeaderText>
    <div className="flex-1 min-h-0 w-full flex flex-col bg-dex-screen relative overflow-hidden">
      <RetroGrid />
      <div className="relative z-10 flex-1 overflow-y-auto p-6 font-mono text-sm text-green-200 leading-relaxed space-y-4">
        {children}
      </div>
    </div>
  </DeviceLayout>
);

export const WhoWeAre: React.FC<{ onBack: () => void; onHome: () => void }> = ({ onBack, onHome }) => (
  <InfoPage title="WHO WE ARE" onBack={onBack} onHome={onHome}>
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

export const ContactUs: React.FC<{ onBack: () => void; onHome: () => void }> = ({ onBack, onHome }) => (
  <DeviceLayout title="CONTACT US" subtitle="" showBack onBack={onBack} onHome={onHome} showSystemButtons={false} centerHeaderText>
    <div className="flex-1 min-h-0 w-full flex flex-col bg-dex-screen relative overflow-hidden">
      <RetroGrid />
      <div className="relative z-10 flex-1 overflow-y-auto p-8 flex flex-col items-center justify-center gap-8 text-center">

        <div className="flex flex-col items-center gap-4">
          <Mail size={56} className="text-green-400" />
          <h2
            className="font-retro text-3xl sm:text-4xl tracking-widest text-green-300 leading-none"
            style={{ textShadow: '2px 2px 0 rgba(8,32,16,0.6)' }}
          >
            GET IN TOUCH
          </h2>
        </div>

        <p className="font-mono text-lg sm:text-xl text-green-200 leading-relaxed max-w-prose normal-case">
          Questions, ideas, feedback on Vinodex, or a project you think we'd like —
          we read everything.
        </p>

        {/* One address, from one constant (W26). This page and the in-app
            SUPPORT screen used to advertise two different domains, neither
            registered. See `supportContact.ts` and `releaseBlockers.ts`. */}
        <a
          href={`mailto:${CONTACT_ADDRESS}`}
          className="inline-flex items-center gap-3 px-7 py-5 rounded-2xl bg-green-500 border-b-4 border-green-700 active:translate-y-0.5 active:border-b-0 transition-all font-retro text-lg sm:text-xl tracking-widest text-white hover:bg-green-400 shadow-lg break-all"
        >
          <Mail size={24} className="shrink-0" />
          {CONTACT_ADDRESS}
        </a>

      </div>
    </div>
  </DeviceLayout>
);
