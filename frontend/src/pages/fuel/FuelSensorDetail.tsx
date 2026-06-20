import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { fuelApi } from '../../api/fuelApi';
import { format } from 'date-fns';
import { FuelGauge } from '../../components/fuel/FuelGauge';
import { ConsumptionChart } from '../../components/fuel/ConsumptionChart';

export const FuelSensorDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    end: new Date().toISOString().slice(0, 16),
  });

  const { data: sensor } = useQuery(['fuel-sensor', id], () => fuelApi.getSensorById(id!));
  const { data: history } = useQuery(
    ['fuel-history', id, dateRange],
    () => fuelApi.getReadingHistory(id!, { startDate: dateRange.start, endDate: dateRange.end, interval: '1h' }),
    { enabled: !!id }
  );
  const { data: refuels } = useQuery(['fuel-refuels', id], () => fuelApi.getRefuels(id!));
  const { data: thefts } = useQuery(['fuel-thefts', id], () => fuelApi.getThefts(id!));
  const { data: alerts } = useQuery(['fuel-alerts', id], () => fuelApi.getAlerts(id!));
  const { data: consumption } = useQuery(
    ['fuel-consumption', id],
    () => fuelApi.getConsumptionReport(id!, {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date().toISOString(),
      groupBy: 'day',
    }),
    { enabled: !!id }
  );

  const acknowledgeMutation = useMutation(fuelApi.acknowledgeAlert);
  const calibrateMutation = useMutation(({ emptyReading, fullReading }: any) =>
    fuelApi.calibrateSensor(id!, { emptyReading, fullReading })
  );

  if (!sensor) return <div className="text-white">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">
          {sensor.vehicle?.registrationNumber} - Fuel Monitor
        </h1>
        <span className={`px-3 py-1 rounded-full text-sm ${
          sensor.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        }`}>
          {sensor.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gauge Card */}
        <div className="bg-slate-800 p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-4">Current Level</h3>
          <FuelGauge
            level={sensor.currentLevel}
            volume={sensor.currentVolume}
            capacity={sensor.tankCapacity}
          />
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Tank Capacity</span>
              <span className="text-white">{sensor.tankCapacity} L</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Fuel Type</span>
              <span className="text-white">{sensor.fuelType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Low Threshold</span>
              <span className="text-white">{sensor.lowFuelThreshold}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Last Reading</span>
              <span className="text-white">
                {sensor.lastReading ? format(new Date(sensor.lastReading), 'PPp') : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="lg:col-span-2 bg-slate-800 p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-4">Consumption Analytics</h3>
          {consumption && <ConsumptionChart data={consumption} />}
        </div>
      </div>

      {/* Reading History */}
      <div className="bg-slate-800 p-6 rounded-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Reading History</h3>
          <div className="flex gap-2">
            <input
              type="datetime-local"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="bg-slate-700 text-white rounded px-3 py-2 text-sm"
            />
            <input
              type="datetime-local"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="bg-slate-700 text-white rounded px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-slate-400 border-b border-slate-700">
              <tr>
                <th className="py-2">Time</th>
                <th>Level (%)</th>
                <th>Volume (L)</th>
                <th>Temp (°C)</th>
                <th>Voltage</th>
              </tr>
            </thead>
            <tbody className="text-white">
              {history?.map((reading: any) => (
                <tr key={reading.id} className="border-b border-slate-700/50">
                  <td className="py-2">{format(new Date(reading.timestamp), 'PPp')}</td>
                  <td>{reading.level.toFixed(1)}%</td>
                  <td>{reading.volume.toFixed(1)}</td>
                  <td>{reading.temperature?.toFixed(1) || 'N/A'}</td>
                  <td>{reading.voltage?.toFixed(2) || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Refuels & Thefts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800 p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-4">Refuel Events</h3>
          <div className="space-y-2">
            {refuels?.map((refuel: any) => (
              <div key={refuel.id} className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
                <div>
                  <p className="text-white text-sm">+{refuel.volumeAdded.toFixed(1)} L</p>
                  <p className="text-slate-400 text-xs">{format(new Date(refuel.timestamp), 'PPp')}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${
                  refuel.verified ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {refuel.verified ? 'Verified' : 'Pending'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-4">Theft Incidents</h3>
          <div className="space-y-2">
            {thefts?.map((theft: any) => (
              <div key={theft.id} className="flex justify-between items-center p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div>
                  <p className="text-red-400 text-sm">-{theft.volumeLost.toFixed(1)} L</p>
                  <p className="text-slate-400 text-xs">{format(new Date(theft.timestamp), 'PPp')}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${
                  theft.confirmed ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {theft.confirmed ? 'Confirmed' : 'Unconfirmed'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="bg-slate-800 p-6 rounded-xl">
        <h3 className="text-lg font-semibold text-white mb-4">Alerts</h3>
        <div className="space-y-2">
          {alerts?.map((alert: any) => (
            <div key={alert.id} className={`flex justify-between items-center p-3 rounded-lg ${
              alert.acknowledged ? 'bg-slate-700/30' : 'bg-slate-700/50'
            }`}>
              <div>
                <p className={`text-sm ${alert.acknowledged ? 'text-slate-400' : 'text-white'}`}>
                  {alert.message}
                </p>
                <p className="text-slate-500 text-xs">{format(new Date(alert.createdAt), 'PPp')}</p>
              </div>
              {!alert.acknowledged && (
                <button
                  onClick={() => acknowledgeMutation.mutate(alert.id)}
                  className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded text-xs"
                >
                  Acknowledge
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};