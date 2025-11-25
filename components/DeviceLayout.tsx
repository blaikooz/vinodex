
import React from 'react';
import { ArrowLeft, Menu, Circle, Home } from 'lucide-react';

interface DeviceLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  onBack?: () => void;
  showBack?: boolean;
  onHome?: () => void;
  hideHeader?: boolean;
}

const DeviceLayout: React.FC<DeviceLayoutProps> = ({ 
  children, 
  title, 
  subtitle, 
  onBack, 
  showBack = false,
  onHome,
  hideHeader = false
}) => {
  return (
    <div className="flex justify-center items-center min-h-screen bg-neutral-900 p-0 md:p-4 font-mono h-screen md:h-auto overflow-hidden">
      {/* Device Chassis - Red Pokedex Style */}
      <div className="w-full h-full md:h-[850px] md:w-[500px] bg-dex-red md:rounded-[2.5rem] md:shadow-[0_20px_50px_rgba(220,10,45,0.3)] overflow-hidden relative flex flex-col border-[8px] border-dex-darkRed ring-1 ring-white/10 shadow-[inset_-10px_-10px_30px_rgba(0,0,0,0.2)]">
        
        {/* Top Hardware Bezel - Compact Version */}
        <div className="shrink-0 h-16 bg-dex-red relative border-b-4 border-dex-darkRed/30 flex items-center justify-center px-4 shadow-md z-20 overflow-hidden">
           
           {/* Left: Blue Lens - Smaller */}
           <div className="absolute left-4 top-1/2 -translate-y-1/2 z-30">
              <div className="w-10 h-10 rounded-full bg-blue-500 border-[3px] border-white flex items-center justify-center relative overflow-hidden shadow-inner">
                  <div className="absolute top-1 left-2 w-3 h-3 bg-white rounded-full opacity-60 blur-[1px]"></div>
                  <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-700 opacity-90"></div>
              </div>
           </div>
           
           {/* Center: Logo Text - Smaller & Centered */}
           <div className="relative z-20 ml-6"> 
              <h1 className="font-retro text-4xl text-white italic tracking-tighter drop-shadow-md transform -skew-x-12 whitespace-nowrap" style={{ textShadow: '2px 2px 0px #89061C' }}>
                VINODEX
              </h1>
           </div>

           {/* Right: Small LEDs - Smaller & Tighter */}
           <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-1 z-30">
             <div className="w-1.5 h-1.5 rounded-full bg-red-600 border border-red-800 shadow-[0_0_2px_rgba(0,0,0,0.5)]"></div>
             <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 border border-yellow-600 shadow-[0_0_2px_rgba(0,0,0,0.5)]"></div>
             <div className="w-1.5 h-1.5 rounded-full bg-green-500 border border-green-700 shadow-[0_0_2px_rgba(0,0,0,0.5)]"></div>
           </div>
        </div>

        {/* Screen Container - Expanded to fill remaining space */}
        <div className="flex-1 min-h-0 bg-dex-ui flex flex-col relative mx-3 mt-1 mb-4 rounded-lg border-4 border-stone-400 shadow-inner p-1">
          
          {/* Inner Screen Bezel */}
          <div className="flex-1 min-h-0 bg-stone-800 rounded border-2 border-stone-600 shadow-inner relative flex flex-col overflow-hidden w-full h-full">
            
            {/* Top Status Bar (Software) - Conditionally Rendered */}
            {!hideHeader && (
              <div className="h-14 bg-dex-red shrink-0 flex justify-between items-center px-4 z-30 border-b-2 border-dex-darkRed shadow-sm">
                <div className="flex items-center w-12">
                  {showBack && (
                    <button onClick={onBack} className="text-white hover:text-yellow-300 transition-colors active:scale-90 p-2 -ml-2">
                      <ArrowLeft size={28} />
                    </button>
                  )}
                </div>
                
                <h1 className="text-white font-retro text-sm sm:text-base uppercase tracking-widest truncate text-center flex-1">
                  {title}
                </h1>
                
                <div className="flex items-center w-12 justify-end">
                  <button onClick={onHome} className="text-white hover:text-yellow-300 transition-colors active:scale-90 p-2 -mr-2">
                      <Home size={26} />
                  </button>
                </div>
              </div>
            )}

            {/* Main LCD Content */}
            <div className="flex-1 min-h-0 bg-dex-screen relative w-full overflow-hidden">
              {/* Scanlines Overlay */}
              <div className="absolute inset-0 z-10 scanlines opacity-20 pointer-events-none"></div>
              
              {/* Content */}
              <div className="relative z-0 h-full w-full overflow-hidden flex flex-col">
                {children}
              </div>
            </div>
            
          </div>
          
          {/* Decorative vents below screen */}
          <div className="flex justify-between items-center mt-2 px-4 h-4 opacity-50 shrink-0">
             <div className="flex gap-2">
               <div className="w-1.5 h-1.5 bg-stone-500 rounded-full"></div>
               <div className="w-1.5 h-1.5 bg-stone-500 rounded-full"></div>
             </div>
             <div className="flex flex-col gap-0.5">
                <div className="w-16 h-0.5 bg-stone-400 rounded-full"></div>
                <div className="w-16 h-0.5 bg-stone-400 rounded-full"></div>
                <div className="w-16 h-0.5 bg-stone-400 rounded-full"></div>
             </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default DeviceLayout;
