import { APP_VERSION } from './appVersion';
import { SITE_EXACT } from './appRoutes';
import { trackError } from './analytics';

/**
 * First-party error reporting (v0.6.33, Phase 6).
 *
 * **What is sent, and what is not.** The ruling (2026-08-30) is first-party
 * only, aggregate, cookieless -- the PRIVACY + TERMS page's "no third-party
 * requests of its own" stays true as written, so there is no Sentry and no
 * error SDK. A report travels the same cookieless channel as the visit
 * counts, and it is a closed shape: the error's *name*, the script location
 * it came from (`chunk.js:line:col`, hash stripped), the *route pattern* it
 * happened on, the app version and which of the three seams caught it.
 * **Never the message and never the URL**: a message can quote whatever was
 * being typed and a URL can carry a search, and nothing user-authored leaves
 * the device. Name + location + version pins a bug down; the message would
 * only tell us what the visitor wrote.
 *
 * **How much.** At most `MAX_REPORTS` per page load, one per distinct
 * name-and-location -- a render loop that throws sixty times a second is one
 * fact, not sixty beacons.
 *
 * The three seams: `window` `error` (a thrown exception nothing caught),
 * `unhandledrejection` (a promise nobody awaited), and the root
 * `ErrorBoundary`'s `componentDidCatch` (a render that threw).
 */

export type ErrorKind = 'error' | 'rejection' | 'render';

export interface ErrorRecord {
  kind: ErrorKind;
  /** The `Error.name` (`TypeError`), or `Error` when there is none. */
  name: string;
  /** `file.js:line:col` with the content hash removed; `?` when unknown. */
  where: string;
  /** The route *pattern*, never the path: `/detail/:id`, `/dex`, `/`. */
  route: string;
  version: string;
}

export const MAX_REPORTS = 5;

/** The parameter each prefixed dex route takes, so the pattern reads as one. */
const PARAM: Record<string, string> = {
  '/detail': ':id',
  '/list': ':category',
  '/lineage': ':id',
  '/settings': ':section',
  '/project': ':id',
};

/**
 * A path reduced to its route pattern. Site pages are themselves; anything
 * else is its first segment plus a named parameter if it had a second one.
 * The result is drawn from a finite set whatever the input was.
 */
export const routePattern = (path: string): string => {
  const clean = path.split('?')[0]?.split('#')[0] ?? '/';
  if (SITE_EXACT.includes(clean)) return clean;
  const segments = clean.split('/').filter(Boolean);
  const head = segments[0];
  if (!head) return '/';
  const root = `/${head}`;
  if (segments.length === 1) return root;
  return `${root}/${PARAM[root] ?? ':x'}`;
};

/** `https://host/assets/index-BXQawP9v.js` -> `index.js`. */
const scriptName = (url: string): string => {
  const base = url.split('?')[0]?.split('/').pop() ?? '';
  return base.replace(/-[A-Za-z0-9_-]{6,}\.js$/, '.js');
};

/** The first `file:line:col` a stack names, hash stripped; `?` if none. */
export const whereFromStack = (stack: string | undefined): string => {
  if (!stack) return '?';
  const m = stack.match(/(?:https?:\/\/[^\s)]+?|[^\s(]+?)(\/[^\s/):]+\.[cm]?js)[^\s)]*?:(\d+):(\d+)/);
  if (!m) return '?';
  return `${scriptName(m[1] ?? '')}:${m[2]}:${m[3]}`;
};

/** The record for a thrown value, whatever it was. */
export const describeError = (
  kind: ErrorKind,
  thrown: unknown,
  path: string,
  at?: { filename?: string; lineno?: number; colno?: number },
): ErrorRecord => {
  const err = thrown instanceof Error ? thrown : undefined;
  const where = at?.filename
    ? `${scriptName(at.filename)}:${at.lineno ?? 0}:${at.colno ?? 0}`
    : whereFromStack(err?.stack);
  return {
    kind,
    name: err?.name || (thrown === undefined || thrown === null ? 'Error' : typeof thrown === 'object' ? 'Error' : 'Thrown'),
    where,
    route: routePattern(path),
    version: APP_VERSION,
  };
};

const seen = new Set<string>();
let sent = 0;

/** The reports this page load has sent, for tests and for the boundary. */
export const reportCount = (): number => sent;
export const resetReports = (): void => {
  seen.clear();
  sent = 0;
};

export type Sender = (record: ErrorRecord) => void;

/** Send one record if it is new to this page load and the budget allows. */
export const report = (record: ErrorRecord, send: Sender = trackError): boolean => {
  const key = `${record.kind}|${record.name}|${record.where}`;
  if (sent >= MAX_REPORTS || seen.has(key)) return false;
  seen.add(key);
  sent += 1;
  send(record);
  return true;
};

/** Report a caught error from any seam; the boundary and the listeners use it. */
export const reportError = (kind: ErrorKind, thrown: unknown, send?: Sender): boolean =>
  report(describeError(kind, thrown, typeof window === 'undefined' ? '/' : window.location.pathname), send);

/**
 * Listen on the window for what nothing else caught. Returns the uninstall.
 * Errors still reach the console exactly as before: the listeners observe,
 * they do not `preventDefault`.
 */
export const installErrorReporting = (send?: Sender): (() => void) => {
  if (typeof window === 'undefined') return () => undefined;
  const onError = (e: ErrorEvent) => {
    report(
      describeError('error', e.error, window.location.pathname, { filename: e.filename, lineno: e.lineno, colno: e.colno }),
      send,
    );
  };
  const onRejection = (e: PromiseRejectionEvent) => {
    report(describeError('rejection', e.reason, window.location.pathname), send);
  };
  window.addEventListener('error', onError);
  window.addEventListener('unhandledrejection', onRejection);
  return () => {
    window.removeEventListener('error', onError);
    window.removeEventListener('unhandledrejection', onRejection);
  };
};
