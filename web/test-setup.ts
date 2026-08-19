/**
 * The jsdom gaps every component suite hits, stubbed once.
 *
 * jsdom implements the DOM, not the browser around it. Three APIs this app
 * uses on mount have no jsdom implementation at all, and each one throws a
 * `ReferenceError` from a `useEffect` — which surfaces as a failing test that
 * looks nothing like its cause. They were stubbed ad hoc inside individual
 * suites before this file existed; hoisting them is what makes rendering a
 * whole screen a one-line thing to do, which is the precondition for the
 * render pins in W3/W20.
 *
 * Each stub is the **minimum honest shape**, never a lie about behaviour:
 * an `IntersectionObserver` that never reports an intersection is a real browser
 * on a page nothing has scrolled, and that is exactly the initial state a
 * mount test wants. A stub that faked visibility would make
 * `useScreenAnchor`'s tests pass for the wrong reason.
 */

/** `useScreenAnchor` observes section headers to drive the anchor rail. */
if (!('IntersectionObserver' in globalThis)) {
  class StubIntersectionObserver implements IntersectionObserver {
    readonly root: Element | Document | null = null;
    readonly rootMargin: string = '0px';
    readonly thresholds: ReadonlyArray<number> = [0];
    constructor(_cb: IntersectionObserverCallback, _opts?: IntersectionObserverInit) {}
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
    takeRecords(): IntersectionObserverEntry[] { return []; }
  }
  globalThis.IntersectionObserver = StubIntersectionObserver as unknown as typeof IntersectionObserver;
}

/** The globe and the growth wave measure themselves on mount. */
if (!('ResizeObserver' in globalThis)) {
  class StubResizeObserver implements ResizeObserver {
    constructor(_cb: ResizeObserverCallback) {}
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
  globalThis.ResizeObserver = StubResizeObserver as unknown as typeof ResizeObserver;
}

/**
 * `prefers-reduced-motion` is read by four components. jsdom has no
 * `matchMedia`, and the honest default is **no preference** — the motion path
 * is the one most users get and the one most likely to hide a bug. A suite
 * that wants the reduced path overrides this per test.
 */
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}
