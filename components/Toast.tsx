
import React, { useEffect, useState } from 'react';
import { X, CheckCircle, Info, AlertCircle, Sparkles } from 'lucide-react';

export type ToastType = 'success' | 'info' | 'error' | 'action';

export interface ToastProps {
    id: string;
    message: string;
    type?: ToastType;
    actionLabel?: string;
    onAction?: () => void;
    onClose: (id: string) => void;
    duration?: number;
}

const Toast: React.FC<ToastProps> = ({
    id,
    message,
    type = 'info',
    actionLabel,
    onAction,
    onClose,
    duration = 5000,
}) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                handleClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [duration]);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => onClose(id), 300); // Wait for fade out animation
    };

    const icons = {
        success: <CheckCircle className="w-5 h-5 text-green-500" />,
        info: <Info className="w-5 h-5 text-blue-500" />,
        error: <AlertCircle className="w-5 h-5 text-red-500" />,
        action: <Sparkles className="w-5 h-5 text-primary" />,
    };

    const bgColors = {
        success: 'bg-green-50 border-green-100',
        info: 'bg-blue-50 border-blue-100',
        error: 'bg-red-50 border-red-100',
        action: 'bg-primary/5 border-primary/20',
    };

    return (
        <div
            className={`
        relative flex items-center gap-3 p-4 rounded-xl border 
        transition-all duration-300 transform
        ${isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-4 opacity-0 scale-95'}
        ${bgColors[type]}
      `}
            style={{ minWidth: '320px', maxWidth: '420px' }}
        >
            <div className="flex-shrink-0">{icons[type]}</div>
            <div className="flex-grow">
                <p className="text-sm font-medium text-foreground">{message}</p>
                {actionLabel && onAction && (
                    <button
                        onClick={() => {
                            onAction();
                            handleClose();
                        }}
                        className="mt-2 text-xs font-bold text-primary hover:text-primary/80 underline underline-offset-2"
                    >
                        {actionLabel}
                    </button>
                )}
            </div>
            <button
                onClick={handleClose}
                className="flex-shrink-0 p-1 rounded-lg hover:bg-on-surface/5 transition-colors text-muted-foreground"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};

export default Toast;
