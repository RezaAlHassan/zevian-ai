import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const maxWidthClasses = {
    'sm': 'sm:max-w-sm',
    'md': 'sm:max-w-2xl',
    'lg': 'sm:max-w-3xl',
    'xl': 'sm:max-w-4xl',
    '2xl': 'sm:max-w-5xl',
    '3xl': 'sm:max-w-6xl',
    '4xl': 'sm:max-w-7xl',
    '5xl': 'sm:max-w-[80rem]',
    '6xl': 'sm:max-w-[90rem]',
    '7xl': 'sm:max-w-[100rem]',
    'full': 'sm:max-w-full'
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={`${maxWidthClasses[maxWidth]} p-0 gap-0 overflow-hidden ${!scrollable ? 'my-8' : ''}`}
        onInteractOutside={(e) => {
          if (!closeOnOutsideClick) e.preventDefault();
        }}
      >
        <DialogHeader className="px-6 py-4 border-b border-border sticky top-0 bg-background z-10">
          <DialogTitle className="text-2xl font-semibold text-foreground pr-8 text-left">{title}</DialogTitle>
        </DialogHeader>
        <div
          className={`p-6 ${scrollable ? 'overflow-y-auto' : 'overflow-visible'}`}
          style={scrollable ? { maxHeight: `calc(${maxHeight} - 73px)` } : {}}
        >
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Modal;
