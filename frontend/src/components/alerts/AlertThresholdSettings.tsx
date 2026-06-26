// components/alerts/AlertThresholdSettings.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Settings,
  Plus,
  Trash2,
  Save,
  X,
  AlertTriangle,
  Package,
  Loader2,
} from 'lucide-react';
import { locationApi } from '../../api/locationApi';
import type { Location, AlertThreshold } from '../../types/transfer-alert.types';

interface AlertThresholdSettingsProps {
  locations: Location[];
  onClose: () => void;
}

export const AlertThresholdSettings: React.FC<AlertThresholdSettingsProps> = ({
  locations,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const [selectedLocation, setSelectedLocation] = useState('');
  const [newThreshold, setNewThreshold] = useState({
    size: '',
    brand: '',
    minNewCount: 2,
    minRetreadCount: 1,
  });

  const { data: thresholds, isPending } = useQuery({
    queryKey: ['alert-thresholds', selectedLocation],
    queryFn: () => locationApi.getAlertThresholds(
      selectedLocation || undefined
    ),
  });

  const createMutation = useMutation({
    mutationFn: locationApi.setAlertThreshold,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-thresholds'] });
      setNewThreshold({ size: '', brand: '', minNewCount: 2, minRetreadCount: 1 });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: locationApi.deleteAlertThreshold,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-thresholds'] });
    },
  });

  const handleCreate = () => {
    if (!selectedLocation || !newThreshold.size) return;
    createMutation.mutate({
      locationId: selectedLocation,
      size: newThreshold.size,
      brand: newThreshold.brand || undefined,
      minNewCount: newThreshold.minNewCount,
      minRetreadCount: newThreshold.minRetreadCount,
      isActive: true,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl max-h-[90vh] bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-bold text-white">Alert Threshold Settings</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-auto px-6 py-4 space-y-6">
          {/* Location selector */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Select Location
            </label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="">All Locations</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>

          {/* Add new threshold */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-400" />
              Add New Threshold
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Tyre Size *</label>
                <input
                  type="text"
                  value={newThreshold.size}
                  onChange={(e) => setNewThreshold(prev => ({ ...prev, size: e.target.value }))}
                  placeholder="e.g., 295/80 R22.5"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Brand (optional)</label>
                <input
                  type="text"
                  value={newThreshold.brand}
                  onChange={(e) => setNewThreshold(prev => ({ ...prev, brand: e.target.value }))}
                  placeholder="e.g., Bridgestone"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Min NEW Count *</label>
                <input
                  type="number"
                  min={0}
                  value={newThreshold.minNewCount}
                  onChange={(e) => setNewThreshold(prev => ({ ...prev, minNewCount: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Min RETREAD Count *</label>
                <input
                  type="number"
                  min={0}
                  value={newThreshold.minRetreadCount}
                  onChange={(e) => setNewThreshold(prev => ({ ...prev, minRetreadCount: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
            </div>

            <button
              onClick={handleCreate}
              disabled={!selectedLocation || !newThreshold.size || createMutation.isPending}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg font-medium transition-colors"
            >
              {createMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Threshold
            </button>
          </div>

          {/* Existing thresholds */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">
              Existing Thresholds
              {thresholds && <span className="text-slate-500 font-normal"> ({thresholds.length})</span>}
            </h3>

            {isPending ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
              </div>
            ) : thresholds?.length === 0 ? (
              <div className="text-center py-6 bg-slate-800 rounded-xl border border-slate-700">
                <AlertTriangle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No thresholds configured</p>
              </div>
            ) : (
              <div className="space-y-2">
                {thresholds?.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center gap-3 px-4 py-3 bg-slate-800 rounded-xl border border-slate-700"
                  >
                    <Package className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{t.size}</span>
                        {t.brand && (
                          <span className="text-xs text-slate-500">{t.brand}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs">
                        <span className="text-slate-400">
                          NEW min: <span className="text-amber-400 font-medium">{t.minNewCount}</span>
                        </span>
                        <span className="text-slate-400">
                          RETREAD min: <span className="text-blue-400 font-medium">{t.minRetreadCount}</span>
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteMutation.mutate(t.id)}
                      disabled={deleteMutation.isPending}
                      className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
