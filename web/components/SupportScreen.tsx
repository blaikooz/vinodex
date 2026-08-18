import React from 'react';
import { Mail } from 'lucide-react';
import DeviceLayout from './DeviceLayout';
import { SUPPORT_ADDRESS, SUPPORT_BLURB, supportMailtoURL } from '../src/services/supportContact';
import { APP_VERSION_DISPLAY } from '../src/services/appVersion';

interface SupportScreenProps {
  onBack: () => void;
  onHome: () => void;
}

/**
 * The in-app contact door, ported from
 * `vinodex-ios/Sources/VinodexUI/SupportScreen.swift` (0.8.91, F1) — v6#25.
 *
 * A **dex** screen: it deliberately shares nothing with the website portal's
 * CONTACT US (`WebsitePortal`), per the separation rule — that page is the
 * company's door, this one is the device's.
 */
const SupportScreen: React.FC<SupportScreenProps> = ({ onBack, onHome }) => {
  return (
    <DeviceLayout title="SUPPORT" subtitle="" showBack onBack={onBack} onHome={onHome} centerHeaderText>
      <div className="h-full overflow-y-auto custom-scrollbar p-4 flex flex-col gap-4" style={{ backgroundColor: 'var(--lcd-page)' }}>
        <div className="font-retro text-sm tracking-widest text-green-400 pb-1 border-b-2" style={{ borderColor: 'color-mix(in srgb, var(--lcd-accent) 45%, transparent)' }}>
          WRITE IN
        </div>

        <p className="font-mono text-sm text-stone-200 normal-case leading-relaxed">{SUPPORT_BLURB}</p>

        <a
          href={supportMailtoURL(APP_VERSION_DISPLAY)}
          className="w-full flex items-center justify-center gap-2 rounded-md bg-green-500 border-2 border-green-400 py-3.5 font-retro text-[0.65rem] tracking-widest text-black transition-all active:translate-y-0.5"
        >
          <Mail size={16} /> OPEN MAIL
        </a>

        {/* The address in the clear, for anyone whose browser has no mail
            handler — a mailto that silently does nothing would strand them. */}
        <p className="font-mono text-xs text-stone-400 normal-case text-center">
          or write to <span className="text-stone-200 select-all">{SUPPORT_ADDRESS}</span>
        </p>
      </div>
    </DeviceLayout>
  );
};

export default SupportScreen;
