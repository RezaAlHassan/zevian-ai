
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
        <label htmlFor={props.id} className="block text-moon-14 font-medium text-bulma mb-2">
          {label}
        </label>
      )}
      <input
        {...props}
        className={`
          py-2 px-3 block w-full border rounded-moon-i-md text-moon-14
          bg-goten text-bulma placeholder-trunks
          focus:border-piccolo focus:ring-piccolo focus:ring-1
          disabled:bg-gohan disabled:text-trunks disabled:cursor-not-allowed
          transition-all
          ${error ? 'border-dodoria focus:border-dodoria focus:ring-dodoria' : 'border-beerus'}
          ${className}
        `}
      />
      {error && (
        <p className="mt-2 text-moon-12 text-dodoria">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-2 text-moon-12 text-trunks">{helperText}</p>
      )}
    </div>
  );
};

export default Input;

