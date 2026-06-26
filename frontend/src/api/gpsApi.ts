// frontend/src/api/gpsApi.ts

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const gpsApi = {
  getDashboardStats: async () => {
    const res = await fetch('/api/gps/stats', {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  },

  getFleetOverview: async () => {
    const res = await fetch('/api/gps/fleet', {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch fleet');
    return res.json();
  },

  getDevices: async () => {
    const res = await fetch('/api/gps/devices', {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch devices');
    return res.json();
  },

  getDeviceById: async (id: string) => {
    const res = await fetch(`/api/gps/devices/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch device');
    return res.json();
  },

  getLocationHistory: async (id: string, start: string, end: string) => {
    const res = await fetch(`/api/gps/devices/${id}/history?start=${start}&end=${end}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch history');
    return res.json();
  },

  getTrips: async (id: string) => {
    const res = await fetch(`/api/gps/devices/${id}/trips`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch trips');
    return res.json();
  },

  getAlerts: async (id: string) => {
    const res = await fetch(`/api/gps/devices/${id}/alerts`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch alerts');
    return res.json();
  },

  // FIXED: Communicates directly with the backend upsert handler
  linkDeviceById: async (deviceId: string, vehicleId: number | null) => {
    const res = await fetch('/api/gps/devices/link', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ deviceId: parseInt(deviceId, 10), vehicleId }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to link device');
    }
    return res.json();
  },

  assignVehicle: async (deviceId: string, data: {
    vehicleRegNumber: string;
    vehicleMake?: string;
    vehicleModel?: string;
    vehicleYear?: number;
    notes?: string;
  }) => {
    const res = await fetch(`/api/gps/devices/${deviceId}/assign`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to assign vehicle');
    return res.json();
  },
};