// components/dashboard/ActuManagement.tsx
"use client"; // This directive ensures the component itself is a client component

import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

// Lucide Icons
import {
  Newspaper,
  PlusCircle,
  Trash2,
  Edit3,
  Eye,
  Loader2,
  Info,
  ArrowLeft,
  Calendar as CalendarIcon,
  Image as ImageIcon,
  Tag,
  Layout,
  Text,
  Heading,
  List,
  Bold,
  Palette,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Search,
} from "lucide-react";

// IMPORTANT: Dynamic import for react-quill-new to prevent SSR issues
import dynamic from "next/dynamic";
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });
import "@/styles/quill.snow.css"; // Corrected CSS import path

// Fonts
import { Inter, Playfair_Display } from "next/font/google";

// API Services
import {
  getAllActus,
  createActu as apiCreateActu,
  updateActu as apiUpdateActu,
  deleteActu,
  getActuById,
  Actu, // Import Actu interface from actusApi
} from "@/services/actusApi"; // Correct import path for API functions and Actu type

// IMPORTANT: Importing ActuDetailClient to render the preview
import ActuDetailClient from "@/components/Actualites/ActuDetailClient";

// Import Toast and ErrorModal components
import Toast from "@/components/ui/Toast";
import ErrorModal from "@/components/ui/ErrorModal";

const inter = Inter({ subsets: ["latin"] });
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700"],
});

const ITEMS_PER_PAGE = 5;

// Base URL for your backend, used for serving images
const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_UPLOADS + "actu_images/" ||
  "http://backend:5000/uploads/actu_images/";

// Helper to get today's date in YYYY-MM-DD format
const getTodaysDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const ActuManagement: React.FC = () => {
  const { token, userId, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // State for data fetching and management
  const [actus, setActus] = useState<Actu[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [confirmDeleteActuId, setConfirmDeleteActuId] = useState<string | null>(
    null
  );

  // State for form and editing
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [currentActu, setCurrentActu] = useState<Actu | null>(null);
  const [viewingActu, setViewingActu] = useState<Actu | null>(null);
  const [currentView, setCurrentView] = useState<
    "list" | "add" | "edit" | "view"
  >("list");

  // Form fields state
  const [title, setTitle] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  // Set initial date to today's date
  const [date, setDate] = useState<string>(getTodaysDate());
  // Removed 'SHC' from category type
  const [category, setCategory] = useState<
    "Conférence" | "Formation" | "Laboratoire"
  >("Conférence");
  const [shortDescription, setShortDescription] = useState<string>("");
  const [fullContent, setFullContent] = useState<string>(""); // For ReactQuill
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filteredActus, setFilteredActus] = useState<Actu[]>([]);

  // States for Toast and ErrorModal
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info" | "warning";
  } | null>(null);
  const [errorModal, setErrorModal] = useState<{
    title: string;
    briefDescription: string;
    detailedError?: string;
  } | null>(null);

  // Memoized filtered and paginated actus for display
  const displayedActus = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredActus.slice(start, end);
  }, [filteredActus, currentPage]);

  // Fetch actus - now accepts a flag to show success toast
  const fetchActus = useCallback(
    async (showSuccessToast = true) => {
      if (!token) {
        setErrorModal({
          title: "Jeton d'authentification manquant.",
          briefDescription:
            "Veuillez vous reconnecter. Votre session a peut-être expiré.",
          detailedError: "Token is null or undefined.",
        });
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      if (showSuccessToast) {
        setToast(null);
      }

      try {
        const response = await getAllActus(token);
        if (response.success && response.data) {
          setActus(response.data); // Set the raw data
          setFilteredActus(response.data); // Initialize filteredActus with all data
          setTotalPages(Math.ceil(response.data.length / ITEMS_PER_PAGE));
          if (showSuccessToast && response.data.length > 0) {
            setToast({
              message: "Actualités chargées avec succès.",
              type: "success",
            });
          }
        } else {
          console.error(
            "Échec de la récupération des actualités :",
            response.message
          );
          setErrorModal({
            title: "Échec du chargement des actualités",
            briefDescription:
              response.message ||
              "Une erreur est survenue lors de la récupération des actualités.",
            detailedError: response.message,
          });
          setActus([]);
          setFilteredActus([]);
        }
      } catch (err: any) {
        console.error("Échec de la récupération des actualités (catch) :", err);
        setErrorModal({
          title: "Erreur réseau ou serveur",
          briefDescription:
            "Impossible de communiquer avec le serveur ou erreur inattendue.",
          detailedError:
            err.message ||
            "Veuillez vérifier votre connexion internet et réessayer.",
        });
        setActus([]);
        setFilteredActus([]);
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  // Authentication check and initial fetch
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    } else if (isAuthenticated && token) {
      fetchActus(true);
    }
  }, [authLoading, isAuthenticated, token, router, fetchActus]);

  useEffect(() => {
    // Apply search filter whenever actus or searchTerm changes
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const newFilteredActus = actus.filter(
      (actu) =>
        actu.title.toLowerCase().includes(lowerCaseSearchTerm) ||
        actu.shortDescription.toLowerCase().includes(lowerCaseSearchTerm) ||
        actu.category.toLowerCase().includes(lowerCaseSearchTerm)
    );
    setFilteredActus(newFilteredActus);
    setTotalPages(Math.ceil(newFilteredActus.length / ITEMS_PER_PAGE));
    setCurrentPage(1); // Reset to first page on new search
  }, [actus, searchTerm]);

  const resetForm = useCallback(() => {
    setTitle("");
    setSelectedImage(null);
    setImagePreviewUrl(null);
    setDate(getTodaysDate());
    setCategory("Conférence");
    setShortDescription("");
    setFullContent("");
    setCurrentActu(null);
    setIsEditing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleAddNewActu = useCallback(() => {
    resetForm();
    setCurrentView("add");
    // Clear any previous error modals when starting a new operation
    setErrorModal(null);
  }, [resetForm]);

  const handleEditActu = useCallback(
    async (actuId: string) => {
      if (!token) {
        setErrorModal({
          title: "Jeton d'authentification introuvable.",
          briefDescription: "Veuillez vous connecter.",
          detailedError: "Token is null or undefined.",
        });
        return;
      }
      setLoading(true);
      setError(null);
      setToast(null);
      setErrorModal(null); // Clear error modal on new operation

      try {
        const response = await getActuById(actuId, token);
        if (response.success && response.data) {
          const actuToEdit = response.data;
          setCurrentActu(actuToEdit);
          setTitle(actuToEdit.title);

          if (actuToEdit.image) {
            const imageUrl = `${BACKEND_BASE_URL}${actuToEdit.image}`;

            setImagePreviewUrl(imageUrl);
          } else {
            setImagePreviewUrl(null);
          }

          setDate(actuToEdit.date);
          setCategory(actuToEdit.category); // Category is already correctly typed
          setShortDescription(actuToEdit.shortDescription);
          setFullContent(actuToEdit.fullContent || "");
          setIsEditing(true);
          setCurrentView("edit");
          setToast({
            message: "Actualité chargée pour modification.",
            type: "info",
          });
        } else {
          console.error(
            "Échec de la récupération de l'actualité pour édition :",
            response.message
          );
          setErrorModal({
            title: "Actualité non trouvée",
            briefDescription:
              response.message ||
              "Impossible de trouver l'actualité spécifiée.",
            detailedError: response.message,
          });
        }
      } catch (err: any) {
        console.error(
          "Échec de la récupération de l'actualité pour édition (catch) :",
          err
        );
        setErrorModal({
          title: "Erreur réseau ou serveur",
          briefDescription:
            "Impossible de communiquer avec le serveur ou erreur inattendue.",
          detailedError: err.message || "Veuillez réessayer.",
        });
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  const handleViewActu = useCallback(
    async (actuId: string) => {
      if (!token) {
        setErrorModal({
          title: "Jeton d'authentification introuvable.",
          briefDescription: "Veuillez vous connecter.",
          detailedError: "Token is null or undefined.",
        });
        return;
      }
      setLoading(true);
      setError(null);
      setToast(null);
      setErrorModal(null); // Clear error modal on new operation

      try {
        const response = await getActuById(actuId, token);
        if (response.success && response.data) {
          setViewingActu(response.data);
          setCurrentView("view");
          setToast({
            message: "Actualité chargée pour visualisation.",
            type: "info",
          });
        } else {
          console.error(
            "Échec de la récupération de l'actualité pour visualisation :",
            response.message
          );
          setErrorModal({
            title: "Actualité non trouvée",
            briefDescription:
              response.message ||
              "Impossible de trouver l'actualité spécifiée.",
            detailedError: response.message,
          });
        }
      } catch (err: any) {
        console.error(
          "Échec de la récupération de l'actualité pour visualisation (catch) :",
          err
        );
        setErrorModal({
          title: "Erreur réseau ou serveur",
          briefDescription:
            "Impossible de communiquer avec le serveur ou erreur inattendue.",
          detailedError: err.message || "Veuillez réessayer.",
        });
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  const handleGoBackToList = useCallback(() => {
    setCurrentView("list");
    setViewingActu(null);
    resetForm();
    setToast(null);
    setErrorModal(null);
  }, [resetForm]);

  const handleImageChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.files && event.target.files[0]) {
        const file = event.target.files[0];
        setSelectedImage(file);
        setImagePreviewUrl(URL.createObjectURL(file));
      } else {
        setSelectedImage(null);
        setImagePreviewUrl(null);
      }
    },
    []
  );

  const handleRemoveImage = useCallback(() => {
    setSelectedImage(null);
    setImagePreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleConfirmSave = async () => {
    if (!token) {
      setToast({
        message:
          "Jeton d'authentification introuvable. Veuillez vous connecter.",
        type: "error",
      });
      return;
    }
    if (!title || !date || !shortDescription || !category) {
      setToast({
        message:
          "Veuillez remplir tous les champs obligatoires (Titre, Date, Courte Description, Catégorie).",
        type: "error",
      });
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setToast(null);
    setErrorModal(null); // Clear error modal on new operation

    const formData = new FormData();
    formData.append("title", title);
    formData.append("date", date);
    formData.append("category", category);
    formData.append("shortDescription", shortDescription);
    formData.append("fullContent", fullContent);

    if (selectedImage) {
      formData.append("image", selectedImage);
    } else if (isEditing && currentActu?.image && !imagePreviewUrl) {
      formData.append("image", "");
    }

    if (userId) {
      formData.append("userId", userId);
    } else if (!isEditing) {
      setToast({
        message:
          "L'ID utilisateur est manquant. Impossible de créer l'actualité sans utilisateur lié.",
        type: "error",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      let response;
      if (isEditing && currentActu?.id) {
        response = await apiUpdateActu(currentActu.id, formData, token);
        if (response.success) {
          setToast({
            message: "Actualité mise à jour avec succès !",
            type: "success",
          });
        } else {
          throw new Error(
            response.message || "Échec de la mise à jour de l'actualité."
          );
        }
      } else {
        response = await apiCreateActu(formData, token);
        if (response.success) {
          setToast({
            message: "Actualité créée avec succès !",
            type: "success",
          });
        } else {
          throw new Error(
            response.message || "Échec de la création de l'actualité."
          );
        }
      }
      resetForm();
      setCurrentView("list");
      await fetchActus(false);
    } catch (err: any) {
      console.error("Échec de l'enregistrement de l'actualité :", err);
      setToast({
        message: `Échec de l'enregistrement de l'actualité : ${
          err.message || "Veuillez réessayer."
        }`,
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteActu = useCallback(async () => {
    if (!confirmDeleteActuId || !token) {
      setToast({ message: "ID d'actualité ou jeton manquant.", type: "error" });
      return;
    }
    setIsSubmitting(true);
    setError(null);
    setToast(null);
    setErrorModal(null); // Clear error modal on new operation

    try {
      const response = await deleteActu(confirmDeleteActuId, token);
      if (response.success) {
        setToast({
          message: "Actualité supprimée avec succès !",
          type: "success",
        });
      } else {
        throw new Error(
          response.message || "Échec de la suppression de l'actualité."
        );
      }
      setConfirmDeleteActuId(null);
      await fetchActus(false);
    } catch (err: any) {
      console.error("Échec de la suppression de l'actualité :", err);
      setToast({
        message: `Échec de la suppression de l'actualité : ${
          err.message || "Veuillez réessayer."
        }`,
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [confirmDeleteActuId, token, fetchActus]);

  // Prepare data for previewing ActuDetailClient
  const previewActu: Actu = useMemo(
    () => ({
      // Provide a dummy ID for the preview, as it's not a real backend entry yet
      id: "preview-" + Date.now(),
      title: title || "Titre de l'actualité",
      image:
        imagePreviewUrl ||
        "https://placehold.co/600x400/E0E0E0/4A4A4A?text=Image+de+pr%C3%A9visualisation", // Placeholder image
      date: date || getTodaysDate(),
      category: category || "Conférence", // Use current category state
      shortDescription:
        shortDescription || "Ceci est un aperçu de votre actualité.",
      fullContent: fullContent || "<p>Le contenu détaillé apparaîtra ici.</p>",
      userId: userId || "unknown", // Include userId for type consistency, even if dummy
      creatorName: "Aperçu", // Indicate it's a preview
    }),
    [
      title,
      imagePreviewUrl,
      date,
      category,
      shortDescription,
      fullContent,
      userId,
    ]
  );

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
        <span className="ml-3 text-lg text-gray-700">
          Chargement du tableau de bord...
        </span>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8  ${inter.className}`}
    >
      <div className="flex items-center space-x-4 bg-gradient-to-r from-blue-600 to-purple-700 text-white p-6 rounded-xl shadow-lg mb-8">
        <Newspaper className="w-10 h-10 flex-shrink-0" />
        <h1 className="text-4xl font-extrabold tracking-tight">
          Gestion des Actualités
        </h1>
        <p className="text-xl text-white  ">
          Gérez, créez et publiez les actualités de votre plateforme.
        </p>
      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Error Modal */}
      {errorModal && errorModal.title && (
        <ErrorModal
          title={errorModal.title}
          briefDescription={errorModal.briefDescription}
          detailedError={errorModal.detailedError}
          onClose={() => setErrorModal(null)}
        />
      )}

      {currentView === "list" && (
        <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">
              Toutes les actualités
            </h2>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Rechercher une actualité..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>
              <button
                onClick={handleAddNewActu}
                className="inline-flex items-center px-5 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PlusCircle className="h-5 w-5 mr-2" />
                Ajouter une nouvelle actualité
              </button>
            </div>
          </div>

          {displayedActus.length === 0 && !loading && (
            <p className="text-center text-gray-500 py-8">
              Aucune actualité trouvée. Cliquez sur "Ajouter une nouvelle
              actualité" pour en créer une.
            </p>
          )}

          {displayedActus.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Titre
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Catégorie
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Date
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Auteur
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Description courte
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {displayedActus.map((actu) => (
                    <tr key={actu.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {/* {`${BACKEND_BASE_URL}${actu.image}`} */}
                          {actu.image && (
                            <div className="flex-shrink-0 h-10 w-10">
                              <Image
                                className="h-10 w-10 rounded-full object-cover"
                                src={`${BACKEND_BASE_URL}${actu.image}`}
                                alt={actu.title}
                                width={40}
                                height={40}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).onerror = null;
                                  (e.target as HTMLImageElement).src =
                                    "https://placehold.co/40x40/E0E0E0/4A4A4A?text=N/A";
                                }}
                              />
                            </div>
                          )}
                          <div className={`${actu.image ? "ml-4" : ""}`}>
                            <div className="text-sm font-medium text-gray-900">
                              {actu.title}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            actu.category === "Conférence"
                              ? "bg-blue-100 text-blue-800"
                              : actu.category === "Formation"
                              ? "bg-purple-100 text-purple-800"
                              : actu.category === "Laboratoire"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800" // Fallback for any unexpected category, though 'SHC' is removed
                          }`}
                        >
                          {actu.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(actu.date).toLocaleDateString("fr-FR", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {actu.creatorName || "N/A"}
                      </td>
                      <td
                        className="px-6 py-4 text-sm text-gray-500 truncate max-w-xs"
                        title={actu.shortDescription}
                      >
                        {actu.shortDescription}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleViewActu(actu.id!)}
                            className="text-gray-600 hover:text-gray-900 p-2 rounded-full hover:bg-gray-100 transition-colors"
                            title="Voir l'actualité"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleEditActu(actu.id!)}
                            className="text-indigo-600 hover:text-indigo-900 p-2 rounded-full hover:bg-indigo-100 transition-colors"
                            title="Modifier l'actualité"
                          >
                            <Edit3 className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteActuId(actu.id!)}
                            className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-100 transition-colors"
                            title="Supprimer l'actualité"
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
                  Affichage de{" "}
                  <span className="font-medium">
                    {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                  </span>{" "}
                  à{" "}
                  <span className="font-medium">
                    {Math.min(
                      currentPage * ITEMS_PER_PAGE,
                      filteredActus.length
                    )}
                  </span>{" "}
                  sur{" "}
                  <span className="font-medium">{filteredActus.length}</span>{" "}
                  résultats
                </p>
              </div>
              <div className="flex-1 flex justify-between sm:justify-end">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Précédent
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
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
      {(currentView === "add" || currentView === "edit") && (
        <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100 relative">
          <button
            onClick={handleGoBackToList}
            className="absolute top-6 left-6 flex items-center text-gray-600 hover:text-gray-900 font-medium"
          >
            <ArrowLeft className="w-5 h-5 mr-2" /> Retour à la liste
          </button>
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center mt-4">
            {isEditing
              ? "Modifier l'actualité"
              : "Créer une nouvelle actualité"}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Left Column: Title, Category, Date, Short Description */}
            <div>
              <div className="mb-6">
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  <Heading className="inline-block w-4 h-4 mr-1 text-gray-500" />{" "}
                  Titre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Saisir le titre de l'actualité"
                  required
                />
              </div>

              <div className="mb-6">
                <label
                  htmlFor="category"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  <Tag className="inline-block w-4 h-4 mr-1 text-gray-500" />{" "}
                  Catégorie <span className="text-red-500">*</span>
                </label>
                <select
                  id="category"
                  value={category}
                  // Removed 'SHC' from the type assertion
                  onChange={(e) =>
                    setCategory(
                      e.target.value as
                        | "Conférence"
                        | "Formation"
                        | "Laboratoire"
                    )
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  required
                >
                  <option value="Conférence">Conférence</option>
                  <option value="Formation">Formation</option>
                  <option value="Laboratoire">Laboratoire</option>
                  {/* Removed SHC option */}
                </select>
              </div>

              <div className="mb-6">
                <label
                  htmlFor="date"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  <CalendarIcon className="inline-block w-4 h-4 mr-1 text-gray-500" />{" "}
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  required
                />
              </div>

              <div className="mb-6">
                <label
                  htmlFor="shortDescription"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  <List className="inline-block w-4 h-4 mr-1 text-gray-500" />{" "}
                  Description courte <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="shortDescription"
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  rows={4}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Fournir un bref résumé de l'actualité (max 500 caractères)."
                  maxLength={500}
                  required
                ></textarea>
                <p className="text-right text-xs text-gray-500">
                  {shortDescription.length}/500
                </p>
              </div>
            </div>

            {/* Right Column: Image Upload */}
            <div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <ImageIcon className="inline-block w-4 h-4 mr-1 text-gray-500" />{" "}
                  Image de l'actualité
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md relative">
                  {imagePreviewUrl ? (
                    <div className="space-y-4 w-full">
                      <div className="relative w-full h-48 sm:h-64 md:h-72 lg:h-80 overflow-hidden rounded-md">
                        <Image
                          src={imagePreviewUrl}
                          alt="Aperçu de l'image"
                          layout="fill"
                          objectFit="contain"
                          className="rounded-md"
                        />
                      </div>
                      <button
                        onClick={handleRemoveImage}
                        type="button"
                        className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Supprimer l'image
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1 text-center">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                        aria-hidden="true"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                        >
                          <span>Télécharger un fichier</span>
                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            className="sr-only"
                            onChange={handleImageChange}
                            ref={fileInputRef}
                            accept="image/*"
                          />
                        </label>
                        <p className="pl-1">ou glisser-déposer</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, GIF jusqu'à 10MB
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Full Content */}
          <div className="mb-8">
            <label
              htmlFor="fullContent"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              <Text className="inline-block w-4 h-4 mr-1 text-gray-500" />{" "}
              Contenu complet
            </label>
            <ReactQuill
              theme="snow"
              value={fullContent}
              onChange={setFullContent}
              className="mt-1 block w-full rounded-md shadow-sm"
              modules={{
                toolbar: [
                  [{ header: "1" }, { header: "2" }],
                  [{ size: [] }],
                  ["bold", "italic", "underline", "strike", "blockquote"],
                  [
                    { list: "ordered" },
                    { list: "bullet" },
                    { indent: "-1" },
                    { indent: "+1" },
                  ],
                  ["clean"],
                ],
              }}
              formats={[
                "header",
                "size",
                "bold",
                "italic",
                "underline",
                "strike",
                "blockquote",
                "list",
                "indent",
              ]}
              placeholder="Écrivez ici le contenu complet de votre actualité..."
            />
          </div>

          {/* Preview Section */}
          <div className="mt-10 pt-6 border-t border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Eye className="inline-block w-5 h-5 mr-2 text-indigo-600" />{" "}
              Aperçu en direct
            </h3>
            <p className="text-gray-600 mb-6">
              Voyez à quoi ressemblera votre actualité sur la page publique :
            </p>
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              {/* Pass the full previewActu object to ActuDetailClient */}
              <ActuDetailClient actu={previewActu} />
            </div>
          </div>

          <div className="mt-8 flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleConfirmSave}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin h-5 w-5 mr-2" />
              ) : (
                <PlusCircle className="h-5 w-5 mr-2" />
              )}
              {isSubmitting ? "Enregistrement..." : "Confirmer & Enregistrer"}
            </button>
            <button
              type="button"
              onClick={handleGoBackToList}
              className="px-6 py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* View Actu Detail */}
      {currentView === "view" && viewingActu && (
        <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100 relative">
          <button
            onClick={handleGoBackToList}
            className="absolute top-6 left-6 flex items-center text-gray-600 hover:text-gray-900 font-medium"
          >
            <ArrowLeft className="w-5 h-5 mr-2" /> Retour à la liste
          </button>
          {/* Keep passing actuId for actual viewing (fetching from backend) */}
          <ActuDetailClient actuId={viewingActu.id!} />
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteActuId && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative p-8 bg-white w-full max-w-md m-auto flex-col flex rounded-lg shadow-lg">
            <div className="text-center">
              <Trash2 className="mx-auto h-12 w-12 text-red-500" />
              <h3 className="text-lg font-semibold text-gray-900 mt-4">
                Confirmer la suppression
              </h3>
              <p className="text-sm text-gray-500 mt-2">
                Êtes-vous sûr de vouloir supprimer cette actualité ? Cette
                action est irréversible.
              </p>
            </div>
            <div className="flex justify-center space-x-4 mt-6">
              <button
                onClick={() => setConfirmDeleteActuId(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                disabled={isSubmitting}
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteActu}
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin h-4 w-4 mr-2 inline-block" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2 inline-block" />
                )}
                {isSubmitting ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActuManagement;
