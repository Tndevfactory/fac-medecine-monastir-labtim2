// frontend/components/member/MemberMasterSIManagement.tsx
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

// API Services for Master SIs
import {
  getAllMasterSIs,
  createMasterSI as apiCreateMasterSI,
  updateMasterSI as apiUpdateMasterSI,
  deleteMasterSI,
  getMasterSIById
} from '@/services/masterSIApi';

// Import the MasterSI type
import { MasterSI } from '@/types/index';

// Import Toast and ErrorModal components
import Toast from '@/components/ui/Toast';
import ErrorModal from '@/components/ui/ErrorModal';

const inter = Inter({ subsets: ['latin'] });

const ITEMS_PER_PAGE = 10;

const MemberMasterSIManagement: React.FC = () => {
  const { token, userRole, isAuthenticated, isLoading: authLoading, userId: loggedInUserId, user: loggedInUserObject } = useAuth();
  const router = useRouter();

  // State for data fetching and management
  const [allMasterSIs, setAllMasterSIs] = useState<MasterSI[]>([]);
  const [loadingMasterSIs, setLoadingMasterSIs] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [confirmDeleteMasterSIId, setConfirmDeleteMasterSIId] = useState<string | null>(null);

  // State for form and editing
  const [currentView, setCurrentView] = useState<'list' | 'add' | 'edit'>('list');
  const [editingMasterSI, setEditingMasterSI] = useState<MasterSI | null>(null);

  // Form fields state
  const [title, setTitle] = useState<string>('');
  const [author, setAuthor] = useState<string>(''); // This will be pre-filled with creator's name
  const [year, setYear] = useState<number | ''>('');
  const [summary, setSummary] = useState<string>('');
  const [type, setType] = useState<'Master' | 'PFE' | ''>('');
  const [etablissement, setEtablissement] = useState<string>('');
  const [specialite, setSpecialite] = useState<string>('');
  const [encadrant, setEncadrant] = useState<string>('');
  const [membres, setMembres] = useState<string[]>([]);
  const [newMembreInput, setNewMembreInput] = useState<string>('');

  // Search and Pagination states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [filterType, setFilterType] = useState<'' | 'Master' | 'PFE'>('');
  
  // States for Toast and ErrorModal
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
  const [errorModal, setErrorModal] = useState<{ title: string; briefDescription: string; detailedError?: string } | null>(null);

  // Memoized filtered Master SIs for search and pagination
  const filteredMasterSIs = useMemo(() => {
    let filtered = allMasterSIs;

    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(masterSI =>
        masterSI.title.toLowerCase().includes(lowerCaseSearchTerm) ||
        masterSI.author.toLowerCase().includes(lowerCaseSearchTerm) ||
        masterSI.summary.toLowerCase().includes(lowerCaseSearchTerm) ||
        masterSI.etablissement.toLowerCase().includes(lowerCaseSearchTerm) ||
        masterSI.specialite.toLowerCase().includes(lowerCaseSearchTerm) ||
        masterSI.encadrant.toLowerCase().includes(lowerCaseSearchTerm) ||
        (masterSI.membres && masterSI.membres.some(membre => membre.toLowerCase().includes(lowerCaseSearchTerm)))
      );
    }

    if (filterType) {
      filtered = filtered.filter(masterSI => masterSI.type === filterType);
    }

    return filtered;
  }, [allMasterSIs, searchTerm, filterType]);

  const totalPages = useMemo(() => Math.ceil(filteredMasterSIs.length / ITEMS_PER_PAGE), [filteredMasterSIs]);

  const displayedMasterSIs = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredMasterSIs.slice(start, end);
  }, [filteredMasterSIs, currentPage]);


  // Fetch Master SIs for the logged-in member
  const fetchMemberMasterSIs = useCallback(async (showSuccessToast = true) => {
    if (!token || !loggedInUserId) {
      setErrorModal({
        title: 'Jeton ou ID utilisateur manquant',
        briefDescription: 'Veuillez vous reconnecter. Votre session a peut-être expiré.',
        detailedError: 'Token or loggedInUserId is null/undefined during fetchMemberMasterSIs.'
      });
      setLoadingMasterSIs(false);
      return;
    }
    setLoadingMasterSIs(true);
    setToast(null);

    try {
      // Pass loggedInUserId as the userId to getAllMasterSIs
      const response = await getAllMasterSIs(token, loggedInUserId); 
      
      if (response.success && Array.isArray(response.data)) {
        const fetchedMasterSIs = response.data.map(masterSI => ({
            ...masterSI,
            membres: (typeof masterSI.membres === 'string' ? JSON.parse(masterSI.membres) : masterSI.membres) || []
        }));
        setAllMasterSIs(fetchedMasterSIs);
        if (showSuccessToast) {
          setToast({ message: 'Vos projets Master/PFE ont été chargés avec succès.', type: 'success' });
        }
      } else {
        setToast({ message: response.message || 'Échec du chargement de vos projets Master/PFE.', type: 'error' });
        setAllMasterSIs([]);
      }
    } catch (err: any) {
      console.error("Échec de la récupération des projets Master/PFE du membre :", err);
      setErrorModal({
        title: 'Erreur de chargement',
        briefDescription: `Erreur lors de la récupération de vos projets Master/PFE: ${err.message || 'Erreur inconnue.'}`,
        detailedError: err.stack || 'Vérifiez la console pour plus de détails.'
      });
      setAllMasterSIs([]);
    } finally {
      setLoadingMasterSIs(false);
    }
  }, [token, loggedInUserId]);

  // Authentication check and initial fetch
  useEffect(() => {
    if (!authLoading && isAuthenticated && loggedInUserId && userRole === 'member') {
      fetchMemberMasterSIs(true);
    } else if (!authLoading && (!isAuthenticated || userRole !== 'member')) {
      router.replace('/dashboard');
    }
  }, [authLoading, isAuthenticated, userRole, loggedInUserId, router, fetchMemberMasterSIs]);

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
    setEditingMasterSI(null);
  }, []);

  const handleAddNewMasterSI = useCallback(() => {
    resetForm();
    setCurrentView('add');
    // Pre-populate author with logged-in user's name if available
    if (loggedInUserObject?.name) {
      setAuthor(loggedInUserObject.name);
    }
  }, [resetForm, loggedInUserObject]);

  const handleEditMasterSI = useCallback(async (masterSIId: string) => {
    if (!token) {
      setToast({ message: 'Jeton d\'authentification introuvable.', type: 'error' });
      return;
    }
    setLoadingMasterSIs(true);
    setToast(null);
    setErrorModal(null); // Clear previous error modals
    try {
      const response = await getMasterSIById(masterSIId, token);
      const masterSIToEdit = response.data;
      
      // Ensure userId is present on masterSIToEdit for client-side check
      if (masterSIToEdit && masterSIToEdit.userId === loggedInUserId) {
        setEditingMasterSI({
          ...masterSIToEdit,
          membres: (typeof masterSIToEdit.membres === 'string' ? JSON.parse(masterSIToEdit.membres) : masterSIToEdit.membres) || []
        });
        setTitle(masterSIToEdit.title);
        setAuthor(masterSIToEdit.author);
        setYear(masterSIToEdit.year);
        setSummary(masterSIToEdit.summary);
        setType(masterSIToEdit.type);
        setEtablissement(masterSIToEdit.etablissement);
        setSpecialite(masterSIToEdit.specialite);
        setEncadrant(masterSIToEdit.encadrant);
        setMembres((typeof masterSIToEdit.membres === 'string' ? JSON.parse(masterSIToEdit.membres) : masterSIToEdit.membres) || []);
        setCurrentView('edit');
        setToast({ message: 'Projet Master/PFE chargé pour modification.', type: 'info' });
      } else {
        setErrorModal({
          title: 'Accès non autorisé',
          briefDescription: 'Ce projet Master/PFE ne vous appartient pas ou n\'existe pas.',
          detailedError: 'Attempted to edit a Master/PFE project not owned by the user or non-existent.'
        });
        setToast({ message: 'Projet Master/PFE non trouvé ou accès non autorisé.', type: 'error' });
      }
    } catch (err: any) {
      console.error("Échec de la récupération du projet Master/PFE pour modification :", err);
      setErrorModal({
        title: 'Erreur de chargement',
        briefDescription: `Erreur lors de la récupération du projet Master/PFE: ${err.message || 'Erreur inconnue.'}`,
        detailedError: err.stack || 'Vérifiez la console pour plus de détails.'
      });
    } finally {
      setLoadingMasterSIs(false);
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


  const handleSaveMasterSI = async () => {
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

    const masterSIData = {
      title,
      author,
      year: Number(year),
      summary,
      type: type as ('Master' | 'PFE'),
      etablissement,
      specialite,
      encadrant,
      membres,
      userId: loggedInUserId, // Explicitly set userId for new projects
    };

    try {
      let response;
      if (currentView === 'add') {
        response = await apiCreateMasterSI(masterSIData, token);
      } else if (currentView === 'edit' && editingMasterSI) {
        if (editingMasterSI.userId !== loggedInUserId) {
          throw new Error("Unauthorized: Cannot modify another user's Master/PFE project.");
        }
        response = await apiUpdateMasterSI(editingMasterSI.id, masterSIData, token);
      } else {
        throw new Error("Opération non valide.");
      }

      if (response && response.success) {
        resetForm();
        setCurrentView('list');
        await fetchMemberMasterSIs(false);
        setToast({ message: `Projet Master/PFE ${currentView === 'add' ? 'ajouté' : 'modifié'} avec succès !`, type: 'success' });
      } else {
        setErrorModal({
          title: 'Échec de l\'opération',
          briefDescription: response?.message || 'Une erreur est survenue lors de l\'opération sur le projet Master/PFE.',
          detailedError: response?.message || 'La réponse du serveur n\'indique pas de succès.'
        });
      }
    } catch (err: any) {
      console.error("Échec de l'enregistrement du projet Master/PFE :", err);
      setErrorModal({
        title: 'Erreur lors de l\'enregistrement',
        briefDescription: `Erreur lors de l'opération : ${err.message || 'Erreur inconnue.'}`,
        detailedError: err.stack || 'Vérifiez la console pour plus de détails.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMasterSI = useCallback(async () => {
    if (!confirmDeleteMasterSIId || !token || !loggedInUserId) {
      setToast({ message: 'ID de projet Master/PFE ou jeton manquant.', type: 'error' });
      return;
    }
    setIsSubmitting(true);
    setToast(null);
    setErrorModal(null);
    try {
      const masterSIToDelete = allMasterSIs.find(masterSI => masterSI.id === confirmDeleteMasterSIId);
      if (!masterSIToDelete || masterSIToDelete.userId !== loggedInUserId) {
        throw new Error("Unauthorized: Cannot delete another user's Master/PFE project.");
      }

      const response = await deleteMasterSI(confirmDeleteMasterSIId, token);
      if (response.success) {
        setConfirmDeleteMasterSIId(null);
        await fetchMemberMasterSIs(false);
        setToast({ message: 'Projet Master/PFE supprimé avec succès !', type: 'success' });
      } else {
        setErrorModal({
          title: 'Échec de la suppression',
          briefDescription: response.message || 'Échec de la suppression du projet Master/PFE.',
          detailedError: response.message || 'La réponse du serveur n\'indique pas de succès.'
        });
      }
    } catch (err: any) {
      console.error("Échec de la suppression du projet Master/PFE :", err);
      setErrorModal({
        title: 'Erreur de suppression',
        briefDescription: `Erreur lors de la suppression : ${err.message || 'Erreur inconnue.'}`,
        detailedError: err.stack || 'Vérifiez la console pour plus de détails.'
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [confirmDeleteMasterSIId, token, loggedInUserId, allMasterSIs, fetchMemberMasterSIs]);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  if (authLoading || loadingMasterSIs) {
    return (
      <div className={`flex justify-center items-center h-screen bg-gray-50 ${inter.className}`}>
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <span className="ml-3 text-lg text-gray-700">Chargement de vos projets Master/PFE...</span>
      </div>
    );
  }

  if (!isAuthenticated || userRole !== 'member') {
     return (
      <ErrorModal
        title="Accès non autorisé"
        briefDescription="Seuls les membres peuvent gérer leurs projets Master/PFE. Veuillez vous connecter avec un compte membre."
        detailedError="Unauthorized access attempt to member Master/PFE management page."
        onClose={() => router.push('/connexion')}
      />
     );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8 ${inter.className}`}>
      <header className=" text-center">
        <div className="flex items-center space-x-4 bg-gradient-to-r from-blue-600 to-purple-700 text-white p-6 rounded-xl shadow-lg mb-8">
          <GraduationCap className="w-10 h-10 flex-shrink-0" />
          <h1 className="text-4xl font-extrabold tracking-tight">Mes Masters / PFEs</h1>
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
            <h2 className="text-2xl font-semibold text-gray-800">Liste de mes projets Master/PFE</h2>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Rechercher un projet..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>
              {/* Type Filter Dropdown */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as '' | 'Master' | 'PFE')}
                className="block appearance-none w-auto bg-white border border-gray-300 text-gray-700 py-2 px-4 pr-8 rounded-md shadow-sm leading-tight focus:outline-none focus:bg-white focus:border-blue-500"
              >
                <option value="">Tous les types</option>
                <option value="Master">Master</option>
                <option value="PFE">PFE</option>
              </select>
              {/* Removed Export CSV button */}
              <button
                onClick={handleAddNewMasterSI}
                className="inline-flex items-center px-5 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusCircle className="h-5 w-5 mr-2" />
                Ajouter un nouveau projet
              </button>
            </div>
          </div>

          {displayedMasterSIs.length === 0 && !loadingMasterSIs && (
            <p className="text-center text-gray-500 py-8">Aucun projet Master/PFE trouvé. Cliquez sur "Ajouter un nouveau projet" pour en créer un.</p>
          )}

          {displayedMasterSIs.length > 0 && (
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
                  {displayedMasterSIs.map((masterSI) => (
                    <tr key={masterSI.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 max-w-xs truncate" title={masterSI.title}>{masterSI.title}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{masterSI.author}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{masterSI.year}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{masterSI.type}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={masterSI.etablissement}>{masterSI.etablissement}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={masterSI.encadrant}>{masterSI.encadrant}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleEditMasterSI(masterSI.id!)}
                            className="text-blue-600 hover:text-blue-900 p-2 rounded-full hover:bg-blue-100 transition-colors"
                            title="Modifier le projet"
                          >
                            <Edit3 className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteMasterSIId(masterSI.id!)}
                            className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-100 transition-colors"
                            title="Supprimer le projet"
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
                  <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, filteredMasterSIs.length)}</span> sur{' '}
                  <span className="font-medium">{filteredMasterSIs.length}</span> projets
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
            {editingMasterSI ? 'Modifier le projet Master/PFE' : 'Créer un nouveau projet Master/PFE'}
          </h2>

          <form onSubmit={(e) => { e.preventDefault(); handleSaveMasterSI(); }} className="space-y-6">
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
                placeholder="Titre du projet"
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
                placeholder="Ex: 2024"
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
                placeholder="Un bref résumé du projet..."
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
                onChange={(e) => setType(e.target.value as 'Master' | 'PFE' | '')}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              >
                <option value="">Sélectionnez un type</option>
                <option value="Master">Master</option>
                <option value="PFE">PFE</option>
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
                placeholder="Spécialité du projet"
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
      {confirmDeleteMasterSIId && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative p-8 bg-white w-full max-w-md m-auto flex-col flex rounded-lg shadow-lg">
            <div className="text-center">
              <Trash2 className="mx-auto h-12 w-12 text-red-500" />
              <h3 className="text-lg font-semibold text-gray-900 mt-4">Confirmer la suppression</h3>
              <p className="text-sm text-gray-500 mt-2">
                Êtes-vous sûr de vouloir supprimer ce projet Master/PFE ? Cette action est irréversible.
              </p>
            </div>
            <div className="flex justify-center space-x-4 mt-6">
              <button
                onClick={() => setConfirmDeleteMasterSIId(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                disabled={isSubmitting}
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteMasterSI}
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

export default MemberMasterSIManagement;
