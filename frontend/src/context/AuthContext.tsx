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
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);

  // decode token when it changes
  useEffect(() => {
    if (accessToken) {
      const payload = jwtDecode<AccessTokenPayload>(accessToken);
      setUserId(payload.user_id);
    } else {
      setUserId(null);
    }
  }, [accessToken]);

  const login = async (username: string, password: string) => {
    const response = await axiosInstance.post('/auth/login', { username, password });
    // backend returns access token in body and sets refresh token in HttpOnly cookie
    setAccessToken(response.data.access_token);
  };

  const logout = () => {
    setAccessToken(null);
    setUserId(null);
    // optionally call backend logout endpoint to clear cookie
    axiosInstance.post('/auth/logout').catch(() => {});
  };

  // attach interceptor to include access token and handle refresh
  useEffect(() => {
    const requestInterceptor = axiosInstance.interceptors.request.use(config => {
      if (accessToken) {
        config.headers = { ...config.headers, Authorization: `Bearer ${accessToken}` };
      }
      return config;
    });

    const responseInterceptor = axiosInstance.interceptors.response.use(
      res => res,
      async err => {
        if (err.response?.status === 401 && accessToken) {
          // try to refresh token using HttpOnly cookie
          try {
            const refreshRes = await axiosInstance.post('/auth/refresh');
            const newAccess = refreshRes.data.access_token;
            setAccessToken(newAccess);
            // retry original request
            err.config.headers.Authorization = `Bearer ${newAccess}`;
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
    <AuthContext.Provider value={{ accessToken, userId, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
