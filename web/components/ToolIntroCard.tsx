import React, { useEffect, useRef, useSyncExternalStore } from 'react';
import { useLocation } from 'react-router-dom';
import ArtImage from './ArtImage';
import { setSuspended } from '../src/services/vinoPresenter';
import {
  ToolIntro,
  markAllToolIntrosSeen,
  markToolIntroSeen,
  pendingToolIntro,
  subscribeToToolIntros,
} from '../src/services/toolIntro';

/**
 * The card raised the first time a tool is opened — v10#5 (v0.6.27), ported
 * from `vinodex-ios/Sources/VinodexUI/ToolIntroCard.swift` (0.8.8 D1).
 *
 * **`DexAlert`'s clothes, not `DexAlert`.** The house rule is that modals
 * are `DexAlert`, and that control is a title, a message and up to two
 * buttons — this needs the tool's own drawing at a size worth looking at, a
 * tagline and a body, and a third control that is not about *this* card.
 * Rather than grow the shared alert with a picture well and a third button
 * for one caller, this borrows its scrim, its panel and its motion so the
 * two read as the same kind of thing.
 *
 * START spends this card and lets the tool through. SKIP THESE spends all
 * six at once — the returning player's answer, and the reason there is no
 * seed flag: the app has no record of which tools anybody has used, so
 * rather than guess and suppress, it asks once and takes an answer for all
 * of them. While it is up the professor holds his tongue (the same
 * suspension seam the intro card claims), so two first-run cards never stack.
 */
export const ToolIntroCard: React.FC<{ intro: ToolIntro }> = ({ intro }) => {
  // Focus lands on START by ref rather than `autoFocus` -- the same shape
  // DexAlert uses, and the one jsx-a11y accepts: a modal that has just
  // taken over the screen moving focus into itself is the accessible
  // behaviour, not the anti-pattern the attribute rule guards against.
  const start = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    setSuspended(true, 'toolIntro');
    start.current?.focus();
    return () => setSuspended(false, 'toolIntro');
  }, []);
  return (
    <div
      className="absolute inset-0 z-30 bg-black/75 flex items-center justify-center p-5"
      role="dialog"
      aria-modal="true"
      aria-label={`${intro.title}: what this tool is`}
      data-tool-intro={intro.id}
    >
      <div className="lcd-themed w-full max-w-sm rounded-card border-2 bg-[var(--surface-raised)] p-5 flex flex-col items-center gap-3.5 text-center shadow-elev-3" style={{ borderColor: `color-mix(in srgb, ${intro.faceHex} 60%, transparent)` }}>
        <span className="flex h-20 w-20 items-center justify-center rounded-surface" style={{ backgroundColor: `color-mix(in srgb, ${intro.faceHex} 22%, transparent)` }} aria-hidden="true">
          <ArtImage src={intro.art} alt="" width={56} height={56} style={{ imageRendering: 'pixelated', objectFit: 'contain' }} />
        </span>
        <h2 className="font-retro text-title tracking-widest text-[var(--lcd-text)]">{intro.title}</h2>
        <p className="font-retro text-[11px] leading-relaxed tracking-wide" style={{ color: intro.faceHex }}>{intro.tagline}</p>
        <p className="text-body normal-case leading-relaxed text-left text-[var(--lcd-subtext)]">{intro.body}</p>
        <button
          type="button"
          ref={start}
          onClick={() => markToolIntroSeen(intro.id)}
          className="dex-pressable mt-1 w-full min-h-11 rounded-full font-retro text-heading tracking-[0.2em] text-black shadow-elev-2"
          style={{ backgroundColor: intro.faceHex }}
        >
          START
        </button>
        <button
          type="button"
          onClick={markAllToolIntrosSeen}
          className="dex-pressable w-full min-h-9 rounded-full font-retro text-[11px] tracking-widest text-[var(--lcd-subtext)]"
        >
          SKIP THESE
        </button>
      </div>
    </div>
  );
};

/**
 * DeviceLayout's slot for the pending card on the current route. Reads the
 * seen store through `useSyncExternalStore`, so START and SKIP THESE take
 * the card down by changing the fact rather than by local state.
 */
export const ToolIntroHost: React.FC = () => {
  const { pathname } = useLocation();
  const intro = useSyncExternalStore(subscribeToToolIntros, () => pendingToolIntro(pathname), () => null);
  if (!intro) return null;
  return <ToolIntroCard intro={intro} />;
};

export default ToolIntroCard;
