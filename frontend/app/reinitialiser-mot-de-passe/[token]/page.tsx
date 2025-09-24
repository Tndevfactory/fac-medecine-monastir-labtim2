// app/reinitialiser-mot-de-passe/[token]/page.tsx
// Server Component that handles the dynamic route and passes token to Client Component

import ResetPasswordRootPageClient from '@/components/Auth/ResetPasswordRootPageClient';

interface ResetPasswordRootPageProps {
  params: Promise<{
    token: string; // The dynamic token from the URL
  }>;
}

const ResetPasswordRootPage = async ({ params }: ResetPasswordRootPageProps) => {
  const { token } = await params;
  
  return <ResetPasswordRootPageClient token={token} />;
};

export default ResetPasswordRootPage;