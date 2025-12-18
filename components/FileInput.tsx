
import React, { useRef } from 'react';
import { Upload, X, File } from 'lucide-react';

interface FileInputProps {
  label?: string;
  files: File[];
  onChange: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  error?: string;
  helperText?: string;
  disabled?: boolean;
}

const FileInput: React.FC<FileInputProps> = ({
  label,
  files,
  onChange,
  accept,
  multiple = true,
  error,
  helperText,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (multiple) {
      onChange([...files, ...selectedFiles]);
    } else {
      onChange(selectedFiles);
    }
  };

  const handleRemoveFile = (index: number) => {
    onChange(files.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-on-surface-secondary mb-1.5">
          {label}
        </label>
      )}
      
      <div className="space-y-3">
        {/* File Input Button */}
        <button
          type="button"
          onClick={() => !disabled && fileInputRef.current?.click()}
          disabled={disabled}
          className={`
            w-full px-4 py-3 bg-surface border rounded-md
            text-on-surface
            focus:ring-2 focus:ring-primary focus:border-primary
            disabled:bg-surface-pressed disabled:text-on-surface-tertiary disabled:cursor-not-allowed
            transition-all duration-150
            flex items-center justify-center gap-2
            hover:bg-surface-hover
            ${error ? 'border-error' : 'border-border'}
          `}
        >
          <Upload size={18} className="text-on-surface-tertiary" />
          <span className="text-sm font-medium">
            {files.length === 0 ? 'Click to upload files' : 'Add more files'}
          </span>
        </button>
        
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-surface-elevated border border-border rounded-md hover:bg-surface-hover transition-colors"
              >
                <File size={18} className="text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-on-surface truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-on-surface-tertiary">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(index)}
                    className="text-error hover:text-error-hover transition-colors p-1 rounded hover:bg-error/10"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1.5 text-sm text-error">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1.5 text-xs text-on-surface-tertiary">{helperText}</p>
      )}
    </div>
  );
};

export default FileInput;

