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
      className="fixed inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm z-[1000]"
    >
      <div 
        onClick={e => e.stopPropagation()}
        className="bg-white/10 backdrop-blur-md rounded-xl p-8 min-w-[320px] shadow-2xl"
      >
        {children}
      </div>
    </div>
  );
};
