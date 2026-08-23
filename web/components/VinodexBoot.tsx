import React from 'react';
import { APP_VERSION_DISPLAY } from '../src/services/appVersion';

/**
 * The BIOS power-on boot (iOS `VinodexBootView` / `BootSequence`): a POST that
 * lists MEMORY / DATABASE / FIRMWARE, resolving into the identity splash, then
 * hands off to the app. Ported content verbatim from Core — the lines, their
 * order, the tagline, the prompt, the copyright.
 *
 * Deliberately does NOT read the LCD theme: a BIOS runs before the firmware has
 * loaded the user's colourway, so it keeps its own palette (cream = the system
 * talking about itself, gold = telemetry, magenta = the machine addressing you).
 * Any tap/key advances it; it also auto-advances so it can never trap a launch.
 */

const INK = {
  bg: '#0E0A0E',
  magenta: '#B0417A',
  cream: '#F2E8D5',
  gold: '#E6A93A',
};

interface Props {
  entries: number;
  onDone: () => void;
}

interface BootContextValue extends Props {
  active: boolean;
}

const BootContext = React.createContext<BootContextValue | null>(null);

/** Keeps the boot state beside the routes while DeviceLayout paints it in the LCD. */
export const VinodexBootProvider: React.FC<BootContextValue & { children: React.ReactNode }> = ({
  active,
  entries,
  onDone,
  children,
}) => {
  const value = React.useMemo(
    () => ({ active, entries, onDone }),
    [active, entries, onDone],
  );
  return <BootContext.Provider value={value}>{children}</BootContext.Provider>;
};

const VinodexBoot: React.FC<Props> = ({ entries, onDone }) => {
  const [lines, setLines] = React.useState(0); // POST lines revealed
  const [splash, setSplash] = React.useState(false);
  const done = React.useRef(false);

  const finish = React.useCallback(() => {
    if (done.current) return;
    done.current = true;
    onDone();
  }, [onDone]);

  React.useEffect(() => {
    // Absolute schedule from one start instant (iOS: bounded by ~5.4s; the web
    // trims it since a boot animation taxes every launch).
    const t = [
      window.setTimeout(() => setLines(1), 300),
      window.setTimeout(() => setLines(2), 700),
      window.setTimeout(() => setLines(3), 1100),
      window.setTimeout(() => setSplash(true), 1750),
      window.setTimeout(finish, 3400),
    ];
    return () => t.forEach(window.clearTimeout);
  }, [finish]);

  const post: [string, string][] = [
    ['MEMORY', '640K OK'],
    ['DATABASE', entries > 0 ? `${entries} ENTRIES` : 'NO DATA'],
    ['FIRMWARE', APP_VERSION_DISPLAY],
  ];

  return (
    <div
      className="absolute inset-0 z-[30] flex select-none cursor-pointer overflow-hidden font-mono"
      style={{ backgroundColor: INK.bg }}
      onClick={finish}
      onKeyDown={finish}
      role="button"
      tabIndex={0}
      aria-label="Skip boot"
    >
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        {/* faint scanlines */}
        <div className="absolute inset-0 pointer-events-none opacity-30 scanlines" />

        {!splash ? (
          <div className="flex-1 flex flex-col justify-center px-6 sm:px-10 gap-1.5">
            <div className="mb-4 text-sm sm:text-base tracking-widest" style={{ color: INK.cream }}>
              VINODEX BIOS {APP_VERSION_DISPLAY}
            </div>
            {post.slice(0, lines).map(([label, result]) => (
              <div key={label} className="flex items-baseline text-xs sm:text-sm tracking-wider">
                <span style={{ color: INK.cream }}>{label}</span>
                <span className="flex-1 mx-2 border-b border-dotted self-center" style={{ borderColor: 'rgba(176,65,122,0.5)' }} />
                <span style={{ color: INK.gold }}>{result}</span>
              </div>
            ))}
            <span className="mt-2 w-2 h-4 inline-block animate-pulse" style={{ backgroundColor: INK.cream }} aria-hidden="true" />
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-3">
            <h1
              className="text-4xl sm:text-5xl font-black italic -skew-x-6 tracking-tight"
              style={{
                backgroundImage: `linear-gradient(to bottom, #ffffff, ${INK.cream}, ${INK.gold}, ${INK.cream}, #ffffff)`,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
                filter: 'drop-shadow(0 0 8px rgba(230,169,58,0.4))',
              }}
            >
              VINODEX
            </h1>
            <div className="w-40 h-px" style={{ backgroundColor: INK.magenta }} />
            <div className="text-xs sm:text-sm tracking-[0.3em]" style={{ color: INK.gold }}>
              DISCOVER · COLLECT · TASTE
            </div>
            <div className="mt-2 flex items-baseline gap-2 text-[0.7rem] tracking-widest" style={{ color: INK.cream }}>
              <span>SYSTEM CHECK...</span>
              <span style={{ color: INK.gold }}>OK</span>
            </div>
            <div className="text-[0.6rem] tracking-widest" style={{ color: INK.gold }}>
              © 2026 HORIZON/GODOT
            </div>
            <div className="mt-6 text-[0.6rem] sm:text-xs tracking-[0.25em] animate-pulse" style={{ color: INK.magenta }}>
              PRESS ANY BUTTON TO CONTINUE
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/** DeviceLayout's slot for the active sequence. Nothing renders on site routes. */
export const VinodexBootOverlay: React.FC = () => {
  const boot = React.useContext(BootContext);
  if (!boot?.active) return null;
  return <VinodexBoot entries={boot.entries} onDone={boot.onDone} />;
};

export default VinodexBoot;
