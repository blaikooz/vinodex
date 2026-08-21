import React, { useEffect, useRef, useState } from 'react';
import {
  ScreensaverStart,
  bouncePosition,
  randomStart,
} from '../src/services/screensaver';
import { DEVICE_FRAME_BOX, DEVICE_FRAME_OVERLAY_STYLE, DEVICE_FRAME_STAGE } from '../src/services/deviceFrame';

interface ScreensaverOverlayProps {
  onDismiss: () => void;
}

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
const ScreensaverOverlay: React.FC<ScreensaverOverlayProps> = ({ onDismiss }) => {
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
      // `device-stage`, like the chassis and the boot: a device going to
      // sleep on the stage should not also switch the room's lights off.
      className={`fixed inset-0 z-[90] ${DEVICE_FRAME_STAGE} device-stage cursor-pointer overflow-hidden`}
      style={DEVICE_FRAME_OVERLAY_STYLE}
    >
      {/*
        `boxRef` is the *device* box, not the viewport (v7#D3).
        The bounce is a closed form over the box it is given, so a layer fixed
        to a 1280x800 window sent the mark on a lap of the desktop at 28% of
        1280px — a screen blanker blanking the browser instead of the screen.
        Clamped to `DEVICE_FRAME_BOX`, the same one `DeviceLayout` centres, the
        mark bounces inside the machine it belongs to and `MARK_FRACTION` means
        what it says again.
      */}
      <div
        ref={boxRef}
        className={`relative ${DEVICE_FRAME_BOX} bg-black overflow-hidden md:rounded-[2.5rem]`}
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
    </div>
  );
};

export default ScreensaverOverlay;
