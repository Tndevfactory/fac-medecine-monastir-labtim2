// components/dashboard/Sidebar.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BarChart2,
  Users, // Used for Gestion Membres/Users
  Book,
  FileText,
  GraduationCap,
  Newspaper,
  Images,
  SquareMenu,
  Settings,
  Presentation
} from 'lucide-react';

const Sidebar = () => {
  const pathname = usePathname();

  const navItems = [
    {
      name: 'Tableau de bord',
      icon: LayoutDashboard,
      href: '/dashboard',
    },
    {
      name: 'Gestion Utilisateurs', // Changed name to reflect unified user management
      icon: Users,
      href: '/dashboard/users', // Updated href to the new user management route
    },
    {
      name: 'Actualités / Événements',
      icon: Newspaper,
      href: '/dashboard/news',
    },
    {
      name: 'Publications',
      icon: Book,
      href: '/dashboard/publications',
    },
    {
      name: 'Gestion Thèses',
      icon: FileText,
      href: '/dashboard/theses',
    },
    {
      name: 'Masters / PFEs',
      icon: GraduationCap,
      href: '/dashboard/masters-stages',
    },
        {
      name: 'Hero',
      icon: SquareMenu,
      href: '/dashboard/hero',
    },
    {
      name: 'Carousel',
      icon: Images,
      href: '/dashboard/carousel',
    },
    {
      name: 'Présentation',
      icon: Presentation,
      href: '/dashboard/presentation',
    },
        {
      name: 'Events',
      icon: Settings,
      href: '/dashboard/events',
    },
    // {
    //   name: 'Settings',
    //   icon: Settings,
    //   href: '/dashboard/settings',
    // },
  ];

  return (
    <div className="w-64 bg-white shadow-lg h-screen sticky top-0 overflow-y-auto p-4 flex flex-col">
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
              ${pathname === item.href 
                ? 'bg-blue-600 text-white font-semibold' // Active state
                : 'hover:bg-blue-700 hover:text-white' // Hover state: darker background, white text
              }
            `}
          >
            {/* IMPORTANT: Ensure consistent icon sizing and prevent shrinking */}
            {/* Changed to w-5 h-5 for smaller, consistent size. flex-shrink-0 prevents text from pushing it */}
            <item.icon className="w-5 h-5 flex-shrink-0 mr-3" />
            <span className="text-sm">{item.name}</span> {/* Added text-sm to reduce font size */}
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
