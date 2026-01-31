import React from 'react';
import { X, Cpu, CircleDot, Map, GitBranch, Timer } from 'lucide-react';
import type { SimulationState, VehicleParams, ViewMode } from '../../types';

interface EMSVisualizeProps {
    onClose: () => void;
    simState: SimulationState;
    params: VehicleParams;
    onUpdateParams: (newParams: Partial<VehicleParams>) => void;
    onSwitchView?: (view: ViewMode) => void;
    currentView?: ViewMode;
}

// --- Tab Button Component ---
interface TabButtonProps {
    icon: React.ReactNode;
    label: string;
    active: boolean;
    onClick: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({ icon, label, active, onClick }) => (
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

const EMSVisualize: React.FC<EMSVisualizeProps> = ({ onClose, simState, params, onUpdateParams, onSwitchView, currentView = 'strategymap' }) => {
    const totalPower = simState.fcPower + simState.battPower;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in zoom-in-95">
            <div className="bg-[#0f172a] border border-slate-700 w-full max-w-5xl rounded-2xl shadow-2xl p-6 relative">

                {/* Header with View Tabs */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-500/20 rounded-xl border border-purple-500/50">
                            <Cpu className="w-8 h-8 text-purple-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">EMS Controller</h2>
                            <div className="text-sm text-slate-400">Operating Strategy Map</div>
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

                    <button onClick={onClose} className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-lg transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* LEFT: STRATEGY CONTROLS */}
                    <div className="col-span-12 lg:col-span-4 space-y-6">
                        <div className="bg-slate-900 border border-slate-700 p-5 rounded-xl">
                            <h3 className="text-sm font-bold text-slate-400 mb-4 flex justify-between">
                                FC MAX POWER CAP
                                <span className="text-blue-400 font-mono">{params.maxFcPower.toFixed(0)} kW</span>
                            </h3>
                            <input
                                type="range" min="10" max="150" step="5"
                                value={params.maxFcPower}
                                onChange={(e) => onUpdateParams({ maxFcPower: Number(e.target.value) })}
                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                            <div className="text-xs text-slate-500 mt-2">
                                Limits Fuel Cell output. Higher = More H2 use, Less Battery strain.
                            </div>
                        </div>

                        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs text-slate-400 font-bold">CURRENT STATE</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase
                                    ${simState.mode === 'HYBRID' ? 'bg-purple-900 text-purple-200' :
                                        simState.mode === 'EV' ? 'bg-blue-900 text-blue-200' :
                                            simState.mode === 'REGEN' ? 'bg-emerald-900 text-emerald-200' : 'bg-slate-700'}`}>
                                    {simState.mode}
                                </span>
                            </div>
                            <div className="space-y-2 font-mono text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">P_demand</span>
                                    <span className="text-white">{totalPower.toFixed(1)} kW</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">P_fc</span>
                                    <span className="text-blue-400">{simState.fcPower.toFixed(1)} kW</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">P_batt</span>
                                    <span className={`font-bold ${simState.battPower < 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {simState.battPower.toFixed(1)} kW
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: STRATEGY MAP VISUALIZATION */}
                    <div className="col-span-12 lg:col-span-8 bg-slate-950 rounded-xl border border-slate-800 p-6 flex flex-col relative min-h-[400px]">
                        <h3 className="text-sm font-bold text-slate-400 mb-4">OPERATING STRATEGY MAP</h3>

                        <div className="flex-1 relative border-l border-b border-slate-700 ml-8 mb-8">
                            {/* Axis Labels */}
                            <div className="absolute -left-8 top-1/2 -rotate-90 text-xs text-slate-500 font-bold">POWER DEMAND (kW)</div>
                            <div className="absolute bottom-[-25px] left-1/2 -translate-x-1/2 text-xs text-slate-500 font-bold">STATE OF CHARGE (%)</div>

                            {/* Regions */}
                            <div className="absolute inset-0 overflow-hidden">
                                {/* EV Zone (Bottom) */}
                                <div className="absolute bottom-0 left-0 right-0 h-[20%] bg-blue-500/10 border-t border-blue-500/20 flex items-center justify-center">
                                    <span className="text-blue-500/30 font-bold text-xl">EV MODE</span>
                                </div>

                                {/* Charging Zone (Left) */}
                                <div className="absolute top-0 bottom-0 left-0 w-[30%] bg-emerald-500/10 border-r border-emerald-500/20 flex items-center justify-center">
                                    <span className="text-emerald-500/30 font-bold text-xl rotate-90">FORCE CHARGE</span>
                                </div>

                                {/* Hybrid Zone (Top Right) */}
                                <div className="absolute top-0 right-0 w-[70%] h-[80%] bg-purple-500/10 flex items-center justify-center">
                                    <span className="text-purple-500/30 font-bold text-xl">HYBRID ASSIST</span>
                                </div>
                            </div>

                            {/* Live Operating Point */}
                            <div
                                className="absolute w-4 h-4 bg-white rounded-full shadow-[0_0_15px_white] transition-all duration-300 ease-out z-20 flex items-center justify-center"
                                style={{
                                    left: `${simState.soc}%`,
                                    bottom: `${Math.min(100, Math.max(0, totalPower / 150 * 100))}%`,
                                    transform: 'translate(-50%, 50%)'
                                }}
                            >
                                <div className="w-2 h-2 bg-slate-900 rounded-full animate-ping absolute" />
                            </div>

                            {/* Threshold Line (Interactive) */}
                            <div
                                className="absolute left-0 right-0 border-t-2 border-dashed border-blue-400 opacity-50 transition-all duration-300"
                                style={{ bottom: `${(20 / 150) * 100}%` }}
                            >
                                <span className="absolute right-2 -top-3 text-[10px] text-blue-400">EV/Hybrid Threshold</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default EMSVisualize;
