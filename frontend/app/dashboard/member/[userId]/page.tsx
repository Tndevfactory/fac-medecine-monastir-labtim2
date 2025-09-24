// frontend/app/dashboard/member/[userId]/page.tsx
// This is now a Server Component
import MemberDashboardPageClient from '@/components/member/MemberDashboardPageClient';
import { Metadata } from 'next';

interface MemberDashboardPageProps {
  params: Promise<{
    userId: string;
  }>;
}

// Fixed: generateMetadata also needs to handle Promise-based params in Next.js 15
export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ userId: string }> 
}): Promise<Metadata> {
  const { userId } = await params;
  return {
    title: `Profil de l'utilisateur - ${userId}`,
    description: `Détails du profil de l'utilisateur avec l'ID ${userId}.`,
  };
}

const MemberDashboardPage = async ({ params }: MemberDashboardPageProps) => {
  // Await the params promise to get the actual userId
  const { userId } = await params;

  return (
    <MemberDashboardPageClient routeUserId={userId} />
  );
};

export default MemberDashboardPage;