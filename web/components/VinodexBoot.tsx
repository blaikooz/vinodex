import React from 'react';
import { APP_VERSION_DISPLAY } from '../src/services/appVersion';
import { isGranted } from '../src/services/access';

/**
 * The BIOS power-on boot (iOS `VinodexBootView` / `BootSequence`): a POST that
 * lists MEMORY / DATABASE / FIRMWARE, resolving into the identity splash, then
 * hands off to the app. Ported content verbatim from Core — the lines, their
 * order, the tagline, the prompt, the copyright.
 *
 * Deliberately does NOT read the LCD theme: a BIOS runs before the firmware has
 * loaded the user's colourway, so it keeps its own palette (cream = the system
 * talking about itself, gold = telemetry, magenta = the machine addressing you).
 * Any tap/key advances it. The final handoff is deliberately manual: the BIOS
 * is the app's front door, so it waits for the person holding the device.
 */

const INK = {
  bg: '#0E0A0E',
  magenta: '#B0417A',
  magentaDeep: '#7A2E52',
  cream: '#F2E8D5',
  gold: '#E6A93A',
};

const BOOT_MARK = {
  face: '/art/logo/vinodex-mark-face.png',
  shade: '/art/logo/vinodex-mark-shade.png',
} as const;

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

  // MAINFRAME's whole prize (iOS 0.7.3 A4, web v0.6.46): two more POST
  // lines, slotted where a real POST would put them. A lazy initializer, so
  // the store is read once per boot and never during a re-render.
  const [verbose] = React.useState(() => isGranted({ kind: 'easterEgg', id: 'verboseBoot' }));

  React.useEffect(() => {
    // Absolute schedule from one start instant, the same instants as iOS's
    // `at:` values x1000. The sequence resolves into a stable prompt and
    // waits there until a tap or key explicitly enters.
    const at = verbose ? [300, 500, 700, 900, 1100] : [300, 700, 1100];
    const t = [
      ...at.map((ms, i) => window.setTimeout(() => setLines(i + 1), ms)),
      window.setTimeout(() => setSplash(true), 1750),
    ];
    return () => t.forEach(window.clearTimeout);
  }, [finish, verbose]);

  const post: [string, string][] = verbose
    ? [
        ['MEMORY', '640K OK'],
        ['DISPLAY', 'LCD OK'],
        ['DATABASE', entries > 0 ? `${entries} ENTRIES` : 'NO DATA'],
        ['CATALOG', 'MOUNTED'],
        ['FIRMWARE', APP_VERSION_DISPLAY],
      ]
    : [
        ['MEMORY', '640K OK'],
        ['DATABASE', entries > 0 ? `${entries} ENTRIES` : 'NO DATA'],
        ['FIRMWARE', APP_VERSION_DISPLAY],
      ];

  return (
    <div
      className="bios-boot absolute inset-0 z-[30] flex select-none cursor-pointer overflow-hidden font-mono"
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
          <div className="flex-1 min-h-0 flex flex-col items-center justify-center px-4 sm:px-6 text-center gap-2.5">
            {/* The canonical iOS BootMark: two white-on-alpha pixel layers,
                coloured here with the BIOS palette. Its aspect ratio and
                inline-size cap keep it wholly inside the LCD at every chassis
                size; the screen remains the only clipping boundary. */}
            <div
              className="bios-boot-mark relative shrink-0"
              data-bios-mark
              aria-hidden="true"
            >
              <span
                className="bios-boot-mark-layer absolute inset-0"
                style={{
                  backgroundColor: INK.magentaDeep,
                  WebkitMaskImage: `url(${BOOT_MARK.shade})`,
                  maskImage: `url(${BOOT_MARK.shade})`,
                }}
              />
              <span
                className="bios-boot-mark-layer absolute inset-0"
                style={{
                  background: `linear-gradient(to bottom, ${INK.cream}, rgba(242,232,213,0.72))`,
                  WebkitMaskImage: `url(${BOOT_MARK.face})`,
                  maskImage: `url(${BOOT_MARK.face})`,
                }}
              />
            </div>
            <h1
              className="bios-boot-wordmark max-w-full font-retro font-black"
              data-bios-wordmark
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
