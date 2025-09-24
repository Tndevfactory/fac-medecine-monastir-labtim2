// app/actualites/[id]/page.tsx
// This file is now a Server Component (no 'use client')

import React from 'react';
import Link from 'next/link';
import { Inter } from 'next/font/google';
import ActuDetailClient from '@/components/Actualites/ActuDetailClient';
import { allActualites } from '@/data/allActualites';

const inter = Inter({ subsets: ['latin'] });

// Define the props type for the page component, now as a Promise
interface ActuDetailPageProps {
  params: Promise<{ id: string }>;
}

// REQUIRED for 'output: "export"' with dynamic routes
export async function generateStaticParams() {
  return allActualites.map((actu) => ({
    id: actu.id,
  }));
}

// Fixed: params is now a Promise in Next.js 15, so the component must be async
const ActuDetailPage: React.FC<ActuDetailPageProps> = async ({ params }) => {
  // Await the params to get the actual id
  const { id } = await params;
  
  // Find the actualité using the ID from the URL
  const actualite = allActualites.find(actu => actu.id === id);

  if (!actualite) {
    return (
      <div className={`bg-white text-gray-800 py-24 px-4 sm:px-6 lg:px-8 min-h-screen flex items-center justify-center ${inter.className}`}>
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Actualité non trouvée</h1>
          <p className="text-lg text-gray-600 mb-8">
            Désolé, l'actualité que vous recherchez n'existe pas ou a été déplacée.
          </p>
          <Link href="/actualites" className="text-blue-600 hover:underline text-lg">
            &larr; Retour aux actualités
          </Link>
        </div>
      </div>
    );
  }

  // Fixed: Pass actuId instead of actualite object, based on the pattern from your first document
  return <ActuDetailClient actuId={id} />;
};

export default ActuDetailPage;