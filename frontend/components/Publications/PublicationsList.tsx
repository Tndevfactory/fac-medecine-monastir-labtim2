// components/Publications/PublicationsList.tsx
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Inter } from 'next/font/google';
import { ChevronDown, Search, Loader2 } from 'lucide-react'; // Import Loader2 for loading state
import Link from 'next/link';
import { getAllPublications } from '@/services/publicationsApi'; // Import the API function
import { useAuth } from '@/context/AuthContext'; // Import useAuth to get the token (optional for public routes)
import Toast from '@/components/ui/Toast'; // Assuming you have a Toast component
import ErrorModal from '@/components/ui/ErrorModal'; // Assuming you have an ErrorModal component

const inter = Inter({ subsets: ['latin'] });

// Define the type for a Publication item (ensure it matches your backend response)
interface Publication {
  id: string;
  title: string;
  authors: string[]; 
  year: number;
  journal?: string;
  volume?: string;
  pages?: string;
  doi?: string;
  creatorId?: string; // Add creatorId if your backend returns it
  createdAt?: string;
}

const PublicationsList = () => {
  const { token } = useAuth(); // Get token from AuthContext (will be null if not logged in)

  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [activeFilterDropdown, setActiveFilterDropdown] = useState<string | null>('year');
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
  const [errorModal, setErrorModal] = useState<{ title: string; briefDescription: string; detailedError?: string } | null>(null);

  // Function to fetch publications from the API
  const fetchPublications = useCallback(async () => {
    setLoading(true);
    setError(null);
    setToast(null); // Clear previous toasts

    // No need for `if (!token)` check here, as the route is public.
    // We pass `token` (which might be null) to `getAllPublications`.
    try {
      const response = await getAllPublications(token, undefined, selectedYear, searchTerm);
      if (response.success && response.data) {
        setPublications(response.data);
        // Only show success toast if there are publications to show
        if (response.data.length > 0) {
          // setToast({ message: 'Publications chargées avec succès.', type: 'success' });
        }
      } else {
        setErrorModal({
          title: 'Échec du chargement des publications',
          briefDescription: response.message || 'Une erreur est survenue lors de la récupération des publications.',
          detailedError: response.message,
        });
        setPublications([]); // Clear publications on error
      }
    } catch (err: any) {
      console.error('Error fetching publications:', err);
      setErrorModal({
        title: 'Erreur réseau ou serveur',
        briefDescription: 'Impossible de communiquer avec le serveur ou erreur inattendue.',
        detailedError: err.message || 'Veuillez vérifier votre connexion internet et réessayer.',
      });
      setPublications([]); // Clear publications on error
    } finally {
      setLoading(false);
    }
  }, [token, selectedYear, searchTerm]); // Re-fetch when token, selectedYear, or searchTerm changes

  // Initial fetch on component mount and when filters/token change
  useEffect(() => {
    fetchPublications();
  }, [fetchPublications]);

  // Helper to get unique years from fetched publications
  const getUniqueYears = (pubs: Publication[]) => {
    const years = Array.from(new Set(pubs.map(pub => pub.year)));
    return years.sort((a, b) => b - a); // Sort in descending order (most recent first)
  };

  // Memoize yearOptions calculation from the fetched publications
  const yearOptions = useMemo(() => getUniqueYears(publications), [publications]);

  // Publications are now filtered on the backend, so `publications` state already holds the filtered list.
  // We just need to handle pagination on the client side.
  const totalPages = Math.ceil(publications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentPublications = publications.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const paginationNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  const toggleFilterDropdown = (dropdownName: string) => {
    setActiveFilterDropdown(activeFilterDropdown === dropdownName ? null : dropdownName);
  };

  return (
    <section className={`py-16 bg-white ${inter.className}`}>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {errorModal && (
        <ErrorModal
          title={errorModal.title}
          briefDescription={errorModal.briefDescription}
          detailedError={errorModal.detailedError}
          onClose={() => setErrorModal(null)}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Publications</h2>

        {/* Search Bar */}
        <div className="mb-12 flex items-center justify-between border-b border-gray-200 pb-8">
          <div className="relative flex-grow max-w-lg mx-auto">
            <input
              type="text"
              placeholder="Rechercher par titre ou auteur..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 placeholder-gray-500"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page on search
              }}
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Panel: Filters */}
          <div className="w-full lg:w-1/4 bg-white p-6 rounded-lg border border-gray-200 shadow-sm lg:sticky lg:top-X lg:self-start">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">FILTRER PAR</h3>
            
            {/* Year Filter */}
            <div className="mb-6">
              <button
                onClick={() => toggleFilterDropdown('year')}
                className="w-full flex justify-between items-center text-gray-700 hover:text-blue-600 font-medium py-2 border-b border-gray-200 focus:outline-none"
              >
                Année
                <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${activeFilterDropdown === 'year' ? 'rotate-180' : 'rotate-0'}`} />
              </button>
              {activeFilterDropdown === 'year' && (
                <div className="mt-2 space-y-2 text-sm max-h-60 overflow-y-auto">
                  {yearOptions.map(year => (
                    <label key={year} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="year"
                        value={year}
                        checked={selectedYear === year}
                        onChange={() => {
                          setSelectedYear(year);
                          setCurrentPage(1); // Reset to first page on filter change
                        }}
                        className="form-radio text-blue-600 h-4 w-4"
                      />
                      <span>{year}</span>
                    </label>
                  ))}
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="year"
                      value=""
                      checked={selectedYear === null}
                      onChange={() => {
                        setSelectedYear(null);
                        setCurrentPage(1); // Reset to first page on filter clear
                      }}
                      className="form-radio text-blue-600 h-4 w-4"
                    />
                    <span>Toutes les années</span>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Publications List */}
          <div className="w-full lg:w-3/4">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
                <span className="ml-3 text-lg text-gray-700">Chargement des publications...</span>
              </div>
            ) : currentPublications.length > 0 ? (
              <div className="space-y-6">
                {currentPublications.map((pub) => (
                  <div
                    key={pub.id}
                    className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm transition-shadow duration-200 hover:shadow-md"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-1 leading-snug">
                      {pub.title}
                    </h3>
                    <p className="text-gray-700 text-sm mb-1">
                      <span className="font-medium">Auteur(s):</span> {Array.isArray(pub.authors) ? pub.authors.join(', ') : pub.authors}. {/* Ensure authors is array */}
                    </p>
                    {/* MODIFIED: Display with explicit labels and new lines */}
                    <p className="text-gray-600 text-sm mb-2">
                      {pub.journal && <><span className="font-medium">Journal:</span> {pub.journal}<br /></>}
                      {pub.volume && <><span className="font-medium">Volume:</span> {pub.volume}<br /></>}
                      {pub.pages && <><span className="font-medium">Pages:</span> {pub.pages}<br /></>}
                      <span className="font-medium">Année:</span> {pub.year}.
                    </p>
                    {pub.doi && (
                      <Link
                        href={`https://doi.org/${pub.doi}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm font-medium"
                      >
                        DOI: {pub.doi}
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            ) : (
                <div className="text-center text-gray-600 text-lg py-12">
                  {error ? `Erreur: ${error}` : 'Aucune publication ne correspond à la sélection.'}
                </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && !loading && (
              <div className="flex justify-center items-center space-x-2 mt-12">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  &larr; Précédent
                </button>
                {paginationNumbers.map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-4 py-2 border rounded-lg ${
                      currentPage === page
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                    } transition-colors duration-200`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  Suivant &rarr;
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PublicationsList;
