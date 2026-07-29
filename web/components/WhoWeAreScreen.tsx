import React from 'react';
import DeviceLayout from './DeviceLayout';

interface WhoWeAreScreenProps {
  onBack: () => void;
  onHome: () => void;
}

/**
 * The about page.
 *
 * Shares its section shape with `ContactScreen` — a retro heading rule over a
 * normal-case paragraph — so the two content pages read as one pair rather than
 * as two people's idea of a text screen. `normal-case` is load-bearing: the LCD
 * wrapper in `DeviceLayout` uppercases everything inside it, which is right for
 * labels and unreadable for prose.
 *
 * PLACEHOLDER COPY. The product paragraphs are true — they are drawn from the
 * README — but the studio line below them is a stand-in, because the repo does
 * not record who "we" are. Replace it before this ships.
 */
const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="flex flex-col gap-2">
    <h2 className="font-retro text-[0.65rem] sm:text-xs tracking-widest text-green-300 dex-section-rule pb-1.5">
      {title}
    </h2>
    <div className="font-mono text-[0.7rem] sm:text-xs text-green-500 leading-relaxed normal-case flex flex-col gap-2">
      {children}
    </div>
  </section>
);

const WhoWeAreScreen: React.FC<WhoWeAreScreenProps> = ({ onBack, onHome }) => (
  <DeviceLayout
    title="WHO WE ARE"
    subtitle=""
    showBack={true}
    onBack={onBack}
    onHome={onHome}
    centerHeaderText={true}
    showSystemButtons={false}
  >
    <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar bg-stone-950 p-4">
      <div className="flex flex-col gap-5">

        <div className="flex flex-col items-center gap-3 pb-1">
          <img
            src="/vinodex-logo.png"
            alt="Vinodex"
            className="w-24 rounded-[18%] shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
          />
        </div>

        <Section title="WHAT WE MAKE">
          <p>
            Vinodex is a wine encyclopedia that looks like a 90s handheld. 284
            grapes, regions, styles and flavours — colour-coded, cross-linked,
            and wrapped in a plastic shell you can re-skin five different ways.
          </p>
          <p>
            Every entry cross-links to the others: a grape names its regions, a
            region names its grapes, and both resolve. There is a draggable 3D
            globe, a scanner that deduces what is in your glass from four
            questions, and a daily reveal played as a guess.
          </p>
        </Section>

        <Section title="HOW WE BUILD IT">
          <p>
            One product, two native-feeling builds: a React PWA and a SwiftUI
            iOS app that share the same chassis, the same screens and the same
            rules. Neither is a wrapper around the other.
          </p>
          <p>
            No account, no tracking, and nothing to sign up for. Your saved
            entries and your chosen skin live in your own browser's storage and
            go no further.
          </p>
        </Section>

        {/* PLACEHOLDER — see the note on this component. */}
        <Section title="THE STUDIO">
          <p>
            We are a small independent studio building reference tools that are
            pleasant to use rather than merely complete.
          </p>
        </Section>

      </div>
    </div>
  </DeviceLayout>
);

export default WhoWeAreScreen;
