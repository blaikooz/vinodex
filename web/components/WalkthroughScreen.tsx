import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Home, UserRound } from 'lucide-react';
import DeviceLayout from './DeviceLayout';
import VinoPortrait from './VinoPortrait';
import { toolSentence } from './MinigamesScreen';
import type { VinoExpression } from '../src/services/vinoDialogue';

/** The map half of the tutorial, followed by a live guided tasting. */
type Part =
  | 'device'
  | 'screen'
  | 'search'
  | 'entry'
  | 'back'
  | 'saved'
  | 'home'
  | 'marquee'
  | 'settings'
  | 'tools'
  | 'workshop'
  | 'shop';

interface Step {
  id: string;
  title: string;
  body: string;
  highlight: Part;
  expression: VinoExpression;
}

const sentence = toolSentence();

export const WALKTHROUGH_STEPS: Step[] = [
  { id: 'screen', title: 'START HERE', body: 'A wine encyclopedia on a handheld. Four tiles — grapes, regions, styles, flavours — and everything links to everything.', highlight: 'screen', expression: 'smiling' },
  { id: 'search', title: 'SEARCH ANYTHING', body: 'The middle button searches all of it at once. A grape, a place, a flavour — a few letters is enough.', highlight: 'search', expression: 'thinking' },
  { id: 'entry', title: 'WHAT AN ENTRY LOOKS LIKE', body: 'Every entry has the same shape: picture and name, three tiles that link onward, then the readouts. A row with an arrow opens the next entry.', highlight: 'entry', expression: 'neutral' },
  { id: 'back', title: 'GOING BACK', body: 'Back steps one screen at a time and remembers where you were — scroll position, open sections, all of it.', highlight: 'back', expression: 'neutral' },
  { id: 'home', title: 'STARTING OVER', body: "Home returns to the main menu and clears the trail. Feeling lost? This one resets everything you didn't save.", highlight: 'home', expression: 'surprised' },
  { id: 'marquee', title: 'THE TWO LIGHTS', body: 'The lights above the panel are buttons: tools and customize. Hold either one to point it somewhere else.', highlight: 'marquee', expression: 'thinking' },
  { id: 'settings', title: 'MAKING IT YOURS', body: 'The cog: screen modes, chassis skins, text size, haptics, sound. The person button beside Back keeps your shelf and profile.', highlight: 'settings', expression: 'neutral' },
  { id: 'tools', title: 'TOOLS', body: `Also behind the cog: the wrench tile. ${sentence.charAt(0).toUpperCase()}${sentence.slice(1)}. Each one explains itself the first time you open it.`, highlight: 'tools', expression: 'goodjob' },
  { id: 'passport', title: "WHAT YOU'VE TASTED", body: 'Mark an entry tried and it lands in your passport — counts, a rank, and stamps you earn along the way. The stamps stick to the back of the device, and you can move them about.', highlight: 'saved', expression: 'goodjob' },
  { id: 'workshop', title: 'BUILD YOUR OWN', body: 'The workshop takes the device apart: shell, buttons, orb, lamps, grille, screen and font, each chosen separately. Save a build under a name and fit it again whenever you like.', highlight: 'workshop', expression: 'thinking' },
  { id: 'shop', title: 'MORE OF IT', body: 'The shop holds expansion packs — more of the catalog by country, plus skins, screen modes and the workshop itself. What you own stays owned.', highlight: 'shop', expression: 'smiling' },
  { id: 'done', title: "THAT'S IT.", body: "That was the map. SHOW ME and Professor Vino walks you through a first tasting on the real screens; DONE and you're on your own. Both live under TUTORIAL in settings.", highlight: 'device', expression: 'raiseaglass' },
];

interface WalkthroughScreenProps {
  onBack: () => void;
  onHome: () => void;
  onGuidedRun: () => void;
}

const art = (stem: string): string => `/art/button/${stem}.png`;

const MiniArt: React.FC<{ stem: string; label: string; highlighted?: boolean }> = ({ stem, label, highlighted = false }) => (
  <img
    src={art(stem)}
    alt=""
    aria-hidden="true"
    draggable={false}
    data-walkthrough-art={label}
    className="h-[55%] w-[55%] object-contain"
    style={{ imageRendering: 'pixelated', filter: highlighted ? 'drop-shadow(0 0 5px white)' : undefined }}
  />
);

const MINI_SYSTEM = [
  { label: 'tools', stem: 'tools', face: '#facc15' },
  { label: 'customize', stem: 'customize', face: '#ef4444' },
  { label: 'settings', stem: 'settings', face: '#f97316' },
  { label: 'data', stem: 'data', face: '#2ab5ff' },
  { label: 'shop', stem: 'shop', face: '#a855f7' },
  { label: 'firmware', stem: 'firmware', face: '#22c55e' },
] as const;

const WalkthroughScreen: React.FC<WalkthroughScreenProps> = ({ onBack, onHome, onGuidedRun }) => {
  const [index, setIndex] = useState(0);
  const copyRef = useRef<HTMLDivElement>(null);
  const step = WALKTHROUGH_STEPS[index]!;
  const h = step.highlight;
  const isLast = index === WALKTHROUGH_STEPS.length - 1;

  useEffect(() => {
    if (index > 0) copyRef.current?.focus();
  }, [index]);

  const lit = (part: Part): boolean =>
    h === 'device' || h === part || (part === 'settings' && (h === 'tools' || h === 'workshop' || h === 'shop'));

  const partStyle = (part: Part): React.CSSProperties =>
    lit(part)
      ? { outline: '2px solid var(--lcd-accent)', boxShadow: '0 0 10px var(--lcd-accent)', opacity: 1 }
      : { opacity: h === 'device' ? 1 : 0.38 };

  const move = (next: number) => setIndex(Math.min(Math.max(next, 0), WALKTHROUGH_STEPS.length - 1));

  const menuTile = (stem: string, face: string, part: Part = 'screen') => (
    <span className="rounded-md flex min-h-0 items-center justify-center overflow-hidden" style={{ backgroundColor: face, ...partStyle(part) }}>
      <MiniArt stem={stem} label={stem} highlighted={lit(part)} />
    </span>
  );

  return (
    <DeviceLayout title="TUTORIAL" subtitle="" showBack onBack={onBack} onHome={onHome} centerHeaderText>
      <div className="h-full min-h-0 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-4" style={{ backgroundColor: 'var(--lcd-page)' }} data-tutorial-scroll>
        <div
          className="flex gap-1"
          role="progressbar"
          aria-label="Tour progress"
          aria-valuemin={1}
          aria-valuemax={WALKTHROUGH_STEPS.length}
          aria-valuenow={index + 1}
          aria-valuetext={`Step ${index + 1} of ${WALKTHROUGH_STEPS.length}`}
        >
          {WALKTHROUGH_STEPS.map((item, i) => (
            <span key={item.id} className="flex-1 h-1 rounded-full transition-colors" style={{ backgroundColor: i === index ? 'var(--lcd-accent)' : 'var(--lcd-surface-edge)' }} />
          ))}
        </div>

        <div
          className="mx-auto w-full max-w-[18rem] min-h-[18.75rem] rounded-2xl p-3 flex flex-col gap-2"
          style={{ backgroundColor: 'var(--chassis-body)', border: '2px solid var(--chassis-panel-edge)' }}
          role="img"
          aria-label={`Device diagram highlighting ${step.title.toLowerCase()}`}
        >
          <div className="flex items-center gap-2 px-1">
            <span className="w-10 h-3 rounded-full bg-cyan-400 border border-white/60" />
            <span className="flex gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /><span className="w-2 h-2 rounded-full bg-yellow-400" /><span className="w-2 h-2 rounded-full bg-green-500" /></span>
            <span className="flex-1" />
            <span className="rounded-full p-1 flex items-center justify-center" style={partStyle('settings')}>
              <img src={art('settings')} alt="" aria-hidden="true" className="w-5 h-5 object-contain" style={{ imageRendering: 'pixelated' }} />
            </span>
          </div>

          <div className="relative flex-1 min-h-[12rem] rounded-lg p-2 overflow-hidden" style={{ backgroundColor: 'var(--lcd-screen)', ...partStyle('screen') }}>
            {h === 'entry' ? (
              <div className="h-full flex flex-col gap-2" style={partStyle('entry')}>
                <div className="flex flex-col items-center gap-1">
                  <span className="w-12 h-12 rounded bg-red-900 flex items-center justify-center"><MiniArt stem="grapes" label="entry" /></span>
                  <span className="w-24 h-2 rounded" style={{ backgroundColor: 'var(--lcd-text)' }} />
                </div>
                <div className="grid grid-cols-3 gap-1 h-12">{menuTile('styles', '#7f1d1d')}{menuTile('grapes', '#78350f')}{menuTile('regions', '#1e3a8a')}</div>
                <div className="h-px" style={{ backgroundColor: 'var(--lcd-accent)' }} />
                {[0, 1].map(i => (
                  <div key={i} className="flex items-center gap-1 rounded px-1 py-1.5" style={{ backgroundColor: 'var(--lcd-surface)' }}>
                    <span className="flex-1 h-2 rounded" style={{ backgroundColor: 'var(--lcd-surface-edge)' }} />
                    <ChevronRight size={12} style={{ color: 'var(--lcd-accent)' }} />
                  </div>
                ))}
              </div>
            ) : h === 'tools' || h === 'workshop' || h === 'shop' ? (
              <div className="grid h-full grid-cols-2 grid-rows-3 gap-1.5">
                {MINI_SYSTEM.map(item => {
                  const highlighted =
                    (h === 'tools' && item.label === 'tools') ||
                    (h === 'workshop' && item.label === 'customize') ||
                    (h === 'shop' && item.label === 'shop');
                  return (
                    <span
                      key={item.label}
                      className="rounded-md flex min-h-0 items-center justify-center overflow-hidden"
                      style={{ backgroundColor: item.face, opacity: highlighted ? 1 : 0.38, outline: highlighted ? '2px solid white' : undefined, boxShadow: highlighted ? '0 0 7px var(--lcd-accent)' : undefined }}
                    >
                      <MiniArt stem={item.stem} label={item.label} highlighted={highlighted} />
                    </span>
                  );
                })}
              </div>
            ) : (
              <div className="relative grid h-full grid-cols-2 grid-rows-2 gap-1.5">
                {menuTile('grapes', '#a855f7')}{menuTile('regions', '#22c55e')}{menuTile('styles', '#f97316')}{menuTile('flavors', '#10b981')}
                <span className="absolute left-1/2 top-1/2 w-14 h-14 -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow-400 flex items-center justify-center border-2 border-yellow-600" style={partStyle('search')}>
                  <MiniArt stem="search" label="search" highlighted={lit('search')} />
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 px-1">
            <span className="rounded-full p-1" style={partStyle('back')}><ChevronLeft size={17} style={{ color: 'var(--lcd-accent)' }} /></span>
            <span className="rounded-full p-1" style={partStyle('saved')}><UserRound size={15} style={{ color: 'var(--lcd-accent)' }} /></span>
            <span className="flex-1 flex flex-col gap-1" style={partStyle('marquee')}>
              <span className="flex gap-1"><span className="h-2 flex-1 rounded bg-red-600" /><span className="h-2 flex-1 rounded bg-green-500" /></span>
              <span className="h-5 rounded border border-green-950 bg-green-500" />
            </span>
            <span className="rounded-full p-1" style={partStyle('home')}><Home size={17} style={{ color: 'var(--lcd-accent)' }} /></span>
          </div>
        </div>

        <div className="flex items-end gap-0" ref={copyRef} tabIndex={-1} aria-live="polite">
          <VinoPortrait expression={step.expression} size={64} className="shrink-0 -mr-2 relative z-10" />
          <div className="flex-1 min-w-0 rounded-xl p-4" style={{ backgroundColor: 'var(--lcd-surface)', border: '2px solid var(--lcd-accent)' }}>
            <div className="font-retro text-[0.7rem] tracking-widest mb-2 leading-relaxed" style={{ color: 'var(--lcd-accent)' }}>{step.title}</div>
            <div className="font-mono text-lg normal-case leading-snug" style={{ color: 'var(--lcd-body-text)' }}>{step.body}</div>
          </div>
        </div>

        <div className="flex-1" />

        <div className="flex flex-col gap-3 pb-1">
          {isLast ? (
            <button type="button" onClick={onGuidedRun} className="w-full rounded-xl py-3.5 font-retro text-[0.65rem] tracking-widest active:translate-y-0.5" style={{ backgroundColor: 'var(--lcd-accent)', color: 'var(--lcd-on-accent)' }}>SHOW ME</button>
          ) : null}
          <div className="flex gap-3">
            {index > 0 ? (
              <button type="button" onClick={() => move(index - 1)} className="flex-1 rounded-xl py-3 font-retro text-[0.6rem] tracking-widest active:translate-y-0.5" style={{ backgroundColor: 'var(--lcd-surface)', color: 'var(--lcd-text)', border: '2px solid var(--lcd-surface-edge)' }}>BACK</button>
            ) : null}
            <button
              type="button"
              onClick={() => (isLast ? onHome() : move(index + 1))}
              className="flex-1 rounded-xl py-3 font-retro text-[0.6rem] tracking-widest active:translate-y-0.5"
              style={{ backgroundColor: isLast ? 'var(--lcd-surface)' : 'var(--lcd-accent)', color: isLast ? 'var(--lcd-subtext)' : 'var(--lcd-on-accent)', border: isLast ? '2px solid var(--lcd-surface-edge)' : '2px solid var(--lcd-accent)' }}
            >
              {isLast ? 'DONE' : 'NEXT'}
            </button>
          </div>
        </div>
      </div>
    </DeviceLayout>
  );
};

export default WalkthroughScreen;
