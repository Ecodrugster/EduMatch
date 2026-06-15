import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/Header';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { accessToken, isInitializing } = useAuth();
  const location = useLocation();

  if (isInitializing) {
    return <div className="flex h-screen items-center justify-center bg-gray-800 text-cyan-100">Загрузка...</div>;
  }

  if (!accessToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <>
      <Header />
      {children}
    </>
  );
};

export default ProtectedRoute;
