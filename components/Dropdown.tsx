import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface DropdownProps {
  label?: string;
  buttonText: string;
  children: React.ReactNode;
  className?: string;
  buttonClassName?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  align?: 'left' | 'right';
}

const Dropdown: React.FC<DropdownProps> = ({
  label,
  buttonText,
  children,
  className = '',
  buttonClassName = '',
  variant = 'default',
  size = 'md',
  icon,
  align = 'left',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Calculate position for fixed dropdown menu
  useEffect(() => {
    if (isOpen && buttonRef.current && menuRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const menuRect = menuRef.current.getBoundingClientRect();
      
      if (align === 'right') {
        menuRef.current.style.right = `${window.innerWidth - buttonRect.right}px`;
        menuRef.current.style.left = 'auto';
      } else {
        menuRef.current.style.left = `${buttonRect.left}px`;
        menuRef.current.style.right = 'auto';
      }
      
      menuRef.current.style.top = `${buttonRect.bottom + 4}px`;
    }
  }, [isOpen, align]);

  const sizeClasses = {
    sm: 'py-1.5 px-3 text-sm',
    md: 'py-2 px-4 text-sm',
    lg: 'py-2.5 px-5 text-base',
  };

  const variantClasses = {
    default: 'bg-white text-on-surface border border-border hover:bg-surface-hover',
    outline: 'bg-transparent text-on-surface border border-border hover:bg-surface-hover',
    ghost: 'bg-transparent text-on-surface hover:bg-surface-hover',
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-on-surface-secondary mb-2">
          {label}
        </label>
      )}
      <button
        ref={buttonRef}
        type="button"
        className={`
          inline-flex items-center gap-2 ${sizeClasses[size]} ${variantClasses[variant]}
          rounded-lg font-medium transition-all
          focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
          ${buttonClassName}
        `}
        onClick={() => setIsOpen(!isOpen)}
      >
        {icon && <span className="flex-shrink-0">{icon}</span>}
        {buttonText && <span>{buttonText}</span>}
        {(!icon || buttonText) && (
          <ChevronDown 
            size={16} 
            className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div
            ref={menuRef}
            className="fixed z-50 mt-1 min-w-[12rem] bg-white rounded-lg shadow-lg border border-border py-1"
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </div>
        </>
      )}
    </div>
  );
};

interface DropdownItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export const DropdownItem: React.FC<DropdownItemProps> = ({
  children,
  onClick,
  className = '',
  disabled = false,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full text-left px-4 py-2 text-sm text-on-surface
        hover:bg-surface-hover transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {children}
    </button>
  );
};

interface DropdownDividerProps {
  className?: string;
}

export const DropdownDivider: React.FC<DropdownDividerProps> = ({ className = '' }) => {
  return <div className={`my-1 border-t border-border ${className}`} />;
};

export default Dropdown;

