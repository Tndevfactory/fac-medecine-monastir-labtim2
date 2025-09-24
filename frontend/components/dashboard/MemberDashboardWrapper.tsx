// frontend/components/dashboard/MemberDashboardWrapper.tsx
'use client';

import React, { ReactNode, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import MemberSidebar from '@/components/member/MemberSidebar';
import { Loader2 } from 'lucide-react';

interface MemberDashboardWrapperProps {
  children: ReactNode;
  routeUserId: string;
}

const MemberDashboardWrapper: React.FC<MemberDashboardWrapperProps> = ({ children, routeUserId }) => {
  console.log('MemberDashboardWrapper: Component rendering...');
  const { isAuthenticated, isLoading: isAuthLoading, userRole, userId: loggedInUserId } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('MemberDashboardWrapper useEffect: Running...');
    console.log('  isAuthenticated:', isAuthenticated);
    console.log('  isAuthLoading:', isAuthLoading);
    console.log('  userRole:', userRole);
    console.log('  loggedInUserId:', loggedInUserId);
    console.log('  routeUserId (from params):', routeUserId);

    // Redirect if not authenticated after auth loading completes
    if (!isAuthLoading && !isAuthenticated) {
      console.log('MemberDashboardWrapper: Not authenticated, redirecting to /connexion');
      router.replace('/connexion');
      return;
    }

    // Ensure routeUserId is available before using it in the check
    if (routeUserId && isAuthenticated && userRole !== 'admin' && loggedInUserId !== routeUserId) {
      console.log('MemberDashboardWrapper: Authenticated but unauthorized, redirecting to /dashboard');
      router.replace('/dashboard');
      return;
    }
    console.log('MemberDashboardWrapper useEffect: Authentication/Authorization checks passed.');

  }, [isAuthenticated, isAuthLoading, userRole, loggedInUserId, routeUserId, router]);

  if (isAuthLoading) {
    console.log('MemberDashboardWrapper: Showing auth loading state.');
    return (
      <div className="flex justify-center items-center h-screen bg-white">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <span className="ml-3 text-lg text-gray-700">Chargement de l'espace membre...</span>
      </div>
    );
  }

  if (!isAuthenticated || (routeUserId && userRole !== 'admin' && loggedInUserId !== routeUserId)) {
    console.log('MemberDashboardWrapper: Returning null due to failed auth/authz check.');
    return null;
  }

  console.log('MemberDashboardWrapper: Rendering main layout structure.');
  return (
    <div className="flex min-h-screen bg-white">
      <MemberSidebar />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
};

export default MemberDashboardWrapper;