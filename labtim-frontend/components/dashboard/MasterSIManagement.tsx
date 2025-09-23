// components/dashboard/MasterSIManagement.tsx
'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

// Lucide Icons for consistent UI
import {
  Book, PlusCircle, Trash2, Edit3, Loader2, Info, ArrowLeft, Search,
  Calendar as CalendarIcon, User as UserIcon, ScrollText, Hash, Link , GraduationCap as LinkIcon,
  Globe, LayoutGrid, Layers, FileText, XCircle, Building2, FlaskConical, Users , GraduationCap, Download // Added Download icon for export
} from 'lucide-react';

// Fonts
import { Inter, Playfair_Display } from 'next/font/google';

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
const playfair = Playfair_Display({ subsets: ['latin'], weight: ['400', '700'] });

const ITEMS_PER_PAGE = 10;

// Helper function to escape values for CSV
const escapeCsvValue = (value: any): string => {
  if (value === null || value === undefined) {
    return '';
  }
  let stringValue = String(value);

  // Handle arrays by joining them (e.g., for membres)
  if (Array.isArray(value)) {
    stringValue = value.map(item => String(item).replace(/"/g, '""')).join('; '); // Use semicolon to differentiate from common CSV commas, escape inner quotes
  } else {
    // Escape existing double quotes by doubling them
    stringValue = stringValue.replace(/"/g, '""');
  }

  // If the value contains a comma, double quote, or newline, enclose it in double quotes
  if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes(';')) { // Check for semicolon too if used as internal separator
    return `"${stringValue}"`;
  }
  return stringValue;
};

// Define exportable fields for Master SIs
const exportableMasterSIFields = [
  { key: 'id', label: 'ID' },
  { key: 'title', label: 'Titre' },
  { key: 'author', label: 'Auteur' },
  { key: 'year', label: 'Année' },
  { key: 'summary', label: 'Résumé' },
  { key: 'type', label: 'Type' },
  { key: 'etablissement', label: 'Établissement' },
  { key: 'specialite', label: 'Spécialité' },
  { key: 'encadrant', label: 'Encadrant' },
  { key: 'membres', label: 'Membres du Jury' },
  { key: 'createdAt', label: 'Date de Création' },
  { key: 'updatedAt', label: 'Date de Dernière Mise à Jour' },
];


const MasterSIManagement: React.FC = () => {
  const { token, userRole, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // State for data fetching and management
  const [allMasterSIs, setAllMasterSIs] = useState<MasterSI[]>([]); // Stores all Master SIs fetched
  const [loadingMasterSIs, setLoadingMasterSIs] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null); // Existing error state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [confirmDeleteMasterSIId, setConfirmDeleteMasterSIId] = useState<string | null>(null);

  // State for form and editing
  const [currentView, setCurrentView] = useState<'list' | 'add' | 'edit'>('list');
  const [editingMasterSI, setEditingMasterSI] = useState<MasterSI | null>(null);

  // Form fields state
  const [title, setTitle] = useState<string>('');
  const [author, setAuthor] = useState<string>('');
  const [year, setYear] = useState<number | ''>('');
  const [summary, setSummary] = useState<string>('');
  const [type, setType] = useState<'Master' | 'PFE' | ''>(''); // 'Master', 'PFE', or empty string for initial state
  const [etablissement, setEtablissement] = useState<string>('');
  const [specialite, setSpecialite] = useState<string>('');
  const [encadrant, setEncadrant] = useState<string>('');
  const [membres, setMembres] = useState<string[]>([]); // Array for jury members
  const [newMembreInput, setNewMembreInput] = useState<string>(''); // For adding new membre

  // Search and Pagination states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [filterType, setFilterType] = useState<'' | 'Master' | 'PFE'>(''); // New state for type filter
  
  // Memoized filtered Master SIs for search and pagination
  const filteredMasterSIs = useMemo(() => {
    let filtered = allMasterSIs;

    // Apply text search filter
    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(masterSI =>
        masterSI.title.toLowerCase().includes(lowerCaseSearchTerm) ||
        masterSI.author.toLowerCase().includes(lowerCaseSearchTerm) ||
        masterSI.summary.toLowerCase().includes(lowerCaseSearchTerm) ||
        masterSI.etablissement.toLowerCase().includes(lowerCaseSearchTerm) ||
        masterSI.specialite.toLowerCase().includes(lowerCaseSearchTerm) ||
        masterSI.encadrant.toLowerCase().includes(lowerCaseSearchTerm) ||
        masterSI.membres.some(membre => membre.toLowerCase().includes(lowerCaseSearchTerm))
      );
    }

    // Apply type filter
    if (filterType) {
      filtered = filtered.filter(masterSI => masterSI.type === filterType);
    }

    return filtered;
  }, [allMasterSIs, searchTerm, filterType]); // Add filterType to dependencies

  // Total pages based on filtered Master SIs
  const totalPages = useMemo(() => Math.ceil(filteredMasterSIs.length / ITEMS_PER_PAGE), [filteredMasterSIs]);

  // Master SIs to display on current page
  const displayedMasterSIs = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredMasterSIs.slice(start, end);
  }, [filteredMasterSIs, currentPage]);

  // --- New states for Export CSV functionality ---
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedExportFields, setSelectedExportFields] = useState<string[]>(
    exportableMasterSIFields.map(field => field.key)
  );
  const [exportingCsv, setExportingCsv] = useState(false);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null); // Existing success message
  const [exportErrorMessage, setExportErrorMessage] = useState<string | null>(null); // Existing error message
  // --- End new states ---

  // States for Toast and ErrorModal
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
  const [errorModal, setErrorModal] = useState<{ brief: string; detailed?: string; visible: boolean } | null>(null);


  // Fetch all Master SIs - now accepts a flag to show success toast
  const fetchAllMasterSIs = useCallback(async (showSuccessToast = true) => {
    if (!token) {
      setErrorModal({
        brief: 'Jeton d\'authentification introuvable.',
        detailed: 'Veuillez vous reconnecter. Votre session a peut-être expiré.',
        visible: true
      });
      setLoadingMasterSIs(false);
      return;
    }
    setLoadingMasterSIs(true);
    setError(null); // Clear existing error state

    // ONLY clear toast here if we are about to show a new success toast from this fetch.
    // Otherwise, assume the calling function (e.g., handleSaveMasterSI) has set its own toast.
    if (showSuccessToast) {
      setToast(null); // Clear previous toasts only if we are about to show a new success toast
    }

    try {
      const response = await getAllMasterSIs(); // Keep original API call
      
      if (response.success && Array.isArray(response.data)) {
        const fetchedMasterSIs = response.data.map(masterSI => ({
          ...masterSI,
          membres: typeof masterSI.membres === 'string' ? JSON.parse(masterSI.membres) : masterSI.membres
        }));
        setAllMasterSIs(fetchedMasterSIs); // Store all fetched Master SIs
        if (showSuccessToast) { // Only show success toast if explicitly requested
          setToast({ message: 'Projets Master/PFE chargés avec succès.', type: 'success' });
        }
      } else {
        // This is an error, so it should always set an error toast and clear any existing success toast
        setToast({ message: response.message || 'Échec du chargement des projets Master/PFE ou format de données invalide.', type: 'error' });
        setAllMasterSIs([]); // Ensure state is cleared on error
      }
    } catch (err: any) {
      // This is an error, so it should always set an error toast and clear any existing success toast
      setToast({ message: `Erreur lors de la récupération des projets Master/PFE : ${err.message || 'Veuillez réessayer plus tard.'}`, type: 'error' });
      setAllMasterSIs([]); // Ensure state is cleared on error
    } finally {
      setLoadingMasterSIs(false);
    }
  }, [token]);

  // Authentication check and initial fetch - now calls fetchAllMasterSIs with true for toast
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || userRole !== 'admin') {
        router.push('/connexion');
        return;
      }
      if (isAuthenticated && token && userRole === 'admin') {
        fetchAllMasterSIs(true); // Show toast on initial load
      }
    }
  }, [authLoading, isAuthenticated, userRole, token, router, fetchAllMasterSIs]);

  // Effect to reset page to 1 when search term or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType]); // Reset page when search or filter changes

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
  }, [resetForm]);

  const handleEditMasterSI = useCallback(async (masterSIId: string) => {
    if (!token) {
      setToast({ message: 'Jeton d\'authentification introuvable.', type: 'error' });
      return;
    }
    setLoadingMasterSIs(true);
    setError(null); // Clear previous errors
    setToast(null); // Clear existing toast

    try {
      const response = await getMasterSIById(masterSIId, token); // Keep original API call

      if (!response.success || !response.data) {
        setToast({ message: response.message || 'Master SI introuvable pour édition.', type: 'error' });
        setLoadingMasterSIs(false);
        return;
      }
      
      const masterSIToEdit = response.data; // This should now be the raw MasterSI object
      setEditingMasterSI(masterSIToEdit);
      setTitle(masterSIToEdit.title || '');
      setAuthor(masterSIToEdit.author || '');
      setYear(masterSIToEdit.year || '');
      setSummary(masterSIToEdit.summary || '');
      setType(masterSIToEdit.type || ''); // Set type for select dropdown
      setEtablissement(masterSIToEdit.etablissement || '');
      setSpecialite(masterSIToEdit.specialite || '');
      setEncadrant(masterSIToEdit.encadrant || '');
      
      // Ensure membres are correctly parsed and set as an array
      const parsedMembres = Array.isArray(masterSIToEdit.membres) 
        ? masterSIToEdit.membres 
        : (typeof masterSIToEdit.membres === 'string' && (masterSIToEdit.membres as string).startsWith('[')) 
            ? JSON.parse(masterSIToEdit.membres as string) 
            : [];
      setMembres(parsedMembres);

      setCurrentView('edit');
      setToast({ message: 'Projet Master/PFE chargé pour modification.', type: 'info' });
    } catch (err: any) {
      console.error("Échec de la récupération du Master SI pour édition :", err);
      setToast({ message: `Erreur lors du chargement du projet Master/PFE pour édition : ${err.message || 'Veuillez réessayer.'}`, type: 'error' });
    } finally {
      setLoadingMasterSIs(false);
    }
  }, [token]);

  const handleGoBackToList = useCallback(() => {
    setCurrentView('list');
    resetForm();
    setError(null); // Clear existing error state
    setToast(null); // Clear toast on navigation
    setErrorModal(null); // Clear error modal on navigation
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
    if (!token) {
      setToast({ message: 'Jeton d\'authentification introuvable. Veuillez vous connecter.', type: 'error' });
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
    setError(null); // Clear existing error state
    setToast(null); // Clear existing toast

    const masterSIData = {
      title,
      author,
      year: Number(year),
      summary,
      type: type as ('Master' | 'PFE'), // Cast to ensure it matches the type
      etablissement,
      specialite,
      encadrant,
      membres, // This will be an array
    };

    try {
      if (editingMasterSI?.id) {
        await apiUpdateMasterSI(editingMasterSI.id, masterSIData, token); // Keep original API call
        setToast({ message: 'Modifié avec succés !', type: 'success' }); // Specific success message for edit
      } else {
        await apiCreateMasterSI(masterSIData, token); // Keep original API call
        setToast({ message: 'Projet Master/PFE créé avec succès !', type: 'success' }); // Specific success message for create
      }
      resetForm();
      setCurrentView('list');
      await fetchAllMasterSIs(false); // IMPORTANT: Suppress "chargées avec succés" toast after save/create
    } catch (err: any) {
      console.error("Échec de l'enregistrement du Master SI :", err);
      setToast({ message: `Échec de l'enregistrement du projet Master/PFE : ${err.message || 'Veuillez réessayer.'}`, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMasterSI = useCallback(async () => {
    if (!confirmDeleteMasterSIId || !token) {
      setToast({ message: 'ID de projet Master/PFE ou jeton manquant.', type: 'error' });
      return;
    }
    setIsSubmitting(true);
    setError(null); // Clear existing error state
    setToast(null); // Clear existing toast
    try {
      await deleteMasterSI(confirmDeleteMasterSIId, token); // Keep original API call
      setToast({ message: 'Projet Master/PFE supprimé avec succès !', type: 'success' });
      setConfirmDeleteMasterSIId(null);
      await fetchAllMasterSIs(false); // IMPORTANT: Suppress "chargées avec succés" toast after delete
    } catch (err: any) {
      console.error("Échec de la suppression du Master SI :", err);
      setToast({ message: `Échec de la suppression du projet Master/PFE : ${err.message || 'Veuillez réessayer.'}`, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  }, [confirmDeleteMasterSIId, token, fetchAllMasterSIs]);


  // --- CSV Export Logic ---
  const handleExportCsv = useCallback(() => {
    if (!filteredMasterSIs.length) {
      setToast({ message: 'Aucune donnée à exporter.', type: 'warning' });
      return;
    }

    setExportingCsv(true);
    setToast(null); // Clear existing toast
    setErrorModal(null); // Clear existing error modal

    try {
      const selectedFieldsData = exportableMasterSIFields.filter(field =>
        selectedExportFields.includes(field.key)
      );

      const headers = selectedFieldsData.map(field => field.label).join(',');
      const rows = filteredMasterSIs.map(masterSI => {
        const rowData = selectedFieldsData.map(field => {
          // Special handling for 'membres' array
          if (field.key === 'membres') {
            return escapeCsvValue(Array.isArray((masterSI as any)[field.key]) ? (masterSI as any)[field.key].join(', ') : (masterSI as any)[field.key]);
          }
          return escapeCsvValue((masterSI as any)[field.key]);
        });
        return rowData.join(',');
      });

      const csvContent = [headers, ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'master_si_export.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url); // Clean up

      setToast({ message: 'Données exportées avec succès !', type: 'success' });
      setShowExportModal(false); // Close modal after successful export
    } catch (err: any) {
      console.error("Error exporting CSV:", err);
      setToast({ message: `Échec de l'exportation : ${err.message || 'Veuillez réessayer.'}`, type: 'error' });
    } finally {
      setExportingCsv(false);
      // Removed setTimeout for clearing messages as Toast handles its own duration
    }
  }, [filteredMasterSIs, selectedExportFields]);

  const handleToggleFieldSelection = (key: string) => {
    setSelectedExportFields(prev =>
      prev.includes(key) ? prev.filter(field => field !== key) : [...prev, key]
    );
  };
  // --- End CSV Export Logic ---


  if (authLoading || loadingMasterSIs) {
    return (
      <div className={`flex justify-center items-center h-screen bg-gray-50 ${inter.className}`}>
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <span className="ml-3 text-lg text-gray-700">Chargement des projets Master/PFE...</span>
      </div>
    );
  }

  // Removed old error display block, now handled by Toast/ErrorModal
  // if (error) {
  //   return (
  //     <div className={`flex min-h-[calc(100vh-80px)] items-center justify-center bg-red-100 text-red-700 p-8 ${inter.className}`}>
  //       <p className="text-lg">Erreur: {error}</p>
  //     </div>
  //   );
  // }

  // This block is for unauthenticated/unauthorized access, should ideally be handled by ErrorModal
  if (!isAuthenticated || userRole !== 'admin') {
     // Replaced direct render with ErrorModal for unauthorized access
     return (
      <ErrorModal
        briefDescription="Accès non autorisé"
        detailedError="Seuls les administrateurs peuvent gérer les projets Master/PFE. Veuillez vous connecter avec un compte administrateur."
        onClose={() => router.push('/connexion')} // Redirect to login on close
      />
     );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8  ${inter.className}`}>
      <header className="text-center">
      <div className="flex items-center space-x-4 bg-gradient-to-r from-blue-600 to-purple-700 text-white p-6 rounded-xl shadow-lg mb-8">
          <GraduationCap className="w-10 h-10 flex-shrink-0" />
          <h1 className="text-4xl font-extrabold tracking-tight"> Gestion des Masters / PFE </h1>
        <p className="text-xl text-white  ">Gérez, créez et modifiez les masters et projets de fin d'études</p>
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
      {errorModal && errorModal.visible && (
        <ErrorModal
          briefDescription={errorModal.brief}
          detailedError={errorModal.detailed}
          onClose={() => setErrorModal(null)}
        />
      )}

      {/* Removed old error/success message divs */}
      {/* {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative mb-6" role="alert">
          <strong className="font-bold">Erreur !</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}
      {exportSuccessMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{exportSuccessMessage}</span>
        </div>
      )}
      {exportErrorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{exportErrorMessage}</span>
        </div>
      )} */}


      {currentView === 'list' && (
        <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">Tous les projets Master/PFE</h2>
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
              <button
                onClick={() => setShowExportModal(true)} // Open export modal
                className="inline-flex items-center px-5 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <Download className="h-5 w-5 mr-2" />
                Exporter CSV
              </button>
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
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titre</th><th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Auteur</th><th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Année</th><th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th><th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Établissement</th><th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Encadrant</th><th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Créateur</th><th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{masterSI.creatorName || 'N/A'}</td>
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

            {error && (
              <div className="text-red-600 text-sm mt-2 flex items-center">
                <Info className="w-4 h-4 mr-2" /> {error}
              </div>
            )}

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

      {/* Export CSV Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Exporter les données des projets Master/PFE</h3>
            <p className="text-sm text-gray-500 mb-4">Sélectionnez les champs que vous souhaitez inclure dans le fichier CSV :</p>
            <div className="grid grid-cols-2 gap-3 mb-6 max-h-60 overflow-y-auto pr-2">
              {exportableMasterSIFields.map((field) => (
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
                  setSelectedExportFields(exportableMasterSIFields.map(field => field.key)); // Reset selection on close
                  setExportErrorMessage(null);
                  setExportSuccessMessage(null);
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
            {exportErrorMessage && (
              <p className="text-red-500 text-xs mt-2 text-right">{exportErrorMessage}</p>
            )}
          </div>
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

export default MasterSIManagement;
