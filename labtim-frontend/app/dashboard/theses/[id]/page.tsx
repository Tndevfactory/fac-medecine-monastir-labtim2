// frontend/app/theses/[id]/page.tsx
import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';

// API Service
import { getThesisById } from '@/services/thesesApi';
import { Thesis } from '@/types/index';

// Client Component for rendering
import ThesisDetailClient from '@/components/theses/ThesisDetailClient';

interface ThesisDetailPageProps {
  params: Promise<{
    id: string; // The ID from the URL
  }>;
}

// Generate dynamic metadata for each thesis - Fixed for Next.js 15
export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}): Promise<Metadata> {
  const { id } = await params;
  let thesis: Thesis | null = null;

  try {
    const response = await getThesisById(id);
    if (response.success) {
      thesis = response.data;
    }
  } catch (error) {
    console.error(`Error fetching metadata for thesis ${id}:`, error);
  }

  if (!thesis) {
    return {
      title: 'Thèse/HDR non trouvée - LabTim',
      description: 'La thèse ou HDR demandée n\'a pas pu être trouvée.',
    };
  }

  // Use available fields for metadata
  const description = `Thèse/HDR par ${thesis.author} de ${thesis.etablissement} en ${thesis.year}. Résumé: ${thesis.summary.substring(0, 150)}...`;

  return {
    title: `${thesis.title} - LabTim Thèses`,
    description: description,
    openGraph: {
      title: thesis.title,
      description: description,
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/theses/${id}`,
      type: 'article',
      publishedTime: thesis.createdAt,
      authors: [thesis.author], // Convert single author string to array for OpenGraph
    },
  };
}

const ThesisDetailPage: React.FC<ThesisDetailPageProps> = async ({ params }) => {
  const { id } = await params; // Fixed: await params
  let thesis: Thesis | null = null;
  let error: string | null = null;

  try {
    const response = await getThesisById(id);
    if (response.success && response.data) {
        // Ensure that membres are correctly parsed if they are coming as stringified JSON from backend
        thesis = {
            ...response.data,
            id: response.data.id || id, // Ensure id is always defined
            membres: typeof response.data.membres === 'string' ? JSON.parse(response.data.membres) : response.data.membres
        } as Thesis;
    } else {
      error = response.message || 'Failed to fetch thesis.';
    }
  } catch (err: any) {
    console.error('Error fetching thesis:', err);
    error = err.message || 'An unexpected error occurred.';
  }

  if (error) {
    return (
      <div className="container mx-auto p-8 text-center text-red-700 bg-red-100 border border-red-400 rounded-lg my-12">
        <h1 className="text-3xl font-bold mb-4">Erreur</h1>
        <p>{error}</p>
        <p className="mt-4 text-gray-600">La thèse que vous recherchez n'existe peut-être pas ou une erreur est survenue lors de sa récupération.</p>
        <Link href="/theses" className="mt-6 inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors">
          Retour aux Thèses
        </Link>
      </div>
    );
  }

  if (!thesis) {
    return (
      <div className="container mx-auto p-8 text-center text-gray-700 bg-gray-50 rounded-lg my-12">
        <h1 className="text-3xl font-bold mb-4">Thèse/HDR Non Trouvée</h1>
        <p>La thèse/HDR que vous avez demandée n'a pas pu être trouvée.</p>
        <Link href="/theses" className="mt-6 inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors">
          Retour aux Thèses
        </Link>
      </div>
    );
  }

  return (
    <ThesisDetailClient thesis={thesis} />
  );
};

export default ThesisDetailPage;