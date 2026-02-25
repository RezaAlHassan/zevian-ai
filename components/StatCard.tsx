
import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  sparklineData?: number[]; // Array of values for sparkline trend
  showActionBadge?: boolean; // Show "Action Needed" badge
}


const StatCard: React.FC<StatCardProps> = ({ title, value, icon, sparklineData, showActionBadge }) => {
  // Generate sparkline SVG if data is provided
  const renderSparkline = () => {
    if (!sparklineData || sparklineData.length < 2) return null;

    const width = 80;
    const height = 30;
    const padding = 4;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Normalize data to fit within chart bounds
    const min = Math.min(...sparklineData);
    const max = Math.max(...sparklineData);
    const range = max - min || 1; // Avoid division by zero

    const points = sparklineData.map((val, index) => {
      const x = padding + (index / (sparklineData.length - 1)) * chartWidth;
      const y = padding + chartHeight - ((val - min) / range) * chartHeight;
      return `${x},${y}`;
    }).join(' ');

    // Determine trend color (green for positive trend, red for negative)
    const firstValue = sparklineData[0];
    const lastValue = sparklineData[sparklineData.length - 1];
    const trendColor = lastValue >= firstValue ? '#10b981' : '#ef4444';

    return (
      <svg width={width} height={height} className="mt-1 opacity-80">
        <polyline
          points={points}
          fill="none"
          stroke={trendColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  return (
    <div className="bg-card p-4 rounded-xl border border-border hover:border-primary/30 transition-colors flex flex-col justify-between h-full shadow-sm">
      {/* Header: Icon + Title */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 bg-muted rounded-md text-muted-foreground shrink-0 [&>svg]:w-4 [&>svg]:h-4">
            {icon}
          </div>
          <h4 className="font-semibold text-foreground text-sm truncate" title={title}>{title}</h4>
        </div>
        {showActionBadge && (
          <span className="flex-shrink-0 w-2 h-2 rounded-full bg-red-500" title="Action Needed" />
        )}
      </div>

      {/* Body: Value + Sparkline */}
      <div className="flex items-end justify-between gap-2">
        <div className="min-w-0">
          <p className="text-2xl font-bold text-foreground tracking-tight truncate" title={String(value)}>{value}</p>
        </div>
        <div className="flex flex-col items-end">
          {renderSparkline()}
          {showActionBadge && <p className="text-[10px] text-red-500 font-medium mt-0.5">Action Needed</p>}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
