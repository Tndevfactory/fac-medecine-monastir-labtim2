// components/dashboard/ThesisManagement.tsx
'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

// Lucide Icons for consistent UI
import {
  GraduationCap, PlusCircle, Trash2, Edit3, Loader2, Info, ArrowLeft, Search,
  Calendar as CalendarIcon, User as UserIcon, ScrollText, Hash, Link as LinkIcon,
  Book, Globe, LayoutGrid, Layers, FileText, XCircle, Building2, FlaskConical, Users, Download // Added Download icon for export
} from 'lucide-react';

// Fonts
import { Inter, Playfair_Display } from 'next/font/google';

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

// Define exportable fields for theses
const exportableThesisFields = [
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


const ThesisManagement: React.FC = () => {
  const { token, userRole, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // State for data fetching and management
  const [allTheses, setAllTheses] = useState<Thesis[]>([]); // Stores all theses fetched
  const [loadingTheses, setLoadingTheses] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null); // Existing error state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [confirmDeleteThesisId, setConfirmDeleteThesisId] = useState<string | null>(null);

  // State for form and editing
  const [currentView, setCurrentView] = useState<'list' | 'add' | 'edit'>('list');
  const [editingThesis, setEditingThesis] = useState<Thesis | null>(null);

  // Form fields state
  const [title, setTitle] = useState<string>('');
  const [author, setAuthor] = useState<string>('');
  const [year, setYear] = useState<number | ''>('');
  const [summary, setSummary] = useState<string>('');
  const [type, setType] = useState<'HDR' | 'These' | ''>(''); // 'HDR', 'These', or empty string for initial state
  const [etablissement, setEtablissement] = useState<string>('');
  const [specialite, setSpecialite] = useState<string>('');
  const [encadrant, setEncadrant] = useState<string>('');
  const [membres, setMembres] = useState<string[]>([]); // Array for jury members
  const [newMembreInput, setNewMembreInput] = useState<string>(''); // For adding new membre

  // Search and Pagination states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [filterType, setFilterType] = useState<'' | 'HDR' | 'These'>(''); // New state for type filter
  
  // Memoized filtered theses for search and pagination
  const filteredTheses = useMemo(() => {
    let filtered = allTheses;

    // Apply text search filter
    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(thesis =>
        thesis.title.toLowerCase().includes(lowerCaseSearchTerm) ||
        thesis.author.toLowerCase().includes(lowerCaseSearchTerm) ||
        thesis.summary.toLowerCase().includes(lowerCaseSearchTerm) ||
        thesis.etablissement.toLowerCase().includes(lowerCaseSearchTerm) ||
        thesis.specialite.toLowerCase().includes(lowerCaseSearchTerm) ||
        thesis.encadrant.toLowerCase().includes(lowerCaseSearchTerm) ||
        thesis.membres.some(membre => membre.toLowerCase().includes(lowerCaseSearchTerm))
      );
    }

    // Apply type filter
    if (filterType) {
      filtered = filtered.filter(thesis => thesis.type === filterType);
    }

    return filtered;
  }, [allTheses, searchTerm, filterType]); // Add filterType to dependencies

  // Total pages based on filtered theses
  const totalPages = useMemo(() => Math.ceil(filteredTheses.length / ITEMS_PER_PAGE), [filteredTheses]);

  // Theses to display on current page
  const displayedTheses = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredTheses.slice(start, end);
  }, [filteredTheses, currentPage]);

  // --- New states for Export CSV functionality ---
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedExportFields, setSelectedExportFields] = useState<string[]>(
    exportableThesisFields.map(field => field.key)
  );
  const [exportingCsv, setExportingCsv] = useState(false);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null); // Existing success message
  const [exportErrorMessage, setExportErrorMessage] = useState<string | null>(null); // Existing error message
  // --- End new states ---

  // States for Toast and ErrorModal
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
  const [errorModal, setErrorModal] = useState<{ brief: string; detailed?: string; visible: boolean } | null>(null);


  // Fetch all theses - now accepts a flag to show success toast
  const fetchAllTheses = useCallback(async (showSuccessToast = true) => {
    if (!token) {
      setErrorModal({
        brief: 'Jeton d\'authentification introuvable.',
        detailed: 'Veuillez vous reconnecter. Votre session a peut-être expiré.',
        visible: true
      });
      setLoadingTheses(false);
      return;
    }
    setLoadingTheses(true);
    setError(null); // Clear existing error state

    // ONLY clear toast here if we are about to show a new success toast from this fetch.
    // Otherwise, assume the calling function (e.g., handleSaveThesis) has set its own toast.
    if (showSuccessToast) {
      setToast(null); // Clear previous toasts only if we are about to show a new success toast
    }

    try {
      const response = await getAllTheses(); // Keep original API call
      
      if (response.success && Array.isArray(response.data)) {
        const fetchedTheses = response.data.map(thesis => ({
          ...thesis,
          membres: typeof thesis.membres === 'string' ? JSON.parse(thesis.membres) : thesis.membres
        }));
        setAllTheses(fetchedTheses); // Store all fetched theses
        if (showSuccessToast) { // Only show success toast if explicitly requested
          setToast({ message: 'Thèses chargées avec succès.', type: 'success' });
        }
      } else {
        // This is an error, so it should always set an error toast and clear any existing success toast
        setToast({ message: response.message || 'Échec du chargement des thèses ou format de données invalide.', type: 'error' });
        setAllTheses([]); // Ensure state is cleared on error
      }
    } catch (err: any) {
      // This is an error, so it should always set an error toast and clear any existing success toast
      setToast({ message: `Erreur lors de la récupération des thèses : ${err.message || 'Veuillez réessayer plus tard.'}`, type: 'error' });
      setAllTheses([]); // Ensure state is cleared on error
    } finally {
      setLoadingTheses(false);
    }
  }, [token]);

  // Authentication check and initial fetch - now calls fetchAllTheses with true for toast
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || userRole !== 'admin') {
        router.push('/connexion');
        return;
      }
      if (isAuthenticated && token && userRole === 'admin') {
        fetchAllTheses(true); // Show toast on initial load
      }
    }
  }, [authLoading, isAuthenticated, userRole, token, router, fetchAllTheses]);

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
    setEditingThesis(null);
  }, []);

  const handleAddNewThesis = useCallback(() => {
    resetForm();
    setCurrentView('add');
  }, [resetForm]);

  const handleEditThesis = useCallback(async (thesisId: string) => {
    if (!token) {
      setToast({ message: 'Jeton d\'authentification introuvable.', type: 'error' });
      return;
    }
    setLoadingTheses(true);
    setError(null); // Clear previous errors
    setToast(null); // Clear existing toast

    try {
      const response = await getThesisById(thesisId, token); // Keep original API call
      const thesisToEdit = response.data;

      if (!thesisToEdit) {
        setToast({ message: 'Thèse introuvable pour édition.', type: 'error' });
        setLoadingTheses(false);
        return;
      }
      setEditingThesis(thesisToEdit);
      setTitle(thesisToEdit.title);
      setAuthor(thesisToEdit.author);
      setYear(thesisToEdit.year);
      setSummary(thesisToEdit.summary);
      setType(thesisToEdit.type); // Set type for select dropdown
      setEtablissement(thesisToEdit.etablissement);
      setSpecialite(thesisToEdit.specialite);
      setEncadrant(thesisToEdit.encadrant);
      setMembres(Array.isArray(thesisToEdit.membres) ? thesisToEdit.membres : (typeof thesisToEdit.membres === 'string' ? JSON.parse(thesisToEdit.membres) : []));
      setCurrentView('edit');
      setToast({ message: 'Thèse chargée pour modification.', type: 'info' });
    } catch (err: any) {
      console.error("Échec de la récupération de la thèse pour édition :", err);
      setToast({ message: `Erreur lors du chargement de la thèse pour édition : ${err.message || 'Veuillez réessayer.'}`, type: 'error' });
    } finally {
      setLoadingTheses(false);
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


  const handleSaveThesis = async () => {
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

    const thesisData = {
      title,
      author,
      year: Number(year),
      summary,
      type: type as ('HDR' | 'These'), // Cast to ensure it matches the type
      etablissement,
      specialite,
      encadrant,
      membres, // This will be an array
    };

    try {
      if (editingThesis?.id) {
        await apiUpdateThesis(editingThesis.id, thesisData, token); // Keep original API call
        setToast({ message: 'Modifié avec succés !', type: 'success' }); // Specific success message for edit
      } else {
        await apiCreateThesis(thesisData, token); // Keep original API call
        setToast({ message: 'Thèse créée avec succès !', type: 'success' }); // Specific success message for create
      }
      resetForm();
      setCurrentView('list');
      await fetchAllTheses(false); // IMPORTANT: Suppress "chargées avec succés" toast after save/create
    } catch (err: any) {
      console.error("Échec de l'enregistrement de la thèse :", err);
      setToast({ message: `Échec de l'enregistrement de la thèse : ${err.message || 'Veuillez réessayer.'}`, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteThesis = useCallback(async () => {
    if (!confirmDeleteThesisId || !token) {
      setToast({ message: 'ID de thèse ou jeton manquant.', type: 'error' });
      return;
    }
    setIsSubmitting(true);
    setError(null); // Clear existing error state
    setToast(null); // Clear existing toast
    try {
      await deleteThesis(confirmDeleteThesisId, token); // Keep original API call
      setToast({ message: 'Thèse supprimée avec succès !', type: 'success' });
      setConfirmDeleteThesisId(null);
      await fetchAllTheses(false); // IMPORTANT: Suppress "chargées avec succés" toast after delete
    } catch (err: any) {
      console.error("Échec de la suppression de la thèse :", err);
      setToast({ message: `Échec de la suppression de la thèse : ${err.message || 'Veuillez réessayer.'}`, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  }, [confirmDeleteThesisId, token, fetchAllTheses]);


  // --- CSV Export Logic ---
  const handleExportCsv = useCallback(() => {
    if (!filteredTheses.length) {
      setToast({ message: 'Aucune donnée à exporter.', type: 'warning' });
      return;
    }

    setExportingCsv(true);
    setToast(null); // Clear existing toast
    setErrorModal(null); // Clear existing error modal

    try {
      const selectedFieldsData = exportableThesisFields.filter(field =>
        selectedExportFields.includes(field.key)
      );

      const headers = selectedFieldsData.map(field => field.label).join(',');
      const rows = filteredTheses.map(thesis => {
        const rowData = selectedFieldsData.map(field => {
          // Special handling for 'membres' array
          if (field.key === 'membres') {
            return escapeCsvValue(Array.isArray((thesis as any)[field.key]) ? (thesis as any)[field.key].join(', ') : (thesis as any)[field.key]);
          }
          return escapeCsvValue((thesis as any)[field.key]);
        });
        return rowData.join(',');
      });

      const csvContent = [headers, ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'theses_export.csv');
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
  }, [filteredTheses, selectedExportFields]);

  const handleToggleFieldSelection = (key: string) => {
    setSelectedExportFields(prev =>
      prev.includes(key) ? prev.filter(field => field !== key) : [...prev, key]
    );
  };
  // --- End CSV Export Logic ---


  if (authLoading || loadingTheses) {
    return (
      <div className={`flex justify-center items-center h-screen bg-gray-50 ${inter.className}`}>
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <span className="ml-3 text-lg text-gray-700">Chargement des thèses...</span>
      </div>
    );
  }

  // This block is for unauthenticated/unauthorized access, should ideally be handled by ErrorModal
  if (!isAuthenticated || userRole !== 'admin') {
     // Replaced direct render with ErrorModal for unauthorized access
     return (
      <ErrorModal
        briefDescription="Accès non autorisé"
        detailedError="Seuls les administrateurs peuvent gérer les thèses. Veuillez vous connecter avec un compte administrateur."
        onClose={() => router.push('/connexion')} // Redirect to login on close
      />
     );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8 ${inter.className}`}>
      <header className=" text-center">
      <div className="flex items-center space-x-4 bg-gradient-to-r from-blue-600 to-purple-700 text-white p-6 rounded-xl shadow-lg mb-8">
          <GraduationCap className="w-10 h-10 flex-shrink-0" />
          <h1 className="text-4xl font-extrabold tracking-tight">Gestion des Thèses</h1>
        <p className="text-xl text-white  ">Gérez, créez et modifiez les thèses</p>
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

      {currentView === 'list' && (
        <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">Toutes les Thèses / HDR</h2>
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
              <button
                onClick={() => setShowExportModal(true)} // Open export modal
                className="inline-flex items-center px-5 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <Download className="h-5 w-5 mr-2" />
                Exporter CSV
              </button>
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
              {/* Corrected Thead structure - ensured no whitespace between <th> tags */}
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titre</th><th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Auteur</th><th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Année</th><th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th><th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Établissement</th><th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Encadrant</th><th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Créateur</th><th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {displayedTheses.map((thesis) => (
                    // Ensure no whitespace between <td> tags if this becomes an issue
                    <tr key={thesis.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 max-w-xs truncate" title={thesis.title}>{thesis.title}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{thesis.author}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{thesis.year}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{thesis.type}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={thesis.etablissement}>{thesis.etablissement}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={thesis.encadrant}>{thesis.encadrant}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{thesis.creatorName || 'N/A'}</td>
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

            {error && ( // Keep existing error display logic for form validation
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Exporter les données des thèses</h3>
            <p className="text-sm text-gray-500 mb-4">Sélectionnez les champs que vous souhaitez inclure dans le fichier CSV :</p>
            <div className="grid grid-cols-2 gap-3 mb-6 max-h-60 overflow-y-auto pr-2">
              {exportableThesisFields.map((field) => (
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
                  setSelectedExportFields(exportableThesisFields.map(field => field.key)); // Reset selection on close
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
            {exportErrorMessage && ( // Keep existing export error message display for now if not fully replaced by Toast
              <p className="text-red-500 text-xs mt-2 text-right">{exportErrorMessage}</p>
            )}
          </div>
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

export default ThesisManagement;
