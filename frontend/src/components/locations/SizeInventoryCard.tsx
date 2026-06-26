// components/locations/SizeInventoryCard.tsx
import React from 'react';
import { Package, Circle, Disc } from 'lucide-react';
import type { TyreSizeCount, TyreCondition } from '../../types/location.types';

const CONDITION_COLORS: Record<TyreCondition, { bg: string; text: string; bar: string }> = {
  NEW:       { bg: 'bg-emerald-500/10', text: 'text-emerald-400', bar: 'bg-emerald-500' },
  REPAIR:    { bg: 'bg-amber-500/10',  text: 'text-amber-400',  bar: 'bg-amber-500' },
  RETREAD:   { bg: 'bg-blue-500/10',   text: 'text-blue-400',   bar: 'bg-blue-500' },
  WORN:      { bg: 'bg-orange-500/10', text: 'text-orange-400', bar: 'bg-orange-500' },
  SCRAP:     { bg: 'bg-red-500/10',    text: 'text-red-400',    bar: 'bg-red-500' },
  REJECTED:  { bg: 'bg-rose-500/10',   text: 'text-rose-400',   bar: 'bg-rose-500' },
};

const CONDITIONS: TyreCondition[] = ['NEW', 'REPAIR', 'RETREAD', 'WORN', 'SCRAP', 'REJECTED'];

interface SizeInventoryCardProps {
  sizeGroup: TyreSizeCount;
  onConditionClick: (condition: TyreCondition) => void;
  onCardClick: () => void;
}

export const SizeInventoryCard: React.FC<SizeInventoryCardProps> = ({
  sizeGroup,
  onConditionClick,
  onCardClick,
}) => {
  const maxCount = Math.max(...CONDITIONS.map(c => sizeGroup.conditions[c]?.count || 0), 1);

  return (
    <div 
      className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden hover:border-slate-600 transition-all cursor-pointer"
      onClick={onCardClick}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-700">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">{sizeGroup.size}</h3>
            <p className="text-sm text-slate-400">{sizeGroup.brand} · {sizeGroup.pattern}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-white">{sizeGroup.total}</p>
            <p className="text-xs text-slate-500">Total</p>
          </div>
        </div>

        {/* Rim summary */}
        <div className="flex items-center gap-3 mt-2 text-xs">
          <span className="flex items-center gap-1 text-blue-400">
            <Disc className="w-3 h-3" /> {sizeGroup.withRim} with rim
          </span>
          <span className="flex items-center gap-1 text-slate-400">
            <Circle className="w-3 h-3" /> {sizeGroup.withoutRim} without
          </span>
        </div>
      </div>

      {/* Condition Breakdown */}
      <div className="p-3 space-y-2">
        {CONDITIONS.map((condition) => {
          const data = sizeGroup.conditions[condition];
          if (!data || data.count === 0) return null;

          const colors = CONDITION_COLORS[condition];
          const percentage = (data.count / sizeGroup.total) * 100;

          return (
            <button
              key={condition}
              onClick={(e) => {
                e.stopPropagation();
                onConditionClick(condition);
              }}
              className={`w-full flex items-center gap-3 p-2 rounded-lg ${colors.bg} hover:brightness-110 transition-all`}
            >
              <span className={`text-xs font-medium ${colors.text} w-16 text-left`}>
                {condition}
              </span>

              {/* Progress bar */}
              <div className="flex-1 h-2 bg-slate-700/50 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${colors.bar} rounded-full transition-all`}
                  style={{ width: `${(data.count / maxCount) * 100}%` }}
                />
              </div>

              <div className="text-right min-w-[80px]">
                <span className={`text-sm font-bold ${colors.text}`}>{data.count}</span>
                <span className="text-xs text-slate-500 ml-1">({percentage.toFixed(0)}%)</span>
              </div>

              {/* Rim indicators */}
              <div className="flex items-center gap-1 text-xs text-slate-500">
                {data.withRim > 0 && (
                  <span className="flex items-center gap-0.5" title="With rim">
                    <Disc className="w-3 h-3 text-blue-400" />{data.withRim}
                  </span>
                )}
                {data.withoutRim > 0 && (
                  <span className="flex items-center gap-0.5" title="Without rim">
                    <Circle className="w-3 h-3 text-slate-400" />{data.withoutRim}
                  </span>
                )}
              </div>
            </button>
          );
        })}

        {CONDITIONS.every(c => !sizeGroup.conditions[c]?.count) && (
          <div className="text-center py-4 text-slate-500 text-sm">
            <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
            No tyres in this size
          </div>
        )}
      </div>
    </div>
  );
};
