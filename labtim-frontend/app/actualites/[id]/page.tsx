// app/actualites/[id]/page.tsx
// This is a Server Component that handles the dynamic route for individual actualités.

import ActuDetailClient from '@/components/Actualites/ActuDetailClient';
import { Metadata } from 'next';

// Fixed: In Next.js 15, params is a Promise that needs to be awaited
export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}): Promise<Metadata> {
  const { id } = await params;
  
  return {
    title: `Actualité - ${id}`,
    description: `Détails de l'actualité avec l'ID ${id}`,
  };
}

// Fixed: params is now a Promise in Next.js 15
const ActuDetailPage = async ({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) => {
  const { id } = await params;
  
  return <ActuDetailClient actuId={id} />;
};

export default ActuDetailPage;