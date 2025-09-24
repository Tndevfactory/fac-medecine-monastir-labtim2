// frontend/app/dashboard/publications/page.tsx
'use client';

import React from 'react';
import PublicationManagement from '@/components/dashboard/PublicationManagement'; // Your existing component

const DashboardPublicationsPage = () => {
  // PublicationManagement component already handles authentication and role checks internally.
  return <PublicationManagement />;
};

export default DashboardPublicationsPage;
