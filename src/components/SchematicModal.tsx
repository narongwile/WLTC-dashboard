import React from 'react';
import { Workflow, X, Battery, Cpu, Zap, Disc, Flame, Cylinder, Settings } from 'lucide-react';
import type { SimulationState, ForceData, VehicleParams } from '../types';

interface SchematicModalProps {
    onClose: () => void;
    simState: SimulationState;
    forces: ForceData;
    params?: VehicleParams;
    onBlockClick?: (block: string) => void;
}

const SchematicModal: React.FC<SchematicModalProps> = ({ onClose, simState, forces, params, onBlockClick }) => {
    const power = forces.power; // kW
    const isRegen = power < 0;
    const flowColor = isRegen ? "#10b981" : "#ef4444"; // Green for regen, Red for discharge

    // Block Component Helper
    const Block = ({ title, icon: Icon, value, sub, x, y, id }: any) => (
        <div
            onClick={() => onBlockClick && onBlockClick(id)}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 bg-slate-800 border-2 border-slate-600 rounded-lg p-4 w-40 flex flex-col items-center gap-2 shadow-xl z-10 hover:border-blue-500 cursor-pointer transition-colors group hover:scale-105 duration-200"
            style={{ left: x, top: y }}>
            <div className="text-slate-400 mb-1 group-hover:text-white transition-colors uppercase text-xs font-bold tracking-wider">{title}</div>
            <Icon className="w-8 h-8 text-blue-400 group-hover:text-blue-300" />
            <div className="font-mono font-bold text-white text-lg">{value}</div>
            <div className="text-xs text-slate-500">{sub}</div>
            <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                INSPECT
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:p-12 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-slate-950 border border-slate-800 w-full max-w-6xl h-full max-h-[800px] rounded-2xl shadow-2xl flex flex-col relative overflow-hidden">

                {/* Modal Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-800 bg-slate-900">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <Workflow className="text-blue-500 w-6 h-6" />
                            Powertrain Schematics
                        </h2>
                        <p className="text-slate-400 text-sm">Real-time Energy Flow Analysis</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Diagram Area */}
                <div className="flex-1 relative bg-slate-950 overflow-hidden">
                    {/* Background Grid */}
                    <div className="absolute inset-0 opacity-20"
                        style={{ backgroundImage: 'radial-gradient(#475569 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
                    </div>

                    {/* SVG Wires Layer */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                        <defs>
                            <marker id="arrow-flow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                                <polygon points="0 0, 10 3.5, 0 7" fill={flowColor} />
                            </marker>
                        </defs>

                        {/* H2 Pipe */}
                        <line x1="30%" y1="30%" x2="50%" y2="30%" stroke="#06b6d4" strokeWidth="6" strokeDasharray="5,5" className="animate-pulse" />

                        {/* FC -> EMS */}
                        <line x1="50%" y1="30%" x2="50%" y2="55%" stroke="#06b6d4" strokeWidth={Math.max(2, simState.fcPower / 5)} className="animate-pulse" />

                        {/* Batt <-> EMS */}
                        <line x1="30%" y1="55%" x2="50%" y2="55%" stroke={simState.battPower > 0 ? "#10b981" : "#f59e0b"} strokeWidth={Math.abs(simState.battPower) / 5} className="animate-pulse" />

                        {/* EMS -> Inverter */}
                        <line x1="50%" y1="55%" x2="50%" y2="80%" stroke="#ef4444" strokeWidth={Math.abs(forces.power) / 5} />

                        {/* Inverter -> Motor */}
                        <line x1="50%" y1="80%" x2="70%" y2="80%" stroke="#ef4444" strokeWidth={Math.abs(forces.power) / 5} />

                        {/* Motor -> Wheels */}
                        <line x1="70%" y1="80%" x2="90%" y2="80%" stroke="#64748b" strokeWidth="4" />
                    </svg>

                    {/* Blocks Layer - FCEV HYBRID LAYOUT */}
                    <div className="relative w-full h-full">

                        {/* Top Row: Power Generation */}
                        {/* 1. H2 TANK */}
                        <Block title="H2 TANK" icon={Cylinder} x="30%" y="30%" id="h2"
                            value={`${simState.h2Mass.toFixed(2)} kg`}
                            sub="700 bar" />

                        {/* 2. FUEL CELL */}
                        <Block title="FUEL CELL" icon={Flame} x="50%" y="30%" id="fc"
                            value={`${simState.fcPower.toFixed(1)} kW`}
                            sub="Proton Exchange" />

                        {/* Middle: EMS / DC-Link */}
                        {/* 3. EMS / DC-LINK */}
                        <Block title="EMS / DC-LINK" icon={Cpu} x="50%" y="55%" id="ems"
                            value={simState.mode}
                            sub={`Split: ${(simState.fcPower > 0 ? (simState.fcPower / (simState.fcPower + Math.abs(simState.battPower)) * 100) : 0).toFixed(0)}% FC`} />

                        {/* 4. BATTERY (Buffer) */}
                        <Block title="HV BATTERY" icon={Battery} x="30%" y="55%" id="battery"
                            value={`${simState.soc.toFixed(1)} %`}
                            sub={`${simState.battPower.toFixed(1)} kW`} />


                        {/* Bottom Row: Traction */}
                        {/* 5. INVERTER */}
                        <Block title="INVERTER" icon={Zap} x="50%" y="80%" id="inverter"
                            value={`${forces.power.toFixed(1)} kW`}
                            sub="AC/DC Conv" />

                        {/* 6. MOTOR */}
                        <Block title="E-MOTOR" icon={Zap} x="70%" y="80%" id="motor"
                            value={`${(simState.velocity * 3.6).toFixed(0)} km/h`}
                            sub="Induction" />

                        {/* 7. TRANSMISSION */}
                        <Block title="GEARBOX" icon={Settings} x="82%" y="80%" id="transmission"
                            value={`${params ? params.gearRatio : 9.0}:1`}
                            sub="Diff" />

                        {/* 8. WHEELS */}
                        <Block title="WHEELS" icon={Disc} x="94%" y="80%" id="dynamics"
                            value={`${forces.ftotal.toFixed(0)} N`}
                            sub="Traction" />

                    </div>

                    {/* Legend */}
                    <div className="absolute bottom-8 left-8 bg-slate-900/80 p-4 rounded-lg border border-slate-700 text-xs text-slate-400">
                        <div className="font-bold mb-2 text-white">SIGNAL FLOW</div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-4 h-1 bg-red-500"></div> Discharge (Propulsion)
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-1 bg-emerald-500"></div> Regen (Braking)
                        </div>
                        <div className="mt-2 text-blue-400 italic">
                            * Click any block to inspect details
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SchematicModal;
