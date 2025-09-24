// frontend/app/dashboard/member/[userId]/theses/page.tsx
// This is now a Server Component
import MemberThesesPageClient from '@/components/member/MemberThesesPageClient';

interface MemberThesesPageProps {
  params: Promise<{
    userId: string;
  }>;
}

const MemberThesesPage = async ({ params }: MemberThesesPageProps) => {
  // Await the params promise to get the actual userId
  const { userId } = await params;

  return (
    <MemberThesesPageClient routeUserId={userId} />
  );
};

export default MemberThesesPage;