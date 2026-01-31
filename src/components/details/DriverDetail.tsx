import React, { useEffect, useState, useRef } from 'react';
import { X, Activity, Zap } from 'lucide-react';
import type { ForceData } from '../../types';

interface InverterDetailProps {
    onClose: () => void;
    forces: ForceData;
    currentSpeed?: number; // m/s, to derive frequency
}

const InverterDetail: React.FC<InverterDetailProps> = ({ onClose, forces, currentSpeed = 0 }) => {
    // Canvas for PWM Drawing
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [freq, setFreq] = useState(1);

    // Derived Stats
    const power = Math.abs(forces.power);
    const dcVoltage = 350; // V
    const current = (power * 1000) / dcVoltage;

    // Update Frequency based on Speed
    useEffect(() => {
        // approx 100Hz max
        setFreq(Math.max(1, currentSpeed * 2));
    }, [currentSpeed]);

    // Draw Loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrame: number;
        let time = 0;

        const draw = () => {
            const w = canvas.width;
            const h = canvas.height;
            const cy = h / 2;

            ctx.clearRect(0, 0, w, h);

            // Draw Grid
            ctx.strokeStyle = '#334155'; // slate-700
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, cy); ctx.lineTo(w, cy);
            ctx.stroke();

            // Draw Sine Wave (Reference)
            ctx.beginPath();
            ctx.strokeStyle = '#3b82f6'; // blue-500
            ctx.lineWidth = 2;
            for (let x = 0; x < w; x++) {
                // Freq modifies wavelength
                // Amplitude fixed for visual
                const y = cy + Math.sin((x + time) * 0.05 * freq) * (h * 0.4);
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();

            // Draw PWM (Switching) - Approximated
            // We draw rectangles that "fill" the area under sine with duty cycle
            ctx.fillStyle = 'rgba(16, 185, 129, 0.3)'; // emerald, low opacity
            const pwmWidth = 10;
            for (let x = 0; x < w; x += pwmWidth) {
                // Sample sine at this point
                const sinVal = Math.sin((x + time) * 0.05 * freq); // -1 to 1
                const duty = Math.abs(sinVal); // 0 to 1
                // Draw bar centered on y
                // Height based on voltage (full rail)
                // Width based on duty cycle? Just fill height with duty cycle probability?
                // Visual approximation: Bar height is full, Width is modulated? 
                // Easier: Bar height is fixed (DC Bus), Width varies.
                // Let's draw centered width bars.
                const barH = h * 0.8; // DC Bus
                const barW = pwmWidth * duty;
                if (sinVal > 0) {
                    ctx.fillRect(x + (pwmWidth - barW) / 2, cy - barH / 2, barW, barH / 2);
                } else {
                    ctx.fillRect(x + (pwmWidth - barW) / 2, cy, barW, barH / 2);
                }
            }

            time += 2;
            animationFrame = requestAnimationFrame(draw);
        };

        draw();
        return () => cancelAnimationFrame(animationFrame);
    }, [freq]);

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in zoom-in-95">
            <div className="bg-[#0f172a] border border-slate-700 w-full max-w-3xl rounded-2xl shadow-2xl p-6 relative">
                <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-white">
                    <X className="w-6 h-6" />
                </button>

                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-rose-500/20 rounded-xl border border-rose-500/50">
                        <Activity className="w-8 h-8 text-rose-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Inverter / Power Electronics</h2>
                        <div className="text-sm text-slate-400">DC/AC Conversion • PWM Switching Analysis</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* STATS */}
                    <div className="lg:col-span-1 space-y-4">
                        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                            <div className="text-xs text-slate-500 mb-1">DC BUS VOLTAGE</div>
                            <div className="text-2xl font-mono font-bold text-white">350 <span className="text-sm text-slate-400">V</span></div>
                        </div>
                        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                            <div className="text-xs text-slate-500 mb-1">PHASE CURRENT</div>
                            <div className="text-2xl font-mono font-bold text-blue-400">{current.toFixed(1)} <span className="text-sm text-slate-400">A</span></div>
                        </div>
                        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                            <div className="text-xs text-slate-500 mb-1">SWITCHING FREQ</div>
                            <div className="text-2xl font-mono font-bold text-slate-200">10 <span className="text-sm text-slate-400">kHz</span></div>
                        </div>
                    </div>

                    {/* PWM VISUALIZATION */}
                    <div className="lg:col-span-2 bg-slate-950 rounded-xl border border-slate-800 p-4 flex flex-col">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-xs font-bold text-slate-400">PHASE A OUTPUT (PWM)</h3>
                            <div className="text-[10px] text-emerald-500 flex items-center gap-1">
                                <Zap className="w-3 h-3" /> LIVE SIGNAL
                            </div>
                        </div>
                        <div className="flex-1 relative rounded border border-slate-900 overflow-hidden bg-slate-900">
                            <canvas ref={canvasRef} width={500} height={250} className="w-full h-full" />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500 mt-2">
                            <span>0 deg</span>
                            <span>180 deg</span>
                            <span>360 deg</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InverterDetail;
