import React from 'react';
import { X, Thermometer, Flame } from 'lucide-react';
import { Pairing } from '../types';

interface PairingModalProps {
  pairing: Pairing | null;
  onClose: () => void;
}

const PairingModal: React.FC<PairingModalProps> = ({ pairing, onClose }) => {
  if (!pairing) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-[#FEF7ED] border-4 border-[#292524] rounded-xl overflow-hidden shadow-2xl transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#292524] p-4 flex justify-between items-center border-b-4 border-[#44403C]">
          <div>
            <h2 className="text-[#FEF7ED] font-mono font-bold text-lg">{pairing.code}</h2>
            <p className="text-[#A8A29E] font-mono text-xs">{pairing.category} PAIRING</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-[#44403C] rounded hover:bg-[#57534E] transition-colors"
          >
            <X size={20} color="#FEF7ED" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          <h3 className="text-xl font-bold font-mono text-[#292524] mb-4 border-b-2 border-dashed border-[#A8A29E] pb-2">
            {pairing.name}
          </h3>

          <div className="grid grid-cols-2 gap-4 mb-6">
             <div className="bg-stone-200 p-3 rounded border border-stone-300">
                <p className="text-xs text-stone-500 font-mono mb-1">COMPATIBILITY</p>
                <p className="font-bold text-stone-800 font-mono">{pairing.compatibility}</p>
             </div>
             <div className="bg-stone-200 p-3 rounded border border-stone-300">
                <p className="text-xs text-stone-500 font-mono mb-1">INTENSITY</p>
                <div className="flex items-center gap-1">
                  <Flame size={14} className={pairing.intensity === 'HIGH' ? 'text-red-600' : 'text-orange-500'} />
                  <p className="font-bold text-stone-800 font-mono">{pairing.intensity}</p>
                </div>
             </div>
          </div>

          <div className="space-y-4 font-mono text-sm">
            <div>
              <p className="text-[#57534E] mb-1 font-bold">THE SCIENCE</p>
              <p className="text-[#292524] bg-[#292524]/5 p-3 rounded-md border-l-4" style={{ borderColor: pairing.color }}>
                {pairing.reasoning}
              </p>
            </div>

            <div className="flex items-start gap-3 mt-4">
              <div className="mt-1">
                <Thermometer size={16} className="text-stone-600" />
              </div>
              <div>
                <p className="text-[#57534E] font-bold text-xs">SERVING TEMP</p>
                <p className="text-[#292524]">{pairing.servingTemp}</p>
              </div>
            </div>

            <div>
              <p className="text-[#57534E] mb-2 font-bold mt-4">CLASSIC EXAMPLES</p>
              <ul className="space-y-2">
                {pairing.examples.map((ex, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-[#292524]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#292524]"></span>
                    {ex}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#F5F5F4] border-t border-[#E7E5E4] flex justify-end">
           <button 
             onClick={onClose}
             className="px-6 py-2 bg-[#DC2626] text-white font-mono font-bold rounded shadow-sm hover:bg-[#B91C1C] active:translate-y-0.5 transition-all"
           >
             CLOSE FILE
           </button>
        </div>
      </div>
    </div>
  );
};

export default PairingModal;