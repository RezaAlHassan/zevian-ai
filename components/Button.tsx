
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  fullWidth = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantStyles = {
    primary: 'bg-primary text-white hover:bg-primary-hover focus:ring-primary',
    secondary: 'bg-secondary text-white hover:bg-indigo-700 focus:ring-secondary',
    outline: 'border border-border bg-white text-on-surface hover:bg-surface focus:ring-primary',
    ghost: 'bg-transparent text-on-surface-secondary hover:bg-surface-hover hover:text-on-surface focus:ring-primary',
    danger: 'bg-error text-white hover:bg-error-hover focus:ring-error',
  };
  
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-sm gap-2',
  };
  
  const iconSize = {
    sm: 16,
    md: 18,
    lg: 20,
  };
  
  return (
    <button
      {...props}
      disabled={disabled}
      className={`
        ${baseStyles}
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      {Icon && iconPosition === 'left' && <Icon size={iconSize[size]} />}
      {children}
      {Icon && iconPosition === 'right' && <Icon size={iconSize[size]} />}
    </button>
  );
};

export default Button;

