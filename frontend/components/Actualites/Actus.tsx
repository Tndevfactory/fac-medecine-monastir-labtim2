// components/actus/Actus.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Inter } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { getAllActus, Actu } from "@/services/actusApi";
import { useAuth } from "@/context/AuthContext";
import Toast from "@/components/ui/Toast";
import ErrorModal from "@/components/ui/ErrorModal";

const inter = Inter({ subsets: ["latin"] });

//const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL?.replace('/api', '') || 'http://localhost:5000';
const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_UPLOADS + "actu_images/" ||
  "http://backend:5000/uploads/actu_images/";

const Actus = () => {
  const { token } = useAuth();

  const [actualitesToDisplay, setActualitesToDisplay] = useState<Actu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info" | "warning";
  } | null>(null);
  const [errorModal, setErrorModal] = useState<{
    title: string;
    briefDescription: string;
    detailedError?: string;
  } | null>(null);

  const fetchHomepageActus = useCallback(async () => {
    setLoading(true);
    setError(null);
    setToast(null);

    try {
      // Fetch all actus (filters can be added here if you want to limit what's fetched from backend)
      const response = await getAllActus(token); // Pass token (can be null)
      if (response.success && response.data) {
        // Sort and slice on the client-side for the homepage preview
        const sortedAndSliced = response.data
          .sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          )
          .slice(0, 6); // Display the 6 most recent actualités
        setActualitesToDisplay(sortedAndSliced);
        if (sortedAndSliced.length > 0) {
          // setToast({ message: 'Actualités chargées avec succès.', type: 'success' }); // Optional: only show toast if data is loaded
        }
      } else {
        setErrorModal({
          title: "Échec du chargement des actualités",
          briefDescription:
            response.message ||
            "Une erreur est survenue lors de la récupération des actualités.",
          detailedError: response.message,
        });
        setActualitesToDisplay([]);
      }
    } catch (err: any) {
      console.error("Error fetching homepage actus:", err);
      setErrorModal({
        title: "Erreur réseau ou serveur",
        briefDescription:
          "Impossible de communiquer avec le serveur ou erreur inattendue.",
        detailedError:
          err.message ||
          "Veuillez vérifier votre connexion internet et réessayer.",
      });
      setActualitesToDisplay([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchHomepageActus();
  }, [fetchHomepageActus]);

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const options: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "long",
        day: "numeric",
      };
      return new Date(dateString).toLocaleDateString("fr-FR", options);
    } catch (e) {
      console.error("Invalid date string:", dateString);
      return "Date invalide";
    }
  };

  if (loading) {
    return (
      <section
        className={`py-16 bg-white overflow-hidden min-h-[30vh] flex flex-col justify-center items-center ${inter.className}`}
      >
        <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
        <p className="text-gray-600 text-lg mt-3">
          Chargement des actualités...
        </p>
      </section>
    );
  }

  if (error || actualitesToDisplay.length === 0) {
    return (
      <section
        className={`py-16 bg-white overflow-hidden min-h-[30vh] flex flex-col justify-center items-center ${inter.className}`}
      >
        {errorModal && (
          <ErrorModal
            title={errorModal.title}
            briefDescription={errorModal.briefDescription}
            detailedError={errorModal.detailedError}
            onClose={() => setErrorModal(null)}
          />
        )}
        <p className="text-gray-600 text-lg">
          {error
            ? `Erreur: ${error}`
            : "Aucune actualité disponible pour le moment."}
        </p>
      </section>
    );
  }

  return (
    <section
      className={`py-16 bg-white overflow-hidden min-h-[50vh] flex flex-col justify-center ${inter.className}`}
    >
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {errorModal && (
        <ErrorModal
          title={errorModal.title}
          briefDescription={errorModal.briefDescription}
          detailedError={errorModal.detailedError}
          onClose={() => setErrorModal(null)}
        />
      )}

      <div className="px-4 sm:px-8 md:px-16 lg:px-32 xl:px-48 2xl:px-64">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900">Actualités</h2>
          <Link
            href="/actualites"
            className="text-blue-600 flex items-center transition-all duration-300 group relative"
          >
            <span className="block transition-transform duration-300 group-hover:-translate-x-1 relative pb-0.5">
              Voir toutes les actualités
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
            </span>
            <svg
              className="ml-2 w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 5l7 7-7 7"
              ></path>
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {actualitesToDisplay.map((item) => (
            <Link
              key={item.id}
              href={`/actualites/${item.id}`}
              className="group block bg-white rounded-lg shadow-lg overflow-hidden transform transition-transform duration-300 hover:scale-[1.02] hover:shadow-xl"
            >
              <div className="w-full h-48 relative overflow-hidden">
                <Image
                  className="object-cover object-center"
                  src={
                    item.image
                      ? `${BACKEND_BASE_URL}${item.image}`
                      : "https://placehold.co/600x400/E2E8F0/A0AEC0?text=Image+Non+Trouvée"
                  }
                  alt={item.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  unoptimized={true}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://placehold.co/600x400/E2E8F0/A0AEC0?text=Image+Non+Trouvée";
                  }}
                />
              </div>
              <div className="p-4 flex flex-col justify-between h-[calc(100%-12rem)]">
                <div>
                  <p className="text-xs text-gray-500 mb-1">
                    {formatDate(item.date)} &bull; {item.category}
                  </p>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors duration-200">
                    {item.title}
                  </h3>
                  <p className="text-gray-700 text-sm mb-3 line-clamp-3">
                    {item.shortDescription}
                  </p>
                </div>
                <button className="mt-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition-all duration-300 text-sm self-start">
                  Lire l'actualité
                </button>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Actus;
