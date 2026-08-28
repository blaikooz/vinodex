import React, { useEffect, useRef } from 'react';

/**
 * The confirm/alert card (stage 4, v0.4.3) — the U2 scrim primitive, for the
 * settings family's five dialogs.
 *
 * **Deliberately fixed-colour, and deliberately NOT in `designTokens`'
 * CONVERTED list.** iOS's `DexAlert` is fixed-colour end to end — a modal
 * interruption reads the same on every screen mode on purpose, and
 * `index.css`'s remap notes record the same call for the web (`text-stone-300`
 * was deliberately never remapped). What *does* convert is the typography:
 * the title takes the sans label step and the body the sans caption, because
 * the fixed palette was the decision and the pixel face was not.
 *
 * Craft that comes with the extraction (the U6 floor):
 * - `role="dialog"` / `"alertdialog"` + `aria-modal` on every instance;
 * - Escape closes, through the same path as the cancel action;
 * - initial focus lands on the least destructive action.
 * Full focus trapping is deliberately not attempted here — the scrim covers
 * the LCD only and the chassis stays live, which matches the product's idea
 * of a dialog on the screen rather than over the app.
 */

export type DexAlertTone = 'green' | 'yellow' | 'red';

const TONE: Record<DexAlertTone, { border: string; title: string; confirmBg: string; confirmBorder: string; confirmText: string }> = {
  green: { border: 'border-green-700', title: 'text-green-300', confirmBg: 'bg-green-700', confirmBorder: 'border-green-900', confirmText: 'text-white' },
  yellow: { border: 'border-yellow-700', title: 'text-yellow-300', confirmBg: 'bg-yellow-400', confirmBorder: 'border-yellow-600', confirmText: 'text-black' },
  red: { border: 'border-red-700', title: 'text-red-400', confirmBg: 'bg-red-700', confirmBorder: 'border-red-900', confirmText: 'text-white' },
};

export interface DexAlertAction {
  label: string;
  onClick: () => void;
  /** `confirm` wears the tone's fill; `cancel` is the outlined grey. */
  kind: 'cancel' | 'confirm';
}

export const DexAlert: React.FC<{
  tone: DexAlertTone;
  title: string;
  /** Body copy, sentence case; the card supplies the type. */
  children: React.ReactNode;
  actions: DexAlertAction[];
  /** `alertdialog` for errors and destructive confirms. */
  role?: 'dialog' | 'alertdialog';
  ariaLabel: string;
  /** Escape and (for single-action alerts) the only button. */
  onDismiss: () => void;
}> = ({ tone, title, children, actions, role = 'dialog', ariaLabel, onDismiss }) => {
  const t = TONE[tone];
  const firstSafe = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    firstSafe.current?.focus();
  }, []);

  return (
    <div
      className="absolute inset-0 z-30 bg-black/80 flex items-center justify-center p-6"
      role={role}
      aria-modal="true"
      aria-label={ariaLabel}
      onKeyDown={e => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          onDismiss();
        }
      }}
    >
      <div className={`w-full max-w-xs bg-stone-900 border-2 ${t.border} rounded-card p-5 flex flex-col gap-4 text-center`}>
        <p className={`text-label tracking-widest ${t.title}`}>{title}</p>
        <div className="text-caption leading-relaxed text-stone-300 normal-case">{children}</div>
        <div className="flex gap-3">
          {actions.map((a, i) => (
            <button
              key={a.label}
              ref={a.kind === 'cancel' || actions.length === 1 ? (i === 0 ? firstSafe : undefined) : undefined}
              onClick={a.onClick}
              className={
                a.kind === 'cancel'
                  ? 'dex-pressable flex-1 text-micro tracking-widest text-stone-300 border-2 border-stone-600 rounded-control py-3'
                  : `dex-pressable flex-1 text-micro tracking-widest ${t.confirmText} ${t.confirmBg} border-2 ${t.confirmBorder} rounded-control py-3`
              }
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DexAlert;
