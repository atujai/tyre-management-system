// frontend/src/pages/gps/GPSDeviceManager.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { gpsApi } from '../../api/gpsApi';

export const GPSDeviceManager: React.FC = () => {
  const queryClient = useQueryClient();
  
  // Track string values directly matching HTML Select option structures
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);

  // Fetch unified GPS tracking devices list
  const { data: devicesData, isLoading: devicesLoading } = useQuery({
    queryKey: ['gps-devices'],
    queryFn: async () => {
      return gpsApi.getFleetOverview();
    }
  });

  // Fetch system registered vehicle fleet list
  const { data: vehiclesData, isLoading: vehiclesLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const res = await fetch('/api/vehicles', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return res.json();
    }
  });

  // Data mutation pipeline
  const linkMutation = useMutation({
    mutationFn: ({ deviceId, vehicleId }: { deviceId: string; vehicleId: number | null }) => {
      return gpsApi.linkDeviceById(deviceId, vehicleId);
    },
    onSuccess: () => {
      setSelectedDevice(null);
      setSelectedVehicle(null);
      queryClient.invalidateQueries({ queryKey: ['gps-devices'] });
      queryClient.invalidateQueries({ queryKey: ['gps-fleet'] });
      alert('Device successfully linked to the vehicle profile!');
    },
    onError: (err: any) => {
      alert(`Assignment failed: ${err.message}`);
    }
  });

  const handleLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDevice || !selectedVehicle) return;

    linkMutation.mutate({
      deviceId: selectedDevice,
      vehicleId: parseInt(selectedVehicle, 10),
    });
  };

  const devices = devicesData?.data || [];
  const vehicles = vehiclesData || [];

  if (devicesLoading || vehiclesLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-white font-medium">
        Loading device registries and dependencies...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">GPS Hardware Allocation Manager</h1>
          <p className="text-slate-400 text-sm mt-1">Map hardware trackers directly to your transport assets.</p>
        </div>
        <Link to="/gps" className="text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg border border-slate-700 transition-colors">
          ← Back to Live Map
        </Link>
      </div>

      {/* Configuration Form Card */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-md max-w-4xl">
        <h2 className="text-lg font-semibold text-white mb-4">Create Asset Tracking Pair</h2>
        
        <form onSubmit={handleLink} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          {/* Tracking Device Dropdown selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">Select Tracking Device (IMEI)</label>
            <select
              value={selectedDevice || ''}
              onChange={(e) => setSelectedDevice(e.target.value || null)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">-- Choose Hardware Profile --</option>
              {devices.map((d: any) => {
                // FIXED: Explicitly fallback to id if traccar_device_id doesn't exist yet
                const hardwareIdRef = d.traccar_device_id || d.id;
                return (
                  <option key={hardwareIdRef} value={hardwareIdRef}>
                    {d.name || d.gps_name || 'Device'} ({d.imei || 'No IMEI'})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Vehicle Dropdown selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">Target Vehicle Profile</label>
            <select
              value={selectedVehicle || ''}
              onChange={(e) => setSelectedVehicle(e.target.value || null)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">-- Choose Active Vehicle --</option>
              {vehicles.map((v: any) => (
                <option key={v.id} value={v.id}>
                  {v.reg} — {v.model || 'Generic'}
                </option>
              ))}
            </select>
          </div>

          {/* Button Trigger */}
          <button
            type="submit"
            disabled={!selectedDevice || !selectedVehicle || linkMutation.isPending}
            className={`w-full py-2 px-4 rounded-lg font-medium text-white transition-all shadow-sm ${
              !selectedDevice || !selectedVehicle || linkMutation.isPending
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed border border-slate-800'
                : 'bg-blue-600 hover:bg-blue-500 active:scale-95'
            }`}
          >
            {linkMutation.isPending ? 'Linking System...' : '🔗 Link Device to Vehicle'}
          </button>
        </form>
      </div>

      {/* Hardware Tracking Registry Inventory Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-700 bg-slate-800/50">
          <h2 className="text-lg font-semibold text-white">Device Registry Inventory</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-slate-400 text-sm border-b border-slate-700 font-medium">
                <th className="p-4">Hardware Name / Unique ID</th>
                <th className="p-4">IMEI Identity Number</th>
                <th className="p-4">Signal Status</th>
                <th className="p-4">Assigned Vehicle</th>
                <th className="p-4">Last Update Pulse</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {devices.map((d: any) => {
                const deviceUniqueId = d.traccar_device_id || d.id;
                const displayReg = d.registration_number || d.vehicle_number || d.current_vehicle_reg;
                const isOnline = (d.traccar_status || d.status) === 'online';
                
                return (
                  <tr key={deviceUniqueId} className="hover:bg-slate-700/20 transition-colors">
                    <td className="p-4 text-white font-medium">{d.name || d.gps_name || 'Unnamed'}</td>
                    <td className="p-4 text-slate-300 font-mono text-sm">{d.imei || 'N/A'}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        isOnline 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                          : 'bg-slate-700 text-slate-400'
                      }`}>
                        {d.traccar_status || d.status || 'offline'}
                      </span>
                    </td>
                    <td className="p-4">
                      {displayReg ? (
                        <span className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded border border-blue-500/20 font-medium text-xs">
                          {displayReg}
                        </span>
                      ) : (
                        <span className="text-amber-400 text-xs bg-amber-500/5 px-2 py-1 rounded border border-amber-500/10">
                          Unassigned Hardware
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-slate-400 text-xs">
                      {d.traccar_lastupdate || d.last_ping ? new Date(d.traccar_lastupdate || d.last_ping).toLocaleString() : 'Never'}
                    </td>
                    <td className="p-4">
                      <Link 
                        to={`/gps/${deviceUniqueId}`}
                        className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                      >
                        View Details →
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {devices.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center p-8 text-slate-500">
                    No hardware tracking devices discovered in connection registries.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default GPSDeviceManager;