import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL

export const useVehicles = () => {
  return useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/vehicles`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      return data
    },
  })
}