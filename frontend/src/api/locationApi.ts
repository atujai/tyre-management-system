// api/locationApi.ts — COMPLETE MERGED FILE
import axios from 'axios';
import type { Location, LocationInventory, LocationTyreItem, TyreCondition } from '../types/location.types';
import type { 
  BulkTransferRequest, 
  TransferHistoryItem, 
  StockAlert, 
  AlertThreshold,
  TyreTransferItem,
  PDFReportData 
} from '../types/transfer-alert.types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const locationApi = {
  // ========== LOCATIONS ==========
  getAll: async (): Promise<Location[]> => {
    const { data } = await api.get('/locations');
    return data;
  },

  getById: async (id: string): Promise<Location> => {
    const { data } = await api.get(`/locations/${id}`);
    return data;
  },

  getInventory: async (id: string): Promise<LocationInventory> => {
    const { data } = await api.get(`/locations/${id}/inventory`);
    return data;
  },

  getTyres: async (id: string, filters?: {
    condition?: TyreCondition;
    size?: string;
    hasRim?: boolean;
    search?: string;
  }): Promise<LocationTyreItem[]> => {
    const { data } = await api.get(`/locations/${id}/tyres`, { params: filters });
    return data;
  },

  create: async (payload: Omit<Location, 'id' | 'createdAt' | 'updatedAt'>): Promise<Location> => {
    const { data } = await api.post('/locations', payload);
    return data;
  },

  update: async (id: string, payload: Partial<Location>): Promise<Location> => {
    const { data } = await api.patch(`/locations/${id}`, payload);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/locations/${id}`);
  },

  // ========== TRANSFERS ==========

  getTransferableTyres: async (locationId: string, filters?: {
    condition?: TyreCondition;
    size?: string;
    search?: string;
  }): Promise<TyreTransferItem[]> => {
    const { data } = await api.get(`/locations/${locationId}/transferable-tyres`, { params: filters });
    return data;
  },

  bulkTransfer: async (payload: BulkTransferRequest): Promise<{ transferred: number; transferId: string }> => {
    const { data } = await api.post('/transfers/bulk', payload);
    return data;
  },

  getTransferHistory: async (locationId: string, params?: {
    direction?: 'IN' | 'OUT' | 'ALL';
    fromDate?: string;
    toDate?: string;
    limit?: number;
  }): Promise<TransferHistoryItem[]> => {
    const { data } = await api.get(`/locations/${locationId}/transfers`, { params });
    return data;
  },

  // ========== ALERTS ==========

  getAlerts: async (params?: {
    locationId?: string;
    severity?: 'LOW' | 'CRITICAL';
    status?: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  }): Promise<StockAlert[]> => {
    const { data } = await api.get('/alerts', { params });
    return data;
  },

  acknowledgeAlert: async (alertId: string): Promise<StockAlert> => {
    const { data } = await api.patch(`/alerts/${alertId}/acknowledge`);
    return data;
  },

  resolveAlert: async (alertId: string): Promise<StockAlert> => {
    const { data } = await api.patch(`/alerts/${alertId}/resolve`);
    return data;
  },

  getAlertThresholds: async (locationId?: string): Promise<AlertThreshold[]> => {
    const { data } = await api.get('/alerts/thresholds', { params: { locationId } });
    return data;
  },

  setAlertThreshold: async (payload: Omit<AlertThreshold, 'id'>): Promise<AlertThreshold> => {
    const { data } = await api.post('/alerts/thresholds', payload);
    return data;
  },

  deleteAlertThreshold: async (thresholdId: string): Promise<void> => {
    await api.delete(`/alerts/thresholds/${thresholdId}`);
  },

  // ========== PDF REPORTS ==========

  generatePDFReport: async (locationId: string): Promise<Blob> => {
    const { data } = await api.get(`/locations/${locationId}/report/pdf`, {
      responseType: 'blob',
    });
    return data;
  },

  getReportData: async (locationId: string): Promise<PDFReportData> => {
    const { data } = await api.get(`/locations/${locationId}/report/data`);
    return data;
  },
};
