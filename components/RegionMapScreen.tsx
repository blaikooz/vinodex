import React, { useState } from 'react';
import DeviceLayout from './DeviceLayout';
import { Search } from 'lucide-react';
import worldlink from '../src/assets/images/world-scan-map.png';

interface RegionMapScreenProps {
  onSelectContinent: (continent: string) => void;
  onSearch: () => void;
  onBack: () => void;
  onHome: () => void;
}

const RegionMapScreen: React.FC<RegionMapScreenProps> = ({ onSelectContinent, onSearch, onBack, onHome }) => {
  const bootLines = [
    '> BOOT SEQUENCE v3.2 INIT...',
    '> ROUTING NEURAL GRID...',
    '> OPTICS CALIBRATION...',
    '> BIOLOCK BYPASS: OK',
    '> AWAITING TARGET INPUT...'
  ];
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [statusLines, setStatusLines] = useState<string[]>(bootLines);
  const [isScanning, setIsScanning] = useState(false);

  const getRegionLabel = (region: string) => {
    const found = regions.find((r) => r.id === region);
    return found?.label ?? region.replace('_', ' ');
  };

  const handleRegionHover = (region: string | null) => {
    setHoveredRegion(region);
    if (isScanning) return;
    if (!region) {
      setStatusLines(bootLines);
      return;
    }
    const label = getRegionLabel(region);
    setStatusLines([
      `> PASSIVE SCAN: ${label}`,
      '> TUNING LONG-RANGE ARRAY...',
      '> RESOLVING GEO-CLOUD NOISE...',
      '> READY FOR TARGET LOCK...'
    ]);
  };

  const handleRegionClick = (region: string) => {
    if (isScanning) return;
    const label = getRegionLabel(region);
    setIsScanning(true);
    setStatusLines([
      `> TARGET LOCKED: ${label}`,
      '> DEPLOYING PROBE DRONES...',
      '> TAPPING SUBSPACE TELEMETRY...',
    ]);
    onSelectContinent(region);
    setIsScanning(false);
  };

  const topRow = [
    { id: 'NORTH_AMERICA', label: 'NORTH AMERICA', left: '15%' },
    { id: 'EUROPE', label: 'EUROPE', left: '49%' },
    { id: 'ASIA', label: 'ASIA', left: '75%' },
  ];
  const bottomRow = [
    { id: 'SOUTH_AMERICA', label: 'SOUTH AMERICA', left: '29%' },
    { id: 'AFRICA', label: 'AFRICA', left: '52%' },
    { id: 'OCEANIA', label: 'OCEANIA', left: '85%' },
  ];
  const regions = [
    ...topRow.map((region) => ({ ...region, top: '43%' })),
    ...bottomRow.map((region) => ({ ...region, top: '63%' })),
  ];

  return (
    <DeviceLayout
      title="WORLD SCAN"
      subtitle="SECTOR SELECT"
      onBack={onBack}
      showBack={true}
      centerHeaderText={true}
      onHome={onHome}
    >
      <div className="relative w-full h-full bg-black overflow-hidden flex flex-col items-center px-0">
        <div className="relative z-20 w-full h-full flex flex-col">
          <div className="flex-1 flex flex-col bg-black border border-green-900/60 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.45)] overflow-hidden">
            <div className="flex-1 flex flex-col bg-black">
              
              {/* Map Area */}
              <div className="relative w-full flex-1 min-h-[200px]">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-green-500/5 pointer-events-none" />
                <img 
                  src={worldlink} 
                  alt="World map" 
                  className="w-full h-full object-contain opacity-90 mix-blend-screen"
                />

                {/* Grid Overlay */}
                <div 
                  className="absolute inset-0 z-20 opacity-30 pointer-events-none"
                  style={{ 
                    backgroundImage: 'linear-gradient(#4ADE80 1px, transparent 1px), linear-gradient(90deg, #4ADE80 1px, transparent 1px)', 
                    backgroundSize: '30px 30px'
                  }}
                />

                {/* Radar Scan Beam Animation */}
                <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden">
                  <style>{`
                    @keyframes scan {
                      0% { left: -20%; }
                      100% { left: 120%; }
                    }
                  `}</style>
                  <div className="absolute top-0 bottom-0 w-[60px] bg-gradient-to-r from-transparent via-green-500/20 to-transparent animate-[scan_4s_linear_infinite] border-r border-green-500/40 blur-[1px]"></div>
                </div>

                {/* Region hotspot buttons */}
                <div className="absolute inset-0">
                  {regions.map((region) => {
                    const isActive = hoveredRegion === region.id;
                    return (
                      <button
                        key={region.id}
                        onClick={() => handleRegionClick(region.id)}
                        onMouseEnter={() => handleRegionHover(region.id)}
                        onMouseLeave={() => handleRegionHover(null)}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-200/60 ${
                          isActive
                            ? 'border border-white/90 bg-green-400/20 shadow-[0_0_30px_rgba(255,255,255,0.35)]'
                            : 'border border-green-300/50 bg-green-400/5 shadow-[0_0_15px_rgba(74,222,128,0.3)] hover:border-white/70 hover:bg-green-400/15'
                        }`}
                        style={{ top: region.top, left: region.left }}
                        aria-label={region.label}
                      >
                        <span className="sr-only">{region.label}</span>
                        <div className="absolute inset-0 rounded-full border border-green-200/30 animate-ping" style={{ animationDuration: '2.8s' }}></div>
                        <div className="absolute inset-2 rounded-full border border-green-200/60 opacity-70" style={{ animationDuration: '2.8s', animationName: 'ping' }}></div>
                      </button>
                    );
                  })}
                </div>

                {/* Scan indicator corners */}
                <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-green-500/50"></div>
                <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-green-500/50"></div>
                <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-green-500/50"></div>
                <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-green-500/50"></div>
              </div>

              {/* Bottom Search Button Area */}
              <div className="border-t border-green-900/60 bg-black/95 px-0 py-4 flex justify-center">
                <button 
                  onClick={onSearch}
                  className="group flex items-center gap-3 px-10 py-3 bg-green-400 text-black border border-green-200 rounded-full hover:bg-green-300 hover:border-white transition-all duration-300 shadow-[0_0_20px_rgba(74,222,128,0.4)]"
                >
                  <Search size={16} className="group-hover:scale-110 transition-transform" />
                  <span className="font-retro tracking-widest text-sm">SEARCH WORLD</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DeviceLayout>
  );
};

export default RegionMapScreen;
