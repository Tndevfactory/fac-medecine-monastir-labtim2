// frontend/components/member/MemberDashboardPageClient.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { User as UserType } from '@/types/index';
import { getUserById } from '@/services/dashboardApi';
import { Loader2, User as UserIcon } from 'lucide-react';
import MemberProfileEdit from '@/components/member/profile/MemberProfileEdit';
import ErrorModal from '@/components/ui/ErrorModal';

interface MemberDashboardPageClientProps {
  routeUserId: string;
}

const MemberDashboardPageClient: React.FC<MemberDashboardPageClientProps> = ({ routeUserId }) => {
  const { isAuthenticated, isLoading: isAuthLoading, token, userId: loggedInUserId, userRole } = useAuth();
  const router = useRouter();

  const [memberData, setMemberData] = useState<UserType | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [errorModal, setErrorModal] = useState<{ title: string; briefDescription: string; detailedError?: string } | null>(null);

  useEffect(() => {
    if (isAuthLoading || !isAuthenticated) {
      if (!isAuthLoading && !isAuthenticated) {
        router.replace('/connexion');
      }
      return;
    }

    if (userRole === 'member' && loggedInUserId !== routeUserId) {
      setErrorModal({
        title: 'Accès non autorisé',
        briefDescription: 'Vous n\'êtes pas autorisé à voir ce profil.',
        detailedError: `Tentative d'accès au profil de ${routeUserId} par l'utilisateur ${loggedInUserId} avec le rôle ${userRole}.`
      });
      router.replace('/dashboard');
      setIsLoadingData(false);
      return;
    }

    const fetchMemberProfile = async () => {
      setIsLoadingData(true);
      setErrorModal(null);
      try {
        const response = await getUserById(routeUserId);
        if (response.success && response.user) {
          setMemberData(response.user);
        } else {
          setErrorModal({
            title: 'Échec du chargement du profil',
            briefDescription: response.message || 'Une erreur inconnue est survenue lors du chargement du profil membre.',
            detailedError: response.message || 'La réponse du serveur n\'indique pas de succès.'
          });
        }
      } catch (err: any) {
        console.error('Error fetching member profile:', err);
        setErrorModal({
          title: 'Erreur réseau ou serveur',
          briefDescription: 'Impossible de récupérer les données du profil. Veuillez vérifier votre connexion ou réessayer plus tard.',
          detailedError: err.message || 'Une erreur inattendue est survenue lors du chargement du profil.'
        });
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchMemberProfile();

  }, [isAuthenticated, isAuthLoading, token, routeUserId, loggedInUserId, userRole, router]);

  if (errorModal) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50 p-8">
        <ErrorModal
          title={errorModal.title}
          briefDescription={errorModal.briefDescription}
          detailedError={errorModal.detailedError}
          onClose={() => {
            setErrorModal(null);
            if (errorModal.title === 'Accès non autorisé') {
              router.replace('/dashboard');
            }
          }}
        />
      </div>
    );
  }

  if (isAuthLoading || isLoadingData) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <span className="ml-3 text-lg text-gray-700">Chargement du profil membre...</span>
      </div>
    );
  }

  if (!memberData) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-600 bg-gray-50 p-8">
        <p className="text-lg">Aucune donnée de profil disponible pour le moment.</p>
      </div>
    );
  }

  const shouldBeEditable = userRole === 'admin' || loggedInUserId === routeUserId;

  return (
    <div className="min-h-screen bg-white">
      <div className="flex items-center space-x-4 bg-gradient-to-r from-blue-600 to-purple-700 text-white p-6 rounded-xl shadow-lg mb-8">
        <UserIcon className="w-10 h-10 flex-shrink-0" />
        <h1 className="text-4xl font-extrabold tracking-tight">Mon Profil</h1>
      </div>

      <MemberProfileEdit
        initialUser={memberData}
        isEditable={shouldBeEditable}
        onProfileUpdated={(updatedUser, newToken) => {
          setMemberData(updatedUser);
        }}
      />
    </div>
  );
};

export default MemberDashboardPageClient;