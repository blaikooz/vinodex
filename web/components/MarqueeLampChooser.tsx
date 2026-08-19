import React, { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
import { Pin, Check } from 'lucide-react';
import { SETTINGS_SECTIONS } from '../src/services/settingsSections';
import {
  MARQUEE_PINS,
  assignPin,
  pinAt,
  pinSection,
  pins,
  pinsRevision,
  subscribeToPins,
  type MarqueePin,
} from '../src/services/quickPins';

/**
 * Where one marquee lamp button points.
 *
 * Ported from `vinodex-ios/Sources/VinodexUI/MarqueeLampChooser.swift`
 * (iOS 0.7.6, A1). Its header carries the design decision and every property
 * below follows from one sentence of it, so the sentence is kept:
 *
 * > **So this is a chooser, not a menu.** It does not navigate — tapping a chip
 * > assigns and closes, it does not take you there — because a surface that
 * > both configures a button and duplicates it is the duplication that was just
 * > removed.
 *
 * That is what A1 bought. Through iOS 0.7.5 the device had three ways to reach
 * the same handful of places: two hardwired lamps, two corner pins, and a swipe
 * drawer whose PINNED row chose what the lamps held. A1 collapsed all three
 * into the lamps and deleted the drawer; what survived is the one thing the
 * lamps could not do on their own, which is say where they go. So there is no
 * TOOLS grid here (the shelf is one lamp press away), no swipe (there is
 * nothing to browse), and no navigation.
 *
 * **Drawn in the LCD**, like every other overlay in this app. iOS's reason
 * transfers exactly: a sheet sliding up from the bottom of the *phone* breaks
 * the handheld metaphor, and this one is raised from a button on the chassis,
 * which makes it the surface with the strongest claim to sit outside the
 * display and the strongest reason not to. Inside, it inherits the screen's
 * palette, its monochrome pass and its scanlines.
 *
 * ## Where the web goes further
 *
 * iOS marks the card `.isModal` and lets the system do the rest. The web has
 * to say all of it out loud, and this is the first dialog in the repo that
 * does — `role="dialog"`, `aria-modal`, an initial focus, a focus trap and
 * Escape to close. v7#U2/U6 record that seven scrims existed and none of them
 * did any of this; the pattern starts here rather than being retrofitted
 * everywhere in a release that is about lamps.
 */
export interface MarqueeLampChooserProps {
  /** 0 is the left lamp, 1 the right. */
  slot: number;
  onClose: () => void;
}

/**
 * Which lamp this is, in words.
 *
 * "LEFT" and "RIGHT" rather than "1" and "2", which is iOS's call and a good
 * one: the two buttons are physical objects on the shell and the user is
 * looking straight at them, so the label that identifies one is the one they
 * can see.
 */
const slotName = (slot: number): string => (slot === 0 ? 'LEFT' : 'RIGHT');

/**
 * A pin's glyph, taken from wherever the destination already keeps it.
 *
 * The settings grid's own icons for the four sections, so a chip cannot wear a
 * mark the tile it names does not — iOS's `MarqueePin.symbol` forwards to
 * `SettingsSection.symbol` for exactly this reason. TOOLS has no section, so it
 * takes the wrench the shelf already uses.
 */
const pinGlyph = (pin: MarqueePin): React.ReactNode => {
  const section = pinSection(pin);
  const found = section ? SETTINGS_SECTIONS.find(s => s.id === section) : undefined;
  return found ? found.icon : <Pin size={30} />;
};

const MarqueeLampChooser: React.FC<MarqueeLampChooserProps> = ({ slot, onClose }) => {
  useSyncExternalStore(subscribeToPins, pinsRevision, pinsRevision);
  const card = useRef<HTMLDivElement>(null);
  const mine = pinAt(slot);

  // Focus lands in the card, and comes back out to whatever raised it. Without
  // the restore, dismissing the chooser drops focus on `<body>` and a keyboard
  // user is at the top of the document with no idea where the lamp went.
  const opener = useRef<HTMLElement | null>(null);
  useEffect(() => {
    opener.current = document.activeElement as HTMLElement | null;
    card.current?.querySelector<HTMLElement>('button')?.focus();
    return () => opener.current?.focus?.();
  }, []);

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key !== 'Tab') return;
    // The trap. A dialog a keyboard can tab out of is a dialog that is modal
    // for a mouse and not for anything else.
    const focusable = card.current?.querySelectorAll<HTMLElement>('button');
    if (!focusable || focusable.length === 0) return;
    const first = focusable[0]!;
    const last = focusable[focusable.length - 1]!;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, [onClose]);

  const choose = (pin: MarqueePin) => {
    assignPin(pin, slot);
    onClose();
  };

  return (
    <div className="absolute inset-0 z-[5] flex flex-col justify-end">
      {/* Tapping outside dismisses — the convention every modal in this app
          follows. A `<button>` rather than a div with a click handler, so it is
          reachable and announced instead of being a trap for a pointer only. */}
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 w-full h-full bg-black/60 cursor-default"
        onClick={onClose}
      />

      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions --
          a dialog is a container rather than a widget, so the rule sees the
          handler as misplaced; but Escape-to-close and a Tab trap on the
          dialog root are precisely the documented pattern, and the alternative
          the rule wants (a handler on each of the seven buttons inside) is the
          same behaviour written seven times. */}
      <div
        ref={card}
        role="dialog"
        aria-modal="true"
        aria-labelledby="lamp-chooser-title"
        // Escape and the Tab trap live on the card rather than on the scrim's
        // parent: focus starts inside it and the trap keeps it there, so every
        // key this dialog cares about bubbles to exactly here.
        onKeyDown={onKeyDown}
        className="relative m-1.5 rounded-[0.875rem] border-2 p-3.5 flex flex-col gap-3 overflow-hidden"
        style={{
          backgroundColor: 'var(--lcd-surface)',
          borderColor: 'var(--lcd-accent)',
        }}
      >
        {/* A hairline along the top edge — the one place the card admits it
            came out of the marquee.

            iOS draws it in `skin.marqueeText`, the shell's own phosphor. **The
            web has no such token**: its marquee letters are a fixed
            `text-green-500` on all twenty-two shells, so there is nothing
            per-skin to read and inventing one here would be a colour the panel
            below does not actually wear. The LCD accent is the honest stand-in
            until the marquee phosphor is itself ported — recorded as a
            deviation rather than papered over. */}
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-0.5"
          style={{ backgroundColor: 'var(--lcd-accent)' }}
        />

        <div className="flex items-center gap-2">
          <Pin size={13} aria-hidden="true" style={{ color: 'var(--lcd-accent)' }} />
          <h2
            id="lamp-chooser-title"
            className="font-retro text-[0.75rem] tracking-[0.09em]"
            style={{ color: 'var(--lcd-text)' }}
          >
            {slotName(slot)} BUTTON
          </h2>
        </div>

        <p
          className="font-retro text-[0.625rem] tracking-[0.06em] leading-none"
          style={{ color: 'var(--lcd-body-text)' }}
        >
          POINT IT AT
        </p>

        {/* Three columns, five chips, the second row half empty — iOS's own
            arithmetic: five chips across the panel gives columns too narrow for
            CUSTOMIZE, and three columns is wide enough for it on two lines. */}
        <div className="grid grid-cols-3 gap-2">
          {MARQUEE_PINS.map(pin => {
            const isMine = mine === pin;
            // The pin the OTHER lamp holds. This middle state is what makes the
            // swap rule legible: assigning an already-used destination trades
            // the two lamps, and a chooser that gave no sign the other button
            // held it would make that read as the app losing a setting.
            const elsewhere = !isMine && pins().includes(pin);
            return (
              <button
                key={pin}
                type="button"
                onClick={() => choose(pin)}
                aria-pressed={isMine}
                className={`relative flex flex-col items-center justify-center gap-1 min-h-[3.5rem] py-2 px-1
                            rounded-[0.4375rem] transition-transform duration-100 active:scale-[0.95]
                            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--lcd-accent)]
                            ${elsewhere ? 'border-2' : 'border'}`}
                style={{
                  backgroundColor: isMine ? 'var(--lcd-accent)' : 'var(--lcd-page)',
                  borderColor: elsewhere ? 'var(--lcd-accent)' : 'var(--lcd-surface-edge)',
                  color: isMine ? 'var(--lcd-screen)' : 'var(--lcd-text)',
                }}
              >
                <span className="[&_svg]:w-[1.0625rem] [&_svg]:h-[1.0625rem]" aria-hidden="true">
                  {pinGlyph(pin)}
                </span>
                <span className="font-retro text-[0.625rem] tracking-[0.03em] text-center leading-tight">
                  {pin}
                </span>
                {isMine && (
                  <Check
                    size={9}
                    strokeWidth={4}
                    aria-hidden="true"
                    className="absolute top-1 right-1"
                  />
                )}
                {elsewhere && (
                  // The other lamp, named by the side it is on rather than by a
                  // number nobody has been shown.
                  <span
                    aria-hidden="true"
                    className="absolute top-1 right-1 font-retro text-[0.625rem]"
                    style={{ color: 'var(--lcd-accent)' }}
                  >
                    {slot === 0 ? 'R' : 'L'}
                  </span>
                )}
                <span className="sr-only">
                  {isMine
                    ? `Already on the ${slotName(slot).toLowerCase()} button`
                    : elsewhere
                      ? 'Currently on the other button. Choosing it swaps the two.'
                      : `Point the ${slotName(slot).toLowerCase()} button here`}
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 rounded-[0.375rem] border-2 font-retro text-[0.6875rem] tracking-[0.06em]
                     transition-transform duration-100 active:scale-[0.98]
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--lcd-accent)]"
          style={{
            backgroundColor: 'var(--lcd-surface)',
            borderColor: 'var(--lcd-surface-edge)',
            color: 'var(--lcd-body-text)',
          }}
        >
          CLOSE
        </button>
      </div>
    </div>
  );
};

export default MarqueeLampChooser;
