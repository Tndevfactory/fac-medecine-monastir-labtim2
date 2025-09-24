// app/membres/[id]/page.tsx
'use client'; // This page is a client component

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation'; // Use usePathname to get the ID
import MembreProfile from '@/components/Membres/MembreProfile';
import { getUserById } from '@/services/dashboardApi'; // Import API service
import { User } from '@/types/index'; // Import User type

const MembreProfileRootPage: React.FC = () => {
  const pathname = usePathname();
  const memberId = pathname.split('/').pop(); // Extract ID from URL
  const [member, setMember] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Manage internal loading state
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMember = async () => {
      if (!memberId) {
        setError('Member ID not found in URL.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await getUserById(memberId); // Call the API without a token
        if (response.success && response.user) {
          setMember(response.user);
        } else {
          setError(response.message || 'Failed to fetch member profile.');
          setMember(null);
        }
      } catch (err: any) {
        console.error('Error fetching member profile:', err);
        setError(err.message || 'An unexpected error occurred while fetching member profile.');
        setMember(null);
      } finally {
        setLoading(false);
      }
    };

    fetchMember();
  }, [memberId]); // Depend on memberId

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600 text-lg">
        Chargement du profil du membre...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600 text-lg">
        Erreur: {error}
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600 text-lg">
        Membre introuvable.
      </div>
    );
  }

  return <MembreProfile member={member} />;
};

export default MembreProfileRootPage;
