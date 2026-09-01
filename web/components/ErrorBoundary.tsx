import React from 'react';
import { reportError } from '../src/services/errorReport';

interface State {
  broken: boolean;
}

/**
 * The root boundary (v0.6.33): a render that throws used to leave a white
 * page with nothing on it. Now it leaves the device's own screen saying so,
 * with the two ways out, and the fact is reported once through
 * `errorReport.ts` -- kind `render`, no message.
 *
 * Deliberately not `DeviceLayout`: the chassis is the thing that may have
 * thrown. Plain markup on the LCD tokens, which `applyTheme` has already put
 * on `:root` before the first render, so even this screen wears the chosen
 * screen mode.
 */
export default class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { broken: false };

  static getDerivedStateFromError(): State {
    return { broken: true };
  }

  componentDidCatch(error: unknown): void {
    reportError('render', error);
  }

  render(): React.ReactNode {
    if (!this.state.broken) return this.props.children;
    return (
      <main
        role="alert"
        data-error-screen
        className="min-h-dvh flex items-center justify-center p-6"
        style={{ backgroundColor: 'var(--lcd-page)', color: 'var(--lcd-body-text)' }}
      >
        <div className="max-w-sm w-full flex flex-col gap-4 rounded-card border p-5" style={{ borderColor: 'var(--surface-line-strong)', backgroundColor: 'var(--surface-raised)' }}>
          <h1 className="font-retro text-title tracking-widest" style={{ color: 'var(--lcd-accent)' }}>SOMETHING BROKE</h1>
          <p className="text-body normal-case" style={{ color: 'var(--lcd-subtext)' }}>
            The device hit an error it could not recover from. Nothing of yours is lost -- your shelves, ratings and settings
            live in this browser, not on the screen that failed.
          </p>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              className="dex-pressable rounded-control px-4 py-3 font-retro tracking-widest"
              style={{ backgroundColor: 'var(--lcd-accent)', color: 'var(--lcd-on-accent)' }}
              onClick={() => window.location.assign('/dex')}
            >
              RESTART VINODEX
            </button>
            <button
              type="button"
              className="dex-pressable rounded-control px-4 py-3 font-retro tracking-widest border"
              style={{ borderColor: 'var(--surface-line-strong)', color: 'var(--lcd-body-text)' }}
              onClick={() => window.location.assign('/')}
            >
              BACK TO THE SITE
            </button>
          </div>
        </div>
      </main>
    );
  }
}
