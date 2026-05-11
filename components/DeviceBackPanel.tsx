import React from 'react';
import pkg from '../package.json';

interface DeviceBackPanelProps {
  onReturn: () => void;
}

const APP_NAME = (pkg.name || 'vinodex').toUpperCase();
const APP_VERSION = `v0.0.${__GIT_COMMIT_COUNT__}`;
const CREATOR = 'HORIZON';
const COPYRIGHT_YEAR = new Date().getFullYear();
const SERIAL = `SN: VDX-${COPYRIGHT_YEAR}-001`;

const engravedTextShadow =
  '0 1px 0 rgba(255,255,255,0.55), 0 -1px 0 rgba(0,0,0,0.45), inset 0 0 2px rgba(0,0,0,0.4)';

const Screw: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`w-4 h-4 md:w-5 md:h-5 rounded-full bg-gradient-to-br from-stone-200 via-stone-400 to-stone-600 border border-stone-700 shadow-[inset_0_1px_2px_rgba(255,255,255,0.7),inset_0_-1px_2px_rgba(0,0,0,0.5),0_1px_2px_rgba(0,0,0,0.4)] flex items-center justify-center ${className}`}
    aria-hidden="true"
  >
    <div className="w-[70%] h-[1.5px] bg-stone-800/70 rounded-full rotate-45" />
  </div>
);

const DeviceBackPanel: React.FC<DeviceBackPanelProps> = ({ onReturn }) => {
  return (
    <button
      type="button"
      onClick={onReturn}
      aria-label="Flip device back to front"
      className="w-full h-full md:rounded-[2.5rem] overflow-hidden relative border-[3px] border-stone-700 ring-1 ring-white/10 shadow-[inset_-10px_-10px_30px_rgba(0,0,0,0.35),inset_10px_10px_30px_rgba(255,255,255,0.08)] cursor-pointer focus:outline-none active:brightness-95 transition"
      style={{
        background:
          'linear-gradient(135deg, #cdcfd2 0%, #9ea1a5 35%, #7e8186 60%, #b8babd 100%)',
      }}
    >
      {/* Brushed metal texture: fine vertical striations */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40 mix-blend-overlay"
        style={{
          backgroundImage:
            'repeating-linear-gradient(90deg, rgba(255,255,255,0.18) 0px, rgba(255,255,255,0.18) 1px, rgba(0,0,0,0.18) 1px, rgba(0,0,0,0.18) 2px)',
        }}
      />

      {/* Subtle radial highlight */}
      <div
        className="absolute inset-0 pointer-events-none opacity-50"
        style={{
          background:
            'radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 55%)',
        }}
      />

      {/* Corner screws */}
      <Screw className="absolute top-3 left-3 md:top-4 md:left-4" />
      <Screw className="absolute top-3 right-3 md:top-4 md:right-4" />
      <Screw className="absolute bottom-3 left-3 md:bottom-4 md:left-4" />
      <Screw className="absolute bottom-3 right-3 md:bottom-4 md:right-4" />

      {/* Engraved content */}
      <div className="relative h-full w-full flex flex-col items-center justify-center px-6 py-10 gap-8 text-stone-700 font-mono select-none">
        {/* Nameplate — recessed */}
        <div
          className="px-8 py-5 rounded-md border border-stone-700/50 bg-gradient-to-b from-stone-500/40 to-stone-700/40 shadow-[inset_0_2px_6px_rgba(0,0,0,0.5),0_1px_0_rgba(255,255,255,0.5)] flex flex-col items-center"
        >
          <div
            className="font-retro text-[2rem] md:text-[2.5rem] tracking-[0.25em] leading-none text-stone-800"
            style={{ textShadow: engravedTextShadow }}
          >
            {APP_NAME}
          </div>
          <div
            className="mt-2 text-base md:text-lg tracking-[0.5em] text-stone-700"
            style={{ textShadow: engravedTextShadow }}
          >
            {APP_VERSION}
          </div>
        </div>

        {/* Creator */}
        <div
          className="text-base md:text-xl tracking-[0.4em] text-stone-700"
          style={{ textShadow: engravedTextShadow }}
        >
          CREATED BY {CREATOR}
        </div>

        {/* Divider */}
        <div className="w-2/3 h-px bg-gradient-to-r from-transparent via-stone-800/40 to-transparent shadow-[0_1px_0_rgba(255,255,255,0.4)]" />

        {/* Spec / serial / copyright block */}
        <div className="flex flex-col items-center gap-2.5 text-sm md:text-base tracking-[0.25em] text-stone-700">
          <div style={{ textShadow: engravedTextShadow }}>{SERIAL}</div>
          <div style={{ textShadow: engravedTextShadow }}>
            &copy; {COPYRIGHT_YEAR} {CREATOR}
          </div>
          <div style={{ textShadow: engravedTextShadow }}>ALL RIGHTS RESERVED</div>
        </div>

        {/* Return hint */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-2 text-sm md:text-base tracking-[0.4em] text-stone-800/80 animate-pulse">
          <span aria-hidden="true">&#9664;</span>
          <span style={{ textShadow: engravedTextShadow }}>TAP TO RETURN</span>
        </div>
      </div>
    </button>
  );
};

export default DeviceBackPanel;
