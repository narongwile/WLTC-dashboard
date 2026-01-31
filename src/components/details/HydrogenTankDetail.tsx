import React from 'react';
import { X, Cylinder } from 'lucide-react';
import type { SimulationState } from '../../types';

interface HydrogenTankDetailProps {
    onClose: () => void;
    simState: SimulationState;
}

const HydrogenTankDetail: React.FC<HydrogenTankDetailProps> = ({ onClose, simState }) => {
    // 5kg at 700 bar (approx)
    // P = P_max * (Mass / Mass_max) approx for ideal gas at constant temp 
    // (Simulating simplified pressure drop)
    const maxBar = 700;
    const maxMass = 5.0; // kg
    const currentBar = (simState.h2Mass / maxMass) * maxBar;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in zoom-in-95 duration-200">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-xl shadow-2xl p-6 relative">
                <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-white">
                    <X className="w-6 h-6" />
                </button>

                <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
                    <Cylinder className="text-cyan-500" /> Hydrogen Storage
                </h2>

                <div className="flex flex-col items-center mb-6">
                    {/* Tank Graphic */}
                    <div className="relative w-24 h-48 bg-slate-800 rounded-lg border-2 border-slate-600 overflow-hidden mb-4">
                        <div className="absolute inset-x-0 bottom-0 bg-cyan-500/80 transition-all duration-300"
                            style={{ height: `${(simState.h2Mass / maxMass) * 100}%` }}>
                            {/* Bubbles effect would be here */}
                        </div>
                        {/* Tick marks */}
                        <div className="absolute top-1/4 w-full h-px bg-slate-700/50"></div>
                        <div className="absolute top-2/4 w-full h-px bg-slate-700/50"></div>
                        <div className="absolute top-3/4 w-full h-px bg-slate-700/50"></div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 w-full">
                        <div className="bg-slate-800 p-3 rounded-lg text-center">
                            <div className="text-slate-400 text-xs">Pressure</div>
                            <div className="text-xl font-mono text-white font-bold">{currentBar.toFixed(0)} <span className="text-sm">bar</span></div>
                        </div>
                        <div className="bg-slate-800 p-3 rounded-lg text-center">
                            <div className="text-slate-400 text-xs">Mass</div>
                            <div className="text-xl font-mono text-white font-bold">{simState.h2Mass.toFixed(2)} <span className="text-sm">kg</span></div>
                        </div>
                    </div>
                </div>

                <div className="p-3 bg-slate-950 rounded border border-slate-800 text-xs text-slate-400">
                    <div className="flex justify-between mb-1">
                        <span>Tank Type:</span>
                        <span className="text-white">Type IV (Polymer-Lined)</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Capacity:</span>
                        <span className="text-white">5.0 kg H2</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HydrogenTankDetail;
