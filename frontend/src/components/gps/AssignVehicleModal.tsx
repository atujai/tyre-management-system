import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gpsApi } from '../../api/gpsApi';
import { vehicleApi } from '../../api/vehicleApi';

interface Props {
  deviceId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const AssignVehicleModal: React.FC<Props> = ({ deviceId, isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [manualEntry, setManualEntry] = useState(false);
  const [error, setError] = useState('');
  const [manualData, setManualData] = useState({
    vehicleRegNumber: '',
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: '',
    notes: '',
  });

  const { data: vehicles, isLoading, error: vehiclesError } = useQuery({
    queryKey: ['available-vehicles'],
    queryFn: vehicleApi.getAvailableVehicles,
    enabled: isOpen,
  });

  const selectedVehicle = vehicles?.find((v: any) => v.id === selectedVehicleId);

  const assignMutation = useMutation({
    // We target the /devices/link route which now handles both manual and selected logic
    mutationFn: (data: any) => gpsApi.linkDevice(data), 
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gps-device', deviceId] });
      queryClient.invalidateQueries({ queryKey: ['fleet-overview'] });
      queryClient.invalidateQueries({ queryKey: ['available-vehicles'] });
      setError('');
      onClose();
      setSelectedVehicleId('');
      setManualData({ vehicleRegNumber: '', vehicleMake: '', vehicleModel: '', vehicleYear: '', notes: '' });
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to assign vehicle');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Send the structured payload that matches your updated backend
    assignMutation.mutate({
      deviceId: deviceId,
      vehicleId: manualEntry ? manualData.vehicleRegNumber : selectedVehicleId
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] backdrop-blur-sm">
      <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md space-y-4 border border-slate-700 relative">
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-400 hover:text-white text-xl"
        >
          ✕
        </button>
        
        <h2 className="text-xl font-bold text-white">Assign GPS to Vehicle</h2>

        <div className="flex space-x-2">
          <button type="button" onClick={() => { setManualEntry(false); setError(''); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${!manualEntry ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-400 hover:text-white'}`}>
            Select Vehicle
          </button>
          <button type="button" onClick={() => { setManualEntry(true); setError(''); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${manualEntry ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-400 hover:text-white'}`}>
            Manual Entry
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!manualEntry ? (
            <div>
              <label className="block text-sm text-slate-400 mb-1">Select from Existing Vehicles</label>
              {isLoading ? (
                <p className="text-slate-500 text-sm">Loading vehicles...</p>
              ) : vehiclesError ? (
                <p className="text-red-400 text-sm">Error loading vehicles: {vehiclesError.message}</p>
              ) : (
                <select value={selectedVehicleId} onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required={!manualEntry}>
                  <option value="">-- Choose a vehicle --</option>
                  {vehicles?.map((v: any) => (
                    <option key={v.id} value={v.id}>
                      {v.registrationNumber} {v.make && `- ${v.make} ${v.model}`}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Registration Number *</label>
                <input type="text" value={manualData.vehicleRegNumber}
                  onChange={(e) => setManualData({...manualData, vehicleRegNumber: e.target.value})}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="e.g., MH12AB1234" required={manualEntry} />
              </div>
            </div>
          )}

          <div className="flex space-x-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition">
              Cancel
            </button>
            <button type="submit" disabled={assignMutation.isPending}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition">
              {assignMutation.isPending ? 'Assigning...' : 'Assign GPS'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};