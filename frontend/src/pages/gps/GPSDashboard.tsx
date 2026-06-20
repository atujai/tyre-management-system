import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { gpsApi } from '../../api/gpsApi';
import { useWebSocket } from '../../hooks/useWebSocket';
import { StatsCard } from '../../components/gps/StatsCard';
import { FleetList } from '../../components/gps/FleetList';
import { AlertPanel } from '../../components/gps/AlertPanel';
import { GPSTrip } from '../../types';

const vehicleIcon = new Icon({
  iconUrl: '/assets/vehicle-marker.svg',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

export const GPSDashboard: React.FC = () => {
  const { data: stats } = useQuery({
    queryKey: ['gps-stats'],
    queryFn: gpsApi.getDashboardStats,
  });
  const { data: fleet } = useQuery({
    queryKey: ['fleet-overview'],
    queryFn: gpsApi.getFleetOverview,
  });
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  
  const { lastMessage } = useWebSocket('fleet-updates');

  useEffect(() => {
    if (lastMessage?.type === 'LOCATION_UPDATE') {
      // Update fleet position in real-time
    }
    if (lastMessage?.type === 'NEW_ALERT') {
      setActiveAlerts(prev => [lastMessage.data, ...prev].slice(0, 10));
    }
  }, [lastMessage]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">GPS Tracking Dashboard</h1>
      
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          title="Active Vehicles"
          value={stats?.activeDevices || 0}
          total={stats?.totalDevices || 0}
          color="green"
        />
        <StatsCard
          title="Active Trips"
          value={stats?.activeTrips || 0}
          color="blue"
        />
        <StatsCard
          title="Alerts"
          value={stats?.unacknowledgedAlerts || 0}
          color="red"
        />
        <StatsCard
          title="Online %"
          value={`${stats?.onlinePercentage || 0}%`}
          color="cyan"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Map */}
        <div className="lg:col-span-2 bg-slate-800 rounded-xl overflow-hidden h-[600px]">
          <MapContainer
            center={[20.5937, 78.9629]}
            zoom={5}
            className="h-full w-full"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap'
            />
            {fleet?.map((vehicle: any) => (
              <React.Fragment key={vehicle.id}>
                <Marker
                  position={[vehicle.latitude, vehicle.longitude]}
                  icon={vehicleIcon}
                  eventHandlers={{
                    click: () => setSelectedVehicle(vehicle.id),
                  }}
                >
                  <Popup>
                    <div className="text-slate-900">
                      <p className="font-bold">{vehicle.vehicle.registrationNumber}</p>
                      <p>Speed: {vehicle.speed?.toFixed(1)} km/h</p>
                      <p>Ignition: {vehicle.ignition ? 'ON' : 'OFF'}</p>
                    </div>
                  </Popup>
                </Marker>
                {vehicle.activeTrip && (
                  <Polyline
                    positions={[[vehicle.activeTrip.startLat, vehicle.activeTrip.startLng], [vehicle.latitude, vehicle.longitude]]}
                    color="#3b82f6"
                  />
                )}
              </React.Fragment>
            ))}
          </MapContainer>
        </div>

        {/* Side Panel */}
        <div className="space-y-4">
          <FleetList
            vehicles={fleet || []}
            selectedId={selectedVehicle}
            onSelect={setSelectedVehicle}
          />
          <AlertPanel alerts={activeAlerts} />
        </div>
      </div>
    </div>
  );
};