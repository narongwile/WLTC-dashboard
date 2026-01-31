import React, { useState } from 'react';
import { X, Cpu, Activity, Layers, CircleDot, Map, GitBranch, Timer } from 'lucide-react';
import type { SimulationState, VehicleParams, ViewMode } from '../../types';

// Import sub-views
import EMSVisualize from './EMSVisualize';
import EMSmain from './EMSmain';
import DrivingCycle from './DrivingCycle';

interface EMSDetailProps {
    onClose: () => void;
    simState: SimulationState;
    params: VehicleParams;
    onUpdateParams: (newParams: Partial<VehicleParams>) => void;
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

const EMSDetail: React.FC<EMSDetailProps> = ({ onClose, simState, params, onUpdateParams }) => {
    const [viewMode, setViewMode] = useState<ViewMode>('statemachine');
    const totalPower = simState.fcPower + simState.battPower;

    // --- State Machine Visualization Helpers ---
    const StateNode = ({ id, label, active, x, y, color }: any) => (
        <div
            className={`absolute w-32 h-32 rounded-full border-4 flex flex-col items-center justify-center transition-all duration-500 z-10
            ${active ? `${color} bg-slate-900 scale-110 shadow-[0_0_30px_rgba(255,255,255,0.2)]` : 'border-slate-700 bg-slate-800 opacity-50 grayscale'}`}
            style={{ left: x, top: y }}
        >
            <div className={`font-bold ${active ? 'text-white' : 'text-slate-500'}`}>{id}</div>
            <div className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">{label}</div>
            {active && <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-current"></div>}
        </div>
    );

    // Render Sub-Views
    if (viewMode === 'strategymap') {
        return (
            <EMSVisualize
                onClose={onClose}
                simState={simState}
                params={params}
                onUpdateParams={onUpdateParams}
                onSwitchView={setViewMode}
                currentView={viewMode}
            />
        );
    }

    if (viewMode === 'simulink') {
        return (
            <EMSmain
                onClose={onClose}
                simState={simState}
                params={params}
                onUpdateParams={onUpdateParams}
                onSwitchView={setViewMode}
                currentView={viewMode}
            />
        );
    }

    if (viewMode === 'drivingcycle') {
        return (
            <DrivingCycle
                onClose={onClose}
                simState={simState}
                params={params}
                onUpdateParams={onUpdateParams}
                onSwitchView={setViewMode}
                currentView={viewMode}
            />
        );
    }

    // Default: State Machine View
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-200">
            <div className="bg-slate-950 border border-slate-800 w-full max-w-6xl h-full max-h-[800px] rounded-3xl shadow-2xl flex flex-col relative overflow-hidden">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-800 bg-slate-900/50">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
                            <Cpu className="w-8 h-8 text-purple-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white tracking-tight">EMS Logic Controller</h2>
                            <div className="flex items-center gap-2 text-slate-400 text-sm">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                <span className="font-mono">STATUS: {simState.mode}</span>
                            </div>
                        </div>
                    </div>

                    {/* View Mode Tabs */}
                    <div className="flex items-center gap-2">
                        <TabButton
                            icon={<CircleDot className="w-4 h-4" />}
                            label="State Machine"
                            active={true}
                            onClick={() => setViewMode('statemachine')}
                        />
                        <TabButton
                            icon={<Map className="w-4 h-4" />}
                            label="Strategy Map"
                            active={false}
                            onClick={() => setViewMode('strategymap')}
                        />
                        <TabButton
                            icon={<GitBranch className="w-4 h-4" />}
                            label="Simulink"
                            active={false}
                            onClick={() => setViewMode('simulink')}
                        />
                        <TabButton
                            icon={<Timer className="w-4 h-4" />}
                            label="Drive Cycle"
                            active={false}
                            onClick={() => setViewMode('drivingcycle')}
                        />
                    </div>

                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                        <X className="w-8 h-8" />
                    </button>
                </div>

                <div className="flex-1 overflow-hidden grid grid-cols-12">

                    {/* LEFT: Inputs & Parameters (Side Panel) */}
                    <div className="col-span-3 border-r border-slate-800 bg-slate-900/30 p-6 flex flex-col gap-6 overflow-y-auto">

                        {/* 1. Live Inputs */}
                        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
                            <h3 className="text-xs font-bold text-slate-400 mb-4 flex items-center gap-2">
                                <Activity className="w-4 h-4" /> LIVE SIGNALS
                            </h3>
                            <div className="space-y-3 font-mono text-sm">
                                <div className="flex justify-between items-center p-2 rounded bg-slate-800/50">
                                    <span className="text-slate-400">P_demand</span>
                                    <span className={totalPower > 0 ? "text-orange-400" : "text-emerald-400"}>
                                        {totalPower.toFixed(1)} kW
                                    </span>
                                </div>
                                <div className="flex justify-between items-center p-2 rounded bg-slate-800/50">
                                    <span className="text-slate-400">SOC</span>
                                    <span className={simState.soc < 20 ? "text-red-400" : "text-blue-400"}>
                                        {simState.soc.toFixed(1)} %
                                    </span>
                                </div>
                                <div className="flex justify-between items-center p-2 rounded bg-slate-800/50">
                                    <span className="text-slate-400">Fuel Cell</span>
                                    <span className="text-cyan-400">{simState.fcPower.toFixed(1)} kW</span>
                                </div>
                            </div>
                        </div>

                        {/* 2. Tunable Parameters */}
                        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 flex-1">
                            <h3 className="text-xs font-bold text-slate-400 mb-4 flex items-center gap-2">
                                <Layers className="w-4 h-4" /> LOGIC PARAMETERS
                            </h3>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-300">Max FC Power</span>
                                        <span className="text-purple-400 font-mono">{params.maxFcPower} kW</span>
                                    </div>
                                    <input
                                        type="range" min="10" max="150" step="1"
                                        value={params.maxFcPower}
                                        onChange={(e) => onUpdateParams({ maxFcPower: Number(e.target.value) })}
                                        className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-300">SOC Min Threshold</span>
                                        <span className="text-red-400 font-mono">20%</span>
                                    </div>
                                    <div className="h-1 bg-slate-700 rounded-lg relative">
                                        <div className="absolute left-[20%] w-1 h-3 bg-red-500 -top-1"></div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-300">Start Trigger</span>
                                        <span className="text-orange-400 font-mono">20 kW</span>
                                    </div>
                                    <input type="range" disabled value={20} min={0} max={100} className="w-full h-1 bg-slate-700 rounded-lg opacity-50 cursor-not-allowed" />
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* CENTER/RIGHT: Logic Visualization Area */}
                    <div className="col-span-9 relative bg-slate-950 p-8 overflow-hidden">
                        {/* Background Grid */}
                        <div className="absolute inset-0 opacity-10"
                            style={{ backgroundImage: 'radial-gradient(#64748b 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
                        </div>

                        {/* State Machine Diagram */}
                        <div className="relative w-full h-full flex items-center justify-center">

                            {/* STATES */}
                            {/* IDLE (Top Left) */}
                            <StateNode
                                id="IDLE" label="Stop / Coast"
                                active={simState.mode === 'IDLE'}
                                x="10%" y="40%"
                                color="border-slate-400 text-slate-400"
                            />

                            {/* EV (Bottom Center) */}
                            <StateNode
                                id="EV" label="Batt Only"
                                active={simState.mode === 'EV'}
                                x="40%" y="60%"
                                color="border-blue-500 text-blue-500"
                            />

                            {/* REGEN (Top Center) */}
                            <StateNode
                                id="REGEN" label="Braking"
                                active={simState.mode === 'REGEN'}
                                x="40%" y="20%"
                                color="border-emerald-500 text-emerald-500"
                            />

                            {/* HYBRID (Right) */}
                            <StateNode
                                id="HYBRID" label="FC + Batt"
                                active={simState.mode === 'HYBRID'}
                                x="70%" y="40%"
                                color="border-purple-500 text-purple-500"
                            />

                            {/* Transition Logic Text */}
                            <div className="absolute top-[80%] left-1/2 -translate-x-1/2 text-center">
                                <div className="text-sm font-bold text-slate-500 uppercase mb-2">Active Logic Path</div>
                                <code className="bg-slate-900 border border-slate-800 px-4 py-2 rounded text-xs font-mono text-emerald-400 block min-w-[300px]">
                                    {simState.mode === 'IDLE' && "IF P_req == 0 THEN IDLE"}
                                    {simState.mode === 'REGEN' && "IF P_req < 0 THEN REGEN (Charge Batt)"}
                                    {simState.mode === 'EV' && "IF P_req > 0 && P_req < P_start THEN EV"}
                                    {simState.mode === 'HYBRID' && "IF P_req > P_start THEN HYBRID (FC ON)"}
                                </code>
                            </div>

                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default EMSDetail;
