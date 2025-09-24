// frontend/components/member/MemberPublicationManagement.tsx
'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

// Lucide Icons for consistent UI
import {
  BookOpen, PlusCircle, Trash2, Edit3, Loader2, Info, ArrowLeft, Search,
  Calendar as CalendarIcon, User as UserIcon, ScrollText, Hash, Link as LinkIcon,
  Book, Globe, LayoutGrid, Layers, FileText, XCircle, Tag
} from 'lucide-react';

// Fonts
import { Inter } from 'next/font/google';

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

const ITEMS_PER_PAGE = 10;

// Publication types for the dropdown
const PUBLICATION_TYPES = [
  { value: 'journal', label: 'Article de journal' },
  { value: 'conference', label: 'Article de conférence' },
  { value: 'book_chapter', label: 'Livre' },
  { value: 'chapter', label: 'Chapitre de livre' },
  { value: 'thesis', label: 'Thèse' },
  { value: 'report', label: 'Rapport' },
  { value: 'patent', label: 'Brevet' },
  { value: 'other', label: 'Autre' }
];

const MemberPublicationManagement: React.FC = () => {
  const { token, userRole, isAuthenticated, isLoading: authLoading, userId: loggedInUserId, user: loggedInUserObject } = useAuth(); // Get loggedInUserObject for name
  const router = useRouter();

  // State for data fetching and management
  const [allPublications, setAllPublications] = useState<Publication[]>([]); // Stores all publications fetched for the user
  const [loadingPublications, setLoadingPublications] = useState<boolean>(true);
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
  const [type, setType] = useState<string>('journal'); // Add type field with default value

  // Search and Pagination states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  
  // States for Toast and ErrorModal
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
  const [errorModal, setErrorModal] = useState<{ title: string; briefDescription: string; detailedError?: string } | null>(null);

  // Memoized filtered publications for search and pagination
  const filteredPublications = useMemo(() => {
    let filtered = allPublications;
    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      filtered = allPublications.filter(pub =>
        pub.title.toLowerCase().includes(lowerCaseSearchTerm) ||
        (pub.authors && pub.authors.some(author => author.toLowerCase().includes(lowerCaseSearchTerm))) || // Check if authors exist
        (pub.journal && pub.journal.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (pub.doi && pub.doi.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (pub.type && pub.type.toLowerCase().includes(lowerCaseSearchTerm))
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


  // Fetch publications for the logged-in member
  const fetchMemberPublications = useCallback(async (showSuccessToast = true) => {
    if (!token || !loggedInUserId) {
      setErrorModal({
        title: 'Jeton ou ID utilisateur manquant',
        briefDescription: 'Veuillez vous reconnecter. Votre session a peut-être expiré.',
        detailedError: 'Token or loggedInUserId is null/undefined during fetchMemberPublications.'
      });
      setLoadingPublications(false);
      return;
    }
    setLoadingPublications(true);
    setToast(null); // Clear previous toasts before new fetch

    try {
      // Pass loggedInUserId as the userId to getAllPublications
      const response = await getAllPublications(token, loggedInUserId); 
      
      if (response.success && Array.isArray(response.data)) {
        const fetchedPublications = response.data.map(pub => ({
            ...pub,
            // Ensure authors are always an array, even if backend sends null or string
            authors: (typeof pub.authors === 'string' ? JSON.parse(pub.authors) : pub.authors) || []
        }));
        setAllPublications(fetchedPublications);
        if (showSuccessToast) {
          setToast({ message: 'Vos publications ont été chargées avec succès.', type: 'success' });
        }
      } else {
        setToast({ message: response.message || 'Échec du chargement de vos publications.', type: 'error' });
        setAllPublications([]);
      }
    } catch (err: any) {
      console.error("Échec de la récupération des publications du membre :", err);
      setErrorModal({
        title: 'Erreur de chargement',
        briefDescription: `Erreur lors de la récupération de vos publications: ${err.message || 'Erreur inconnue.'}`,
        detailedError: err.stack || 'Vérifiez la console pour plus de détails.'
      });
      setAllPublications([]);
    } finally {
      setLoadingPublications(false);
    }
  }, [token, loggedInUserId]);

  // Authentication check and initial fetch
  useEffect(() => {
    if (!authLoading && isAuthenticated && loggedInUserId && userRole === 'member') {
      fetchMemberPublications(true);
    } else if (!authLoading && (!isAuthenticated || userRole !== 'member')) {
      router.replace('/dashboard');
    }
  }, [authLoading, isAuthenticated, userRole, loggedInUserId, router, fetchMemberPublications]);

  // Effect to reset page to 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const resetForm = useCallback(() => {
    setTitle('');
    setAuthors([]); // Reset authors to empty for new publication
    setNewAuthorInput('');
    setYear('');
    setJournal('');
    setVolume('');
    setPages('');
    setDoi('');
    setType('journal'); // Reset to default type
    setEditingPublication(null);
  }, []);

  const handleAddNewPublication = useCallback(() => {
    resetForm();
    setCurrentView('add');
    // FIX: Pre-populate author with logged-in user's name if available
    if (loggedInUserObject?.name) {
      setAuthors([loggedInUserObject.name]);
    }
  }, [resetForm, loggedInUserObject]); // Add loggedInUserObject to dependencies

  const handleEditPublication = useCallback(async (publicationId: string) => {
    if (!token) {
      setToast({ message: 'Jeton d\'authentification introuvable.', type: 'error' });
      return;
    }
    setLoadingPublications(true);
    setToast(null);
    try {
      const response = await getPublicationById(publicationId, token);
      const pubToEdit = response.data;
      
      // FIX: Ensure userId is present on pubToEdit for client-side check
      if (pubToEdit && pubToEdit.userId === loggedInUserId) {
        setEditingPublication({
          ...pubToEdit,
          authors: (typeof pubToEdit.authors === 'string' ? JSON.parse(pubToEdit.authors) : pubToEdit.authors) || []
        });
        setTitle(pubToEdit.title);
        setAuthors((typeof pubToEdit.authors === 'string' ? JSON.parse(pubToEdit.authors) : pubToEdit.authors) || []);
        setYear(pubToEdit.year || '');
        setJournal(pubToEdit.journal || '');
        setVolume(pubToEdit.volume || '');
        setPages(pubToEdit.pages || '');
        setDoi(pubToEdit.doi || '');
        setType(pubToEdit.type || 'journal'); // Set type from publication data
        setCurrentView('edit');
        setToast({ message: 'Publication chargée pour modification.', type: 'info' });
      } else {
        setErrorModal({
          title: 'Accès non autorisé',
          briefDescription: 'Cette publication ne vous appartient pas ou n\'existe pas.',
          detailedError: 'Attempted to edit a publication not owned by the user or non-existent.'
        });
        setToast({ message: 'Publication non trouvée ou accès non autorisé.', type: 'error' });
      }
    } catch (err: any) {
      console.error("Échec de la récupération de la publication pour modification :", err);
      setErrorModal({
        title: 'Erreur de chargement',
        briefDescription: `Erreur lors de la récupération de la publication: ${err.message || 'Erreur inconnue.'}`,
        detailedError: err.stack || 'Vérifiez la console pour plus de détails.'
      });
    } finally {
      setLoadingPublications(false);
    }
  }, [token, loggedInUserId]);


  const handleSubmitPublication = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !loggedInUserId || !loggedInUserObject) { // Ensure loggedInUserObject is available
      setToast({ message: 'Jeton d\'authentification ou ID utilisateur manquant. Veuillez vous connecter.', type: 'error' });
      return;
    }
    
    // FIX: Ensure authors array includes the logged-in user's name
    let finalAuthors = [...authors];
    if (loggedInUserObject.name && !finalAuthors.includes(loggedInUserObject.name)) {
      finalAuthors.unshift(loggedInUserObject.name); // Prepend creator's name
    }

    if (finalAuthors.length === 0) {
      setToast({ message: 'Au moins un auteur (le créateur) est requis.', type: 'warning' });
      return;
    }

    setIsSubmitting(true);
    setToast(null);
    setErrorModal(null);

    const publicationData : Omit<Publication, "id" | "creatorName" | "createdAt" | "updatedAt" | "creatorEmail"> = {
      title,
      authors: finalAuthors, // Use the finalAuthors array
      year: year === '' ? 0 : Number(year),
      journal: journal || '',
      volume: volume || undefined,
      pages: pages || undefined,
      doi: doi || undefined,
      type: type as Publication['type'],
      userId: loggedInUserId, // Explicitly set userId for new publications
    };

    try {
      let response;
      if (currentView === 'add') {
        response = await apiCreatePublication(publicationData, token);
      } else if (currentView === 'edit' && editingPublication) {
        if (editingPublication.userId !== loggedInUserId) {
          throw new Error("Unauthorized: Cannot modify another user's publication.");
        }
        response = await apiUpdatePublication(editingPublication.id, publicationData, token);
      } else {
        throw new Error("Opération non valide.");
      }

      if (response && response.success) {
        resetForm();
        setCurrentView('list');
        await fetchMemberPublications(false);
        setToast({ message: `Publication ${currentView === 'add' ? 'ajoutée' : 'modifiée'} avec succès !`, type: 'success' });
      } else {
        setErrorModal({
          title: 'Échec de l\'opération',
          briefDescription: response?.message || 'Une erreur est survenue lors de l\'opération sur la publication.',
          detailedError: response?.message || 'La réponse du serveur n\'indique pas de succès.'
        });
      }
    } catch (err: any) {
      console.error("Erreur lors de l'envoi de la publication :", err);
      setErrorModal({
        title: 'Erreur lors de l\'envoi',
        briefDescription: `Erreur lors de l'opération : ${err.message || 'Erreur inconnue.'}`,
        detailedError: err.stack || 'Vérifiez la console pour plus de détails.'
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [title, authors, year, journal, volume, pages, doi, type, currentView, editingPublication, token, loggedInUserId, loggedInUserObject, resetForm, fetchMemberPublications]);

  const handleDeletePublication = useCallback(async () => {
    if (!confirmDeletePublicationId || !token || !loggedInUserId) {
      setToast({ message: 'ID de publication ou jeton manquant.', type: 'error' });
      return;
    }
    setIsSubmitting(true);
    setToast(null);
    setErrorModal(null);

    try {
      const publicationToDelete = allPublications.find(pub => pub.id === confirmDeletePublicationId);
      // FIX: Ensure userId is present on publicationToDelete for client-side check
      if (!publicationToDelete || publicationToDelete.userId !== loggedInUserId) {
        throw new Error("Unauthorized: Cannot delete another user's publication.");
      }

      const response = await deletePublication(confirmDeletePublicationId, token);
      if (response.success) {
        setConfirmDeletePublicationId(null);
        await fetchMemberPublications(false);
        setToast({ message: 'Publication supprimée avec succès !', type: 'success' });
      } else {
        setErrorModal({
          title: 'Échec de la suppression',
          briefDescription: response.message || 'Échec de la suppression de la publication.',
          detailedError: response.message || 'La réponse du serveur n\'indique pas de succès.'
        });
      }
    } catch (err: any) {
      console.error("Échec de la suppression de la publication :", err);
      setErrorModal({
        title: 'Erreur de suppression',
        briefDescription: `Erreur lors de la suppression : ${err.message || 'Erreur inconnue.'}`,
        detailedError: err.stack || 'Vérifiez la console pour plus de détails.'
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [confirmDeletePublicationId, token, loggedInUserId, allPublications, fetchMemberPublications]);

  const handleAddAuthor = useCallback(() => {
    if (newAuthorInput.trim() !== '') {
      setAuthors(prevAuthors => [...new Set([...prevAuthors, newAuthorInput.trim()])]);
      setNewAuthorInput('');
    }
  }, [newAuthorInput]);

  const handleRemoveAuthor = useCallback((indexToRemove: number) => {
    setAuthors(prevAuthors => prevAuthors.filter((_, index) => index !== indexToRemove));
  }, []);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Get display label for publication type
  const getTypeLabel = (typeValue: string) => {
    const typeOption = PUBLICATION_TYPES.find(t => t.value === typeValue);
    return typeOption ? typeOption.label : typeValue;
  };

  // Loading state for initial auth and data fetch
  if (authLoading || loadingPublications) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <Loader2 className="animate-spin h-10 w-10 text-blue-600" />
        <p className="ml-3 text-gray-700">Chargement de vos publications...</p>
      </div>
    );
  }

  // If not authenticated or not a member, show unauthorized message (should be handled by layout, but as fallback)
  if (!isAuthenticated || userRole !== 'member') {
    return (
      <div className="flex justify-center items-center h-screen text-red-500 bg-red-50 p-8">
        Accès non autorisé à cette page de gestion des publications.
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8 ${inter.className}`}>
      <header className="text-center">
        <div className="flex items-center space-x-4 bg-gradient-to-r from-blue-600 to-purple-700 text-white p-6 rounded-xl shadow-lg mb-8">
          <BookOpen className="w-10 h-10 flex-shrink-0" />
          <h1 className="text-4xl font-extrabold tracking-tight">Mes Publications</h1>
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

      {/* Error Modal */}
      {errorModal && (
        <ErrorModal
          title={errorModal.title}
          briefDescription={errorModal.briefDescription}
          detailedError={errorModal.detailedError}
          onClose={() => setErrorModal(null)}
        />
      )}

      {currentView === 'list' && (
        <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">Liste de mes publications</h2>
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
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Auteurs</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Année</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Journal/Conférence</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DOI</th>
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {getTypeLabel(pub.type || 'journal')}
                        </span>
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
                  Affichage de <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> à {' '}
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
            onClick={() => { resetForm(); setCurrentView('list'); setToast(null); setErrorModal(null); }}
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

            {/* Type */}
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Tag className="w-4 h-4 mr-1 text-gray-500" /> Type de publication <span className="text-red-500">*</span>
              </label>
              <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              >
                {PUBLICATION_TYPES.map((typeOption) => (
                  <option key={typeOption.value} value={typeOption.value}>
                    {typeOption.label}
                  </option>
                ))}
              </select>
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
                      e.preventDefault();
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
                min="1900"
                max={new Date().getFullYear() + 5}
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
                  setToast(null);
                  setErrorModal(null);
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

export default MemberPublicationManagement;