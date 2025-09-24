// components/Auth/ResetPasswordRootPageClient.tsx
'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ResetPasswordPage from '@/components/Auth/ResetPasswordPage';

interface ResetPasswordRootPageClientProps {
  token: string;
}

const ResetPasswordRootPageClient: React.FC<ResetPasswordRootPageClientProps> = ({ token }) => {
  const router = useRouter();

  if (!token) {
    // Handle case where token is missing (e.g., direct access without token)
    // You might want to redirect to a generic error page or login
    useEffect(() => {
      router.replace('/connexion'); // Redirect to login if token is missing
    }, [router]);
    return null; // Or render a placeholder
  }

  return <ResetPasswordPage token={token} />;
};

export default ResetPasswordRootPageClient;