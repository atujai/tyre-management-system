import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL

export const useDocumentsByVehicle = (vehicleId: string) => {
  return useQuery({
    queryKey: ['documents', vehicleId],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/documents/vehicle/${vehicleId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      return data
    },
    enabled: !!vehicleId && vehicleId !== 'all',
  })
}

export const useDocumentDashboard = () => {
  return useQuery({
    queryKey: ['document-dashboard'],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/documents/dashboard`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      return data
    },
  })
}

export const useExpiringDocuments = (days: number = 30) => {
  return useQuery({
    queryKey: ['expiring-documents', days],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/documents/expiring?days=${days}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      return data
    },
  })
}

export const useCreateDocument = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (formData: any) => {
      const data = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) data.append(key, value instanceof File ? value : String(value))
      })
      const { data: response } = await axios.post(`${API_URL}/documents`, data, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'multipart/form-data' },
      })
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['document-dashboard'] })
    },
  })
}

export const useUpdateDocument = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: any }) => {
      const data = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) data.append(key, value instanceof File ? value : String(value))
      })
      const { data: response } = await axios.put(`${API_URL}/documents/${id}`, data, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'multipart/form-data' },
      })
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['document-dashboard'] })
    },
  })
}

export const useDeleteDocument = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`${API_URL}/documents/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['document-dashboard'] })
    },
  })
}

export const useRenewDocument = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, newExpiryDate, amount, notes }: any) => {
      const { data } = await axios.post(`${API_URL}/documents/${id}/renew`, { newExpiryDate, amount, notes }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['document-dashboard'] })
    },
  })
}

export const useSendReminder = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, message }: { id: string; message?: string }) => {
      const { data } = await axios.post(`${API_URL}/documents/${id}/remind`, { message }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      return data
    },
  })
}