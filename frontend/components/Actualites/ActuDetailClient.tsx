// components/Actualites/ActuDetailClient.tsx
"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Inter, Playfair_Display } from "next/font/google";

// Lucide for sharing icons
import {
  Facebook,
  Twitter,
  Linkedin,
  Mail,
  Calendar as CalendarIcon,
  User as UserIcon,
  Loader2,
} from "lucide-react";

import { getActuById, Actu } from "@/services/actusApi"; // Import Actu type
import { useAuth } from "@/context/AuthContext";
import Toast from "@/components/ui/Toast";
import ErrorModal from "@/components/ui/ErrorModal";

// Initialize fonts
const inter = Inter({ subsets: ["latin"] });
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700"],
});

//const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL?.replace('/api', '') || 'http://localhost:5000';
const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_UPLOADS + "actu_images/" ||
  "http://backend:5000/uploads/actu_images/";

interface ActuDetailClientProps {
  actuId?: string; // Optional: ID of the actu to fetch from backend
  actu?: Actu; // Optional: Full Actu object to display directly (for preview)
}

const ActuDetailClient: React.FC<ActuDetailClientProps> = ({
  actuId,
  actu: initialActu,
}) => {
  const { token } = useAuth();

  // Initialize actualite state either from initialActu prop or null
  const [actualite, setActualite] = useState<Actu | null>(initialActu || null);
  // Set loading based on whether initialActu is provided
  const [loading, setLoading] = useState<boolean>(!initialActu);
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

  useEffect(() => {
    // If an initial Actu object is provided (e.g., for live preview),
    // we don't need to fetch from the backend. Just display it.
    if (initialActu) {
      setActualite(initialActu);
      setLoading(false);
      setError(null); // Clear any previous errors
      return; // Exit early, no fetch needed
    }

    // If no initialActu is provided, proceed with fetching by actuId
    const fetchActu = async () => {
      console.log(
        "[ActuDetailClient] useEffect triggered. Actu ID from props:",
        actuId
      );

      if (!actuId) {
        console.error(
          "[ActuDetailClient] Actu ID is missing from props and no initial Actu provided."
        );
        setErrorModal({
          title: "Actualité introuvable",
          briefDescription:
            "L'ID de l'actualité est manquant ou l'objet actualité n'a pas été fourni.",
          detailedError: "Veuillez vérifier le lien ou les données fournies.",
        });
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      setToast(null);

      try {
        const response = await getActuById(actuId, token);
        console.log(
          "[ActuDetailClient] API Response for getActuById:",
          response
        );

        if (response.success && response.data) {
          setActualite(response.data);
          setToast({
            message: "Actualité chargée avec succès.",
            type: "success",
          });
        } else {
          console.error(
            "[ActuDetailClient] Failed to fetch actu:",
            response.message
          );
          setErrorModal({
            title: "Actualité non trouvée",
            briefDescription:
              response.message ||
              "Impossible de trouver l'actualité spécifiée.",
            detailedError: response.message,
          });
          setActualite(null);
        }
      } catch (err: any) {
        console.error(
          "[ActuDetailClient] Error fetching actu details (catch block):",
          err
        );
        setErrorModal({
          title: "Erreur réseau ou serveur",
          briefDescription:
            "Impossible de communiquer avec le serveur ou erreur inattendue.",
          detailedError:
            err.message ||
            "Veuillez vérifier votre connexion internet et réessayer.",
        });
        setActualite(null);
      } finally {
        setLoading(false);
      }
    };

    fetchActu();
  }, [actuId, token, initialActu]); // Add initialActu to dependencies

  const articleUrl = actualite
    ? typeof window !== "undefined"
      ? `${window.location.origin}/actualites/${actualite.id}`
      : `https://yourdomain.com/actualites/${actualite.id}`
    : "";
  const articleTitle = actualite?.title || "";
  const articleSummary = actualite?.shortDescription || "";

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
      <div
        className={`min-h-screen flex flex-col items-center justify-center bg-white ${inter.className}`}
      >
        <Loader2 className="animate-spin h-12 w-12 text-blue-600" />
        <span className="mt-4 text-xl text-gray-700">
          Chargement de l'actualité...
        </span>
      </div>
    );
  }

  if (error || !actualite) {
    return (
      <div
        className={`min-h-screen flex flex-col items-center justify-center bg-white ${inter.className}`}
      >
        {errorModal && (
          <ErrorModal
            title={errorModal.title}
            briefDescription={errorModal.briefDescription}
            detailedError={errorModal.detailedError}
            onClose={() => setErrorModal(null)}
          />
        )}
        <p className="text-red-600 text-lg">
          Impossible de charger l'actualité.
        </p>
        <Link href="/actualites" className="mt-4 text-blue-600 hover:underline">
          Retour aux actualités
        </Link>
      </div>
    );
  }

  const imageUrl = BACKEND_BASE_URL + actualite.image;

  return (
    <div
      className={`bg-white text-gray-800 py-8 sm:py-12 md:py-16 pt-4 px-4 sm:px-6 lg:px-8 min-h-screen ${inter.className}`}
    >
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {errorModal && errorModal.title && (
        <ErrorModal
          title={errorModal.title}
          briefDescription={errorModal.briefDescription}
          detailedError={errorModal.detailedError}
          onClose={() => setErrorModal(null)}
        />
      )}

      <div className="max-w-4xl mx-auto">
        <Link
          href="/actualites"
          className="text-blue-600 flex items-center group relative no-underline mb-6 block w-fit"
        >
          <svg
            className="w-4 h-4 mr-2 transition-transform duration-300 group-hover:-translate-x-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 19l-7-7 7-7m-7 7h18"
            ></path>
          </svg>
          <span className="relative block transition-transform duration-300 group-hover:-translate-x-1">
            Retour aux actualités
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
          </span>
        </Link>

        <header className="text-center mb-10">
          <p
            className={`text-sm font-medium text-blue-600 uppercase tracking-wider mb-2 ${inter.className}`}
          >
            {actualite.category}
          </p>
          <h1
            className={`text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight text-gray-900 mb-4 ${playfair.className}`}
          >
            {actualite.title}
          </h1>
          <p className={`text-sm text-gray-500 ${inter.className}`}>
            <span className="flex items-center justify-center sm:inline-flex mb-2 sm:mb-0 sm:mr-4">
              <CalendarIcon className="w-4 h-4 mr-2 text-gray-400" />{" "}
              {formatDate(actualite.date)}
            </span>
            {actualite.creatorName && (
              <span className="flex items-center justify-center sm:inline-flex">
                <UserIcon className="w-4 h-4 mr-2 text-gray-400" /> Créé par{" "}
                <span className="font-medium ml-1 text-gray-700">
                  {actualite.creatorName}
                </span>
              </span>
            )}
            {!actualite.creatorName && actualite.userId && (
              <span className="flex items-center justify-center sm:inline-flex">
                <UserIcon className="w-4 h-4 mr-2 text-gray-400" /> Créé par{" "}
                <span className="font-medium ml-1 text-gray-700">
                  {actualite.userId.substring(0, 8)}...
                </span>
              </span>
            )}
          </p>
        </header>

        <section className="mb-8">
          <p
            className={`text-xl italic text-gray-700 text-center mb-6 ${inter.className}`}
          >
            {actualite.shortDescription}
          </p>
        </section>

        <section
          className={`prose prose-lg max-w-none text-gray-700 leading-relaxed mb-12 ${inter.className}`}
        >
          {actualite.image && (
            <figure className="my-8">
              <Image
                src={
                  imageUrl ||
                  "https://placehold.co/600x400/E2E8F0/A0AEC0?text=Image+Non+Trouvée"
                }
                alt={actualite.title}
                width={500}
                height={500}
                layout="responsive"
                className="rounded-lg shadow-lg h-auto w-auto place-self-center "
                unoptimized={true}
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://placehold.co/800x500/E2E8F0/A0AEC0?text=Image+Non+Trouvée";
                }}
              />
              <figcaption className="mt-2 text-sm text-center text-gray-500">
                Image illustrative pour: {actualite.title}.
              </figcaption>
            </figure>
          )}

          {actualite.fullContent && (
            <div
              className="quill-content-display"
              dangerouslySetInnerHTML={{ __html: actualite.fullContent }}
            />
          )}
          {!actualite.fullContent && (
            <p className="text-gray-500 italic">
              Aucun contenu détaillé pour cet article.
            </p>
          )}
        </section>

        <div className="flex flex-col sm:flex-row justify-between items-center mt-8 pt-6 border-t border-gray-200">
          <div className="flex items-center mt-4 sm:mt-0">
            <span className="text-gray-600 mr-3">Partager</span>
            <div className="flex space-x-2">
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                  articleUrl
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 border border-gray-300 rounded-md text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(
                  articleUrl
                )}&text=${encodeURIComponent(articleTitle)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 border border-gray-300 rounded-md text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(
                  articleUrl
                )}&title=${encodeURIComponent(
                  articleTitle
                )}&summary=${encodeURIComponent(articleSummary)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 border border-gray-300 rounded-md text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href={`mailto:?subject=${encodeURIComponent(
                  articleTitle
                )}&body=${encodeURIComponent(
                  articleSummary + "\n\nRead more at: " + articleUrl
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 border border-gray-300 rounded-md text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActuDetailClient;
