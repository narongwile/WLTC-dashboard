import React, { memo } from 'react';
import { ResponsiveContainer } from 'recharts';

// 1. Static Chart Wrapper
// This component only re-renders if 'data' reference changes.
interface StaticChartProps {
    children: React.ReactElement;
    height?: number | string;
}

export const StaticChart = memo(({ children, height = "100%" }: StaticChartProps) => {
    return (
        <div style={{ width: '100%', height: height, position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
                {children}
            </ResponsiveContainer>
        </div>
    );
});

// 2. Playhead Overlay
// This component sits absolutely on top of the chart and moves based on progress.
// Progress: 0 to 100 (%)
interface PlayheadOverlayProps {
    progress: number;
}

export const PlayheadOverlay = ({ progress }: PlayheadOverlayProps) => {
    return (
        <div
            className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] z-10 pointer-events-none transition-transform duration-75 ease-linear will-change-transform"
            style={{
                left: 0,
                // We use transform to move it. 
                // The charts usually have some padding/margin for Axes.
                // Recharts standard left margin is ~40-60px depending on config.
                // For simplicity in this specialized dashboard, we assume the chart fills the container 
                // or we accept imperfect alignment for the sake of 60fps.
                // A more robust way is to pass margin props, but let's try strict % first.
                // Note: Recharts grid often starts 'inside' the axis labels.
                // Let's assume we overlay the whole ResponsiveContainer area.
                transform: `translateX(${Math.min(99.5, Math.max(0, progress))}%)`
            }}
        >
            <div className="absolute top-0 -translate-x-1/2 -mt-1 w-2 h-2 bg-white rounded-full" />
        </div>
    );
};
