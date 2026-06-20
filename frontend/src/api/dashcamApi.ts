import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export const dashcamApi = {
  getDashcams: (params?: any) => axios.get(`${API_URL}/dashcam/devices`, { params }).then(r => r.data.data),
  getDashcamById: (id: string) => axios.get(`${API_URL}/dashcam/devices/${id}`).then(r => r.data.data),
  createDashcam: (data: any) => axios.post(`${API_URL}/dashcam/devices`, data).then(r => r.data.data),
  updateDashcam: (id: string, data: any) => axios.put(`${API_URL}/dashcam/devices/${id}`, data).then(r => r.data.data),
  deleteDashcam: (id: string) => axios.delete(`${API_URL}/dashcam/devices/${id}`).then(r => r.data),
  updateSettings: (id: string, data: any) => axios.put(`${API_URL}/dashcam/devices/${id}/settings`, data).then(r => r.data.data),
  
  getRecordings: (id: string, params?: any) => axios.get(`${API_URL}/dashcam/devices/${id}/recordings`, { params }).then(r => r.data.data),
  downloadRecording: (recordingId: string) => axios.get(`${API_URL}/dashcam/recordings/${recordingId}/download`, { responseType: 'blob' }),
  deleteRecording: (recordingId: string) => axios.delete(`${API_URL}/dashcam/recordings/${recordingId}`).then(r => r.data),
  archiveRecording: (recordingId: string) => axios.put(`${API_URL}/dashcam/recordings/${recordingId}/archive`).then(r => r.data.data),
  tagRecording: (recordingId: string, tags: string[]) => axios.put(`${API_URL}/dashcam/recordings/${recordingId}/tags`, { tags }).then(r => r.data.data),
  
  getEvents: (id: string, params?: any) => axios.get(`${API_URL}/dashcam/devices/${id}/events`, { params }).then(r => r.data.data),
  createEvent: (data: any) => axios.post(`${API_URL}/dashcam/devices/${data.dashcamId}/events`, data).then(r => r.data.data),
  reviewEvent: (eventId: string) => axios.put(`${API_URL}/dashcam/events/${eventId}/review`).then(r => r.data.data),
  
  startLiveStream: (id: string) => axios.post(`${API_URL}/dashcam/devices/${id}/stream/start`).then(r => r.data.data),
  stopLiveStream: (id: string) => axios.post(`${API_URL}/dashcam/devices/${id}/stream/stop`).then(r => r.data.data),
  getStreamStatus: (id: string) => axios.get(`${API_URL}/dashcam/devices/${id}/stream/status`).then(r => r.data.data),
  
  getStorageInfo: (id: string) => axios.get(`${API_URL}/dashcam/devices/${id}/storage`).then(r => r.data.data),
  cleanupStorage: (id: string) => axios.post(`${API_URL}/dashcam/devices/${id}/storage/cleanup`).then(r => r.data.data),
  
  getDashboardStats: () => axios.get(`${API_URL}/dashcam/dashboard/stats`).then(r => r.data.data),
  getHealthStatus: (id: string) => axios.get(`${API_URL}/dashcam/devices/${id}/health`).then(r => r.data.data),
};