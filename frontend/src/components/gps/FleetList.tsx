import React from 'react';

interface Vehicle {
  id: string;
  deviceId: string;
  vehicle: {
    registrationNumber: string;
    make?: string;
    model?: string;
  };
  latitude: number;
  longitude: number;
  speed?: number;
  ignition?: boolean;
  lastPing?: string;
  status: string;
  activeTrip?: any;
}

interface Props {
  vehicles: Vehicle[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export const FleetList: React.FC<Props> = ({ vehicles, selectedId, onSelect }) => {
  if (vehicles.length === 0) {
    return (
      <div className="bg-slate-800 p-4 rounded-xl">
        <p className="text-slate-400 text-sm text-center">No active vehicles</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-slate-700">
        <h3 className="text-white font-semibold">Fleet ({vehicles.length})</h3>
      </div>
      <div className="max-h-[400px] overflow-y-auto">
        {vehicles.map((vehicle) => (
          <button
            key={vehicle.id}
            onClick={() => onSelect(vehicle.id)}
            className={`w-full text-left p-3 border-b border-slate-700/50 transition-colors ${
              selectedId === vehicle.id
                ? 'bg-blue-500/10 border-l-2 border-l-blue-500'
                : 'hover:bg-slate-700/30 border-l-2 border-l-transparent'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-sm font-medium">
                  {vehicle.vehicle.registrationNumber}
                </p>
                <p className="text-slate-400 text-xs">
                  {vehicle.vehicle.make} {vehicle.vehicle.model}
                </p>
              </div>
              <div className={`w-2 h-2 rounded-full ${
                vehicle.ignition ? 'bg-green-500' : 'bg-slate-500'
              }`} />
            </div>
            <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
              <span>{vehicle.speed?.toFixed(1) || 0} km/h</span>
              {vehicle.activeTrip && (
                <span className="text-blue-400">● Trip</span>
              )}
            </div>
            {vehicle.lastPing && (
              <p className="text-slate-500 text-xs mt-1">
                {new Date(vehicle.lastPing).toLocaleTimeString()}
              </p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};