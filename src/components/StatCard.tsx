import React from 'react';
import { ResponsiveContainer, LineChart, Line } from 'recharts';

interface StatCardProps {
    title: string;
    value: string | number;
    unit: string;
    subValue?: string;
    icon?: React.ElementType;
    variant?: 'default' | 'sparkline' | 'wind' | 'radial';
    data?: any[];
    dataKey?: string;
    color?: string; // hex
    className?: string;
}

const StatCard: React.FC<StatCardProps> = ({
    title, value, unit, subValue, icon: Icon, variant = 'default', data, dataKey, color = '#3b82f6', className = ''
}) => {

    return (
        <div className={`bg-[#0f172a] border border-slate-800 rounded-2xl p-6 relative overflow-hidden group ${className}`}>
            {/* Header */}
            <div className="flex justify-between items-start mb-2 relative z-10">
                <h3 className="text-xs font-bold text-slate-500 tracking-widest uppercase">{title}</h3>
                {Icon && <Icon className="w-6 h-6 text-slate-700 group-hover:text-slate-600 transition-colors" />}
            </div>

            {/* Content */}
            <div className="relative z-10">
                <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold font-mono text-white">{value}</span>
                    <span className="text-sm font-bold text-slate-600 uppercase">{unit}</span>
                </div>
                {subValue && (
                    <div className="text-xs text-slate-500 mt-1">{subValue}</div>
                )}

                {/* Visual Bar for Default */}
                {variant === 'default' && (
                    <div className="w-12 h-1 bg-blue-500 mt-4 rounded-full"></div>
                )}
            </div>

            {/* Background Visuals based on Variant */}

            {/* 1. Sparkline Visual */}
            {variant === 'sparkline' && data && dataKey && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/2 h-full opacity-50">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                            <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* 2. Wind / Aero Visual */}
            {variant === 'wind' && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20">
                    <svg width="60" height="40" viewBox="0 0 60 40" fill="none" stroke={color} strokeWidth="2">
                        <path d="M0 10 H40 M10 20 H50 M5 30 H45" strokeDasharray="4 4" />
                    </svg>
                </div>
            )}

            {/* 3. Radial Visual (RPM) */}
            {variant === 'radial' && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full border-4 border-slate-800 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                </div>
            )}

        </div>
    );
};

export default StatCard;
