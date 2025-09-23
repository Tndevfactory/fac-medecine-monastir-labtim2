// frontend/app/dashboard/member/[userId]/layout.tsx
// This is now a Server Component
import { ReactNode } from 'react';
import MemberDashboardWrapper from '@/components/dashboard/MemberDashboardWrapper'; // Import the new wrapper

interface MemberDashboardLayoutProps {
  children: ReactNode;
  params: Promise<{
    userId: string;
  }>;
}

const MemberDashboardLayout = async ({ children, params }: MemberDashboardLayoutProps) => {
  // Await the params promise to get the userId
  const { userId } = await params;

  return (
    <MemberDashboardWrapper routeUserId={userId}>
      {children}
    </MemberDashboardWrapper>
  );
};

export default MemberDashboardLayout;