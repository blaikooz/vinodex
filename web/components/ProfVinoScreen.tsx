import React, { useState, useSyncExternalStore } from 'react';
import { MessageSquare } from 'lucide-react';
import VinoPortrait from './VinoPortrait';
import DeviceLayout from './DeviceLayout';
import { VINO_EXPRESSIONS } from '../src/services/vinoDialogue';
import {
  isVinoSilenced,
  resetTriggers,
  setVinoSilenced,
  subscribeToTriggers,
} from '../src/services/firstTimeTriggers';
import { displayName } from '../src/services/profile';
import DexAlert from './DexAlert';

interface ProfVinoScreenProps {
  onBack: () => void;
  onHome: () => void;
}


const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div>
    <h2 className="text-label uppercase tracking-widest text-[var(--lcd-accent)] border-b pb-1 mb-2.5" style={{ borderColor: 'color-mix(in srgb, var(--lcd-accent) 45%, transparent)' }}>{title}</h2>
    {children}
  </div>
);

/**
 * Professor Vino's own page, ported from
 * `vinodex-ios/Sources/VinodexUI/ProfVinoScreen.swift` (0.8.93, item 9) —
 * v6#26. A working diagram of him: who he is, his six faces, the switch that
 * silences him (its one home — two switches over one stored key is the
 * two-writers fault), and the reset that lets his first-time tips fire again.
 * The per-trigger ledger readout came off with iOS's first-version hardening
 * (2026-08-31) — dev-facing, not a player surface.
 *
 * His six drawn portraits front the page and fill the FACES grid since the
 * v6#2 art ruling — the same baked assets iOS renders.
 */
const ProfVinoScreen: React.FC<ProfVinoScreenProps> = ({ onBack, onHome }) => {
  const silenced = useSyncExternalStore(subscribeToTriggers, isVinoSilenced, () => false);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const name = displayName();

  return (
    <DeviceLayout title="PROF. VINO" subtitle="" showBack onBack={onBack} onHome={onHome} centerHeaderText>
      <div className="h-full overflow-y-auto custom-scrollbar p-4 flex flex-col gap-5" style={{ backgroundColor: 'var(--lcd-page)' }}>
        {/* The hero. */}
        <div className="flex items-center gap-4">
          <span className="shrink-0 w-16 h-16 rounded-full border-2 border-[var(--livery-amber)] bg-[var(--surface-high)] flex items-center justify-center overflow-hidden">
            <VinoPortrait expression="neutral" size={56} />
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-title tracking-wide text-[var(--lcd-text)]">PROF. VINO</div>
            <p className="text-caption text-[var(--lcd-subtext)] normal-case leading-relaxed mt-1">
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
          className="dex-pressable w-full flex items-center gap-3 px-3 py-3 rounded-control border-2 text-left"
          style={{ backgroundColor: 'var(--lcd-surface)', borderColor: 'var(--lcd-surface-edge)' }}
        >
          <span className={silenced ? 'text-[var(--lcd-disabled-text)]' : 'text-[var(--livery-amber)]'}><MessageSquare size={20} /></span>
          <span className="flex-1 min-w-0">
            <span className="block text-label tracking-widest text-[var(--lcd-text)]">PROFESSOR VINO</span>
            <span className="block text-caption text-[var(--lcd-subtext)] normal-case mt-1">
              {silenced
                ? 'Quiet. He still guides the tutorial when you ask for it.'
                : 'One tip, once, the first time you try something new.'}
            </span>
          </span>
          <span className={`text-micro tracking-widest ${silenced ? 'text-[var(--lcd-disabled-text)]' : 'text-[var(--lcd-accent)]'}`}>
            {silenced ? 'OFF' : 'ON'}
          </span>
        </button>

        <Section title="HIS FACES">
          <div className="grid grid-cols-3 gap-2">
            {VINO_EXPRESSIONS.map(expression => (
              <div key={expression} className="rounded-card border border-[var(--surface-line)] bg-[var(--surface-raised)] p-2.5 flex flex-col items-center gap-1.5">
                <VinoPortrait expression={expression} size={44} />
                <span className="text-micro tracking-widest text-[var(--lcd-text)]">{expression.toUpperCase()}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="WHAT HE DOES">
          <ul className="flex flex-col gap-1.5">
            {[
              'Greets a fresh device, and asks what to call you.',
              'Narrates the TUTORIAL, one lit control at a time.',
              'Says one useful thing the first time you open each kind of page or tool - then never repeats himself.',
              'Offers a first guided tasting at the end of the tour.',
            ].map((text, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-caption text-[var(--lcd-accent)] opacity-70">&gt;</span>
                <span className="text-caption text-[var(--lcd-text)] normal-case leading-relaxed">{text}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="HIS MEMORY">
          <p className="text-caption text-[var(--lcd-subtext)] normal-case mb-2.5 leading-relaxed">
            He spends each first-time tip once. Reset them to hear him again, or
            load the FRESH profile for the whole first run.
          </p>
          <button
            onClick={() => setConfirmingReset(true)}
            className="dex-pressable w-full mt-2.5 py-3 rounded-control border-2 text-label tracking-widest"
            style={{ backgroundColor: 'var(--lcd-surface)', borderColor: 'color-mix(in srgb, var(--livery-amber) 50%, transparent)', color: 'var(--livery-amber)' }}
          >
            RESET HIS TIPS
          </button>
        </Section>

      </div>

      {confirmingReset && (
        <DexAlert
          tone="yellow"
          title="RESET HIS TIPS?"
          ariaLabel="Reset his tips"
          onDismiss={() => setConfirmingReset(false)}
          actions={[
            { label: 'CANCEL', kind: 'cancel', onClick: () => setConfirmingReset(false) },
            { label: 'RESET', kind: 'confirm', onClick: () => { setConfirmingReset(false); resetTriggers(); } },
          ]}
        >
          Every first-time tip is marked unsaid, so Professor Vino introduces
          things again as you reach them. Nothing else is touched.
        </DexAlert>
      )}
    </DeviceLayout>
  );
};

export default ProfVinoScreen;
