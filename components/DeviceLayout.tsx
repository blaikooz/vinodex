
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
  footerCenter
}) => {

  const topTitle = showBack ? title : "VINODEX";
  const backEnabled = showBack && !!onBack;
  const headerTitleSize = topTitle === 'VINODEX'
    ? 'text-[1.625rem] md:text-[2.125rem]'
    : 'text-[1.21875rem] md:text-[1.59375rem]';
  const headerAlignment = 'items-end text-right';

  return (
    <div className="flex justify-center items-center min-h-screen bg-neutral-900 p-0 md:p-4 font-mono h-screen md:h-auto overflow-hidden rounded-[2rem]">
      {/* Device Chassis - Red Pokedex Style */}
      <div className="w-full h-full md:h-[850px] md:w-[498px] bg-dex-red md:rounded-[2.5rem] md:shadow-[0_20px_50px_rgba(220,10,45,0.3)] overflow-hidden relative flex flex-col border-[8px] border-dex-darkRed ring-1 ring-white/10 shadow-[inset_-10px_-10px_30px_rgba(0,0,0,0.2)]">
        
        {/* Screen Container - Expanded to fill remaining space */}
        <div className="flex-1 min-h-0 bg-dex-ui flex flex-col relative m-3 rounded-[2rem] border-4 border-stone-400 shadow-inner p-1">
          
          {/* Inner Screen Bezel */}
          <div className="flex-1 min-h-0 bg-stone-800 rounded-[1.75rem] border-2 border-stone-600 shadow-inner relative flex flex-col overflow-hidden w-full h-full">
            
            {/* Main LCD Content */}
            <div className="flex-1 min-h-0 bg-dex-screen relative w-full overflow-hidden flex flex-col">
              {/* Scanlines Overlay */}
              <div className="absolute inset-0 z-10 scanlines opacity-20 pointer-events-none"></div>
              
              {/* On-screen header */}
              {!hideHeader && (
                <div className="relative z-20 shrink-0 h-16 bg-dex-red border-b-2 border-dex-darkRed shadow-sm flex items-center px-3 pr-5 justify-between">
                  <div className="relative flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500 border-[3px] border-white flex items-center justify-center relative overflow-hidden shadow-inner">
                      <div className="absolute top-1 left-2 w-3 h-3 bg-white rounded-full opacity-60 blur-[1px]"></div>
                      <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-700 opacity-90"></div>
                    </div>
                    <div className="flex flex-col gap-1 mt-1">
                      <div className="w-2 h-2 rounded-full bg-red-600 border border-red-800 shadow-[0_0_3px_rgba(0,0,0,0.5)]"></div>
                      <div className="w-2 h-2 rounded-full bg-yellow-400 border border-yellow-600 shadow-[0_0_3px_rgba(0,0,0,0.5)]"></div>
                      <div className="w-2 h-2 rounded-full bg-green-500 border border-green-700 shadow-[0_0_3px_rgba(0,0,0,0.5)]"></div>
                    </div>
                  </div>
                  <div className={`flex-1 flex flex-col justify-center min-w-0 gap-[1px] ${headerAlignment}`}>
                    <h1
                      className={`font-retro ${headerTitleSize} text-white italic tracking-tighter drop-shadow-md transform -skew-x-12 whitespace-nowrap mb-0 leading-tight`}
                      style={{ textShadow: '2px 2px 0px #89061C' }}
                    >
                      {topTitle}
                    </h1>
                  </div>
                </div>
              )}

              {/* Content */}
              <div className="relative z-0 h-full w-full overflow-hidden flex flex-col uppercase">
                {children}
              </div>
            </div>

          </div>

          {/* Decorative vents in white bezel */}
          <div className="relative flex items-center justify-between mt-2 px-4 h-4 opacity-50 shrink-0">
            <div className="flex gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 border border-red-800 shadow-[0_0_6px_rgba(239,68,68,0.8)]"></span>
              <span className="w-2 h-2 rounded-full bg-blue-500 border border-blue-800 shadow-[0_0_6px_rgba(59,130,246,0.8)]"></span>
            </div>
            <div className="flex flex-col gap-0.5">
              <div className="w-16 h-0.5 bg-stone-400 rounded-full"></div>
              <div className="w-16 h-0.5 bg-stone-400 rounded-full"></div>
              <div className="w-16 h-0.5 bg-stone-400 rounded-full"></div>
            </div>
          </div>

        </div>

        {/* Footer controls */}
        <footer className="shrink-0 px-3 py-2 grid grid-cols-[auto_1fr_auto] items-center gap-3 bg-dex-red/70">
          <div className="flex justify-start">
            <button
              type="button"
              onClick={onBack}
              disabled={!backEnabled}
              aria-label="Back"
              className={`relative -translate-y-2 w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-b from-stone-700 to-stone-950 border-[3px] border-stone-900 shadow-[inset_0_3px_6px_rgba(255,255,255,0.15),0_8px_12px_rgba(0,0,0,0.6)] transition-transform focus:outline-none ${backEnabled ? 'hover:translate-x-0 hover:scale-[1.02] active:translate-x-[1px] active:scale-[0.98]' : 'opacity-40 pointer-events-none'}`}
            >
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 5L7 12l8 7" />
                </svg>
              </div>
            </button>
          </div>

          <div className="flex justify-center items-center px-1">
            {footerCenter ? (
              <div className="flex items-center justify-center w-full">
                {footerCenter}
              </div>
            ) : (
              <div className="flex-1" />
            )}
          </div>

          <div className="flex justify-end">
            {onHome && (
              <button
                onClick={onHome}
                className="relative -translate-y-2 w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-b from-amber-200 to-amber-500 border-[3px] border-amber-700 shadow-[inset_0_3px_5px_rgba(255,255,255,0.55),0_8px_12px_rgba(0,0,0,0.45)] active:scale-[0.98] active:shadow-[inset_0_4px_7px_rgba(0,0,0,0.45)] overflow-hidden transition-transform"
                aria-label="Home"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/35 via-transparent to-black/25 pointer-events-none"></div>
                <div className="absolute inset-[4px] rounded-full bg-gradient-to-b from-amber-100 to-amber-400 border border-amber-500 flex items-center justify-center shadow-inner">
                  <Home size={20} className="text-amber-900" />
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
