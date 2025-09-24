// app/membres/page.tsx
'use client'; // This page is a client component

import MembresList from '@/components/Membres/MembresList';
import React from 'react';
// Removed: import { useLoading } from '@/context/LoadingContext';

const MembresPage: React.FC = () => {
  // Removed: const { stopLoading } = useLoading();
  // Removed: useEffect(() => { stopLoading(); }, [stopLoading]);

  return <MembresList />;
};

export default MembresPage;
