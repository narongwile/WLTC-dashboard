import React from 'react';
import { X, Flame, Zap } from 'lucide-react';
import type { SimulationState } from '../../types';

interface FuelCellDetailProps {
    onClose: () => void;
    simState: SimulationState;
}

const FuelCellDetail: React.FC<FuelCellDetailProps> = ({ onClose, simState }) => {
    // Current Power (kW)
    const power = simState.fcPower;

    // Simulate V-I Curve Data
    // Assume 100kW Stack max
    // Max Current ~ 300A for simplified view
    const maxCurrent = 300;

    // Calculate Current approx from Power
    // P = V * I. V drops as I increases.
    // Let's approximate I = P / 200V (Average stack voltage? say 300V)
    // Simplified: Linear mapping of Power to Current % for visual
    const currentAmp = (power / 85) * maxCurrent; // 85kW max

    // Voltage Model (Simplified Polarization)
    // V_cell = E_ocv - a*log(i) - r*i - m*exp(n*i)
    // Visual approx:
    const voltage = 400 - (currentAmp * 0.5); // Droop

    const xPct = Math.min(100, (currentAmp / maxCurrent) * 100);
    const yPct = Math.min(100, (voltage / 450) * 100);

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in zoom-in-95">
            <div className="bg-[#0f172a] border border-slate-700 w-full max-w-3xl rounded-2xl shadow-2xl p-6 relative">
                <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-white">
                    <X className="w-6 h-6" />
                </button>

                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-500/50">
                        <Flame className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Fuel Cell Stack Monitor</h2>
                        <div className="text-xs text-slate-400">PEMFC • Polarization Dynamics</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* STATS */}
                    <div className="lg:col-span-1 space-y-4">
                        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                            <div className="flex justify-between items-start">
                                <div className="text-xs text-slate-500 mb-1">OUTPUT POWER</div>
                                <Zap className="w-4 h-4 text-blue-500" />
                            </div>
                            <div className="text-2xl font-mono font-bold text-white">{power.toFixed(1)}</div>
                            <div className="text-xs text-slate-400">kW</div>
                        </div>
                        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                            <div className="text-xs text-slate-500 mb-1">STACK VOLTAGE</div>
                            <div className="text-2xl font-mono font-bold text-emerald-400">{voltage.toFixed(0)}</div>
                            <div className="text-xs text-slate-400">V (Simulated)</div>
                        </div>
                        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                            <div className="text-xs text-slate-500 mb-1">CURRENT</div>
                            <div className="text-2xl font-mono font-bold text-amber-400">{currentAmp.toFixed(0)}</div>
                            <div className="text-xs text-slate-400">A</div>
                        </div>
                    </div>

                    {/* V-I CHART */}
                    <div className="lg:col-span-2 bg-slate-800/50 rounded-xl border border-slate-700 p-4 relative min-h-[300px] flex flex-col">
                        <div className="absolute top-2 right-2 text-xs text-slate-500 font-mono">POLARIZATION CURVE (V-I)</div>

                        {/* CHART CONTAINER */}
                        <div className="flex-1 relative border-l border-b border-slate-600 ml-6 mb-6 mt-4">
                            {/* Grid */}
                            <div className="absolute inset-0 opacity-20"
                                style={{ backgroundImage: 'linear-gradient(#94a3b8 1px, transparent 1px), linear-gradient(90deg, #94a3b8 1px, transparent 1px)', backgroundSize: '10% 10%' }}>
                            </div>

                            {/* Curve SVG */}
                            <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none">
                                {/* The 'Knee' Curve */}
                                <path d="M 0,10 Q 10,20 100,80" fill="none" stroke="#60a5fa" strokeWidth="3" vectorEffect="non-scaling-stroke" />
                                {/* Label */}
                                <text x="50%" y="40%" fill="#60a5fa" fontSize="10">Ohmic Region</text>
                            </svg>

                            {/* Live Operating Point */}
                            <div
                                className="absolute w-4 h-4 bg-white rounded-full shadow-[0_0_15px_#3b82f6] transition-all duration-100 ease-linear z-10"
                                style={{
                                    left: `${xPct}%`,
                                    top: `${100 - yPct}%`, // Invert Y for chart
                                    transform: 'translate(-50%, -50%)'
                                }}
                            >
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-blue-600 text-[10px] text-white px-2 py-1 rounded whitespace-nowrap">
                                    {power.toFixed(0)} kW
                                </div>
                            </div>
                        </div>

                        {/* Axis Labels */}
                        <div className="absolute bottom-2 right-4 text-xs text-slate-500 font-bold">CURRENT DENSITY (A/cm²)</div>
                        <div className="absolute top-1/2 left-1 -rotate-90 text-xs text-slate-500 font-bold -translate-y-1/2 -ml-3">VOLTAGE (V)</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FuelCellDetail;
