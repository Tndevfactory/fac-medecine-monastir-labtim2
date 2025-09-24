// components/ui/ErrorModal.tsx
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ErrorModalProps {
  title?: string;
  briefDescription: string;
  detailedError?: string; // Full error message/stack trace
  onClose: () => void;
}

const ErrorModal: React.FC<ErrorModalProps> = ({
  title = "Une erreur est survenue",
  briefDescription,
  detailedError,
  onClose,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const router = useRouter();
  const isSessionExpired = briefDescription.includes('Session expired');

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
        onClick={onClose} // Close when clicking outside modal content
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="bg-white rounded-xl shadow-2xl p-6 md:p-8 w-full max-w-md mx-auto relative"
          onClick={(e) => e.stopPropagation()} // Prevent click from closing modal
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 rounded-full p-1"
            aria-label="Fermer"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Icon and Title */}
          <div className="flex items-center mb-4 space-x-3 text-red-600">
            <Info className="h-8 w-8 flex-shrink-0" />
            <h2 className="text-2xl font-semibold text-gray-800">{isSessionExpired ? 'Session Expirée' : title}</h2>
          </div>

          {/* Brief Description */}
          <p className="text-gray-700 mb-4 text-base leading-relaxed">
            {isSessionExpired ? 'Votre session a expiré. Veuillez vous reconnecter pour continuer.' : briefDescription}
          </p>

          {/* Toggle for Details */}
          {detailedError && (
            <div className="border-t border-gray-200 pt-4 mt-4">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="w-full flex justify-between items-center text-blue-600 hover:text-blue-800 font-medium py-2 px-0 focus:outline-none"
              >
                <span>{showDetails ? "Masquer les détails" : "Afficher les détails"}</span>
                {showDetails ? (
                  <ChevronUp className="h-5 w-5 ml-2" />
                ) : (
                  <ChevronDown className="h-5 w-5 ml-2" />
                )}
              </button>
              <AnimatePresence>
                {showDetails && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="bg-gray-50 p-4 mt-2 rounded-md border border-gray-200 text-sm text-gray-600 overflow-auto max-h-48">
                      <pre className="whitespace-pre-wrap font-mono text-xs">
                        {detailedError}
                      </pre>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Action button */}
          <div className="mt-6 flex justify-end">
            {isSessionExpired ? (
              <button
                onClick={() => router.push('/connexion')}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
              >
                Se reconnecter
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
              >
                Compris
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ErrorModal;