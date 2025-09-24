// frontend/components/member/MemberPublicationsPageClient.tsx
'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import MemberPublicationManagement from '@/components/member/MemberPublicationManagement';

interface MemberPublicationsPageClientProps {
  routeUserId: string;
}

const MemberPublicationsPageClient: React.FC<MemberPublicationsPageClientProps> = ({ routeUserId }) => {
  const { isAuthenticated, isLoading: isAuthLoading, userRole, userId: loggedInUserId } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect if not authenticated after auth loading completes
    if (!isAuthLoading && !isAuthenticated) {
      router.replace('/connexion');
      return;
    }

    // Ensure the logged-in user is trying to access their OWN publications page
    // Admins can view any member's profile, but this specific page is for a member's own publications.
    // If an admin needs to manage publications, they should use the admin publication management page.
    if (userRole === 'member' && loggedInUserId !== routeUserId) {
      // If a member tries to access another member's publication page, redirect to their own dashboard
      router.replace(`/dashboard/member/${loggedInUserId}`);
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
      <div className="flex justify-center items-center h-screen bg-white">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <span className="ml-3 text-lg text-gray-700">Chargement de la gestion des publications...</span>
      </div>
    );
  }

  // If we reach here, it means the user is a member and is accessing their own publications page.
  return (
    <div className="min-h-screen bg-white">
      <MemberPublicationManagement />
    </div>
  );
};

export default MemberPublicationsPageClient;