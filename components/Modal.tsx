
import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-surface-elevated rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-border"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-surface-elevated px-6 py-4 border-b border-border flex justify-between items-center">
          <h2 className="text-xl font-semibold text-on-surface">{title}</h2>
          <button onClick={onClose} className="text-on-surface-secondary hover:text-on-surface transition-colors p-1 rounded hover:bg-surface-hover">
            <X size={24} />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
