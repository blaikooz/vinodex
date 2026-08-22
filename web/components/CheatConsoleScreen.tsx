import React, { useState } from 'react';
import { BadgeCheck, CheckCircle2, OctagonX, KeyRound } from 'lucide-react';
import DeviceLayout from './DeviceLayout';
import { CHEAT_CODES, matchCheatCode } from '../src/services/cheatCodes';
import { isGranted, toggleEntitlement } from '../src/services/access';
import { useAccess } from '../src/services/useAccess';
import { playCorrect } from '../src/services/sound';

interface CheatConsoleScreenProps {
  onBack: () => void;
  onHome: () => void;
}

type Verdict =
  | { kind: 'accepted'; reveal: string }
  /** Already owned — distinct because "OK" for something you unlocked last
   *  week reads as though nothing happened. */
  | { kind: 'already'; reveal: string }
  | { kind: 'rejected' };

/**
 * The unlock-code console, ported from
 * `vinodex-ios/Sources/VinodexUI/CheatConsoleScreen.swift` (0.7.3, A4) —
 * v6#29. Type a code, get told plainly whether it worked. Valid codes grant
 * through the access store — the same store the ACCESS panel writes — so an
 * unlock here and an unlock there are indistinguishable to every gate.
 *
 * **What it does not do is list the codes.** A console that shows you the
 * answers is a settings panel with extra steps. What it does show is how many
 * have been found, so there is something to complete.
 */
const CheatConsoleScreen: React.FC<CheatConsoleScreenProps> = ({ onBack, onHome }) => {
  useAccess();
  const [typed, setTyped] = useState('');
  const [verdict, setVerdict] = useState<Verdict | null>(null);

  // Counted through the entitlement store rather than kept as its own tally —
  // one source of truth for what is owned.
  const found = CHEAT_CODES.filter(c => isGranted(c.grants)).length;

  const submit = () => {
    const code = matchCheatCode(typed);
    setTyped('');
    if (!code) {
      setVerdict({ kind: 'rejected' });
      return;
    }
    const alreadyOwned = isGranted(code.grants);
    if (!alreadyOwned) toggleEntitlement(code.grants);
    playCorrect();
    setVerdict(alreadyOwned ? { kind: 'already', reveal: code.reveal } : { kind: 'accepted', reveal: code.reveal });
  };

  const readout = (v: Verdict) => {
    const [icon, tintCls, title, detail] =
      v.kind === 'accepted'
        ? [<BadgeCheck key="i" size={24} />, 'text-[var(--lcd-accent)]', 'ACCEPTED', v.reveal]
        : v.kind === 'already'
          ? [<CheckCircle2 key="i" size={24} />, 'text-[var(--lcd-subtext)]', 'ALREADY UNLOCKED', v.reveal]
          : [<OctagonX key="i" size={24} />, 'text-[var(--livery-red)]', 'INVALID CODE', 'Nothing unlocked.'];
    return (
      // Announced, not just drawn: this is the one screen whose entire output
      // is a single line of feedback.
      <div
        role="status"
        aria-label={`${title}. ${detail}`}
        className="flex items-center gap-3 rounded-control border-2 p-3.5"
        style={{ backgroundColor: 'var(--lcd-surface)', borderColor: 'currentcolor' }}
      >
        <span className={tintCls}>{icon}</span>
        <span className="flex flex-col gap-0.5">
          <span className={`font-sans text-label tracking-widest ${tintCls}`}>{title}</span>
          <span className="font-sans text-caption text-[var(--lcd-text)] normal-case">{detail}</span>
        </span>
      </div>
    );
  };

  return (
    <DeviceLayout title="CHEAT CODES" subtitle="" showBack onBack={onBack} onHome={onHome} centerHeaderText>
      <div className="h-full overflow-y-auto custom-scrollbar p-4 flex flex-col gap-4" style={{ backgroundColor: 'var(--lcd-page)' }}>
        <h2 className="font-sans text-label uppercase tracking-widest text-[var(--lcd-accent)] pb-1 border-b-2" style={{ borderColor: 'color-mix(in srgb, var(--lcd-accent) 45%, transparent)' }}>
          ENTER CODE
        </h2>

        <form
          onSubmit={e => { e.preventDefault(); if (typed) submit(); }}
          className="flex items-center gap-2.5 rounded-md border p-3"
          style={{ backgroundColor: 'var(--lcd-surface)', borderColor: 'var(--lcd-surface-edge)' }}
        >
          <span className="font-mono text-xl text-[var(--lcd-accent)]">&gt;</span>
          <input
            type="text"
            value={typed}
            onChange={e => setTyped(e.target.value)}
            placeholder=".........."
            aria-label="Cheat code"
            autoFocus
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            className="flex-1 min-w-0 bg-transparent font-mono text-xl uppercase text-[var(--lcd-body-text)] placeholder:text-[var(--lcd-disabled-text)] focus:outline-none"
          />
        </form>

        <button
          onClick={submit}
          disabled={!typed}
          className={`dex-pressable w-full rounded-control border-2 py-3.5 font-sans text-label tracking-widest ${
            typed ? 'bg-[var(--lcd-accent)] border-[var(--lcd-accent)] text-[var(--lcd-on-accent)]' : 'text-[var(--lcd-disabled-text)]'
          }`}
          style={typed ? undefined : { backgroundColor: 'var(--lcd-surface)', borderColor: 'var(--lcd-surface-edge)' }}
        >
          SUBMIT
        </button>

        {verdict && readout(verdict)}

        <div className="flex items-center gap-2.5">
          <KeyRound size={18} className="text-[var(--lcd-subtext)]" />
          <span className="font-sans text-caption tracking-widest text-[var(--lcd-subtext)]">
            {found} OF {CHEAT_CODES.length} FOUND
          </span>
        </div>

        <p className="font-sans text-caption text-[var(--lcd-subtext)] normal-case leading-relaxed">
          Codes are found, not listed. They unlock cosmetics, hidden features
          and the odd thing nobody asked for.
        </p>
      </div>
    </DeviceLayout>
  );
};

export default CheatConsoleScreen;
