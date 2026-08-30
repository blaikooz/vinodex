import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  MAX_REPORTS, describeError, installErrorReporting, report, reportCount, resetReports, routePattern, whereFromStack,
  type ErrorRecord,
} from './errorReport';
import { APP_VERSION } from './appVersion';

/** First-party error reporting (v0.6.33): a closed shape, a small budget. */
beforeEach(resetReports);
afterEach(() => vi.restoreAllMocks());

describe('routePattern', () => {
  it('reduces any path to a pattern from a finite set', () => {
    expect(routePattern('/')).toBe('/');
    expect(routePattern('/contact')).toBe('/contact');
    expect(routePattern('/dex')).toBe('/dex');
    expect(routePattern('/detail/G001')).toBe('/detail/:id');
    expect(routePattern('/list/GRAPES?q=secret%20search')).toBe('/list/:category');
    expect(routePattern('/settings/customize#x')).toBe('/settings/:section');
    expect(routePattern('/project/vinodex')).toBe('/project/:id');
    expect(routePattern('/nonsense/typed/here')).toBe('/nonsense/:x');
  });
});

describe('describeError', () => {
  it('keeps the name and the location, never the message or the path', () => {
    const err = new TypeError('cannot read "what I typed" of undefined');
    err.stack = `TypeError: cannot read\n    at f (https://vinodex.vercel.app/assets/index-BXQawP9v.js:12:345)`;
    const rec = describeError('error', err, '/list/GRAPES?q=what%20I%20typed');
    expect(rec).toEqual<ErrorRecord>({ kind: 'error', name: 'TypeError', where: 'index.js:12:345', route: '/list/:category', version: APP_VERSION });
    expect(JSON.stringify(rec)).not.toContain('typed');
  });

  it('prefers the event location when the browser gives one, and copes with non-errors', () => {
    const rec = describeError('error', 'a string', '/dex', { filename: 'https://x/assets/SettingsPanel-zKyFkoFb.js', lineno: 3, colno: 9 });
    expect(rec.where).toBe('SettingsPanel.js:3:9');
    expect(rec.name).toBe('Thrown');
    expect(describeError('rejection', undefined, '/dex').name).toBe('Error');
    expect(describeError('rejection', { code: 1 }, '/dex').where).toBe('?');
  });

  it('reads a location out of a stack in either browser spelling', () => {
    expect(whereFromStack('TypeError: x\n    at https://h/assets/exam-CzsZoSzF.js:1:2')).toBe('exam.js:1:2');
    expect(whereFromStack('x@https://h/assets/index-abcdef12.js:77:8')).toBe('index.js:77:8');
    expect(whereFromStack(undefined)).toBe('?');
  });
});

describe('report', () => {
  it('sends a new fact once and stops at the budget', () => {
    const send = vi.fn();
    const rec = describeError('error', new Error('x'), '/dex');
    expect(report(rec, send)).toBe(true);
    expect(report(rec, send)).toBe(false);
    expect(send).toHaveBeenCalledTimes(1);
    for (let i = 0; i < MAX_REPORTS + 3; i++) report({ ...rec, where: `f.js:${i}:0` }, send);
    expect(reportCount()).toBe(MAX_REPORTS);
    expect(send).toHaveBeenCalledTimes(MAX_REPORTS);
  });
});

describe('installErrorReporting', () => {
  it('observes window errors and unhandled rejections without swallowing them', () => {
    // The handlers are called directly rather than dispatched: a real
    // ErrorEvent on the jsdom window is an uncaught exception to vitest.
    const handlers: Partial<Record<string, (e: Event) => void>> = {};
    const add = vi.spyOn(window, 'addEventListener').mockImplementation(((type: string, fn: EventListener) => {
      handlers[type] = fn as (e: Event) => void;
    }) as typeof window.addEventListener);
    const remove = vi.spyOn(window, 'removeEventListener').mockImplementation(() => undefined);
    const send = vi.fn();
    const uninstall = installErrorReporting(send);
    expect(Object.keys(handlers).sort()).toEqual(['error', 'unhandledrejection']);

    const ev = new ErrorEvent('error', { error: new RangeError('boom'), filename: 'https://h/assets/index-BXQawP9v.js', lineno: 5, colno: 6, cancelable: true });
    handlers.error!(ev);
    expect(ev.defaultPrevented).toBe(false);
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ kind: 'error', name: 'RangeError', where: 'index.js:5:6' }));

    const rej = new Event('unhandledrejection', { cancelable: true });
    Object.defineProperty(rej, 'reason', { value: new Error('nope') });
    handlers.unhandledrejection!(rej);
    expect(rej.defaultPrevented).toBe(false);
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ kind: 'rejection', name: 'Error' }));

    uninstall();
    expect(remove).toHaveBeenCalledWith('error', handlers.error);
    expect(remove).toHaveBeenCalledWith('unhandledrejection', handlers.unhandledrejection);
    add.mockRestore();
    remove.mockRestore();
  });
});
