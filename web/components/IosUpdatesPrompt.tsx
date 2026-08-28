import React from 'react';
import { ArrowUpRight, BellRing } from 'lucide-react';
import {
  hasSeenIosUpdatesPrompt,
  IOS_UPDATES_PROMPT_DELAY_MS,
  markIosUpdatesPromptSeen,
  VINODEX_SUBSTACK_EMBED_URL,
  VINODEX_SUBSTACK_URL,
} from '../src/services/iosUpdatesPrompt';

interface PromptContextValue {
  visible: boolean;
  dismiss: () => void;
}

const PromptContext = React.createContext<PromptContextValue | null>(null);

/**
 * Counts only visible, active time in the Vinodex side of the device. The
 * provider is keyed by App at the site/dex boundary, so leaving the product
 * closes an open invitation; the persisted seen flag prevents it returning.
 */
export const IosUpdatesPromptProvider: React.FC<{
  active: boolean;
  children: React.ReactNode;
}> = ({ active, children }) => {
  const [spent, setSpent] = React.useState(hasSeenIosUpdatesPrompt);
  const [visible, setVisible] = React.useState(false);
  const remainingMs = React.useRef(IOS_UPDATES_PROMPT_DELAY_MS);
  const activeSince = React.useRef<number | null>(null);
  const timer = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (spent) return;

    const pause = () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
      timer.current = null;
      if (activeSince.current !== null) {
        remainingMs.current = Math.max(0, remainingMs.current - (Date.now() - activeSince.current));
        activeSince.current = null;
      }
    };

    const reveal = () => {
      timer.current = null;
      activeSince.current = null;
      remainingMs.current = 0;
      markIosUpdatesPromptSeen();
      setSpent(true);
      setVisible(true);
    };

    const syncTimer = () => {
      pause();
      if (!active || document.hidden) return;
      if (remainingMs.current <= 0) {
        reveal();
        return;
      }
      activeSince.current = Date.now();
      timer.current = window.setTimeout(reveal, remainingMs.current);
    };

    document.addEventListener('visibilitychange', syncTimer);
    syncTimer();
    return () => {
      pause();
      document.removeEventListener('visibilitychange', syncTimer);
    };
  }, [active, spent]);

  const value = React.useMemo(
    () => ({ visible: visible && active, dismiss: () => setVisible(false) }),
    [active, visible],
  );

  return <PromptContext.Provider value={value}>{children}</PromptContext.Provider>;
};

/** Rendered by DeviceLayout so the invitation stays inside the LCD. */
export const IosUpdatesPromptOverlay: React.FC = () => {
  const prompt = React.useContext(PromptContext);
  // The Substack iframe is third-party — it sets its own cookies the moment
  // it loads — and this overlay reveals itself unbidden after 90 seconds. An
  // auto-loaded embed would make PRIVACY + TERMS's "the app makes no
  // third-party requests" a lie, so the frame waits for a tap: the invitation
  // is first-party, the embed is opt-in.
  const [embedLoaded, setEmbedLoaded] = React.useState(false);
  if (!prompt?.visible) return null;

  return (
    <div className="lcd-themed absolute inset-0 z-[6] flex items-end justify-center p-[var(--pad-screen)] pointer-events-none uppercase">
      <section
        className="dex-tint pointer-events-auto w-full max-w-md max-h-full overflow-y-auto rounded-card border border-[var(--tint-border)] bg-[var(--surface-raised)] p-[var(--pad-card)] shadow-elev-3"
        style={{ '--tint': 'var(--livery-green)' } as React.CSSProperties}
        aria-label="Vinodex iOS updates"
      >
        <div className="flex items-start gap-3">
          <span className="shrink-0 rounded-control bg-[var(--tint-subtle)] p-2 text-[var(--tint-ink)]" aria-hidden="true">
            <BellRing size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-retro text-title tracking-widest text-[var(--lcd-text)]">
              WANT VINODEX ON IOS?
            </h2>
            <p className="mt-2 text-caption normal-case text-[var(--lcd-body-text)]">
              Subscribe below for iOS launch news and future product updates.
            </p>
          </div>
        </div>
        {embedLoaded ? (
          <iframe
            src={VINODEX_SUBSTACK_EMBED_URL}
            title="Subscribe to Vinodex on Substack"
            width="480"
            height="320"
            frameBorder="0"
            scrolling="no"
            className="mt-4 block w-full max-w-full rounded-control border border-[var(--surface-line)] bg-white"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEmbedLoaded(true)}
            className="dex-pressable mt-4 flex h-40 w-full flex-col items-center justify-center gap-2 rounded-control border border-[var(--surface-line)] bg-[var(--tint-subtle)]"
          >
            <span className="font-retro text-heading tracking-widest text-[var(--lcd-text)]">SHOW SIGN-UP FORM</span>
            <span className="text-caption normal-case text-[var(--lcd-subtext)]">
              Loads Substack&apos;s embedded form, which sets its own cookies.
            </span>
          </button>
        )}
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={prompt.dismiss}
            className="dex-pressable min-h-11 rounded-control px-4 py-2 font-retro text-heading tracking-widest text-[var(--lcd-subtext)]"
          >
            NOT NOW
          </button>
          <a
            href={VINODEX_SUBSTACK_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={prompt.dismiss}
            className="dex-pressable inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-[var(--lcd-accent)] px-4 py-2 font-retro text-heading tracking-widest text-[var(--lcd-on-accent)] shadow-elev-2"
          >
            OPEN SUBSTACK
            <ArrowUpRight size={17} aria-hidden="true" />
          </a>
        </div>
      </section>
    </div>
  );
};
