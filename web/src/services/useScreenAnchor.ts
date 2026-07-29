import { RefObject, useLayoutEffect, useRef } from 'react';
import { anchor, setAnchor } from './screenState';

/**
 * Restores a scroll container to the section it was left at, and records the
 * section at the top of the viewport as the user scrolls.
 *
 * Mark the elements that can be restored to with `data-screen-anchor="<id>"`.
 * Anything without the attribute is invisible to this hook, so a screen opts in
 * by tagging its sections or its rows.
 *
 * Two rules this exists to satisfy, both from the port spec:
 *
 * - **Scroll must not re-render.** Recorded positions go straight into the
 *   module-level store, never into React state. A `useState` here would
 *   re-render the whole list on every scroll frame.
 * - **Restore is tolerant.** An anchor whose element no longer exists — a
 *   bookmark removed, a filter narrowed — leaves the screen at the top rather
 *   than throwing.
 */
export interface ScreenAnchorOptions {
  /**
   * Stamp each direct child of the container with a positional
   * `data-screen-anchor` instead of requiring the markup to carry its own.
   *
   * For the detail readout, whose two dozen sections are inline conditionals in
   * one long component, hand-tagging every branch would be a large diff with a
   * real chance of duplicate ids. Positional ids are safe *here* specifically
   * because the key is per entry id: the same entry always renders the same
   * sections in the same order, so `sec-4` means the same thing on every visit
   * to that entry. Do not use this where the children vary independently of the
   * key — a filtered list, say, where `sec-4` is a different row after a search.
   */
  autoAnchorChildren?: boolean;
}

export function useScreenAnchor(
  key: string,
  containerRef: RefObject<HTMLElement | null>,
  options: ScreenAnchorOptions = {},
): void {
  const { autoAnchorChildren = false } = options;
  // Guards the recorder against the restore scroll itself: assigning scrollTop
  // fires intersection callbacks, and acting on those would overwrite the very
  // anchor being restored with whatever briefly passed under the top band.
  const recordingRef = useRef(false);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    recordingRef.current = false;
    let restored = false;

    const stampChildren = () => {
      if (!autoAnchorChildren) return;
      Array.from(container.children).forEach((child, index) => {
        const el = child as HTMLElement;
        if (!el.dataset.screenAnchor) el.dataset.screenAnchor = `sec-${index}`;
      });
    };
    stampChildren();

    const findAnchorEl = (id: string): HTMLElement | null => {
      // `CSS.escape` because entry ids flow through here and are not guaranteed
      // to be bare identifiers.
      const escaped = typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(id) : id;
      return container.querySelector<HTMLElement>(`[data-screen-anchor="${escaped}"]`);
    };

    /** @returns true once there is nothing left to wait for. */
    const restore = (): boolean => {
      if (restored) return true;
      const stored = anchor(key);
      // No stored anchor is the common case for a screen opened for the first
      // time — and it is also what makes a cross-link to a new entry open at
      // the top for free, since the key is per entry id.
      if (stored === null) {
        restored = true;
        return true;
      }
      const el = findAnchorEl(stored);
      if (!el) return false;
      container.scrollTop = el.offsetTop - container.offsetTop;
      restored = true;
      return true;
    };

    restore();

    // The anchor may not be in the DOM on the first pass — lazily rendered
    // sections, images that change layout. Wait for it to arrive rather than
    // guessing with a timeout.
    const mutations = new MutationObserver(() => {
      stampChildren();
      if (restore()) mutations.disconnect();
      observeAnchors();
    });
    mutations.observe(container, { childList: true, subtree: true });

    // Only the top band of the viewport counts, so "the anchor" is the section
    // heading the user is actually reading past, not whatever is on screen.
    const visible = new Set<HTMLElement>();

    const intersections = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          const el = entry.target as HTMLElement;
          if (entry.isIntersecting) visible.add(el);
          else visible.delete(el);
        }

        if (!recordingRef.current) return;

        // Scrolled back to the very top: store nothing, so returning to this
        // screen opens at the top rather than nudging to the first section.
        if (container.scrollTop <= 0) {
          setAnchor(key, null);
          return;
        }

        let topmost: HTMLElement | null = null;
        for (const el of visible) {
          if (!topmost || el.offsetTop < topmost.offsetTop) topmost = el;
        }
        const id = topmost?.dataset.screenAnchor;
        if (id) setAnchor(key, id);
      },
      { root: container, rootMargin: '0px 0px -80% 0px', threshold: 0 },
    );

    const observed = new WeakSet<Element>();
    const observeAnchors = () => {
      container.querySelectorAll<HTMLElement>('[data-screen-anchor]').forEach(el => {
        if (observed.has(el)) return;
        observed.add(el);
        intersections.observe(el);
      });
    };
    observeAnchors();

    // One frame's grace before recording, so the restore scroll and its
    // callbacks are complete first.
    const frame = requestAnimationFrame(() => {
      recordingRef.current = true;
    });

    return () => {
      cancelAnimationFrame(frame);
      mutations.disconnect();
      intersections.disconnect();
    };
  }, [key, containerRef, autoAnchorChildren]);
}
