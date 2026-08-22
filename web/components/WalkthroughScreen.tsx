import React, { useState } from 'react';
import { Search, ChevronLeft, Home, Settings, Wrench, Grip, Globe, Wine, Leaf, ChevronRight, UserRound, Flag, Palette, SlidersHorizontal } from 'lucide-react';
import DeviceLayout from './DeviceLayout';
import { toolSentence } from './MinigamesScreen';

/**
 * The guided tour, ported from
 * `vinodex-ios/Sources/VinodexUI/WalkthroughScreen.swift`. A schematic
 * mini-device lights one part per step. Copy is verbatim from Walkthrough.swift.
 * FINISH goes Home (the last step tells you to press Home).
 */

type Part = 'device' | 'screen' | 'search' | 'entry' | 'back' | 'home' | 'settings' | 'tools';

interface Step {
  id: string;
  title: string;
  body: string;
  highlight: Part;
}

const STEPS: Step[] = [
  { id: 'screen', title: 'START HERE', highlight: 'screen', body: 'A wine encyclopedia on a handheld. Four tiles — grapes, regions, styles, flavours — and everything links to everything.' },
  { id: 'search', title: 'SEARCH ANYTHING', highlight: 'search', body: 'The middle button searches all of it at once. A grape, a place, a flavour — a few letters is enough.' },
  { id: 'entry', title: 'WHAT AN ENTRY LOOKS LIKE', highlight: 'entry', body: 'Every entry has the same shape: picture and name, three tiles that link onward, then the readouts. A row with an arrow opens the next entry.' },
  { id: 'back', title: 'GOING BACK', highlight: 'back', body: 'Back steps one screen at a time and remembers where you were — scroll position, open sections, all of it.' },
  { id: 'home', title: 'STARTING OVER', highlight: 'home', body: "Home returns to the main menu and clears the trail. Feeling lost? This one resets everything you didn't save." },
  { id: 'settings', title: 'MAKING IT YOURS', highlight: 'settings', body: 'The cog: screen modes, chassis skins, text size, haptics, sound. The person button beside Back keeps your shelf and profile.' },
  // The tool list is derived from the shelf (iOS 0.8.8, D2): hand-written
  // copy went stale twice over there — prose and a grid of literals cannot
  // be compared — so the sentence is built from what TOOLS actually draws.
  { id: 'tools', title: 'TOOLS', highlight: 'tools', body: `Also behind the cog: the wrench tile. ${toolSentence().charAt(0).toUpperCase()}${toolSentence().slice(1)}.` },
  { id: 'done', title: "THAT'S IT.", highlight: 'device', body: 'Press Home and pick a tile. Rerun this tour any time from TUTORIAL in settings.' },
];

interface WalkthroughScreenProps {
  onBack: () => void;
  onHome: () => void;
}

const WalkthroughScreen: React.FC<WalkthroughScreenProps> = ({ onBack, onHome }) => {
  const [index, setIndex] = useState(0);
  const step = STEPS[index]!;
  const h = step.highlight;
  const lit = (part: Part): boolean => h === 'device' || h === part || (part === 'settings' && h === 'tools');
  const isLast = index >= STEPS.length - 1;

  // A lit part gets an accent ring + glow; an unlit one dims (unless the whole
  // device is lit on the last step).
  const partStyle = (part: Part): React.CSSProperties =>
    lit(part)
      ? { outline: '2px solid var(--lcd-accent)', boxShadow: '0 0 10px var(--lcd-accent)', opacity: 1 }
      : { opacity: h === 'device' ? 1 : 0.38 };

  const tile = (Icon: React.ComponentType<{ size?: number; className?: string }>, bg: string) => (
    <div className={`rounded-md ${bg} flex items-center justify-center aspect-square`}>
      <Icon size={14} className="text-white" />
    </div>
  );

  return (
    <DeviceLayout title="TUTORIAL" subtitle="" showBack onBack={onBack} onHome={onHome} centerHeaderText>
      <div className="h-full overflow-y-auto custom-scrollbar p-4 flex flex-col gap-4" style={{ backgroundColor: 'var(--lcd-page)' }}>

        {/* Progress — equal-width capsule segments that fill the row, iOS-style. */}
        <div className="flex gap-1">
          {STEPS.map((s, i) => (
            <span key={s.id} className="flex-1 h-1 rounded-full transition-all" style={{ backgroundColor: i <= index ? 'var(--lcd-accent)' : 'var(--lcd-surface-edge)' }} />
          ))}
        </div>

        {/* Schematic mini-device */}
        <div className="mx-auto w-56 rounded-2xl p-3 flex flex-col gap-2" style={{ backgroundColor: 'var(--chassis-body)', border: '2px solid var(--chassis-panel-edge)' }}>
          {/* Island */}
          <div className="flex items-center gap-2 px-1">
            <span className="w-3 h-3 rounded-full bg-cyan-400" />
            <span className="flex gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500" /><span className="w-1.5 h-1.5 rounded-full bg-yellow-400" /><span className="w-1.5 h-1.5 rounded-full bg-green-500" /></span>
            <span className="flex-1" />
            <span className="rounded-full p-1" style={partStyle('settings')}><Settings size={16} style={{ color: 'var(--lcd-accent)' }} /></span>
          </div>

          {/* Screen */}
          <div className="rounded-lg p-2" style={{ backgroundColor: 'var(--lcd-screen)', minHeight: 118, ...partStyle('screen') }}>
            {h === 'entry' ? (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2" style={partStyle('entry')}>
                  <span className="w-9 h-9 rounded bg-red-800 flex items-center justify-center"><Leaf size={16} className="text-white" /></span>
                  <span className="flex-1 h-5 rounded" style={{ backgroundColor: 'var(--lcd-surface)' }} />
                </div>
                <div className="grid grid-cols-3 gap-1">{tile(Wine, 'bg-orange-600')}{tile(Grip, 'bg-purple-600')}{tile(Globe, 'bg-green-600')}</div>
                <div className="h-px my-0.5" style={{ backgroundColor: 'var(--lcd-accent)' }} />
                {[0, 1].map(i => (
                  <div key={i} className="flex items-center gap-1 rounded px-1 py-1" style={{ backgroundColor: 'var(--lcd-surface)' }}>
                    <span className="flex-1 h-2 rounded" style={{ backgroundColor: 'var(--lcd-surface-edge)' }} />
                    <ChevronRight size={12} style={{ color: 'var(--lcd-accent)' }} />
                  </div>
                ))}
              </div>
            ) : h === 'tools' ? (
              <div className="grid grid-cols-2 gap-1.5">
                <div className="rounded-md bg-yellow-400 flex items-center justify-center aspect-video" style={partStyle('tools')}><Wrench size={16} className="text-yellow-900" /></div>
                {[
                  { key: 'tutorial', Icon: Flag, bg: 'bg-green-600' },
                  { key: 'customize', Icon: Palette, bg: 'bg-red-500' },
                  { key: 'settings', Icon: SlidersHorizontal, bg: 'bg-orange-500' },
                ].map(({ key, Icon, bg }) => (
                  <div key={key} className={`rounded-md aspect-video flex items-center justify-center ${bg}`}>
                    <Icon size={14} className="text-white" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <div className="grid grid-cols-2 gap-1.5">{tile(Grip, 'bg-purple-500')}{tile(Globe, 'bg-green-500')}</div>
                <div className="flex justify-center">
                  <span className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center" style={partStyle('search')}><Search size={15} className="text-yellow-900" /></span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">{tile(Wine, 'bg-orange-500')}{tile(Leaf, 'bg-emerald-500')}</div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center gap-2 px-1">
            <span className="rounded-full p-1" style={partStyle('back')}><ChevronLeft size={16} style={{ color: 'var(--lcd-accent)' }} /></span>
            <span className="rounded-full p-1 opacity-60"><UserRound size={13} style={{ color: 'var(--lcd-accent)' }} /></span>
            <span className="flex-1 h-2 rounded" style={{ backgroundColor: 'var(--chassis-panel-edge)' }} />
            <span className="rounded-full p-1" style={partStyle('home')}><Home size={16} style={{ color: 'var(--lcd-accent)' }} /></span>
          </div>
        </div>

        {/* Copy */}
        <div className="rounded-card p-4 shadow-elev-1" style={{ backgroundColor: 'var(--lcd-surface)', border: '1px solid var(--lcd-surface-edge)' }}>
          <div className="font-sans text-label uppercase tracking-widest mb-2" style={{ color: 'var(--lcd-accent)' }}>{step.title}</div>
          <div className="font-sans text-body normal-case leading-relaxed" style={{ color: 'var(--lcd-body-text)' }}>{step.body}</div>
        </div>

        <div className="flex-1" />

        {/* Controls */}
        <div className="flex gap-3">
          {index > 0 && (
            <button onClick={() => setIndex(i => i - 1)} className="dex-pressable flex-1 rounded-control py-3 font-sans text-label tracking-widest" style={{ backgroundColor: 'var(--lcd-surface)', color: 'var(--lcd-text)', border: '2px solid var(--lcd-surface-edge)' }}>BACK</button>
          )}
          <button
            onClick={() => (isLast ? onHome() : setIndex(i => i + 1))}
            className="dex-pressable flex-1 rounded-control py-3 font-sans text-label tracking-widest text-[var(--lcd-on-accent)]"
            style={{ backgroundColor: 'var(--lcd-accent)' }}
          >
            {isLast ? 'FINISH' : 'NEXT'}
          </button>
        </div>
      </div>
    </DeviceLayout>
  );
};

export default WalkthroughScreen;
