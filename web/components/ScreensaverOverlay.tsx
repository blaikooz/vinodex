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
 * The mark's two layers — `ScreensaverMarkArt`, the same two masks iOS
 * bounces (v0.6.19, replacing v0.6.14's vector guess).
 *
 * v0.6.14 inlined the two paths of `web/public/vinodex-logo.svg`, on the
 * strength of a comment saying they were the wordmark. They are not: that
 * SVG is the site's *H* mark, and the saver bounced the wrong logo for one
 * release. The right art was already here — `sync-shared.ps1`'s art leg
 * mirrors iOS's `Logo/` into `/art/logo/`, and the BIOS has drawn
 * `vinodex-mark-face.png` / `vinodex-mark-shade.png` since v0.6.9. They are
 * white-on-alpha masks, 320x262, and are used exactly as the BIOS uses them
 * and exactly as iOS does: each layer is a box filled with the tint and
 * clipped by the mask, so every colour the mark wears comes from the call
 * site. The face is the bounce colour; the shade the same ink at 0.45 —
 * "not a second colour: the same ink, dimmed", the one depth cue that
 * survives the monochrome modes' grayscale pass. The shade PNG carries its
 * own offset, so both layers share one box.
 *
 * No background: the mark is the V alone, never the red tile.
 */
const MARK_ART = {
  face: '/art/logo/vinodex-mark-face.png',
  shade: '/art/logo/vinodex-mark-shade.png',
} as const;
const MARK_ASPECT = 320 / 262;

const layerStyle = (mask: string, tint: string): React.CSSProperties => ({
  backgroundColor: tint,
  WebkitMaskImage: `url(${mask})`,
  maskImage: `url(${mask})`,
  WebkitMaskSize: '100% 100%',
  maskSize: '100% 100%',
  WebkitMaskRepeat: 'no-repeat',
  maskRepeat: 'no-repeat',
});

const Mark = React.forwardRef<HTMLDivElement, { tint: string; className?: string; style?: React.CSSProperties }>(
  ({ tint, className, style }, ref) => (
    <div
      ref={ref}
      aria-hidden="true"
      className={className}
      style={{ aspectRatio: `${MARK_ASPECT}`, ...style }}
      data-screensaver-mark
      data-tint={tint}
    >
      <span className="absolute inset-0 block" style={{ ...layerStyle(MARK_ART.shade, tint), opacity: 0.45 }} data-mark-shade />
      <span className="absolute inset-0 block" style={layerStyle(MARK_ART.face, tint)} data-mark-face />
    </div>
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
  const markRef = useRef<HTMLDivElement>(null);
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
          for (const layer of mark.querySelectorAll<HTMLElement>('[data-mark-face], [data-mark-shade]')) {
            layer.style.backgroundColor = tint;
          }
          mark.dataset.tint = tint;
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
          <Mark tint={tintForBounce(0)} className="relative w-[36%]" />
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
