import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth as useClerkAuth, useUser as useClerkUser } from '@clerk/clerk-expo';
import apiClient from '../services/apiClient';

export interface User {
  _id: string;
  name: string;
  email: string;
  clerkId: string;
  avatar?: string;
  githubUsername?: string;
  skills?: string[];
  targetRole?: string;
  hasCompletedOnboarding?: boolean;
  authProvider?: 'email' | 'google' | 'github';
  hasResume?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isClerkActive: boolean;
  logout: () => Promise<void>;
  updateUser: (updatedData: Partial<User>) => void;
  syncClerkSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Clerk hook bindings
  let clerkAuth: any = null;
  let clerkUser: any = null;
  try {
    clerkAuth = useClerkAuth();
    clerkUser = useClerkUser();
  } catch (e) {
    console.warn('[Clerk] Hook initialization warning', e);
  }

  const isClerkActive = Boolean(clerkAuth?.isLoaded);

  const loadStoredSession = useCallback(async () => {
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
  }, []);

  // When Clerk signs in, retrieve Clerk JWT and sync developer document in Mongo
  const syncClerkSession = useCallback(async () => {
    if (!clerkAuth?.isSignedIn || !clerkAuth?.getToken) return;
    try {
      setLoading(true);
      const clerkJwt = await clerkAuth.getToken();
      if (clerkJwt) {
        setToken(clerkJwt);
        await AsyncStorage.setItem('auth_token', clerkJwt);

        const email = clerkUser?.user?.primaryEmailAddress?.emailAddress || '';
        const name = clerkUser?.user?.fullName || clerkUser?.user?.firstName || 'Developer';
        const avatar = clerkUser?.user?.imageUrl || '';
        const clerkId = clerkAuth.userId || '';

        try {
          const res = await apiClient.post(
            '/auth/sync',
            {},
            { headers: { Authorization: `Bearer ${clerkJwt}` } }
          );
          if (res.data?.user) {
            setUser(res.data.user);
            await AsyncStorage.setItem('auth_user', JSON.stringify(res.data.user));
            return;
          }
        } catch (syncErr) {
          const fallbackUser: User = {
            _id: clerkId,
            clerkId,
            name,
            email,
            avatar,
            skills: ['TypeScript', 'React', 'Node.js'],
            targetRole: 'Software Engineer',
          };
          setUser(fallbackUser);
          await AsyncStorage.setItem('auth_user', JSON.stringify(fallbackUser));
        }
      }
    } catch (err) {
      console.warn('[AuthContext] Error syncing Clerk session:', err);
    } finally {
      setLoading(false);
    }
  }, [clerkAuth?.isSignedIn, clerkAuth?.userId, clerkUser?.user]);

  useEffect(() => {
    if (clerkAuth?.isLoaded) {
      if (clerkAuth.isSignedIn) {
        syncClerkSession();
      } else {
        setUser(null);
        setToken(null);
        AsyncStorage.removeItem('auth_token');
        AsyncStorage.removeItem('auth_user');
        setLoading(false);
      }
    } else {
      loadStoredSession();
    }
  }, [clerkAuth?.isLoaded, clerkAuth?.isSignedIn, syncClerkSession, loadStoredSession]);

  const logout = async () => {
    try {
      if (clerkAuth?.signOut) {
        await clerkAuth.signOut();
      }
    } catch (e) {
      console.warn('[Clerk] Sign out failed', e);
    }
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
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isClerkActive,
        logout,
        updateUser,
        syncClerkSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
