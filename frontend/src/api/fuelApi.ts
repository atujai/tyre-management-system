import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export const fuelApi = {
  getSensors: (params?: any) => axios.get(`${API_URL}/fuel/sensors`, { params }).then(r => r.data.data),
  getSensorById: (id: string) => axios.get(`${API_URL}/fuel/sensors/${id}`).then(r => r.data.data),
  createSensor: (data: any) => axios.post(`${API_URL}/fuel/sensors`, data).then(r => r.data.data),
  updateSensor: (id: string, data: any) => axios.put(`${API_URL}/fuel/sensors/${id}`, data).then(r => r.data.data),
  deleteSensor: (id: string) => axios.delete(`${API_URL}/fuel/sensors/${id}`).then(r => r.data),
  
  getCurrentReading: (id: string) => axios.get(`${API_URL}/fuel/sensors/${id}/reading`).then(r => r.data.data),
  getReadingHistory: (id: string, params: any) => axios.get(`${API_URL}/fuel/sensors/${id}/history`, { params }).then(r => r.data.data),
  addReading: (id: string, data: any) => axios.post(`${API_URL}/fuel/sensors/${id}/readings`, data).then(r => r.data.data),
  
  getRefuels: (id: string, params?: any) => axios.get(`${API_URL}/fuel/sensors/${id}/refuels`, { params }).then(r => r.data.data),
  verifyRefuel: (refuelId: string) => axios.put(`${API_URL}/fuel/refuels/${refuelId}/verify`).then(r => r.data.data),
  
  getThefts: (id: string, params?: any) => axios.get(`${API_URL}/fuel/sensors/${id}/thefts`, { params }).then(r => r.data.data),
  confirmTheft: (theftId: string) => axios.put(`${API_URL}/fuel/thefts/${theftId}/confirm`).then(r => r.data.data),
  
  getAlerts: (id: string) => axios.get(`${API_URL}/fuel/sensors/${id}/alerts`).then(r => r.data.data),
  acknowledgeAlert: (alertId: string) => axios.put(`${API_URL}/fuel/alerts/${alertId}/acknowledge`).then(r => r.data.data),
  
  getConsumptionReport: (id: string, params: any) => axios.get(`${API_URL}/fuel/sensors/${id}/consumption`, { params }).then(r => r.data.data),
  getEfficiencyMetrics: (id: string, params: any) => axios.get(`${API_URL}/fuel/sensors/${id}/efficiency`, { params }).then(r => r.data.data),
  getDashboardStats: () => axios.get(`${API_URL}/fuel/dashboard/stats`).then(r => r.data.data),
  
  calibrateSensor: (id: string, data: any) => axios.post(`${API_URL}/fuel/sensors/${id}/calibrate`, data).then(r => r.data.data),
};