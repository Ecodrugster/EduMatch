import React, { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 bg-slate-950/40 flex items-center justify-center backdrop-blur-sm z-[1000] transition-all"
    >
      <div 
        onClick={e => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-8 min-w-[320px] max-w-lg w-full mx-4 shadow-2xl transition-all"
      >
        {children}
      </div>
    </div>
  );
};
