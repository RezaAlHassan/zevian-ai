import React from 'react';
import { Check } from 'lucide-react';

interface CheckboxProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: string;
    disabled?: boolean;
    id?: string;
    className?: string;
}

const Checkbox: React.FC<CheckboxProps> = ({
    checked,
    onChange,
    label,
    disabled = false,
    id,
    className = '',
}) => {
    const handleChange = () => {
        if (!disabled) {
            onChange(!checked);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            handleChange();
        }
    };

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <div
                id={id}
                role="checkbox"
                aria-checked={checked}
                tabIndex={disabled ? -1 : 0}
                onClick={handleChange}
                onKeyDown={handleKeyDown}
                className={`
          flex items-center justify-center w-4 h-4 rounded border transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
          ${checked
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'bg-background border-border text-transparent hover:border-primary/50'}
          ${disabled ? 'opacity-30 cursor-not-allowed grayscale' : ''}
        `}
            >
                {checked && <Check size={12} strokeWidth={3} />}
            </div>
            {label && (
                <label
                    htmlFor={id}
                    onClick={handleChange}
                    className={`text-sm font-medium text-foreground cursor-pointer select-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {label}
                </label>
            )}
        </div>
    );
};

export default Checkbox;
