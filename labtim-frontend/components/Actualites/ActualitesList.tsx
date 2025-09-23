// components/Actualites/ActualitesList.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Inter } from 'next/font/google';
import { Search, Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { getAllActus, Actu } from '@/services/actusApi';
import { useAuth } from '@/context/AuthContext';
import Toast from '@/components/ui/Toast';
import ErrorModal from '@/components/ui/ErrorModal';

const inter = Inter({ subsets: ['latin'] });

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL?.replace('/api', '') || 'http://localhost:5000';

const ActualitesList = () => {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category');

  const { token } = useAuth();

  const [actus, setActus] = useState<Actu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string | null>(initialCategory);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
  const [errorModal, setErrorModal] = useState<{ title: string; briefDescription: string; detailedError?: string } | null>(null);

  const ACTUALITE_CATEGORIES: ('Formation' | 'Conférence' | 'Laboratoire' )[] = ['Formation', 'Conférence', 'Laboratoire'];


  const fetchActus = useCallback(async () => {
    setLoading(true);
    setError(null);
    setToast(null);

    try {
      const response = await getAllActus(token, activeCategoryFilter, searchTerm);
      if (response.success && response.data) {
        const sortedActus = response.data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setActus(sortedActus);
        if (response.data.length > 0) {
          // setToast({ message: 'Actualités chargées avec succès.', type: 'success' }); // Optional: only show toast if data is loaded
        }
      } else {
        setErrorModal({
          title: 'Échec du chargement des actualités',
          briefDescription: response.message || 'Une erreur est survenue lors de la récupération des actualités.',
          detailedError: response.message,
        });
        setActus([]);
      }
    } catch (err: any) {
      console.error('Error fetching actus:', err);
      setErrorModal({
        title: 'Erreur réseau ou serveur',
        briefDescription: 'Impossible de communiquer avec le serveur ou erreur inattendue.',
        detailedError: err.message || 'Veuillez vérifier votre connexion internet et réessayer.',
      });
      setActus([]);
    } finally {
      setLoading(false);
    }
  }, [token, activeCategoryFilter, searchTerm]);

  useEffect(() => {
    fetchActus();
  }, [fetchActus]);


  const totalPages = Math.ceil(actus.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentActualites = actus.slice(startIndex, startIndex + itemsPerPage);

  // FIX: Define the paginationNumbers array here
  const paginationNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatDate = (dateString: string) => {
    try {
      const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(dateString).toLocaleDateString('fr-FR', options);
    } catch (e) {
      console.error("Invalid date string:", dateString);
      return "Date invalide";
    }
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
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Actualités</h2>

        {/* Search Bar */}
        <div className="mb-8 flex items-center justify-between border-b border-gray-200 pb-8">
          <div className="relative flex-grow max-w-lg mx-auto">
            <input
              type="text"
              placeholder="Rechercher une actualité par titre..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 placeholder-gray-500"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>
        </div>

        {/* Category Filter Buttons */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {ACTUALITE_CATEGORIES.map(category => (
            <button
              key={category}
              onClick={() => {
                setActiveCategoryFilter(prev => (prev === category ? null : category)); 
                setCurrentPage(1);
              }}
              className={`
                px-6 py-3 rounded-full font-semibold transition-all duration-300 ease-in-out
                ${activeCategoryFilter === category
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50 hover:text-blue-700'
                }
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
              `}
            >
              {category}
            </button>
          ))}
          {activeCategoryFilter && (
            <button
              onClick={() => {
                setActiveCategoryFilter(null);
                setCurrentPage(1);
              }}
              className="px-6 py-3 rounded-full font-semibold transition-all duration-300 ease-in-out
                         bg-gray-200 text-gray-700 border-2 border-gray-300 hover:bg-gray-300
                         focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50"
            >
              Afficher tout
            </button>
          )}
        </div>

        {/* Actualités Grid */}
        <div className="w-full">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
              <span className="ml-3 text-lg text-gray-700">Chargement des actualités...</span>
            </div>
          ) : currentActualites.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentActualites.map((actu) => (
                <Link
                  key={actu.id}
                  href={`/actualites/${actu.id}`}
                  className="group block bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden transform transition-transform duration-300 hover:scale-[1.02] hover:shadow-lg"
                >
                  <div className="w-full h-48 relative overflow-hidden">
                    <Image
                      src={actu.image ? `${BACKEND_BASE_URL}${actu.image}` : 'https://placehold.co/600x400/E2E8F0/A0AEC0?text=Image+Non+Trouvée'}
                      alt={actu.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover object-center transform transition-transform duration-500 group-hover:scale-105"
                      unoptimized={true}
                      onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/E2E8F0/A0AEC0?text=Image+Non+Trouvée'; }}
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-blue-600 font-semibold mb-1">{actu.category}</p>
                    <h4 className="text-lg font-semibold text-gray-900 leading-tight mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors duration-200">
                      {actu.title}
                    </h4>
                    <p className="text-gray-500 text-sm">{formatDate(actu.date)}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="lg:col-span-3 text-center text-gray-600 text-lg py-12">
              {error ? `Erreur: ${error}` : 'Aucune actualité ne correspond à votre sélection.'}
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
    </section>
  );
};

export default ActualitesList;