// components/dashboard/CarouselManagement.tsx
"use client";

import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Image from "next/image"; // For displaying selected image preview

// Lucide Icons
import {
  Image as ImageIcon,
  PlusCircle,
  Trash2,
  Edit3,
  Loader2,
  Info,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  XCircle,
  ScrollText,
  FileText,
  Images,
  Save, // Added Save icon
} from "lucide-react";

// Fonts
import { Inter, Playfair_Display } from "next/font/google";

// API Services
import {
  getAllCarouselItems,
  createCarouselItem as apiCreateCarouselItem,
  updateCarouselItem as apiUpdateCarouselItem,
  deleteCarouselItem,
  getCarouselItemById,
  updateCarouselItemOrder, // NEW: Import the new API call
} from "@/services/carouselApi";

// Import Carousel component and CarouselItem type
import Carousel from "@/components/Carousel/CarouselBackend";
import Toast from "@/components/ui/Toast"; // Import Toast component
import ErrorModal from "@/components/ui/ErrorModal"; // Import ErrorModal component
import { CarouselItem } from "@/types/index";

const inter = Inter({ subsets: ["latin"] });
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700"],
});

const CarouselManagement: React.FC = () => {
  const {
    token,
    userRole,
    isAuthenticated,
    isLoading: authLoading,
  } = useAuth();
  const router = useRouter();

  // State for data fetching and management
  const [allCarouselItems, setAllCarouselItems] = useState<CarouselItem[]>([]);
  const [loadingItems, setLoadingItems] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null); // General error for form/fetch
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false); // For form submission (create/update/delete)
  const [confirmDeleteItemId, setConfirmDeleteItemId] = useState<string | null>(
    null
  );

  // State for form and editing
  const [currentView, setCurrentView] = useState<"list" | "add" | "edit">(
    "list"
  );
  const [editingItem, setEditingItem] = useState<CarouselItem | null>(null);

  // Form fields state
  const [imageUrl, setImageUrl] = useState<string | null>(null); // For displaying current/old image
  const [imageFile, setImageFile] = useState<File | null>(null); // For new file to upload
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null); // For live preview of new file
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [order, setOrder] = useState<number | "">("");
  const [link, setLink] = useState<string>("");

  // State for live preview in the form
  const [previewItems, setPreviewItems] = useState<CarouselItem[]>([]);

  // Ref for file input to clear it
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State for Toast notifications
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info" | "warning";
  } | null>(null);

  // State for drag and drop
  const [draggedItem, setDraggedItem] = useState<CarouselItem | null>(null);
  const [isOrderChanged, setIsOrderChanged] = useState<boolean>(false); // To track if order has been changed visually

  // Fetch all carousel items
  const fetchAllCarouselItems = useCallback(
    async (showSuccessToast = true) => {
      // Add parameter
      if (!token) {
        setToast({
          message:
            "Jeton d'authentification introuvable. Veuillez vous connecter.",
          type: "error",
        });
        setLoadingItems(false);
        return;
      }
      setLoadingItems(true);
      setError(null); // Clear existing error state

      // ONLY clear toast here if we are about to show a new success toast from this fetch.
      // Otherwise, assume the calling function (e.g., handleSaveItem) has set its own toast.
      if (showSuccessToast) {
        setToast(null); // Clear previous toasts only if we are about to show a new success toast
      }

      try {
        const response = await getAllCarouselItems(token); // Pass token to getAllCarouselItems
        if (response.success && Array.isArray(response.data)) {
          // Sort items by order when setting them
          const sortedItems = response.data.sort((a, b) => a.order - b.order);
          setAllCarouselItems(sortedItems);
          setPreviewItems(sortedItems); // Also update preview items
          setIsOrderChanged(false); // Reset order change flag

          if (showSuccessToast) {
            // Conditionally show toast
            setToast({
              message: "Éléments du carrousel chargés avec succès.",
              type: "success",
            });
          }
        } else {
          setToast({
            message:
              response.message ||
              "Échec du chargement des éléments du carrousel.",
            type: "error",
          });
          setAllCarouselItems([]);
          setPreviewItems([]);
        }
      } catch (err: any) {
        console.error(
          "Échec de la récupération des éléments du carrousel :",
          err
        );
        setToast({
          message: `Erreur lors de la récupération des éléments du carrousel : ${
            err.message || "Veuillez réessayer plus tard."
          }`,
          type: "error",
        });
        setAllCarouselItems([]);
        setPreviewItems([]);
      } finally {
        setLoadingItems(false);
      }
    },
    [token]
  ); // Dependency on token

  // Authentication check and initial fetch
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || userRole !== "admin") {
        router.push("/connexion");
        return;
      }
      if (isAuthenticated && token && userRole === "admin") {
        fetchAllCarouselItems(true); // Pass true to show initial success toast
      }
    }
  }, [
    authLoading,
    isAuthenticated,
    userRole,
    token,
    router,
    fetchAllCarouselItems,
  ]);

  // Handle image file selection for preview
  const handleImageFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        setImageFile(file);
        const fileReader = new FileReader();
        fileReader.onloadend = () => {
          setImagePreviewUrl(fileReader.result as string);
        };
        fileReader.readAsDataURL(file);
        setError(null); // Clear image related errors
      } else {
        setImageFile(null);
        setImagePreviewUrl(null);
      }
    },
    []
  );

  // Reset form fields
  const resetForm = useCallback(() => {
    setImageUrl(null);
    setImageFile(null);
    setImagePreviewUrl(null);
    setTitle("");
    setDescription("");
    setOrder("");
    setLink("");
    setEditingItem(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Clear file input
    }
    setError(null); // Clear errors on form reset
    setToast(null); // Clear any existing toasts when resetting form
  }, []);

  const handleAddNewItem = useCallback(() => {
    resetForm();
    setCurrentView("add");
    // Ensure live preview shows current fetched items (without the new unsaved item)
    setPreviewItems([...allCarouselItems].sort((a, b) => a.order - b.order));
  }, [resetForm, allCarouselItems]);

  const handleEditItem = useCallback(
    async (itemId: string) => {
      if (!token) {
        setToast({
          message: "Jeton d'authentification introuvable.",
          type: "error",
        });
        return;
      }
      setLoadingItems(true);
      setError(null);
      setToast(null); // Clear previous toasts before loading edit form
      try {
        const response = await getCarouselItemById(itemId, token);
        const itemToEdit = response.data;

        if (!itemToEdit) {
          setToast({
            message: "Élément de carrousel introuvable pour édition.",
            type: "error",
          });
          return;
        }
        setEditingItem(itemToEdit);
        setImageUrl(itemToEdit.imageUrl); // Current image URL from DB
        setImageFile(null); // No new file selected initially
        setImagePreviewUrl(itemToEdit.imageUrl); // Start preview with current image
        setTitle(itemToEdit.title || "");
        setDescription(itemToEdit.description || "");
        setOrder(itemToEdit.order); // Set the order from the fetched item
        setLink(itemToEdit.link || "");
        setCurrentView("edit");

        // Initialize preview items including the one being edited, for live updates
        const updatedPreviewItems = allCarouselItems
          .map(
            (item) =>
              item.id === itemToEdit.id
                ? { ...itemToEdit, imageUrl: itemToEdit.imageUrl }
                : item // Use actual fetched image URL
          )
          .sort((a, b) => a.order - b.order);
        setPreviewItems(updatedPreviewItems);
        setToast({
          message: "Élément du carrousel chargé pour modification.",
          type: "info",
        });
      } catch (err: any) {
        console.error(
          "Échec de la récupération de l'élément pour édition :",
          err
        );
        setToast({
          message: `Erreur lors du chargement de l'élément pour édition : ${
            err.message || "Veuillez réessayer."
          }`,
          type: "error",
        });
      } finally {
        setLoadingItems(false);
      }
    },
    [token, allCarouselItems]
  );

  const handleGoBackToList = useCallback(() => {
    setCurrentView("list");
    resetForm();
    setError(null);
    setToast(null); // Clear toast on navigation
    // Reset preview to just the saved items
    setPreviewItems([...allCarouselItems].sort((a, b) => a.order - b.order));
  }, [resetForm, allCarouselItems]);

  // Live preview update
  useEffect(() => {
    if (currentView === "add" || currentView === "edit") {
      const tempId = editingItem?.id || "new-item-preview"; // Use actual ID or a temp one
      const currentPreviewItem: CarouselItem = {
        id: tempId,
        imageUrl: imagePreviewUrl || "", // Fallback for preview
        title: title || "",
        description: description || "",
        order:
          Number(order) ||
          (allCarouselItems.length > 0
            ? Math.max(...allCarouselItems.map((i) => i.order)) + 1
            : 1),
        link: link || "",
      };

      const updatedPreview = allCarouselItems
        .filter((item) => item.id !== tempId) // Remove old version of item if editing
        .map((item) => ({ ...item, imageUrl: item.imageUrl })); // Ensure imageUrls are still URLs

      updatedPreview.push(currentPreviewItem);
      updatedPreview.sort((a, b) => a.order - b.order);

      setPreviewItems(updatedPreview);
    }
  }, [
    title,
    description,
    order,
    link,
    imagePreviewUrl,
    editingItem,
    allCarouselItems,
    currentView,
  ]);

  const handleSaveItem = async () => {
    console.log(
      "\n--- Frontend (CarouselManagement - handleSaveItem): Saving Item ---"
    );
    console.log("Current View:", currentView);
    console.log("Image URL (from DB/pre-existing):", imageUrl);
    console.log("Image File (newly selected):", imageFile);
    console.log("Image Preview URL:", imagePreviewUrl);
    console.log("Title:", title);
    console.log("Description:", description);
    console.log("Order:", order);
    console.log("Link:", link);

    if (!token) {
      setToast({
        message:
          "Jeton d'authentification introuvable. Veuillez vous connecter.",
        type: "error",
      });
      console.error("handleSaveItem: No token available.");
      return;
    }
    // Basic validation
    // Check if order is an empty string OR if it's not a valid number
    if (order === "" || isNaN(Number(order))) {
      setError(
        "L'ordre est un champ obligatoire et doit être un nombre valide."
      );
      console.error("handleSaveItem: Order validation failed. Order:", order);
      return;
    }
    // For 'add' view, an image file is mandatory
    if (currentView === "add" && !imageFile) {
      setError("Une image est requise pour un nouvel élément du carrousel.");
      console.error("handleSaveItem: Image file missing for new item.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setToast(null); // Clear previous toasts before submission

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("order", String(order)); // Ensure order is sent as string for FormData
    formData.append("link", link);
    if (imageFile) {
      formData.append("image", imageFile);
    } else if (imageUrl === null && editingItem?.imageUrl) {
      // If imageUrl was present but now cleared by user (setImageUrl(null))
      // This explicitly tells the backend to remove the old image.
      formData.append("imageUrl", "null"); // Send a string 'null' to indicate removal
    }

    console.log(
      "handleSaveItem: Item data being sent:",
      Object.fromEntries(formData.entries())
    ); // Log FormData content

    try {
      if (editingItem?.id) {
        console.log(
          `handleSaveItem: Calling apiUpdateCarouselItem for ID: ${editingItem.id}`
        );
        await apiUpdateCarouselItem(editingItem.id, formData, token);
        setToast({
          message: "Élément du carrousel mis à jour avec succès !",
          type: "success",
        }); // Use setToast
      } else {
        console.log(
          "handleSaveItem: Calling apiCreateCarouselItem for new item."
        );
        await apiCreateCarouselItem(formData, token);
        setToast({
          message: "Élément du carrousel créé avec succès !",
          type: "success",
        }); // Use setToast
      }

      // Add a timeout to clear the success toast after a few seconds
      setTimeout(() => {
        setToast(null);
      }, 3000); // Clear after 3 seconds

      resetForm();
      setCurrentView("list");
      await fetchAllCarouselItems(false); // Re-fetch all to update list and reset preview, but suppress success toast
    } catch (err: any) {
      console.error(
        "Échec de l'enregistrement de l'élément du carrousel :",
        err
      );
      setToast({
        message: `Échec de l'enregistrement : ${
          err.message || "Veuillez réessayer."
        }`,
        type: "error",
      }); // Use setToast for error
    } finally {
      setIsSubmitting(false);
      console.log("--- END Frontend (CarouselManagement - handleSaveItem) ---");
    }
  };

  const handleDeleteItem = useCallback(async () => {
    if (!confirmDeleteItemId || !token) {
      setToast({
        message: "ID de l'élément ou jeton manquant.",
        type: "error",
      }); // Use setToast
      return;
    }
    setIsSubmitting(true);
    setError(null); // Keep existing error state clear
    setToast(null); // Clear previous toasts

    try {
      await deleteCarouselItem(confirmDeleteItemId, token);
      setToast({
        message: "Élément du carrousel supprimé avec succès !",
        type: "success",
      }); // Use setToast
      setConfirmDeleteItemId(null);
      // Add a timeout to clear the success toast after a few seconds
      setTimeout(() => {
        setToast(null);
      }, 3000); // Clear after 3 seconds
      await fetchAllCarouselItems(false); // Re-fetch all to update list, but suppress success toast
    } catch (err: any) {
      console.error("Échec de la suppression de l'élément du carrousel :", err);
      setToast({
        message: `Échec de la suppression : ${
          err.message || "Veuillez réessayer."
        }`,
        type: "error",
      }); // Use setToast for error
    } finally {
      setIsSubmitting(false);
    }
  }, [confirmDeleteItemId, token, fetchAllCarouselItems]);

  // --- Drag and Drop Handlers ---
  const handleDragStart = (
    e: React.DragEvent<HTMLTableRowElement>,
    item: CarouselItem
  ) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", item.id!); // Store the ID of the dragged item
  };

  const handleDragOver = (
    e: React.DragEvent<HTMLTableRowElement>,
    targetItem: CarouselItem
  ) => {
    e.preventDefault(); // Necessary to allow a drop
    if (draggedItem && draggedItem.id !== targetItem.id) {
      // Optional: Add visual feedback for drag over (e.g., change background color)
      e.currentTarget.classList.add("bg-blue-50"); // Add a class for visual feedback
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLTableRowElement>) => {
    // Optional: Remove visual feedback
    e.currentTarget.classList.remove("bg-blue-50"); // Remove the class
  };

  const handleDrop = (
    e: React.DragEvent<HTMLTableRowElement>,
    targetItem: CarouselItem
  ) => {
    e.preventDefault();
    // Optional: Remove visual feedback
    e.currentTarget.classList.remove("bg-blue-50"); // Remove the class

    if (draggedItem && draggedItem.id !== targetItem.id) {
      setAllCarouselItems((prevItems) => {
        const newItems = [...prevItems].sort((a, b) => a.order - b.order); // Ensure sorted before reordering
        const draggedIndex = newItems.findIndex(
          (item) => item.id === draggedItem.id
        );
        const targetIndex = newItems.findIndex(
          (item) => item.id === targetItem.id
        );

        if (draggedIndex === -1 || targetIndex === -1) return prevItems;

        const [removed] = newItems.splice(draggedIndex, 1);
        newItems.splice(targetIndex, 0, removed);

        // Reassign order based on new visual position
        const reorderedItems = newItems.map((item, idx) => ({
          ...item,
          order: idx + 1,
        }));
        setIsOrderChanged(true); // Mark order as changed
        return reorderedItems;
      });
    }
    setDraggedItem(null); // Clear dragged item
  };

  const handleDragEnd = (e: React.DragEvent<HTMLTableRowElement>) => {
    setDraggedItem(null); // Clear dragged item regardless of drop success
    // Ensure any lingering drag-over classes are removed
    e.currentTarget.classList.remove("bg-blue-50");
  };

  const handleSaveOrder = async () => {
    if (!token) {
      setToast({
        message:
          "Jeton d'authentification introuvable. Veuillez vous connecter.",
        type: "error",
      });
      return;
    }
    setIsSubmitting(true);
    setToast(null); // Clear previous toasts
    setError(null);

    try {
      // Regex to validate UUID format (standard v4 UUID)
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      // Filter out any items that might have temporary frontend IDs (e.g., from unsaved new items)
      const itemsToReorder = allCarouselItems
        .filter((item) => item.id && uuidRegex.test(item.id)) // Ensure ID exists and is a valid UUID
        .map((item) => ({ id: item.id!, order: item.order }));

      if (itemsToReorder.length === 0) {
        setToast({
          message:
            "Aucun élément valide à réorganiser trouvé. Assurez-vous que tous les éléments sont enregistrés.",
          type: "warning",
        });
        setIsSubmitting(false);
        return;
      }

      console.log(
        "Frontend: Sending items to backend for reorder:",
        itemsToReorder
      ); // Log what's being sent

      // Call the new batch update API function
      await updateCarouselItemOrder(itemsToReorder, token);

      setToast({
        message: "L'ordre du carrousel a été sauvegardé avec succès !",
        type: "success",
      });
      setIsOrderChanged(false); // Reset order changed flag
      setTimeout(() => {
        setToast(null);
      }, 3000); // Clear after 3 seconds
      await fetchAllCarouselItems(false); // Re-fetch to ensure consistency, suppress toast
    } catch (err: any) {
      console.error("Échec de la sauvegarde de l'ordre du carrousel :", err);
      setToast({
        message: `Échec de la sauvegarde de l'ordre : ${
          err.message || "Veuillez réessayer."
        }`,
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  // --- End Drag and Drop Handlers ---

  if (authLoading || loadingItems) {
    return (
      <div
        className={`flex justify-center items-center h-screen bg-gray-50 ${inter.className}`}
      >
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <span className="ml-3 text-lg text-gray-700">
          Chargement des éléments du carrousel...
        </span>
      </div>
    );
  }

  // ErrorModal for critical errors (e.g., auth)
  if (!isAuthenticated || userRole !== "admin") {
    return (
      <ErrorModal
        briefDescription="Accès non autorisé"
        detailedError="Seuls les administrateurs peuvent gérer le carrousel. Veuillez vous connecter avec un compte administrateur."
        onClose={() => router.push("/connexion")}
      />
    );
  }

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8 ${inter.className}`}
    >
      <header className=" text-center">
        <div className="flex items-center space-x-4 bg-gradient-to-r from-blue-600 to-purple-700 text-white p-6 rounded-xl shadow-lg mb-8">
          <Images className="w-10 h-10 flex-shrink-0" />
          <h1 className="text-4xl font-extrabold tracking-tight">
            Gestion de la Carousel
          </h1>
          <p className="text-xl text-white">
            Gérez les éléments de la carousel
          </p>
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

      {/* Error display for form validation or general component errors */}
      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative mb-6"
          role="alert"
        >
          <strong className="font-bold">Erreur !</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      {currentView === "list" && (
        <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">
              Éléments du Carrousel
            </h2>
            <button
              onClick={handleAddNewItem}
              className="inline-flex items-center px-5 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusCircle className="h-5 w-5 mr-2" />
              Ajouter un nouvel élément
            </button>
          </div>

          {allCarouselItems.length === 0 && !loadingItems && (
            <p className="text-center text-gray-500 py-8">
              Aucun élément de carrousel trouvé. Cliquez sur "Ajouter un nouvel
              élément" pour en créer un.
            </p>
          )}

          {allCarouselItems.length > 0 && (
            <>
              <p className="text-sm text-gray-600 mb-4 flex items-center">
                <Info className="h-4 w-4 mr-2 text-blue-500" />
                Vous pouvez réorganiser les éléments du carrousel en les faisant
                glisser et déposer (drag-and-drop) directement dans le tableau.
                N'oubliez pas de sauvegarder l'ordre après modification.
              </p>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Ordre
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Image
                      </th>
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
                        Description
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Lien
                      </th>
                      <th scope="col" className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {allCarouselItems.map((item) => (
                      <tr
                        key={item.id}
                        draggable="true"
                        onDragStart={(e) => handleDragStart(e, item)}
                        onDragOver={(e) => handleDragOver(e, item)}
                        onDrop={(e) => handleDrop(e, item)}
                        onDragLeave={handleDragLeave}
                        onDragEnd={handleDragEnd}
                        className={`hover:bg-gray-50 ${
                          draggedItem?.id === item.id
                            ? "opacity-50 border-2 border-dashed border-blue-500"
                            : ""
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          <div className="flex items-center space-x-2">
                            <span className="cursor-grab">{item.order}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {item.imageUrl ? (
                            <Image
                              src={item.imageUrl}
                              alt={item.title || "Image"}
                              width={80}
                              height={45}
                              className="rounded-md object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src =
                                  "https://placehold.co/80x45/cccccc/333333?text=N/A"; // Fallback
                              }}
                            />
                          ) : (
                            <span className="text-gray-400">Pas d'image</span>
                          )}
                        </td>
                        <td
                          className="px-6 py-4 text-sm font-medium text-gray-900 max-w-xs truncate"
                          title={item.title || ""}
                        >
                          {item.title || "N/A"}
                        </td>
                        <td
                          className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate"
                          title={item.description || ""}
                        >
                          {item.description || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-sm text-blue-600 max-w-xs truncate">
                          {item.link ? (
                            <a
                              href={item.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline flex items-center"
                            >
                              {item.link}{" "}
                              <ExternalLink className="h-4 w-4 ml-1" />
                            </a>
                          ) : (
                            "N/A"
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleEditItem(item.id!)}
                              className="text-blue-600 hover:text-blue-900 p-2 rounded-full hover:bg-blue-100 transition-colors"
                              title="Modifier l'élément"
                            >
                              <Edit3 className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => setConfirmDeleteItemId(item.id!)}
                              className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-100 transition-colors"
                              title="Supprimer l'élément"
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
              {isOrderChanged && (
                <div className="mt-6 text-center">
                  <button
                    onClick={handleSaveOrder}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    ) : (
                      <Save className="h-5 w-5 mr-2" />
                    )}
                    {isSubmitting ? "Sauvegarde..." : "Sauvegarder l'ordre"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Add/Edit Form */}
      {(currentView === "add" || currentView === "edit") && (
        <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100 relative mt-8">
          <button
            onClick={handleGoBackToList}
            className="absolute top-6 left-6 flex items-center text-gray-600 hover:text-gray-900 font-medium"
          >
            <ArrowLeft className="w-5 h-5 mr-2" /> Retour à la liste
          </button>
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center mt-4">
            {editingItem
              ? "Modifier l'élément du carrousel"
              : "Ajouter un nouvel élément de carrousel"}
          </h2>

          {/* Live Carousel Preview */}
          <div className="mb-10 p-4 border border-blue-200 rounded-lg bg-blue-50">
            <h3 className="text-xl font-semibold text-blue-800 mb-4 text-center">
              Aperçu du Carrousel
            </h3>
            <Carousel slides={previewItems} />
            <p className="text-sm text-blue-600 text-center mt-2">
              (Ceci est un aperçu en direct des modifications non enregistrées.)
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveItem();
            }}
            className="space-y-6"
          >
            {/* Image Upload */}
            <div>
              <label
                htmlFor="imageFile"
                className="block text-sm font-medium text-gray-700 mb-2 flex items-center"
              >
                <ImageIcon className="w-4 h-4 mr-1 text-gray-500" /> Image{" "}
                {currentView === "add" && (
                  <span className="text-red-500">*</span>
                )}
              </label>
              {imagePreviewUrl && (
                <div className="mb-4 flex items-center space-x-4">
                  <Image
                    src={imagePreviewUrl}
                    alt="Aperçu de l'image"
                    width={150}
                    height={84}
                    className="rounded-md object-cover border border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      setImageUrl(null); // Explicitly remove existing image association from component state
                      setImagePreviewUrl(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                    className="flex items-center text-red-600 hover:text-red-800 text-sm"
                  >
                    <XCircle className="h-4 w-4 mr-1" /> Supprimer l'image
                  </button>
                </div>
              )}
              <input
                type="file"
                id="imageFile"
                accept="image/*"
                onChange={handleImageFileChange}
                ref={fileInputRef}
                className="mt-1 block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
              <p className="mt-2 text-sm text-gray-500">
                Formats acceptés : JPG, PNG, GIF. Max 5MB.
              </p>
            </div>

            {/* Order */}
            <div>
              <label
                htmlFor="order"
                className="block text-sm font-medium text-gray-700 mb-2 flex items-center"
              >
                <ImageIcon className="w-4 h-4 mr-1 text-gray-500" /> Ordre
                d'affichage <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="order"
                value={order}
                onChange={(e) => setOrder(parseInt(e.target.value, 10) || "")}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Numéro d'ordre (ex: 1, 2, 3)"
                min="1"
                required
              />
            </div>

            {/* Title */}
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-2 flex items-center"
              >
                <FileText className="w-4 h-4 mr-1 text-gray-500" /> Titre
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Titre de l'image (optionnel)"
              />
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-2 flex items-center"
              >
                <ScrollText className="w-4 h-4 mr-1 text-gray-500" />{" "}
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Description de l'image (optionnel)"
              ></textarea>
            </div>

            {/* Link */}
            <div>
              <label
                htmlFor="link"
                className="block text-sm font-medium text-gray-700 mb-2 flex items-center"
              >
                <ExternalLink className="w-4 h-4 mr-1 text-gray-500" /> Lien
                (URL)
              </label>
              <input
                type="url" // Use type="url" for better validation
                id="link"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="https://example.com (optionnel)"
              />
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
                {isSubmitting ? "Enregistrement..." : "Confirmer & Enregistrer"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteItemId && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative p-8 bg-white w-full max-w-md m-auto flex-col flex rounded-lg shadow-lg">
            <div className="text-center">
              <Trash2 className="mx-auto h-12 w-12 text-red-500" />
              <h3 className="text-lg font-semibold text-gray-900 mt-4">
                Confirmer la suppression
              </h3>
              <p className="text-sm text-gray-500 mt-2">
                Êtes-vous sûr de vouloir supprimer cet élément du carrousel ?
                Cette action est irréversible.
              </p>
            </div>
            <div className="flex justify-center space-x-4 mt-6">
              <button
                onClick={() => setConfirmDeleteItemId(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                disabled={isSubmitting}
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteItem}
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

export default CarouselManagement;
