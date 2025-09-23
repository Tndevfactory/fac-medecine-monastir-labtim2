// components/Theses/ThesesList.tsx
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Inter } from 'next/font/google';
import { ChevronDown, ChevronUp, Search, Loader2 } from 'lucide-react'; // Added Loader2
import Link from 'next/link';

import { getAllTheses } from '@/services/thesesApi'; // Import the API function
import { useAuth } from '@/context/AuthContext'; // Import useAuth to get the token (optional for public routes)
import Toast from '@/components/ui/Toast'; // Assuming you have a Toast component
import ErrorModal from '@/components/ui/ErrorModal'; // Assuming you have an ErrorModal component

const inter = Inter({ subsets: ['latin'] });

// Define the type for a Thesis/HDR item with new fields (ensure it matches your backend response)
interface Thesis {
  id: string;
  title: string;
  author: string;
  year: number;
  summary: string;
  type: 'HDR' | 'These'; // Type of thesis/HDR
  etablissement: string; // Establishment name
  specialite: string; // Specialty
  encadrant: string; // Supervisor name
  membres: string[]; // Array of committee members
  creatorId?: string;
  createdAt?: string;
}

const ThesesList = () => {
  const { token } = useAuth(); // Get token from AuthContext (will be null if not logged in)

  const [theses, setTheses] = useState<Thesis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // Display 8 theses per page
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilterDropdown, setActiveFilterDropdown] = useState<string | null>('year'); // 'year' open by default
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null); // New state for type filter
  const [expandedThesisId, setExpandedThesisId] = useState<string | null>(null); // State for expanded summary

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
  const [errorModal, setErrorModal] = useState<{ title: string; briefDescription: string; detailedError?: string } | null>(null);

  // Function to fetch Theses from the API
  const fetchTheses = useCallback(async () => {
    setLoading(true);
    setError(null);
    setToast(null); // Clear previous toasts

    // No need for `if (!token)` check here, as the route is public.
    // We pass `token` (which might be null) to `getAllTheses`.
    try {
      const response = await getAllTheses(token, undefined, selectedYear, selectedType, searchTerm);
      if (response.success && response.data) {
        setTheses(response.data);
        if (response.data.length > 0) {
          // setToast({ message: 'Thèses et HDR chargées avec succès.', type: 'success' });
        }
      } else {
        setErrorModal({
          title: 'Échec du chargement des Thèses et HDR',
          briefDescription: response.message || 'Une erreur est survenue lors de la récupération des Thèses et HDR.',
          detailedError: response.message,
        });
        setTheses([]); // Clear on error
      }
    } catch (err: any) {
      console.error('Error fetching Theses:', err);
      setErrorModal({
        title: 'Erreur réseau ou serveur',
        briefDescription: 'Impossible de communiquer avec le serveur ou erreur inattendue.',
        detailedError: err.message || 'Veuillez vérifier votre connexion internet et réessayer.',
      });
      setTheses([]); // Clear on error
    } finally {
      setLoading(false);
    }
  }, [token, selectedYear, selectedType, searchTerm]); // Re-fetch when filters/token change

  // Initial fetch on component mount and when filters/token change
  useEffect(() => {
    fetchTheses();
  }, [fetchTheses]);

  // Helper to get unique years from fetched theses
  const getUniqueYears = (theses: Thesis[]) => {
    const years = Array.from(new Set(theses.map(thesis => thesis.year)));
    return years.sort((a, b) => b - a); // Sort in descending order (most recent first)
  };

  const yearOptions = useMemo(() => getUniqueYears(theses), [theses]);
  const typeOptions = useMemo(() => Array.from(new Set(theses.map(thesis => thesis.type))), [theses]); // Get unique types from fetched data

  // Theses are now filtered on the backend, so `theses` state already holds the filtered list.
  // We just need to handle pagination on the client side.
  const totalPages = Math.ceil(theses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentTheses = theses.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const paginationNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  const toggleFilterDropdown = (dropdownName: string) => {
    setActiveFilterDropdown(activeFilterDropdown === dropdownName ? null : dropdownName);
  };

  const toggleSummary = (id: string) => {
    setExpandedThesisId(prevId => (prevId === id ? null : id));
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
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Thèses et HDR</h2>

        {/* Search Bar */}
        <div className="mb-12 flex items-center justify-between border-b border-gray-200 pb-8">
          <div className="relative flex-grow max-w-lg mx-auto">
            <input
              type="text"
              placeholder="Rechercher par titre, auteur, établissement, spécialité, encadrant, membres..." // Updated placeholder
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
          <div className="w-full lg:w-1/4 bg-white p-6 rounded-lg border border-gray-200 shadow-sm lg:sticky lg:top-24 lg:self-start">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">FILTRER PAR</h3>
            
            {/* Type Filter (New) */}
            <div className="mb-6">
              <button
                onClick={() => toggleFilterDropdown('type')}
                className="w-full flex justify-between items-center text-gray-700 hover:text-blue-600 font-medium py-2 border-b border-gray-200 focus:outline-none"
              >
                Type
                <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${activeFilterDropdown === 'type' ? 'rotate-180' : 'rotate-0'}`} />
              </button>
              {activeFilterDropdown === 'type' && (
                <div className="mt-2 space-y-2 text-sm max-h-60 overflow-y-auto">
                  {typeOptions.map(type => (
                    <label key={type} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="type"
                        value={type}
                        checked={selectedType === type}
                        onChange={() => {
                          setSelectedType(type);
                          setCurrentPage(1);
                        }}
                        className="form-radio text-blue-600 h-4 w-4"
                      />
                      <span>{type}</span>
                    </label>
                  ))}
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="type"
                      value=""
                      checked={selectedType === null}
                      onChange={() => {
                        setSelectedType(null);
                        setCurrentPage(1);
                      }}
                      className="form-radio text-blue-600 h-4 w-4"
                    />
                    <span>Tous les types</span>
                  </label>
                </div>
              )}
            </div>

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

          {/* Right Panel: Theses List */}
          <div className="w-full lg:w-3/4">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
                <span className="ml-3 text-lg text-gray-700">Chargement des Thèses et HDR...</span>
              </div>
            ) : currentTheses.length > 0 ? (
              <div className="space-y-6">
                {currentTheses.map((thesis) => (
                  <div
                    key={thesis.id}
                    className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm transition-shadow duration-200 hover:shadow-md"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-1 leading-snug">
                      {thesis.title}
                    </h3>
                    <p className="text-gray-700 text-sm mb-1">
                      <span className="font-medium">Type:</span> {thesis.type} <br />
                      <span className="font-medium">Auteur:</span> {thesis.author} <br />
                      <span className="font-medium">Établissement:</span> {thesis.etablissement} <br />
                      <span className="font-medium">Spécialité:</span> {thesis.specialite} <br />
                      <span className="font-medium">Encadrant:</span> {thesis.encadrant} <br />
                      {thesis.membres.length > 0 && (
                        <>
                          <span className="font-medium">Membres:</span> {thesis.membres.join(', ')} <br />
                        </>
                      )}
                      <span className="font-medium">Année:</span> {thesis.year}
                    </p>

                    {/* Summary Toggle */}
                    <div className="mt-2">
                      <button
                        onClick={() => toggleSummary(thesis.id)}
                        className="flex items-center text-blue-600 hover:underline text-sm font-medium focus:outline-none"
                      >
                        {expandedThesisId === thesis.id ? 'Masquer le résumé' : 'Afficher le résumé'}
                        {expandedThesisId === thesis.id ? (
                          <ChevronUp className="ml-1 h-4 w-4" />
                        ) : (
                          <ChevronDown className="ml-1 h-4 w-4" />
                        )}
                      </button>
                      {expandedThesisId === thesis.id && (
                        <p className="text-gray-800 mt-2 text-sm leading-relaxed animate-fade-in">
                          {thesis.summary}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-600 text-lg py-12">
                {error ? `Erreur: ${error}` : 'Aucune thèse ne correspond à la sélection.'}
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

export default ThesesList;
