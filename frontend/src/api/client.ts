import axios from 'axios';

// Determine the API base URL. In development, it defaults to the NestJS dev server.
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const DEMO_API_KEYS: Record<string, string> = {
  '60d5ec4a2f8fb814c8f8d9f1': 'key_demo_acme_corporation_0',
  '60d5ec4a2f8fb814c8f8d9f2': 'key_demo_beta_industries_1',
  '60d5ec4a2f8fb814c8f8d9f3': 'key_demo_gamma_services_2',
  '60d5ec4a2f8fb814c8f8d9f4': 'key_demo_delta_tech_3',
  '60d5ec4a2f8fb814c8f8d9f5': 'key_demo_epsilon_logistics_4',
  '60d5ec4a2f8fb814c8f8d9f6': 'key_demo_zeta_finance_5',
  '60d5ec4a2f8fb814c8f8d9f7': 'key_demo_eta_media_6',
  '60d5ec4a2f8fb814c8f8d9f8': 'key_demo_theta_health_7',
  '60d5ec4a2f8fb814c8f8d9f9': 'key_demo_iota_energy_8',
  '60d5ec4a2f8fb814c8f8d9fa': 'key_demo_kappa_retail_9',
};

// Interceptor to inject multi-tenant headers dynamically from localStorage
apiClient.interceptors.request.use((config) => {
  const tenantId = localStorage.getItem('tenantId') || '60d5ec4a2f8fb814c8f8d9f1';
  if (tenantId) {
    config.headers['X-Tenant-ID'] = tenantId;
    const apiKey = DEMO_API_KEYS[tenantId] || 'key_demo_acme_corporation_0';
    config.headers['X-API-Key'] = apiKey;
  }
  return config;
});
