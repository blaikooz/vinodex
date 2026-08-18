import React, { useState, useSyncExternalStore } from 'react';
import { MessageSquare, CheckCircle2, CircleDashed } from 'lucide-react';
import VinoPortrait from './VinoPortrait';
import DeviceLayout from './DeviceLayout';
import { FIRST_TIME_TRIGGERS, VINO_EXPRESSIONS } from '../src/services/vinoDialogue';
import {
  hasFired,
  isVinoSilenced,
  resetTriggers,
  setVinoSilenced,
  subscribeToTriggers,
} from '../src/services/firstTimeTriggers';
import { displayName } from '../src/services/profile';

interface ProfVinoScreenProps {
  onBack: () => void;
  onHome: () => void;
}


const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div>
    <div className="font-retro text-[0.6rem] tracking-widest text-green-400 border-b border-green-800 pb-1 mb-2.5">{title}</div>
    {children}
  </div>
);

/**
 * Professor Vino's own page, ported from
 * `vinodex-ios/Sources/VinodexUI/ProfVinoScreen.swift` (0.8.93, item 9) —
 * v6#26. A working diagram of him: who he is, his six faces, the switch that
 * silences him (its one home — two switches over one stored key is the
 * two-writers fault), and the deliberately frank ledger of which first-time
 * tips have fired, whose audience today is the person testing him.
 *
 * His six drawn portraits front the page and fill the FACES grid since the
 * v6#2 art ruling — the same baked assets iOS renders.
 */
const ProfVinoScreen: React.FC<ProfVinoScreenProps> = ({ onBack, onHome }) => {
  const silenced = useSyncExternalStore(subscribeToTriggers, isVinoSilenced, () => false);
  // The ledger re-renders on any trigger-store change.
  useSyncExternalStore(subscribeToTriggers, () => {
    let bits = '';
    for (const t of FIRST_TIME_TRIGGERS) bits += hasFired(t) ? '1' : '0';
    return bits;
  }, () => '');
  const [confirmingReset, setConfirmingReset] = useState(false);
  const name = displayName();

  return (
    <DeviceLayout title="PROF. VINO" subtitle="" showBack onBack={onBack} onHome={onHome} centerHeaderText>
      <div className="h-full overflow-y-auto custom-scrollbar p-4 flex flex-col gap-5" style={{ backgroundColor: 'var(--lcd-page)' }}>
        {/* The hero. */}
        <div className="flex items-center gap-4">
          <span className="shrink-0 w-16 h-16 rounded-full border-2 border-amber-500 bg-stone-800 flex items-center justify-center overflow-hidden">
            <VinoPortrait expression="neutral" size={56} />
          </span>
          <div className="flex-1 min-w-0">
            <div className="font-retro text-base tracking-widest text-stone-100">PROF. VINO</div>
            <p className="font-mono text-xs text-stone-400 normal-case leading-snug mt-1">
              {name
                ? `The resident wine professor. He calls you ${name}, and says one useful thing the first time you try something new.`
                : 'The resident wine professor. He introduces himself on a fresh device, asks your name, and says one useful thing the first time you try something new.'}
            </p>
          </div>
        </div>

        {/* The silence switch — moved here, not copied (0.8.93). */}
        <button
          onClick={() => setVinoSilenced(!silenced)}
          role="switch"
          aria-checked={!silenced}
          className="w-full flex items-center gap-3 px-3 py-3 rounded border-2 text-left transition-all active:translate-y-0.5"
          style={{ backgroundColor: 'var(--lcd-surface)', borderColor: 'var(--lcd-surface-edge, #44403c)' }}
        >
          <span className={silenced ? 'text-stone-500' : 'text-amber-400'}><MessageSquare size={20} /></span>
          <span className="flex-1 min-w-0">
            <span className="block font-retro text-[0.6rem] tracking-widest text-stone-100">PROFESSOR VINO</span>
            <span className="block font-mono text-sm text-stone-400 normal-case mt-1">
              {silenced
                ? 'Quiet. He still guides the tutorial when you ask for it.'
                : 'One tip, once, the first time you try something new.'}
            </span>
          </span>
          <span className={`font-retro text-[0.55rem] tracking-widest ${silenced ? 'text-stone-500' : 'text-green-400'}`}>
            {silenced ? 'OFF' : 'ON'}
          </span>
        </button>

        <Section title="HIS FACES">
          <div className="grid grid-cols-3 gap-2">
            {VINO_EXPRESSIONS.map(expression => (
              <div key={expression} className="rounded-lg border border-stone-700 bg-stone-900/50 p-2.5 flex flex-col items-center gap-1.5">
                <VinoPortrait expression={expression} size={44} />
                <span className="font-retro text-[0.5rem] tracking-widest text-stone-300">{expression.toUpperCase()}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="WHAT HE DOES">
          <ul className="flex flex-col gap-1.5">
            {[
              'Greets a fresh device, and asks what to call you.',
              'Narrates the TUTORIAL, one lit control at a time.',
              'Says one useful thing the first time you open each kind of page or tool - the ledger below is his memory of what he has already said.',
              'Offers a first guided tasting at the end of the tour.',
            ].map((text, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="font-mono text-xs text-green-400/70">&gt;</span>
                <span className="font-mono text-xs text-stone-200 normal-case leading-snug">{text}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="HIS LEDGER">
          <p className="font-mono text-[0.65rem] text-stone-500 normal-case mb-2.5">
            Which first-time tips have been spent. A diagnostic readout for now —
            reset it to hear him again, or load the FRESH profile for the whole
            first run.
          </p>
          <div className="flex flex-col gap-1">
            {FIRST_TIME_TRIGGERS.map(trigger => {
              const fired = hasFired(trigger);
              return (
                <div key={trigger} className="flex items-center gap-2.5 px-2 py-1.5 rounded bg-stone-900/40">
                  {fired
                    ? <CheckCircle2 size={14} className="text-green-400 shrink-0" />
                    : <CircleDashed size={14} className="text-stone-600 shrink-0" />}
                  <span className="flex-1 font-mono text-[0.65rem] text-stone-300 normal-case truncate">{trigger}</span>
                  <span className={`font-retro text-[0.5rem] tracking-widest ${fired ? 'text-green-400' : 'text-stone-500'}`}>
                    {fired ? 'SAID' : 'WAITING'}
                  </span>
                </div>
              );
            })}
          </div>
          <button
            onClick={() => setConfirmingReset(true)}
            className="w-full mt-2.5 py-3 rounded border-2 font-retro text-[0.6rem] tracking-widest transition-colors"
            style={{ backgroundColor: 'var(--lcd-surface)', borderColor: 'rgba(234,179,8,0.5)', color: '#eab308' }}
          >
            RESET HIS TIPS
          </button>
        </Section>

        <p className="font-mono text-[0.62rem] text-stone-500 normal-case text-center pb-2">
          Talking to the professor directly lands on this page in a later firmware.
        </p>
      </div>

      {confirmingReset && (
        <div className="absolute inset-0 z-40 bg-black/80 flex items-center justify-center p-6" role="dialog" aria-modal="true" aria-label="Reset his tips">
          <div className="w-full max-w-xs bg-stone-900 border-2 border-yellow-700 rounded-lg p-5 flex flex-col gap-4 text-center">
            <p className="font-retro text-xs tracking-widest text-yellow-300">RESET HIS TIPS?</p>
            <p className="font-mono text-sm text-stone-300 normal-case">
              Every first-time tip is marked unsaid, so Professor Vino introduces
              things again as you reach them. Nothing else is touched.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmingReset(false)} className="flex-1 font-retro text-[0.6rem] tracking-widest text-stone-300 border-2 border-stone-600 rounded py-3">CANCEL</button>
              <button
                onClick={() => { setConfirmingReset(false); resetTriggers(); }}
                className="flex-1 font-retro text-[0.6rem] tracking-widest text-black bg-yellow-400 border-2 border-yellow-600 rounded py-3"
              >
                RESET
              </button>
            </div>
          </div>
        </div>
      )}
    </DeviceLayout>
  );
};

export default ProfVinoScreen;
