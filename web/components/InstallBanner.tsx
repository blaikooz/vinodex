import React from 'react';
import { X, Apple } from 'lucide-react';
import { APP_STORE_LISTING_IS_LIVE, APP_STORE_URL, isStandalone } from '../src/services/shareLink';
import { trackEvent } from '../src/services/analytics';

const DISMISS_KEY = 'installNudgeDismissed';

/**
 * The "get the iOS app" nudge — the bottom half of the funnel. The web PWA is
 * the surface people arrive on from a shared link; once they've played in the
 * browser, this slim bar points them at the native install. It never shows for
 * someone already running the installed PWA, and it stays dismissed once closed.
 *
 * It also stays away entirely while the App Store id is still the placeholder.
 * A prominent GET APP button pointing at a dead listing spends the single
 * nudge a visitor gets, and buys nothing back; the bar returns by itself the
 * moment a real id lands in `shareLink.ts`.
 */
const InstallBanner: React.FC = () => {
  const [hidden, setHidden] = React.useState(true);

  React.useEffect(() => {
    if (!APP_STORE_LISTING_IS_LIVE) return;
    if (isStandalone()) return;
    try {
      if (window.localStorage.getItem(DISMISS_KEY) === '1') return;
    } catch {
      /* ignore */
    }
    setHidden(false);
  }, []);

  // The bar is fixed and would otherwise sit on top of the chassis — it was
  // clipping the status orb in every screenshot the gate produced. Publishing
  // its height lets the app shell pad itself down by exactly the bar, and go
  // back to zero the moment it is dismissed.
  React.useEffect(() => {
    const root = document.documentElement;
    if (hidden) root.style.removeProperty('--install-banner-h');
    else root.style.setProperty('--install-banner-h', '2.25rem');
    return () => {
      root.style.removeProperty('--install-banner-h');
    };
  }, [hidden]);

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
      <span className="flex-1 min-w-0 text-micro tracking-widest text-green-300 leading-tight">
        PLAYING IN THE BROWSER?{' '}
        <span className="text-stone-300">GET VINODEX FOR iOS.</span>
      </span>
      <a
        href={APP_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        // The dormant store stage (v0.6.1; the funnel's live bottom is the
        // Substack card since v0.6.16). Pressing this bar IS following the
        // store link, so it records one `store-tap` with this surface as its
        // source; it can only fire once the listing is real.
        onClick={() => trackEvent('store-tap', { source: 'install-banner' })}
        className="shrink-0 rounded-full px-3 py-1 bg-green-500 hover:bg-green-400 border border-green-700 text-micro tracking-widest text-white transition-colors"
      >
        GET APP
      </a>
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        // 44px target (a11y, Phase 3) inside a 36px bar: reach, not size.
        className="shrink-0 -my-2 inline-flex min-h-11 min-w-11 items-center justify-center text-stone-400 hover:text-white transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default InstallBanner;
