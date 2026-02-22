
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
        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-moon-i-sm border transition-all ${isOpen
          ? 'bg-piccolo/10 text-piccolo border-piccolo/30'
          : 'bg-goten hover:bg-gohan text-bulma border-beerus'
          }`}
      >
        <div className="w-7 h-7 rounded-full bg-piccolo flex items-center justify-center flex-shrink-0">
          <User size={16} className="text-goten transition-transform duration-200 group-hover:scale-110" />
        </div>
        <div className="hidden sm:block text-left min-w-0">
          <div className="text-moon-12 font-medium text-bulma truncate">{userName}</div>
          <div className="text-[10px] text-trunks truncate">{userEmail}</div>
        </div>
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 flex-shrink-0 ${isOpen
            ? 'rotate-180 text-piccolo'
            : 'text-trunks'
            }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-52 bg-goten rounded-moon-s-md py-1.5 z-50 border border-beerus overflow-hidden">
          <button
            onClick={() => handleMenuItemClick('account')}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-moon-12 text-bulma hover:bg-gohan transition-colors group/item"
          >
            <User size={14} className="text-trunks transition-all duration-200 group-hover/item:text-piccolo group-hover/item:scale-110" />
            <span>Account</span>
          </button>
          <div className="border-t border-beerus my-0.5"></div>
          <button
            onClick={() => handleMenuItemClick('logout')}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-moon-12 text-dodoria hover:bg-dodoria/10 transition-colors group/item"
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
