
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  fullWidth = false,
  isLoading = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-moon-i-md transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 group';

  const variantStyles = {
    primary: 'bg-piccolo text-goten hover:bg-piccolo focus:ring-piccolo',
    secondary: 'bg-transparent text-bulma border border-trunks hover:border-bulma focus:ring-trunks',
    outline: 'border border-beerus bg-goten text-bulma hover:bg-gohan focus:ring-piccolo',
    ghost: 'bg-transparent text-trunks hover:bg-heles hover:text-bulma focus:ring-piccolo',
    danger: 'bg-dodoria text-goten hover:bg-dodoria focus:ring-dodoria',
  };

  const sizeStyles = {
    sm: 'h-8 px-3 text-moon-14 gap-1.5',
    md: 'h-10 px-4 text-moon-14 gap-2',
    lg: 'h-12 px-4 text-moon-16 gap-2',
  };

  const iconSize = {
    sm: 16,
    md: 18,
    lg: 20,
  };

  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      className={`
        ${baseStyles}
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${fullWidth ? 'w-full' : ''}
        ${(disabled || isLoading) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {!isLoading && Icon && iconPosition === 'left' && <Icon size={iconSize[size]} className="transition-transform duration-200 group-hover:scale-110" />}
      {children}
      {!isLoading && Icon && iconPosition === 'right' && <Icon size={iconSize[size]} className="transition-transform duration-200 group-hover:scale-110" />}
    </button>
  );
};

export default Button;

