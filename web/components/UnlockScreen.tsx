import React, { useCallback, useEffect, useState } from 'react';
import { Delete, Lock } from 'lucide-react';
import DeviceLayout from './DeviceLayout';
import { UNLOCK_CODE_LENGTH, unlockApp } from '../src/services/appUnlock';

interface UnlockScreenProps {
  onUnlocked: () => void;
  onBack: () => void;
  onHome: () => void;
}

/**
 * The code gate in front of Vinodex.
 *
 * A keypad rather than a text input. On a device whose whole identity is
 * physical buttons, a system keyboard sliding over the chassis breaks the
 * illusion at exactly the moment the product is trying to feel like hardware —
 * and a four-digit numeric code needs ten keys, not a full keyboard. Hardware
 * keys still work (see the keydown listener), which also makes the screen
 * testable without synthesising taps.
 *
 * The verdict is deliberately deferred to an effect on `code` rather than fired
 * from inside the tap handler, so the fourth pip paints filled before the
 * screen either advances or rejects. Judging inside a state updater would also
 * run twice under StrictMode.
 */
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

/**
 * One keypad key.
 *
 * **At module scope, and that is the whole point (M3).** This was declared
 * inside `UnlockScreen`'s render body, which is W1's defect at a smaller
 * scale — a component declared there is a new function identity every render,
 * and React compares element types by identity, so it unmounts and rebuilds.
 *
 * Smaller scale, but *not* smaller effect, and the lint baseline was wrong to
 * file it beside `MoonDialScreen`'s `Row` on that basis. `Row` is
 * non-interactive and stateless, so remounting it costs a little work and
 * nothing else. `Key` renders a `<button>`, and every press calls `setCode` —
 * so all twelve keys were torn down and rebuilt after **every digit**, and
 * keyboard focus was lost from the key the user had just pressed. Entering a
 * code by keyboard meant re-finding your place four times.
 */
const Key: React.FC<{ label: React.ReactNode; onClick: () => void; ariaLabel: string }> = ({
  label,
  onClick,
  ariaLabel,
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={ariaLabel}
    className="aspect-square rounded-xl bg-stone-900 border-2 border-green-700 flex items-center justify-center font-retro text-lg sm:text-xl text-green-300 transition-all active:translate-y-0.5 hover:bg-stone-800"
  >
    {label}
  </button>
);

const UnlockScreen: React.FC<UnlockScreenProps> = ({ onUnlocked, onBack, onHome }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);

  const push = useCallback((digit: string) => {
    setError(false);
    setCode(prev => (prev.length >= UNLOCK_CODE_LENGTH ? prev : prev + digit));
  }, []);

  const backspace = useCallback(() => {
    setError(false);
    setCode(prev => prev.slice(0, -1));
  }, []);

  useEffect(() => {
    if (code.length < UNLOCK_CODE_LENGTH) return;
    if (unlockApp('vinodex', code)) {
      onUnlocked();
      return;
    }
    setError(true);
    setCode('');
  }, [code, onUnlocked]);

  // A physical keyboard is the faster way in on a desktop, and the only way to
  // drive this screen from a test.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') push(e.key);
      else if (e.key === 'Backspace') backspace();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [push, backspace]);

  return (
    <DeviceLayout
      title="UNLOCK"
      subtitle=""
      showBack={true}
      onBack={onBack}
      onHome={onHome}
      centerHeaderText={true}
      showSystemButtons={false}
    >
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar bg-stone-950 p-3">
        <div className="flex flex-col items-center gap-4">

          <div className="flex flex-col items-center gap-2 pt-1">
            <Lock size={26} className="text-yellow-400" />
            <span className="font-retro text-[0.7rem] sm:text-xs tracking-widest text-green-300 text-center">
              UNLOCK VINODEX
            </span>
            <span className="font-retro text-[0.55rem] tracking-widest text-green-500 text-center px-2 leading-relaxed">
              ENTER YOUR {UNLOCK_CODE_LENGTH}-DIGIT CODE
            </span>
          </div>

          {/* Filled/empty pips — the only readout, since the code is never echoed. */}
          <div className="flex gap-3" role="status" aria-label={`${code.length} of ${UNLOCK_CODE_LENGTH} digits entered`}>
            {Array.from({ length: UNLOCK_CODE_LENGTH }).map((_, i) => (
              <span
                key={i}
                className={`w-3.5 h-3.5 rounded-full border-2 transition-colors ${
                  error
                    ? 'border-red-500 bg-red-500/40'
                    : i < code.length
                      ? 'border-green-400 bg-green-400'
                      : 'border-green-700 bg-transparent'
                }`}
              />
            ))}
          </div>

          {/*
            The slot is reserved whether or not there is an error, so the keypad
            does not jump a row the first time a code is refused.
          */}
          <span
            role="alert"
            className={`font-retro text-[0.55rem] tracking-widest min-h-[0.8rem] ${
              error ? 'text-red-400' : 'text-transparent'
            }`}
          >
            {error ? 'INCORRECT CODE' : ' '}
          </span>

          <div className="grid grid-cols-3 gap-2.5 w-full max-w-[15rem]">
            {KEYS.map(k => (
              <Key key={k} label={k} ariaLabel={k} onClick={() => push(k)} />
            ))}
            {/* Empty cell keeps 0 centred under 8, as on a real keypad. */}
            <span aria-hidden="true" />
            <Key label="0" ariaLabel="0" onClick={() => push('0')} />
            <Key
              label={<Delete size={20} />}
              ariaLabel="Delete"
              onClick={backspace}
            />
          </div>

          {/*
            Placeholder gate, placeholder hint — the code is `0000` and it lives
            in the client bundle, so printing it costs nothing and saves anyone
            testing from guessing. Delete this line when a real code arrives.
          */}
          <span className="font-retro text-[0.5rem] tracking-widest text-stone-500 text-center pb-1">
            DEMO CODE — 0000
          </span>

        </div>
      </div>
    </DeviceLayout>
  );
};

export default UnlockScreen;
