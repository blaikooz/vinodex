import React from 'react';
import { MemoryStick, AlertTriangle } from 'lucide-react';
import DeviceLayout from './DeviceLayout';
import { FIRMWARE_RELEASES, FIRMWARE_VERSION } from '@/shared/constants';
import { APP_VERSION_DISPLAY } from '../src/services/appVersion';

interface FirmwareHistoryScreenProps {
  onBack: () => void;
  onHome: () => void;
}

/**
 * The installed firmware and every release before it, ported from
 * `vinodex-ios/Sources/VinodexUI/FirmwareHistoryScreen.swift` (v6#9).
 *
 * Reads `FIRMWARE_RELEASES` from `shared/constants` — the same catalog the
 * iOS boot POST states its version from. Newest first, and the current one is
 * marked: a changelog whose top entry might or might not be what you are
 * running is a changelog you have to cross-reference.
 *
 * Two versions, two numbers: the catalog narrates the **device firmware**
 * line the two apps share; the web app itself versions separately
 * (`appVersion.ts`, engraved on the back plate). One line below the readout
 * says so, because a page that showed 0.9.x over a back plate saying 0.1.x
 * with no comment would read as a bug.
 */
const FirmwareHistoryScreen: React.FC<FirmwareHistoryScreenProps> = ({ onBack, onHome }) => {
  return (
    <DeviceLayout title="FIRMWARE" subtitle="" showBack onBack={onBack} onHome={onHome} centerHeaderText>
      <div className="h-full overflow-y-auto custom-scrollbar p-4 flex flex-col gap-4" style={{ backgroundColor: 'var(--lcd-page)' }}>
        {FIRMWARE_RELEASES.length === 0 ? (
          // The distress state — says what is wrong rather than showing an
          // empty list, which would read as "this device has no history".
          <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center">
            <AlertTriangle size={34} className="text-red-500" />
            <div className="font-retro text-xs tracking-widest text-stone-100">NO FIRMWARE RECORD</div>
            <p className="font-mono text-xs text-stone-400 normal-case">The changelog failed to load. See SETTINGS ▸ DEV.</p>
          </div>
        ) : (
          <>
            {/* The headline readout: what firmware this catalog is at. */}
            <div className="rounded-lg p-4 border-2" style={{ backgroundColor: 'var(--lcd-surface)', borderColor: 'var(--lcd-accent)' }}>
              <div className="font-retro text-[0.55rem] tracking-[0.15em] text-stone-400">INSTALLED</div>
              <div className="flex items-baseline gap-2 mt-1">
                <MemoryStick size={20} className="text-green-400" />
                <span className="font-retro text-xl tracking-wide text-green-400">v{FIRMWARE_VERSION}</span>
              </div>
              {FIRMWARE_RELEASES[0] && (
                <div className="font-retro text-[0.55rem] tracking-widest text-stone-200 mt-2">{FIRMWARE_RELEASES[0].headline}</div>
              )}
              <p className="font-mono text-[0.6rem] text-stone-500 mt-2 normal-case">
                Device firmware, shared with the iOS build. This web shell is {APP_VERSION_DISPLAY} — see the back plate.
              </p>
            </div>

            {FIRMWARE_RELEASES.map(release => {
              const isCurrent = release.version === FIRMWARE_VERSION;
              return (
                <div key={release.version} className="rounded-md p-3.5 border" style={{ backgroundColor: 'var(--lcd-surface)', borderColor: 'var(--lcd-surface-edge, #44403c)' }}>
                  <div className="flex items-baseline gap-2">
                    <span className={`font-retro text-sm tracking-wide ${isCurrent ? 'text-green-400' : 'text-stone-100'}`}>v{release.version}</span>
                    {isCurrent && (
                      <span className="font-retro text-[0.5rem] tracking-widest px-1.5 py-0.5 rounded-sm bg-green-500 text-black">CURRENT</span>
                    )}
                    <span className="ml-auto font-mono text-xs text-stone-400">{release.date}</span>
                  </div>
                  <div className="font-retro text-[0.55rem] tracking-[0.15em] text-stone-400 mt-2 pb-1 border-b" style={{ borderColor: 'color-mix(in srgb, var(--lcd-accent) 30%, transparent)' }}>
                    {release.headline}
                  </div>
                  <ul className="mt-2 flex flex-col gap-1.5">
                    {release.notes.map((note, i) => (
                      <li key={i} className="flex items-start gap-2">
                        {/* A bullet the retro face definitely has. */}
                        <span className="font-mono text-xs text-green-400/70">&gt;</span>
                        <span className="font-mono text-xs text-stone-200 normal-case">{note}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </>
        )}
      </div>
    </DeviceLayout>
  );
};

export default FirmwareHistoryScreen;
