    // frontend/app/dashboard/theses/page.tsx
    'use client';

    import React from 'react';
    import ThesisManagement from '@/components/dashboard/ThesisManagement';

    const DashboardThesesPage = () => {
      // ThesisManagement component already handles authentication and redirection
      // based on userRole.
      return <ThesisManagement />;
    };

    export default DashboardThesesPage;
    