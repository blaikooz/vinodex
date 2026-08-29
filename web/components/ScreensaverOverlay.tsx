import React, { useEffect, useRef, useState } from 'react';
import {
  ScreensaverStart,
  bounceCount,
  bouncePosition,
  randomStart,
  tintForBounce,
} from '../src/services/screensaver';

interface ScreensaverContextValue {
  active: boolean;
  onDismiss: () => void;
}

const ScreensaverContext = React.createContext<ScreensaverContextValue | null>(null);

/** Keeps idle state beside the routes while DeviceLayout paints it in the LCD. */
export const ScreensaverProvider: React.FC<ScreensaverContextValue & { children: React.ReactNode }> = ({
  active,
  onDismiss,
  children,
}) => {
  const value = React.useMemo(() => ({ active, onDismiss }), [active, onDismiss]);
  return <ScreensaverContext.Provider value={value}>{children}</ScreensaverContext.Provider>;
};

/**
 * The mark's height as a fraction of the LCD's shorter edge — iOS
 * `Screensaver.markFraction` (0.32 since 0.8.1, I1). Note what moves with it:
 * a bigger mark has less room to travel, hits the walls sooner, and so cycles
 * the palette more often — a consequence, not a separate decision.
 */
const MARK_FRACTION = 0.32;

/**
 * The wordmark's two layers, as paths — `ScreensaverMarkArt` (v0.6.14).
 *
 * iOS bounces the wordmark as two tinted masks: the lit face and its extruded
 * shade, split from the master at import time, so that every colour the mark
 * wears comes from the call site and the LCD's phosphor. The web's mark was a
 * `<img src="/vinodex-logo.png">` — a solid red tile with the V baked in —
 * which is why it could not change colour at all (the v6#2 art-transport
 * ruling kept the iOS PNGs on the phone). The site's own `vinodex-logo.svg`
 * carries exactly the same two shapes as vector paths, so they are inlined
 * here and tinted by `fill`: the face in the bounce colour, the shade the same
 * ink at 0.45 — "not a second colour: the same ink, dimmed", which is the only
 * depth cue that survives the monochrome modes' grayscale pass.
 *
 * The viewBox is cropped to the mark rather than the tile, so the bounce box
 * is the V's own rectangle and its aspect (378:312) comes from the art. Both
 * paths are `crispEdges`: this is pixel art with hard corners, and the SVG
 * equivalent of iOS's `.interpolation(.none)` is to refuse anti-aliasing.
 */
const MARK_VIEWBOX = '64 92 378 312';
const MARK_ASPECT = 378 / 312;
const MARK_SHADE = 'M176 118h95l-34 86h40l26-66h96L294 394h-70l24-61h-44l-24 61H94l38-96h-34l78-180z';
const MARK_FACE = 'M156 102h95l-34 86h40l26-66h96L274 378h-70l24-61h-44l-24 61H74l38-96H78l78-180z';

const Mark = React.forwardRef<SVGSVGElement, { tint: string; className?: string; style?: React.CSSProperties }>(
  ({ tint, className, style }, ref) => (
    <svg
      ref={ref}
      viewBox={MARK_VIEWBOX}
      aria-hidden="true"
      className={className}
      style={style}
      data-screensaver-mark
    >
      <path d={MARK_SHADE} fill={tint} fillOpacity={0.45} shapeRendering="crispEdges" data-mark-shade />
      <path d={MARK_FACE} fill={tint} shapeRendering="crispEdges" data-mark-face />
    </svg>
  ),
);
Mark.displayName = 'ScreensaverMark';

/**
 * The bouncing mark, ported from
 * `vinodex-ios/Sources/VinodexUI/Screensaver.swift` (0.7.3, A5) — v6#33, and
 * its colour half in v0.6.14.
 *
 * The position is the closed form in `screensaver.ts` — the frame loop only
 * asks "where at `t`", so it cannot drift. **So is the colour**: the mark
 * takes a new hue from the palette on every wall, and the wall count is read
 * off the same distance the position is, so the two cannot disagree about
 * when a bounce happened. The start is a random phase per raise (0.7.6, A2),
 * and the walls that phase has notionally already passed are subtracted, so
 * every run opens on the LCD's own accent.
 *
 * Under `prefers-reduced-motion` the mark sits centred and still, in the
 * accent: a screensaver's job is to mark idleness, and a static mark does
 * that without the motion.
 */
const ScreensaverContents: React.FC<{ onDismiss: () => void }> = ({ onDismiss }) => {
  const boxRef = useRef<HTMLDivElement>(null);
  const markRef = useRef<SVGSVGElement>(null);
  const startRef = useRef<ScreensaverStart>(randomStart());
  const [reduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    if (reduced) return;
    const t0 = performance.now();
    let raf = 0;
    let lastBounce = -1;
    const frame = (now: number) => {
      const box = boxRef.current;
      const mark = markRef.current;
      if (box && mark) {
        const bounds = { width: box.clientWidth, height: box.clientHeight };
        // Sized from the LCD each frame (the site chassis reshapes with the
        // viewport), as a height and the art's own aspect — iOS's `side`.
        const side = Math.min(bounds.width, bounds.height) * MARK_FRACTION;
        const size = { width: side * MARK_ASPECT, height: side };
        mark.style.width = `${size.width}px`;
        mark.style.height = `${size.height}px`;
        const t = (now - t0) / 1000;
        const p = bouncePosition(t, bounds, size, startRef.current);
        mark.style.transform = `translate(${p.x}px, ${p.y}px)`;
        const bounces = bounceCount(t, bounds, size, startRef.current);
        if (bounces !== lastBounce) {
          lastBounce = bounces;
          const tint = tintForBounce(bounces);
          for (const path of mark.querySelectorAll('path')) path.setAttribute('fill', tint);
          mark.dataset.bounces = String(bounces);
        }
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  return (
    // The dismiss listeners live on the App's idle tracker — any activity
    // wakes the device — but the overlay itself is also directly tappable so
    // assistive tech has an obvious way out.
    <div
      role="button"
      aria-label="Screensaver — touch to wake"
      tabIndex={0}
      onClick={onDismiss}
      onKeyDown={onDismiss}
      className="absolute inset-0 z-[40] cursor-pointer overflow-hidden bg-black"
      ref={boxRef}
    >
      {reduced ? (
        <div className="w-full h-full flex items-center justify-center">
          <Mark tint={tintForBounce(0)} className="w-[36%]" style={{ aspectRatio: `${MARK_ASPECT}` }} />
        </div>
      ) : (
        <Mark
          ref={markRef}
          tint={tintForBounce(0)}
          className="absolute top-0 left-0 will-change-transform"
        />
      )}
    </div>
  );
};

/** DeviceLayout's slot for the saver; its absolute box is the LCD itself. */
export const ScreensaverOverlay: React.FC = () => {
  const saver = React.useContext(ScreensaverContext);
  if (!saver?.active) return null;
  return <ScreensaverContents onDismiss={saver.onDismiss} />;
};

export default ScreensaverOverlay;
