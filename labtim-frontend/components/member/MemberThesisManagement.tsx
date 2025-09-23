// frontend/components/member/MemberThesisManagement.tsx
'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

// Lucide Icons for consistent UI
import {
  GraduationCap, PlusCircle, Trash2, Edit3, Loader2, Info, ArrowLeft, Search,
  Calendar as CalendarIcon, User as UserIcon, ScrollText, Hash,
  Building2, FlaskConical, Users, XCircle , FileText 
} from 'lucide-react';

// Fonts
import { Inter } from 'next/font/google';

// API Services for theses
import {
  getAllTheses,
  createThesis as apiCreateThesis,
  updateThesis as apiUpdateThesis,
  deleteThesis,
  getThesisById
} from '@/services/thesesApi';

// Import the Thesis type
import { Thesis } from '@/types/index';

// Import Toast and ErrorModal components
import Toast from '@/components/ui/Toast';
import ErrorModal from '@/components/ui/ErrorModal';

const inter = Inter({ subsets: ['latin'] });

const ITEMS_PER_PAGE = 10;

const MemberThesisManagement: React.FC = () => {
  const { token, userRole, isAuthenticated, isLoading: authLoading, userId: loggedInUserId, user: loggedInUserObject } = useAuth();
  const router = useRouter();

  // State for data fetching and management
  const [allTheses, setAllTheses] = useState<Thesis[]>([]);
  const [loadingTheses, setLoadingTheses] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [confirmDeleteThesisId, setConfirmDeleteThesisId] = useState<string | null>(null);

  // State for form and editing
  const [currentView, setCurrentView] = useState<'list' | 'add' | 'edit'>('list');
  const [editingThesis, setEditingThesis] = useState<Thesis | null>(null);

  // Form fields state
  const [title, setTitle] = useState<string>('');
  const [author, setAuthor] = useState<string>(''); // This will be pre-filled with creator's name
  const [year, setYear] = useState<number | ''>('');
  const [summary, setSummary] = useState<string>('');
  const [type, setType] = useState<'HDR' | 'These' | ''>('');
  const [etablissement, setEtablissement] = useState<string>('');
  const [specialite, setSpecialite] = useState<string>('');
  const [encadrant, setEncadrant] = useState<string>('');
  const [membres, setMembres] = useState<string[]>([]);
  const [newMembreInput, setNewMembreInput] = useState<string>('');

  // Search and Pagination states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [filterType, setFilterType] = useState<'' | 'HDR' | 'These'>('');
  
  // States for Toast and ErrorModal
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
  const [errorModal, setErrorModal] = useState<{ title: string; briefDescription: string; detailedError?: string } | null>(null);

  // Memoized filtered theses for search and pagination
  const filteredTheses = useMemo(() => {
    let filtered = allTheses;

    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(thesis =>
        thesis.title.toLowerCase().includes(lowerCaseSearchTerm) ||
        thesis.author.toLowerCase().includes(lowerCaseSearchTerm) ||
        thesis.summary.toLowerCase().includes(lowerCaseSearchTerm) ||
        thesis.etablissement.toLowerCase().includes(lowerCaseSearchTerm) ||
        thesis.specialite.toLowerCase().includes(lowerCaseSearchTerm) ||
        thesis.encadrant.toLowerCase().includes(lowerCaseSearchTerm) ||
        (thesis.membres && thesis.membres.some(membre => membre.toLowerCase().includes(lowerCaseSearchTerm)))
      );
    }

    if (filterType) {
      filtered = filtered.filter(thesis => thesis.type === filterType);
    }

    return filtered;
  }, [allTheses, searchTerm, filterType]);

  const totalPages = useMemo(() => Math.ceil(filteredTheses.length / ITEMS_PER_PAGE), [filteredTheses]);

  const displayedTheses = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredTheses.slice(start, end);
  }, [filteredTheses, currentPage]);


  // Fetch theses for the logged-in member
  const fetchMemberTheses = useCallback(async (showSuccessToast = true) => {
    if (!token || !loggedInUserId) {
      setErrorModal({
        title: 'Jeton ou ID utilisateur manquant',
        briefDescription: 'Veuillez vous reconnecter. Votre session a peut-être expiré.',
        detailedError: 'Token or loggedInUserId is null/undefined during fetchMemberTheses.'
      });
      setLoadingTheses(false);
      return;
    }
    setLoadingTheses(true);
    setToast(null);

    try {
      // Pass loggedInUserId as the userId to getAllTheses
      const response = await getAllTheses(token, loggedInUserId); 
      
      if (response.success && Array.isArray(response.data)) {
        const fetchedTheses = response.data.map(thesis => ({
            ...thesis,
            membres: (typeof thesis.membres === 'string' ? JSON.parse(thesis.membres) : thesis.membres) || []
        }));
        setAllTheses(fetchedTheses);
        if (showSuccessToast) {
          setToast({ message: 'Vos thèses ont été chargées avec succès.', type: 'success' });
        }
      } else {
        setToast({ message: response.message || 'Échec du chargement de vos thèses.', type: 'error' });
        setAllTheses([]);
      }
    } catch (err: any) {
      console.error("Échec de la récupération des thèses du membre :", err);
      setErrorModal({
        title: 'Erreur de chargement',
        briefDescription: `Erreur lors de la récupération de vos thèses: ${err.message || 'Erreur inconnue.'}`,
        detailedError: err.stack || 'Vérifiez la console pour plus de détails.'
      });
      setAllTheses([]);
    } finally {
      setLoadingTheses(false);
    }
  }, [token, loggedInUserId]);

  // Authentication check and initial fetch
  useEffect(() => {
    if (!authLoading && isAuthenticated && loggedInUserId && userRole === 'member') {
      fetchMemberTheses(true);
    } else if (!authLoading && (!isAuthenticated || userRole !== 'member')) {
      router.replace('/dashboard');
    }
  }, [authLoading, isAuthenticated, userRole, loggedInUserId, router, fetchMemberTheses]);

  // Effect to reset page to 1 when search term or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType]);

  const resetForm = useCallback(() => {
    setTitle('');
    setAuthor('');
    setYear('');
    setSummary('');
    setType('');
    setEtablissement('');
    setSpecialite('');
    setEncadrant('');
    setMembres([]);
    setNewMembreInput('');
    setEditingThesis(null);
  }, []);

  const handleAddNewThesis = useCallback(() => {
    resetForm();
    setCurrentView('add');
    // Pre-populate author with logged-in user's name if available
    if (loggedInUserObject?.name) {
      setAuthor(loggedInUserObject.name);
    }
  }, [resetForm, loggedInUserObject]);

  const handleEditThesis = useCallback(async (thesisId: string) => {
    if (!token) {
      setToast({ message: 'Jeton d\'authentification introuvable.', type: 'error' });
      return;
    }
    setLoadingTheses(true);
    setToast(null);
    setErrorModal(null); // Clear previous error modals
    try {
      const response = await getThesisById(thesisId, token);
      const thesisToEdit = response.data;
      
      // Ensure userId is present on thesisToEdit for client-side check
      if (thesisToEdit && thesisToEdit.userId === loggedInUserId) {
        setEditingThesis({
          ...thesisToEdit,
          membres: (typeof thesisToEdit.membres === 'string' ? JSON.parse(thesisToEdit.membres) : thesisToEdit.membres) || []
        });
        setTitle(thesisToEdit.title);
        setAuthor(thesisToEdit.author);
        setYear(thesisToEdit.year);
        setSummary(thesisToEdit.summary);
        setType(thesisToEdit.type);
        setEtablissement(thesisToEdit.etablissement);
        setSpecialite(thesisToEdit.specialite);
        setEncadrant(thesisToEdit.encadrant);
        setMembres((typeof thesisToEdit.membres === 'string' ? JSON.parse(thesisToEdit.membres) : thesisToEdit.membres) || []);
        setCurrentView('edit');
        setToast({ message: 'Thèse chargée pour modification.', type: 'info' });
      } else {
        setErrorModal({
          title: 'Accès non autorisé',
          briefDescription: 'Cette thèse ne vous appartient pas ou n\'existe pas.',
          detailedError: 'Attempted to edit a thesis not owned by the user or non-existent.'
        });
        setToast({ message: 'Thèse non trouvée ou accès non autorisé.', type: 'error' });
      }
    } catch (err: any) {
      console.error("Échec de la récupération de la thèse pour modification :", err);
      setErrorModal({
        title: 'Erreur de chargement',
        briefDescription: `Erreur lors de la récupération de la thèse: ${err.message || 'Erreur inconnue.'}`,
        detailedError: err.stack || 'Vérifiez la console pour plus de détails.'
      });
    } finally {
      setLoadingTheses(false);
    }
  }, [token, loggedInUserId]);


  const handleGoBackToList = useCallback(() => {
    setCurrentView('list');
    resetForm();
    setToast(null);
    setErrorModal(null);
  }, [resetForm]);


  const handleAddMembre = useCallback(() => {
    if (newMembreInput.trim() && !membres.includes(newMembreInput.trim())) {
      setMembres(prev => [...prev, newMembreInput.trim()]);
      setNewMembreInput('');
    }
  }, [newMembreInput, membres]);

  const handleRemoveMembre = useCallback((indexToRemove: number) => {
    setMembres(prev => prev.filter((_, index) => index !== indexToRemove));
  }, []);


  const handleSaveThesis = async () => {
    if (!token || !loggedInUserId || !loggedInUserObject) {
      setToast({ message: 'Jeton d\'authentification ou ID utilisateur manquant. Veuillez vous connecter.', type: 'error' });
      return;
    }
    if (!title || !author || !year || !summary || !type || !etablissement || !specialite || !encadrant) {
      setToast({ message: 'Tous les champs obligatoires (Titre, Auteur, Année, Résumé, Type, Établissement, Spécialité, Encadrant) doivent être remplis.', type: 'error' });
      return;
    }
    if (typeof year !== 'number' || year.toString().length !== 4) {
      setToast({ message: 'L\'année doit être un nombre à 4 chiffres.', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    setToast(null);
    setErrorModal(null);

    const thesisData = {
      title,
      author,
      year: Number(year),
      summary,
      type: type as ('HDR' | 'These'),
      etablissement,
      specialite,
      encadrant,
      membres,
      userId: loggedInUserId, // Explicitly set userId for new theses
    };

    try {
      let response;
      if (currentView === 'add') {
        response = await apiCreateThesis(thesisData, token);
      } else if (currentView === 'edit' && editingThesis) {
        if (editingThesis.userId !== loggedInUserId) {
          throw new Error("Unauthorized: Cannot modify another user's thesis.");
        }
        response = await apiUpdateThesis(editingThesis.id, thesisData, token);
      } else {
        throw new Error("Opération non valide.");
      }

      if (response && response.success) {
        resetForm();
        setCurrentView('list');
        await fetchMemberTheses(false);
        setToast({ message: `Thèse ${currentView === 'add' ? 'ajoutée' : 'modifiée'} avec succès !`, type: 'success' });
      } else {
        setErrorModal({
          title: 'Échec de l\'opération',
          briefDescription: response?.message || 'Une erreur est survenue lors de l\'opération sur la thèse.',
          detailedError: response?.message || 'La réponse du serveur n\'indique pas de succès.'
        });
      }
    } catch (err: any) {
      console.error("Échec de l'enregistrement de la thèse :", err);
      setErrorModal({
        title: 'Erreur lors de l\'enregistrement',
        briefDescription: `Erreur lors de l'opération : ${err.message || 'Erreur inconnue.'}`,
        detailedError: err.stack || 'Vérifiez la console pour plus de détails.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteThesis = useCallback(async () => {
    if (!confirmDeleteThesisId || !token || !loggedInUserId) {
      setToast({ message: 'ID de thèse ou jeton manquant.', type: 'error' });
      return;
    }
    setIsSubmitting(true);
    setToast(null);
    setErrorModal(null);
    try {
      const thesisToDelete = allTheses.find(thesis => thesis.id === confirmDeleteThesisId);
      if (!thesisToDelete || thesisToDelete.userId !== loggedInUserId) {
        throw new Error("Unauthorized: Cannot delete another user's thesis.");
      }

      const response = await deleteThesis(confirmDeleteThesisId, token);
      if (response.success) {
        setConfirmDeleteThesisId(null);
        await fetchMemberTheses(false);
        setToast({ message: 'Thèse supprimée avec succès !', type: 'success' });
      } else {
        setErrorModal({
          title: 'Échec de la suppression',
          briefDescription: response.message || 'Échec de la suppression de la thèse.',
          detailedError: response.message || 'La réponse du serveur n\'indique pas de succès.'
        });
      }
    } catch (err: any) {
      console.error("Échec de la suppression de la thèse :", err);
      setErrorModal({
        title: 'Erreur de suppression',
        briefDescription: `Erreur lors de la suppression : ${err.message || 'Erreur inconnue.'}`,
        detailedError: err.stack || 'Vérifiez la console pour plus de détails.'
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [confirmDeleteThesisId, token, loggedInUserId, allTheses, fetchMemberTheses]);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  if (authLoading || loadingTheses) {
    return (
      <div className={`flex justify-center items-center h-screen bg-gray-50 ${inter.className}`}>
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <span className="ml-3 text-lg text-gray-700">Chargement de vos thèses...</span>
      </div>
    );
  }

  if (!isAuthenticated || userRole !== 'member') {
     return (
      <ErrorModal
        title="Accès non autorisé"
        briefDescription="Seuls les membres peuvent gérer leurs thèses. Veuillez vous connecter avec un compte membre."
        detailedError="Unauthorized access attempt to member thesis management page."
        onClose={() => router.push('/connexion')}
      />
     );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8 ${inter.className}`}>
      <header className=" text-center">
        <div className="flex items-center space-x-4 bg-gradient-to-r from-blue-600 to-purple-700 text-white p-6 rounded-xl shadow-lg mb-8">
          <GraduationCap className="w-10 h-10 flex-shrink-0" />
          <h1 className="text-4xl font-extrabold tracking-tight">Mes Thèses</h1>
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
            <h2 className="text-2xl font-semibold text-gray-800">Liste de mes thèses / HDR</h2>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Rechercher une thèse..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>
              {/* Type Filter Dropdown */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as '' | 'HDR' | 'These')}
                className="block appearance-none w-auto bg-white border border-gray-300 text-gray-700 py-2 px-4 pr-8 rounded-md shadow-sm leading-tight focus:outline-none focus:bg-white focus:border-blue-500"
              >
                <option value="">Tous les types</option>
                <option value="HDR">HDR</option>
                <option value="These">Thèse</option>
              </select>
              {/* Removed Export CSV button */}
              <button
                onClick={handleAddNewThesis}
                className="inline-flex items-center px-5 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusCircle className="h-5 w-5 mr-2" />
                Ajouter une nouvelle Thèse
              </button>
            </div>
          </div>

          {displayedTheses.length === 0 && !loadingTheses && (
            <p className="text-center text-gray-500 py-8">Aucune thèse trouvée. Cliquez sur "Ajouter une nouvelle Thèse" pour en créer une.</p>
          )}

          {displayedTheses.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titre</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Auteur</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Année</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Établissement</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Encadrant</th>
                    {/* Removed Creator column as it's always the logged-in user */}
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {displayedTheses.map((thesis) => (
                    <tr key={thesis.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 max-w-xs truncate" title={thesis.title}>{thesis.title}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{thesis.author}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{thesis.year}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{thesis.type}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={thesis.etablissement}>{thesis.etablissement}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={thesis.encadrant}>{thesis.encadrant}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleEditThesis(thesis.id!)}
                            className="text-blue-600 hover:text-blue-900 p-2 rounded-full hover:bg-blue-100 transition-colors"
                            title="Modifier la thèse"
                          >
                            <Edit3 className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteThesisId(thesis.id!)}
                            className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-100 transition-colors"
                            title="Supprimer la thèse"
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
                  <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, filteredTheses.length)}</span> sur{' '}
                  <span className="font-medium">{filteredTheses.length}</span> thèses
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
            onClick={handleGoBackToList}
            className="absolute top-6 left-6 flex items-center text-gray-600 hover:text-gray-900 font-medium"
          >
            <ArrowLeft className="w-5 h-5 mr-2" /> Retour à la liste
          </button>
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center mt-4">
            {editingThesis ? 'Modifier la thèse' : 'Créer une nouvelle thèse'}
          </h2>

          <form onSubmit={(e) => { e.preventDefault(); handleSaveThesis(); }} className="space-y-6">
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
                placeholder="Titre de la thèse"
                required
              />
            </div>

            {/* Author */}
            <div>
              <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <UserIcon className="w-4 h-4 mr-1 text-gray-500" /> Auteur <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="author"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Nom de l'auteur"
                required
              />
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
                onChange={(e) => setYear(parseInt(e.target.value, 10) || '')}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Ex: 2023"
                min="1900"
                max={new Date().getFullYear() + 5}
                required
              />
            </div>

            {/* Summary */}
            <div>
              <label htmlFor="summary" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <ScrollText className="w-4 h-4 mr-1 text-gray-500" /> Résumé <span className="text-red-500">*</span>
              </label>
              <textarea
                id="summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={5}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Un bref résumé de la thèse..."
                required
              ></textarea>
            </div>

            {/* Type */}
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Hash className="w-4 h-4 mr-1 text-gray-500" /> Type <span className="text-red-500">*</span>
              </label>
              <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value as 'HDR' | 'These' | '')}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              >
                <option value="">Sélectionnez un type</option>
                <option value="HDR">HDR</option>
                <option value="These">Thèse</option>
              </select>
            </div>

            {/* Etablissement */}
            <div>
              <label htmlFor="etablissement" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Building2 className="w-4 h-4 mr-1 text-gray-500" /> Établissement <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="etablissement"
                value={etablissement}
                onChange={(e) => setEtablissement(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Nom de l'établissement"
                required
              />
            </div>

            {/* Specialite */}
            <div>
              <label htmlFor="specialite" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <FlaskConical className="w-4 h-4 mr-1 text-gray-500" /> Spécialité <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="specialite"
                value={specialite}
                onChange={(e) => setSpecialite(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Spécialité de la thèse"
                required
              />
            </div>

            {/* Encadrant */}
            <div>
              <label htmlFor="encadrant" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <UserIcon className="w-4 h-4 mr-1 text-gray-500" /> Encadrant <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="encadrant"
                value={encadrant}
                onChange={(e) => setEncadrant(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Nom de l'encadrant"
                required
              />
            </div>

            {/* Membres (Jury) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Users className="w-4 h-4 mr-1 text-gray-500" /> Membres du Jury
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {membres.map((membre, index) => (
                  <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {membre}
                    <button
                      type="button"
                      onClick={() => handleRemoveMembre(index)}
                      className="ml-2 text-blue-600 hover:text-blue-900 focus:outline-none"
                      title="Supprimer ce membre"
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
                  placeholder="Ajouter un membre du jury..."
                  value={newMembreInput}
                  onChange={(e) => setNewMembreInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddMembre();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddMembre}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-sm"
                >
                  Ajouter
                </button>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleGoBackToList}
                className="px-6 py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={isSubmitting}
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
      {confirmDeleteThesisId && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative p-8 bg-white w-full max-w-md m-auto flex-col flex rounded-lg shadow-lg">
            <div className="text-center">
              <Trash2 className="mx-auto h-12 w-12 text-red-500" />
              <h3 className="text-lg font-semibold text-gray-900 mt-4">Confirmer la suppression</h3>
              <p className="text-sm text-gray-500 mt-2">
                Êtes-vous sûr de vouloir supprimer cette thèse ? Cette action est irréversible.
              </p>
            </div>
            <div className="flex justify-center space-x-4 mt-6">
              <button
                onClick={() => setConfirmDeleteThesisId(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                disabled={isSubmitting}
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteThesis}
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

export default MemberThesisManagement;
