// components/member/MemberSidebar.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext'; // Import useAuth to get userId
import {
  User, // Used for Mon Profil
  Book,
  FileText,
  GraduationCap,
  LogOut, // For logout button
  Settings, // For settings link
  Loader2, // For loading state
} from 'lucide-react';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

const MemberSidebar = () => {
  const pathname = usePathname();
  const { userId, logout } = useAuth(); // Get userId and logout function

  // Helper to determine if a link is active
  // Ensure this comparison is robust for dynamic routes
  const isActive = (href: string) => {
    // For dynamic routes like /dashboard/member/[userId], we check if pathname starts with the base part
    if (href.includes('[userId]')) { // This check is conceptual, better to use regex or more specific logic
        // For example, if href is `/dashboard/member/${userId}`, check if pathname starts with `/dashboard/member/`
        return pathname.startsWith(`/dashboard/member/`);
    }
    return pathname === href;
  };

  // Define navigation items dynamically
  // Only show these if userId is available
  const navItems = userId ? [
    {
      name: 'Mon Profil',
      icon: User, // Using User icon for profile
      href: `/dashboard/member/${userId}`, // Dynamic link to user's profile
    },
    {
      name: 'Mes Publications',
      icon: Book,
      href: `/dashboard/member/${userId}/publications`, // Example: dynamic link for publications
    },
    {
      name: 'Mes Thèses',
      icon: FileText,
      href: `/dashboard/member/${userId}/theses`, // Example: dynamic link for theses
    },
    {
      name: 'Mes Masters / PFEs',
      icon: GraduationCap,
      href: `/dashboard/member/${userId}/masters-stages`, // Example: dynamic link for masters/PFEs
    },
    // {
    //   name: 'Paramètres',
    //   icon: Settings,
    //   href: `/dashboard/member/${userId}/settings`, // Example: dynamic link for settings
    // },
  ] : [];

  if (!userId) {
    // Render a loading state if userId is not yet available
    return (
      <div className="w-64 bg-white shadow-lg h-screen sticky top-0 overflow-y-auto p-4 flex flex-col items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
        <span className="mt-2 text-gray-700 text-sm">Chargement du menu...</span>
      </div>
    );
  }

  return (
    <div className={`w-64 bg-white shadow-lg sticky top-0 overflow-y-auto p-4 flex flex-col ${inter.className}`}>
      <div className="flex items-center justify-center mb-6 mt-2">
        <Image src="/images/logo.png" alt="LABTIM Logo" width={100} height={100} unoptimized={true} />
      </div>
      <nav className="flex-1 space-y-2"> {/* Added space-y-2 for vertical gap between items */}
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={`
              flex items-center p-3 rounded-lg transition-colors duration-200
              text-gray-900 shadow-sm
              ${isActive(item.href)
                ? 'bg-blue-600 text-white font-semibold' // Active state
                : 'hover:bg-blue-700 hover:text-white' // Hover state: darker background, white text
              }
            `}
          >
            <item.icon className="w-5 h-5 flex-shrink-0 mr-3" />
            <span className="text-sm">{item.name}</span>
          </Link>
        ))}
      </nav>

      {/* Logout button at the bottom
      <div className="mt-auto pt-6 border-t border-gray-100">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center p-3 rounded-lg text-red-600 bg-red-50 hover:bg-red-100 transition-colors duration-200 font-medium"
        >
          <LogOut className="h-5 w-5 mr-2" />
          Déconnexion
        </button>
      </div> */}
    </div>
  );
};

export default MemberSidebar;
