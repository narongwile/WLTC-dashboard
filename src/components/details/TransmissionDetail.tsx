import React, { useState } from 'react';
import { X, Settings, Activity, RotateCw } from 'lucide-react';
import type { SimulationState, VehicleParams, ForceData } from '../../types';

interface TransmissionDetailProps {
    onClose: () => void;
    simState: SimulationState;
    params: VehicleParams;
    forces: ForceData;
    onUpdateParams: (newParams: Partial<VehicleParams>) => void;
}

const TransmissionDetail: React.FC<TransmissionDetailProps> = ({ onClose, simState, params, forces, onUpdateParams }) => {
    // Local State for Differential Simulation
    const [steering, setSteering] = useState(0); // -1 (Left) to +1 (Right)

    // Physics Calculations
    const wheelRPM = (simState.velocity / (Math.PI * params.wheelDiameter)) * 60;
    const motorRPM = wheelRPM * params.gearRatio;

    // Differential Logic (Simplified)
    // If turning, outer wheel spins faster.
    // RPM_diff = Base * (1 +/- steerFactor)
    const steerFactor = 0.3; // Max 30% speed difference
    const leftRPM = wheelRPM * (1 + (steering * steerFactor));
    const rightRPM = wheelRPM * (1 - (steering * steerFactor));

    // Torque flows opposite to speed in open diff? 
    // In ideal open diff, Torque is equal (50/50). Speed varies.
    const motorTorque = (Math.abs(forces.power) * 1000 * 60) / (2 * Math.PI * Math.max(1, Math.abs(motorRPM)));
    const axleTorqueTotal = motorTorque * params.gearRatio * 0.98;
    const torqueSplit = axleTorqueTotal / 2;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in zoom-in-95 duration-200">
            <div className="bg-[#0f172a] border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl p-8 relative overflow-hidden">
                <button onClick={onClose} className="absolute right-6 top-6 text-slate-400 hover:text-white transition-colors">
                    <X className="w-8 h-8" />
                </button>

                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-blue-600/20 rounded-xl border border-blue-500/50">
                        <Settings className="w-8 h-8 text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">Transmission & Differential</h2>
                        <div className="text-sm text-slate-400 font-mono">Real-time Driveline Mechanics</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* LEFT: Controls & Input */}
                    <div className="col-span-12 lg:col-span-4 space-y-6">
                        {/* Gear Ratio Slider */}
                        <div className="bg-slate-900 border border-slate-700 p-5 rounded-xl">
                            <h3 className="text-sm font-bold text-slate-400 mb-4 flex justify-between">
                                GEAR RATIO
                                <span className="text-blue-400 font-mono">{params.gearRatio.toFixed(1)}:1</span>
                            </h3>
                            <input
                                type="range" min="1" max="20" step="0.1"
                                value={params.gearRatio}
                                onChange={(e) => onUpdateParams({ gearRatio: parseFloat(e.target.value) })}
                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                            <div className="flex justify-between text-xs text-slate-500 mt-2">
                                <span>Speed (1:1)</span>
                                <span>Torque (20:1)</span>
                            </div>
                        </div>

                        {/* Steering Slider for Diff */}
                        <div className="bg-slate-900 border border-slate-700 p-5 rounded-xl">
                            <h3 className="text-sm font-bold text-slate-400 mb-4 flex justify-between">
                                DIFFERENTIAL SIM (STEER)
                                <span className="text-emerald-400 font-mono">
                                    {steering === 0 ? 'STRAIGHT' : steering < 0 ? `LEFT ${(Math.abs(steering) * 100).toFixed(0)}%` : `RIGHT ${(steering * 100).toFixed(0)}%`}
                                </span>
                            </h3>
                            <input
                                type="range" min="-1" max="1" step="0.1"
                                value={steering}
                                onChange={(e) => setSteering(parseFloat(e.target.value))}
                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                            />
                            <div className="flex justify-between text-xs text-slate-500 mt-2">
                                <span>Turn Left</span>
                                <span>Turn Right</span>
                            </div>
                        </div>

                        {/* Motor Input Stat */}
                        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Activity className="text-amber-500" />
                                <div>
                                    <div className="text-xs text-slate-500">INPUT TORQUE</div>
                                    <div className="text-xl font-bold text-white font-mono">{motorTorque.toFixed(1)} Nm</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-slate-500">MOTOR SPEED</div>
                                <div className="text-xl font-bold text-blue-400 font-mono">{motorRPM.toFixed(0)} <span className="text-sm">RPM</span></div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Visualization */}
                    <div className="col-span-12 lg:col-span-8 bg-slate-950/50 rounded-2xl border border-slate-800 p-6 flex flex-col items-center justify-center relative min-h-[400px]">
                        {/* Background Grid */}
                        <div className="absolute inset-0 opacity-10"
                            style={{ backgroundImage: 'radial-gradient(#475569 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

                        {/* SYSTEM DIAGRAM */}
                        <div className="relative w-full max-w-lg flex flex-col items-center gap-2">

                            {/* 1. Drive Shaft (Vertical) */}
                            <div className="w-4 h-24 bg-gradient-to-b from-slate-600 to-slate-800 rounded mx-auto relative overflow-hidden">
                                {/* Spinning texture */}
                                <div className="absolute inset-0 w-full h-full opacity-30 animate-[slideDown_0.2s_linear_infinite]"
                                    style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 5px, rgba(255,255,255,0.5) 5px, rgba(255,255,255,0.5) 6px)', animationDuration: `${Math.max(0.05, 500 / Math.max(1, motorRPM))}s` }}></div>
                            </div>

                            {/* 2. Differential Housing (Circle) */}
                            <div className="w-32 h-32 rounded-full bg-slate-800 border-4 border-slate-600 flex items-center justify-center relative shadow-2xl z-10">
                                <div className="w-24 h-24 rounded-full border-2 border-dashed border-slate-500 animate-[spin_4s_linear_infinite]"
                                    style={{ animationDuration: `${Math.max(0.1, 60000 / (wheelRPM * 360))}s` }}>
                                </div>
                                <div className="absolute text-center bg-slate-900 px-2 py-1 rounded border border-slate-700">
                                    <div className="text-[10px] text-slate-400">DIFF RATIO</div>
                                    <div className="font-bold text-white font-mono">{params.gearRatio}:1</div>
                                </div>
                            </div>

                            {/* 3. Axles (Horizontal) */}
                            <div className="flex w-full items-center justify-center -mt-16 z-0">
                                {/* Left Half-Shaft */}
                                <div className="h-6 flex-1 bg-gradient-to-r from-slate-600 to-slate-800 mr-16 rounded-l relative overflow-hidden">
                                    <div className="absolute inset-0 opacity-30"
                                        style={{
                                            backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(255,255,255,0.5) 10px, rgba(255,255,255,0.5) 12px)',
                                            animation: `slideLeft ${Math.max(0.05, 100 / Math.max(1, leftRPM))}s linear infinite`
                                        }}></div>
                                </div>

                                {/* Right Half-Shaft */}
                                <div className="h-6 flex-1 bg-gradient-to-r from-slate-800 to-slate-600 ml-16 rounded-r relative overflow-hidden">
                                    <div className="absolute inset-0 opacity-30"
                                        style={{
                                            backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(255,255,255,0.5) 10px, rgba(255,255,255,0.5) 12px)',
                                            animation: `slideRight ${Math.max(0.05, 100 / Math.max(1, rightRPM))}s linear infinite`
                                        }}></div>
                                </div>
                            </div>

                            {/* 4. Wheels */}
                            <div className="flex w-full justify-between -mt-8 px-4 z-20">
                                {/* Left Wheel */}
                                <div className={`flex flex-col items-center gap-2 ${steering < -0.1 ? 'scale-110' : 'opacity-80'}`}>
                                    <RotateCw className="w-12 h-12 text-emerald-500 animate-spin" style={{ animationDuration: `${Math.max(0.1, 5 / (leftRPM / 60))}s` }} />
                                    <div className="bg-slate-900 border border-emerald-500/50 p-2 rounded text-center min-w-[100px]">
                                        <div className="text-[10px] text-slate-400">LEFT RPM</div>
                                        <div className="font-bold text-white font-mono">{leftRPM.toFixed(0)}</div>
                                        <div className="text-[10px] text-emerald-400 mt-1">{(torqueSplit).toFixed(0)} Nm</div>
                                    </div>
                                </div>

                                {/* Right Wheel */}
                                <div className={`flex flex-col items-center gap-2 ${steering > 0.1 ? 'scale-110' : 'opacity-80'}`}>
                                    <RotateCw className="w-12 h-12 text-emerald-500 animate-spin" style={{ animationDuration: `${Math.max(0.1, 5 / (rightRPM / 60))}s` }} />
                                    <div className="bg-slate-900 border border-emerald-500/50 p-2 rounded text-center min-w-[100px]">
                                        <div className="text-[10px] text-slate-400">RIGHT RPM</div>
                                        <div className="font-bold text-white font-mono">{rightRPM.toFixed(0)}</div>
                                        <div className="text-[10px] text-emerald-400 mt-1">{(torqueSplit).toFixed(0)} Nm</div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                {/* Footer definitions */}
                <div className="mt-8 flex gap-6 border-t border-slate-800 pt-6">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div> Input Shaft (Motor Speed)
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div> Output Shafts (Wheel Speed)
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 ml-auto">
                        * Open Differential assumes equal torque split but allows speed variance.
                    </div>
                </div>

                <style>{`
                    @keyframes slideDown { 0% { background-position: 0 0; } 100% { background-position: 0 100%; } }
                    @keyframes slideLeft { 0% { background-position: 0 0; } 100% { background-position: 100% 0; } }
                    @keyframes slideRight { 0% { background-position: 100% 0; } 100% { background-position: 0 0; } }
                `}</style>
            </div>
        </div>
    );
};

export default TransmissionDetail;
