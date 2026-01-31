import React from 'react';
import type { ForceData, VehicleParams } from '../types';

interface CarSchematicProps {
    velocity: number;
    forces: ForceData;
    wheelRotation: number;
    params: VehicleParams;
}

const CarSchematic: React.FC<CarSchematicProps> = ({
    velocity,
    forces,
    wheelRotation
}) => {
    // --- Dynamic Styles ---
    // const wheelSpeed = velocity * 10; // Visual rotation speed factor

    return (
        <div className="relative w-full h-[300px] flex items-center justify-center bg-slate-900 border-2 border-slate-700 rounded-xl overflow-hidden">
            {/* Grid Background */}
            <div className="absolute inset-0 opacity-20"
                style={{ backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
            </div>

            {/* HUD Overlay Elements */}
            <div className="absolute top-4 left-4 font-mono text-xs text-emerald-400 space-y-1">
                <div>SPEED: {(velocity * 3.6).toFixed(1)} km/h</div>
                <div>DRAG:  {forces.faero.toFixed(0)} N</div>
                <div>ROLL:  {forces.froll.toFixed(0)} N</div>
                <div>NET:   {forces.ftotal.toFixed(0)} N</div>
            </div>

            <svg viewBox="0 0 500 250" className="w-full h-full max-w-[600px] drop-shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                <defs>
                    <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* GROUND */}
                <line x1="10" y1="200" x2="490" y2="200" stroke="#334155" strokeWidth="2" />

                {/* CAR WIREFRAME BODY (Cyberpunk Truck/Sedan shape) */}
                {/* Coords: 
                    Front Bumper: 400, 180
                    Hood: 380, 140
                    Roof Front: 300, 110
                    Roof Rear: 150, 110
                    Trunk: 80, 140
                    Rear Bumper: 60, 180
                     + Wheel Arches
                */}
                <path d="
                    M 60,180 L 80,140 L 150,110 L 300,110 L 380,140 L 400,180
                    M 60,180 L 100,180
                    M 160,180 L 320,180
                    M 380,180 L 400,180
                " fill="none" stroke="#60a5fa" strokeWidth="3" strokeLinejoin="round" filter="url(#neon-glow)" />

                {/* Wheels (Wireframe Circles) */}
                <g transform="translate(130, 180)">
                    <circle cx="0" cy="0" r="30" stroke="#94a3b8" strokeWidth="2" fill="none" />
                    {/* Spokes */}
                    <g transform={`rotate(${wheelRotation})`}>
                        <line x1="-30" y1="0" x2="30" y2="0" stroke="#475569" strokeWidth="1" />
                        <line x1="0" y1="-30" x2="0" y2="30" stroke="#475569" strokeWidth="1" />
                    </g>
                </g>
                <g transform="translate(350, 180)">
                    <circle cx="0" cy="0" r="30" stroke="#94a3b8" strokeWidth="2" fill="none" />
                    <g transform={`rotate(${wheelRotation})`}>
                        <line x1="-30" y1="0" x2="30" y2="0" stroke="#475569" strokeWidth="1" />
                        <line x1="0" y1="-30" x2="0" y2="30" stroke="#475569" strokeWidth="1" />
                    </g>
                </g>

                {/* VECTORS (Neon Triangles) */}

                {/* 1. Velocity (Base Forward) - Invisible helper usually, but let's show Net Force if positive */}

                {/* 2. Aerodynamic Drag (Opposing, Top) */}
                {/* Purple Triangle pointing LEFT */}
                {forces.faero > 10 && (
                    <g transform="translate(300, 110)">
                        <path d="M 0,0 L 40,-15 L 40,15 Z" fill="#a855f7" className="animate-pulse" opacity={0.8}>
                            <animateTransform attributeName="transform" type="translate" from="0 0" to="-10 0" dur="1s" repeatCount="indefinite" />
                        </path>
                        {/* Line pointing back */}
                        <line x1="0" y1="0" x2="-60" y2="0" stroke="#a855f7" strokeWidth="4" />
                    </g>
                )}

                {/* 3. Rolling Resistance (Opposing, Bottom) */}
                {/* Amber Triangle pointing LEFT near wheels */}
                {forces.froll > 0 && (
                    <g transform="translate(200, 190)">
                        <polygon points="0,0 20,-10 20,10" fill="#f59e0b" opacity={0.8} />
                        <line x1="0" y1="0" x2="-30" y2="0" stroke="#f59e0b" strokeWidth="3" />
                    </g>
                )}

                {/* 4. NET Force (Forward or Backward) */}
                <g transform="translate(420, 150)">
                    {forces.ftotal > 0 ? (
                        <>
                            {/* Accel: RED Triangle pointing RIGHT */}
                            <polygon points="0,0 -30,-20 -30,20" fill="#ef4444" filter="url(#neon-glow)" />
                            <line x1="-30" y1="0" x2="50" y2="0" stroke="#ef4444" strokeWidth="4" />
                        </>
                    ) : forces.ftotal < 0 ? (
                        <>
                            {/* Decel: Green Triangle pointing LEFT */}
                            <polygon points="0,0 30,-20 30,20" fill="#10b981" filter="url(#neon-glow)" />
                            <line x1="30" y1="0" x2="-50" y2="0" stroke="#10b981" strokeWidth="4" />
                        </>
                    ) : null}
                </g>

            </svg>
        </div>
    );
};
export default CarSchematic;
