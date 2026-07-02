import axios from 'axios';

// Determine the API base URL. In development, it defaults to the NestJS dev server.
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject multi-tenant headers dynamically from localStorage
apiClient.interceptors.request.use((config) => {
  const tenantId = localStorage.getItem('tenantId') || '60d5ec4a2f8fb814c8f8d9f1';
  if (tenantId) {
    config.headers['X-Tenant-ID'] = tenantId;
  }
  return config;
});
