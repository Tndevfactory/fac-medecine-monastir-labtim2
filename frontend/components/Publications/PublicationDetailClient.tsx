// frontend/components/publications/PublicationDetailClient.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { Inter, Playfair_Display } from 'next/font/google';

// Lucide for sharing icons and publication details
import {
  Facebook, Twitter, Linkedin, Mail, BookOpen, Calendar, User,
  Link as LinkIcon, ArrowLeft // LinkIcon for DOI/external links if applicable, ArrowLeft for navigation
} from 'lucide-react';

// Import Publication type
import { Publication } from '@/types/index';

// Initialize fonts
const inter = Inter({ subsets: ['latin'] });
const playfair = Playfair_Display({ subsets: ['latin'] });

// No BACKEND_BASE_URL needed for image/file as per your request

interface PublicationDetailClientProps {
  publication: Publication;
}

const PublicationDetailClient: React.FC<PublicationDetailClientProps> = ({ publication }) => {
  const publicationUrl = typeof window !== 'undefined' ? `${window.location.origin}/publications/${publication.id}` : `https://yourdomain.com/publications/${publication.id}`;
  const publicationTitle = publication.title;
  // For sharing summary, use a combination of title, authors, and year
  const publicationSummary = `"${publicationTitle}" by ${publication.authors?.join(', ')} (${publication.year})`;


  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className={`container mx-auto p-4 sm:p-6 lg:p-8 ${inter.className}`}>
      <div className="bg-white rounded-lg shadow-xl overflow-hidden my-8">
        {/* No image display as per your request */}

        <div className="p-6 sm:p-8 md:p-10 lg:p-12">
          <header className="mb-8 border-b pb-6">
            <h1 className={`${playfair.className} text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-4`}>
              {publication.title}
            </h1>
            <div className="flex flex-wrap items-center text-gray-600 text-base md:text-lg">
              {publication.authors && publication.authors.length > 0 && (
                <span className="flex items-center mr-6 mb-2">
                  <User className="w-5 h-5 mr-2 text-blue-600" />
                  {publication.authors.join(', ')} {/* Join authors array for display */}
                </span>
              )}
              {publication.year && (
                <span className="flex items-center mr-6 mb-2">
                  <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                  {publication.year}
                </span>
              )}
              {publication.journal && (
                <span className="flex items-center mr-6 mb-2">
                  <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
                  {publication.journal}
                </span>
              )}
            </div>
            {/* No keywords display as per your request */}
          </header>

          {/* No abstract or fullContent sections as per your request */}

          <section className="mb-8">
            <h2 className={`${playfair.className} text-3xl font-semibold text-gray-800 mb-4`}>Details</h2>
            <ul className="text-gray-700 space-y-2 text-lg">
              {publication.volume && (
                <li>
                  <span className="font-semibold">Volume:</span> {publication.volume}
                </li>
              )}
              {publication.pages && (
                <li>
                  <span className="font-semibold">Pages:</span> {publication.pages}
                </li>
              )}
              {publication.doi && (
                <li>
                  <span className="font-semibold">DOI:</span>
                  <a href={`https://doi.org/${publication.doi}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-2">
                    {publication.doi} <LinkIcon className="inline-block w-4 h-4 ml-1" />
                  </a>
                </li>
              )}
              {publication.createdAt && (
                <li>
                  <span className="font-semibold">Added Date:</span> {formatDate(publication.createdAt)}
                </li>
              )}
            </ul>
          </section>

          <section className="mt-8 pt-6 border-t border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Share This Publication</h2>
            <div className="flex space-x-3">
              <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(publicationUrl)}`} target="_blank" rel="noopener noreferrer" className="p-2 border border-gray-300 rounded-md text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200">
                <Facebook className="w-5 h-5" />
              </a>
              <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(publicationUrl)}&text=${encodeURIComponent(publicationTitle)}`} target="_blank" rel="noopener noreferrer" className="p-2 border border-gray-300 rounded-md text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200">
                <Twitter className="w-5 h-5" />
              </a>
              <a href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(publicationUrl)}&title=${encodeURIComponent(publicationTitle)}&summary=${encodeURIComponent(publicationSummary)}`} target="_blank" rel="noopener noreferrer" className="p-2 border border-gray-300 rounded-md text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href={`mailto:?subject=${encodeURIComponent(publicationTitle)}&body=${encodeURIComponent(publicationSummary + "\n\nRead more at: " + publicationUrl)}`} target="_blank" rel="noopener noreferrer" className="p-2 border border-gray-300 rounded-md text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </section>

          <div className="mt-8 text-center">
            <Link href="/publications" className="inline-flex items-center text-blue-600 hover:underline font-medium text-lg">
              <ArrowLeft className="w-5 h-5 mr-2" /> Back to all Publications
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicationDetailClient;
