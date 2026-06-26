import React from 'react';

interface FleetListProps {
  vehicles: any[];
  selectedId: string | null;
  onSelect: (id: string | number) => void;
}

export const FleetList: React.FC<FleetListProps> = ({ vehicles, selectedId, onSelect }) => {
  // Remove duplicates by device ID
  const uniqueVehicles = vehicles.filter((v, i, arr) => 
    arr.findIndex(t => t.id === v.id) === i
  );

  return (
    <div className="bg-slate-800 rounded-xl p-4 space-y-3">
      <h3 className="text-lg font-semibold text-white">Fleet ({uniqueVehicles.length})</h3>
      
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {uniqueVehicles.map((vehicle) => (
          <div
            key={vehicle.id}
            onClick={() => vehicle.id && onSelect(vehicle.id)}
            className={`p-3 rounded-lg cursor-pointer transition ${
              selectedId === vehicle.id?.toString()
                ? 'bg-blue-500/20 border border-blue-500/50'
                : 'bg-slate-700/50 hover:bg-slate-700'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white font-medium">
                  {vehicle.current_vehicle_reg || 'Unlinked Device'}
                </p>
                {(vehicle.current_vehicle_make || vehicle.current_vehicle_model) && (
                  <p className="text-slate-400 text-xs">
                    {vehicle.current_vehicle_make} {vehicle.current_vehicle_model}
                  </p>
                )}
              </div>
              <span className={`px-2 py-0.5 rounded text-xs ${
                vehicle.status === 'ACTIVE' || vehicle.status === 'ONLINE'
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {vehicle.status || 'OFFLINE'}
              </span>
            </div>
            
            <div className="mt-2 flex items-center space-x-3 text-xs text-slate-400">
              <span>Speed: {vehicle.speed ? parseFloat(vehicle.speed).toFixed(1) : '0'} km/h</span>
              <span>•</span>
              <span>Ignition: {vehicle.ignition ? 'ON' : 'OFF'}</span>
            </div>
            
            {!vehicle.current_vehicle_reg ? (
              <p className="text-yellow-500 text-xs mt-1">⚠️ Click to assign vehicle</p>
            ) : (
              <p className="text-blue-400 text-xs mt-1">Click to view details</p>
            )}
          </div>
        ))}
        
        {uniqueVehicles.length === 0 && (
          <p className="text-slate-500 text-sm text-center py-4">No devices found</p>
        )}
      </div>
    </div>
  );
};