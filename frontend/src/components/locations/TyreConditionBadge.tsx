// components/locations/TyreConditionBadge.tsx
import React from 'react';
import type { TyreCondition } from '../../types/location.types';

const CONDITION_STYLES: Record<TyreCondition, { bg: string; text: string; dot: string }> = {
  NEW:       { bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  REPAIR:    { bg: 'bg-amber-500/15',  text: 'text-amber-400',  dot: 'bg-amber-400' },
  RETREAD:   { bg: 'bg-blue-500/15',   text: 'text-blue-400',   dot: 'bg-blue-400' },
  WORN:      { bg: 'bg-orange-500/15', text: 'text-orange-400', dot: 'bg-orange-400' },
  SCRAP:     { bg: 'bg-red-500/15',    text: 'text-red-400',    dot: 'bg-red-400' },
  REJECTED:  { bg: 'bg-rose-500/15',   text: 'text-rose-400',   dot: 'bg-rose-400' },
};

interface TyreConditionBadgeProps {
  condition: TyreCondition;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
}

export const TyreConditionBadge: React.FC<TyreConditionBadgeProps> = ({
  condition,
  size = 'md',
  showDot = true,
}) => {
  const styles = CONDITION_STYLES[condition];

  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg font-medium ${styles.bg} ${styles.text} ${sizeClasses[size]}`}>
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />
      )}
      {condition}
    </span>
  );
};
