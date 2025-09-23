// components/Header.tsx
'use client';

import React, { useState } from 'react';
import { UserCircle2, ChevronDown, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

interface UserDropdownProps {
  userName: string | null;
  userId: string;
  displayUserName: string;
}

const UserDropdown: React.FC<UserDropdownProps> = ({ userName, userId, displayUserName }) => {
  const { getSessionTimeRemaining, logout } = useAuth();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const handleDropdownToggle = (dropdownName: string) => {
    setActiveDropdown(activeDropdown === dropdownName ? null : dropdownName);
  };

  // Convert milliseconds to a readable format (e.g., "5 min 30 sec")
  const formatTimeRemaining = (ms: number | null): string => {
    if (!ms) return 'N/A';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes} min ${remainingSeconds} sec`;
  };

  const timeRemaining = getSessionTimeRemaining();

  return (
    <div className="relative group xl:block" data-dropdown-name="user-menu">
      <button
        onClick={() => handleDropdownToggle('user-menu')}
        className="flex items-center bg-gray-800 text-white px-4 py-2.5 rounded-full text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors duration-300"
        aria-expanded={activeDropdown === 'user-menu'}
        aria-haspopup="true"
      >
        <UserCircle2 className="w-5 h-5 mr-2" />
        Bienvenue, {displayUserName}
        <ChevronDown
          className={`ml-2 h-4 w-4 transition-transform duration-300 ease-in-out ${
            activeDropdown === 'user-menu' ? 'rotate-180' : 'rotate-0'
          }`}
        />
      </button>
      {activeDropdown === 'user-menu' && (
        <div
          className="absolute top-full right-0 mt-3 w-56 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden transform-gpu transition-all duration-300 ease-out origin-top scale-95 opacity-0 group-[.group]:scale-100 group-[.group]:opacity-100"
          role="menu"
        >
          <div className="py-2">
            <div className="px-4 py-3 text-sm text-gray-800 font-semibold border-b border-gray-100 bg-gray-50">
              {userName || userId}
            </div>
            <div className="px-4 py-2 text-sm text-gray-600">
              Session expires in: {formatTimeRemaining(timeRemaining)}
            </div>
            <Link
              href="/dashboard"
              className="block px-4 py-2.5 text-sm text-gray-700 font-medium hover:bg-blue-50 hover:text-blue-700 focus:bg-blue-50 focus:text-blue-700 transition-all duration-200 hover:scale-105 transform origin-left"
              onClick={() => setActiveDropdown(null)}
              role="menuitem"
            >
              Mon Tableau de bord
            </Link>
            <button
              onClick={logout}
              className="flex items-center w-full text-left px-4 py-2.5 text-sm text-red-600 font-medium hover:bg-red-50 hover:text-red-700 focus:bg-red-50 focus:text-red-700 transition-all duration-200 hover:scale-105 transform origin-left"
              role="menuitem"
            >
              <LogOut className="w-4 h-4 mr-2" /> Déconnexion
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDropdown;