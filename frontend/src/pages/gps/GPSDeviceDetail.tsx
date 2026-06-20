import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, Polyline, Circle } from 'react-leaflet';
import { gpsApi } from '../../api/gpsApi';
import { Tab } from '@headlessui/react';
import { format } from 'date-fns';

export const GPSDeviceDetail: React.FC = () => { 
  const { id } = useParams<{ id: string }>();
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  
  const { data: device } = useQuery(['gps-device', id], () => gpsApi.getDeviceById(id!));
  const { data: history } = useQuery(
    ['gps-history', id, dateRange],
    () => gpsApi.getLocationHistory(id!, dateRange.start, dateRange.end),
    { enabled: !!dateRange.start && !!dateRange.end }
  );
  const { data: trips } = useQuery(['gps-trips', id], () => gpsApi.getTrips(id!));
  const { data: alerts } = useQuery(['gps-alerts', id], () => gpsApi.getAlerts(id!));

  const geofenceMutation = useMutation(gpsApi.setGeofence);
  const acknowledgeMutation = useMutation(gpsApi.acknowledgeAlert);

  const positions = history?.map((h: any) => [h.latitude, h.longitude]) || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">
          {device?.vehicle?.registrationNumber} - GPS Tracking
        </h1>
        <span className={`px-3 py-1 rounded-full text-sm ${
          device?.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        }`}>
          {device?.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Location Map */}
        <div className="lg:col-span-2 bg-slate-800 rounded-xl h-[500px] overflow-hidden">
          <MapContainer
            center={[device?.latitude || 20.5937, device?.longitude || 78.9629]}
            zoom={15}
            className="h-full w-full"
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {device?.latitude && (
              <>
                <Marker position={[device.latitude, device.longitude]} />
                {device.geofenceEnabled && device.geofenceCenterLat && (
                  <Circle
                    center={[device.geofenceCenterLat, device.geofenceCenterLng]}
                    radius={device.geofenceRadius}
                    pathOptions={{ color: 'blue', fillOpacity: 0.1 }}
                  />
                )}
              </>
            )}
            {positions.length > 0 && (
              <Polyline positions={positions} color="#3b82f6" weight={3} />
            )}
          </MapContainer>
        </div>

        {/* Device Info */}
        <div className="bg-slate-800 rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white">Device Information</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Device ID</span>
              <span className="text-white">{device?.deviceId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">IMEI</span>
              <span className="text-white">{device?.imei}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">SIM Number</span>
              <span className="text-white">{device?.simNumber || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Last Ping</span>
              <span className="text-white">
                {device?.lastPing ? format(new Date(device.lastPing), 'PPp') : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Speed</span>
              <span className="text-white">{device?.speed?.toFixed(1)} km/h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Heading</span>
              <span className="text-white">{device?.heading?.toFixed(0)}°</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Ignition</span>
              <span className={device?.ignition ? 'text-green-400' : 'text-red-400'}>
                {device?.ignition ? 'ON' : 'OFF'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Battery</span>
              <span className="text-white">{device?.batteryLevel}%</span>
            </div>
          </div>

          {/* Geofence Controls */}
          <div className="pt-4 border-t border-slate-700">
            <h4 className="text-sm font-medium text-white mb-2">Geofence</h4>
            {device?.geofenceEnabled ? (
              <div className="space-y-2">
                <p className="text-sm text-slate-400">
                  Radius: {device.geofenceRadius}m
                </p>
                <button
                  onClick={() => geofenceMutation.mutate({ id: id!, enabled: false })}
                  className="w-full px-3 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm"
                >
                  Disable Geofence
                </button>
              </div>
            ) : (
              <button
                onClick={() => {/* Open geofence modal */}}
                className="w-full px-3 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-sm"
              >
                Set Geofence
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tab.Group>
        <Tab.List className="flex space-x-1 bg-slate-800 p-1 rounded-xl">
          {['Trips', 'History', 'Alerts'].map((tab) => (
            <Tab
              key={tab}
              className={({ selected }) =>
                `w-full py-2.5 text-sm font-medium rounded-lg ${
                  selected
                    ? 'bg-blue-500 text-white'
                    : 'text-slate-400 hover:text-white'
                }`
              }
            >
              {tab}
            </Tab>
          ))}
        </Tab.List>
        
        <Tab.Panels className="mt-4">
          <Tab.Panel>
            <TripsTable trips={trips || []} />
          </Tab.Panel>
          <Tab.Panel>
            <HistoryPanel
              history={history || []}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />
          </Tab.Panel>
          <Tab.Panel>
            <AlertsTable
              alerts={alerts || []}
              onAcknowledge={(alertId) => acknowledgeMutation.mutate(alertId)}
            />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};