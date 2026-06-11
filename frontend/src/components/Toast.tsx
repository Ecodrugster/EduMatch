import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import styled, { css, keyframes } from 'styled-components';

type Toast = {
  id: number;
  message: string;
  type: 'error' | 'success' | 'info' | 'warning';
};

interface ToastContextProps {
  addToast: (message: string, type?: Toast['type']) => void;
}

const ToastContext = createContext<ToastContextProps | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    // auto‑remove after 5 s
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <ToastContainer>
        {toasts.map(t => (
          <ToastMessage key={t.id} type={t.type}>
            {t.message}
          </ToastMessage>
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const ToastContainer = styled.div`
  position: fixed;
  top: 1rem;
  right: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  z-index: 9999;
`;

const typeStyles = {
  success: css`background: #28a745;`,
  error: css`background: #dc3545;`,
  warning: css`background: #ffc107; color: #212529;`,
  info: css`background: #17a2b8;`
};

const ToastMessage = styled.div<{ type: Toast['type'] }>`
  min-width: 250px;
  color: #fff;
  padding: 0.75rem 1rem;
  border-radius: 4px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
  animation: ${fadeIn} 0.3s ease forwards;
  ${({ type }) => typeStyles[type]}
`;
