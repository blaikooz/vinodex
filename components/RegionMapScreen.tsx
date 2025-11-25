import React, { useState } from 'react';
import DeviceLayout from './DeviceLayout';
import { Search } from 'lucide-react';

interface RegionMapScreenProps {
  onSelectContinent: (continent: string) => void;
  onSearch: () => void;
  onBack: () => void;
  onHome: () => void;
}

const RegionMapScreen: React.FC<RegionMapScreenProps> = ({ onSelectContinent, onSearch, onBack, onHome }) => {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  const handleRegionClick = (region: string) => {
    onSelectContinent(region);
  };

  // Styling for map paths
  const getRegionStyle = (regionName: string) => {
    const isHovered = hoveredRegion === regionName;
    return {
      fill: isHovered ? '#166534' : '#052e16',
      stroke: isHovered ? '#ffffff' : '#4ADE80',
      strokeWidth: isHovered ? 2 : 1,
      filter: isHovered ? 'drop-shadow(0 0 12px rgba(255,255,255,0.8))' : 'drop-shadow(0 0 4px rgba(74,222,128,0.6))',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    };
  };

  const decorativeStyle = {
    fill: 'none',
    stroke: '#4ADE80',
    strokeWidth: 0.5,
    opacity: 0.3
  };

  return (
    <DeviceLayout
      title="PLANETARY SCAN"
      subtitle="SECTOR SELECT"
      onBack={onBack}
      showBack={true}
      onHome={onHome}
    >
      <div className="relative w-full h-full bg-black overflow-hidden flex flex-col">
        
        {/* Grid Background */}
        <div 
          className="absolute inset-0 z-0 opacity-20 pointer-events-none"
          style={{ 
            backgroundImage: 'linear-gradient(#4ADE80 1px, transparent 1px), linear-gradient(90deg, #4ADE80 1px, transparent 1px)', 
            backgroundSize: '30px 30px'
          }}
        />

        {/* Radar Scan Beam Animation */}
        <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
          <style>{`
            @keyframes scan {
              0% { left: -20%; }
              100% { left: 120%; }
            }
          `}</style>
          <div className="absolute top-0 bottom-0 w-[60px] bg-gradient-to-r from-transparent via-green-500/20 to-transparent animate-[scan_4s_linear_infinite] border-r border-green-500/40 blur-[1px]"></div>
        </div>

        {/* Map Area */}
        <div className="flex-1 flex items-center justify-center relative z-20 p-2">
          <svg viewBox="0 0 1000 500" className="w-full h-full max-w-5xl" preserveAspectRatio="xMidYMid meet">
            
            {/* Latitude/Longitude Grid Lines */}
            <g style={decorativeStyle}>
              {/* Latitude lines */}
              <path d="M 0,125 Q 500,115 1000,125" />
              <path d="M 0,250 L 1000,250" />
              <path d="M 0,375 Q 500,385 1000,375" />
              {/* Longitude lines */}
              <path d="M 200,0 Q 190,250 200,500" />
              <path d="M 400,0 Q 410,250 400,500" />
              <path d="M 600,0 Q 590,250 600,500" />
              <path d="M 800,0 Q 810,250 800,500" />
            </g>

            {/* NORTH AMERICA - Realistic shape */}
            <path 
              d="M 45,95 L 55,85 L 80,75 L 120,65 L 160,60 L 200,55 L 240,50 L 270,55 L 290,65 
                 L 280,80 L 260,90 L 240,85 L 220,95 L 235,110 L 250,105 L 265,115 L 255,130 
                 L 240,140 L 225,135 L 210,145 L 220,160 L 235,170 L 250,165 L 265,175 L 260,190 
                 L 245,200 L 230,210 L 220,225 L 205,235 L 190,240 L 175,235 L 160,240 L 150,255 
                 L 140,265 L 125,260 L 115,250 L 100,245 L 85,240 L 75,225 L 65,210 L 55,195 
                 L 50,175 L 45,155 L 40,135 L 35,115 L 40,100 Z
                 M 95,65 L 110,55 L 130,50 L 150,45 L 170,55 L 155,65 L 135,70 L 115,70 Z"
              style={getRegionStyle('NORTH_AMERICA')}
              onClick={() => handleRegionClick('NORTH_AMERICA')}
              onMouseEnter={() => setHoveredRegion('NORTH_AMERICA')}
              onMouseLeave={() => setHoveredRegion(null)}
            />

            {/* Greenland - decorative */}
            <path 
              d="M 295,45 L 330,35 L 365,40 L 380,55 L 370,75 L 345,85 L 315,80 L 295,65 Z"
              style={decorativeStyle}
            />

            {/* SOUTH AMERICA - Realistic shape */}
            <path 
              d="M 175,275 L 190,270 L 210,265 L 230,270 L 250,280 L 265,295 L 275,315 
                 L 280,340 L 275,365 L 265,390 L 250,410 L 235,425 L 220,440 L 200,445 
                 L 185,440 L 175,420 L 170,395 L 175,370 L 180,345 L 175,320 L 165,295 
                 L 160,280 Z"
              style={getRegionStyle('SOUTH_AMERICA')}
              onClick={() => handleRegionClick('SOUTH_AMERICA')}
              onMouseEnter={() => setHoveredRegion('SOUTH_AMERICA')}
              onMouseLeave={() => setHoveredRegion(null)}
            />

            {/* EUROPE - Realistic shape */}
            <path 
              d="M 430,55 L 450,50 L 475,55 L 495,60 L 515,55 L 535,60 L 555,75 L 565,90 
                 L 555,105 L 540,115 L 520,120 L 505,130 L 490,140 L 475,145 L 460,140 
                 L 450,130 L 440,115 L 435,100 L 425,85 L 420,70 Z
                 M 395,90 L 410,80 L 425,85 L 420,100 L 405,105 L 390,100 Z
                 M 455,145 L 470,150 L 480,165 L 470,175 L 455,170 L 450,155 Z"
              style={getRegionStyle('EUROPE')}
              onClick={() => handleRegionClick('EUROPE')}
              onMouseEnter={() => setHoveredRegion('EUROPE')}
              onMouseLeave={() => setHoveredRegion(null)}
            />

            {/* Iceland - decorative */}
            <path 
              d="M 385,55 L 400,50 L 415,55 L 410,70 L 395,75 L 385,65 Z"
              style={decorativeStyle}
            />

            {/* UK - decorative */}
            <path 
              d="M 415,95 L 425,90 L 435,95 L 432,110 L 420,115 L 412,105 Z"
              style={decorativeStyle}
            />

            {/* AFRICA - Realistic shape */}
            <path 
              d="M 435,165 L 460,160 L 490,165 L 520,175 L 545,190 L 560,210 L 570,235 
                 L 575,265 L 570,295 L 560,325 L 545,350 L 525,375 L 500,395 L 475,405 
                 L 450,400 L 430,385 L 420,360 L 425,330 L 435,300 L 445,275 L 445,250 
                 L 440,225 L 430,200 L 425,180 Z
                 M 555,200 L 575,190 L 590,200 L 585,220 L 565,225 L 555,215 Z"
              style={getRegionStyle('AFRICA')}
              onClick={() => handleRegionClick('AFRICA')}
              onMouseEnter={() => setHoveredRegion('AFRICA')}
              onMouseLeave={() => setHoveredRegion(null)}
            />

            {/* ASIA - Decorative outline (not clickable wine region) */}
            <path 
              d="M 565,60 L 600,50 L 650,45 L 700,50 L 750,60 L 800,55 L 850,65 L 890,80 
                 L 920,100 L 940,130 L 950,165 L 945,200 L 930,230 L 905,255 L 875,275 
                 L 840,285 L 800,280 L 760,270 L 720,275 L 680,290 L 640,280 L 610,260 
                 L 585,235 L 570,205 L 560,175 L 555,145 L 555,115 L 560,85 Z
                 M 705,165 L 730,155 L 760,160 L 785,175 L 800,200 L 790,225 L 765,235 
                 L 735,230 L 710,210 L 700,185 Z"
              style={{
                fill: 'none',
                stroke: '#4ADE80',
                strokeWidth: 1,
                opacity: 0.35,
                strokeDasharray: '4,2'
              }}
            />
            <text x="720" y="150" fill="#4ADE80" fontSize="10" opacity="0.4" fontFamily="monospace">RESTRICTED</text>

            {/* Japan - decorative */}
            <path 
              d="M 895,130 L 910,120 L 920,130 L 925,150 L 915,170 L 900,175 L 890,160 L 895,145 Z"
              style={decorativeStyle}
            />

            {/* OCEANIA / Australia - Realistic shape */}
            <path 
              d="M 760,320 L 800,310 L 840,315 L 875,330 L 900,355 L 910,385 L 900,415 
                 L 875,435 L 840,445 L 800,440 L 765,425 L 745,400 L 740,370 L 745,340 Z
                 M 920,390 L 940,385 L 955,400 L 960,420 L 950,440 L 930,445 L 915,430 L 915,410 Z"
              style={getRegionStyle('OCEANIA')}
              onClick={() => handleRegionClick('OCEANIA')}
              onMouseEnter={() => setHoveredRegion('OCEANIA')}
              onMouseLeave={() => setHoveredRegion(null)}
            />

            {/* Indonesia Islands - decorative */}
            <path 
              d="M 700,300 L 720,295 L 740,300 L 735,315 L 715,320 L 700,315 Z"
              style={decorativeStyle}
            />
            <path 
              d="M 745,305 L 765,300 L 780,310 L 775,325 L 755,330 L 745,320 Z"
              style={decorativeStyle}
            />

            {/* Philippines - decorative */}
            <path 
              d="M 850,260 L 865,250 L 880,260 L 875,280 L 860,290 L 845,280 Z"
              style={decorativeStyle}
            />

            {/* Antarctica hint - decorative */}
            <path 
              d="M 100,480 Q 300,470 500,475 Q 700,470 900,480"
              style={{
                fill: 'none',
                stroke: '#4ADE80',
                strokeWidth: 0.5,
                opacity: 0.2,
                strokeDasharray: '8,4'
              }}
            />

            {/* Region Labels */}
            <g className="pointer-events-none" style={{ fontFamily: 'monospace', fontSize: '9px', fill: '#4ADE80', opacity: 0.7 }}>
              <text x="130" y="150">N.AMERICA</text>
              <text x="195" y="350">S.AMERICA</text>
              <text x="470" y="100">EUROPE</text>
              <text x="475" y="290">AFRICA</text>
              <text x="800" y="375">OCEANIA</text>
            </g>

            {/* Coordinate markers */}
            <g style={{ fill: '#4ADE80', opacity: 0.4, fontFamily: 'monospace', fontSize: '8px' }}>
              <text x="5" y="130">60°N</text>
              <text x="5" y="255">EQ</text>
              <text x="5" y="380">60°S</text>
              <text x="195" y="495">90°W</text>
              <text x="495" y="495">0°</text>
              <text x="795" y="495">90°E</text>
            </g>

          </svg>
             
          {/* Hover Label Overlay */}
          {hoveredRegion && (
            <div className="absolute top-4 left-4 pointer-events-none">
              <div className="bg-black/95 border border-green-500 px-4 py-2 text-green-400 font-mono text-lg shadow-[0_0_20px_rgba(74,222,128,0.5)]">
                <div className="text-xs text-green-600 mb-1">TARGET LOCKED</div>
                <div className="animate-pulse tracking-wider">{hoveredRegion.replace('_', ' ')}</div>
              </div>
              <div className="flex gap-1 mt-1">
                <div className="h-[2px] w-8 bg-green-500"></div>
                <div className="h-[2px] w-4 bg-green-500/50"></div>
                <div className="h-[2px] w-2 bg-green-500/25"></div>
              </div>
            </div>
          )}

          {/* Scan indicator corners */}
          <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-green-500/50"></div>
          <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-green-500/50"></div>
          <div className="absolute bottom-16 left-2 w-8 h-8 border-b-2 border-l-2 border-green-500/50"></div>
          <div className="absolute bottom-16 right-2 w-8 h-8 border-b-2 border-r-2 border-green-500/50"></div>
        </div>

        {/* Bottom Search Button Area */}
        <div className="p-4 border-t border-green-900/50 bg-black/80 relative z-30 flex justify-center">
          <button 
            onClick={onSearch}
            className="group flex items-center gap-3 px-8 py-3 bg-green-900/10 border border-green-600 rounded-full hover:bg-green-500 hover:text-black hover:border-green-400 transition-all duration-300 hover:shadow-[0_0_15px_rgba(74,222,128,0.6)]"
          >
            <Search size={16} className="group-hover:scale-110 transition-transform" />
            <span className="font-retro tracking-widest text-sm">SEARCH DATABASE</span>
          </button>
        </div>

      </div>
    </DeviceLayout>
  );
};

export default RegionMapScreen;
