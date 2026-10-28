import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config/api';

// Registry function so AuthContext can provide a live token getter
let getActiveTokenFn: (() => Promise<string | null>) | null = null;

export const setAuthTokenGetter = (fn: () => Promise<string | null>) => {
  getActiveTokenFn = fn;
};

export const getFreshToken = async (): Promise<string | null> => {
  if (getActiveTokenFn) {
    try {
      const freshToken = await getActiveTokenFn();
      if (freshToken) {
        await AsyncStorage.setItem('auth_token', freshToken);
        return freshToken;
      }
    } catch (e) {
      console.warn('[apiClient] Error fetching fresh token via token getter:', e);
    }
  }
  return await AsyncStorage.getItem('auth_token');
};

const apiClient = axios.create({
  baseURL: `${API_CONFIG.NODE_URL}/api`,
  timeout: 120000,
});

apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await getFreshToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.warn('Error reading token from storage', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercept 401s (token refresh) and 502/503/504/timeout (server cold starts)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // 1. Auto-retry 401 with fresh Clerk token
    if (
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      getActiveTokenFn
    ) {
      originalRequest._retry = true;
      try {
        const freshToken = await getActiveTokenFn();
        if (freshToken) {
          await AsyncStorage.setItem('auth_token', freshToken);
          originalRequest.headers.Authorization = `Bearer ${freshToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshErr) {
        console.warn('[apiClient] 401 token refresh retry failed:', refreshErr);
      }
    }

    // 2. Handle 502 / 503 / 504 / network timeout from sleeping Render instances
    if (status === 502 || status === 503 || status === 504 || error.code === 'ECONNABORTED' || error.message?.includes('Network Error')) {
      const friendlyError = new Error(
        'Our cloud engine was warming up from idle. Please tap again in 5 seconds.'
      );
      (friendlyError as any).response = error.response;
      return Promise.reject(friendlyError);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
