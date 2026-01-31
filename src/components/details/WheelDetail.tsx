import React, { useState, useEffect } from 'react';
import { X, Disc } from 'lucide-react';
import type { SimulationState, VehicleParams, ForceData } from '../../types';

interface WheelDetailProps {
    onClose: () => void;
    simState: SimulationState;
    forces: ForceData;
    params: VehicleParams;
}

const WheelDetail: React.FC<WheelDetailProps> = ({ onClose, simState, forces, params }) => {
    // Physics Simulation

    // 1. Suspension Compression (Fake bumpiness + load transfer)
    // F_z = Mass/4 * g + Aero/4
    const fz_static = (params.mass * 9.81) / 4;
    const fz_aero = forces.faero / 4; // Downforce adds compression
    const fz_total = fz_static + fz_aero;

    // Spring deflections
    const k_spring = 30000; // N/m
    const compression_m = fz_total / k_spring;
    const compression_px = compression_m * 500; // Scale factor for visual

    const [bumpOffset, setBumpOffset] = useState(0);
    // Simulate road noise
    useEffect(() => {
        if (simState.velocity < 1) return;
        const interval = setInterval(() => {
            setBumpOffset((Math.random() - 0.5) * 10); // +/- 5px jitter
        }, 50);
        return () => clearInterval(interval);
    }, [simState.velocity]);

    // 2. Friction Circle
    // F_x = Traction/Braking force per wheel
    // F_y = Lateral force (Simulated for visual)
    const fx_wheel = forces.ftotal / 2; // Assuming FWD/RWD 2 driven wheels
    const max_friction = fz_total * 1.0; // mu = 1.0
    const fy_wheel = fx_wheel * 0.2 * Math.sin(simState.time); // Artificial lateral swaying

    // Normalize for circle
    const fx_pct = (fx_wheel / max_friction) * 100;
    const fy_pct = (fy_wheel / max_friction) * 100;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in zoom-in-95">
            <div className="bg-[#0f172a] border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl p-6 relative">
                <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-white">
                    <X className="w-6 h-6" />
                </button>

                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-amber-500/20 rounded-xl border border-amber-500/50">
                        <Disc className="w-8 h-8 text-amber-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Wheel & Tire Dynamics</h2>
                        <div className="text-sm text-slate-400">Traction Circle • Suspension Kinematics</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* LEFT: FRICTION CIRCLE */}
                    <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 flex flex-col items-center">
                        <h3 className="text-sm font-bold text-slate-400 mb-4">TRACTION CIRCLE (G-G Diagram)</h3>
                        <div className="relative w-64 h-64 border border-slate-700 rounded-full bg-slate-950/50 flex items-center justify-center">
                            {/* Axes */}
                            <div className="absolute w-full h-[1px] bg-slate-700/50"></div>
                            <div className="absolute h-full w-[1px] bg-slate-700/50"></div>

                            {/* Limits */}
                            <div className="absolute inset-2 rounded-full border border-dashed border-red-500/30"></div>
                            <div className="absolute inset-12 rounded-full border border-dashed border-emerald-500/30"></div>

                            {/* Dot */}
                            <div
                                className="absolute w-4 h-4 bg-amber-500 rounded-full shadow-[0_0_10px_orange] transition-all duration-75"
                                style={{ transform: `translate(${fy_pct}%, ${-fx_pct}%)` }} // -fy because up is braking usually? No, up is accel/braking
                            ></div>

                            {/* Vector */}
                            <svg className="absolute inset-0 w-full h-full pointer-events-none">
                                <line x1="50%" y1="50%" x2={`${50 + fy_pct / 2}%`} y2={`${50 - fx_pct / 2}%`} stroke="orange" strokeWidth="2" opacity="0.5" />
                            </svg>
                        </div>
                        <div className="mt-4 flex gap-8 text-xs text-slate-500">
                            <div className="text-center">LONGITUDINAL<br /><span className="text-white font-mono">{fx_wheel.toFixed(0)} N</span></div>
                            <div className="text-center">LATERAL<br /><span className="text-white font-mono">{fy_wheel.toFixed(0)} N</span></div>
                        </div>
                    </div>

                    {/* RIGHT: SUSPENSION VISUAL */}
                    <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 flex flex-col items-center relative overflow-hidden">
                        <h3 className="text-sm font-bold text-slate-400 mb-4">SUSPENSION TRAVEL</h3>

                        {/* Strut Assembly */}
                        <div className="relative h-[300px] w-32 flex flex-col items-center">
                            {/* Mount */}
                            <div className="w-20 h-4 bg-slate-500 rounded-t"></div>

                            {/* Piston Rod (Fixed Top) */}
                            <div className="w-4 h-full bg-slate-600 absolute top-4"></div>

                            {/* Spring & Damper Body (Moves Up/Down) */}
                            <div
                                className="absolute w-24 flex flex-col items-center transition-transform duration-75 ease-out"
                                style={{ top: `${50 + bumpOffset + (compression_px / 10)}px` }} // Base offset
                            >
                                {/* Spring coils (SVG for visual) */}
                                <svg width="80" height="120" className="drop-shadow-lg">
                                    <path d="M 10,10 q 30,10 60,0 t -60,10 t 60,10 t -60,10 t 60,10 t -60,10 t 60,10"
                                        fill="none" stroke="#94a3b8" strokeWidth="4" />
                                </svg>

                                {/* Damper Body */}
                                <div className="w-16 h-40 bg-gradient-to-b from-blue-900 to-slate-900 rounded border border-slate-700 -mt-4 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-blue-500/10"></div>
                                </div>

                                {/* Wheel Hub */}
                                <div className="w-4 h-8 bg-slate-500 mt-[-10px]"></div>
                            </div>
                        </div>

                        <div className="absolute bottom-4 right-4 text-right">
                            <div className="text-xs text-slate-500">NORMAL FORCE (Fz)</div>
                            <div className="text-xl font-mono font-bold text-white">{fz_total.toFixed(0)} N</div>
                            <div className="text-xs text-slate-500 mt-2">COMPRESSION</div>
                            <div className="text-xl font-mono font-bold text-blue-400">{(compression_m * 1000).toFixed(1)} mm</div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default WheelDetail;
