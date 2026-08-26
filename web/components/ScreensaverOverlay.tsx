import React, { useEffect, useRef, useState } from 'react';
import {
  ScreensaverStart,
  bouncePosition,
  randomStart,
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

const MARK_FRACTION = 0.28;

/**
 * The bouncing mark, ported from
 * `vinodex-ios/Sources/VinodexUI/Screensaver.swift` (0.7.3, A5) — v6#33.
 *
 * The position is the closed form in `screensaver.ts` — the frame loop only
 * asks "where at `t`", so it cannot drift. The start is a random phase per
 * raise (0.7.6, A2). Under `prefers-reduced-motion` the mark sits centred and
 * still: a screensaver's job is to mark idleness, and a static mark does that
 * without the motion.
 *
 * The mark is `/vinodex-logo.png` — the iOS drawn `ScreensaverMarkArt` is part
 * of the art-transport ruling (v6#2); the PNG is the web's existing mark and
 * stands in without a new asset. (It was described here as "the splash's
 * wordmark"; the splash is gone with the fork, and the PNG is not — it is also
 * the favicon, the PWA icon and the OG image.)
 */
const ScreensaverContents: React.FC<{ onDismiss: () => void }> = ({ onDismiss }) => {
  const boxRef = useRef<HTMLDivElement>(null);
  const markRef = useRef<HTMLImageElement>(null);
  const startRef = useRef<ScreensaverStart>(randomStart());
  const [reduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    if (reduced) return;
    const t0 = performance.now();
    let raf = 0;
    const frame = (now: number) => {
      const box = boxRef.current;
      const mark = markRef.current;
      if (box && mark && mark.offsetWidth > 0) {
        const p = bouncePosition(
          (now - t0) / 1000,
          { width: box.clientWidth, height: box.clientHeight },
          { width: mark.offsetWidth, height: mark.offsetHeight },
          startRef.current,
        );
        mark.style.transform = `translate(${p.x}px, ${p.y}px)`;
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
          <img src="/vinodex-logo.png" alt="" className="w-[28%] rounded-[18%] opacity-80" />
        </div>
      ) : (
        <img
          ref={markRef}
          src="/vinodex-logo.png"
          alt=""
          className="absolute top-0 left-0 rounded-[18%] opacity-80 will-change-transform"
          style={{ width: `${MARK_FRACTION * 100}%` }}
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
