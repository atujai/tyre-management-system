import React from 'react';
import { format } from 'date-fns';

interface Event {
  id: string;
  type: string;
  severity: string;
  description: string;
  timestamp: string;
  speed?: number;
  reviewed: boolean;
}

interface Props {
  dashcamId: string;
}

export const EventTimeline: React.FC<Props> = ({ dashcamId }) => {
  // This would normally fetch events, but we'll accept them as props pattern
  // For now, return a placeholder or integrate with your data fetching
  return (
    <div className="space-y-3">
      <p className="text-slate-400 text-sm">Event timeline for dashcam {dashcamId}</p>
      {/* Events would be mapped here */}
    </div>
  );
};