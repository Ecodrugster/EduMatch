import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

type Toast = {
  id: number;
  message: string;
  type: 'info' | 'error' | 'success';
};

type ToastContextType = {
  addToast: (message: string, type?: Toast['type']) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const toastTypeClasses = {
  info: 'bg-blue-500/85 text-gray-900 dark:text-white',
  error: 'bg-red-600/90 text-gray-900 dark:text-white',
  success: 'bg-green-600/85 text-gray-900 dark:text-white',
};

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
      <div className="fixed top-4 right-4 flex flex-col gap-2 z-[9999]">
        {toasts.map((t) => (
          <div 
            key={t.id} 
            className={`min-w-[250px] px-4 py-3 rounded-lg backdrop-blur-md shadow-lg animate-[slideIn_0.3s_ease-out] ${toastTypeClasses[t.type]}`}
          >
            {t.message}
          </div>
        ))}
      </div>
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

export default ToastProvider;
