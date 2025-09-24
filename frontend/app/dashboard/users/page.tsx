// labtim-frontend/app/dashboard/users/page.tsx
'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import UserManagement from '@/components/dashboard/UserManagement'; // Import the new component

const DashboardUsersPage = () => {
  const { isAuthenticated, isLoading, userRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect if not authenticated or not an admin
    if (!isLoading && (!isAuthenticated || userRole !== 'admin')) {
      router.push('/connexion');
    }
  }, [isAuthenticated, isLoading, userRole, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <p>Checking authentication status...</p>
      </div>
    );
  }

  if (isAuthenticated && userRole === 'admin') {
    return <UserManagement />;
  }

  return null; // Fallback for unauthorized access (redirect handled by useEffect)
};

export default DashboardUsersPage;