// frontend/components/member/MemberThesesPageClient.tsx
'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import MemberThesisManagement from '@/components/member/MemberThesisManagement';
import ErrorModal from '@/components/ui/ErrorModal';

interface MemberThesesPageClientProps {
  routeUserId: string;
}

const MemberThesesPageClient: React.FC<MemberThesesPageClientProps> = ({ routeUserId }) => {
  const { isAuthenticated, isLoading: isAuthLoading, userRole, userId: loggedInUserId } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect if not authenticated after auth loading completes
    if (!isAuthLoading && !isAuthenticated) {
      router.replace('/connexion');
      return;
    }

    // Ensure the logged-in user is trying to access their OWN theses page
    if (userRole === 'member' && loggedInUserId !== routeUserId) {
      // If a member tries to access another member's thesis page, redirect to their own
      router.replace(`/dashboard/member/${loggedInUserId}/theses`);
      return;
    }
    // If user is an admin, they should not be on this page. Redirect them to the admin dashboard.
    if (userRole === 'admin') {
      router.replace('/dashboard');
      return;
    }
  }, [isAuthenticated, isAuthLoading, userRole, loggedInUserId, routeUserId, router]);

  // Show a full-page loading indicator while auth is loading or redirecting
  if (isAuthLoading || !isAuthenticated || (userRole === 'member' && loggedInUserId !== routeUserId) || userRole === 'admin') {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <span className="ml-3 text-lg text-gray-700">Chargement de la gestion des thèses...</span>
      </div>
    );
  }

  // If we reach here, it means the user is a member and is accessing their own theses page.
  return (
    <div className="min-h-screen bg-white">
      <MemberThesisManagement />
    </div>
  );
};

export default MemberThesesPageClient;