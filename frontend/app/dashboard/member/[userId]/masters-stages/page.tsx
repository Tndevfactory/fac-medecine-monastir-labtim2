// frontend/app/dashboard/member/[userId]/masters-stages/page.tsx
// This is now a Server Component
import MemberMasterSIsPageClient from '@/components/member/MemberMasterSIsPageClient';

interface MemberMasterSIsPageProps {
  params: Promise<{
    userId: string;
  }>;
}

const MemberMasterSIsPage = async ({ params }: MemberMasterSIsPageProps) => {
  // Await the params promise to get the actual userId
  const { userId } = await params;

  return (
    <MemberMasterSIsPageClient routeUserId={userId} />
  );
};

export default MemberMasterSIsPage;