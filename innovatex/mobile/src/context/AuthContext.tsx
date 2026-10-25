import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../services/apiClient';

interface User {
  _id: string;
  name: string;
  email: string;
  githubUsername?: string;
  skills?: string[];
  targetRole?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (updatedData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredSession();
  }, []);

  const loadStoredSession = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('auth_token');
      const storedUser = await AsyncStorage.getItem('auth_user');
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.warn('Failed to restore session', e);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await apiClient.post('/auth/login', { email, password });
      if (res.data && res.data.token) {
        setToken(res.data.token);
        setUser(res.data.user);
        await AsyncStorage.setItem('auth_token', res.data.token);
        await AsyncStorage.setItem('auth_user', JSON.stringify(res.data.user));
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('Login error', err.response?.data || err.message);
      throw new Error(err.response?.data?.error || 'Login failed. Please check credentials.');
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      const res = await apiClient.post('/auth/register', { name, email, password });
      if (res.data && res.data.token) {
        setToken(res.data.token);
        setUser(res.data.user);
        await AsyncStorage.setItem('auth_token', res.data.token);
        await AsyncStorage.setItem('auth_user', JSON.stringify(res.data.user));
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('Register error', err.response?.data || err.message);
      throw new Error(err.response?.data?.error || 'Registration failed.');
    }
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('auth_user');
  };

  const updateUser = (updatedData: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const next = { ...prev, ...updatedData };
      AsyncStorage.setItem('auth_user', JSON.stringify(next));
      return next;
    });
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
