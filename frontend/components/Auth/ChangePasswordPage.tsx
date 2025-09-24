// frontend/components/Auth/ChangePasswordPage.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { changePassword, initialPasswordSetup } from '@/services/authApi'; // Import both API calls
import Toast from '@/components/ui/Toast';
import ErrorModal from '@/components/ui/ErrorModal';
import { Loader2, Eye, EyeOff, Lock, CheckCircle, Info as InfoIcon, X as CloseIcon } from 'lucide-react';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

// This component is now designed to be rendered as a modal overlay by its parent.
// It no longer handles its own routing or redirects.
const ChangePasswordPage: React.FC = () => {
  const { isAuthenticated, mustChangePassword, token, login, isLoading: authLoading, user } = useAuth();
  const router = useRouter();

  // oldPassword is only needed if mustChangePassword is FALSE
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for the "confirm keep password" modal
  const [showConfirmKeepPasswordModal, setShowConfirmKeepPasswordModal] = useState(false);
  const [isKeepingPassword, setIsKeepingPassword] = useState(false); // State for when "keep password" is being processed

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
  const [errorModal, setErrorModal] = useState<{ title: string; briefDescription: string; detailedError?: string } | null>(null);

  // Determine if this is the first login experience (mustChangePassword is true)
  const isFirstLoginPasswordSetup = mustChangePassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setToast(null);
    setErrorModal(null); // Clear error modal before new submission

    if (!token) {
      router.push('/connexion'); // Redirect if no token
      return;
    }

    // Validation for new password
    if (!newPassword || !confirmNewPassword) {
      setToast({
        message: 'Veuillez remplir tous les champs du nouveau mot de passe.',
        type: 'warning',
      });
      return;
    }

    if (newPassword.length < 6) {
      setToast({
        message: 'Le nouveau mot de passe doit contenir au moins 6 caractères.',
        type: 'warning',
      });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setToast({
        message: 'Le nouveau mot de passe et sa confirmation ne correspondent pas.',
        type: 'warning',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let response;
      if (isFirstLoginPasswordSetup) {
        // If it's the first login, use initialPasswordSetup (no old password required)
        response = await initialPasswordSetup(newPassword, 'change', token);
      } else {
        // If it's a regular password change, old password is required
        if (!oldPassword) {
          setToast({
            message: 'Veuillez entrer votre ancien mot de passe.',
            type: 'warning',
          });
          setIsSubmitting(false);
          return;
        }
        if (newPassword === oldPassword) {
          setToast({
            message: 'Le nouveau mot de passe est identique à l\'ancien. Pour une meilleure sécurité, utilisez un mot de passe différent.',
            type: 'info',
          });
          // Allow submission, but with a warning.
        }
        response = await changePassword(oldPassword, newPassword, token);
      }

      if (response.success && response.token && response.user) {
        setToast({ message: 'Mot de passe mis à jour avec succès !', type: 'success' });
        login(response.token, response.user); // Update AuthContext
      } else {
        setErrorModal({
          title: 'Échec de la mise à jour du mot de passe',
          briefDescription: response.message || 'Une erreur est survenue lors de la mise à jour du mot de passe.',
          detailedError: response.message,
        });
      }
    } catch (err: any) {
      console.error('Error changing password:', err);
      setErrorModal({
        title: 'Erreur de connexion',
        briefDescription: 'Impossible de communiquer avec le serveur.',
        detailedError: err.message || 'Veuillez vérifier votre connexion internet et réessayer.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to handle keeping the same password
  const handleConfirmKeepSamePassword = async () => {
    setIsKeepingPassword(true);
    setToast(null);
    setErrorModal(null);

    if (!token) {
      router.push('/connexion');
      return;
    }

    try {
      // For "keep" action, newPassword is null and action is 'keep'
      const response = await initialPasswordSetup(null, 'keep', token);

      if (response.success && response.token && response.user) {
        setToast({ message: 'Mot de passe temporaire confirmé.', type: 'success' });
        login(response.token, response.user); // Update AuthContext
        setShowConfirmKeepPasswordModal(false);
      } else {
        setErrorModal({
          title: 'Échec de la confirmation du mot de passe',
          briefDescription: response.message || 'Une erreur est survenue lors de la confirmation du mot de passe.',
          detailedError: response.message,
        });
        setShowConfirmKeepPasswordModal(false);
      }
    } catch (err: any) {
      console.error('Error keeping same password:', err);
      setErrorModal({
        title: 'Erreur de connexion',
        briefDescription: 'Impossible de communiquer avec le serveur.',
        detailedError: err.message || 'Veuillez vérifier votre connexion internet et réessayer.',
      });
      setShowConfirmKeepPasswordModal(false);
    } finally {
      setIsKeepingPassword(false);
    }
  };

  const togglePasswordVisibility = (field: 'old' | 'new' | 'confirm') => {
    if (field === 'old') setShowOldPassword(prev => !prev);
    else if (field === 'new') setShowNewPassword(prev => !prev);
    else if (field === 'confirm') setShowConfirmNewPassword(prev => !prev);
  };

  if (authLoading) {
    return (
      <div className={`fixed inset-0 flex justify-center items-center bg-gray-50 bg-opacity-75 z-50 ${inter.className}`}>
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <span className="ml-3 text-lg text-gray-700">Chargement...</span>
      </div>
    );
  }

  if (!isAuthenticated || !mustChangePassword) {
    return null; // Component should only render when authentication is required and password change is pending
  }

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm p-4 ${inter.className}`}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {errorModal && <ErrorModal title={errorModal.title} briefDescription={errorModal.briefDescription} detailedError={errorModal.detailedError} onClose={() => setErrorModal(null)} />}

      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-xl md:max-w-2xl lg:max-w-3xl border border-gray-100 relative">
        {/* Close button (X) - Only available if it's the first login experience */}
        {isFirstLoginPasswordSetup && (
          <button
            onClick={() => setShowConfirmKeepPasswordModal(true)}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
            title="Fermer (garder le mot de passe temporaire)"
          >
            <CloseIcon className="h-6 w-6" />
          </button>
        )}

        <div className="text-center mb-8">
          <Lock className="mx-auto h-16 w-16 text-blue-600 mb-4" />
          <h1 className="text-3xl font-bold text-gray-900">
            {isFirstLoginPasswordSetup ? 'Définir votre mot de passe initial' : 'Changer votre mot de passe'}
          </h1>
          <p className="text-gray-600 mt-2">
            {isFirstLoginPasswordSetup
              ? 'Veuillez définir un nouveau mot de passe pour votre compte ou confirmer le mot de passe temporaire.'
              : 'Veuillez définir un nouveau mot de passe pour votre compte.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Old Password - conditionally rendered */}
          {!isFirstLoginPasswordSetup && (
            <div>
              <label htmlFor="oldPassword" className="block text-sm font-medium text-gray-700">
                Ancien mot de passe
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  type={showOldPassword ? 'text' : 'password'}
                  id="oldPassword"
                  className="block w-full pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required={!isFirstLoginPasswordSetup} // Required only for non-first-time change
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('old')}
                    className="p-1 rounded-full text-gray-500 hover:bg-gray-100 hover:text-blue-600 focus:outline-none"
                    title={showOldPassword ? 'Masquer' : 'Afficher'}
                  >
                    {showOldPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* New Password */}
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
              Nouveau mot de passe
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <input
                type={showNewPassword ? 'text' : 'password'}
                id="newPassword"
                className="block w-full pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('new')}
                  className="p-1 rounded-full text-gray-500 hover:bg-gray-100 hover:text-blue-600 focus:outline-none"
                  title={showNewPassword ? 'Masquer' : 'Afficher'}
                >
                  {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Confirm New Password */}
          <div>
            <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700">
              Confirmer le nouveau mot de passe
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <input
                type={showConfirmNewPassword ? 'text' : 'password'}
                id="confirmNewPassword"
                className="block w-full pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirm')}
                  className="p-1 rounded-full text-gray-500 hover:bg-gray-100 hover:hover:text-blue-600 focus:outline-none"
                  title={showConfirmNewPassword ? 'Masquer' : 'Afficher'}
                >
                  {showConfirmNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin h-5 w-5 mr-2" />
            ) : (
              <CheckCircle className="h-5 w-5 mr-2" />
            )}
            {isSubmitting ? 'Mise à jour...' : 'Définir le mot de passe'}
          </button>
        </form>

        {/* "Garder le même mot de passe" button - only for first-time login setup */}
        {isFirstLoginPasswordSetup && (
          <button
            type="button"
            onClick={() => setShowConfirmKeepPasswordModal(true)}
            className="w-full flex justify-center py-2 px-4 mt-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={isSubmitting || isKeepingPassword}
          >
            {isKeepingPassword ? (
              <Loader2 className="animate-spin h-5 w-5 mr-2" />
            ) : (
              <InfoIcon className="h-5 w-5 mr-2" />
            )}
            {isKeepingPassword ? 'Confirmation...' : 'Garder le même mot de passe temporaire'}
          </button>
        )}
      </div>

      {/* Confirmation Modal for "Keep Same Password" */}
      {showConfirmKeepPasswordModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-[60] p-4">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-sm text-center relative">
            <InfoIcon className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirmer le mot de passe temporaire</h3>
            <p className="text-sm text-gray-600 mb-4">
              En cliquant sur "Oui, garder", votre mot de passe temporaire sera confirmé comme votre mot de passe permanent. Vous n'aurez plus besoin de le changer à chaque connexion.
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setShowConfirmKeepPasswordModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                disabled={isKeepingPassword}
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmKeepSamePassword}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isKeepingPassword}
              >
                {isKeepingPassword ? (
                  <Loader2 className="animate-spin h-4 w-4 mr-2 inline-block" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2 inline-block" />
                )}
                {isKeepingPassword ? 'Confirmation...' : 'Oui, garder'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChangePasswordPage;
