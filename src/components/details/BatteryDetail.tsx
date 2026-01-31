import React, { useMemo } from 'react';
import { X, Battery, AlertTriangle } from 'lucide-react';
import type { SimulationState, ForceData } from '../../types';

interface BatteryDetailProps {
    onClose: () => void;
    simState: SimulationState;
    forces: ForceData;
}

const BatteryDetail: React.FC<BatteryDetailProps> = ({ onClose, simState }) => {
    // 1. Pack Stats
    const soc = simState.soc;
    // Assume 400V architecture for 15kWh buffer? 
    // Maybe smaller. 15kWh capacity. 
    // Let's assume 96s (350V roughly).
    // OCV Curve approximation
    // SOC 100% -> 4.2V, 0% -> 3.0V
    const cellV_avg = 3.0 + (1.2 * (soc / 100));

    // 2. Cell Simulation (96 Cells in Series)
    const cells = useMemo(() => {
        // Generate variations
        return Array.from({ length: 96 }).map((_, i) => {
            // Random noise +/- 0.02V
            const noise = (Math.random() - 0.5) * 0.04;
            // Introduce a "Weak Cell" at index 42
            const isWeak = i === 42;
            const voltage = Math.max(2.5, cellV_avg + noise - (isWeak ? 0.05 : 0));
            return {
                id: i + 1,
                voltage,
                temp: 35 + Math.random() * 2 // deg C
            };
        });
    }, [cellV_avg]); // Re-generate on SOC change (roughly frames)

    // Find Min/Max
    const minCell = cells.reduce((prev, curr) => prev.voltage < curr.voltage ? prev : curr);
    const maxCell = cells.reduce((prev, curr) => prev.voltage > curr.voltage ? prev : curr);
    const balanceDelta = maxCell.voltage - minCell.voltage;

    const packVoltage = cells.reduce((acc, c) => acc + c.voltage, 0);

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in zoom-in-95">
            <div className="bg-[#0f172a] border border-slate-700 w-full max-w-5xl rounded-2xl shadow-2xl p-6 relative">
                <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-white">
                    <X className="w-6 h-6" />
                </button>

                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-emerald-500/20 rounded-xl border border-emerald-500/50">
                        <Battery className="w-8 h-8 text-emerald-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">BMS Cell Monitor</h2>
                        <div className="text-sm text-slate-400">96-Series Topology • Real-time Balancing</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* LEFT: PACK STATS */}
                    <div className="lg:col-span-1 space-y-4">
                        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                            <div className="text-xs text-slate-500 mb-1">PACK VOLTAGE</div>
                            <div className="text-2xl font-mono font-bold text-white">{packVoltage.toFixed(1)} V</div>
                        </div>
                        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                            <div className="text-xs text-slate-500 mb-1">CURRENT (I)</div>
                            {/* P = VI -> I = P/V */}
                            <div className={`text-2xl font-mono font-bold ${simState.battPower > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                {((simState.battPower * 1000) / packVoltage).toFixed(1)} A
                            </div>
                        </div>
                        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                            <div className="text-xs text-slate-500 mb-1">CELL DELTA</div>
                            <div className={`text-xl font-mono font-bold ${balanceDelta > 0.05 ? 'text-amber-400' : 'text-slate-200'}`}>
                                {(balanceDelta * 1000).toFixed(0)} mV
                            </div>
                            {balanceDelta > 0.1 && <div className="text-[10px] text-amber-500 flex items-center gap-1 mt-1"><AlertTriangle className="w-3 h-3" /> Balancing Active</div>}
                        </div>
                    </div>

                    {/* RIGHT: CELL GRID */}
                    <div className="lg:col-span-3 bg-slate-950 rounded-xl border border-slate-800 p-4 overflow-y-auto max-h-[60vh]">
                        <div className="flex justify-between items-center mb-4 px-2">
                            <h3 className="text-sm font-bold text-slate-400">INDIVIDUAL CELL VOLTAGES</h3>
                            <div className="flex gap-4 text-xs">
                                <span className="flex items-center gap-1 text-slate-400"><div className="w-2 h-2 rounded-full bg-slate-700"></div> Normal</span>
                                <span className="flex items-center gap-1 text-rose-400"><div className="w-2 h-2 rounded-full bg-rose-500"></div> Min</span>
                                <span className="flex items-center gap-1 text-emerald-400"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Max</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-8 md:grid-cols-12 gap-2">
                            {cells.map((cell) => {
                                const isMin = cell.id === minCell.id;
                                const isMax = cell.id === maxCell.id;
                                return (
                                    <div key={cell.id}
                                        className={`p-1 rounded text-center border text-[10px] font-mono transition-colors
                                            ${isMin ? 'bg-rose-900/50 border-rose-500 text-rose-200' :
                                                isMax ? 'bg-emerald-900/50 border-emerald-500 text-emerald-200' :
                                                    'bg-slate-900 border-slate-800 text-slate-400'}`}
                                        title={`Cell ${cell.id}: ${cell.voltage.toFixed(3)}V`}
                                    >
                                        <div className="opacity-50 text-[8px]">{cell.id}</div>
                                        <div>{cell.voltage.toFixed(2)}</div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BatteryDetail;
