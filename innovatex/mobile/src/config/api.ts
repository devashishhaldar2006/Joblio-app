import { Platform } from 'react-native';

const getDevFallbackUrl = (port: number) => {
  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${port}`;
  }
  return `http://localhost:${port}`;
};

export const API_CONFIG = {
  NODE_URL:
    process.env.EXPO_PUBLIC_API_URL ||
    'https://joblio-backend.onrender.com',
  PYTHON_URL:
    process.env.EXPO_PUBLIC_PYTHON_URL ||
    'https://joblio-ai-service.onrender.com',
};
