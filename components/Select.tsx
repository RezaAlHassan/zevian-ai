import React from 'react';
import {
  Select as ShadcnSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  error?: string;
  helperText?: string;
  options: { value: string; label: string }[];
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onValueChange?: (value: string) => void;
}

const Select: React.FC<SelectProps> = ({
  label,
  error,
  helperText,
  options,
  className = '',
  onChange,
  onValueChange,
  value,
  defaultValue,
  disabled,
  ...props
}) => {

  const handleValueChange = (val: string) => {
    if (onValueChange) {
      onValueChange(val);
    }
    if (onChange) {
      onChange({
        target: { value: val, name: props.name, id: props.id },
        currentTarget: { value: val, name: props.name, id: props.id }
      } as React.ChangeEvent<HTMLSelectElement>);
    }
  };

  // Convert empty values to something Radix accepts, or filter them.
  // Radix SelectItem value cannot be empty string in some versions, but usually it's fine.
  // Actually, Radix requires value to be present. If it's empty, we should map it to "none" or something.
  // It's safer to just let it be if it works, otherwise map empty to "_empty".
  const sanitizeValue = (v: any) => (v === '' ? '_empty' : v?.toString());

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={props.id} className="block text-sm font-medium text-foreground mb-2">
          {label}
        </label>
      )}

      <ShadcnSelect
        value={value !== undefined ? sanitizeValue(value) : undefined}
        defaultValue={defaultValue !== undefined ? sanitizeValue(defaultValue) : undefined}
        onValueChange={(v) => handleValueChange(v === '_empty' ? '' : v)}
        disabled={disabled}
      >
        <SelectTrigger
          id={props.id}
          className={`w-full bg-background text-foreground ${error ? 'border-destructive focus:ring-destructive ring-destructive' : 'border-input'} ${className}`}
        >
          <SelectValue placeholder={props.placeholder || "Select an option"} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem
              key={option.value || '_empty'}
              value={sanitizeValue(option.value)}
              disabled={option.value === '' && option.label.includes('--')}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </ShadcnSelect>

      {error && (
        <p className="mt-2 text-xs text-destructive font-medium">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-2 text-xs text-muted-foreground">{helperText}</p>
      )}
    </div>
  );
};

export default Select;

