import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export const gpsApi = {
  // Devices
  getDevices: (params?: any) => axios.get(`${API_URL}/gps/devices`, { params }).then(r => r.data.data),
  getDeviceById: (id: string) => axios.get(`${API_URL}/gps/devices/${id}`).then(r => r.data.data),
  createDevice: (data: any) => axios.post(`${API_URL}/gps/devices`, data).then(r => r.data.data),
  updateDevice: (id: string, data: any) => axios.put(`${API_URL}/gps/devices/${id}`, data).then(r => r.data.data),
  deleteDevice: (id: string) => axios.delete(`${API_URL}/gps/devices/${id}`).then(r => r.data),
  
  // Location
  getCurrentLocation: (id: string) => axios.get(`${API_URL}/gps/devices/${id}/location`).then(r => r.data.data),
  getLocationHistory: (id: string, start: string, end: string) => 
    axios.get(`${API_URL}/gps/devices/${id}/history`, { params: { startDate: start, endDate: end } }).then(r => r.data.data),
  
  // Geofence
  setGeofence: ({ id, enabled, ...data }: any) => 
    enabled 
      ? axios.post(`${API_URL}/gps/devices/${id}/geofence`, data).then(r => r.data.data)
      : axios.delete(`${API_URL}/gps/devices/${id}/geofence`).then(r => r.data.data),
  
  // Trips
  getTrips: (id: string) => axios.get(`${API_URL}/gps/devices/${id}/trips`).then(r => r.data.data),
  startTrip: (id: string, data: any) => axios.post(`${API_URL}/gps/devices/${id}/trips/start`, data).then(r => r.data.data),
  endTrip: (tripId: string, data: any) => axios.post(`${API_URL}/gps/trips/${tripId}/end`, data).then(r => r.data.data),
  
  // Alerts
  getAlerts: (id: string) => axios.get(`${API_URL}/gps/devices/${id}/alerts`).then(r => r.data.data),
  acknowledgeAlert: (alertId: string) => axios.put(`${API_URL}/gps/alerts/${alertId}/acknowledge`).then(r => r.data.data),
  
  // Dashboard
  getDashboardStats: () => axios.get(`${API_URL}/gps/dashboard/stats`).then(r => r.data.data),
  getFleetOverview: () => axios.get(`${API_URL}/gps/dashboard/fleet-overview`).then(r => r.data.data),
};