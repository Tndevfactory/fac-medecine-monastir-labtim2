// frontend/components/dashboard/HeroManagement.tsx
'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

// Lucide Icons
import {
  Image as ImageIcon, Edit3, Loader2, Info, Save, Type, AlignLeft, MousePointerClick,XCircle
} from 'lucide-react';

// Fonts
import { Inter } from 'next/font/google';

// API Services
import { getHeroSection, saveHeroSection } from '@/services/heroApi';
import { Hero } from '@/types/index';

// Components
import Toast from '@/components/ui/Toast';
import ErrorModal from '@/components/ui/ErrorModal';
import HeroSectionPreview from '@/components/hero/HeroSectionPreview'; // Import the preview component

const inter = Inter({ subsets: ['latin'] });

const HeroManagement: React.FC = () => {
  const { userRole, token, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [heroData, setHeroData] = useState<Hero | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);

  // Form states for editing
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [buttonContent, setButtonContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null); // For live preview of new file or existing URL
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Fetch Hero Section Data ---
  const fetchHeroData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setToast(null);
    try {
      const response = await getHeroSection();
      if (response.success && response.data) {
        setHeroData(response.data);
        // Initialize form fields with fetched data
        setTitle(response.data.title || '');
        setDescription(response.data.description || '');
        setButtonContent(response.data.buttonContent || '');
        setImagePreviewUrl(response.data.imageUrl); // Set preview to current image
        setImageFile(null); // No new file selected initially
        setToast({ message: 'Données de la section Hero chargées.', type: 'success' });
      } else {
        // If no data, it means it's the very first time, so form will be empty
        setHeroData(null);
        setTitle('');
        setDescription('');
        setButtonContent('');
        setImagePreviewUrl(null);
        setImageFile(null);
        setToast({ message: response.message || 'Aucune section Hero existante. Prêt à créer.', type: 'info' });
      }
    } catch (err: any) {
      console.error('Error fetching hero data:', err);
      setError(err.message || 'Impossible de charger les données de la section Hero.');
      setToast({ message: `Erreur: ${err.message || 'Impossible de charger la section Hero.'}`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || userRole !== 'admin') {
        router.push('/connexion'); // Redirect if not authenticated or not admin
        return;
      }
      fetchHeroData();
    }
  }, [authLoading, isAuthenticated, userRole, router, fetchHeroData]);

  // --- Handle Image File Change ---
  const handleImageFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (file) {
      setImageFile(file);
      setImagePreviewUrl(URL.createObjectURL(file)); // Create URL for live preview
      setError(null); // Clear any image-related errors
    } else {
      setImageFile(null);
      // If no new file, revert preview to existing image URL if any
      setImagePreviewUrl(heroData?.imageUrl || null);
    }
  }, [heroData]);

  // --- Handle Remove Image (for existing image) ---
  const handleRemoveImage = useCallback(() => {
    setImageFile(null); // Clear any newly selected file
    setImagePreviewUrl(null); // Clear preview
    // We will send 'imageUrl: null' to backend to remove existing image
  }, []);

  // --- Handle Save Hero Section ---
  const handleSaveHero = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setToast({ message: 'Authentification requise pour sauvegarder.', type: 'error' });
      return;
    }
    setIsSubmitting(true);
    setError(null);
    setToast(null);

    // Basic validation
    if (!title && !description && !buttonContent && !imageFile && !imagePreviewUrl) {
      setError('Veuillez remplir au moins un champ ou sélectionner une image.');
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('buttonContent', buttonContent);

    if (imageFile) {
      formData.append('image', imageFile);
    } else if (heroData?.imageUrl && imagePreviewUrl === null) {
      // If there was an existing image but the user clicked remove
      formData.append('imageUrl', 'null'); // Explicitly tell backend to remove
    }
    // If imagePreviewUrl is still heroData.imageUrl and no new file, do nothing for image field, backend keeps existing

    try {
      const response = await saveHeroSection(formData, token);
      if (response.success && response.data) {
        setHeroData(response.data); // Update main state with saved data
        // Re-initialize form fields with potentially updated data (e.g. image URL)
        setTitle(response.data.title || '');
        setDescription(response.data.description || '');
        setButtonContent(response.data.buttonContent || '');
        setImagePreviewUrl(response.data.imageUrl);
        setImageFile(null); // Clear file input after successful upload
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

        setToast({ message: 'Section Hero sauvegardée avec succès !', type: 'success' });
      } else {
        throw new Error(response.message || 'Échec de la sauvegarde de la section Hero.');
      }
    } catch (err: any) {
      console.error('Error saving hero section:', err);
      setError(err.message || 'Une erreur inattendue est survenue lors de la sauvegarde.');
      setToast({ message: `Erreur: ${err.message || 'Échec de la sauvegarde.'}`, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create a live preview object from current form states
  const liveHeroPreview: Hero = {
    id: heroData?.id || 'preview',
    title: title,
    description: description,
    buttonContent: buttonContent,
    imageUrl: imagePreviewUrl,
  };

  if (authLoading || isLoading) {
    return (
      <div className={`flex justify-center items-center h-screen bg-gray-50 ${inter.className}`}>
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <span className="ml-3 text-lg text-gray-700">Chargement de la section Hero...</span>
      </div>
    );
  }

  if (!isAuthenticated || userRole !== 'admin') {
    return (
      <ErrorModal
        briefDescription="Accès non autorisé"
        detailedError="Seuls les administrateurs peuvent gérer la section Hero. Veuillez vous connecter avec un compte administrateur."
        onClose={() => router.push('/connexion')}
      />
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8 ${inter.className}`}>
      <header className="text-center">
        <div className="flex items-center space-x-4 bg-gradient-to-r from-green-600 to-teal-700 text-white p-6 rounded-xl shadow-lg mb-8">
          <ImageIcon className="w-10 h-10 flex-shrink-0" />
          <h1 className="text-4xl font-extrabold tracking-tight">Gestion de la Section Hero</h1>
          <p className="text-xl text-white">Personnalisez la section principale de votre page d'accueil.</p>
        </div>
      </header>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative mb-6" role="alert">
          <strong className="font-bold">Erreur !</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Live Preview Section */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Aperçu en direct</h2>
          <HeroSectionPreview hero={liveHeroPreview} />
          <p className="text-sm text-gray-600 mt-4 text-center">
            (Cet aperçu reflète vos modifications en temps réel avant la sauvegarde.)
          </p>
        </div>

        {/* Edit Form Section */}
        <div className="lg:col-span-2 bg-white p-8 rounded-xl shadow-md border border-gray-100">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Modifier la Section Hero</h2>
          <form onSubmit={handleSaveHero} className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Type className="w-4 h-4 mr-1 text-gray-500" /> Titre
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Titre principal de la section Hero"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <AlignLeft className="w-4 h-4 mr-1 text-gray-500" /> Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Courte description ou slogan"
              ></textarea>
            </div>

            {/* Button Content */}
            <div>
              <label htmlFor="buttonContent" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <MousePointerClick className="w-4 h-4 mr-1 text-gray-500" /> Contenu du Bouton
              </label>
              <input
                type="text"
                id="buttonContent"
                value={buttonContent}
                onChange={(e) => setButtonContent(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Ex: En savoir plus, Nous contacter"
              />
            </div>

            {/* Image Upload */}
            <div>
              <label htmlFor="imageFile" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <ImageIcon className="w-4 h-4 mr-1 text-gray-500" /> Image de Fond
              </label>
              {imagePreviewUrl && (
                <div className="mb-4 flex items-center space-x-4">
                  <Image src={imagePreviewUrl} alt="Aperçu de l'image" width={200} height={112} className="rounded-md object-cover border border-gray-300" unoptimized={true} />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
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
              <p className="mt-2 text-sm text-gray-500">Formats acceptés : JPG, PNG, GIF. Max 5MB.</p>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                ) : (
                  <Save className="h-5 w-5 mr-2" />
                )}
                {isSubmitting ? 'Sauvegarde...' : 'Sauvegarder la Section Hero'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default HeroManagement;
