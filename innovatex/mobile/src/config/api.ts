import { Platform } from 'react-native';

const getBaseUrl = (port: number) => {
  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${port}`;
  }
  return `http://localhost:${port}`;
};

export const API_CONFIG = {
  NODE_URL: getBaseUrl(5000),
  PYTHON_URL: getBaseUrl(8000),
};
