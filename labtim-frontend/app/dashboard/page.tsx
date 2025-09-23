// frontend/app/dashboard/page.tsx
'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import ChangePasswordPage from '@/components/Auth/ChangePasswordPage';
import DashboardOverview from '@/components/dashboard/DashboardOverview';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

const DashboardPage = () => {
  const { mustChangePassword, isAuthenticated, isLoading, userRole, userId } = useAuth();
  const router = useRouter();

  // Show a full-page loading indicator while authentication state is being determined
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <span className="ml-3 text-lg text-gray-700">Chargement du tableau de bord...</span>
      </div>
    );
  }

  // If mustChangePassword is true, only render the password change modal.
  // The main content will be blurred/disabled behind it.
  if (mustChangePassword) {
    return (
      <div className="relative min-h-screen bg-gray-100">
        {/* Main Dashboard Content - blurred/disabled */}
        <div className={`p-8 transition-all duration-300 pointer-events-none blur-sm`}>
          <h1 className="text-3xl font-bold mb-6 text-gray-800">Bienvenue sur le Tableau de Bord !</h1>
          <p className="text-gray-700">Veuillez changer votre mot de passe pour accéder au contenu.</p>
        </div>
        {/* The ChangePasswordPage component is rendered as a modal overlay */}
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <ChangePasswordPage />
        </div>
      </div>
    );
  }

  // Handle role-based redirection or rendering after loading and password check
  // This useEffect ensures navigation is a side effect, not part of rendering.
  useEffect(() => {
    if (isAuthenticated && !mustChangePassword) {
      if (userRole === 'member' && userId) {
        // Redirect members to their specific dashboard page.
        // This ensures the /dashboard route serves as a central hub for role-based routing.
        router.replace(`/dashboard/member/${userId}`);
      }
      // No explicit action needed for 'admin' role here, as they will render DashboardOverview below.
    }
  }, [isAuthenticated, mustChangePassword, userRole, userId, router]);

  // Render content based on user role
  if (userRole === 'admin') {
    return (
      <div className="relative min-h-screen bg-gray-100">
        <DashboardOverview /> {/* Render the admin dashboard overview */}
      </div>
    );
  } else if (userRole === 'member') {
    // If user is a member and not redirecting yet, show a redirection message.
    // This state is temporary until the useEffect above triggers the navigation.
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <span className="ml-3 text-lg text-gray-700">Redirection vers l'espace membre...</span>
      </div>
    );
  }

  // Fallback for unexpected roles or states (e.g., if isAuthenticated is false, but not caught by layout)
  // This should ideally not be reached if AuthWrapper in layout.tsx works correctly.
  return (
    <div className="flex justify-center items-center h-screen text-red-500 bg-red-50 p-8">
      Accès non autorisé ou rôle inconnu.
    </div>
  );
};

export default DashboardPage;
