
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
        <label htmlFor={props.id} className="block text-moon-14 font-medium text-bulma mb-2">
          {label}
        </label>
      )}
      <select
        {...props}
        className={`
          py-2 px-3 pe-9 block w-full border rounded-moon-i-md text-moon-14
          bg-goten text-bulma
          focus:border-piccolo focus:ring-piccolo focus:ring-1
          disabled:bg-gohan disabled:text-trunks disabled:cursor-not-allowed
          transition-all appearance-none
          bg-[url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")] bg-[length:1.5em_1.5em] bg-[center_right_0.5rem] bg-no-repeat
          ${error ? 'border-dodoria focus:border-dodoria focus:ring-dodoria' : 'border-beerus'}
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
        <p className="mt-2 text-moon-12 text-dodoria">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-2 text-moon-12 text-trunks">{helperText}</p>
      )}
    </div>
  );
};

export default Select;

