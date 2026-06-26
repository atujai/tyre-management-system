import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, Tooltip, Popup } from 'react-leaflet';
import { Link } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Marker Icons
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
L.Marker.prototype.options.icon = L.icon({ iconUrl: markerIcon, shadowUrl: markerShadow, iconSize: [25, 41], iconAnchor: [12, 41] });

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const GPSDashboard = () => {
  const { data: fleetData, isLoading } = useQuery({
    queryKey: ['gps-fleet'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/gps/fleet`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
      const json = await res.json();
      return json.data || json;
    },
    refetchInterval: 10000,
  });

  const fleet = fleetData || [];
  const vehiclesWithGPS = fleet.filter((v: any) => v.latitude && v.longitude);

  if (isLoading) return <div className="p-6 text-gray-400">Loading fleet data...</div>;

  return (
    // The wrapper ensures the dashboard respects your layout's sidebar/topbar
    <div className="flex flex-col h-[calc(100vh-100px)] p-4 bg-gray-900 rounded-lg shadow-inner">
      
      {/* Header Bar */}
      <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-700">
        <h1 className="text-xl font-bold text-gray-100">GPS Fleet Dashboard</h1>
        <Link to="/gps/devices" className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded transition">
          Manage Devices
        </Link>
      </div>

      {/* Main Grid: Assets (Fixed Width) + Map (Fluid) */}
      <div className="flex flex-1 gap-4 overflow-hidden">
        
        {/* Left: Scrollable Asset List */}
        <div className="w-80 flex-shrink-0 overflow-y-auto space-y-2 pr-2">
          {fleet.map((v: any) => (
            <div key={v.gps_device_id || v.id} className="bg-gray-800 p-3 rounded border border-gray-700 hover:border-gray-500">
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm text-white">{v.vehicle_number || v.gps_name}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded ${v.traccar_status === 'online' ? 'bg-green-700' : 'bg-gray-600'}`}>
                  {v.traccar_status || 'offline'}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 mt-1">{v.vehicle_make || 'Tracking Unit'}</p>
            </div>
          ))}
        </div>

        {/* Right: Map Area */}
        <div className="flex-1 bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
          <MapContainer center={[26.44, 80.24]} zoom={11} className="h-full w-full">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {vehiclesWithGPS.map((v: any) => (
              <Marker key={v.gps_device_id} position={[parseFloat(v.latitude), parseFloat(v.longitude)]}>
                <Tooltip permanent direction="top" className="text-[10px] bg-gray-900 border-none shadow-md">
                  {v.vehicle_number}
                </Tooltip>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};