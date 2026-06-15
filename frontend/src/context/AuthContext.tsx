import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import axiosInstance from '../api/axios';
import { jwtDecode } from 'jwt-decode';

type AccessTokenPayload = {
  user_id: number;
  exp: number;
  iat: number;
};

interface AuthContextProps {
  accessToken: string | null;
  userId: number | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isInitializing: boolean;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // attempt silent refresh on mount
  useEffect(() => {
    const rToken = localStorage.getItem('refresh_token');
    if (!rToken) {
      setIsInitializing(false);
      return;
    }
    axiosInstance.post('/auth/refresh', { refresh_token: rToken })
      .then(res => {
        setAccessToken(res.data.access_token);
      })
      .catch(() => {
        setAccessToken(null);
        localStorage.removeItem('refresh_token');
      })
      .finally(() => {
        setIsInitializing(false);
      });
  }, []);

  // decode token when it changes
  useEffect(() => {
    if (accessToken) {
      const payload = jwtDecode<AccessTokenPayload>(accessToken);
      setUserId(payload.user_id);
    } else {
      setUserId(null);
    }
  }, [accessToken]);

  const login = async (email: string, password: string) => {
    const response = await axiosInstance.post('/auth/login', { email, password });
    setAccessToken(response.data.access_token);
    localStorage.setItem('refresh_token', response.data.refresh_token);
  };

  const logout = () => {
    setAccessToken(null);
    setUserId(null);
    localStorage.removeItem('refresh_token');
    // optionally call backend logout endpoint
    axiosInstance.post('/auth/logout').catch(() => {});
  };

  // attach interceptor to include access token and handle refresh
  useEffect(() => {
    const requestInterceptor = axiosInstance.interceptors.request.use(config => {
      if (accessToken && config.headers) {
        config.headers.set('Authorization', `Bearer ${accessToken}`);
      }
      return config;
    });

    const responseInterceptor = axiosInstance.interceptors.response.use(
      res => res,
      async err => {
        if (err.response?.status === 401 && accessToken) {
          const rToken = localStorage.getItem('refresh_token');
          if (!rToken) {
            logout();
            return Promise.reject(err);
          }
          try {
            const refreshRes = await axiosInstance.post('/auth/refresh', { refresh_token: rToken });
            const newAccess = refreshRes.data.access_token;
            setAccessToken(newAccess);
            // retry original request
            if (err.config.headers) {
              err.config.headers.set('Authorization', `Bearer ${newAccess}`);
            }
            return axiosInstance.request(err.config);
          } catch (e) {
            logout();
            return Promise.reject(e);
          }
        }
        return Promise.reject(err);
      }
    );

    return () => {
      axiosInstance.interceptors.request.eject(requestInterceptor);
      axiosInstance.interceptors.response.eject(responseInterceptor);
    };
  }, [accessToken]);

  return (
    <AuthContext.Provider value={{ accessToken, userId, login, logout, isInitializing }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
