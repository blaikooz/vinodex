import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import { applyTheme } from './src/services/theme';
import { initAnalytics } from './src/services/analytics';
import { bindInstallPrompt } from './src/services/installPrompt';

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

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
