import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config/api';

const apiClient = axios.create({
  baseURL: `${API_CONFIG.NODE_URL}/api`,
  timeout: 120000,
});

apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
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

export default apiClient;
