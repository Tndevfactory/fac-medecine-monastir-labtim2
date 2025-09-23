'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown, LogOut, UserCircle2 } from 'lucide-react'; // Import LogOut and UserCircle2 icons
import { NavItem } from './types'; // Ensure this type supports 'children' for nested dropdowns
import MobileMenu from './MobileMenu'; // Assuming this component exists and handles `navItems`
import AnimatedBurgerMenu from './AnimatedBurgerMenu'; // Assuming this component exists
import 'flag-icons/css/flag-icons.min.css';
import { useAuth } from '@/context/AuthContext'; // Import useAuth hook

// Import Inter font for this component
import { Inter } from 'next/font/google';
const inter = Inter({ subsets: ['latin'] });

const navItems: NavItem[] = [
  {
    name: 'LTIM',
    href: '#',
    hasDropdown: true,
    children: [
      { name: 'Présentation', href: '/presentation' },
      { name: 'Membres', href: '/membres' },
      // { name: 'Projets / Collaborations', href: '/ltim/projets-collaborations' },
    ],
  },
  {
    name: 'Productions Scientifiques',
    href: '#',
    hasDropdown: true,
    children: [
      { name: 'Publications', href: '/publications' },
      { name: 'Thèses et HDR', href: '/theses' },
      { name: 'Masters et stages ingénieurs', href: '/masters-stages' },
    ],
  },
  {
    name: 'Actualités',
    href: '#',
    hasDropdown: true,
    children: [
      { name: 'Formations', href: '/actualites?category=Formation' },
      { name: 'Conférences', href: '/actualites?category=Conférence' },
      { name: 'Laboratoire', href: '/actualites?category=Laboratoire' },
    ],
  },
  {
    name: 'Membres',
    href: '/membres',
    hasDropdown: false,
  },
];

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState('Francais');

  const { isAuthenticated, userId, userName, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const dropdowns = document.querySelectorAll('.group[data-dropdown-name]');
      let clickedInsideDropdown = false;
      dropdowns.forEach(dropdown => {
        if (dropdown.contains(event.target as Node)) {
          clickedInsideDropdown = true;
        }
      });

      if (!clickedInsideDropdown) {
        setActiveDropdown(null);
      }
    };

    if (activeDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeDropdown]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleDropdownToggle = (itemName: string) => {
    setActiveDropdown(activeDropdown === itemName ? null : itemName);
  };

  const handleLanguageSelect = (language: string) => {
    setSelectedLanguage(language);
    setActiveDropdown(null); // Close language dropdown after selection
  };

  const handleLogout = () => {
    logout(); // Call the logout function from AuthContext
    setActiveDropdown(null); // Close dropdown
    // No startLoading here, as logout typically involves a full page reload or client-side state clear
  };

  // Display only the first word of userName, or fallback to userId substring, or 'Utilisateur'.
  const displayUserName = userName ? userName.split(' ')[0] : userId?.substring(0, 8) || 'Utilisateur';

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out ${inter.className} ${
      isScrolled
        ? 'bg-white/95 backdrop-blur-2xl shadow-2xl mx-4 mt-4 rounded-2xl border border-gray-200/50'
        : 'bg-white border-b border-gray-100'
    }`}>
      <div className={`max-w-8xl px-8 2xl:px-40 xl:px-32 lg:px-28 mx-auto transition-all duration-300 ${
        isScrolled ? 'py-0' : 'py-0'
      }`}>
        <div className="flex justify-between items-center h-16 relative"> 
          {/* Left: Logo */}
          <div className="flex-shrink-0 z-10">
            <Link href="/">
              <img
                src="/images/logo.png"
                alt="LABTIM Logo"
                className="rounded-xl h-12 cursor-pointer"
              />
            </Link>
          </div>

          {/* Center: Desktop Navigation - ABSOLUTELY POSITIONED FOR PERFECT CENTERING */}
          <div className="hidden 2xl:flex items-center absolute left-1/2 transform -translate-x-1/2 z-30"> 
            <div className="flex items-center space-x-4 xl:space-x-6">
              {navItems.map((item) => (
                <div key={item.name} className="relative group" data-dropdown-name={item.name}>
                  {item.hasDropdown ? (
                    <>
                      <button
                        onClick={() => handleDropdownToggle(item.name)}
                        className="flex items-center text-gray-600 hover:text-blue-500 px-2 py-1.5 text-sm font-medium transition-colors duration-300 rounded-lg"
                      >
                        {item.name}
                        <ChevronDown className={`ml-1 h-4 w-4 transition-transform duration-200 ${
                          activeDropdown === item.name ? 'rotate-180' : 'rotate-0'
                        }`} />
                      </button>
                      {activeDropdown === item.name && item.children && (
                        <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 transition-all duration-200 ease-out origin-top z-50 overflow-hidden">
                          <div className="py-2">
                            {item.children.map((childItem) => (
                              <Link
                                key={childItem.name}
                                href={childItem.href || '#'}
                                className="block px-4 py-2 text-sm text-gray-700 font-normal hover:bg-blue-50 hover:text-blue-600 hover:translate-x-1 transition-all duration-300 transform"
                                onClick={() => {
                                  setActiveDropdown(null);
                                  // startLoading(); // Re-add if you have a loading indicator function
                                }}
                              >
                                {childItem.name}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
                      href={item.href || '#'}
                      className="text-gray-600 hover:text-blue-500 px-2 py-1.5 text-sm font-medium transition-colors duration-300 rounded-lg"
                    >
                      {item.name}
                    </Link>
                  )}
                </div>
              ))}
              {/* Contact Link */}
              <Link href="/contact" className="flex items-center text-gray-600 hover:text-gray-900 px-2 py-1.5 text-sm font-medium" >
                <div className="w-4 h-4 bg-black text-white text-xs flex items-center justify-center mr-2">
                  i
                </div>
                Contact
              </Link>
            </div>
          </div>

          {/* Right: Language Selector and Auth/User Menu */}
          <div className="flex items-center space-x-4 flex-shrink-0 z-30"> 
            {/* Language Selector */}
            {/* <div className="relative group" data-dropdown-name="language">
              <button
                onClick={() => handleDropdownToggle('language')}
                className="flex items-center text-gray-600 hover:text-blue-500 px-3 py-2 text-sm font-medium transition-colors duration-300 rounded-lg"
              >
                {selectedLanguage}
                <ChevronDown className={`ml-1 h-4 w-4 transition-transform duration-200 ${
                  activeDropdown === 'language' ? 'rotate-180' : 'rotate-0'
                }`} />
              </button>
              {activeDropdown === 'language' && (
                <div className="absolute top-full right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 transition-all duration-200 ease-out origin-top z-50 overflow-hidden">
                  <div className="py-2">
                    <button
                      onClick={() => handleLanguageSelect('Francais')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 font-normal hover:bg-blue-50 hover:text-blue-600 hover:translate-x-1 transition-all duration-300 transform"
                    >
                      <span className="fi fi-fr mr-2" />Francais
                    </button>
                    <button
                      onClick={() => handleLanguageSelect('English')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 font-normal hover:bg-blue-50 hover:text-blue-600 hover:translate-x-1 transition-all duration-300 transform"
                    >
                      <span className="fi fi-us mr-2" />English
                    </button>
                    <button
                      onClick={() => handleLanguageSelect('Arabic')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 font-normal hover:bg-blue-50 hover:text-blue-600 hover:translate-x-1 transition-all duration-300 transform"
                    >
                      <span className="fi fi-tn mr-2" />Arabic
                    </button>
                  </div>
                </div>
              )}
            </div> */}

            {/* Conditional Connexion / User Menu */}
            {isAuthenticated ? (
              <div className="relative group hidden xl:block" data-dropdown-name="user-menu">
                <button
                  onClick={() => handleDropdownToggle('user-menu')}
                  className="flex items-center bg-black text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-blue-600 transition-colors duration-300"
                >
                  <UserCircle2 className="w-5 h-5 mr-2" /> Bienvenue, {displayUserName}
                  <ChevronDown className={`ml-1 h-4 w-4 transition-transform duration-200 ${
                    activeDropdown === 'user-menu' ? 'rotate-180' : 'rotate-0'
                  }`} />
                </button>
                {activeDropdown === 'user-menu' && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 transition-all duration-200 ease-out origin-top z-50 overflow-hidden">
                    <div className="py-2">
                      <div className="px-4 py-2 text-sm text-gray-800 font-semibold border-b border-gray-100">
                        {userName || userId}
                      </div>
                      <Link
                        href={`/dashboard`}
                        className="block px-4 py-2 text-sm text-gray-700 font-normal hover:bg-blue-50 hover:text-blue-600 transition-colors duration-300"
                        onClick={() => {
                          setActiveDropdown(null);
                        }}
                      >
                        Mon Tableau de bord
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full text-left px-4 py-2 text-sm text-red-700 font-normal hover:bg-red-50 hover:text-red-800 transition-colors duration-300"
                      >
                        <LogOut className="w-4 h-4 mr-2" /> Déconnexion
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/connexion"
                className="hidden lg:block bg-black text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-blue-600 transition-colors duration-300"
              >
                Connexion
              </Link>
            )}

            {/* Mobile Burger Menu */}
            <div className="2xl:hidden"> 
              <AnimatedBurgerMenu
                isOpen={isMobileMenuOpen}
                onClick={toggleMobileMenu}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Pass auth-related props to MobileMenu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        navItems={navItems}
        isAuthenticated={isAuthenticated}
        userName={userName}
        userId={userId}
        logout={handleLogout}
      />
    </nav>
  );
}