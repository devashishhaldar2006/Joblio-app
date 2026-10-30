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

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
      !originalRequest._retryAuth &&
      getActiveTokenFn
    ) {
      originalRequest._retryAuth = true;
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

    // 2. Seamless in-flight auto-retry for 502 / 503 / 504 / cold-start timeouts
    // Instead of throwing an error alert to the user, automatically keep retrying
    // with backoff while keeping the app loader spinning smoothly.
    const isColdStart =
      status === 502 ||
      status === 503 ||
      status === 504 ||
      error.code === 'ECONNABORTED' ||
      error.code === 'ECONNRESET' ||
      error.message?.includes('Network Error') ||
      error.message?.includes('timeout');

    if (isColdStart && originalRequest) {
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
      const maxRetries = 6;

      if (originalRequest._retryCount <= maxRetries) {
        const backoffMs = Math.min(3000 * Math.pow(1.3, originalRequest._retryCount - 1), 8000);
        console.log(
          `[apiClient] Render instance cold start (status ${status || error.code}). Auto-retrying ${originalRequest._retryCount}/${maxRetries} in ${Math.round(backoffMs)}ms...`
        );
        // Ping health endpoint concurrently to awaken Render
        axios.get(`${API_CONFIG.NODE_URL}/api/health`, { timeout: 10000 }).catch(() => {});
        await sleep(backoffMs);
        return apiClient(originalRequest);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
