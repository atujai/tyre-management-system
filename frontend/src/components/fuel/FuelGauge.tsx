import React from 'react';

interface FuelGaugeProps {
  level: number;
  volume: number;
  capacity: number;
}

export const FuelGauge: React.FC<FuelGaugeProps> = ({ level, volume, capacity }) => {
  const getColor = () => {
    if (level > 50) return 'text-green-400';
    if (level > 25) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getStrokeColor = () => {
    if (level > 50) return '#4ade80';
    if (level > 25) return '#facc15';
    return '#f87171';
  };

  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (level / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        <svg className="transform -rotate-90 w-32 h-32">
          <circle
            cx="64"
            cy="64"
            r="40"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-slate-700"
          />
          <circle
            cx="64"
            cy="64"
            r="40"
            stroke={getStrokeColor()}
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-2xl font-bold ${getColor()}`}>
            {level.toFixed(1)}%
          </span>
          <span className="text-slate-400 text-xs">
            {volume.toFixed(1)} / {capacity} L
          </span>
        </div>
      </div>
    </div>
  );
};