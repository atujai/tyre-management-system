import React from 'react';
import { format } from 'date-fns';

interface Alert {
  id: string;
  type: string;
  severity: string;
  message: string;
  createdAt: string;
  latitude?: number;
  longitude?: number;
  speed?: number;
  acknowledged?: boolean;
}

interface Props {
  alerts: Alert[];
  onAcknowledge?: (id: string) => void;
}

export const AlertPanel: React.FC<Props> = ({ alerts, onAcknowledge }) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'HIGH': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'MEDIUM': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'SPEEDING': return '⚡';
      case 'GEOFENCE_EXIT': return '📍';
      case 'GEOFENCE_ENTER': return '🏠';
      case 'IDLE_ALERT': return '⏱️';
      case 'IGNITION_ON': return '🔑';
      case 'IGNITION_OFF': return '🛑';
      case 'LOW_BATTERY': return '🔋';
      case 'TAMPERING': return '⚠️';
      case 'SOS': return '🆘';
      default: return '📢';
    }
  };

  return (
    <div className="bg-slate-800 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-slate-700 flex justify-between items-center">
        <h3 className="text-white font-semibold">Live Alerts</h3>
        {alerts.length > 0 && (
          <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full text-xs">
            {alerts.filter(a => !a.acknowledged).length}
          </span>
        )}
      </div>
      
      <div className="max-h-[300px] overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-slate-400 text-sm">No active alerts</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700/50">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3 border-l-2 ${
                  alert.acknowledged ? 'border-l-slate-600 opacity-60' : 'border-l-red-500'
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-lg">{getAlertIcon(alert.type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                        {alert.severity}
                      </span>
                      <span className="text-slate-500 text-xs">
                        {format(new Date(alert.createdAt), 'HH:mm')}
                      </span>
                    </div>
                    <p className="text-white text-sm mt-1">{alert.message}</p>
                    {alert.speed && (
                      <p className="text-slate-400 text-xs mt-0.5">
                        Speed: {alert.speed.toFixed(1)} km/h
                      </p>
                    )}
                  </div>
                  {!alert.acknowledged && onAcknowledge && (
                    <button
                      onClick={() => onAcknowledge(alert.id)}
                      className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-xs shrink-0"
                    >
                      ✓
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};