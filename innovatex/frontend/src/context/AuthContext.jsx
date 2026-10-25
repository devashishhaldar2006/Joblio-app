import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('innovatex_user');
    const token = localStorage.getItem('innovatex_token');
    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (err) {
        localStorage.removeItem('innovatex_user');
        localStorage.removeItem('innovatex_token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    localStorage.removeItem('innovatex_last_github_user');
    sessionStorage.clear();
    const res = await api.post('/auth/login', { email, password });
    const { token, user } = res.data;
    localStorage.setItem('innovatex_token', token);
    localStorage.setItem('innovatex_user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  const register = async (name, email, password) => {
    localStorage.removeItem('innovatex_last_github_user');
    sessionStorage.clear();
    const res = await api.post('/auth/register', { name, email, password });
    const { token, user } = res.data;
    localStorage.setItem('innovatex_token', token);
    localStorage.setItem('innovatex_user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  const logout = () => {
    localStorage.removeItem('innovatex_token');
    localStorage.removeItem('innovatex_user');
    localStorage.removeItem('innovatex_last_github_user');
    sessionStorage.clear();
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    const merged = { ...user, ...updatedUser };
    localStorage.setItem('innovatex_user', JSON.stringify(merged));
    setUser(merged);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
