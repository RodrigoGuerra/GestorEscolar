import axios from 'axios';
import { useAuthStore } from '../stores/authStore';
import { useTenantStore } from '../stores/tenantStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  const tenant = useTenantStore.getState().currentTenant;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (tenant) {
    config.headers['x-tenant-id'] = tenant.schema;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred';
    console.error(`[API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}:`, message);
    
    // You could trigger a toast or notification here
    if (error.response?.status === 401) {
      useAuthStore.getState().clearAuth();
    }
    
    return Promise.reject(error);
  }
);

export default api;
