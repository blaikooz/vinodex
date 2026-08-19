import React from 'react';
import { MemoryStick, AlertTriangle } from 'lucide-react';
import DeviceLayout from './DeviceLayout';
import { WEB_RELEASES } from '../src/services/webChangelog';
import { APP_VERSION } from '../src/services/appVersion';

interface FirmwareHistoryScreenProps {
  onBack: () => void;
  onHome: () => void;
}

/**
 * The installed firmware and every release before it, ported from
 * `vinodex-ios/Sources/VinodexUI/FirmwareHistoryScreen.swift` (v6#9).
 *
 * ## It narrates the WEB's releases, not the device catalog (ruling, v7)
 *
 * Until this change it read `FIRMWARE_RELEASES` from `shared/constants` —
 * iOS's authored device-firmware line, at v0.9.2 — and then carried a line of
 * copy apologising for it: *"Device firmware, shared with the iOS build. This
 * web shell is v0.1.0 — see the back plate."*
 *
 * That disclaimer was the tell. The app was contradicting itself: the BIOS
 * POST has always reported `FIRMWARE: <the web's own version>`
 * (`VinodexBoot.tsx`), so the device's own power-on self-description already
 * said the firmware is the web's. This screen said it was something else and
 * then explained the discrepancy. A page that has to tell you why it disagrees
 * with the machine it is running on is answering the wrong question.
 *
 * And the reader settles it. A web visitor has no phone. iOS's release notes
 * describe builds they cannot install, features gated behind an App Store
 * listing that is not live, and version numbers that will never match anything
 * they see — which is noise dressed as a changelog.
 *
 * So the screen reads `webChangelog.ts`, and **one authored changelog now
 * feeds both the release gate and this page**. That is the part worth having:
 * the version cannot move without an entry (`webChangelog.test.ts`), and the
 * entry is what the player reads. There is no second document to fall behind.
 *
 * `shared/data/firmware.ts` is untouched and stays iOS's — it is not the
 * web's to author, and nothing here imports it any more. The one remaining
 * reference in this repo is a test asserting the two release lines never share
 * a version, which is the fiction stated as a check.
 *
 * Newest first, and the current one is marked: a changelog whose top entry
 * might or might not be what you are running is a changelog you have to
 * cross-reference.
 */
const FirmwareHistoryScreen: React.FC<FirmwareHistoryScreenProps> = ({ onBack, onHome }) => {
  return (
    <DeviceLayout title="FIRMWARE" subtitle="" showBack onBack={onBack} onHome={onHome} centerHeaderText>
      <div className="h-full overflow-y-auto custom-scrollbar p-4 flex flex-col gap-4" style={{ backgroundColor: 'var(--lcd-page)' }}>
        {WEB_RELEASES.length === 0 ? (
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
                <span className="font-retro text-xl tracking-wide text-green-400">v{APP_VERSION}</span>
              </div>
              {WEB_RELEASES[0] && (
                <div className="font-retro text-[0.55rem] tracking-widest text-stone-200 mt-2">{WEB_RELEASES[0].headline}</div>
              )}
              {/* No disclaimer any more, because there is nothing to
                  disclaim: this number is the one the BIOS states at power-on
                  and the one engraved on the back plate. */}
              <p className="font-mono text-[0.6rem] text-stone-500 mt-2 normal-case">
                Everything this device has shipped, newest first.
              </p>
            </div>

            {WEB_RELEASES.map(release => {
              const isCurrent = release.version === APP_VERSION;
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
