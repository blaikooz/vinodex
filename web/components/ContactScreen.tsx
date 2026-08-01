import React from 'react';
import { Mail, Github, Globe } from 'lucide-react';
import DeviceLayout from './DeviceLayout';

interface ContactScreenProps {
  onBack: () => void;
  onHome: () => void;
}

/**
 * The contact page.
 *
 * Shares its section shape with `WhoWeAreScreen` so the two content pages read
 * as one pair. Rows are real anchors rather than buttons, because a mail link
 * and a repo link are navigations — the browser should be able to open them in
 * a new tab, copy them, and show them on hover.
 *
 * PLACEHOLDER ADDRESS. `hello@vinodex.app` is a stand-in: the repo records no
 * contact address, and the account email on this machine is a personal one that
 * should not be published without being asked for. Replace before shipping.
 */
const Row: React.FC<{
  href: string;
  icon: React.ReactNode;
  label: string;
  value: string;
  external?: boolean;
}> = ({ href, icon, label, value, external }) => (
  <a
    href={href}
    {...(external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
    className="w-full flex items-center gap-3 rounded-xl bg-stone-900 border-2 border-green-700 p-3 transition-all active:translate-y-0.5 hover:bg-stone-800 group"
  >
    <span className="text-green-400 shrink-0 group-hover:scale-110 transition-transform">{icon}</span>
    <span className="flex-1 min-w-0 flex flex-col gap-1">
      <span className="font-retro text-[0.6rem] sm:text-[0.7rem] tracking-widest text-green-300">
        {label}
      </span>
      {/* Addresses and URLs are case-sensitive to read, so they opt out of the
          LCD wrapper's uppercase; `break-all` keeps a long one inside the tile. */}
      <span className="font-mono text-[0.65rem] sm:text-xs text-green-500 normal-case break-all">
        {value}
      </span>
    </span>
  </a>
);

const ContactScreen: React.FC<ContactScreenProps> = ({ onBack, onHome }) => (
  <DeviceLayout
    title="CONTACT US"
    subtitle=""
    showBack={true}
    onBack={onBack}
    onHome={onHome}
    centerHeaderText={true}
    showSystemButtons={false}
  >
    <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar bg-stone-950 p-4">
      <div className="flex flex-col gap-4">

        <section className="flex flex-col gap-2">
          <h2 className="font-retro text-[0.65rem] sm:text-xs tracking-widest text-green-300 dex-section-rule pb-1.5">
            GET IN TOUCH
          </h2>
          <p className="font-mono text-[0.7rem] sm:text-xs text-green-500 leading-relaxed normal-case">
            Corrections to an entry, a grape we have missed, or a bug in the
            device itself — all of it is welcome.
          </p>
        </section>

        <div className="flex flex-col gap-3">
          <Row
            href="mailto:hello@vinodex.app"
            icon={<Mail size={22} />}
            label="EMAIL"
            value="hello@vinodex.app"
          />
          <Row
            href="https://github.com/blaikooz/vinodex-web"
            icon={<Github size={22} />}
            label="SOURCE"
            value="github.com/blaikooz/vinodex-web"
            external
          />
          <Row
            href="https://vinodex.vercel.app"
            icon={<Globe size={22} />}
            label="THE APP"
            value="vinodex.vercel.app"
            external
          />
        </div>

      </div>
    </div>
  </DeviceLayout>
);

export default ContactScreen;
