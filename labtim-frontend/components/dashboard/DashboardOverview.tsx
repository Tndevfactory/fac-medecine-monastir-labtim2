// components/dashboard/DashboardOverview.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { User, ChartNoAxesCombined ,Book, FileText, GraduationCap, Loader2 } from 'lucide-react'; // Icons for dashboard stats
import { Inter } from 'next/font/google'; // Assuming Inter is the primary font

// Import the new dashboard API services
import { getMemberCount, getPublicationCount, getThesisCount, getMasterPFECoount } from '@/services/dashboardApi';

const inter = Inter({ subsets: ['latin'] });

interface StatCardProps {
  title: string;
  count: number | null;
  icon: React.ElementType; // LucideReact icon component
  loading: boolean;
  error: string | null;
  iconBgColorClass: string; // New prop for background color of icon circle
  iconTextColorClass: string; // New prop for text color of icon
}

const StatCard: React.FC<StatCardProps> = ({ title, count, icon: Icon, loading, error, iconBgColorClass, iconTextColorClass }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 flex items-center space-x-4"> {/* Increased rounded corners, softer shadow and border */}
      <div className={`flex-shrink-0 p-3 rounded-full ${iconBgColorClass} ${iconTextColorClass}`}>
        {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Icon className="h-6 w-6" />}
      </div>
      <div>
        <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
        {loading ? (
          <div className="h-6 bg-gray-200 rounded w-16 mt-1 animate-pulse"></div>
        ) : error ? (
          <p className="text-red-500 text-lg font-semibold mt-1">Erreur</p>
        ) : (
          <p className="text-2xl font-bold text-gray-900 mt-1">{count !== null ? count : 'N/A'}</p>
        )}
      </div>
    </div>
  );
};

const DashboardOverview: React.FC = () => {
  const { isAuthenticated, userRole, userId: loggedInUserId, isLoading: isAuthLoading, token } = useAuth();
  const router = useRouter();

  const [memberCount, setMemberCount] = useState<number | null>(null);
  const [publicationCount, setPublicationCount] = useState<number | null>(null);
  const [thesisCount, setThesisCount] = useState<number | null>(null);
  const [masterPFECount, setMasterPFECount] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errors, setErrors] = useState<{ [key: string]: string | null }>({});

  // Redirect non-admin users
  useEffect(() => {
    if (!isAuthLoading && isAuthenticated && userRole === 'member') {
      router.push(`/dashboard/member/${loggedInUserId}`); // FIX: Use the userId from useAuth
    }
  }, [isAuthLoading, isAuthenticated, userRole, loggedInUserId, router]);

  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthLoading && isAuthenticated && userRole === 'admin') {
        try {
          const [
            members,
            publications,
            theses,
            masterPFEs
          ] = await Promise.all([
            getMemberCount(token!),
            getPublicationCount(token!),
            getThesisCount(token!),
            getMasterPFECoount(token!)
          ]);

          setMemberCount(members); // FIX: Removed .count
          setPublicationCount(publications); // FIX: Removed .count
          setThesisCount(theses); // FIX: Removed .count
          setMasterPFECount(masterPFEs); // FIX: Removed .count
          setErrors({});
        } catch (err: any) {
          console.error('Failed to fetch dashboard data:', err);
          const newErrors: { [key: string]: string | null } = {};
          if (err.message.includes('members')) newErrors.memberCount = 'Failed to load';
          if (err.message.includes('publications')) newErrors.publicationCount = 'Failed to load';
          if (err.message.includes('theses')) newErrors.thesisCount = 'Failed to load';
          if (err.message.includes('masters')) newErrors.masterPFECount = 'Failed to load';
          setErrors(newErrors);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [isAuthLoading, isAuthenticated, userRole, token]);

  if (isAuthLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center bg-gray-100 ${inter.className}`}>
        <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
        <p className="ml-3 text-lg text-gray-700">Chargement du tableau de bord...</p>
      </div>
    );
  }

  // If the user is authenticated and an admin, render the dashboard
  if (isAuthenticated && userRole === 'admin') {
    return (
      <div className={`container mx-auto px-4 py-8 ${inter.className}`}>
        <h1 className="text-4xl font-extrabold text-gray-900 mb-6 border-b-4 border-blue-600 pb-2">
          Tableau de Bord
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Nombre des Membres"
            count={memberCount}
            icon={User}
            loading={loading}
            error={errors.memberCount}
            iconBgColorClass="bg-blue-100"
            iconTextColorClass="text-blue-600"
          />
          <StatCard
            title="Nombre des Publications"
            count={publicationCount}
            icon={Book}
            loading={loading}
            error={errors.publicationCount}
            iconBgColorClass="bg-green-100"
            iconTextColorClass="text-green-600"
          />
          <StatCard
            title="Nombre des Thèses"
            count={thesisCount}
            icon={FileText}
            loading={loading}
            error={errors.thesisCount}
            iconBgColorClass="bg-purple-100"
            iconTextColorClass="text-purple-600"
          />
          <StatCard
            title="Nombres des Masters / PFEs"
            count={masterPFECount}
            icon={GraduationCap}
            loading={loading}
            error={errors.masterPFECount}
            iconBgColorClass="bg-yellow-100"
            iconTextColorClass="text-yellow-600"
          />
        </div>
        
      </div>
    );
  }

  // If authenticated but not admin (e.g., a regular member), redirect to a non-admin dashboard or show limited view
  if (isAuthenticated && userRole === 'member') {
      router.push(`/dashboard/member/${loggedInUserId}`); // Redirect to their personal member dashboard
      return null; // Or render a simplified member view
  }

  return null; // Don't render anything until all checks are complete or if they are not authorized
};

export default DashboardOverview;