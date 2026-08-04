import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import axios, { AxiosInstance } from 'axios';

export interface User {
  id: number;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<User>;
  register: (formData: any) => Promise<any>;
  logout: () => Promise<void>;
  updateProfile: (data: { username?: string; email?: string; password?: string }) => Promise<User>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || http://13.63.52.134,
  headers: {
    "Content-Type": "application/json",
  },
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setLoading(false);
      return;
    }
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    api.get('/auth/me')
      .then((response) => setUser(response.data))
      .catch(() => {
        localStorage.removeItem('access_token');
        delete api.defaults.headers.common.Authorization;
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (username: string, password: string): Promise<User> => {
    const response = await api.post('/auth/login', { username, password });
    localStorage.setItem('access_token', response.data.access_token);
    api.defaults.headers.common.Authorization = `Bearer ${response.data.access_token}`;
    const me = await api.get('/auth/me');
    setUser(me.data);
    return me.data;
  };

  const register = async (formData: any): Promise<any> => {
    const { data } = await api.post('/auth/register', formData);
    return data;
  };

  const logout = async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.warn('Backend logout failed. Clearing local session.', e);
    }
    localStorage.removeItem('access_token');
    delete api.defaults.headers.common.Authorization;
    setUser(null);
  };

  const updateProfile = async (data: { username?: string; email?: string; password?: string }): Promise<User> => {
    const response = await api.put('/auth/update', data);
    setUser(response.data);
    return response.data;
  };

  const value = useMemo(() => ({ user, loading, login, register, logout, updateProfile }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export { api };
