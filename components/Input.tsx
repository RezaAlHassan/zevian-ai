
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input: React.FC<InputProps> = ({ label, error, helperText, className = '', ...props }) => {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={props.id} className="block text-sm font-medium text-on-surface mb-2">
          {label}
        </label>
      )}
      <input
        {...props}
        className={`
          py-2 px-3 block w-full border rounded-lg text-sm
          bg-white text-on-surface placeholder-on-surface-tertiary
          focus:border-primary focus:ring-primary focus:ring-1
          disabled:bg-gray-50 disabled:text-on-surface-tertiary disabled:cursor-not-allowed
          transition-all
          ${error ? 'border-error focus:border-error focus:ring-error' : 'border-border'}
          ${className}
        `}
      />
      {error && (
        <p className="mt-2 text-sm text-error">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-2 text-sm text-on-surface-secondary">{helperText}</p>
      )}
    </div>
  );
};

export default Input;

