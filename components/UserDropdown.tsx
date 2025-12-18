
import React, { useState, useRef, useEffect } from 'react';
import { User, Settings, CreditCard, LogOut, ChevronDown, Building2 } from 'lucide-react';

interface UserDropdownProps {
  userName?: string;
  userEmail?: string;
  isCreator?: boolean;
  onNavigateToSettings?: () => void;
  onNavigateToAccount?: () => void;
  onLogout?: () => void;
}

const UserDropdown: React.FC<UserDropdownProps> = ({
  userName = 'Current User',
  userEmail = 'user@example.com',
  isCreator = false,
  onNavigateToSettings,
  onNavigateToAccount,
  onLogout
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMenuItemClick = (action: string) => {
    setIsOpen(false);
    if (action === 'settings' && onNavigateToSettings) {
      onNavigateToSettings();
    } else if (action === 'account' && onNavigateToAccount) {
      onNavigateToAccount();
    } else if (action === 'logout' && onLogout) {
      onLogout();
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-all ${isOpen
          ? 'bg-primary/10 text-primary border-primary/30'
          : 'bg-white hover:bg-surface-hover text-on-surface border-border'
          }`}
      >
        <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
          <User size={16} className="text-on-primary" />
        </div>
        <div className="hidden sm:block text-left min-w-0">
          <div className="text-xs font-medium text-on-surface truncate">{userName}</div>
          <div className="text-[10px] text-on-surface-secondary truncate">{userEmail}</div>
        </div>
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 flex-shrink-0 ${isOpen
            ? 'rotate-180 text-primary'
            : 'text-on-surface-secondary'
            }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-52 bg-white rounded-lg shadow-lg py-1.5 z-50 border border-border overflow-hidden">
          {isCreator && (
            <>
              <button
                onClick={() => handleMenuItemClick('organization')}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-on-surface hover:bg-surface-hover transition-colors"
              >
                <Building2 size={14} className="text-on-surface-secondary" />
                <span>Organization</span>
              </button>
              <div className="border-t border-border my-0.5"></div>
            </>
          )}
          <button
            onClick={() => handleMenuItemClick('account')}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-on-surface hover:bg-surface-hover transition-colors"
          >
            <User size={14} className="text-on-surface-secondary" />
            <span>Account</span>
          </button>
          <button
            onClick={() => handleMenuItemClick('billing')}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-on-surface hover:bg-surface-hover transition-colors"
          >
            <CreditCard size={14} className="text-on-surface-secondary" />
            <span>Billing</span>
          </button>
          <button
            onClick={() => handleMenuItemClick('settings')}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-on-surface hover:bg-surface-hover transition-colors"
          >
            <Settings size={14} className="text-on-surface-secondary" />
            <span>Settings</span>
          </button>
          <div className="border-t border-border my-0.5"></div>
          <button
            onClick={() => handleMenuItemClick('logout')}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-error hover:bg-error/10 transition-colors"
          >
            <LogOut size={14} />
            <span>Logout</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default UserDropdown;
