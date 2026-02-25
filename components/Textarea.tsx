
import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Textarea: React.FC<TextareaProps> = ({ label, error, helperText, className = '', ...props }) => {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={props.id} className="block text-sm font-medium text-foreground mb-2">
          {label}
        </label>
      )}
      <textarea
        {...props}
        className={`
          py-2 px-3 block w-full border rounded-lg text-sm
          bg-background text-foreground placeholder-muted-foreground
          focus:border-primary focus:ring-primary focus:ring-1
          disabled:bg-gray-50 disabled:text-muted-foreground disabled:cursor-not-allowed
          transition-all resize-y
          ${error ? 'border-destructive focus:border-destructive focus:ring-destructive' : 'border-border'}
          ${className}
        `}
      />
      {error && (
        <p className="mt-2 text-sm text-destructive">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-2 text-sm text-muted-foreground">{helperText}</p>
      )}
    </div>
  );
};

export default Textarea;

