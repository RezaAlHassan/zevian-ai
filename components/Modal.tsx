
import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full';
  maxHeight?: string;
  closeOnOutsideClick?: boolean;
  scrollable?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'md',
  maxHeight = '90vh',
  closeOnOutsideClick = true,
  scrollable = true
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = () => {
    if (closeOnOutsideClick) {
      onClose();
    }
  };

  const maxWidthClasses = {
    'sm': 'max-w-sm',
    'md': 'max-w-2xl',
    'lg': 'max-w-3xl',
    'xl': 'max-w-4xl',
    '2xl': 'max-w-5xl',
    '3xl': 'max-w-6xl',
    '4xl': 'max-w-7xl',
    '5xl': 'max-w-[80rem]',
    '6xl': 'max-w-[90rem]',
    '7xl': 'max-w-[100rem]',
    'full': 'max-w-full'
  };

  return createPortal(
    <div
      className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] p-4 transition-all flex justify-center ${scrollable ? 'items-center overflow-hidden' : 'items-start overflow-y-auto'}`}
      onClick={handleBackdropClick}
    >
      <div
        className={`bg-surface-elevated rounded-lg w-full ${maxWidthClasses[maxWidth]} ${scrollable ? 'overflow-y-auto' : 'overflow-visible'} border border-border shadow-2xl ${!scrollable ? 'my-8' : ''}`}
        style={scrollable ? { maxHeight } : {}}
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-surface-elevated px-6 py-4 border-b border-border flex justify-between items-center z-10">
          <h2 className="text-xl font-semibold text-on-surface">{title}</h2>
          <button onClick={onClose} className="text-on-surface-secondary hover:text-on-surface transition-colors p-1 rounded hover:bg-surface-hover">
            <X size={24} />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;
