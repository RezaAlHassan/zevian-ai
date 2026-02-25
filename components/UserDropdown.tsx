
import React, { useState, useRef, useEffect } from 'react';
import { User, LogOut, ChevronDown } from 'lucide-react';

interface UserDropdownProps {
  userName?: string;
  userEmail?: string;
  onNavigateToAccount?: () => void;
  onLogout?: () => void;
}

const UserDropdown: React.FC<UserDropdownProps> = ({
  userName = 'Current User',
  userEmail = 'user@example.com',
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
    if (action === 'account' && onNavigateToAccount) {
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
          : 'bg-background hover:bg-muted text-foreground border-border'
          }`}
      >
        <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
          <User size={16} className="text-primary-foreground transition-transform duration-200 group-hover:scale-110" />
        </div>
        <div className="hidden sm:block text-left min-w-0">
          <div className="text-xs font-medium text-foreground truncate">{userName}</div>
          <div className="text-[10px] text-muted-foreground truncate">{userEmail}</div>
        </div>
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 flex-shrink-0 ${isOpen
            ? 'rotate-180 text-primary'
            : 'text-muted-foreground'
            }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-52 bg-popover rounded-xl py-1.5 z-50 border border-border overflow-hidden shadow-lg">
          <button
            onClick={() => handleMenuItemClick('account')}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-popover-foreground hover:bg-accent transition-colors group/item"
          >
            <User size={14} className="text-muted-foreground transition-all duration-200 group-hover/item:text-primary group-hover/item:scale-110" />
            <span>Account</span>
          </button>
          <div className="border-t border-border my-0.5"></div>
          <button
            onClick={() => handleMenuItemClick('logout')}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-destructive hover:bg-destructive/10 transition-colors group/item"
          >
            <LogOut size={14} className="transition-all duration-200 group-hover/item:scale-110" />
            <span>Logout</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default UserDropdown;
