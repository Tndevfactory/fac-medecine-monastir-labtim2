// app/actualites/page.tsx

import ActualitesList from '@/components/Actualites/ActualitesList';
import React, { Suspense } from 'react';

export default function ActualitesFullPage() {
  return (
    <Suspense fallback={<div>Chargement des actualités...</div>}>
      <ActualitesList />
    </Suspense>
  );
}