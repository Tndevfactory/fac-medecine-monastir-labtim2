// frontend/components/theses/ThesisDetailClient.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { Inter, Playfair_Display } from 'next/font/google';

// Lucide for sharing icons and thesis details
import {
  Facebook, Twitter, Linkedin, Mail, GraduationCap, Calendar, User,
  Building2, FlaskConical, ScrollText, Users, ArrowLeft
} from 'lucide-react';

// Import Thesis type
import { Thesis } from '@/types/index';

// Initialize fonts
const inter = Inter({ subsets: ['latin'] });
const playfair = Playfair_Display({ subsets: ['latin'] });

interface ThesisDetailClientProps {
  thesis: Thesis;
}

const ThesisDetailClient: React.FC<ThesisDetailClientProps> = ({ thesis }) => {
  const thesisUrl = typeof window !== 'undefined' ? `${window.location.origin}/theses/${thesis.id}` : `https://yourdomain.com/theses/${thesis.id}`;
  const thesisTitle = thesis.title;
  const thesisSummaryForShare = `"${thesisTitle}" par ${thesis.author} (${thesis.year}) à ${thesis.etablissement}.`;


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
        <div className="p-6 sm:p-8 md:p-10 lg:p-12">
          <header className="mb-8 border-b pb-6">
            <h1 className={`${playfair.className} text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-4`}>
              {thesis.title}
            </h1>
            <div className="flex flex-wrap items-center text-gray-600 text-base md:text-lg">
              {thesis.author && (
                <span className="flex items-center mr-6 mb-2">
                  <User className="w-5 h-5 mr-2 text-blue-600" />
                  {thesis.author}
                </span>
              )}
              {thesis.year && (
                <span className="flex items-center mr-6 mb-2">
                  <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                  {thesis.year}
                </span>
              )}
              {thesis.type && (
                <span className="flex items-center mr-6 mb-2">
                  <GraduationCap className="w-5 h-5 mr-2 text-blue-600" />
                  {thesis.type}
                </span>
              )}
            </div>
          </header>

          <section className="mb-8">
            <h2 className={`${playfair.className} text-3xl font-semibold text-gray-800 mb-4`}>Résumé</h2>
            <p className="text-gray-700 text-lg leading-relaxed">{thesis.summary}</p>
          </section>

          <section className="mb-8">
            <h2 className={`${playfair.className} text-3xl font-semibold text-gray-800 mb-4`}>Détails</h2>
            <ul className="text-gray-700 space-y-2 text-lg">
              <li>
                <span className="font-semibold flex items-center"><Building2 className="w-5 h-5 mr-2 text-gray-500" /> Établissement:</span> {thesis.etablissement}
              </li>
              <li>
                <span className="font-semibold flex items-center"><FlaskConical className="w-5 h-5 mr-2 text-gray-500" /> Spécialité:</span> {thesis.specialite}
              </li>
              <li>
                <span className="font-semibold flex items-center"><User className="w-5 h-5 mr-2 text-gray-500" /> Encadrant:</span> {thesis.encadrant}
              </li>
              {thesis.membres && thesis.membres.length > 0 && (
                <li>
                  <span className="font-semibold flex items-center"><Users className="w-5 h-5 mr-2 text-gray-500" /> Membres du Jury:</span> {thesis.membres.join(', ')}
                </li>
              )}
              {thesis.createdAt && (
                <li>
                  <span className="font-semibold flex items-center"><Calendar className="w-5 h-5 mr-2 text-gray-500" /> Date d'ajout:</span> {formatDate(thesis.createdAt)}
                </li>
              )}
            </ul>
          </section>

          <section className="mt-8 pt-6 border-t border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Partager cette Thèse / HDR</h2>
            <div className="flex space-x-3">
              <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(thesisUrl)}`} target="_blank" rel="noopener noreferrer" className="p-2 border border-gray-300 rounded-md text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200">
                <Facebook className="w-5 h-5" />
              </a>
              <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(thesisUrl)}&text=${encodeURIComponent(thesisTitle)}`} target="_blank" rel="noopener noreferrer" className="p-2 border border-gray-300 rounded-md text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200">
                <Twitter className="w-5 h-5" />
              </a>
              <a href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(thesisUrl)}&title=${encodeURIComponent(thesisTitle)}&summary=${encodeURIComponent(thesisSummaryForShare)}`} target="_blank" rel="noopener noreferrer" className="p-2 border border-gray-300 rounded-md text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href={`mailto:?subject=${encodeURIComponent(thesisTitle)}&body=${encodeURIComponent(thesisSummaryForShare + "\n\nRead more at: " + thesisUrl)}`} target="_blank" rel="noopener noreferrer" className="p-2 border border-gray-300 rounded-md text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </section>

          <div className="mt-8 text-center">
            <Link href="/theses" className="inline-flex items-center text-blue-600 hover:underline font-medium text-lg">
              <ArrowLeft className="w-5 h-5 mr-2" /> Retour à toutes les Thèses
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThesisDetailClient;
