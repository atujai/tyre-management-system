import React from 'react';

interface Props {
  used: number;
  total: number;
}

export const StorageBar: React.FC<Props> = ({ used, total }) => {
  const percentage = total > 0 ? (used / total) * 100 : 0;
  
  return (
    <div>
      <div className="w-full h-4 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            percentage > 90 ? 'bg-red-500' : percentage > 70 ? 'bg-yellow-500' : 'bg-green-500'
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <div className="flex justify-between mt-2 text-xs">
        <span className="text-slate-400">{percentage.toFixed(1)}% used</span>
        <span className="text-slate-400">{((total - used) / 1024 / 1024 / 1024).toFixed(1)} GB free</span>
      </div>
    </div>
  );
};