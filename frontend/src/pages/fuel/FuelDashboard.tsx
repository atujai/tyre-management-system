import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fuelApi } from '../../api/fuelApi';
import { FuelGauge } from '../../components/fuel/FuelGauge';
import { ConsumptionChart } from '../../components/fuel/ConsumptionChart';
import { TheftAlertCard } from '../../components/fuel/TheftAlertCard';
import { RefuelTable } from '../../components/fuel/RefuelTable';

export const FuelDashboard: React.FC = () => {
  const { data: stats } = useQuery({
    queryKey: ['fuel-stats'],
    queryFn: fuelApi.getDashboardStats,
  });

  const { data: sensors } = useQuery({
    queryKey: ['fuel-sensors'],
    queryFn: fuelApi.getSensors,
  });

  const [selectedSensor, setSelectedSensor] = useState<string | null>(null);

  const { data: consumption } = useQuery({
    queryKey: ['fuel-consumption', selectedSensor],
    queryFn: () => fuelApi.getConsumptionReport(selectedSensor!, {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date().toISOString(),
      groupBy: 'day'
    }),
    enabled: !!selectedSensor,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Fuel Monitoring</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 p-4 rounded-xl">
          <p className="text-slate-400 text-sm">Active Sensors</p>
          <p className="text-2xl font-bold text-white">{stats?.activeSensors || 0}</p>
        </div>
        <div className="bg-slate-800 p-4 rounded-xl">
          <p className="text-slate-400 text-sm">Low Fuel Alerts</p>
          <p className="text-2xl font-bold text-red-400">{stats?.lowFuelCount || 0}</p>
        </div>
        <div className="bg-slate-800 p-4 rounded-xl">
          <p className="text-slate-400 text-sm">Total Refuels</p>
          <p className="text-2xl font-bold text-green-400">{stats?.totalRefuels || 0}</p>
        </div>
        <div className="bg-slate-800 p-4 rounded-xl">
          <p className="text-slate-400 text-sm">Theft Incidents</p>
          <p className="text-2xl font-bold text-orange-400">{stats?.totalThefts || 0}</p>
        </div>
      </div>

      {/* Sensor Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sensors?.map((sensor: any) => (
          <div
            key={sensor.id}
            onClick={() => setSelectedSensor(sensor.id)}
            className={`bg-slate-800 p-6 rounded-xl cursor-pointer transition-all ${
              selectedSensor === sensor.id ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-white font-semibold">
                  {sensor.vehicle.registrationNumber}
                </h3>
                <p className="text-slate-400 text-sm">{sensor.fuelType}</p>
              </div>
              <span className={`px-2 py-1 rounded text-xs ${
                sensor.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {sensor.status}
              </span>
            </div>

            <FuelGauge
              level={sensor.currentLevel}
              volume={sensor.currentVolume}
              capacity={sensor.tankCapacity}
            />

            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-slate-400">Capacity</p>
                <p className="text-white">{sensor.tankCapacity} L</p>
              </div>
              <div>
                <p className="text-slate-400">Last Reading</p>
                <p className="text-white">
                  {sensor.lastReading
                    ? new Date(sensor.lastReading).toLocaleTimeString()
                    : 'N/A'}
                </p>
              </div>
            </div>

            {sensor.currentLevel <= sensor.lowFuelThreshold && (
              <div className="mt-3 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-400 text-sm">⚠️ Low Fuel Warning</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Analytics */}
      {selectedSensor && consumption && (
        <div className="bg-slate-800 p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-4">
            Consumption Analytics
          </h3>
          <ConsumptionChart data={consumption} />
        </div>
      )}
    </div>
  );
};