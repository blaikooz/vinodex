import React from 'react';
import { X, Apple } from 'lucide-react';
import { APP_STORE_URL, isStandalone } from '../src/services/shareLink';

const DISMISS_KEY = 'installNudgeDismissed';

/**
 * The "get the iOS app" nudge — the bottom half of the funnel. The web PWA is
 * the surface people arrive on from a shared link; once they've played in the
 * browser, this slim bar points them at the native install. It never shows for
 * someone already running the installed PWA, and it stays dismissed once closed.
 */
const InstallBanner: React.FC = () => {
  const [hidden, setHidden] = React.useState(true);

  React.useEffect(() => {
    if (isStandalone()) return;
    try {
      if (window.localStorage.getItem(DISMISS_KEY) === '1') return;
    } catch {
      /* ignore */
    }
    setHidden(false);
  }, []);

  if (hidden) return null;

  const dismiss = () => {
    setHidden(true);
    try {
      window.localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      className="fixed inset-x-0 top-0 z-[60] flex items-center gap-2 px-3 py-1.5 bg-black/85 backdrop-blur-sm border-b border-white/15"
      style={{ paddingTop: 'max(0.375rem, env(safe-area-inset-top))' }}
      role="region"
      aria-label="Get the Vinodex iOS app"
    >
      <Apple size={16} className="text-white shrink-0" />
      <span className="flex-1 min-w-0 font-retro text-[0.55rem] tracking-widest text-green-300 leading-tight">
        PLAYING IN THE BROWSER?{' '}
        <span className="text-stone-300">GET VINODEX FOR iOS.</span>
      </span>
      <a
        href={APP_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 rounded-full px-3 py-1 bg-green-500 hover:bg-green-400 border border-green-700 font-retro text-[0.55rem] tracking-widest text-white transition-colors"
      >
        GET APP
      </a>
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="shrink-0 p-1 text-stone-400 hover:text-white transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default InstallBanner;
