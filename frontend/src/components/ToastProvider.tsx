import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import styled, { css, keyframes } from 'styled-components';

type Toast = {
  id: number;
  message: string;
  type: 'info' | 'error' | 'success';
};

type ToastContextType = {
  addToast: (message: string, type?: Toast['type']) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Date.now();
    const newToast: Toast = { id, message, type };
    setToasts((prev) => [...prev, newToast]);
    // Auto‑remove after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <ToastContainer>
        {toasts.map((t) => (
          <ToastItem key={t.id} type={t.type}>
            {t.message}
          </ToastItem>
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
};

// Styled‑components for the toast UI – glassmorphic, subtle animation
const slideIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
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

const toastTypeStyles = {
  info: css`
    background: rgba(30, 144, 255, 0.85);
    color: #fff;
  `,
  error: css`
    background: rgba(220, 20, 60, 0.9);
    color: #fff;
  `,
  success: css`
    background: rgba(34, 139, 34, 0.85);
    color: #fff;
  `,
};

type ToastItemProps = {
  type: Toast['type'];
};

const ToastItem = styled.div<ToastItemProps>`
  min-width: 250px;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  backdrop-filter: blur(8px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: ${slideIn} 0.3s ease-out;
  ${(props) => toastTypeStyles[props.type]}
`;

export default ToastProvider;
