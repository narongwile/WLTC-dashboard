import React, { useEffect, useState } from 'react';
import { X, Cpu, Activity, ArrowRight, Zap, Battery, Gauge, Settings2, CircleDot, Map, GitBranch, Timer } from 'lucide-react';
import type { SimulationState, VehicleParams, ViewMode } from '../../types';

interface EMSDetailProps {
    onClose: () => void;
    simState: SimulationState;
    params: VehicleParams;
    onUpdateParams: (newParams: Partial<VehicleParams>) => void;
    onSwitchView?: (view: ViewMode) => void;
    currentView?: ViewMode;
}

// --- Signal Port Component ---
interface SignalPortProps {
    label: string;
    value: string;
    unit?: string;
    direction: 'input' | 'output';
    color: string;
    isActive?: boolean;
    description?: string;
    onClick?: () => void;
}

const SignalPort: React.FC<SignalPortProps> = ({ label, value, unit, direction, color, isActive = true, description, onClick }) => {
    const [showTooltip, setShowTooltip] = useState(false);

    return (
        <div
            onClick={onClick}
            className={`relative flex items-center gap-3 p-3 rounded-lg transition-all duration-300 cursor-pointer
                ${isActive ? 'bg-slate-800/80 hover:bg-slate-700/80' : 'bg-slate-900/50 opacity-50'}
                ${direction === 'input' ? 'flex-row' : 'flex-row-reverse'}
                ${onClick ? 'hover:ring-2 hover:ring-purple-500/50' : ''}`}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            {/* Arrow indicator */}
            <div className={`flex items-center ${direction === 'input' ? 'order-first' : 'order-last'}`}>
                <ArrowRight className={`w-4 h-4 ${color} ${direction === 'output' ? 'rotate-180' : ''} 
                    ${isActive ? 'animate-pulse' : ''}`} />
            </div>

            {/* Signal info */}
            <div className={`flex-1 ${direction === 'output' ? 'text-right' : 'text-left'}`}>
                <div className={`text-[10px] uppercase tracking-wider font-bold ${color}`}>{label}</div>
                <div className="font-mono text-white text-sm font-bold">
                    {value}
                    {unit && <span className="text-slate-400 text-xs ml-1">{unit}</span>}
                </div>
            </div>

            {/* Connection dot */}
            <div className={`w-3 h-3 rounded-full border-2 ${color.replace('text-', 'border-')} bg-slate-950
                ${isActive ? 'shadow-[0_0_8px_currentColor]' : ''}`}
                style={{ boxShadow: isActive ? `0 0 8px var(--tw-shadow-color)` : 'none' }}
            />

            {/* Tooltip */}
            {showTooltip && description && (
                <div className={`absolute z-50 ${direction === 'input' ? 'left-full ml-2' : 'right-full mr-2'} 
                    top-1/2 -translate-y-1/2 bg-slate-900 border border-slate-700 px-3 py-2 rounded-lg
                    text-xs text-slate-300 whitespace-nowrap shadow-xl`}>
                    {description}
                </div>
            )}
        </div>
    );
};

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


const EMSmain: React.FC<EMSDetailProps> = ({ onClose, simState, params, onUpdateParams, onSwitchView, currentView = 'simulink' }) => {
    const totalPower = simState.fcPower + simState.battPower;
    const [tick, setTick] = useState(0);
    const [selectedSignal, setSelectedSignal] = useState<string | null>(null);

    // Animation tick for signal flow
    useEffect(() => {
        const interval = setInterval(() => setTick(t => (t + 1) % 100), 50);
        return () => clearInterval(interval);
    }, []);

    // Compute derived values
    const socMin = 20; // % Threshold
    const pFcMin = 5;  // kW minimum FC output when active
    const maxChargeRate = params.battCapacity * 0.5; // C/2 rate for charging
    const pBattMax = params.battCapacity * 1.5; // C/1.5 rate max discharge

    // Mode status
    const statusMessage = {
        'IDLE': 'System Standby',
        'EV': 'Electric Only',
        'HYBRID': 'Hybrid Assist',
        'REGEN': 'Regenerative'
    }[simState.mode];

    const modeColors = {
        'IDLE': 'text-slate-400',
        'EV': 'text-blue-400',
        'HYBRID': 'text-purple-500',
        'REGEN': 'text-emerald-400'
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-200">
            <div className="bg-slate-950 border border-slate-800 w-full max-w-7xl h-full max-h-[900px] rounded-3xl shadow-2xl flex flex-col relative overflow-hidden">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-800 bg-slate-900/50">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20 relative">
                            <Cpu className="w-8 h-8 text-purple-400" />
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center text-[8px] font-bold text-white">
                                9
                            </div>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white tracking-tight">EMS Controller</h2>
                            <div className="flex items-center gap-2 text-slate-400 text-sm">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                <span className="font-mono">MATLAB Function Coding • {simState.mode}</span>
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

                {/* Main Content */}
                <div className="flex-1 overflow-hidden grid grid-cols-12 relative">

                    {/* Background animated grid */}
                    <div className="absolute inset-0 opacity-5"
                        style={{
                            backgroundImage: 'linear-gradient(#64748b 1px, transparent 1px), linear-gradient(90deg, #64748b 1px, transparent 1px)',
                            backgroundSize: '50px 50px'
                        }}>
                    </div>

                    {/* LEFT PANEL: INPUT SIGNALS */}
                    <div className="col-span-3 border-r border-slate-800 bg-slate-900/30 p-4 flex flex-col gap-2 overflow-y-auto relative z-10">
                        <div className="flex items-center gap-2 mb-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                            <ArrowRight className="w-4 h-4" />
                            Input Signals
                        </div>

                        <SignalPort
                            label="P_demand"
                            value={totalPower.toFixed(1)}
                            unit="kW"
                            direction="input"
                            color={totalPower > 0 ? "text-orange-400" : "text-emerald-400"}
                            isActive={true}
                            description="Total power demand from traction system"
                            onClick={() => setSelectedSignal('P_demand')}
                        />

                        <SignalPort
                            label="SOC"
                            value={simState.soc.toFixed(1)}
                            unit="%"
                            direction="input"
                            color={simState.soc < 20 ? "text-red-400" : "text-blue-400"}
                            isActive={true}
                            description="Battery State of Charge"
                            onClick={() => setSelectedSignal('SOC')}
                        />

                        <SignalPort
                            label="SOC_min"
                            value={socMin.toFixed(0)}
                            unit="%"
                            direction="input"
                            color="text-red-500"
                            isActive={simState.soc <= socMin}
                            description="Minimum SOC threshold for FC activation"
                        />

                        <SignalPort
                            label="P_fc_min"
                            value={pFcMin.toFixed(0)}
                            unit="kW"
                            direction="input"
                            color="text-cyan-400"
                            isActive={simState.fcPower > 0}
                            description="Minimum fuel cell output when active"
                        />

                        <SignalPort
                            label="MaxChargeRate"
                            value={maxChargeRate.toFixed(0)}
                            unit="kW"
                            direction="input"
                            color="text-emerald-400"
                            isActive={simState.battPower < 0}
                            description="Maximum pack charging power rate"
                        />

                        <SignalPort
                            label="P_batt_max"
                            value={pBattMax.toFixed(0)}
                            unit="kW"
                            direction="input"
                            color="text-amber-400"
                            isActive={simState.battPower > 0}
                            description="Maximum battery discharge power"
                        />

                        {/* Parameter Controls */}
                        <div className="mt-auto pt-4 border-t border-slate-800">
                            <div className="flex items-center gap-2 mb-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                <Settings2 className="w-4 h-4" />
                                Tunable Parameters
                            </div>
                            <div className="space-y-4">
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
                            </div>
                        </div>
                    </div>

                    {/* CENTER: SIMULINK VISUALIZATION */}
                    <div className="col-span-6 relative flex items-center justify-center p-8">
                        {/* Animated Signal Lines */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" preserveAspectRatio="none">
                            <defs>
                                <linearGradient id="signalGradientIn" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="transparent" />
                                    <stop offset={`${tick}%`} stopColor="#8b5cf6" stopOpacity="0.8" />
                                    <stop offset={`${Math.min(100, tick + 20)}%`} stopColor="#8b5cf6" stopOpacity="0.2" />
                                    <stop offset="100%" stopColor="transparent" />
                                </linearGradient>
                                <linearGradient id="signalGradientOut" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="transparent" />
                                    <stop offset={`${(100 - tick)}%`} stopColor="#10b981" stopOpacity="0.2" />
                                    <stop offset={`${Math.min(100, 120 - tick)}%`} stopColor="#10b981" stopOpacity="0.8" />
                                    <stop offset="100%" stopColor="transparent" />
                                </linearGradient>
                            </defs>

                            {/* Input signal lines */}
                            {[20, 30, 40, 50, 60, 70].map((y, i) => (
                                <line key={`in-${i}`} x1="0%" y1={`${y}%`} x2="35%" y2="50%"
                                    stroke="url(#signalGradientIn)" strokeWidth="2" />
                            ))}

                            {/* Output signal lines */}
                            {[35, 50, 65].map((y, i) => (
                                <line key={`out-${i}`} x1="65%" y1="50%" x2="100%" y2={`${y}%`}
                                    stroke="url(#signalGradientOut)" strokeWidth="2" />
                            ))}
                        </svg>

                        {/* Main EMS Block */}
                        <div className="relative w-[380px] bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl border-4 border-purple-500/50 shadow-[0_0_60px_rgba(139,92,246,0.3)] z-10">
                            {/* Block Number Badge */}
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg border-4 border-slate-950">
                                9
                            </div>

                            {/* Block Header */}
                            <div className="bg-purple-500/20 border-b border-purple-500/30 px-6 py-4 mt-4 text-center">
                                <div className="text-xl font-bold text-white">EMS Controller</div>
                                <div className="text-xs text-purple-300 font-mono mt-1">by MATLAB Function Coding</div>
                            </div>

                            {/* Block Content */}
                            <div className="p-5 space-y-4">
                                {/* Current Mode */}
                                <div className="text-center">
                                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Active Mode</div>
                                    <div className={`text-3xl font-black ${modeColors[simState.mode]} drop-shadow-lg`}>
                                        {simState.mode}
                                    </div>
                                    <div className="text-sm text-slate-400 mt-1">{statusMessage}</div>
                                </div>

                                {/* Power Split Visualization */}
                                <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-700">
                                    <div className="text-xs text-slate-400 mb-2 font-bold uppercase">Power Split</div>
                                    <div className="flex items-center h-5 rounded-full overflow-hidden bg-slate-800">
                                        <div
                                            className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 flex items-center justify-center text-[9px] font-bold text-white transition-all duration-500"
                                            style={{ width: `${totalPower > 0 ? (simState.fcPower / totalPower * 100) : 0}%` }}
                                        >
                                            {totalPower > 0 && simState.fcPower > 0 ? `${(simState.fcPower / totalPower * 100).toFixed(0)}%` : ''}
                                        </div>
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-500 to-blue-400 flex items-center justify-center text-[9px] font-bold text-white transition-all duration-500"
                                            style={{ width: `${totalPower > 0 ? (simState.battPower / totalPower * 100) : 0}%` }}
                                        >
                                            {totalPower > 0 && simState.battPower > 0 ? `${(simState.battPower / totalPower * 100).toFixed(0)}%` : ''}
                                        </div>
                                    </div>
                                    <div className="flex justify-between text-[10px] mt-1 text-slate-500">
                                        <span>FC: {simState.fcPower.toFixed(1)} kW</span>
                                        <span>Batt: {simState.battPower.toFixed(1)} kW</span>
                                    </div>
                                </div>

                                {/* Logic Equations */}
                                <div className="font-mono text-[10px] space-y-1 bg-slate-950 rounded-lg p-2 border border-slate-800">
                                    <div className={`p-1.5 rounded ${simState.mode === 'IDLE' ? 'bg-slate-700 text-white' : 'text-slate-500'}`}>
                                        <span className="text-purple-400">if</span> P_demand == 0 → IDLE
                                    </div>
                                    <div className={`p-1.5 rounded ${simState.mode === 'REGEN' ? 'bg-emerald-900/50 text-emerald-300' : 'text-slate-500'}`}>
                                        <span className="text-purple-400">elif</span> P &lt; 0 → REGEN
                                    </div>
                                    <div className={`p-1.5 rounded ${simState.mode === 'EV' ? 'bg-blue-900/50 text-blue-300' : 'text-slate-500'}`}>
                                        <span className="text-purple-400">elif</span> SOC &gt; min → EV
                                    </div>
                                    <div className={`p-1.5 rounded ${simState.mode === 'HYBRID' ? 'bg-purple-900/50 text-purple-300' : 'text-slate-500'}`}>
                                        <span className="text-purple-400">else</span> → HYBRID
                                    </div>
                                </div>
                            </div>

                            {/* Connection Points */}
                            <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-3">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="w-3 h-3 bg-purple-600 border-2 border-purple-300 rounded-sm shadow-lg" />
                                ))}
                            </div>
                            <div className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 flex flex-col gap-6">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="w-3 h-3 bg-emerald-600 border-2 border-emerald-300 rounded-sm shadow-lg" />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT PANEL: OUTPUT SIGNALS & METRICS */}
                    <div className="col-span-3 border-l border-slate-800 bg-slate-900/30 p-4 flex flex-col gap-2 overflow-y-auto relative z-10">
                        <div className="flex items-center gap-2 mb-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Output Signals
                            <ArrowRight className="w-4 h-4" />
                        </div>

                        <SignalPort
                            label="P_batt"
                            value={simState.battPower.toFixed(1)}
                            unit="kW"
                            direction="output"
                            color={simState.battPower < 0 ? "text-emerald-400" : "text-blue-400"}
                            isActive={Math.abs(simState.battPower) > 0.1}
                            description="Battery power output command"
                        />

                        <SignalPort
                            label="P_fc"
                            value={simState.fcPower.toFixed(1)}
                            unit="kW"
                            direction="output"
                            color="text-cyan-400"
                            isActive={simState.fcPower > 0}
                            description="Fuel cell power output command"
                        />

                        <SignalPort
                            label="Status"
                            value={simState.mode}
                            direction="output"
                            color={modeColors[simState.mode]}
                            isActive={true}
                            description="Current operating mode status"
                        />

                        {/* System Health */}
                        <div className="mt-4 pt-4 border-t border-slate-800">
                            <div className="flex items-center gap-2 mb-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                <Activity className="w-4 h-4" />
                                System Health
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-400 flex items-center gap-2">
                                        <Battery className="w-4 h-4" /> Battery
                                    </span>
                                    <span className={`font-bold ${simState.soc > 50 ? 'text-emerald-400' : simState.soc > 20 ? 'text-amber-400' : 'text-red-400'}`}>
                                        {simState.soc > 50 ? 'GOOD' : simState.soc > 20 ? 'LOW' : 'CRITICAL'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-400 flex items-center gap-2">
                                        <Gauge className="w-4 h-4" /> Fuel Cell
                                    </span>
                                    <span className={`font-bold ${simState.fcPower > 0 ? 'text-cyan-400' : 'text-slate-500'}`}>
                                        {simState.fcPower > 0 ? 'ACTIVE' : 'STANDBY'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-400 flex items-center gap-2">
                                        <Zap className="w-4 h-4" /> Power Flow
                                    </span>
                                    <span className={`font-bold ${totalPower > 0 ? 'text-orange-400' : totalPower < 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                                        {totalPower > 0 ? 'DISCHARGE' : totalPower < 0 ? 'CHARGE' : 'IDLE'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Efficiency Metrics */}
                        <div className="mt-4 bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                            <div className="text-xs text-slate-400 font-bold uppercase mb-3">Efficiency Metrics</div>
                            <div className="grid grid-cols-2 gap-4 text-center">
                                <div>
                                    <div className="text-2xl font-bold text-purple-400">
                                        {totalPower > 0 ? ((simState.fcPower / params.maxFcPower) * 100).toFixed(0) : 0}%
                                    </div>
                                    <div className="text-[10px] text-slate-500 uppercase">FC Load</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-blue-400">
                                        {simState.h2Mass.toFixed(2)}
                                    </div>
                                    <div className="text-[10px] text-slate-500 uppercase">H2 kg</div>
                                </div>
                            </div>
                        </div>

                        {/* Selected Signal Info */}
                        {selectedSignal && (
                            <div className="mt-4 bg-purple-500/10 rounded-xl p-4 border border-purple-500/30">
                                <div className="text-xs text-purple-300 font-bold uppercase mb-2">Selected: {selectedSignal}</div>
                                <div className="text-sm text-slate-300">
                                    {selectedSignal === 'P_demand' && `Current power demand is ${totalPower.toFixed(1)} kW`}
                                    {selectedSignal === 'SOC' && `Battery is at ${simState.soc.toFixed(1)}% charge`}
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default EMSmain;
