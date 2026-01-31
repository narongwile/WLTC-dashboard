import React, { useEffect, useState, useMemo } from 'react';
import { X, Activity, Timer, Play, Pause, RotateCw, CircleDot, Map, GitBranch } from 'lucide-react';
import type { SimulationState, VehicleParams, ViewMode } from '../../types';

interface DrivingCycleProps {
    onClose: () => void;
    simState: SimulationState;
    params: VehicleParams;
    onUpdateParams: (newParams: Partial<VehicleParams>) => void;
    onSwitchView?: (view: ViewMode) => void;
    currentView?: ViewMode;
}

// Reuse TabButton from other locations (should be a shared component ideally, but keeping self-contained for now)
const TabButton: React.FC<any> = ({ icon, label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300
            ${active
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50 shadow-lg shadow-purple-500/10'
                : 'bg-slate-800/50 text-slate-400 border border-slate-700 hover:bg-slate-700/50 hover:text-white'}`}
    >
        {icon}
        <span className="hidden md:inline">{label}</span>
    </button>
);

const DrivingCycle: React.FC<DrivingCycleProps> = ({ onClose, simState: _simState, params: _params, onUpdateParams: _onUpdateParams, onSwitchView, currentView }) => {
    const [currentTime, setCurrentTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const cycleDuration = 3600; // seconds

    // --- Generate Mock Driving Cycle Data (WLTP-ish) ---
    const cycleData = useMemo(() => {
        const data = [];
        let v = 0;
        let a = 0;
        for (let t = 0; t <= cycleDuration; t++) {
            // Simple synthetic cycle: Idle -> Accel -> Cruise -> Decel -> Idle ...
            const phase = t % 300; // 5 minute sub-cycles

            if (phase < 30) { // Idle
                a = 0;
                v = 0;
            } else if (phase < 60) { // Accel
                a = 0.5 + Math.random() * 0.2;
                v += a;
            } else if (phase < 150) { // Cruise/Variable
                a = (Math.random() - 0.5) * 0.5;
                v += a;
                if (v < 0) v = 0;
                if (v > 120) v = 120; // Max speed cap
            } else if (phase < 180) { // Decel
                a = -0.5 - Math.random() * 0.2;
                v += a;
                if (v < 0) { v = 0; a = 0; }
            } else { // Low speed traffic
                a = (Math.random() - 0.5);
                v += a;
                if (v < 0) v = 0;
                if (v > 50) v = 50;
            }

            data.push({ t, v, a });
        }
        return data;
    }, []);

    // Playback loop
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isPlaying) {
            interval = setInterval(() => {
                setCurrentTime(prev => (prev + 1) % cycleDuration);
            }, 50); // Fast forward playback (1s data per 50ms)
        }
        return () => clearInterval(interval);
    }, [isPlaying]);

    // Graph scales
    const maxV = 140; // km/h
    const minA = -5;  // m/s^2
    const maxA = 5;   // m/s^2

    // Viewport window
    const windowSize = 600; // seconds window
    const startIndex = Math.max(0, currentTime - windowSize / 2);
    const endIndex = Math.min(cycleDuration, startIndex + windowSize);
    const visibleData = cycleData.slice(startIndex, endIndex);

    // SVG Polyline generators
    const getPointsV = () => {
        return visibleData.map(d => {
            const x = ((d.t - startIndex) / windowSize) * 100;
            const y = 100 - (d.v / maxV) * 100;
            return `${x},${y}`;
        }).join(' ');
    };

    const getPointsA = () => {
        return visibleData.map(d => {
            const x = ((d.t - startIndex) / windowSize) * 100;
            const normalizedA = (d.a - minA) / (maxA - minA); // 0 to 1
            const y = 100 - (normalizedA * 100);
            return `${x},${y}`;
        }).join(' ');
    };

    const currentV = cycleData[currentTime]?.v || 0;
    const currentA = cycleData[currentTime]?.a || 0;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-200">
            <div className="bg-slate-950 border border-slate-800 w-full max-w-7xl h-full max-h-[900px] rounded-3xl shadow-2xl flex flex-col relative overflow-hidden">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-800 bg-slate-900/50">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
                            <Activity className="w-8 h-8 text-purple-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white tracking-tight">Driving Cycle Source</h2>
                            <div className="flex items-center gap-2 text-slate-400 text-sm">
                                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                                <span className="font-mono">WLTP CLASS 3 • T={currentTime}s</span>
                            </div>
                        </div>
                    </div>

                    {/* View Mode Tabs */}
                    {onSwitchView && (
                        <div className="flex items-center gap-2">

                            <TabButton
                                icon={<CircleDot className="w-4 h-4" />}
                                label="State Machine"
                                active={currentView === 'statemachine'}
                                onClick={() => onSwitchView('statemachine')}
                            />
                            <TabButton
                                icon={<Map className="w-4 h-4" />}
                                label="Strategy Map"
                                active={currentView === 'strategymap'}
                                onClick={() => onSwitchView('strategymap')}
                            />
                            <TabButton
                                icon={<GitBranch className="w-4 h-4" />}
                                label="Simulink"
                                active={currentView === 'simulink'}
                                onClick={() => onSwitchView('simulink')}
                            />
                            <TabButton
                                icon={<Timer className="w-4 h-4" />}
                                label="Drive Cycle"
                                active={currentView === 'drivingcycle'}
                                onClick={() => onSwitchView('drivingcycle')}
                            />
                        </div>
                    )}

                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                        <X className="w-8 h-8" />
                    </button>
                </div>

                {/* Content Grid */}
                <div className="flex-1 overflow-hidden grid grid-cols-12 bg-slate-950 relative">

                    {/* LEFT: Simulink Block Visualization */}
                    <div className="col-span-3 border-r border-slate-800 bg-slate-900/30 p-8 flex flex-col items-center justify-center relative">

                        <div className="relative w-48 h-48 bg-slate-100 border-4 border-slate-400 rounded-lg shadow-xl flex flex-col items-center justify-between py-4">
                            <div className="absolute top-2 left-2 text-[10px] font-bold text-black">Driving Cycle</div>

                            {/* Inner Graph Icon */}
                            <div className="w-32 h-20 bg-white border border-slate-300 mt-4 relative overflow-hidden">
                                <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                                    <path d="M0,80 L10,70 L20,70 L30,40 L40,60 L50,20 L60,50 L70,80" fill="none" stroke="blue" strokeWidth="1.5" />
                                </svg>
                                <div className="absolute top-0 right-1 text-[8px] text-blue-600 font-mono">s</div>
                                <div className="absolute bottom-4 right-1 text-[8px] text-yellow-600 font-mono">v</div>
                                <div className="absolute bottom-0 right-1 text-[8px] text-black font-mono">a</div>
                            </div>

                            {/* Ports */}
                            <div className="w-full flex flex-col items-end gap-3 mt-2 pr-[-8px]">
                                <div className="flex items-center gap-1">
                                    <span className="text-[10px] font-mono font-bold text-black">s (m)</span>
                                    <div className="w-2 h-2 bg-black rotate-45 transform translate-x-1/2"></div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="text-[10px] font-mono font-bold text-black">v (m/s)</span>
                                    <div className="w-2 h-2 bg-black rotate-45 transform translate-x-1/2"></div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="text-[10px] font-mono font-bold text-black">a (m/s^2)</span>
                                    <div className="w-2 h-2 bg-black rotate-45 transform translate-x-1/2"></div>
                                </div>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="mt-12 flex gap-4">
                            <button onClick={() => setIsPlaying(!isPlaying)} className="p-4 bg-purple-600 hover:bg-purple-500 rounded-full text-white shadow-lg transition-transform hover:scale-110 active:scale-95">
                                {isPlaying ? <Pause className="fill-current w-6 h-6" /> : <Play className="fill-current w-6 h-6" />}
                            </button>
                            <button onClick={() => setCurrentTime(0)} className="p-4 bg-slate-700 hover:bg-slate-600 rounded-full text-white shadow-lg transition-transform hover:scale-110 active:scale-95">
                                <RotateCw className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="mt-8 font-mono text-center">
                            <div className="text-xs text-slate-500 uppercase tracking-widest mb-2">Simulation Time</div>
                            <div className="text-3xl font-bold text-white tabular-nums">
                                {Math.floor(currentTime / 60)}:{String(currentTime % 60).padStart(2, '0')}
                            </div>
                        </div>

                    </div>


                    {/* RIGHT: Scope Charts */}
                    <div className="col-span-9 p-6 flex flex-col gap-6 overflow-hidden">

                        {/* Velocity Chart */}
                        <div className="flex-1 bg-slate-900 border border-slate-700 rounded-xl p-4 relative flex flex-col">
                            <div className="flex justify-between items-center mb-2">
                                <div className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-cyan-400" /> Velocity (km/h)
                                </div>
                                <div className="font-mono text-2xl font-bold text-cyan-400">{currentV.toFixed(1)}</div>
                            </div>

                            <div className="flex-1 flex">
                                {/* Y-Axis Labels */}
                                <div className="w-10 flex flex-col justify-between text-right pr-2 text-[10px] text-slate-500 font-mono">
                                    <span>140</span>
                                    <span>105</span>
                                    <span>70</span>
                                    <span>35</span>
                                    <span>0</span>
                                </div>

                                {/* Chart Area */}
                                <div className="flex-1 flex flex-col">
                                    <div className="flex-1 relative border-l border-b border-slate-700 overflow-hidden">
                                        {/* Grid Lines */}
                                        <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)', backgroundSize: '25% 25%', opacity: 0.2 }}></div>

                                        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                                            <polyline
                                                points={getPointsV()}
                                                fill="none"
                                                stroke="#22d3ee"
                                                strokeWidth="2"
                                                vectorEffect="non-scaling-stroke"
                                            />
                                        </svg>

                                        {/* Time Cursor */}
                                        <div className="absolute top-0 bottom-0 w-0.5 bg-yellow-400 shadow-[0_0_10px_yellow] z-10"
                                            style={{ left: `${((currentTime - startIndex) / windowSize) * 100}%` }}>
                                        </div>
                                    </div>

                                    {/* X-Axis Labels */}
                                    <div className="h-5 flex justify-between text-[10px] text-slate-500 font-mono pt-1">
                                        <span>{Math.floor(startIndex / 60)}:{String(startIndex % 60).padStart(2, '0')}</span>
                                        <span>{Math.floor((startIndex + windowSize / 4) / 60)}:{String(Math.floor((startIndex + windowSize / 4) % 60)).padStart(2, '0')}</span>
                                        <span>{Math.floor((startIndex + windowSize / 2) / 60)}:{String(Math.floor((startIndex + windowSize / 2) % 60)).padStart(2, '0')}</span>
                                        <span>{Math.floor((startIndex + 3 * windowSize / 4) / 60)}:{String(Math.floor((startIndex + 3 * windowSize / 4) % 60)).padStart(2, '0')}</span>
                                        <span>{Math.floor(endIndex / 60)}:{String(endIndex % 60).padStart(2, '0')}</span>
                                    </div>
                                    <div className="text-center text-[10px] text-slate-500 font-bold uppercase">Time (mm:ss)</div>
                                </div>
                            </div>
                        </div>


                        {/* Acceleration Chart */}
                        <div className="flex-1 bg-slate-900 border border-slate-700 rounded-xl p-4 relative flex flex-col">
                            <div className="flex justify-between items-center mb-2">
                                <div className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-amber-400" /> Acceleration (m/s²)
                                </div>
                                <div className="font-mono text-2xl font-bold text-amber-400">{currentA.toFixed(2)}</div>
                            </div>

                            <div className="flex-1 flex">
                                {/* Y-Axis Labels */}
                                <div className="w-10 flex flex-col justify-between text-right pr-2 text-[10px] text-slate-500 font-mono">
                                    <span>+5</span>
                                    <span>+2.5</span>
                                    <span>0</span>
                                    <span>-2.5</span>
                                    <span>-5</span>
                                </div>

                                {/* Chart Area */}
                                <div className="flex-1 flex flex-col">
                                    <div className="flex-1 relative border-l border-b border-slate-700 overflow-hidden">
                                        {/* Grid Lines */}
                                        <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)', backgroundSize: '25% 25%', opacity: 0.2 }}></div>

                                        {/* Zero Line */}
                                        <div className="absolute left-0 right-0 h-px bg-emerald-500/50 top-1/2"></div>

                                        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                                            <polyline
                                                points={getPointsA()}
                                                fill="none"
                                                stroke="#fbbf24"
                                                strokeWidth="2"
                                                vectorEffect="non-scaling-stroke"
                                            />
                                        </svg>

                                        {/* Time Cursor */}
                                        <div className="absolute top-0 bottom-0 w-0.5 bg-yellow-400 shadow-[0_0_10px_yellow] z-10"
                                            style={{ left: `${((currentTime - startIndex) / windowSize) * 100}%` }}>
                                        </div>
                                    </div>

                                    {/* X-Axis Labels */}
                                    <div className="h-5 flex justify-between text-[10px] text-slate-500 font-mono pt-1">
                                        <span>{Math.floor(startIndex / 60)}:{String(startIndex % 60).padStart(2, '0')}</span>
                                        <span>{Math.floor((startIndex + windowSize / 4) / 60)}:{String(Math.floor((startIndex + windowSize / 4) % 60)).padStart(2, '0')}</span>
                                        <span>{Math.floor((startIndex + windowSize / 2) / 60)}:{String(Math.floor((startIndex + windowSize / 2) % 60)).padStart(2, '0')}</span>
                                        <span>{Math.floor((startIndex + 3 * windowSize / 4) / 60)}:{String(Math.floor((startIndex + 3 * windowSize / 4) % 60)).padStart(2, '0')}</span>
                                        <span>{Math.floor(endIndex / 60)}:{String(endIndex % 60).padStart(2, '0')}</span>
                                    </div>
                                    <div className="text-center text-[10px] text-slate-500 font-bold uppercase">Time (mm:ss)</div>
                                </div>
                            </div>
                        </div>

                    </div>

                </div>
            </div>
        </div>
    );
};

export default DrivingCycle;
