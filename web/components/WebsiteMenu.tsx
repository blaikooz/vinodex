import React from 'react';
import { LayoutGrid, Users, Mail, BarChart3 } from 'lucide-react';
import DeviceLayout from './DeviceLayout';

interface WebsiteMenuProps {
  onOurApps: () => void;
  onWhoWeAre: () => void;
  onContact: () => void;
  onData: () => void;
  onBack: () => void;
}

/**
 * The website's front page — the same four-tile face as the dex menu, with the
 * categories swapped for the things a visitor rather than a user wants.
 *
 * Built as a copy of `MainMenu`'s layout on purpose. The handheld chassis *is*
 * the product's identity, and a website that dropped into a conventional
 * centred landing page would read as a different site that happens to link to
 * this one — the same reasoning `SplashScreen` records for rendering inside
 * `DeviceLayout`. Tile geometry, the border-b depress, the gradient sheen and
 * the retro grid are all lifted rather than reinvented so the two menus are
 * recognisably one screen with different labels.
 *
 * The centre circle is the one deliberate departure. On the dex it is the
 * master search button; there is nothing on a four-page website that earns a
 * control that prominent, so the slot holds the mark instead. It is a plain
 * decorative disc — no hover, no depress, no handler — because a circle that
 * looked pressable and did nothing would be worse than one that plainly does
 * not.
 *
 * No chassis system buttons: SAVED and SETTINGS are in-dex controls, and the
 * splash already establishes that they stay off outside the app.
 */
interface TileProps {
  label: string;
  icon: React.ReactNode;
  /** Face and depressed edge, matching the dex tiles' `bg-*` / `border-*` pair. */
  face: string;
  edge: string;
  hover: string;
  onClick: () => void;
}

const Tile: React.FC<TileProps> = ({ label, icon, face, edge, hover, onClick }) => (
  <button
    onClick={onClick}
    className={`flex-1 min-w-0 ${face} border-b-[6px] ${edge} rounded-xl shadow-lg active:translate-y-1 active:border-b-0 transition-all flex flex-col items-center justify-center group ${hover} relative overflow-hidden`}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
    <span className="text-white mb-2 group-hover:scale-110 transition-transform drop-shadow-md">{icon}</span>
    {/*
      Two words on one line at the dex's `text-xl` overflows a phone-width tile,
      so the label steps down a notch and wraps on its own space.

      Wrapping is left to the browser rather than forced with a `\n` and
      `whitespace-pre-line`: a literal newline survives into the button's
      accessible name, so a screen reader announced "WHO WE" / "ARE" as two
      lines of one label. The visual result is identical.
    */}
    <span className="font-retro text-[0.6rem] sm:text-base text-white tracking-widest drop-shadow-md text-center px-1 leading-relaxed">
      {label}
    </span>
  </button>
);

const WebsiteMenu: React.FC<WebsiteMenuProps> = ({
  onOurApps,
  onWhoWeAre,
  onContact,
  onData,
  onBack,
}) => {
  return (
    <DeviceLayout
      title="WEBSITE"
      subtitle=""
      showBack={true}
      onBack={onBack}
      // Already the top of this section, so Home is present for chassis
      // symmetry but has nowhere to go — exactly what the dex menu does.
      onHome={() => {}}
      showSystemButtons={false}
    >
      <div className="flex-1 min-h-0 w-full flex flex-col items-center bg-dex-screen relative overflow-hidden">

        {/* Retro grid background — same treatment as the dex menu and splash. */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(50, 255, 50, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(50, 255, 50, 0.3) 1px, transparent 1px)',
            backgroundSize: '30px 30px',
          }}
        />

        <div className="relative w-full h-full z-10 flex flex-col p-6 gap-6 justify-between">

          {/* Top row */}
          <div className="flex gap-4 w-full flex-1 min-h-0">
            <Tile
              label="OUR APPS"
              icon={<LayoutGrid size={44} className="sm:w-14 sm:h-14" />}
              face="bg-purple-500"
              edge="border-purple-800"
              hover="hover:bg-purple-400"
              onClick={onOurApps}
            />
            <Tile
              label="WHO WE ARE"
              icon={<Users size={44} className="sm:w-14 sm:h-14" />}
              /* green-700, the shade the dex REGIONS tile takes from iOS. */
              face="bg-green-500"
              edge="border-green-700"
              hover="hover:bg-green-400"
              onClick={onWhoWeAre}
            />
          </div>

          {/* Centre mark — decorative, see the note above. */}
          <div className="shrink-0 h-24 sm:h-32 flex items-center justify-center">
            <div
              aria-hidden="true"
              className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-[6px] border-stone-600 bg-stone-900 shadow-[0_0_25px_rgba(0,0,0,0.45)] flex items-center justify-center overflow-hidden"
            >
              <img src="/vinodex-logo.png" alt="" className="w-[70%] h-[70%] object-contain" />
            </div>
          </div>

          {/* Bottom row */}
          <div className="flex gap-4 w-full flex-1 min-h-0">
            <Tile
              label="CONTACT US"
              icon={<Mail size={44} className="sm:w-14 sm:h-14" />}
              face="bg-orange-500"
              edge="border-orange-800"
              hover="hover:bg-orange-400"
              onClick={onContact}
            />
            {/*
              Blue and the bar-chart glyph, matching the DATA tile in
              SETTINGS — it opens that very panel, so it should not arrive
              wearing a different colour.
            */}
            <Tile
              label="DATA"
              icon={<BarChart3 size={44} className="sm:w-14 sm:h-14" />}
              face="bg-blue-500"
              edge="border-blue-800"
              hover="hover:bg-blue-400"
              onClick={onData}
            />
          </div>

        </div>

      </div>
    </DeviceLayout>
  );
};

export default WebsiteMenu;
