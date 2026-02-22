
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
      className={`fixed inset-0 bg-popo/80 backdrop-blur-sm z-[100] p-4 transition-all flex justify-center ${scrollable ? 'items-center overflow-hidden' : 'items-start overflow-y-auto'}`}
      onClick={handleBackdropClick}
    >
      <div
        className={`bg-goten rounded-moon-s-lg w-full ${maxWidthClasses[maxWidth]} ${scrollable ? 'overflow-y-auto' : 'overflow-visible'} border border-beerus ${!scrollable ? 'my-8' : ''}`}
        style={scrollable ? { maxHeight } : {}}
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-goten px-6 py-4 border-b border-beerus flex justify-between items-center z-10">
          <h2 className="text-moon-24 font-semibold text-bulma">{title}</h2>
          <button onClick={onClose} className="text-trunks hover:text-bulma transition-colors p-2 rounded-moon-i-sm hover:bg-gohan">
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
