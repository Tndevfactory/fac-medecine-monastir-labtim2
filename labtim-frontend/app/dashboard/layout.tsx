// app/dashboard/layout.tsx
'use client';

import React, { ReactNode } from 'react';
import Sidebar from '@/components/dashboard/Sidebar'; // This is your admin sidebar
import { Inter } from 'next/font/google';
import { useAuth } from '@/context/AuthContext'; // Import useAuth
import { usePathname } from 'next/navigation'; // Import usePathname

// Initialize Inter font
const inter = Inter({ subsets: ['latin'] });

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { userRole } = useAuth(); // Get user role
  const pathname = usePathname(); // Get current pathname

  // Determine if the current path is a member dashboard route
  // This layout should NOT render its sidebar if it's a member's specific dashboard
  const isMemberDashboardRoute = pathname.startsWith('/dashboard/member/');

  // Determine if the admin sidebar should be shown
  // Show if user is admin AND it's not a member's specific dashboard route
  const showAdminSidebar = userRole === 'admin' && !isMemberDashboardRoute;

  return (
    // Apply Inter font to the main wrapper div
    // Use 'flex' for horizontal layout, and 'min-h-screen' to ensure it takes full viewport height
    <div className={`flex min-h-screen bg-gray-100 ${inter.className}`}>
      {/* Admin Sidebar - Conditionally rendered */}
      {showAdminSidebar && (
        <div className="w-64 flex-none sticky top-0 h-screen overflow-y-auto">
          <Sidebar />
        </div>
      )}

      {/* Main content area */}
      {/* Adjust ml-64 if the admin sidebar is shown, otherwise no margin */}
      <div className={`flex-1 flex flex-col ${showAdminSidebar ? '' : ''}`}>
        {/* Content of the specific dashboard page */}
        <main className="flex-1 overflow-auto ">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
