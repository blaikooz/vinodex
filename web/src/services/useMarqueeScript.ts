import { useEffect, useState, useSyncExternalStore } from 'react';
import {
  applyActivity,
  applyTimedOut,
  currentScript,
  scriptTextAfter,
  stageTimeout,
  subscribeToMarquee,
} from './marqueeScript';
import { IDLE_ACTIVITY_EVENTS } from './screensaver';

/**
 * What the marquee panel currently reads, for a screen with this `title`.
 *
 * **Extracted from `DeviceLayout.tsx` (v7#W7).** It was 50 lines of timers,
 * a capture-phase listener on six window events and two pieces of state,
 * sitting in the middle of a component whose other job is drawing a device.
 * All of it is one question -- what word is on the panel right now -- and
 * none of it touches the chassis, so it is a hook rather than chrome.
 *
 * The two rulings inside it are the reason it is moved whole rather than
 * rewritten: the shared idle event list (review L4, so the screensaver and
 * the marquee count the same silence), and the deliberate absence of
 * `applyLeftMainScreen()` in teardown (review L3, so StrictMode's dev
 * double-invoke cannot eat the once-per-launch WELCOME!).
 */
export function useMarqueeScript(title: string): string {
  // The wordmark is gone from the island (a cog took its place), so the only
  // place the app still names itself is the footer marquee.
  const isMainScreen = title === 'VINODEX';

  // The marquee script (v6#20): the forever-loop of toasts this panel used to
  // carry is exactly what iOS 0.7.1 retired — the device greets once, settles
  // into naming the screen, and only toasts when ignored. The script runs on
  // the main screen only; every other screen's panel is its own title.
  const script = useSyncExternalStore(subscribeToMarquee, currentScript, currentScript);
  const [cheersElapsed, setCheersElapsed] = useState(0);
  useEffect(() => {
    if (!isMainScreen) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let rotate: ReturnType<typeof setInterval> | null = null;

    const arm = () => {
      if (timer) clearTimeout(timer);
      if (rotate) {
        clearInterval(rotate);
        rotate = null;
      }
      setCheersElapsed(0);
      const pending = stageTimeout(currentScript().stage);
      if (pending) {
        timer = setTimeout(() => {
          applyTimedOut();
          arm();
        }, pending.after * 1000);
      } else {
        // CHEERS!: the word is a pure function of how long this idle period
        // has run — nothing accumulates, so a dropped frame cannot strand it.
        const periodStart = Date.now();
        rotate = setInterval(() => setCheersElapsed((Date.now() - periodStart) / 1000), 1000);
      }
    };

    // Activity restarts whichever dwell the resting stage is waiting out,
    // even when the stage itself does not move. The event list is the one
    // shared idle reckoning (review L4) — the screensaver reads the same
    // list, because two clocks counting the same silence differently is what
    // the A4 fold retired.
    const activity = () => {
      applyActivity();
      arm();
    };
    IDLE_ACTIVITY_EVENTS.forEach(e => window.addEventListener(e, activity, { capture: true, passive: true }));
    arm();
    return () => {
      if (timer) clearTimeout(timer);
      if (rotate) clearInterval(rotate);
      IDLE_ACTIVITY_EVENTS.forEach(e => window.removeEventListener(e, activity, { capture: true }));
      // Deliberately no `applyLeftMainScreen()` here (review L3): teardown is
      // not navigation — StrictMode's dev double-invoke and any same-route
      // remount would consume the once-per-launch WELCOME! before it ever
      // painted. The App's route watcher applies the transition when the
      // path actually leaves the main screen.
    };
  }, [isMainScreen]);


  return isMainScreen ? scriptTextAfter(script, cheersElapsed) : title;
}
