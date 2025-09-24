// frontend/components/member/MemberMasterSIsPageClient.tsx
'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import MemberMasterSIManagement from '@/components/member/MemberMasterSIManagement';
import ErrorModal from '@/components/ui/ErrorModal';

interface MemberMasterSIsPageClientProps {
  routeUserId: string;
}

const MemberMasterSIsPageClient: React.FC<MemberMasterSIsPageClientProps> = ({ routeUserId }) => {
  const { isAuthenticated, isLoading: isAuthLoading, userRole, userId: loggedInUserId } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.replace('/connexion');
      return;
    }

    if (userRole === 'member' && loggedInUserId !== routeUserId) {
      router.replace(`/dashboard/member/${loggedInUserId}/masters-stages`);
      return;
    }

    if (userRole === 'admin') {
      router.replace('/dashboard');
      return;
    }
  }, [isAuthenticated, isAuthLoading, userRole, loggedInUserId, routeUserId, router]);

  if (isAuthLoading || !isAuthenticated || (userRole === 'member' && loggedInUserId !== routeUserId) || userRole === 'admin') {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <span className="ml-3 text-lg text-gray-700">Chargement de la gestion des Masters / PFEs...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <MemberMasterSIManagement />
    </div>
  );
};

export default MemberMasterSIsPageClient;