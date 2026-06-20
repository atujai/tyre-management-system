import React from 'react';

interface Props {
  title: string;
  value: string | number;
  total?: number;
  color: 'green' | 'blue' | 'red' | 'cyan' | 'purple' | 'orange';
}

export const StatsCard: React.FC<Props> = ({ title, value, total, color }) => {
  const colorClasses = {
    green: 'bg-green-500/10 text-green-400 border-green-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  };

  return (
    <div className={`p-4 rounded-xl border ${colorClasses[color]}`}>
      <p className="text-xs uppercase tracking-wider opacity-70 mb-1">{title}</p>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold">{value}</span>
        {total !== undefined && (
          <span className="text-sm opacity-60">/ {total}</span>
        )}
      </div>
    </div>
  );
};