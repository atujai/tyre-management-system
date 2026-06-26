import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, Polyline, Circle } from 'react-leaflet';
import { gpsApi } from '../../api/gpsApi';
import { Tab } from '@headlessui/react';
import { format } from 'date-fns';
import { AssignVehicleModal } from '../../components/gps/AssignVehicleModal';

export const GPSDeviceDetail: React.FC = () => { 
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showAssignModal, setShowAssignModal] = useState(false);
  
  const { data: device } = useQuery({
    queryKey: ['gps-device', id],
    queryFn: () => gpsApi.getDeviceById(id!)
  });
  
  const { data: history } = useQuery({
    queryKey: ['gps-history', id, dateRange],
    queryFn: () => gpsApi.getLocationHistory(id!, dateRange.start, dateRange.end),
    enabled: !!dateRange.start && !!dateRange.end
  });
  
  const { data: trips } = useQuery({
    queryKey: ['gps-trips', id],
    queryFn: () => gpsApi.getTrips(id!)
  });
  
  const { data: alerts } = useQuery({
    queryKey: ['gps-alerts', id],
    queryFn: () => gpsApi.getAlerts(id!)
  });

  const assignMutation = useMutation({
    mutationFn: (data: any) => gpsApi.assignVehicle(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gps-device', id] });
      queryClient.invalidateQueries({ queryKey: ['fleet-overview'] });
      setShowAssignModal(false);
    }
  });

  const positions = history?.map((h: any) => [
    h.latitude ? parseFloat(h.latitude) : 0, 
    h.longitude ? parseFloat(h.longitude) : 0
  ]) || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">
          {device?.current_vehicle_reg 
            ? `${device.current_vehicle_reg} - GPS Tracking` 
            : 'Unlinked GPS Device'}
        </h1>
        <span className={`px-3 py-1 rounded-full text-sm ${
          device?.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        }`}>
          {device?.status || 'OFFLINE'}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Location Map */}
        <div className="lg:col-span-2 bg-slate-800 rounded-xl h-[500px] overflow-hidden">
          <MapContainer
            center={[
              device?.latitude ? parseFloat(device.latitude) : 20.5937, 
              device?.longitude ? parseFloat(device.longitude) : 78.9629
            ]}
            zoom={15}
            className="h-full w-full"
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {device?.latitude && (
              <>
                <Marker position={[
                  parseFloat(device.latitude), 
                  parseFloat(device.longitude)
                ]} />
                {device.geofence_enabled && device.geofence_center_lat && (
                  <Circle
                    center={[
                      parseFloat(device.geofence_center_lat), 
                      parseFloat(device.geofence_center_lng)
                    ]}
                    radius={device.geofence_radius || 500}
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
              <span className="text-white">{device?.traccar_device_id || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">IMEI</span>
              <span className="text-white">{device?.imei || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">SIM Number</span>
              <span className="text-white">{device?.sim_number || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Last Ping</span>
              <span className="text-white">
                {device?.last_ping ? format(new Date(device.last_ping), 'PPp') : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Speed</span>
              <span className="text-white">
                {device?.speed ? parseFloat(device.speed).toFixed(1) : 'N/A'} km/h
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Heading</span>
              <span className="text-white">
                {device?.heading ? parseFloat(device.heading).toFixed(0) : 'N/A'}°
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Ignition</span>
              <span className={device?.ignition ? 'text-green-400' : 'text-red-400'}>
                {device?.ignition ? 'ON' : 'OFF'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Battery</span>
              <span className="text-white">{device?.battery_level || 'N/A'}%</span>
            </div>
          </div>

          {/* Current Vehicle Section */}
          <div className="pt-4 border-t border-slate-700">
            <h4 className="text-sm font-medium text-white mb-2">Current Vehicle</h4>
            
            {device?.current_vehicle_reg ? (
              <div className="space-y-2">
                <div className="p-3 bg-slate-700/50 rounded-lg">
                  <p className="text-white font-medium text-lg">{device.current_vehicle_reg}</p>
                  {(device.current_vehicle_make || device.current_vehicle_model) && (
                    <p className="text-slate-400 text-sm">
                      {device.current_vehicle_make} {device.current_vehicle_model}
                      {device.current_vehicle_year && ` (${device.current_vehicle_year})`}
                    </p>
                  )}
                  {device.assigned_at && (
                    <p className="text-slate-500 text-xs mt-1">
                      Assigned: {format(new Date(device.assigned_at), 'PPp')}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="w-full px-3 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-sm hover:bg-blue-500/30 transition"
                >
                  Reassign to Different Vehicle
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-yellow-400 text-sm">⚠️ Not assigned to any vehicle</p>
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="w-full px-3 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm hover:bg-green-500/30 transition"
                >
                  Assign to Vehicle
                </button>
              </div>
            )}
          </div>

          {/* Geofence Controls */}
          <div className="pt-4 border-t border-slate-700">
            <h4 className="text-sm font-medium text-white mb-2">Geofence</h4>
            {device?.geofence_enabled ? (
              <div className="space-y-2">
                <p className="text-sm text-slate-400">
                  Radius: {device.geofence_radius || 500}m
                </p>
                <button
                  className="w-full px-3 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm"
                >
                  Disable Geofence
                </button>
              </div>
            ) : (
              <button
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
              onAcknowledge={(alertId: string) => console.log('acknowledge', alertId)}
            />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>

      {/* Assign Vehicle Modal */}
      <AssignVehicleModal
        deviceId={id!}
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
      />
    </div>
  );
};

// Placeholder components - replace with your actual implementations
const TripsTable = ({ trips }: { trips: any[] }) => (
  <div className="bg-slate-800 rounded-xl p-4">
    <p className="text-slate-400 text-sm">{trips.length} trips found</p>
    {trips.length > 0 ? (
      <div className="mt-2 space-y-2">
        {trips.map((trip: any) => (
          <div key={trip.id} className="p-2 bg-slate-700/50 rounded text-sm">
            <p className="text-white">Trip #{trip.id}</p>
            <p className="text-slate-400 text-xs">
              {trip.start_time ? format(new Date(trip.start_time), 'PPp') : 'Unknown start'}
              {trip.end_time ? ` - ${format(new Date(trip.end_time), 'PPp')}` : ' (Ongoing)'}
            </p>
            {trip.distance && <p className="text-slate-400 text-xs">Distance: {trip.distance} km</p>}
          </div>
        ))}
      </div>
    ) : (
      <p className="text-slate-500 text-sm mt-2">No trips recorded</p>
    )}
  </div>
);

const HistoryPanel = ({ history, dateRange, onDateRangeChange }: any) => (
  <div className="bg-slate-800 rounded-xl p-4 space-y-4">
    <div className="flex space-x-2">
      <div>
        <label className="block text-xs text-slate-400 mb-1">Start Date</label>
        <input
          type="date"
          value={dateRange.start}
          onChange={(e) => onDateRangeChange({ ...dateRange, start: e.target.value })}
          className="bg-slate-700 text-white rounded-lg px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs text-slate-400 mb-1">End Date</label>
        <input
          type="date"
          value={dateRange.end}
          onChange={(e) => onDateRangeChange({ ...dateRange, end: e.target.value })}
          className="bg-slate-700 text-white rounded-lg px-3 py-2 text-sm"
        />
      </div>
    </div>
    <p className="text-slate-400 text-sm">{history.length} history points found</p>
    {history.length > 0 && (
      <div className="max-h-[300px] overflow-y-auto space-y-1">
        {history.slice(0, 20).map((h: any, i: number) => (
          <div key={i} className="p-2 bg-slate-700/50 rounded text-xs">
            <span className="text-white">
              {h.latitude}, {h.longitude}
            </span>
            <span className="text-slate-400 ml-2">
              {h.timestamp ? format(new Date(h.timestamp), 'PPp') : 'Unknown'}
            </span>
            {h.speed && <span className="text-slate-400 ml-2">{h.speed} km/h</span>}
          </div>
        ))}
      </div>
    )}
  </div>
);

const AlertsTable = ({ alerts, onAcknowledge }: { alerts: any[], onAcknowledge: (id: string) => void }) => (
  <div className="bg-slate-800 rounded-xl p-4">
    <p className="text-slate-400 text-sm">{alerts.length} alerts found</p>
    {alerts.length > 0 ? (
      <div className="mt-2 space-y-2">
        {alerts.map((alert: any) => (
          <div key={alert.id} className={`p-2 rounded text-sm ${
            alert.acknowledged ? 'bg-slate-700/30' : 'bg-slate-700/50'
          }`}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white font-medium">{alert.alert_type}</p>
                <p className="text-slate-400 text-xs">{alert.message}</p>
                <p className="text-slate-500 text-xs mt-1">
                  {alert.created_at ? format(new Date(alert.created_at), 'PPp') : 'Unknown'}
                </p>
              </div>
              {!alert.acknowledged && (
                <button
                  onClick={() => onAcknowledge(alert.id.toString())}
                  className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs"
                >
                  Acknowledge
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    ) : (
      <p className="text-slate-500 text-sm mt-2">No alerts</p>
    )}
  </div>
);