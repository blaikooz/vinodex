
import React from 'react';
import { Home } from 'lucide-react';

interface DeviceLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  onBack?: () => void;
  showBack?: boolean;
  onHome?: () => void;
  hideHeader?: boolean;
  centerHeaderText?: boolean;
  footerCenter?: React.ReactNode;
}

const DeviceLayout: React.FC<DeviceLayoutProps> = ({ 
  children, 
  title, 
  subtitle,
  onBack, 
  showBack = false,
  onHome,
  hideHeader = false,
  centerHeaderText = false,
  footerCenter,
}) => {

  const topTitle = "VINODEX";
  const isMainScreen = title === 'VINODEX';
  const footerTitle = isMainScreen
    ? 'CHEERS! - SANTE! - SALUTE! - PROST! - KANPAI!'
    : title;
  const backEnabled = showBack && !!onBack;
  const footerTitleSize = footerTitle === 'VINODEX'
    ? 'text-[2rem] md:text-[2.3rem]'
    : 'text-[1.55rem] md:text-[1.8rem]';
  const defaultFooterDisplay = (
    <div className="w-full max-w-[16.5rem] rounded-[1.1rem] bg-black px-[0.35rem] py-[0.3rem] border border-white/75 shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_3px_0_rgba(120,120,120,0.95)]">
      <div className="flex items-center min-h-[4.1rem] overflow-hidden bg-black rounded-[0.9rem] px-1 shadow-[inset_0_0_18px_rgba(34,197,94,0.16)]">
        <div className={`terminal-marquee whitespace-nowrap ${isMainScreen ? 'terminal-marquee-slow' : ''}`}>
          <span
            className={`inline-block font-retro ${footerTitleSize} italic tracking-[-0.08em] transform -skew-x-12 leading-none text-green-500 pr-12`}
            style={{ textShadow: '1px 1px 0px rgba(8, 32, 16, 0.65)' }}
          >
            {footerTitle}
          </span>
          <span
            aria-hidden="true"
            className={`inline-block font-retro ${footerTitleSize} italic tracking-[-0.08em] transform -skew-x-12 leading-none text-green-500 pr-12`}
            style={{ textShadow: '1px 1px 0px rgba(8, 32, 16, 0.65)' }}
          >
            {footerTitle}
          </span>
        </div>
      </div>
    </div>
  );
  const headerTitleSize = topTitle === 'VINODEX'
    ? 'text-[2.031rem] md:text-[2.656rem]'
    : 'text-[1.21875rem] md:text-[1.59375rem]';
  const headerAlignment = 'items-end text-right';

  return (
    <div className="flex justify-center items-center min-h-screen bg-neutral-900 p-0 md:p-4 font-mono h-screen md:h-auto overflow-hidden rounded-[2rem]">
      {/* Device Chassis - Red Pokedex Style */}
      <div className="w-full h-full md:h-[850px] md:w-[522px] bg-dex-red md:rounded-[2.5rem] md:shadow-[0_20px_50px_rgba(220,10,45,0.3)] overflow-hidden relative border-[3px] border-dex-darkRed ring-1 ring-white/10 shadow-[inset_-10px_-10px_30px_rgba(0,0,0,0.2)]">
        <div className="flex h-full flex-col">
        
        {/* Device Top Bar */}
        {!hideHeader && (
          <div className="shrink-0 flex items-end px-4 pr-5 py-2.5 justify-between">
            <div className="flex flex-row items-start gap-3">
              <div className="w-[3.125rem] h-[3.125rem] md:w-[3.75rem] md:h-[3.75rem] rounded-full bg-gradient-to-b from-stone-300 to-stone-500 border-[3px] border-stone-600 flex items-center justify-center shrink-0 shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),0_4px_8px_rgba(0,0,0,0.5)]">
                <div className="w-[2.344rem] h-[2.344rem] md:w-[2.734rem] md:h-[2.734rem] rounded-full bg-blue-500 border-[2px] border-white flex items-center justify-center relative overflow-hidden shadow-inner lcd-pulse">
                  <div className="absolute top-1 left-1 w-2 h-2 bg-white rounded-full opacity-60 blur-[1px]"></div>
                  <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-700 opacity-90"></div>
                </div>
              </div>
              <div className="flex flex-row gap-2 items-center pt-1">
                <div className="w-4 h-4 rounded-full bg-red-600 border border-red-800 dot-pulse-red"></div>
                <div className="w-4 h-4 rounded-full bg-yellow-400 border border-yellow-600 dot-pulse-yellow"></div>
                <div className="w-4 h-4 rounded-full bg-green-500 border border-green-700 dot-pulse-green"></div>
              </div>
            </div>
            <div className={`flex-1 flex flex-col justify-end min-w-0 gap-[1px] ${headerAlignment}`}>
              <h1
                className={`font-retro ${headerTitleSize} text-white italic tracking-tighter drop-shadow-md transform -skew-x-12 whitespace-nowrap mb-0 leading-tight`}
                style={{ textShadow: '2px 2px 0px #89061C' }}
              >
                {topTitle}
              </h1>
            </div>
          </div>
        )}

        {/* Screen Container */}
        <div className="flex-1 min-h-0 pb-[6.5rem] md:pb-[7.25rem]">
          <div className="h-full bg-dex-ui flex flex-col relative m-2 mt-0 rounded-[2rem] border-l-[6px] border-r-[6px] border-b-[6px] border-t-0 border-stone-400 shadow-inner">

          {/* Decorative vents in white bezel - center only */}
          <div className="relative flex items-center justify-center px-4 h-6 opacity-50 shrink-0">
            <div className="flex gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 border border-red-800 shadow-[0_0_6px_rgba(239,68,68,0.8)]"></span>
              <span className="w-2 h-2 rounded-full bg-red-500 border border-red-800 shadow-[0_0_6px_rgba(239,68,68,0.8)]"></span>
            </div>
          </div>
          
          {/* Inner Screen Bezel */}
          <div className="flex-1 min-h-0 bg-stone-800 rounded-[1.75rem] relative flex flex-col overflow-hidden mx-3">
            
            {/* Main LCD Content */}
            <div className="flex-1 min-h-0 bg-dex-screen relative w-full overflow-hidden flex flex-col">
              {/* Scanlines Overlay */}
              <div className="absolute inset-0 z-10 scanlines opacity-20 pointer-events-none"></div>
              
              {/* Content */}
              <div className="relative z-0 h-full w-full overflow-hidden flex flex-col uppercase">
                {children}
              </div>
            </div>

          </div>

          {/* Bottom vents / grill */}
          <div className="shrink-0 relative flex items-center justify-end px-4 h-6">
            <div className="absolute left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-red-500 border border-red-800 shadow-[0_0_6px_rgba(239,68,68,0.8)]"></div>
            <div className="flex flex-col gap-0.5 opacity-50">
              <div className="w-16 h-0.5 bg-stone-400 rounded-full"></div>
              <div className="w-16 h-0.5 bg-stone-400 rounded-full"></div>
              <div className="w-16 h-0.5 bg-stone-400 rounded-full"></div>
            </div>
          </div>

        </div>
        </div>
        </div>

        {/* Footer controls */}
        <footer className="absolute inset-x-0 bottom-0 px-3 pt-1 pb-2 grid grid-cols-[auto_1fr_auto] items-center gap-2 bg-dex-red/70">
          <div className="flex justify-start">
            <button
              type="button"
              onClick={onBack}
              disabled={!backEnabled}
              aria-label="Back"
              className={`relative -translate-y-1 w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-b from-stone-700 to-stone-950 border-[3px] border-stone-900 shadow-[inset_0_3px_6px_rgba(255,255,255,0.15),0_8px_12px_rgba(0,0,0,0.6)] transition-transform focus:outline-none hover:translate-x-0 hover:scale-[1.02] active:translate-x-[1px] active:scale-[0.98] ${!backEnabled ? 'pointer-events-none' : ''}`}
            >
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <svg viewBox="0 0 24 24" className="w-10 h-10 text-white" fill="none" stroke="currentColor" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 5L7 12l8 7" />
                </svg>
              </div>
            </button>
          </div>

          <div className="flex justify-center items-center px-1 self-center -translate-y-0.5">
            {footerCenter ? (
              <div className="flex items-center justify-center w-full">
                {footerCenter}
              </div>
            ) : (
              <div className="flex items-center justify-center w-full">
                {defaultFooterDisplay}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            {onHome && (
              <button
                onClick={onHome}
                className="relative -translate-y-1 w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-b from-amber-200 to-amber-500 border-[3px] border-amber-700 shadow-[inset_0_3px_5px_rgba(255,255,255,0.55),0_8px_12px_rgba(0,0,0,0.45)] active:scale-[0.98] active:shadow-[inset_0_4px_7px_rgba(0,0,0,0.45)] overflow-hidden transition-transform"
                aria-label="Home"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/35 via-transparent to-black/25 pointer-events-none"></div>
                <div className="absolute inset-[2px] rounded-full bg-gradient-to-b from-amber-100 to-amber-400 border border-amber-500 flex items-center justify-center shadow-inner">
                  <Home size={36} className="text-amber-900 font-bold" />
                </div>
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
};

export default DeviceLayout;
