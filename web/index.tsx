import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import { applyTheme } from './src/services/theme';
import { initAnalytics } from './src/services/analytics';
import { bindInstallPrompt } from './src/services/installPrompt';
import { installErrorReporting } from './src/services/errorReport';
import { installScreenWake } from './src/services/screenWake';
import ErrorBoundary from './components/ErrorBoundary';

// Before the first render, so the chassis paints in the stored colourway rather
// than flashing the default red and correcting itself a frame later.
applyTheme();

// Cookieless visit counting, on real deployments only — a no-op in dev, test,
// preview and e2e by construction. See `analytics.ts` for the gate.
initAnalytics();

// Before the first render, because Chromium fires `beforeinstallprompt` as
// soon as the manifest and worker pass its checks -- earlier than any
// component could subscribe. See `installPrompt.ts`.
bindInstallPrompt();

// What nothing else catches -- a thrown exception, an unawaited rejection --
// is reported first-party as a name and a location, never a message. See
// `errorReport.ts` for the shape and the ruling behind it (v0.6.33).
installErrorReporting();

// KEEP AWAKE, if the stored setting asks -- see screenWake.ts (v0.6.45).
installScreenWake();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
