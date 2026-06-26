const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const vehicleApi = {
  getAvailableVehicles: async () => {
    const res = await fetch('/api/vehicles/available', {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch available vehicles');
    return res.json();
  },
};