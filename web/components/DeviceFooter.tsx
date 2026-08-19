import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { Home, CircleUser, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { ChassisSkinId, FooterCapKind } from '../src/services/theme';
import { useTheme } from '../src/services/useTheme';
import { useMarqueeScript } from '../src/services/useMarqueeScript';
import { marqueeGlyph } from '../src/services/marqueeArt';
import { pinAt, pinRoute, pinsRevision, subscribeToPins } from '../src/services/quickPins';
import MarqueeLampButton from './MarqueeLampButton';
import ChassisLamp from './ChassisLamp';

/**
 * The button band.
 *
 * Footer — the button band (iOS v0.6.9): two vertical bundles in milled
 * capsule wells — Back over Saved on the left, Home over Settings on the
 * right — flanking the marquee panel and its two indicator lamps. `zoom`
 * scales the whole furniture with the UI-size axis.
 *
 * **Extracted from `DeviceLayout.tsx` (v7#W7).** It is the larger half of the
 * chassis by line count -- four moulded caps, two milled wells, the marquee
 * panel and its two lamps -- and it shares nothing with the screen housing
 * above it but the shell colour. The marquee script comes with it, because the
 * panel that reads the script is here.
 */
export interface DeviceFooterProps {
  /** The screen's own name. Feeds the marquee panel and its glyph. */
  title: string;
  /** Replaces the marquee panel outright, for screens that draw their own. */
  footerCenter?: React.ReactNode;
  onBack?: () => void;
  showBack?: boolean;
  onHome?: () => void;
  /** SAVED and SETTINGS. The splash turns them off; see `DeviceLayoutProps`. */
  showSystemButtons?: boolean;
  /**
   * Raise the lamp chooser for a slot.
   *
   * Injected rather than owned, because the chooser is drawn **inside the
   * LCD** — iOS's rule, and the reason it is: an overlay raised from a button
   * on the chassis is the surface with the strongest claim to sit outside the
   * display and the strongest reason not to. So the band asks and
   * `DeviceLayout` mounts. Absent leaves the lamps navigable and not
   * reassignable, which is what the splash wants.
   */
  onReassignLamp?: (slot: number) => void;
}

/**
 * One moulded footer cap, painted by the skin (S1).
 *
 * **The web had iOS's Home fork frozen in Tailwind.** Back, User and Settings
 * were hardcoded `from-stone-700 to-stone-950 border-stone-400`; Home was
 * hardcoded `from-amber-200 to-amber-500 border-amber-700` *plus an inner lit
 * disc* -- and all four rendered identically on every one of the twenty-two
 * skins. Measured before the change: the Home face and glyph came out
 * `rgb(123,51,6)` on CLASSIC, ORIGINAL, BURGUNDY, OAKED, PET NAT, HALLOWEEN,
 * W64 and PSVINO alike.
 *
 * That inner disc is the exact thing iOS deleted in 0.8.98. Its argument is
 * worth restating rather than just following, because it is what makes this a
 * four-line function instead of a switch: a lit Home is a cap that happens to
 * be *bright*, not a control drawn by a second rule. Once the colour comes
 * from the skin, there is nothing left for a `.home` branch to do -- and the
 * history iOS records is that a branch which exists eventually disagrees with
 * its neighbours. Three consecutive iOS releases of cap fixes each "missed
 * the home button" for precisely that reason.
 *
 * So there is one function, no kind parameter beyond which token set to read,
 * and the four call sites differ only in their glyph and their action.
 */
const capStyle = (kind: FooterCapKind): React.CSSProperties => ({
  backgroundImage: `linear-gradient(to bottom, var(--cap-${kind}-top), var(--cap-${kind}-bottom))`,
  borderColor: `var(--cap-${kind}-edge)`,
  color: `var(--cap-${kind}-glyph)`,
});

/**
 * The shared geometry and press of a moulded cap.
 *
 * `active:scale-[0.88]` and the brightness drop are iOS's `ChassisPress`, not
 * its `DexPressStyle` (S8). iOS keeps the two apart deliberately: on-screen
 * things press at 0.96, moulded parts of the shell press deeper and lose the
 * light on the face. The orb already used these numbers and the four caps did
 * not, which is the asymmetry this closes.
 */
const CAP_CLASS =
  'relative w-12 h-12 md:w-14 md:h-14 rounded-full border-[3px] '
  + 'shadow-[inset_0_3px_6px_rgba(255,255,255,0.15),0_6px_10px_rgba(0,0,0,0.5)] '
  + 'flex items-center justify-center '
  + 'transition-[transform,filter] duration-100 '
  + 'active:scale-[0.88] active:brightness-90 '
  + 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 '
  + 'focus-visible:ring-offset-[color:var(--chassis-footer)]';


/**
 * The drawn cap for one control on the active skin, or null.
 *
 * `art/caps/{SKIN}-{kind}.png`, baked by `scripts/bake-footer-caps.py` from
 * the four source sprites `sync-shared.ps1` mirrors out of iOS. 22 skins x 4
 * caps = 88 files, 608 KB, none over ~12 KB, runtime-cached rather than
 * precached like the rest of the art.
 *
 * **Null is a real answer, and the fallback is the whole control.** This is
 * `ChassisButton.drawnCap`'s rule and it is worth keeping: the CSS circle
 * underneath is not a placeholder, it is the button, correctly coloured by
 * the same tokens. So an unbaked skin, a failed request or a browser with
 * images off degrades to the S1 gradient rather than to a hole. iOS states it
 * as "the conversion can be partial without any control being blank", which
 * is the only defence against an art loader returning nil in silence.
 */
const capArt = (skin: ChassisSkinId | null, kind: FooterCapKind): string | null =>
  skin ? `/art/caps/${skin}-${kind}.png` : null;

/**
 * One moulded cap: the drawn sprite, **or** the glyph it falls back to.
 *
 * `children` is the fallback and it lives inside this component on purpose.
 * The first version kept `failed` local here, returned null on error, and left
 * the sibling glyph gated on `!capArt(...)` at each call site — which is a
 * different condition, and a condition that is never true, because
 * `readTheme().skin` always resolves. So all four glyph branches were dead
 * code, and a cap whose PNG failed to load left a bare coloured circle with
 * no symbol on it: offline before the cache is warm, images disabled, or a
 * skin somebody added without re-running the bake.
 *
 * One component owning both halves is what makes the two conditions
 * impossible to separate again. `onError` swaps to the glyph rather than
 * leaving a broken image, so the failure is genuinely invisible to the player
 * — and still loud to the render gate, which fails on any 4xx.
 */
const CapFace: React.FC<{
  kind: FooterCapKind;
  skin: ChassisSkinId | null;
  children: React.ReactNode;
}> = ({ kind, skin, children }) => {
  const [failed, setFailed] = useState(false);
  const src = capArt(skin, kind);
  useEffect(() => { setFailed(false); }, [src]);
  if (!src || failed) return <>{children}</>;
  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      draggable={false}
      onError={() => setFailed(true)}
      className="absolute inset-[-3px] w-[calc(100%+6px)] h-[calc(100%+6px)] pointer-events-none select-none"
      // Inset by the border width and sized past it: the sprite is a whole
      // moulded cap including its own rim, so it replaces the CSS border
      // rather than sitting inside it. Drawn smooth, not pixelated -- these
      // are a rendered circle downscaled, not pixel art on a grid, which is
      // the same exception iOS carves out with `.interpolation(.high)`.
      style={{ imageRendering: 'auto', objectFit: 'contain' }}
    />
  );
};

const DeviceFooter: React.FC<DeviceFooterProps> = ({
  title,
  footerCenter,
  onBack,
  showBack = false,
  onHome,
  showSystemButtons = true,
  onReassignLamp,
}) => {
  const navigate = useNavigate();
  // The lamps repaint when a pin moves, without a provider threaded through
  // the chassis — the same external store the collection buttons use.
  useSyncExternalStore(subscribeToPins, pinsRevision, pinsRevision);
  // The active shell, for the drawn caps. `useTheme` is the same external
  // store the rest of the chassis reads, so a skin change repaints the band
  // without a reload.
  const theme = useTheme();
  const footerTitle = useMarqueeScript(title);
  const backEnabled = showBack && !!onBack;
  // One size: the marquee never says VINODEX any more (the script replaced
  // the wordmark loop), so the old big-wordmark branch was dead (review I3).
  const footerTitleSize = 'text-[1.55rem] md:text-[1.8rem]';
  const defaultFooterDisplay = (
    <div className="w-full max-w-[16.5rem] min-w-0 rounded-[1.1rem] bg-black px-[0.35rem] py-[0.3rem] border border-white/75 shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_3px_0_rgba(120,120,120,0.95)]">
      <div className="flex items-center min-h-[4.1rem] overflow-hidden bg-black rounded-[0.9rem] px-1 shadow-[inset_0_0_18px_rgba(34,197,94,0.16)]">
        <div className="terminal-marquee whitespace-nowrap flex items-center">
          <span
            className={`inline-block font-retro ${footerTitleSize} italic tracking-[-0.08em] transform -skew-x-12 leading-none text-green-500 pr-6`}
            style={{ textShadow: '1px 1px 0px rgba(8, 32, 16, 0.65)' }}
          >
            {footerTitle}
          </span>
          <span className="pr-6 flex items-center">{marqueeGlyph(title, 22)}</span>
          <span
            aria-hidden="true"
            className={`inline-block font-retro ${footerTitleSize} italic tracking-[-0.08em] transform -skew-x-12 leading-none text-green-500 pr-6`}
            style={{ textShadow: '1px 1px 0px rgba(8, 32, 16, 0.65)' }}
          >
            {footerTitle}
          </span>
          <span aria-hidden="true" className="pr-6 flex items-center">{marqueeGlyph(title, 22)}</span>
        </div>
      </div>
    </div>
  );

  return (
    <footer
      className="absolute inset-x-0 bottom-0 px-2 pt-1 flex items-start justify-between gap-2"
      style={{
        backgroundColor: 'var(--chassis-footer)',
        paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))',
        zoom: 'var(--ui-scale, 1)' as unknown as number,
      }}
    >
      {/* Left well: Back (top) over Saved (bottom). */}
      <div
        className="flex flex-col items-center gap-1.5 rounded-full p-1.5 -translate-y-1 shrink-0"
        style={{ backgroundColor: 'rgba(0,0,0,0.2)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.35), inset 0 -1px 0 rgba(255,255,255,0.14)' }}
      >
        <button
          type="button"
          onClick={backEnabled ? onBack : undefined}
          disabled={!backEnabled}
          aria-label="Back"
          className={`${CAP_CLASS} ${backEnabled ? 'hover:scale-[1.02]' : 'opacity-35 cursor-default'}`}
          style={capStyle('back')}
        >
          {/* The drawn cap, with the coloured circle behind it as its own
              fallback. `currentColor` on the glyph so that fallback is
              legible on the pale skins, where a hardcoded white was not. */}
          <CapFace kind="back" skin={theme.skin}>
            <svg viewBox="0 0 24 24" className="w-8 h-8 pointer-events-none" fill="none" stroke="currentColor" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 5L7 12l8 7" />
            </svg>
          </CapFace>
        </button>
        {showSystemButtons && (
          <button
            type="button"
            onClick={() => navigate('/saved')}
            // **"Collection", by ruling.** iOS calls this control "User"
            // (0.8.5, A1), having renamed it off "Saved entries" for a
            // reason that is true here too: the page behind it holds three
            // shelves and the old label named one of them.
            //
            // The web does not follow iOS's word, because the web does not
            // follow iOS's page title either — COLLECTION rather than
            // SAVED is a long-standing deliberate deviation. A chassis
            // button that announces a name the page it opens does not use
            // is the deviation half-applied; matching the title is what
            // makes it coherent. Recorded as a deviation in IOS-PARITY-v7.
            aria-label="Collection"
            data-coachmark="passportButton"
            className={`${CAP_CLASS} hover:scale-[1.02]`}
            style={capStyle('user')}
          >
            <CapFace kind="user" skin={theme.skin}>
              <CircleUser className="w-7 h-7 pointer-events-none" strokeWidth={2} aria-hidden="true" />
            </CapFace>
          </button>
        )}
      </div>

      {/* Centre: two indicator lamps over the marquee, matched to its width. */}
      <div className="flex-1 min-w-0 flex flex-col items-center gap-1 -translate-y-0.5">
        {/*
          The marquee's two indicator lamps, skin-tinted (S7a).

          They were a hardcoded Tailwind red and a hardcoded #2AB5FF on
          all twenty-two shells. iOS 0.7.1's A7 reversed exactly that
          decision, and its reasoning transfers whole: the original rule
          was "fixed red and blue, because these are the same bulbs as the
          vent lamp and the skin's colours are already spoken for", and
          two things were wrong with it. It was not true of the whole
          device -- HALLOWEEN, VINHO VERDE and CHAMPAGNE repaint the trio,
          the orb, the marquee ground and the letters, and then ran a
          Tailwind red and a Tailwind blue across the middle of all of it.
          And "already spoken for" treats a skin's lamp colours as a
          scarce resource; they are a palette.

          The OUTER two of the trio, not the first two: `statusLights` is
          ordered light-to-deep on most skins, so [0] and [2] are the
          widest pair the shell offers and the two lamps stay
          distinguishable rather than being one colour twice. On
          CHRISTMAS, whose trio is three identical holly berries, they
          come out identical -- which is that skin working, not this rule
          failing.

          **They are the quick pins now (v7#S7b, ruled).** The colour half
          landed in v0.2.0 and the behaviour half was held on one question:
          iOS's press-and-hold is a hidden gesture with no affordance on a
          pointer device. The answer is `contextmenu` — see
          `MarqueeLampButton`, which gets right-click, the Menu key and
          Shift+F10 from one handler and keeps the hold for touch.
        */}
        <div
          className="band-pills w-full max-w-[16.5rem] flex gap-[var(--band-pill-gap)] px-0.5"
          // Decoration on the portal, so nothing to announce there.
          aria-hidden={showSystemButtons ? undefined : true}
        >
          {/* One hint for both lamps. iOS attaches an `accessibilityHint` per
              button; the web equivalent is one visually-hidden sentence that
              both `aria-describedby` at, rather than the same string twice. */}
          {showSystemButtons && (
            <span id="lamp-hint" className="sr-only">
              Right-click, or press and hold, to point this button somewhere else.
            </span>
          )}
          {showSystemButtons ? [0, 1].map(slot => {
            // The OUTER two of the trio, not the first two: `statusLights` is
            // ordered light-to-deep on most skins, so [0] and [2] are the
            // widest pair the shell offers. iOS indexes `lights[0]`/`lights[2]`
            // for the same reason; `n` is the 1-based CSS token name.
            const n = slot === 0 ? 1 : 3;
            return (
              <MarqueeLampButton
                key={slot}
                slot={slot}
                pin={pinAt(slot)}
                fill={`var(--chassis-lamp${n})`}
                rim={`var(--chassis-lamp${n}-edge)`}
                ink={`var(--chassis-lamp${n}-ink)`}
                onActivate={() => navigate(pinRoute(pinAt(slot)))}
                onReassign={() => onReassignLamp?.(slot)}
                hintId="lamp-hint"
              />
            );
          }) : (
            /* **The portal gets the parts and not the controls.**
               `showSystemButtons` is off on every `/website` screen, and it is
               off for exactly this reason: SAVED and SETTINGS are in-app
               controls, and so are these — every pin resolves to `/minigames`
               or `/settings/*`, which are dex routes. Two moulded lamps on a
               company page that jump straight into the encyclopedia would put
               dex navigation AND dex copy (the engraved TOOLS / CUSTOMIZE) on
               a portal screen, which is the one thing the two products must
               not share.

               They are not removed, though. The portal deliberately reuses
               this chassis so the two read as one brand, and a shell that
               grows and loses parts between the two products is that decision
               half-applied. So the portal wears the lamps as what they were
               before v0.2.1: moulded, lit, breathing, unlabelled and
               `aria-hidden` -- a part of the case rather than a button. */
            [1, 3].map(n => (
              <ChassisLamp
                key={n}
                className="flex-1 h-[var(--band-pill)] rounded-full"
                size="var(--band-pill)"
                fill={`var(--chassis-lamp${n})`}
                rim={`var(--chassis-lamp${n}-edge)`}
                bead={false}
                period={5.7}
                glow={1}
              />
            ))
          )}
        </div>
        {footerCenter ? (
          <div className="flex items-center justify-center w-full">{footerCenter}</div>
        ) : (
          defaultFooterDisplay
        )}
      </div>

      {/* Right well: Home (top) over Settings (bottom). */}
      <div
        className="flex flex-col items-center gap-1.5 rounded-full p-1.5 -translate-y-1 shrink-0"
        style={{ backgroundColor: 'rgba(0,0,0,0.2)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.35), inset 0 -1px 0 rgba(255,255,255,0.14)' }}
      >
        {/* No inner lit disc, and no amber (S1). It was the web twin of
            the `ChassisAccent`-lit disc iOS deleted in 0.8.98: a second
            drawing rule for one of four identical controls, and the
            reason three releases of cap fixes each missed this button.
            Home is a cap like its neighbours now, and a livery that wants
            it to look powered says so in the colour. */}
        <button
          type="button"
          onClick={onHome ? () => onHome() : undefined}
          disabled={!onHome}
          aria-label="Home"
          className={`${CAP_CLASS} ${onHome ? 'hover:scale-[1.02]' : 'opacity-35 cursor-default'}`}
          style={capStyle('home')}
        >
          <CapFace kind="home" skin={theme.skin}>
            <Home size={28} className="pointer-events-none" aria-hidden="true" />
          </CapFace>
        </button>
        {showSystemButtons && (
          <button
            type="button"
            onClick={() => navigate('/settings')}
            aria-label="Settings"
            className={`${CAP_CLASS} hover:scale-[1.02]`}
            style={capStyle('settings')}
          >
            <CapFace kind="settings" skin={theme.skin}>
              <Settings
                className="w-[50%] h-[50%] pointer-events-none"
                aria-hidden="true"
                style={{ filter: 'drop-shadow(0 1px 0 rgba(0,0,0,0.5))' }}
              />
            </CapFace>
          </button>
        )}
      </div>
    </footer>
  );
};

export default DeviceFooter;
