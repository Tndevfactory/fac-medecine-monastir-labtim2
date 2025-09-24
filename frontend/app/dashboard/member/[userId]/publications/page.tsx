// frontend/app/dashboard/member/[userId]/publications/page.tsx
// Server Component that passes the userId to the Client Component
import MemberPublicationsPageClient from '@/components/member/MemberPublicationsPageClient';

interface MemberPublicationsPageProps {
  params: Promise<{
    userId: string;
  }>;
}

const MemberPublicationsPage = async ({ params }: MemberPublicationsPageProps) => {
  const { userId } = await params;
  
  return <MemberPublicationsPageClient routeUserId={userId} />;
};

export default MemberPublicationsPage;