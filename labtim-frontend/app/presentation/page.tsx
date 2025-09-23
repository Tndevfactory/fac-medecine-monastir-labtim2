// frontend/app/presentation/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { Inter } from 'next/font/google';

// CORRECT IMPORT PATH FOR THE NEW COMPONENT
import PresentationPageContentPreview from '@/components/presentation/PresentationPageContentPreview';
import { getMainPresentationContent } from '@/services/presentationApi'; // API service
import { PresentationContent } from '@/types/index'; // Import the type
import { Loader2 } from 'lucide-react'; // For loading indicator

// Initialize fonts
const inter = Inter({ subsets: ['latin'] });

const PresentationPage: React.FC = () => {
  const [presentationData, setPresentationData] = useState<PresentationContent | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getMainPresentationContent();
        if (response.success && response.data) {
          setPresentationData(response.data);
        } else {
          setError(response.message || 'Échec de la récupération du contenu de la présentation.');
        }
      } catch (err: any) {
        console.error('Erreur lors de la récupération du contenu de la présentation :', err);
        setError(`Erreur lors du chargement de la présentation : ${err.message || 'Veuillez réessayer plus tard.'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, []);

  if (loading) {
    return (
      <div className={`flex justify-center items-center h-screen bg-gray-50 ${inter.className}`}>
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <span className="ml-3 text-lg text-gray-700">Chargement de la page de présentation...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-[calc(100vh-80px)] bg-red-100 text-red-700 p-8 text-center ${inter.className}`}>
        <p className="text-lg mb-4">Erreur: {error}</p>
        <p className="text-md">Impossible de charger le contenu de la présentation. Veuillez vérifier votre connexion ou réessayer plus tard.</p>
      </div>
    );
  }

  // Pass all relevant data to the preview component
  return (
    <PresentationPageContentPreview 
      contentBlocks={presentationData?.contentBlocks || []}
      directorName={presentationData?.directorName || null}
      directorPosition={presentationData?.directorPosition || null}
      directorImage={presentationData?.directorImage || null}
      counter1Value={presentationData?.counter1Value || 0}
      counter1Label={presentationData?.counter1Label || 'Permanents'}
      counter2Value={presentationData?.counter2Value || 0}
      counter2Label={presentationData?.counter2Label || 'Articles impactés'}
      counter3Value={presentationData?.counter3Value || 0}
      counter3Label={presentationData?.counter3Label || 'Articles publiés'}
    />
  );
};

export default PresentationPage;
