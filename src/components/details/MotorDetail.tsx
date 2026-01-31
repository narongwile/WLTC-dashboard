import React, { useState, useEffect } from 'react';
import { X, Zap, Brain } from 'lucide-react';
import type { SimulationState, VehicleParams, ForceData } from '../../types';

interface MotorDetailProps {
    onClose: () => void;
    simState: SimulationState;
    forces: ForceData;
    params: VehicleParams;
}

const MotorDetail: React.FC<MotorDetailProps> = ({ onClose, simState, forces, params }) => {
    const [view, setView] = useState<'efficiency' | 'ml'>('efficiency');

    // Physics
    const wheelRPM = (simState.velocity / (Math.PI * params.wheelDiameter)) * 60;
    const motorRPM = wheelRPM * params.gearRatio;
    const safeRPM = Math.max(1, Math.abs(motorRPM));
    const torque = (Math.abs(forces.power) * 9550) / safeRPM;

    // ML Simulation State
    // Simulate a "Predicted Temperature" that lags slightly behind torque (thermal mass)
    const [predTemp, setPredTemp] = useState(40);
    // Move pred temp towards target based on torque
    const targetTemp = 40 + (Math.pow(torque / 100, 2) * 20); // Fake model

    useEffect(() => {
        const interval = setInterval(() => {
            setPredTemp(curr => curr + (targetTemp - curr) * 0.05);
        }, 100);
        return () => clearInterval(interval);
    }, [targetTemp]);

    // MAP Scales
    const MAX_RPM = 15000;
    const MAX_TORQUE = 400;
    const xPct = Math.min(100, (Math.abs(motorRPM) / MAX_RPM) * 100);
    const yPct = Math.min(100, (torque / MAX_TORQUE) * 100);

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in zoom-in-95">
            <div className="bg-[#0f172a] border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl p-6 relative">
                <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-white">
                    <X className="w-6 h-6" />
                </button>

                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/20 rounded-lg border border-indigo-500/50">
                            <Zap className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Electric Motor Analysis</h2>
                            <div className="text-xs text-slate-400">Induction Motor • 150kW Peak</div>
                        </div>
                    </div>
                    {/* View Switcher */}
                    <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
                        <button onClick={() => setView('efficiency')} className={`px-3 py-1 text-xs font-bold rounded ${view === 'efficiency' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Map</button>
                        <button onClick={() => setView('ml')} className={`px-3 py-1 text-xs font-bold rounded ${view === 'ml' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>ML Model</button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* STATS */}
                    <div className="lg:col-span-1 space-y-4">
                        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                            <div className="text-xs text-slate-500 mb-1">SPEED</div>
                            <div className="text-2xl font-mono font-bold text-white">{motorRPM.toFixed(0)}</div>
                            <div className="text-xs text-slate-400">RPM</div>
                        </div>
                        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                            <div className="text-xs text-slate-500 mb-1">TORQUE</div>
                            <div className="text-2xl font-mono font-bold text-emerald-400">{torque.toFixed(1)}</div>
                            <div className="text-xs text-slate-400">Nm</div>
                        </div>
                        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                            <div className="text-xs text-slate-500 mb-1">PRED. TEMP (ML)</div>
                            <div className="text-2xl font-mono font-bold text-rose-400">{predTemp.toFixed(1)}°C</div>
                            <div className="text-xs text-slate-400">Values inferred by Neural Net</div>
                        </div>
                    </div>

                    {/* MAIN VISUALIZATION */}
                    <div className="lg:col-span-2 bg-slate-800/50 rounded-xl border border-slate-700 p-4 relative min-h-[300px] flex flex-col">

                        {view === 'efficiency' ? (
                            <>
                                <div className="absolute top-2 right-2 text-xs text-slate-500 font-mono">EFFICIENCY MAP</div>
                                <div className="flex-1 relative border-l border-b border-slate-600 ml-6 mb-6 mt-4">
                                    <div className="absolute inset-0 opacity-20"
                                        style={{ backgroundImage: 'linear-gradient(#94a3b8 1px, transparent 1px), linear-gradient(90deg, #94a3b8 1px, transparent 1px)', backgroundSize: '20% 20%' }} />
                                    <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none">
                                        <ellipse cx="40%" cy="40%" rx="30%" ry="25%" fill="#10b981" fillOpacity="0.1" stroke="#10b981" strokeDasharray="4 4" />
                                        <text x="40%" y="40%" fill="#10b981" fontSize="10" textAnchor="middle">95%</text>
                                        <ellipse cx="45%" cy="45%" rx="50%" ry="45%" fill="none" stroke="#3b82f6" strokeWidth="1" strokeDasharray="2 2" />
                                        <text x="70%" y="20%" fill="#3b82f6" fontSize="10">90%</text>
                                    </svg>
                                    <div
                                        className="absolute w-3 h-3 bg-white rounded-full shadow-[0_0_10px_white] transition-all duration-75 ease-linear z-10"
                                        style={{ left: `${xPct}%`, bottom: `${yPct}%`, transform: 'translate(-50%, 50%)' }}
                                    ></div>
                                </div>
                                <div className="absolute bottom-2 right-4 text-xs text-slate-500 font-bold">SPEED (RPM)</div>
                                <div className="absolute top-1/2 left-1 -rotate-90 text-xs text-slate-500 font-bold -translate-y-1/2 -ml-3">TORQUE (Nm)</div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full">
                                <div className="flex items-center gap-2 mb-4 text-purple-400">
                                    <Brain className="w-5 h-5" />
                                    <span className="font-bold text-sm">ML THERMAL PREDICTOR</span>
                                </div>

                                {/* NEURAL NET VISUAL */}
                                <div className="flex items-center gap-8 relative">
                                    {/* Inputs */}
                                    <div className="space-y-4">
                                        <div className="w-20 p-2 bg-slate-900 border border-slate-600 rounded text-center text-[10px] text-slate-300">RPM<br />{motorRPM.toFixed(0)}</div>
                                        <div className="w-20 p-2 bg-slate-900 border border-slate-600 rounded text-center text-[10px] text-slate-300">Torque<br />{torque.toFixed(0)}</div>
                                        <div className="w-20 p-2 bg-slate-900 border border-slate-600 rounded text-center text-[10px] text-slate-300">Amb Temp<br />25°C</div>
                                    </div>

                                    {/* Connections (Animated SVG) */}
                                    <div className="w-32 h-40 relative">
                                        <svg className="absolute inset-0 w-full h-full">
                                            {/* Layer 1 to Layer 2 */}
                                            <line x1="0" y1="20%" x2="50%" y2="20%" stroke="#4f46e5" strokeOpacity="0.5" className="animate-pulse" />
                                            <line x1="0" y1="20%" x2="50%" y2="50%" stroke="#4f46e5" strokeOpacity="0.5" />
                                            <line x1="0" y1="50%" x2="50%" y2="50%" stroke="#4f46e5" strokeOpacity="0.5" className="animate-pulse" />
                                            <line x1="0" y1="80%" x2="50%" y2="80%" stroke="#4f46e5" strokeOpacity="0.5" />

                                            {/* Layer 2 to Output */}
                                            <line x1="50%" y1="20%" x2="100%" y2="50%" stroke="#4f46e5" strokeOpacity="0.5" />
                                            <line x1="50%" y1="50%" x2="100%" y2="50%" stroke="#4f46e5" strokeOpacity="1" strokeWidth="2" className="animate-pulse" />
                                            <line x1="50%" y1="80%" x2="100%" y2="50%" stroke="#4f46e5" strokeOpacity="0.5" />

                                            {/* Nodes */}
                                            <circle cx="50%" cy="20%" r="4" fill="#6366f1" />
                                            <circle cx="50%" cy="50%" r="4" fill="#6366f1" />
                                            <circle cx="50%" cy="80%" r="4" fill="#6366f1" />
                                        </svg>
                                    </div>

                                    {/* Output */}
                                    <div className="w-24 p-2 bg-purple-900/50 border border-purple-500 rounded text-center">
                                        <div className="text-[10px] text-purple-300 mb-1">ROTOR TEMP</div>
                                        <div className="text-xl font-bold text-white">{predTemp.toFixed(1)}°C</div>
                                    </div>
                                </div>

                                <div className="mt-8 w-full max-w-sm">
                                    <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                                        <span>Inference Confidence</span>
                                        <span>98.2%</span>
                                    </div>
                                    <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 w-[98%]"></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MotorDetail;
