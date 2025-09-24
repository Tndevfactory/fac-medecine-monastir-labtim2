// frontend/app/publications/[id]/page.tsx
import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';

// API Service
import { getPublicationById } from '@/services/publicationsApi';
import { Publication } from '@/types/index';

// Client Component for rendering
import PublicationDetailClient from '@/components/Publications/PublicationDetailClient';

interface PublicationDetailPageProps {
  params: Promise<{
    id: string; // The ID from the URL
  }>;
}

// Generate dynamic metadata for each publication - Fixed for Next.js 15
export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}): Promise<Metadata> {
  const { id } = await params;
  let publication: Publication | null = null;

  try {
    const response = await getPublicationById(id);
    if (response.success) {
      publication = response.data;
    }
  } catch (error) {
    console.error(`Error fetching metadata for publication ${id}:`, error);
  }

  if (!publication) {
    return {
      title: 'Publication Not Found - LabTim',
      description: 'The requested publication could not be found.',
    };
  }

  // Use available fields for metadata
  const description = `Publication by ${publication.authors?.join(', ')} from ${publication.year}. Journal: ${publication.journal || 'N/A'}.`;

  return {
    title: `${publication.title} - LabTim Publications`,
    description: description,
    openGraph: {
      title: publication.title,
      description: description,
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/publications/${id}`,
      type: 'article',
      publishedTime: publication.createdAt,
      authors: publication.authors, // Use the authors array directly
    },
    // No keywords in your current Publication type
  };
}

const PublicationDetailPage: React.FC<PublicationDetailPageProps> = async ({ params }) => {
  const { id } = await params; // Fixed: await params
  let publication: Publication | null = null;
  let error: string | null = null;

  try {
    const response = await getPublicationById(id);
    if (response.success && response.data) {
        // Ensure that authors are correctly parsed if they are coming as stringified JSON from backend
        publication = {
            ...response.data,
            id: response.data.id || id, // Ensure id is always defined
            authors: typeof response.data.authors === 'string' ? JSON.parse(response.data.authors) : response.data.authors
        } as Publication;
    } else {
      error = response.message || 'Failed to fetch publication.';
    }
  } catch (err: any) {
    console.error('Error fetching publication:', err);
    error = err.message || 'An unexpected error occurred.';
  }

  if (error) {
    return (
      <div className="container mx-auto p-8 text-center text-red-700 bg-red-100 border border-red-400 rounded-lg my-12">
        <h1 className="text-3xl font-bold mb-4">Error</h1>
        <p>{error}</p>
        <p className="mt-4 text-gray-600">The publication you are looking for might not exist or an error occurred while fetching it.</p>
        <Link href="/publications" className="mt-6 inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors">
          Back to Publications
        </Link>
      </div>
    );
  }

  if (!publication) {
    return (
      <div className="container mx-auto p-8 text-center text-gray-700 bg-gray-50 rounded-lg my-12">
        <h1 className="text-3xl font-bold mb-4">Publication Not Found</h1>
        <p>The publication you requested could not be found.</p>
        <Link href="/publications" className="mt-6 inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors">
          Back to Publications
        </Link>
      </div>
    );
  }

  return (
    <PublicationDetailClient publication={publication} />
  );
};

export default PublicationDetailPage;