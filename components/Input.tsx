
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
        <label htmlFor={props.id} className="block text-sm font-medium text-foreground mb-2">
          {label}
        </label>
      )}
      <input
        {...props}
        className={`
          py-2 px-3 block w-full border rounded-xl text-sm
          bg-background text-foreground placeholder-muted-foreground
          focus:border-ring focus:ring-ring focus:ring-1
          disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed
          transition-all
          ${error ? 'border-destructive focus:border-destructive focus:ring-destructive' : 'border-border'}
          ${className}
        `}
      />
      {error && (
        <p className="mt-2 text-xs text-destructive">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-2 text-xs text-muted-foreground">{helperText}</p>
      )}
    </div>
  );
};

export default Input;

