'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp, LogOut, UserCircle2 } from 'lucide-react'; // Import icons
import { NavItem } from './types'; // Ensure NavItem type supports 'children'

// Import Inter font for this component
import { Inter } from 'next/font/google';
const inter = Inter({ subsets: ['latin'] });

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  navItems: NavItem[];
  isAuthenticated: boolean; // New prop
  userName: string | null; // New prop
  userId: string | null; // New prop
  logout: () => void; // New prop
}

export default function MobileMenu({ isOpen, onClose, navItems, isAuthenticated, userName, userId, logout }: MobileMenuProps) {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpand = (itemName: string) => {
    setExpandedItems(prev =>
      prev.includes(itemName)
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    );
  };

  const handleLogout = () => {
    logout();
    onClose(); // Close mobile menu after logout
  };

  // Determine the display name for the authenticated user
  const displayUserName = userName || userId?.substring(0, 8) || 'Utilisateur';

  return (
    <div className={`2xl:hidden overflow-hidden transition-all duration-500 ease-out ${inter.className} ${
      isOpen ? 'max-h-screen' : 'max-h-0'
    }`}>
      <div className={`bg-white/95 backdrop-blur-md border-t border-gray-200/50 transform transition-all duration-500 ease-out ${
        isOpen
          ? 'translate-y-0 opacity-100'
          : '-translate-y-4 opacity-0'
      }`}>
        <div className="px-4 py-6 space-y-1">
        {navItems.map((item, index) => (
          <div
            key={item.name}
            className={`transform transition-all duration-500 ease-out ${
              isOpen
                ? 'translate-x-0 opacity-100'
                : 'translate-x-8 opacity-0'
            }`}
            style={{
              transitionDelay: isOpen ? `${index * 100}ms` : '0ms'
            }}
          >
            <div className="flex items-center justify-between">
              {item.hasDropdown ? (
                <button
                  onClick={() => toggleExpand(item.name)}
                  className="text-gray-900 text-base font-medium py-3 flex-1 text-left"
                >
                  {item.name}
                </button>
              ) : (
                <Link
                  href={item.href || '#'}
                  onClick={onClose}
                  className="block text-gray-900 text-base font-medium py-3 flex-1"
                >
                  {item.name}
                </Link>
              )}

              {item.hasDropdown && (
                <button
                  onClick={() => toggleExpand(item.name)}
                  className="p-2 text-gray-600"
                >
                  {expandedItems.includes(item.name) ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </button>
              )}
            </div>

            {/* Dropdown content */}
            {item.hasDropdown && expandedItems.includes(item.name) && item.children && (
              <div className="pl-4 pb-3 space-y-2 transform transition-all duration-300 ease-out">
                {item.children.map((childItem) => (
                  <Link
                    key={childItem.name}
                    href={childItem.href || '#'}
                    onClick={onClose}
                    className="block text-gray-600 text-sm py-2 transform transition-all duration-200 hover:translate-x-2 hover:text-blue-600"
                  >
                    {childItem.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Contact Link */}
        <div
          className={`transform transition-all duration-500 ease-out ${
            isOpen
              ? 'translate-x-0 opacity-100'
              : 'translate-x-8 opacity-0'
          }`}
          style={{
            transitionDelay: isOpen ? `${navItems.length * 100}ms` : '0ms'
          }}
        >
          <Link
            href="/contact"
            onClick={onClose}
            className="flex items-center text-gray-900 text-base font-medium py-3 transform transition-all duration-200 hover:translate-x-2"
          >
            <div className="w-4 h-4 bg-black text-white text-xs flex items-center justify-center mr-3 transform transition-all duration-200 hover:scale-110">
              i
            </div>
            Contact
          </Link>
        </div>

        {/* Conditional Connexion / User Menu for Mobile */}
        {isAuthenticated ? (
          <div
            className={`transform transition-all duration-500 ease-out mt-4 ${ // Added mt-4 for spacing
              isOpen
                ? 'translate-x-0 opacity-100'
                : 'translate-x-8 opacity-0'
            }`}
            style={{
              transitionDelay: isOpen ? `${(navItems.length + 1) * 100}ms` : '0ms'
            }}
          >
            <div className="flex items-center text-gray-900 text-base font-medium py-3">
              <UserCircle2 className="w-5 h-5 mr-3" />
              Bienvenue, {displayUserName}
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center w-full text-left bg-red-600 text-white px-4 py-2 mt-2 rounded-full text-base font-medium hover:bg-red-700 transition-colors duration-300"
            >
              <LogOut className="w-5 h-5 mr-3" /> Déconnexion
            </button>
          </div>
        ) : (
          <div
            className={`transform transition-all duration-500 ease-out ${
              isOpen
                ? 'translate-x-0 opacity-100'
                : 'translate-x-8 opacity-0'
            }`}
            style={{
              transitionDelay: isOpen ? `${(navItems.length + 1) * 100}ms` : '0ms'
            }}
          >
            <Link
              href="/connexion"
              onClick={onClose}
              className="block text-center bg-black text-white px-4 py-2 mt-4 rounded-full text-base font-medium hover:bg-blue-600 transition-colors duration-300"
            >
              Connexion
            </Link>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
