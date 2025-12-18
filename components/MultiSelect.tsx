
import React, { useState, useRef, useEffect } from 'react';
import { X, ChevronDown, Search, Check } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: Option[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  searchable?: boolean;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  selectedValues,
  onChange,
  placeholder = 'Select options...',
  label,
  error,
  helperText,
  disabled = false,
  searchable = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter options based on search query
  const filteredOptions = searchable
    ? options.filter(option =>
      option.label.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : options;

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleOption = (value: string) => {
    if (disabled) return;

    const newValues = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value];
    onChange(newValues);
  };

  const removeOption = (value: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    onChange(selectedValues.filter(v => v !== value));
  };

  const getSelectedLabels = () => {
    return selectedValues
      .map(value => {
        const option = options.find(opt => opt.value === value);
        return option ? { value, label: option.label } : null;
      })
      .filter(Boolean) as { value: string; label: string }[];
  };

  const selectedLabels = getSelectedLabels();

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-on-surface mb-2">
          {label}
        </label>
      )}
      <div className="relative" ref={dropdownRef}>
        <div
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`
            w-full min-h-[38px] px-3 py-2 bg-white border rounded-lg
            text-on-surface text-left text-sm cursor-pointer
            focus:bg-surface-hover outline-none
            ${disabled ? 'bg-gray-50 text-on-surface-tertiary cursor-not-allowed' : ''}
            transition-all
            flex items-center justify-between gap-2
            ${error ? 'border-error' : 'border-border'}
            ${isOpen ? 'ring-1 ring-primary border-primary' : ''}
          `}
        >
          <div className="flex-1 flex flex-wrap gap-1.5 items-center min-h-[22px]">
            {selectedLabels.length === 0 ? (
              <span className="text-on-surface-tertiary">{placeholder}</span>
            ) : (
              selectedLabels.map((item) => (
                <span
                  key={item.value}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-lg border border-primary/20"
                >
                  {item.label}
                  {!disabled && (
                    <button
                      type="button"
                      onClick={(e) => removeOption(item.value, e)}
                      className="hover:bg-primary/30 rounded p-0.5 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  )}
                </span>
              ))
            )}
          </div>
          <ChevronDown
            size={18}
            className={`text-on-surface-tertiary transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-border rounded-lg max-h-60 overflow-hidden">
            {searchable && (
              <div className="p-2 border-b border-border">
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-on-surface-tertiary"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-border rounded-lg text-on-surface text-sm focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                    autoFocus
                  />
                </div>
              </div>
            )}
            <div className="overflow-y-auto max-h-48">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-2 text-sm text-on-surface-tertiary text-center">
                  No options found
                </div>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected = selectedValues.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => toggleOption(option.value)}
                      className={`
                        w-full px-3 py-2 text-left text-sm transition-colors
                        flex items-center gap-2
                        ${isSelected
                          ? 'bg-primary/10 text-primary'
                          : 'text-on-surface hover:bg-surface-hover'
                        }
                      `}
                    >
                      <div className={`w-4 h-4 border rounded flex items-center justify-center ${isSelected ? 'bg-primary border-primary' : 'border-border'
                        }`}>
                        {isSelected && <Check size={12} className="text-on-primary" />}
                      </div>
                      <span>{option.label}</span>
                    </button>
                  );
                })
              )}
            </div>
            {selectedValues.length > 0 && (
              <div className="px-3 py-2 border-t border-border bg-surface">
                <button
                  type="button"
                  onClick={() => {
                    onChange([]);
                    setSearchQuery('');
                  }}
                  className="text-xs text-on-surface-secondary hover:text-on-surface transition-colors"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-2 text-sm text-error">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-2 text-sm text-on-surface-secondary">{helperText}</p>
      )}
    </div>
  );
};

export default MultiSelect;

