import React from 'react';
import { Navigation } from 'lucide-react';

interface RouteMapProps {
    progress: number; // 0-100
}

const RouteMap: React.FC<RouteMapProps> = ({ progress }) => {
    // Generate a "Track" that looks like WLTC (Stop-go city, then fast highway)
    // We'll use a fixed SVG path

    // Calculate position along path (simplified linear interpolation on viewbox for now)
    // Real impl would use getPointAtLength

    // Let's rely on CSS offset-path if supported or just simple percent approximation?
    // React doesn't support offset-path well in all browsers for SVG elements comfortably without refs.
    // Let's usage percent approximation for the marker.
    // Actually, visual approximation:
    // P1 (City): 0-30% -> x=50..120
    // P2 (Suburban): 30-60% -> x=120..250
    // P3 (Highway): 60-100% -> x=250..450
    // This is too hard to hardcode.
    // Let's use a simple straight line visualization mapped to "Distance" or just visually nice.
    // actually, let's try a CSS motion path on the marker?

    // Better: Render a "Track" and just show the % completion bar below it, 
    // and a "GPS Signal" marker that just moves L->R for simplicity.
    // "GPS/Map Data" was the request.

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 h-full relative overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4 z-10">
                <h3 className="text-sm font-semibold text-slate-400 flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-emerald-500" /> GPS TRACE
                </h3>
                <div className="text-xs text-slate-500 font-mono">WLTC CLASS 3b</div>
            </div>

            {/* Map Container */}
            <div className="flex-1 rounded-lg bg-[#0b1121] relative border border-slate-800 overflow-hidden">
                {/* Grid */}
                <div className="absolute inset-0 opacity-20"
                    style={{ backgroundImage: 'linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                </div>

                {/* The Track Line */}
                <svg className="absolute inset-0 w-full h-full p-4" viewBox="0 0 500 300" preserveAspectRatio="xMidYMid meet">
                    {/* City Section (Low Speed) */}
                    <path d="M 50,250 L 100,250 L 120,200 L 100,150 L 150,150" fill="none" stroke="#22d3ee" strokeWidth="4" strokeLinecap="round" strokeOpacity={0.3} />
                    {/* Suburb */}
                    <path d="M 150,150 L 200,150 L 220,200 L 280,200" fill="none" stroke="#e879f9" strokeWidth="4" strokeLinecap="round" strokeOpacity={0.3} />
                    {/* Highway */}
                    <path d="M 280,200 L 320,100 L 450,100" fill="none" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" strokeOpacity={0.3} />

                    {/* Active Path (Masked by progress?) No, just a marker moving L->R broadly */}
                </svg>

                {/* Car Marker - Simply moves Left to Right based on progress for this demo */}
                <div
                    className="absolute top-1/2 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-[0_0_10px_#10b981] transition-all duration-300 ease-linear z-20"
                    style={{
                        left: `${10 + (progress * 0.8)}%`, // 10% to 90%
                        top: '50%',
                        transform: 'translate(-50%, -50%)'
                    }}
                >
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-1 rounded whitespace-nowrap border border-slate-700">
                        {progress.toFixed(0)}%
                    </div>
                </div>

                {/* Zones Labels */}
                <div className="absolute bottom-2 left-4 text-[10px] text-cyan-500">CITY</div>
                <div className="absolute bottom-2 left-[40%] text-[10px] text-purple-500">SUBURBAN</div>
                <div className="absolute top-2 right-4 text-[10px] text-amber-500">HIGHWAY</div>
            </div>

            {/* Legend */}
            <div className="mt-2 flex gap-4 text-[10px] text-slate-500">
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-cyan-500"></div> Low Speed</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-purple-500"></div> Med Speed</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500"></div> High Speed</div>
            </div>
        </div>
    );
};

export default RouteMap;
