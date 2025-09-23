// frontend/components/dashboard/PublicationManagement.tsx
'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

// Lucide Icons for consistent UI
import {
  BookOpen, PlusCircle, Trash2, Edit3, Loader2, Info, ArrowLeft, Search,
  Calendar as CalendarIcon, User as UserIcon, ScrollText, Hash, Link as LinkIcon,
  Book, Globe, LayoutGrid, Layers, FileText , XCircle, Download // Added Download icon for export
} from 'lucide-react';

// Fonts
import { Inter, Playfair_Display } from 'next/font/google';

// API Services for publications
import {
  getAllPublications,
  createPublication as apiCreatePublication,
  updatePublication as apiUpdatePublication,
  deletePublication,
  getPublicationById
} from '@/services/publicationsApi';

// Import the Publication type
import { Publication } from '@/types/index';

// Import Toast and ErrorModal components
import Toast from '@/components/ui/Toast';
import ErrorModal from '@/components/ui/ErrorModal';

const inter = Inter({ subsets: ['latin'] });
const playfair = Playfair_Display({ subsets: ['latin'], weight: ['400', '700'] });

const ITEMS_PER_PAGE = 10;

// Helper function to escape values for CSV
const escapeCsvValue = (value: any): string => {
  if (value === null || value === undefined) {
    return '';
  }
  let stringValue = String(value);

  // Handle arrays by joining them (e.g., for authors)
  if (Array.isArray(value)) {
    stringValue = value.map(item => String(item).replace(/\"/g, '\"\"')).join('; '); // Use semicolon to differentiate from common CSV commas, escape inner quotes
  } else {
    // Escape existing double quotes by doubling them
    stringValue = stringValue.replace(/\"/g, '\"\"');
  }

  // If the value contains a comma, double quote, or newline, enclose it in double quotes
  if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes(';')) { // Check for semicolon too if used as internal separator
    return `\"${stringValue}\"`;
  }
  return stringValue;
};

// Define exportable fields for publications
const exportablePublicationFields = [
  { key: 'id', label: 'ID' },
  { key: 'title', label: 'Titre' },
  { key: 'authors', label: 'Auteurs' },
  { key: 'year', label: 'Année' },
  { key: 'journal', label: 'Journal' },
  { key: 'volume', label: 'Volume' },
  { key: 'pages', label: 'Pages' },
  { key: 'doi', label: 'DOI' },
  { key: 'createdAt', label: 'Date de Création' },
  { key: 'updatedAt', label: 'Date de Dernière Mise à Jour' },
];


const PublicationManagement: React.FC = () => {
  const { token, userRole, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // State for data fetching and management
  const [allPublications, setAllPublications] = useState<Publication[]>([]); // Stores all publications fetched
  const [loadingPublications, setLoadingPublications] = useState<boolean>(true);
  // Renamed 'error' to 'fetchError' to avoid conflict with 'errors' state for Toast/ErrorModal
  const [fetchError, setFetchError] = useState<string | null>(null); 
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [confirmDeletePublicationId, setConfirmDeletePublicationId] = useState<string | null>(null);

  // State for form and editing
  const [currentView, setCurrentView] = useState<'list' | 'add' | 'edit'>('list');
  const [editingPublication, setEditingPublication] = useState<Publication | null>(null);

  // Form fields state
  const [title, setTitle] = useState<string>('');
  const [authors, setAuthors] = useState<string[]>([]); // Array for authors
  const [newAuthorInput, setNewAuthorInput] = useState<string>(''); // For adding new author
  const [year, setYear] = useState<number | ''>(''); // Allow empty string for initial state
  const [journal, setJournal] = useState<string>('');
  const [volume, setVolume] = useState<string>('');
  const [pages, setPages] = useState<string>('');
  const [doi, setDoi] = useState<string>('');

  // Search and Pagination states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  
  // Memoized filtered publications for search and pagination
  const filteredPublications = useMemo(() => {
    let filtered = allPublications;
    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      filtered = allPublications.filter(pub =>
        pub.title.toLowerCase().includes(lowerCaseSearchTerm) ||
        pub.authors.some(author => author.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (pub.journal && pub.journal.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (pub.doi && pub.doi.toLowerCase().includes(lowerCaseSearchTerm))
      );
    }
    return filtered;
  }, [allPublications, searchTerm]);

  // Total pages based on filtered publications
  const totalPages = useMemo(() => Math.ceil(filteredPublications.length / ITEMS_PER_PAGE), [filteredPublications]);

  // Publications to display on current page
  const displayedPublications = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredPublications.slice(start, end);
  }, [filteredPublications, currentPage]);

  // --- New states for Export CSV functionality ---
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedExportFields, setSelectedExportFields] = useState<string[]>(
    exportablePublicationFields.map(field => field.key)
  );
  const [exportingCsv, setExportingCsv] = useState(false);
  // Removed individual success/error messages for export, will use Toast
  // const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);
  // const [exportErrorMessage, setExportErrorMessage] = useState<string | null>(null);
  // --- End new states ---

  // States for Toast and ErrorModal
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
  const [errorModal, setErrorModal] = useState<{ brief: string; detailed?: string; visible: boolean } | null>(null);


  // Fetch all publications - now accepts a flag to show success toast
  const fetchAllPublications = useCallback(async (showSuccessToast = true) => {
    if (!token) {
      // Use ErrorModal for critical auth issues
      setErrorModal({
        brief: 'Jeton d\'authentification manquant.',
        detailed: 'Veuillez vous reconnecter. Votre session a peut-être expiré.',
        visible: true
      });
      setLoadingPublications(false);
      return;
    }
    setLoadingPublications(true);
    setFetchError(null); // Clear previous fetch errors

    // ONLY clear toast here if we are about to show a new success toast from this fetch.
    // Otherwise, assume the calling function (e.g., handleSubmitPublication) has set its own toast.
    if (showSuccessToast) {
      setToast(null); // Clear previous toasts only if we are about to show a new success toast
    }

    try {
      const response = await getAllPublications(); // No searchTerm passed here, fetch all
      
      if (response.success && Array.isArray(response.data)) {
        const fetchedPublications = response.data.map(pub => ({
          ...pub,
          authors: typeof pub.authors === 'string' ? JSON.parse(pub.authors) : pub.authors
        }));
        setAllPublications(fetchedPublications); // Store all fetched publications
        if (showSuccessToast) { // Only show success toast if explicitly requested
          setToast({ message: 'Publications chargées avec succès.', type: 'success' });
        }
      } else {
        // This is an error, so it should always set an error toast and clear any existing success toast
        setToast({ message: response.message || 'Échec du chargement des publications ou format de données invalide.', type: 'error' });
        setAllPublications([]);
      }
    } catch (err: any) {
      console.error("Échec de la récupération des publications :", err);
      setToast({ message: `Erreur lors de la récupération des publications: ${err.message || 'Erreur inconnue.'}`, type: 'error' });
      setAllPublications([]);
    } finally {
      setLoadingPublications(false);
    }
  }, [token]);

  // Authentication check and initial fetch - now calls fetchAllPublications with true for toast
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || userRole !== 'admin') {
        router.push('/connexion');
        return;
      }
      if (isAuthenticated && token && userRole === 'admin') {
        fetchAllPublications(true); // Fetch all publications initially, show toast
      }
    }
  }, [authLoading, isAuthenticated, userRole, token, router, fetchAllPublications]);

  // Effect to reset page to 1 when search term changes (or for filtering updates)
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]); // Only searchTerm is the trigger here

  const resetForm = useCallback(() => {
    setTitle('');
    setAuthors([]);
    setNewAuthorInput('');
    setYear('');
    setJournal('');
    setVolume('');
    setPages('');
    setDoi('');
    setEditingPublication(null);
  }, []);

  const handleAddNewPublication = useCallback(() => {
    resetForm();
    setCurrentView('add');
  }, [resetForm]);

  const handleEditPublication = useCallback(async (publicationId: string) => {
    if (!token) {
      setToast({ message: 'Jeton d\'authentification introuvable.', type: 'error' });
      return;
    }
    setLoadingPublications(true);
    setFetchError(null); // Clear previous fetch errors
    setToast(null); // Clear previous toasts
    try {
      const response = await getPublicationById(publicationId, token);
      const pubToEdit = response.data;
      if (pubToEdit) {
        setEditingPublication({
          ...pubToEdit,
          authors: typeof pubToEdit.authors === 'string' ? JSON.parse(pubToEdit.authors) : pubToEdit.authors
        });
        setTitle(pubToEdit.title);
        setAuthors(typeof pubToEdit.authors === 'string' ? JSON.parse(pubToEdit.authors) : pubToEdit.authors);
        setYear(pubToEdit.year || '');
        setJournal(pubToEdit.journal || '');
        setVolume(pubToEdit.volume || '');
        setPages(pubToEdit.pages || '');
        setDoi(pubToEdit.doi || '');
        setCurrentView('edit');
        setToast({ message: 'Publication chargée pour modification.', type: 'info' }); // Info toast for loading edit form
      } else {
        setToast({ message: 'Publication non trouvée.', type: 'error' });
      }
    } catch (err: any) {
      console.error("Échec de la récupération de la publication pour modification :", err);
      setToast({ message: `Erreur lors de la récupération de la publication: ${err.message || 'Erreur inconnue.'}`, type: 'error' });
    } finally {
      setLoadingPublications(false);
    }
  }, [token]);

  const handleSubmitPublication = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setToast({ message: 'Jeton d\'authentification introuvable. Veuillez vous connecter.', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    setFetchError(null); // Clear previous errors
    setToast(null); // Clear previous toasts before new operation

    const publicationData = {
      title,
      authors,
      year: year === '' ? 0 : Number(year), // Send undefined if empty
      journal: journal ?? '',
      volume: volume ?? '',
      pages: pages ?? '',
      doi: doi ?? '',
      type: editingPublication?.type ?? 'journal',
    };

    try {
      let response;
      if (currentView === 'add') {
        response = await apiCreatePublication(publicationData, token);
      } else if (currentView === 'edit' && editingPublication) {
        response = await apiUpdatePublication(editingPublication.id, publicationData, token);
      }

      if (response && response.success) {
        resetForm();
        setCurrentView('list');
        // IMPORTANT: Suppress "chargées avec succés" toast after save/create
        await fetchAllPublications(false); 
        setToast({ message: `Publication ${currentView === 'add' ? 'ajoutée' : 'modifiée'} avec succès !`, type: 'success' });
      } else {
        setToast({ message: response?.message || 'Une erreur est survenue lors de l opération.', type: 'error' });
      }
    } catch (err: any) {
      console.error("Erreur lors de l'envoi de la publication :", err);
      setToast({ message: `Erreur lors de l'opération : ${err.message || 'Erreur inconnue.'}`, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  }, [title, authors, year, journal, volume, pages, doi, currentView, editingPublication, token, resetForm, fetchAllPublications]);

  const handleDeletePublication = useCallback(async () => {
    if (!confirmDeletePublicationId || !token) {
      setToast({ message: 'ID de publication ou jeton manquant.', type: 'error' });
      return;
    }
    setIsSubmitting(true);
    setFetchError(null); // Clear previous errors
    setToast(null); // Clear previous toasts
    try {
      const response = await deletePublication(confirmDeletePublicationId, token);
      if (response.success) {
        setConfirmDeletePublicationId(null);
        // IMPORTANT: Suppress "chargées avec succés" toast after delete
        await fetchAllPublications(false); 
        setToast({ message: 'Publication supprimée avec succès !', type: 'success' });
      } else {
        setToast({ message: response.message || 'Échec de la suppression de la publication.', type: 'error' });
      }
    } catch (err: any) {
      console.error("Échec de la suppression de la publication :", err);
      setToast({ message: `Erreur lors de la suppression : ${err.message || 'Erreur inconnue.'}`, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  }, [confirmDeletePublicationId, token, fetchAllPublications]);

  const handleAddAuthor = useCallback(() => {
    if (newAuthorInput.trim() !== '') {
      setAuthors(prevAuthors => [...prevAuthors, newAuthorInput.trim()]);
      setNewAuthorInput('');
    }
  }, [newAuthorInput]);

  const handleRemoveAuthor = useCallback((indexToRemove: number) => {
    setAuthors(prevAuthors => prevAuthors.filter((_, index) => index !== indexToRemove));
  }, []);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // --- CSV Export Logic ---
  const handleExportCsv = useCallback(() => {
    if (!filteredPublications.length) {
      setToast({ message: 'Aucune donnée à exporter.', type: 'warning' });
      return;
    }

    setExportingCsv(true);
    setToast(null); // Clear previous toasts

    try {
      const selectedFieldsData = exportablePublicationFields.filter(field =>
        selectedExportFields.includes(field.key)
      );

      const headers = selectedFieldsData.map(field => field.label).join(',');
      const rows = filteredPublications.map(pub => {
        const rowData = selectedFieldsData.map(field => {
          // Special handling for nested or array fields if necessary
          if (field.key === 'authors') {
            return escapeCsvValue(Array.isArray((pub as any)[field.key]) ? (pub as any)[field.key].join(', ') : (pub as any)[field.key]);
          }
          return escapeCsvValue((pub as any)[field.key]);
        });
        return rowData.join(',');
      });

      const csvContent = [headers, ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'publications_export.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url); // Clean up

      setToast({ message: 'Données exportées avec succès !', type: 'success' });
      setShowExportModal(false); // Close modal after successful export
    } catch (err: any) {
      console.error("Error exporting CSV:", err);
      setToast({ message: `Échec de l'exportation : ${err.message || 'Erreur inconnue.'}`, type: 'error' });
    } finally {
      setExportingCsv(false);
    }
  }, [filteredPublications, selectedExportFields]);

  const handleToggleFieldSelection = (key: string) => {
    setSelectedExportFields(prev =>
      prev.includes(key) ? prev.filter(field => field !== key) : [...prev, key]
    );
  };
  // --- End CSV Export Logic ---


  if (authLoading || loadingPublications) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <Loader2 className="animate-spin h-10 w-10 text-blue-600" />
        <p className="ml-3 text-gray-700">Chargement des publications...</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8  ${inter.className}`}>
      <header className=" text-center">
      <div className="flex items-center space-x-4 bg-gradient-to-r from-blue-600 to-purple-700 text-white p-6 rounded-xl shadow-lg mb-8">
          <BookOpen className="w-10 h-10 flex-shrink-0" />
          <h1 className="text-4xl font-extrabold tracking-tight">Gestion des Publications</h1>
        <p className="text-xl text-white  ">Gérez, créez et modifiez les publications scientifiques.</p>
        </div>
      </header>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Error Modal (for critical errors like auth token missing or major fetch failures) */}
      {errorModal && errorModal.visible && (
        <ErrorModal
          briefDescription={errorModal.brief}
          detailedError={errorModal.detailed}
          onClose={() => setErrorModal(null)}
        />
      )}

      {currentView === 'list' && (
        <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">Toutes les publications</h2>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Rechercher une publication..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>
              <button
                onClick={() => setShowExportModal(true)} // Open export modal
                className="inline-flex items-center px-5 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <Download className="h-5 w-5 mr-2" />
                Exporter CSV
              </button>
              <button
                onClick={handleAddNewPublication}
                className="inline-flex items-center px-5 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusCircle className="h-5 w-5 mr-2" />
                Ajouter une nouvelle publication
              </button>
            </div>
          </div>

          {displayedPublications.length === 0 && !loadingPublications && (
            <p className="text-center text-gray-500 py-8">Aucune publication trouvée. Cliquez sur "Ajouter une nouvelle publication" pour en créer une.</p>
          )}

          {displayedPublications.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titre</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Auteurs</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Année</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Journal/Conférence</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DOI</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Créateur</th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {displayedPublications.map((pub) => (
                    <tr key={pub.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 max-w-xs truncate" title={pub.title}>
                        {pub.title}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {Array.isArray(pub.authors) ? pub.authors.join(', ') : pub.authors}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {pub.year}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={pub.journal}>
                        {pub.journal || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 max-w-xs truncate hover:underline">
                        {pub.doi ? (
                          <a href={`https://doi.org/${pub.doi}`} target="_blank" rel="noopener noreferrer" title={pub.doi}>
                            {pub.doi}
                          </a>
                        ) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {pub.creatorName || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleEditPublication(pub.id!)}
                            className="text-blue-600 hover:text-blue-900 p-2 rounded-full hover:bg-blue-100 transition-colors"
                            title="Modifier la publication"
                          >
                            <Edit3 className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => setConfirmDeletePublicationId(pub.id!)}
                            className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-100 transition-colors"
                            title="Supprimer la publication"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <nav
              className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6"
              aria-label="Pagination"
            >
              <div className="hidden sm:block">
                <p className="text-sm text-gray-700">
                  Affichage de <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> à{' '}
                  <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, filteredPublications.length)}</span> sur{' '}
                  <span className="font-medium">{filteredPublications.length}</span> publications
                </p>
              </div>
              <div className="flex-1 flex justify-between sm:justify-end">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Précédent
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Suivant
                </button>
              </div>
            </nav>
          )}
        </div>
      )}

      {/* Add/Edit Form */}
      {(currentView === 'add' || currentView === 'edit') && (
        <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100 relative">
          <button
            onClick={() => { resetForm(); setCurrentView('list'); setToast(null); setErrorModal(null); }} // Clear toasts on back
            className="absolute top-6 left-6 flex items-center text-gray-600 hover:text-gray-900 font-medium"
          >
            <ArrowLeft className="w-5 h-5 mr-2" /> Retour à la liste
          </button>
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center mt-4">
            {editingPublication ? 'Modifier la publication' : 'Créer une nouvelle publication'}
          </h2>

          <form onSubmit={handleSubmitPublication} className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <FileText className="w-4 h-4 mr-1 text-gray-500" /> Titre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Titre de la publication"
                required
              />
            </div>

            {/* Authors */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <UserIcon className="w-4 h-4 mr-1 text-gray-500" /> Auteurs <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {authors.map((author, index) => (
                  <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {author}
                    <button
                      type="button"
                      onClick={() => handleRemoveAuthor(index)}
                      className="ml-2 text-blue-600 hover:text-blue-900 focus:outline-none"
                      title="Supprimer cet auteur"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex space-x-2">
                <input
                  type="text"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Ajouter un auteur..."
                  value={newAuthorInput}
                  onChange={(e) => setNewAuthorInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault(); // Prevent form submission
                      handleAddAuthor();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddAuthor}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-sm"
                >
                  Ajouter
                </button>
              </div>
              {authors.length === 0 && <p className="text-red-500 text-xs mt-1">Au moins un auteur est requis.</p>}
            </div>

            {/* Year */}
            <div>
              <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <CalendarIcon className="w-4 h-4 mr-1 text-gray-500" /> Année <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="year"
                value={year}
                onChange={(e) => setYear(e.target.value === '' ? '' : Number(e.target.value))}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Ex: 2023"
                min="1900" // Reasonable minimum year
                max={new Date().getFullYear() + 5} // Up to 5 years in future for pre-publication
                required
              />
            </div>

            {/* Journal */}
            <div>
              <label htmlFor="journal" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Book className="w-4 h-4 mr-1 text-gray-500" /> Journal / Conférence
              </label>
              <input
                type="text"
                id="journal"
                value={journal}
                onChange={(e) => setJournal(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Nom du journal ou de la conférence"
              />
            </div>

            {/* Volume */}
            <div>
              <label htmlFor="volume" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Layers className="w-4 h-4 mr-1 text-gray-500" /> Volume
              </label>
              <input
                type="text"
                id="volume"
                value={volume}
                onChange={(e) => setVolume(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Numéro de volume"
              />
            </div>

            {/* Pages */}
            <div>
              <label htmlFor="pages" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <LayoutGrid className="w-4 h-4 mr-1 text-gray-500" /> Pages
              </label>
              <input
                type="text"
                id="pages"
                value={pages}
                onChange={(e) => setPages(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Ex: 123-456"
              />
            </div>

            {/* DOI */}
            <div>
              <label htmlFor="doi" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <LinkIcon className="w-4 h-4 mr-1 text-gray-500" /> DOI
              </label>
              <input
                type="text"
                id="doi"
                value={doi}
                onChange={(e) => setDoi(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Ex: 10.1000/xyz123"
              />
              <p className="mt-1 text-xs text-gray-500">
                Identifiant numérique d'objet. Doit être unique.
              </p>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setCurrentView('list');
                  setToast(null); // Clear toasts on back
                  setErrorModal(null); // Clear error modal on back
                }}
                className="px-6 py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={isSubmitting || authors.length === 0}
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                ) : (
                  <PlusCircle className="h-5 w-5 mr-2" />
                )}
                {isSubmitting ? 'Enregistrement...' : 'Confirmer & Enregistrer'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Export CSV Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Exporter les données des publications</h3>
            <p className="text-sm text-gray-500 mb-4">Sélectionnez les champs que vous souhaitez inclure dans le fichier CSV :</p>
            <div className="grid grid-cols-2 gap-3 mb-6 max-h-60 overflow-y-auto pr-2">
              {exportablePublicationFields.map((field) => (
                <div key={field.key} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`export-field-${field.key}`}
                    checked={selectedExportFields.includes(field.key)}
                    onChange={() => handleToggleFieldSelection(field.key)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor={`export-field-${field.key}`} className="ml-2 text-sm text-gray-700">
                    {field.label}
                  </label>
                </div>
              ))}
            </div>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowExportModal(false);
                  setSelectedExportFields(exportablePublicationFields.map(field => field.key)); // Reset selection on close
                  setToast(null); // Clear toasts on close
                  setErrorModal(null); // Clear error modal on close
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                disabled={exportingCsv}
              >
                Annuler
              </button>
              <button
                onClick={handleExportCsv}
                className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={exportingCsv}
              >
                {exportingCsv ? (
                  <Loader2 className="animate-spin h-4 w-4 mr-2 inline-block" />
                ) : (
                  <Download className="h-4 w-4 mr-2 inline-block" />
                )}
                {exportingCsv ? 'Exportation...' : 'Exporter'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeletePublicationId && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative p-8 bg-white w-full max-w-md m-auto flex-col flex rounded-lg shadow-lg">
            <div className="text-center">
              <Trash2 className="mx-auto h-12 w-12 text-red-500" />
              <h3 className="text-lg font-semibold text-gray-900 mt-4">Confirmer la suppression</h3>
              <p className="text-sm text-gray-500 mt-2">
                Êtes-vous sûr de vouloir supprimer cette publication ? Cette action est irréversible.
              </p>
            </div>
            <div className="flex justify-center space-x-4 mt-6">
              <button
                onClick={() => setConfirmDeletePublicationId(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                disabled={isSubmitting}
              >
                Annuler
              </button>
              <button
                onClick={handleDeletePublication}
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin h-4 w-4 mr-2 inline-block" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2 inline-block" />
                )}
                {isSubmitting ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicationManagement;
