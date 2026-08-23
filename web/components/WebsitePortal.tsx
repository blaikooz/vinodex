import React from 'react';
import { LayoutGrid, Users, Mail, ChevronRight, Gamepad2, ArrowUpRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import DeviceLayout from './DeviceLayout';
import { Card, Tile } from './Card';
import type { Livery } from './Card';
import { CONTACT_ADDRESS } from '../src/services/brand';

/* The browser document is intentionally locked because the chassis is the
   page. These named LCD regions therefore need to be keyboard-focusable so
   Page Up/Down and arrow keys have a scroll target; `region` is correctly
   non-interactive, but the generic lint rule cannot represent that exception. */
/* eslint-disable jsx-a11y/no-noninteractive-tabindex */

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
  logo?: string;
  /** Repo-native fallback when a project does not have a bundled logo. */
  badge?: string;
  /** Supporting accent; the site keeps one chassis and lets projects tint it. */
  livery: Livery;
  /** The studio's lead project gets a little more room in the work list. */
  featured?: boolean;
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
      'Vinodex turns hundreds of grapes, regions, styles, and flavours into a retro-handheld wine encyclopedia you can explore, save, and quiz yourself on. It grew out of years in wine service and a belief that useful education can still feel like play.',
    logo: '/vinodex-logo.png',
    livery: 'green',
    featured: true,
    inApp: true,
  },
  {
    id: 'chateau-earth',
    name: 'CHÂTEAU',
    blurb: 'Wine writing from service to table',
    href: 'https://chateauearth.substack.com/',
    description:
      'Château is our wine blog: bottles, regions, service knowledge, and the things we keep learning at the table. It is a place for curious drinking without the gatekeeping.',
    logo: '/projects/chateau.png',
    livery: 'amber',
  },
  {
    id: 'focuspond',
    name: 'FOCUSPOND',
    blurb: 'Paid focus groups & product tests',
    href: 'https://focuspond.substack.com',
    description:
      'FocusPond curates legitimate paid market research, from focus groups to product-testing opportunities, so you can earn with your opinion. It pairs those opportunities with practical encouragement for staying focused on your financial goals.',
    logo: '/projects/focuspond.png',
    livery: 'sky',
  },
  {
    id: 'varied-mix',
    name: 'VARIED/MIX',
    blurb: 'A music blog & radio, genre to genre',
    href: 'https://variedmix.substack.com',
    description:
      'varied/mix moves genre to genre through themed playlists and music writing that celebrates a wide range of artists. Live radio broadcasts, extended mixes, and hours of curation give every idea room to play out.',
    logo: '/projects/varied-mix.png',
    livery: 'violet',
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
 *   /               PortalHome  — OUR WORK / WHO WE ARE / OPEN VINODEX / CONTACT US
 *   /apps           OurAppsList — Vinodex plus the studio's Substacks
 *   /project/:id    ProjectSplash — one project, then out to it
 *   /who-we-are     WhoWeAre
 *   /contact        ContactUs
 *
 * OPEN VINODEX is the one sanctioned crossing into the product. No dex
 * service is imported here, and no site copy or state goes the other way.
 *
 * The v0.2.x `/website/*` spellings still resolve — App.tsx redirects each to
 * its new home, so nothing linked, bookmarked or shared breaks.
 */

/**
 * The grid wash behind every site screen (v0.4.0, m4).
 *
 * It was two hardcoded `rgba(50, 255, 50, 0.3)` rules, which is a fixed
 * phosphor green — correct on the black LCD, and grime on the five pale
 * screen modes. `index.css` has a rule that softens `opacity-10` on the
 * LIGHT mode for exactly that reason, and it covers one mode of the five.
 * Drawn from `--lcd-accent` instead, it is the mode's own colour everywhere
 * and needs no per-mode exception.
 *
 * `MainMenu` draws the same wash from its own copy. Deliberately not hoisted
 * into something both import: the dex and the site share a chassis and
 * nothing else, and a shared decoration component is the first thread of the
 * coupling that rule exists to prevent. Duplication of six lines is the
 * cheaper mistake.
 */
const RetroGrid: React.FC = () => (
  <div
    className="absolute inset-0 opacity-[0.07] pointer-events-none"
    style={{
      backgroundImage:
        'linear-gradient(color-mix(in oklab, var(--lcd-accent) 55%, transparent) 1px, transparent 1px), '
        + 'linear-gradient(90deg, color-mix(in oklab, var(--lcd-accent) 55%, transparent) 1px, transparent 1px)',
      backgroundSize: '32px 32px',
    }}
  />
);

/**
 * The ground every site screen sits on.
 *
 * **This is a bug fix, not a restyle.** It was `bg-dex-screen` — a fixed
 * `#232323` — while the copy on top of it went through `.lcd-themed`'s
 * palette remap and *did* follow the screen mode. On any of the five pale
 * modes that put light-mode ink on a dark ground: LIGHT resolves
 * `--lcd-body-text` to `#23342A`, which on `#232323` is a contrast ratio of
 * roughly 1:1. The HORIZON/GODOT wordmark on the front page was invisible in
 * v0.3.0 and nothing could see it, because no gate compares two colours.
 *
 * Following `--lcd-page` makes the ground and the ink agree by construction.
 */
const screenGround = 'bg-[var(--surface-base)]';

/**
 * The one primary action on a site screen: CHECK IT OUT, OPEN VINODEX, the
 * contact address.
 *
 * `--lcd-on-accent` is the mode's own authored answer to "what colour is text
 * on the accent" — it is `#000000` on the dark modes and `#FFFFFF` on the
 * pale ones — so this button is legible in all nine without a branch. The
 * 4px hard bottom border that used to fake an extrusion is gone; the press is
 * `.dex-pressable`'s spring.
 */
const primaryAction =
  'dex-pressable inline-flex min-h-11 items-center justify-center gap-2 rounded-control '
  + 'px-6 py-4 bg-[var(--lcd-accent)] text-[var(--lcd-on-accent)] shadow-elev-2 '
  + 'font-retro text-label uppercase tracking-widest';

// ---------------------------------------------------------------------------
// Portal home — four tiles, same language as the dex MainMenu.
// ---------------------------------------------------------------------------

interface PortalHomeProps {
  onHome: () => void;
  onOpenApp: () => void;
  onOpenApps: () => void;
  onWhoWeAre: () => void;
  onContactUs: () => void;
}

/**
 * The four front-page tiles, as one table.
 *
 * They were four near-identical `<button>` blocks differing in six places
 * each, which is how WHO WE ARE and CONTACT US ended up carrying a literal
 * `<br />` and the other two did not. A row per tile makes "one of these is
 * drawn differently from the others" impossible to write by accident.
 *
 * The liveries are the shared card system's names: Vinodex green, the work
 * index violet, the founder story amber, Vinodex green, and contact orange.
 */
const PORTAL_TILES: { label: string; livery: Livery; icon: LucideIcon; key: keyof PortalHomeProps }[] = [
  { label: 'OUR WORK', livery: 'violet', icon: LayoutGrid, key: 'onOpenApps' },
  { label: 'WHO WE ARE', livery: 'amber', icon: Users, key: 'onWhoWeAre' },
  { label: 'OPEN VINODEX', livery: 'green', icon: Gamepad2, key: 'onOpenApp' },
  { label: 'CONTACT US', livery: 'orange', icon: Mail, key: 'onContactUs' },
];

export const PortalHome: React.FC<PortalHomeProps> = props => (
  // **No Back cap (v8#12).** `/` is the top of the site: there is nothing above
  // it, so a Back here could only be a no-op or a lie. It was the latter until
  // this release -- the cold-start fallback launched the dex from the front
  // page. The cap stays moulded into the shell and inert, which is the same
  // answer the band already gives for SAVED and SETTINGS on a site screen.
  <DeviceLayout title="HORIZON/GODOT" subtitle="" showBack={false} onHome={props.onHome} showSystemButtons={false}>
    <div className={`flex-1 min-h-0 w-full flex flex-col items-center relative overflow-hidden ${screenGround}`}>
      <RetroGrid />
      <div className="relative w-full h-full z-10 flex flex-col p-[var(--pad-screen)] gap-[var(--gap-grid)]">

        {/* The studio wordmark, and the one place on this screen the pixel
            face still belongs: it is a mark, not a label. What it loses is the
            hardcoded `2px 2px 0 rgba(8,32,16,0.6)` drop shadow -- a dark
            offset shadow drawn on whatever page the mode supplies, which on
            the pale modes was a smear. Flat, in the mode's own accent, which
            measures 13:1 on DARK and 6.4:1 on LIGHT. */}
        <div className="text-center shrink-0 pt-1 space-y-1.5">
          <h1 className="font-retro text-xl sm:text-3xl tracking-widest text-[var(--lcd-accent)] leading-none">
            HORIZON/GODOT
          </h1>
          <p className="font-retro text-label sm:text-heading tracking-widest text-[var(--lcd-text)]">
            PLAYFUL TOOLS, MADE WELL.
          </p>
          <p className="mx-auto max-w-md font-retro text-caption sm:text-label normal-case tracking-wide text-[var(--lcd-subtext)] leading-snug">
            A two-person NYC studio making useful digital projects with personality.
          </p>
        </div>

        {/* A real grid rather than two flex rows: the tiles are a 2x2 and
            saying so is what keeps the four the same size when one of the
            labels is longer than the others. */}
        <div className="grid grid-cols-2 grid-rows-2 gap-[var(--gap-grid)] w-full flex-1 min-h-0">
          {PORTAL_TILES.map(t => (
            <Tile
              key={t.label}
              livery={t.livery}
              label={t.label}
              onClick={props[t.key] as () => void}
              icon={<t.icon size={44} className="sm:w-14 sm:h-14" aria-hidden="true" />}
              bareIcon
              style={{
                backgroundColor: 'var(--tint-solid)',
                borderColor: 'var(--tint-border)',
              }}
              className="[&>span:nth-of-type(2)]:font-retro"
            />
          ))}
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
    <div className={`flex-1 min-h-0 w-full flex flex-col relative overflow-hidden ${screenGround}`}>
      <RetroGrid />
      <div
        className="site-scroll-region custom-scrollbar relative z-10 min-h-0 flex-1 overflow-y-auto p-[var(--pad-screen)] flex flex-col gap-[var(--gap-grid)]"
        tabIndex={0}
        role="region"
        aria-label="Our work content"
      >

        {/* Every project — the Vinodex app plus the studio's Substacks — opens
            its own in-app splash first. From there Vinodex boots the device
            and the rest hand off to Substack.

            The row is a `Card`, so it is a real `<button>` with the shared
            press spring and focus ring rather than a hand-rolled one. The app
            row wears the `green` livery -- the tint is the badge, doing the
            work the `border-green-600` used to and the padlock did before
            that. The Substack rows are neutral. */}
        {PROJECTS.map(p => (
          <Card
            key={p.id}
            livery={p.livery}
            elevation={p.featured ? 2 : 1}
            onClick={() => onSelectProject(p.id)}
            className={`w-full flex items-center gap-4 p-[var(--pad-card)] group ${p.featured ? 'min-h-24' : ''}`}
          >
            <ProjectMark project={p} />
            <span className="flex-1 min-w-0 text-left">
              {p.featured && (
                <span className="mb-1 block font-retro text-caption tracking-widest text-[var(--lcd-accent)]">FEATURED PROJECT</span>
              )}
              <span className="block font-retro text-heading tracking-widest text-[var(--lcd-text)]">{p.name}</span>
              <span className="block font-retro text-caption normal-case tracking-wide text-[var(--lcd-subtext)] mt-1">{p.blurb}</span>
            </span>
            <span className="flex items-center gap-1 shrink-0 text-[var(--lcd-accent)]">
              {/* The padlock is gone with the gate it stood for (v8#3). The
                  app's own row is marked as the one that opens here rather
                  than leaving, which is what the badge was really telling you
                  once the code stopped withholding anything. */}
              {p.inApp && <Gamepad2 size={16} aria-hidden="true" />}
              <ChevronRight size={20} aria-hidden="true" className="group-hover:translate-x-1 transition-transform" />
            </span>
          </Card>
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

const ProjectMark: React.FC<{ project: Project; large?: boolean }> = ({ project, large = false }) => (
  <span
    className={`${large ? 'w-24 h-24 rounded-card' : 'w-14 h-14 rounded-control'} shrink-0 bg-[var(--surface-high)] flex items-center justify-center overflow-hidden shadow-elev-1`}
    aria-hidden="true"
  >
    {project.logo ? (
      <img src={project.logo} alt="" className="w-full h-full object-cover" />
    ) : (
      <span className="font-retro text-xl tracking-widest text-[var(--lcd-accent)]">{project.badge}</span>
    )}
  </span>
);

export const ProjectSplash: React.FC<ProjectSplashProps> = ({ project, onBack, onHome, onOpenApp }) => (
  <DeviceLayout title={project.name} subtitle="" showBack onBack={onBack} onHome={onHome} showSystemButtons={false} centerHeaderText>
    <div className={`flex-1 min-h-0 w-full flex flex-col relative overflow-hidden ${screenGround}`}>
      <RetroGrid />
      <div
        className="site-scroll-region custom-scrollbar relative z-10 min-h-0 flex-1 overflow-y-auto p-[var(--pad-screen)] flex flex-col items-center justify-center gap-5 text-center"
        tabIndex={0}
        role="region"
        aria-label={`${project.name} project details`}
      >

        <ProjectMark project={project} large />

        <div className="space-y-1">
          <h2 className="font-retro text-title tracking-widest text-[var(--lcd-text)]">{project.name}</h2>
          <p className="font-retro text-caption normal-case tracking-wide text-[var(--lcd-subtext)]">{project.blurb}</p>
        </div>

        <p className="font-retro text-caption normal-case leading-relaxed text-[var(--lcd-body-text)] max-w-prose">
          {project.description}
        </p>

        {project.inApp ? (
          // Vinodex opens here. Named for what it does, rather than borrowing
          // the outbound rows' CHECK IT OUT: this button does not take you to
          // another site, it powers on the device you are already holding.
          <button type="button" onClick={onOpenApp} className={primaryAction}>
            OPEN VINODEX
            <Gamepad2 size={18} className="shrink-0" aria-hidden="true" />
          </button>
        ) : (
          <a href={project.href} target="_blank" rel="noopener noreferrer" className={primaryAction}>
            VISIT PUBLICATION
            <ArrowUpRight size={18} className="shrink-0" aria-hidden="true" />
          </a>
        )}

      </div>
    </div>
  </DeviceLayout>
);

// ---------------------------------------------------------------------------
// Simple content pages.
// ---------------------------------------------------------------------------

/**
 * A page of prose.
 *
 * `normal-case` is the load-bearing class. The LCD wrapper uppercases its
 * whole subtree -- correct for a device readout, wrong for three paragraphs
 * about a studio, and the reason this page has always been hard to read. The
 * Pixel type is used throughout the website; the smaller caption scale and
 * generous line-height keep longer studio copy readable inside the LCD.
 */
const InfoPage: React.FC<{ title: string; onBack: () => void; onHome: () => void; children: React.ReactNode }> = ({ title, onBack, onHome, children }) => (
  <DeviceLayout title={title} subtitle="" showBack onBack={onBack} onHome={onHome} showSystemButtons={false} centerHeaderText>
    <div className={`flex-1 min-h-0 w-full flex flex-col relative overflow-hidden ${screenGround}`}>
      <RetroGrid />
      <div
        className="site-scroll-region custom-scrollbar relative z-10 min-h-0 flex-1 overflow-y-auto p-[var(--pad-screen)] font-retro text-caption normal-case leading-relaxed text-[var(--lcd-body-text)] max-w-prose space-y-4"
        tabIndex={0}
        role="region"
        aria-label={`${title} content`}
      >
        {children}
      </div>
    </div>
  </DeviceLayout>
);

export const WhoWeAre: React.FC<{ onBack: () => void; onHome: () => void }> = ({ onBack, onHome }) => (
  <InfoPage title="WHO WE ARE" onBack={onBack} onHome={onHome}>
    <section className="space-y-3">
      <h2 className="font-retro text-title uppercase tracking-widest text-[var(--lcd-accent)]">
        AN INDEPENDENT CREATIVE + PRODUCT STUDIO
      </h2>
      <p>
        Horizon/Godot is a New York City studio creating digital products,
        publications, and media across wine, design, and research. We build
        our own projects and take on selected creative and strategic work.
        Everything starts with the same belief: useful products can be
        rigorous, inviting, and full of personality.
      </p>
    </section>

    <section className="space-y-3">
      <h2 className="font-retro text-heading uppercase tracking-widest text-[var(--lcd-text)]">THE FOUNDERS</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <Card livery="violet" elevation={1} className="p-[var(--pad-card)]">
          <h3 className="font-retro text-heading uppercase tracking-widest text-[var(--lcd-text)]">HORIZON</h3>
          <p className="mt-1 font-retro text-caption uppercase tracking-wide text-[var(--lcd-accent)]">
            CO-FOUNDER + CREATIVE DIRECTOR
          </p>
          <p className="mt-3">
            Horizon leads product vision, UX/UI, visual identity, editorial,
            research, development, and audio. His background spans wine retail
            and service, tastings and events, publishing, radio, and digital
            products. He takes the studio’s ideas from concept through release.
          </p>
          <h4 className="mt-4 font-retro text-caption uppercase tracking-widest text-[var(--lcd-accent)]">EXPERIENCE</h4>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Wine retail, sales, education, tastings, and events</li>
            <li>Publishing, editorial, radio, content, and audio production</li>
            <li>Product design, prototyping, and software development</li>
          </ul>
        </Card>

        <Card livery="amber" elevation={1} className="p-[var(--pad-card)]">
          <h3 className="font-retro text-heading uppercase tracking-widest text-[var(--lcd-text)]">GODOT / ERICK GUZMAN</h3>
          <p className="mt-1 font-retro text-caption uppercase tracking-wide text-[var(--lcd-accent)]">
            CO-FOUNDER + DIRECTOR OF STRATEGY &amp; OPERATIONS
          </p>
          <p className="mt-3">
            Erick leads research, financial planning, business strategy,
            product testing, and project pipelines. His background combines
            hospitality, entrepreneurship, and philosophy studies at Hunter
            College. He also founded and operated an independent embroidery
            business from design through delivery.
          </p>
          <h4 className="mt-4 font-retro text-caption uppercase tracking-widest text-[var(--lcd-accent)]">EXPERIENCE</h4>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Hospitality and customer-facing service</li>
            <li>Independent business development and operations</li>
            <li>Research, testing, financial planning, and strategic analysis</li>
          </ul>
        </Card>
      </div>
    </section>

    <section className="space-y-3">
      <h2 className="font-retro text-heading uppercase tracking-widest text-[var(--lcd-text)]">HOW WE WORK</h2>
      <p>
        Horizon originates and builds most of the creative and product work;
        Erick researches, pressure-tests, and plans how those ideas can work
        in practice. Together, we choose what to pursue, test new ventures,
        shape strategy, and make major studio decisions.
      </p>
    </section>

    <p>
      We take on selected collaborations in creative direction, digital
      product design, editorial, research, brand development, and strategy.
      Our wine work grows from service experience and a shared goal: make
      education useful, welcoming, and fun rather than intimidating.
    </p>
  </InfoPage>
);

export const ContactUs: React.FC<{ onBack: () => void; onHome: () => void }> = ({ onBack, onHome }) => (
  <DeviceLayout title="CONTACT US" subtitle="" showBack onBack={onBack} onHome={onHome} showSystemButtons={false} centerHeaderText>
    <div className={`flex-1 min-h-0 w-full flex flex-col relative overflow-hidden ${screenGround}`}>
      <RetroGrid />
      <div
        className="site-scroll-region custom-scrollbar relative z-10 min-h-0 flex-1 overflow-y-auto p-[var(--pad-screen)] flex flex-col items-center justify-center gap-6 text-center"
        tabIndex={0}
        role="region"
        aria-label="Contact content"
      >

        <div className="flex flex-col items-center gap-3">
          <span
            aria-hidden="true"
            className="dex-tint flex items-center justify-center rounded-surface p-4 bg-[var(--tint-subtle)] text-[var(--tint-ink)]"
            style={{ '--tint': 'var(--livery-green)' } as React.CSSProperties}
          >
            <Mail size={40} />
          </span>
          <h2 className="font-retro text-display tracking-widest text-[var(--lcd-text)]">
            GET IN TOUCH
          </h2>
        </div>

        <p className="font-retro text-caption normal-case leading-relaxed text-[var(--lcd-body-text)] max-w-prose">
          Product feedback, collaboration ideas, project questions, or a good
          bottle we should know about — we read everything.
        </p>

        {/* One address, from one constant (W26). This page and the in-app
            SUPPORT screen used to advertise two different domains, neither
            registered. See `supportContact.ts` and `releaseBlockers.ts`.

            `break-all` stays: the address has to fit a 390px phone, and a
            wrapped address is better than one that overflows the LCD. */}
        <a
          href={`mailto:${CONTACT_ADDRESS}`}
          className={`${primaryAction} normal-case break-all text-heading`}
        >
          <Mail size={20} className="shrink-0" aria-hidden="true" />
          {CONTACT_ADDRESS}
        </a>

      </div>
    </div>
  </DeviceLayout>
);
