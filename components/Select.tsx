
import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: { value: string; label: string }[];
}

const Select: React.FC<SelectProps> = ({ label, error, helperText, options, className = '', ...props }) => {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={props.id} className="block text-sm font-medium text-on-surface mb-2">
          {label}
        </label>
      )}
      <select
        {...props}
        className={`
          py-2 px-3 pe-9 block w-full border rounded-lg text-sm
          bg-white text-on-surface
          focus:border-primary focus:ring-primary focus:ring-1
          disabled:bg-gray-50 disabled:text-on-surface-tertiary disabled:cursor-not-allowed
          transition-all appearance-none
          bg-[url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")] bg-[length:1.5em_1.5em] bg-[center_right_0.5rem] bg-no-repeat
          ${error ? 'border-error focus:border-error focus:ring-error' : 'border-border'}
          ${className}
        `}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.value === '' && option.label.includes('--')}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-2 text-sm text-error">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-2 text-sm text-on-surface-secondary">{helperText}</p>
      )}
    </div>
  );
};

export default Select;

