
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
      <svg width={width} height={height} className="mt-2">
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
    <div className="bg-surface-elevated p-4 rounded-lg border border-border hover:border-border-hover transition-colors">
      <div className="flex items-center gap-4">
        <div className="bg-primary/20 p-3 rounded-md border border-primary/30 text-primary">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <p className="text-sm text-on-surface-secondary font-medium flex-shrink-0">{title}</p>
            {showActionBadge && (
              <span className="px-2.5 py-1 text-xs bg-red-500/20 text-red-700 rounded-full font-semibold whitespace-nowrap">
                Action Needed
              </span>
            )}
          </div>
          <p className="text-2xl font-bold text-on-surface">{value}</p>
          {renderSparkline()}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
