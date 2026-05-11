import React, { useState } from 'react';
import { Grape, Globe, Leaf, Search, Wine } from 'lucide-react';
import { Icon } from '@iconify/react';
import DeviceLayout from './DeviceLayout';
import DeviceBackPanel from './DeviceBackPanel';
import { EntryCategory } from '../types';

interface MainMenuProps {
  onNavigate: (category: EntryCategory) => void;
  onOpenMoonDial: () => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ onNavigate, onOpenMoonDial }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <DeviceLayout
      title="VINODEX"
      subtitle=""
      showBack={false}
      onHome={() => {}}
      isFlipped={isFlipped}
      onTitleTap={() => setIsFlipped(true)}
      backFace={<DeviceBackPanel onReturn={() => setIsFlipped(false)} />}
    >
      <div className="flex-1 min-h-0 w-full flex flex-col items-center bg-dex-screen relative overflow-hidden">
        
        {/* Retro Grid Background */}
        <div 
          className="absolute inset-0 opacity-10 pointer-events-none" 
          style={{ 
            backgroundImage: 'linear-gradient(rgba(50, 255, 50, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(50, 255, 50, 0.3) 1px, transparent 1px)', 
            backgroundSize: '30px 30px' 
          }} 
        />

        {/* Main Interface Container - Fixed, no scroll */}
        <div className="relative w-full h-full z-10 flex flex-col p-6 gap-6 justify-between">
            
            {/* Top Row */}
            <div className="flex gap-4 w-full flex-1 min-h-0">
                <button 
                  onClick={() => onNavigate('GRAPES')}
                  className="flex-1 bg-purple-500 border-b-[6px] border-purple-800 rounded-xl shadow-lg active:translate-y-1 active:border-b-0 transition-all flex flex-col items-center justify-center group hover:bg-purple-400 relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
                    <Grape size={48} className="text-white mb-2 group-hover:scale-110 transition-transform drop-shadow-md sm:w-16 sm:h-16" />
                    <span className="font-retro text-sm sm:text-xl text-white tracking-widest drop-shadow-md">GRAPES</span>
                </button>
                
                <button 
                  onClick={() => onNavigate('REGIONS')}
                  className="flex-1 bg-green-500 border-b-[6px] border-green-800 rounded-xl shadow-lg active:translate-y-1 active:border-b-0 transition-all flex flex-col items-center justify-center group hover:bg-green-400 relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
                    <Globe size={48} className="text-white mb-2 group-hover:scale-110 transition-transform drop-shadow-md sm:w-16 sm:h-16" />
                    <span className="font-retro text-sm sm:text-xl text-white tracking-widest drop-shadow-md">REGIONS</span>
                </button>
            </div>

            {/* Middle Search Button + Globe Shortcut */}
            <div className="shrink-0 h-24 sm:h-32 flex items-center justify-center gap-3 sm:gap-4">
              <button 
                onClick={() => onNavigate('MASTER_SEARCH')}
                className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-dex-yellow border-[6px] border-yellow-600 shadow-[0_0_25px_rgba(250,204,21,0.4)] flex items-center justify-center active:scale-95 active:border-yellow-700 transition-all relative overflow-hidden group hover:bg-yellow-300 z-10"
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full"></div>
                <Search size={40} className="text-yellow-900 relative z-10 group-hover:scale-110 transition-transform sm:w-16 sm:h-16" />
              </button>

              <button
                onClick={() => onNavigate('RETRO_GLOBE')}
                aria-label="Open regions"
                className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-blue-500 border-[6px] border-blue-800 shadow-[0_0_25px_rgba(42,181,255,0.4)] flex items-center justify-center active:scale-95 active:border-blue-900 transition-all group hover:bg-blue-400"
              >
                <Globe size={40} className="text-white group-hover:scale-110 transition-transform sm:w-16 sm:h-16" />
              </button>

              <button
                onClick={onOpenMoonDial}
                aria-label="Open moon dial"
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-indigo-600 border-[5px] border-indigo-900 shadow-[0_0_20px_rgba(99,102,241,0.45)] flex items-center justify-center active:scale-95 active:border-indigo-950 transition-all group hover:bg-indigo-500"
              >
                <Icon
                  icon="game-icons:moon-orbit"
                  className="text-white group-hover:scale-110 transition-transform"
                  width={32}
                  height={32}
                />
              </button>
            </div>

            {/* Bottom Row */}
            <div className="flex gap-4 w-full flex-1 min-h-0">
                <button 
                  onClick={() => onNavigate('STYLES')}
                  className="flex-1 bg-orange-500 border-b-[6px] border-orange-800 rounded-xl shadow-lg active:translate-y-1 active:border-b-0 transition-all flex flex-col items-center justify-center group hover:bg-orange-400 relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
                    <Wine size={48} className="text-white mb-2 group-hover:scale-110 transition-transform drop-shadow-md sm:w-16 sm:h-16" />
                    <span className="font-retro text-sm sm:text-xl text-white tracking-widest drop-shadow-md">STYLES</span>
                </button>
                
                <button 
                  onClick={() => onNavigate('FLAVORS')}
                  className="flex-1 bg-emerald-500 border-b-[6px] border-emerald-800 rounded-xl shadow-lg active:translate-y-1 active:border-b-0 transition-all flex flex-col items-center justify-center group hover:bg-emerald-400 relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
                    <Leaf size={48} className="text-white mb-2 group-hover:scale-110 transition-transform drop-shadow-md sm:w-16 sm:h-16" />
                    <span className="font-retro text-sm sm:text-xl text-white tracking-widest drop-shadow-md">FLAVORS</span>
                </button>
            </div>

        </div>

      </div>
    </DeviceLayout>
  );
};

export default MainMenu;
