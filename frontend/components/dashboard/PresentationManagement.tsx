// components/dashboard/PresentationManagement.tsx
'use client';

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { v4 as uuidv4 } from 'uuid'; // For unique IDs for new blocks

// Lucide Icons
import {
  FileText, PlusCircle, Trash2, Edit3, Loader2, Info, ArrowLeft,
  Text, Image as ImageIcon, ChevronUp, ChevronDown, GripVertical, Eye, XCircle,
  User, Briefcase, Camera, Hash, Pencil, LayoutGrid, Save // Added Save icon
} from 'lucide-react';

// IMPORTANT: Dynamic import for react-quill-new to prevent SSR issues
import dynamic from 'next/dynamic';
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });
import '@/styles/quill.snow.css'; // Corrected CSS import path

// Fonts
import { Inter, Playfair_Display } from 'next/font/google';

// API Services
import { getMainPresentationContent, updateMainPresentationContent } from '@/services/presentationApi'; // Corrected to presentationApi
import { PresentationContent, ContentBlock, TextContentBlock, ImageContentBlock } from '@/types/index';

// CORRECT IMPORT PATH FOR THE NEW COMPONENT
import PresentationPageContentPreview from '@/components/presentation/PresentationPageContentPreview'; // Import for the live preview!

// Import Toast and ErrorModal components
import Toast from '@/components/ui/Toast';
import ErrorModal from '@/components/ui/ErrorModal';

const inter = Inter({ subsets: ['latin'] });
const playfair = Playfair_Display({ subsets: ['latin'], weight: ['400', '700'] });

// Define a max width for the preview and public display for consistent scaling
const MAX_IMAGE_DISPLAY_WIDTH = 700; // Max width in pixels for image display

const PresentationManagement: React.FC = () => {
  const { token, userRole, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // State for data fetching and management
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [presentationData, setPresentationData] = useState<PresentationContent | null>(null);

  // State for flexible content blocks being edited
  const [currentContentBlocks, setCurrentContentBlocks] = useState<ContentBlock[]>([]);

  // State for new dynamic fields
  const [directorName, setDirectorName] = useState<string>('');
  const [directorPosition, setDirectorPosition] = useState<string>('');
  const [directorImage, setDirectorImage] = useState<File | null>(null);
  const [directorImagePreviewUrl, setDirectorImagePreviewUrl] = useState<string | null>(null);

  const [counter1Value, setCounter1Value] = useState<number>(0);
  const [counter1Label, setCounter1Label] = useState<string>('Permanents');
  const [counter2Value, setCounter2Value] = useState<number>(0);
  const [counter2Label, setCounter2Label] = useState<string>('Articles impactés');
  const [counter3Value, setCounter3Value] = useState<number>(0);
  const [counter3Label, setCounter3Label] = useState<string>('Articles publiés');

  // Refs for file inputs if needed (for flexible image blocks)
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement }>({});
  // Ref for director image input
  const directorImageInputRef = useRef<HTMLInputElement>(null);

  // State for Toast and ErrorModal
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
  const [errorModal, setErrorModal] = useState<{ title: string; briefDescription: string; detailedError?: string } | null>(null);


  // Helper to get image dimensions (for aspect ratio calculation)
  const getImageDimensions = useCallback((file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new (window as any).Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => {
        console.error("Failed to load image for dimension calculation.");
        reject(new Error("Failed to load image dimensions."));
        URL.revokeObjectURL(img.src);
      };
      img.src = URL.createObjectURL(file);
    });
  }, []);

  // Fetch main presentation content and populate states
  const fetchPresentationContent = useCallback(async () => {
    if (!token) {
      setErrorModal({
        title: 'Erreur d\'authentification',
        briefDescription: 'Jeton d\'authentification introuvable. Veuillez vous connecter.',
      });
      setLoading(false);
      return;
    }
    setLoading(true);
    setToast({ message: 'Chargement du contenu de la présentation...', type: 'info' }); // Toast for loading
    setErrorModal(null); // Clear previous error modal
    try {
      const response = await getMainPresentationContent();
      if (response.success && response.data) {
        setPresentationData(response.data);
        // Ensure contentBlocks is an array and initialize slider value if missing
        setCurrentContentBlocks(response.data.contentBlocks.map(block => {
          if (block.type === 'image') {
            const imageBlock = block as ImageContentBlock;
            const updatedImageBlock: ImageContentBlock = {
                ...imageBlock,
                sizeSliderValue: imageBlock.sizeSliderValue ?? 50, // Ensure slider value exists
            };
            // Re-calculate width and height based on original dimensions and slider value
            if (updatedImageBlock.originalWidth && updatedImageBlock.originalHeight && updatedImageBlock.sizeSliderValue !== undefined) {
                const scaleFactor = updatedImageBlock.sizeSliderValue / 100;
                const targetWidth = MAX_IMAGE_DISPLAY_WIDTH * scaleFactor;
                const finalWidth = Math.min(targetWidth, updatedImageBlock.originalWidth);
                const aspectRatio = updatedImageBlock.originalWidth / updatedImageBlock.originalHeight;
                const finalHeight = Math.round(finalWidth / aspectRatio);

                updatedImageBlock.width = finalWidth;
                updatedImageBlock.height = finalHeight;
            } else if (updatedImageBlock.url && !updatedImageBlock.originalWidth && !updatedImageBlock.originalHeight) {
                // If a URL exists but dimensions are missing (e.g., legacy data), reset size
                updatedImageBlock.width = undefined;
                updatedImageBlock.height = undefined;
                updatedImageBlock.sizeSliderValue = 50; // Reset to default
            }
            return updatedImageBlock;
          }
          return block;
        }) || []);

        // Populate new dynamic fields
        setDirectorName(response.data.directorName || '');
        setDirectorPosition(response.data.directorPosition || '');
        setDirectorImagePreviewUrl(response.data.directorImage || null); // This is the URL from backend

        setCounter1Value(response.data.counter1Value || 0);
        setCounter1Label(response.data.counter1Label || 'Permanents');
        setCounter2Value(response.data.counter2Value || 0);
        setCounter2Label(response.data.counter2Label || 'Articles impactés');
        setCounter3Value(response.data.counter3Value || 0);
        setCounter3Label(response.data.counter3Label || 'Articles publiés');

        setToast({ message: 'Contenu de la présentation chargé avec succès !', type: 'success' }); // Success toast
      } else {
        setErrorModal({
          title: 'Erreur de chargement',
          briefDescription: response.message || 'Échec du chargement du contenu de la présentation.',
        });
        setPresentationData(null);
        setCurrentContentBlocks([]);
      }
    } catch (err: any) {
      console.error("Échec de la récupération du contenu de la présentation :", err);
      setErrorModal({
        title: 'Erreur de récupération',
        briefDescription: `Erreur lors de la récupération du contenu de la présentation.`,
        detailedError: err.message || 'Veuillez réessayer plus tard.',
      });
      setPresentationData(null);
      setCurrentContentBlocks([]);
    } finally {
      setLoading(false);
      setTimeout(() => setToast(null), 3000); // Clear loading toast after 3 seconds
    }
  }, [token]);

  // Authentication check and initial fetch
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || userRole !== 'admin') {
        router.push('/connexion');
        return;
      }
      if (isAuthenticated && token && userRole === 'admin') {
        fetchPresentationContent();
      }
    }
  }, [authLoading, isAuthenticated, userRole, token, router, fetchPresentationContent]);


  // Handlers for flexible content blocks (text and image)
  const addTextBlock = useCallback(() => {
    const newBlock: TextContentBlock = {
      id: uuidv4(),
      type: 'text',
      value: '<p>Nouveau paragraphe de texte...</p>',
    };
    setCurrentContentBlocks(prev => [...prev, newBlock]);
    setToast({ message: 'Bloc de texte ajouté.', type: 'info' });
  }, []);

  const addImageBlock = useCallback(() => {
    const newBlock: ImageContentBlock = {
      id: uuidv4(),
      type: 'image',
      url: '',
      altText: '',
      caption: '',
      file: undefined,
      originalWidth: undefined,
      originalHeight: undefined,
      width: undefined,
      height: undefined,
      sizeSliderValue: 50,
    };
    setCurrentContentBlocks(prev => [...prev, newBlock]);
    setToast({ message: 'Bloc d\'image ajouté. N\'oubliez pas de télécharger une image.', type: 'info' });
  }, []);

  const updateTextBlock = useCallback((id: string, newValue: string) => {
    setCurrentContentBlocks(prev =>
      prev.map(block =>
        block.id === id && block.type === 'text' ? { ...block, value: newValue } : block
      )
    );
  }, []);

  const updateImageBlock = useCallback((id: string, updates: Partial<ImageContentBlock>) => {
    setCurrentContentBlocks(prev =>
      prev.map(block => {
        if (block.id === id && block.type === 'image') {
          const imageBlockToUpdate = block as ImageContentBlock;
          let updatedBlock = { ...imageBlockToUpdate, ...updates };

          // Only calculate dimensions if original dimensions are known and slider value exists
          if (updatedBlock.originalWidth && updatedBlock.originalHeight && updatedBlock.sizeSliderValue !== undefined) {
            const scaleFactor = updatedBlock.sizeSliderValue / 100;
            const targetWidth = MAX_IMAGE_DISPLAY_WIDTH * scaleFactor;
            const finalWidth = Math.min(targetWidth, updatedBlock.originalWidth);
            const aspectRatio = updatedBlock.originalWidth / updatedBlock.originalHeight;
            const finalHeight = Math.round(finalWidth / aspectRatio);

            updatedBlock.width = finalWidth;
            updatedBlock.height = finalHeight;
          } else if (!updatedBlock.url && !updatedBlock.file) {
            // If image is completely removed (no url and no file), reset all related size data
            updatedBlock.width = undefined;
            updatedBlock.height = undefined;
            updatedBlock.originalWidth = undefined;
            updatedBlock.originalHeight = undefined;
            updatedBlock.sizeSliderValue = 50;
          }
          // If a URL exists but original dimensions are missing (e.g. initial upload before dimension fetch finishes, or legacy data)
          // we don't calculate width/height yet, but we ensure sizeSliderValue is present for new uploads.
          return updatedBlock;
        }
        return block;
      })
    );
  }, []);

  const handleImageFileChange = useCallback(async (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const imageUrl = URL.createObjectURL(file);

      try {
        const { width: originalWidth, height: originalHeight } = await getImageDimensions(file);
        const defaultSliderValue = 50;
        updateImageBlock(id, {
          url: imageUrl,
          file,
          originalWidth,
          originalHeight,
          sizeSliderValue: defaultSliderValue,
        });
        setToast({ message: 'Image chargée pour le bloc.', type: 'info' });
        setErrorModal(null);
      } catch (err: any) {
        console.error("Error getting image dimensions:", err);
        setErrorModal({
          title: 'Erreur de chargement d\'image',
          briefDescription: 'Impossible de charger les dimensions de l\'image.',
          detailedError: err.message || 'Veuillez essayer une autre image.',
        });
        // If dimensions fail, clear image data to prevent broken state
        updateImageBlock(id, { url: '', file: undefined, originalWidth: undefined, originalHeight: undefined, width: undefined, height: undefined, sizeSliderValue: 50 });
      }
    } else {
      // If file input is cleared, clear image data
      updateImageBlock(id, { url: '', file: undefined, originalWidth: undefined, originalHeight: undefined, width: undefined, height: undefined, sizeSliderValue: 50 });
      setToast({ message: 'Image du bloc supprimée.', type: 'info' });
    }
  }, [updateImageBlock, getImageDimensions]);

  const handleImageSizeSliderChange = useCallback((id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const newSliderValue = parseInt(e.target.value) || 0;
    updateImageBlock(id, { sizeSliderValue: newSliderValue });
  }, [updateImageBlock]);


  // Handler for director image file change
  const handleDirectorImageFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setDirectorImage(file);
      setDirectorImagePreviewUrl(URL.createObjectURL(file));
      setToast({ message: 'Image du directeur chargée.', type: 'info' });
      setErrorModal(null);
    } else {
      setDirectorImage(null);
      setDirectorImagePreviewUrl(null);
      setToast({ message: 'Image du directeur supprimée.', type: 'info' });
    }
  }, []);

  const removeBlock = useCallback((id: string) => {
    setCurrentContentBlocks(prev => prev.filter(block => block.id !== id));
    setToast({ message: 'Bloc de contenu supprimé.', type: 'info' });
  }, []);

  const moveBlock = useCallback((id: string, direction: 'up' | 'down') => {
    setCurrentContentBlocks(prev => {
      const index = prev.findIndex(block => block.id === id);
      if (index === -1) return prev;

      const newBlocks = [...prev];
      const [blockToMove] = newBlocks.splice(index, 1);

      if (direction === 'up' && index > 0) {
        newBlocks.splice(index - 1, 0, blockToMove);
      } else if (direction === 'down' && index < newBlocks.length) {
        newBlocks.splice(index + 1, 0, blockToMove);
      }
      setToast({ message: 'Bloc de contenu déplacé.', type: 'info' });
      return newBlocks;
    });
  }, []);

  // Main Save Handler
  const handleSavePresentation = async () => {
    if (!token) {
      setErrorModal({
        title: 'Erreur d\'authentification',
        briefDescription: 'Jeton d\'authentification introuvable. Veuillez vous connecter.',
      });
      return;
    }
    setIsSubmitting(true);
    setErrorModal(null); // Clear previous error modal
    setToast({ message: 'Enregistrement du contenu de la présentation...', type: 'info' }); // Toast for saving

    try {
      // Validate content blocks
      for (const block of currentContentBlocks) {
        if (block.type === 'image') {
          const imageBlockValidation = block as ImageContentBlock;

          const isExistingBlock = presentationData?.contentBlocks?.some(b => b.id === imageBlockValidation.id);

          if (!isExistingBlock && (!imageBlockValidation.url || imageBlockValidation.url.startsWith('blob:')) && !imageBlockValidation.file) {
            setErrorModal({
              title: 'Erreur de validation',
              briefDescription: 'Un nouveau bloc image a été ajouté sans sélection d\'image.',
              detailedError: 'Veuillez télécharger une image pour le nouveau bloc d\'image ou le supprimer.',
            });
            setIsSubmitting(false);
            setToast(null); // Clear info toast
            return;
          }

          // Ensure original dimensions are present if it's an existing image (not a new upload, and has a URL)
          if (!imageBlockValidation.file && imageBlockValidation.url && !imageBlockValidation.url.startsWith('blob:') && !(imageBlockValidation.originalWidth && imageBlockValidation.originalHeight)) {
            setErrorModal({
              title: 'Données d\'image manquantes',
              briefDescription: 'Les dimensions originales de l\'image sont manquantes pour un bloc existant.',
              detailedError: 'Veuillez re-télécharger l\'image concernée pour que les dimensions soient enregistrées correctement.',
            });
            setIsSubmitting(false);
            setToast(null); // Clear info toast
            return;
          }
        }
      }

      // Create a FormData object to send all data, including files
      const formData = new FormData();
      formData.append('sectionName', 'main_presentation');

      // Append new dynamic fields
      formData.append('directorName', directorName || '');
      formData.append('directorPosition', directorPosition || '');
      if (directorImage) {
        formData.append('directorImage', directorImage);
      } else if (directorImagePreviewUrl === null) {
        formData.append('directorImage', 'null');
      } else if (directorImagePreviewUrl && !directorImagePreviewUrl.startsWith('blob:')) {
         formData.append('directorImage', directorImagePreviewUrl);
      }

      formData.append('counter1Value', counter1Value.toString());
      formData.append('counter1Label', counter1Label);
      formData.append('counter2Value', counter2Value.toString());
      formData.append('counter2Label', counter2Label);
      formData.append('counter3Value', counter3Value.toString());
      formData.append('counter3Label', counter3Label);

      // Append flexible content blocks and their files

      // Use image_0, image_1, ... for image blocks only
      const serializableBlocks = currentContentBlocks.map((block, index) => {
        if (block.type === 'image') {
          const imageBlockToSerialize = block as ImageContentBlock;
          if (imageBlockToSerialize.file) {
            formData.append(`image_${index}`, imageBlockToSerialize.file); // Use array index for field name
          }
          return {
            id: imageBlockToSerialize.id,
            type: imageBlockToSerialize.type,
            url: imageBlockToSerialize.file ? null : (imageBlockToSerialize.url && !imageBlockToSerialize.url.startsWith('blob:') ? imageBlockToSerialize.url : null),
            altText: imageBlockToSerialize.altText || '',
            caption: imageBlockToSerialize.caption || '',
            originalWidth: imageBlockToSerialize.originalWidth || null,
            originalHeight: imageBlockToSerialize.originalHeight || null,
            width: imageBlockToSerialize.width || null,
            height: imageBlockToSerialize.height || null,
            sizeSliderValue: imageBlockToSerialize.sizeSliderValue || 0,
          };
        }
        return block;
      });

      formData.append('contentBlocks', JSON.stringify(serializableBlocks));

      await updateMainPresentationContent(formData, token);
      setToast({ message: 'Contenu de la présentation mis à jour avec succès !', type: 'success' }); // Success toast
      await fetchPresentationContent(); // Re-fetch to ensure all URLs are from backend
    } catch (err: any) {
      console.error("Échec de l'enregistrement du contenu de la présentation :", err);
      setErrorModal({
        title: 'Erreur d\'enregistrement',
        briefDescription: 'Échec de l\'enregistrement du contenu de la présentation.',
        detailedError: err.message || 'Une erreur inattendue est survenue. Veuillez réessayer.',
      });
      setToast(null); // Clear info toast on error
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setToast(null), 3000); // Clear success/info toast after 3 seconds
    }
  };

  if (authLoading || loading) {
    return (
      <div className={`flex justify-center items-center h-screen bg-gray-50 ${inter.className}`}>
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <span className="ml-3 text-lg text-gray-700">Chargement de la gestion de présentation...</span>
      </div>
    );
  }

  // Moved unauthorized access directly to ErrorModal
  if (!isAuthenticated || userRole !== 'admin') {
    return (
      <ErrorModal
        title="Accès non autorisé"
        briefDescription="Seuls les administrateurs peuvent gérer la présentation."
        detailedError="Veuillez vous connecter avec un compte administrateur pour accéder à cette page."
        onClose={() => router.push('/connexion')} // Redirect to login on close
      />
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8 ${inter.className}`}>
      <header className="mb-10 text-center">
        <div className="flex items-center space-x-4 bg-gradient-to-r from-blue-600 to-purple-700 text-white p-6 rounded-xl shadow-lg mb-8">
            <FileText className="w-10 h-10 flex-shrink-0" />
            <h1 className="text-4xl font-extrabold tracking-tight">Gestion de la présentation</h1>
            {/* Moved this paragraph inside the header div for better grouping visually, if desired */}
            <p className="text-lg text-white">Structurez et éditez le contenu de la page "Présentation" de votre site.</p>
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

      <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100 mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Informations Générales de Présentation</h2>

        {/* Director Information */}
        <div className="space-y-4 mb-8 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h3 className="text-xl font-semibold text-gray-700 flex items-center">
            <User className="h-5 w-5 mr-2 text-blue-500" /> Informations du Directeur
          </h3>
          <label className="block text-sm font-medium text-gray-700">Nom du Directeur</label>
          <input
            type="text"
            value={directorName}
            onChange={(e) => setDirectorName(e.target.value)}
            placeholder="Nom complet du directeur"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
          <label className="block text-sm font-medium text-gray-700 mt-4">Poste du Directeur</label>
          <input
            type="text"
            value={directorPosition}
            onChange={(e) => setDirectorPosition(e.target.value)}
            placeholder="Ex: Directeur du Laboratoire LTIM-LR12ES06"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
          <label className="block text-sm font-medium text-gray-700 mt-4">Image du Directeur</label>
          {directorImagePreviewUrl && (
            <div className="mb-4 flex flex-col items-center">
              <Image
                src={directorImagePreviewUrl}
                alt={directorName || "Directeur Image"}
                width={120}
                height={120}
                className="rounded-full object-cover shadow-md mb-2"
                unoptimized={true}
                onError={(e) => {
                  (e.target as HTMLImageElement).onerror = null;
                  (e.target as HTMLImageElement).src = 'https://placehold.co/120x120/cccccc/333333?text=Image+introuvable';
                }}
              />
              <button
                type="button"
                onClick={() => {
                  setDirectorImage(null);
                  setDirectorImagePreviewUrl(null);
                  if (directorImageInputRef.current) {
                    directorImageInputRef.current.value = '';
                  }
                }}
                className="flex items-center text-red-600 hover:text-red-800 text-sm mt-2"
              >
                <XCircle className="h-4 w-4 mr-1" /> Supprimer l'image
              </button>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleDirectorImageFileChange}
            ref={directorImageInputRef}
            className="mt-1 block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
        </div>

        {/* Counter Section */}
        <div className="space-y-4 mb-8 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h3 className="text-xl font-semibold text-gray-700 flex items-center">
            <Hash className="h-5 w-5 mr-2 text-green-500" /> Gestion des Compteurs
          </h3>
          {/* Counter 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Valeur Compteur 1</label>
              <input
                type="number"
                value={counter1Value}
                onChange={(e) => setCounter1Value(parseInt(e.target.value) || 0)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Libellé Compteur 1</label>
              <input
                type="text"
                value={counter1Label}
                onChange={(e) => setCounter1Label(e.target.value)}
                placeholder="Ex: Permanents"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>
          {/* Counter 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Valeur Compteur 2</label>
              <input
                type="number"
                value={counter2Value}
                onChange={(e) => setCounter2Value(parseInt(e.target.value) || 0)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Libellé Compteur 2</label>
              <input
                type="text"
                value={counter2Label}
                onChange={(e) => setCounter2Label(e.target.value)}
                placeholder="Ex: Articles impactés"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>
          {/* Counter 3 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Valeur Compteur 3</label>
              <input
                type="number"
                value={counter3Value}
                onChange={(e) => setCounter3Value(parseInt(e.target.value) || 0)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Libellé Compteur 3</label>
              <input
                type="text"
                value={counter3Label}
                onChange={(e) => setCounter3Label(e.target.value)}
                placeholder="Ex: Articles publiés"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>
        </div>

        {/* Flexible Content Editor */}
        <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
          <Pencil className="h-6 w-6 mr-2 text-indigo-600" /> Sections de Contenu Personnalisé
        </h2>
        <div className="space-y-8 mb-8">
          {currentContentBlocks.length === 0 && (
            <p className="text-center text-gray-500 py-6">
              Aucune section de contenu personnalisée. Ajoutez une section de texte ou d'image pour commencer.
            </p>
          )}
          {currentContentBlocks.map((block, index) => (
            <div key={block.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50 relative">
              <div className="absolute top-2 right-2 flex space-x-1">
                {/* Move Up Button */}
                <button
                  type="button"
                  onClick={() => moveBlock(block.id, 'up')}
                  disabled={index === 0}
                  className="p-1 rounded-full text-gray-400 hover:bg-blue-100 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Déplacer vers le haut"
                >
                  <ChevronUp className="h-5 w-5" />
                </button>
                {/* Move Down Button */}
                <button
                  type="button"
                  onClick={() => moveBlock(block.id, 'down')}
                  disabled={index === currentContentBlocks.length - 1}
                  className="p-1 rounded-full text-gray-400 hover:bg-blue-100 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Déplacer vers le bas"
                >
                  <ChevronDown className="h-5 w-5" />
                </button>
                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => removeBlock(block.id)}
                  className="p-1 rounded-full text-red-500 hover:bg-red-100 hover:text-red-700"
                  title="Supprimer la section"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>

              {block.type === 'text' ? (
                <div className="mt-8">
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Text className="w-4 h-4 mr-1 text-gray-500" /> Section de Texte
                  </label>
                  <ReactQuill
                    theme="snow"
                    value={(block as TextContentBlock).value}
                    onChange={(newValue) => updateTextBlock(block.id, newValue)}
                    className="mt-1 block w-full rounded-md shadow-sm"
                    modules={{
                      toolbar: [
                        [{ 'header': '1' }, { 'header': '2' }],
                        [{ 'font': [] }],
                        [{ size: [] }],
                        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                        [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
                        ['link'],
                        [{ 'color': [] }, { 'background': [] }],
                        ['clean']
                      ],
                    }}
                    formats={[
                      'header', 'font', 'size',
                      'bold', 'italic', 'underline', 'strike', 'blockquote',
                      'list', 'indent', 'link', 'color', 'background'
                    ]}
                    placeholder="Écrivez votre contenu textuel ici..."
                  />
                </div>
              ) : block.type === 'image' ? (
                // Cast `block` to `ImageContentBlock` once at the beginning of the `image` block's JSX.
                // This makes `imageBlock` safely available within this entire scope.
                (() => {
                  const imageBlock = block as ImageContentBlock;
                  return (
                    <div className="mt-8">
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <ImageIcon className="w-4 h-4 mr-1 text-gray-500" /> Section d'Image
                      </label>
                      {imageBlock.url ? (
                        <div className="mb-4 flex flex-col items-center w-full">
                          <div className="relative border border-gray-300 shadow-sm rounded-md bg-gray-100 flex justify-center items-center overflow-hidden p-0 m-0"
                              style={{
                                  width: imageBlock.width ? `${imageBlock.width}px` : 'auto',
                                  height: imageBlock.height ? `${imageBlock.height}px` : 'auto',
                                  maxWidth: '100%',
                                  maxHeight: '400px',
                              }}>
                              <Image
                                src={imageBlock.url}
                                alt={imageBlock.altText || 'Image de la section'}
                                width={imageBlock.width || 0}
                                height={imageBlock.height || 0}
                                className="object-contain w-full h-full"
                                sizes="100vw"
                                unoptimized={imageBlock.url.startsWith('blob:')}
                                onError={(e) => {
                                    (e.target as HTMLImageElement).onerror = null;
                                    (e.target as HTMLImageElement).src = 'https://placehold.co/800x450/cccccc/333333?text=Image+introuvable';
                                }}
                              />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              updateImageBlock(imageBlock.id, { url: '', file: undefined, originalWidth: undefined, originalHeight: undefined, width: undefined, height: undefined, sizeSliderValue: 50 });
                              if (fileInputRefs.current[imageBlock.id]) {
                                fileInputRefs.current[imageBlock.id].value = '';
                              }
                            }}
                            className="flex items-center text-red-600 hover:text-red-800 text-sm mt-2"
                          >
                            <XCircle className="h-4 w-4 mr-1" /> Supprimer l'image
                          </button>
                        </div>
                      ) : (
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageFileChange(imageBlock.id, e)}
                          ref={el => { if (el) fileInputRefs.current[imageBlock.id] = el; }}
                          className="mt-1 block w-full text-sm text-gray-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-full file:border-0
                            file:text-sm file:font-semibold
                            file:bg-blue-50 file:text-blue-700
                            hover:file:bg-blue-100"
                        />
                      )}
                      {/* Image Size Slider */}
                      {imageBlock.url && imageBlock.originalWidth && imageBlock.originalHeight ? (
                        <div className="mt-4 w-full">
                          <label className="block text-sm font-medium text-gray-700 flex items-center">
                            <LayoutGrid className="w-4 h-4 mr-1 text-gray-500" /> Taille de l'Image: {imageBlock.sizeSliderValue || 0}%
                          </label>
                          <input
                            type="range"
                            min="10"
                            max="100"
                            value={imageBlock.sizeSliderValue || 50}
                            onChange={(e) => handleImageSizeSliderChange(imageBlock.id, e)}
                            className="mt-1 w-full h-2 bg-blue-100 rounded-lg appearance-none cursor-pointer range-lg"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Dimensions (Largeur x Hauteur): {Math.round(imageBlock.width || 0)}px x {Math.round(imageBlock.height || 0)}px
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 mt-2">Chargez une image pour ajuster sa taille.</p>
                      )}
                      <input
                        type="text"
                        placeholder="Texte alternatif (Alt Text)"
                        value={imageBlock.altText || ''}
                        onChange={(e) => updateImageBlock(imageBlock.id, { altText: e.target.value })}
                        className="mt-2 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                      <textarea
                        placeholder="Légende de l'image (optionnel)"
                        value={imageBlock.caption || ''}
                        onChange={(e) => updateImageBlock(imageBlock.id, { caption: e.target.value })}
                        rows={2}
                        className="mt-2 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      ></textarea>
                    </div>
                  );
                })()
              ) : null}
            </div>
            ))
          }
        </div>

        {/* Add Block Buttons */}
        <div className="flex justify-center space-x-4 mb-8 border-t pt-6">
          <button
            type="button"
            onClick={addTextBlock}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <Text className="h-5 w-5 mr-2" /> Ajouter Section Texte
          </button>
          <button
            type="button"
            onClick={addImageBlock}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            <ImageIcon className="h-5 w-5 mr-2" /> Ajouter Section Image
          </button>
        </div>

        {/* Save Button */}
        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={handleSavePresentation}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin h-5 w-5 mr-2" />
            ) : (
              <Save className="h-5 w-5 mr-2" />
            )}
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer la Présentation'}
          </button>
        </div>
      </div>

      {/* Live Preview of Presentation */}
      <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100 mt-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
          <Eye className="inline-block w-6 h-6 mr-2 text-indigo-600" /> Aperçu de la page de Présentation
        </h2>
        <div className="border border-blue-200 rounded-lg p-4 bg-blue-50 min-h-[400px] flex flex-col items-center justify-center">
          {/* We pass the current blocks directly for live preview */}
          {currentContentBlocks.length > 0 || directorName || directorPosition || directorImagePreviewUrl || counter1Value !== null || counter2Value !== null || counter3Value !== null ? (
            <PresentationPageContentPreview
              contentBlocks={currentContentBlocks}
              directorName={directorName}
              directorPosition={directorPosition}
              directorImage={directorImagePreviewUrl}
              counter1Value={counter1Value}
              counter1Label={counter1Label}
              counter2Value={counter2Value}
              counter2Label={counter2Label}
              counter3Value={counter3Value}
              counter3Label={counter3Label}
            />
          ) : (
            <p className="text-gray-500">Ajoutez des blocs de contenu ou remplissez les champs généraux pour voir l'aperçu ici.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PresentationManagement;
